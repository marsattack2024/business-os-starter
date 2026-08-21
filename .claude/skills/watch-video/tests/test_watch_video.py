from __future__ import annotations

import json
import sys
import tempfile
import unittest
from argparse import Namespace
from pathlib import Path
from subprocess import CompletedProcess
from unittest.mock import patch

SCRIPTS_DIR = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS_DIR))

import watch_video  # noqa: E402

from watch_video import (  # noqa: E402
    CAPTURE_AFTER_SECONDS,
    CAPTURE_BEFORE_SECONDS,
    DEFAULT_FRAME_MAX_HEIGHT,
    MAX_CAPTURE_TIMESTAMPS,
    build_base_yt_dlp_command,
    build_caption_command,
    build_segment_command,
    caption_provenance_from_output_dir,
    command_frames,
    command_transcript,
    fetch_captions,
    fetch_metadata,
    group_capture_windows,
    normalize_youtube_url,
    parse_timestamp,
    PublicVideo,
    YoutubeVideo,
)


class NormalizeYoutubeUrlTests(unittest.TestCase):
    def test_accepts_canonical_watch_short_and_shorts_urls(self) -> None:
        cases = {
            "https://www.youtube.com/watch?v=VbqaL_eHhKY&list=LL": "VbqaL_eHhKY",
            "https://youtu.be/VbqaL_eHhKY?t=430": "VbqaL_eHhKY",
            "https://youtube.com/shorts/VbqaL_eHhKY": "VbqaL_eHhKY",
            "https://m.youtube.com/watch?v=VbqaL_eHhKY": "VbqaL_eHhKY",
            "https://www.youtube.com/embed/VbqaL_eHhKY": "VbqaL_eHhKY",
        }

        for url, expected_id in cases.items():
            with self.subTest(url=url):
                normalized = normalize_youtube_url(url)
                self.assertEqual(normalized.video_id, expected_id)
                self.assertEqual(
                    normalized.canonical_url,
                    f"https://www.youtube.com/watch?v={expected_id}",
                )

    def test_rejects_hosts_credentials_and_malformed_video_ids(self) -> None:
        hostile_urls = [
            "https://example.com/watch?v=VbqaL_eHhKY",
            "https://youtube.com.evil.example/watch?v=VbqaL_eHhKY",
            "https://user:pass@www.youtube.com/watch?v=VbqaL_eHhKY",
            "file:///tmp/VbqaL_eHhKY.mp4",
            "https://www.youtube.com/watch?v=../../etc",
            "https://www.youtube.com/watch?v=short",
        ]

        for url in hostile_urls:
            with self.subTest(url=url):
                with self.assertRaises(ValueError):
                    normalize_youtube_url(url)


class NormalizePublicVideoUrlTests(unittest.TestCase):
    def test_accepts_public_tiktok_and_instagram_video_urls(self) -> None:
        normalizer = getattr(watch_video, "normalize_public_video_url", None)
        self.assertIsNotNone(normalizer, "public social video URL normalization is missing")

        cases = {
            "https://www.tiktok.com/t/ZP8nt7HW8/": (
                "tiktok",
                "ZP8nt7HW8",
                "https://www.tiktok.com/t/ZP8nt7HW8/",
            ),
            "https://www.tiktok.com/@abefromanx/video/7672778084864625934?_r=1": (
                "tiktok",
                "7672778084864625934",
                "https://www.tiktok.com/@abefromanx/video/7672778084864625934",
            ),
            "https://vm.tiktok.com/ZM123abc_/": (
                "tiktok",
                "ZM123abc_",
                "https://vm.tiktok.com/ZM123abc_/",
            ),
            "https://www.instagram.com/reel/Chunk8-jurw/?igsh=abc": (
                "instagram",
                "Chunk8-jurw",
                "https://www.instagram.com/reel/Chunk8-jurw/",
            ),
            "https://instagram.com/p/aye83DjauH/": (
                "instagram",
                "aye83DjauH",
                "https://www.instagram.com/p/aye83DjauH/",
            ),
        }

        for url, expected in cases.items():
            with self.subTest(url=url):
                normalized = normalizer(url)
                self.assertEqual(
                    (normalized.platform, normalized.video_id, normalized.canonical_url),
                    expected,
                )

    def test_rejects_unsupported_or_credentialed_social_urls(self) -> None:
        normalizer = getattr(watch_video, "normalize_public_video_url", None)
        self.assertIsNotNone(normalizer, "public social video URL normalization is missing")

        hostile_urls = [
            "https://tiktok.com.evil.example/@abefromanx/video/7672778084864625934",
            "https://user:pass@www.instagram.com/reel/Chunk8-jurw/",
            "https://www.instagram.com/accounts/login/",
            "https://www.tiktok.com/@abefromanx",
            "file:///tmp/video.mp4",
        ]

        for url in hostile_urls:
            with self.subTest(url=url):
                with self.assertRaises(ValueError):
                    normalizer(url)


class TimestampTests(unittest.TestCase):
    def test_parses_seconds_and_clock_timestamps(self) -> None:
        self.assertEqual(parse_timestamp("315"), 315.0)
        self.assertEqual(parse_timestamp("05:15"), 315.0)
        self.assertEqual(parse_timestamp("00:05:15.250"), 315.25)

    def test_rejects_negative_and_invalid_timestamps(self) -> None:
        for value in ["-1", "5:80", "narrator", "", "1:2:3:4"]:
            with self.subTest(value=value):
                with self.assertRaises(ValueError):
                    parse_timestamp(value)


class CapturePlanningTests(unittest.TestCase):
    def test_merges_overlapping_capture_windows_and_keeps_requested_times(self) -> None:
        windows = group_capture_windows([315, 316, 430])

        self.assertEqual(len(windows), 2)
        self.assertEqual(windows[0].start, 313.0)
        self.assertEqual(windows[0].end, 319.0)
        self.assertEqual(windows[0].timestamps, (315.0, 316.0))
        self.assertEqual(windows[1].start, 428.0)
        self.assertEqual(windows[1].end, 433.0)

    def test_rejects_more_than_the_capture_cap(self) -> None:
        timestamps = list(range(MAX_CAPTURE_TIMESTAMPS + 1))

        with self.assertRaises(ValueError):
            group_capture_windows(timestamps)

    def test_splits_a_would_be_oversized_capture_group(self) -> None:
        windows = group_capture_windows([2, 7, 12, 17, 18])

        self.assertEqual(len(windows), 2)
        self.assertLessEqual(windows[0].end - windows[0].start, 20.0)
        self.assertEqual(windows[1].timestamps, (18.0,))


class CommandPlanningTests(unittest.TestCase):
    def test_base_yt_dlp_command_is_isolated_and_disables_sensitive_features(self) -> None:
        command = build_base_yt_dlp_command()

        self.assertEqual(
            command[:3], ["yt-dlp", "--ignore-config", "--no-plugin-dirs"]
        )
        self.assertIn("--no-cookies", command)
        self.assertEqual(command[-2:], ["--proxy", ""])
        self.assertNotIn("--cookies-from-browser", command)

    def test_transcript_command_never_requests_video(self) -> None:
        command = build_caption_command(
            "https://www.youtube.com/watch?v=VbqaL_eHhKY", Path("/tmp/captions")
        )

        self.assertIn("--skip-download", command)
        self.assertNotIn("--download-sections", command)
        self.assertNotIn("--force-keyframes-at-cuts", command)

    def test_caption_command_requests_platform_english_language_tags(self) -> None:
        command = build_caption_command(
            "https://www.tiktok.com/t/ZP8nt7HW8/", Path("/tmp/captions")
        )

        languages = command[command.index("--sub-langs") + 1]
        self.assertIn("en.*", languages)
        self.assertIn("eng.*", languages)

    def test_segment_command_defaults_to_1080p_video_only_and_is_bounded(self) -> None:
        command = build_segment_command(
            "https://www.youtube.com/watch?v=VbqaL_eHhKY",
            start=313.0,
            end=318.0,
            output_path=Path("/tmp/segment.mp4"),
        )

        self.assertIn("--download-sections", command)
        self.assertIn("*313-318", command)
        self.assertIn("--force-keyframes-at-cuts", command)
        self.assertEqual(DEFAULT_FRAME_MAX_HEIGHT, 1080)
        self.assertIn("bv*[height<=1080]/bv*[height<=1080]", command)
        self.assertNotIn("+ba", " ".join(command))
        self.assertLessEqual(318.0 - 313.0, CAPTURE_BEFORE_SECONDS + CAPTURE_AFTER_SECONDS)

    def test_segment_command_allows_explicit_high_detail_escalation(self) -> None:
        command = build_segment_command(
            "https://www.youtube.com/watch?v=VbqaL_eHhKY",
            start=313.0,
            end=318.0,
            output_path=Path("/tmp/segment.mp4"),
            max_height=2160,
        )

        self.assertIn("bv*[height<=2160]/bv*[height<=2160]", command)


class CaptionArtifactsTests(unittest.TestCase):
    def test_normalizes_multiple_auto_caption_tracks_to_one_canonical_artifact(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            output_dir = Path(temporary_directory)

            def fake_run(command: list[str]) -> CompletedProcess[str]:
                if "--write-auto-subs" in command:
                    (output_dir / "source.en-orig.srt").write_text("original", encoding="utf-8")
                    (output_dir / "source.en.srt").write_text("translated", encoding="utf-8")
                return CompletedProcess(command, 0, "", "")

            with patch("watch_video.run_command", side_effect=fake_run):
                result = fetch_captions(
                    YoutubeVideo(
                        "VbqaL_eHhKY", "https://www.youtube.com/watch?v=VbqaL_eHhKY"
                    ),
                    output_dir,
                )

            self.assertEqual(result["source"], "automatic")
            self.assertEqual((output_dir / "captions.srt").read_text(encoding="utf-8"), "original")
            self.assertEqual(list(output_dir.glob("source*.srt")), [])

    def test_reads_existing_caption_provenance_for_frame_index(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            output_dir = Path(temporary_directory)
            (output_dir / "metadata.json").write_text(
                json.dumps(
                    {
                        "captions": {
                            "available": True,
                            "language": "English",
                            "path": "captions.srt",
                            "source": "automatic",
                        }
                    }
                ),
                encoding="utf-8",
            )

            self.assertEqual(
                caption_provenance_from_output_dir(output_dir),
                {
                    "available": True,
                    "language": "English",
                    "path": "captions.srt",
                    "source": "automatic",
                },
            )

    def test_labels_tiktok_subtitles_as_platform_captions(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            output_dir = Path(temporary_directory)

            def fake_run(command: list[str]) -> CompletedProcess[str]:
                if "--write-subs" in command:
                    (output_dir / "source.eng-US.srt").write_text(
                        "1\n00:00:00,000 --> 00:00:01,000\nCaption\n",
                        encoding="utf-8",
                    )
                return CompletedProcess(command, 0, "", "")

            with patch("watch_video.run_command", side_effect=fake_run):
                result = fetch_captions(
                    PublicVideo(
                        "tiktok",
                        "7672778084864625934",
                        "https://www.tiktok.com/@abefromanx/video/7672778084864625934",
                    ),
                    output_dir,
                )

            self.assertEqual(result["source"], "platform")
            self.assertEqual(result["path"], "captions.srt")

    def test_reports_instagram_caption_retrieval_failure_without_using_post_text(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            with patch(
                "watch_video.run_command",
                side_effect=RuntimeError("Instagram public media response was empty"),
            ):
                result = fetch_captions(
                    PublicVideo(
                        "instagram",
                        "Chunk8-jurw",
                        "https://www.instagram.com/reel/Chunk8-jurw/",
                    ),
                    Path(temporary_directory),
                )

            self.assertFalse(result["available"])
            self.assertIsNone(result["path"])
            self.assertEqual(
                result["retrieval_error"],
                "No public timed caption track could be retrieved from Instagram without authentication.",
            )


class InstagramPageMetadataTests(unittest.TestCase):
    def test_extracts_public_post_text_without_labeling_it_as_a_transcript(self) -> None:
        parser = getattr(watch_video, "parse_instagram_page_metadata", None)
        self.assertIsNotNone(parser, "Instagram public-page metadata parsing is missing")
        source = """
        <html><head>
          <meta name="twitter:title" content="Instagram (@instagram) • Instagram reel">
          <meta name="description" content="979K likes - instagram on August 26, 2022: &quot;Gingerton&#xA;Music by @amaria_bb&quot;.">
          <link rel="canonical" href="https://www.instagram.com/reel/Chunk8-jurw/">
        </head></html>
        """

        metadata = parser(
            source,
            PublicVideo(
                "instagram",
                "Chunk8-jurw",
                "https://www.instagram.com/reel/Chunk8-jurw/",
            ),
        )

        self.assertEqual(metadata["creator"], "instagram")
        self.assertEqual(metadata["post_text"], 'Gingerton\nMusic by @amaria_bb')
        self.assertEqual(
            metadata["post_text_source"],
            "public HTML meta description; not a spoken transcript",
        )
        self.assertNotIn("captions", metadata)

    def test_fetch_metadata_falls_back_to_public_instagram_html(self) -> None:
        fallback = {
            "video_id": "Chunk8-jurw",
            "platform": "instagram",
            "canonical_url": "https://www.instagram.com/reel/Chunk8-jurw/",
            "post_text": "Gingerton",
            "metadata_source": "public-html-meta-fallback",
        }
        with (
            patch(
                "watch_video.run_command",
                side_effect=RuntimeError("Instagram sent an empty media response"),
            ),
            patch(
                "watch_video.fetch_instagram_page_metadata",
                return_value=fallback,
                create=True,
            ) as fallback_fetch,
        ):
            metadata = fetch_metadata(
                PublicVideo(
                    "instagram",
                    "Chunk8-jurw",
                    "https://www.instagram.com/reel/Chunk8-jurw/",
                )
            )

        self.assertEqual(metadata, fallback)
        fallback_fetch.assert_called_once()


class TranscriptWorkflowTests(unittest.TestCase):
    def test_metadata_keeps_post_text_separate_from_spoken_captions(self) -> None:
        source = {
            "id": "7672778084864625934",
            "title": "Discipline",
            "uploader": "abefromanx",
            "description": "the choice to commit to yourself every day",
            "duration": 84,
            "webpage_url": "https://www.tiktok.com/@abefromanx/video/7672778084864625934",
        }
        with patch(
            "watch_video.run_command",
            return_value=CompletedProcess([], 0, json.dumps(source), ""),
        ):
            metadata = fetch_metadata(
                PublicVideo(
                    "tiktok",
                    "ZP8nt7HW8",
                    "https://www.tiktok.com/t/ZP8nt7HW8/",
                )
            )

        self.assertEqual(metadata["platform"], "tiktok")
        self.assertEqual(metadata["video_id"], "7672778084864625934")
        self.assertEqual(metadata["creator"], "abefromanx")
        self.assertEqual(
            metadata["post_text"], "the choice to commit to yourself every day"
        )
        self.assertNotIn("transcript", metadata)

    def test_transcript_command_accepts_a_public_tiktok_url(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            output_dir = Path(temporary_directory) / "research"

            def fake_metadata(_video: PublicVideo) -> dict[str, object]:
                return {
                    "video_id": "7672778084864625934",
                    "platform": "tiktok",
                    "canonical_url": "https://www.tiktok.com/@abefromanx/video/7672778084864625934",
                }

            with (
                patch("watch_video.require_tools"),
                patch("watch_video.fetch_metadata", side_effect=fake_metadata),
                patch(
                    "watch_video.fetch_captions",
                    return_value={
                        "available": False,
                        "source": None,
                        "language": None,
                        "path": None,
                    },
                ) as caption_fetch,
                patch("builtins.print"),
            ):
                command_transcript(
                    Namespace(
                        url="https://www.tiktok.com/t/ZP8nt7HW8/",
                        output_dir=str(output_dir),
                    )
                )

            metadata = json.loads(
                (output_dir / "metadata.json").read_text(encoding="utf-8")
            )
            self.assertEqual(metadata["platform"], "tiktok")
            caption_video = caption_fetch.call_args.args[0]
            self.assertEqual(caption_video.video_id, "7672778084864625934")
            self.assertEqual(
                caption_video.canonical_url,
                "https://www.tiktok.com/@abefromanx/video/7672778084864625934",
            )

    def test_frames_index_uses_resolved_social_video_identity(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            output_dir = Path(temporary_directory) / "research"

            def fake_capture_frames(*_args: object) -> list[dict[str, object]]:
                (output_dir / "frames").mkdir(parents=True, exist_ok=True)
                return []

            resolved_metadata = {
                "video_id": "7672778084864625934",
                "platform": "tiktok",
                "canonical_url": "https://www.tiktok.com/@abefromanx/video/7672778084864625934",
                "duration_seconds": 84,
            }
            with (
                patch("watch_video.require_tools"),
                patch("watch_video.fetch_metadata", return_value=resolved_metadata),
                patch(
                    "watch_video.capture_frames", side_effect=fake_capture_frames
                ) as frame_capture,
                patch("builtins.print"),
            ):
                command_frames(
                    Namespace(
                        url="https://www.tiktok.com/t/ZP8nt7HW8/",
                        output_dir=str(output_dir),
                        timestamps="5",
                        timestamps_file=None,
                        max_height=1080,
                    )
                )

            index = json.loads(
                (output_dir / "frames" / "index.json").read_text(encoding="utf-8")
            )
            self.assertEqual(index["platform"], "tiktok")
            self.assertEqual(index["video_id"], "7672778084864625934")
            self.assertEqual(
                index["canonical_url"],
                "https://www.tiktok.com/@abefromanx/video/7672778084864625934",
            )
            frame_video = frame_capture.call_args.args[0]
            self.assertEqual(frame_video.video_id, "7672778084864625934")
            self.assertEqual(
                frame_video.canonical_url,
                "https://www.tiktok.com/@abefromanx/video/7672778084864625934",
            )


if __name__ == "__main__":
    unittest.main()
