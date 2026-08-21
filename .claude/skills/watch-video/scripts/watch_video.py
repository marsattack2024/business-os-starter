#!/usr/bin/env python3
"""Retrieve public video captions and bounded visual evidence safely."""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
from dataclasses import dataclass
from datetime import UTC, datetime
from html.parser import HTMLParser
from pathlib import Path
from typing import Iterable, Sequence
from urllib.error import HTTPError
from urllib.parse import parse_qs, urlparse
from urllib.request import HTTPRedirectHandler, ProxyHandler, Request, build_opener

CAPTURE_BEFORE_SECONDS = 2.0
CAPTURE_AFTER_SECONDS = 3.0
MAX_CAPTURE_TIMESTAMPS = 12
MAX_CAPTURE_WINDOW_SECONDS = 20.0
DEFAULT_FRAME_MAX_HEIGHT = 1080
SUPPORTED_FRAME_MAX_HEIGHTS = (720, 1080, 1440, 2160)
MAX_PUBLIC_PAGE_BYTES = 4 * 1024 * 1024
VIDEO_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{11}$")
YOUTUBE_HOSTS = {"youtube.com", "www.youtube.com", "m.youtube.com"}
TIKTOK_HOSTS = {
    "m.tiktok.com",
    "tiktok.com",
    "vm.tiktok.com",
    "vt.tiktok.com",
    "www.tiktok.com",
}
INSTAGRAM_HOSTS = {"instagram.com", "www.instagram.com"}


@dataclass(frozen=True)
class YoutubeVideo:
    video_id: str
    canonical_url: str


@dataclass(frozen=True)
class PublicVideo:
    platform: str
    video_id: str
    canonical_url: str


@dataclass(frozen=True)
class CaptureWindow:
    start: float
    end: float
    timestamps: tuple[float, ...]


class PageMetadataParser(HTMLParser):
    """Collect a small allowlist of public HTML metadata fields."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.values: dict[str, str] = {}

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = {key.lower(): value for key, value in attrs if value is not None}
        if tag.lower() == "meta":
            key = (attributes.get("name") or attributes.get("property") or "").lower()
            content = attributes.get("content")
            if key in {"description", "og:description", "og:title", "twitter:title"} and content:
                self.values.setdefault(key, content)
        elif tag.lower() == "link" and attributes.get("rel", "").lower() == "canonical":
            if attributes.get("href"):
                self.values.setdefault("canonical", attributes["href"])


class AllowlistedVideoRedirectHandler(HTTPRedirectHandler):
    """Reject redirects away from the requested public-video platform."""

    def __init__(self, platform: str) -> None:
        super().__init__()
        self.platform = platform

    def redirect_request(
        self,
        req: Request,
        fp: object,
        code: int,
        msg: str,
        headers: object,
        newurl: str,
    ) -> Request | None:
        try:
            redirected = normalize_public_video_url(newurl)
        except ValueError as error:
            raise HTTPError(newurl, code, "Redirect left the public-video allowlist", headers, fp) from error
        if redirected.platform != self.platform:
            raise HTTPError(newurl, code, "Redirect changed video platforms", headers, fp)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def normalize_youtube_url(url: str) -> YoutubeVideo:
    """Accept only public, canonical YouTube video URLs and return their ID."""
    parsed = urlparse(url.strip())
    host = parsed.hostname.lower() if parsed.hostname else ""
    if parsed.scheme != "https" or parsed.username or parsed.password:
        raise ValueError("Use a public HTTPS YouTube or youtu.be video URL.")

    video_id: str | None = None
    if host == "youtu.be":
        video_id = parsed.path.strip("/")
    elif host in YOUTUBE_HOSTS:
        if parsed.path == "/watch":
            video_id = parse_qs(parsed.query).get("v", [None])[0]
        else:
            match = re.fullmatch(r"/(?:shorts|embed)/([A-Za-z0-9_-]{11})/?", parsed.path)
            video_id = match.group(1) if match else None

    if not video_id or not VIDEO_ID_PATTERN.fullmatch(video_id):
        raise ValueError("The URL must identify one public YouTube video.")
    return YoutubeVideo(video_id, f"https://www.youtube.com/watch?v={video_id}")


def normalize_public_video_url(url: str) -> PublicVideo:
    """Allowlist one public YouTube, TikTok, or Instagram video URL."""
    parsed = urlparse(url.strip())
    host = parsed.hostname.lower() if parsed.hostname else ""
    if parsed.scheme != "https" or parsed.username or parsed.password:
        raise ValueError("Use a public HTTPS YouTube, TikTok, or Instagram video URL.")

    if host == "youtu.be" or host in YOUTUBE_HOSTS:
        video = normalize_youtube_url(url)
        return PublicVideo("youtube", video.video_id, video.canonical_url)

    if host in TIKTOK_HOSTS:
        canonical_match = re.fullmatch(r"/(@[^/]+)/video/(\d+)/?", parsed.path)
        share_match = re.fullmatch(r"/t/([A-Za-z0-9_-]+)/?", parsed.path)
        compact_share_match = (
            re.fullmatch(r"/([A-Za-z0-9_-]+)/?", parsed.path)
            if host in {"vm.tiktok.com", "vt.tiktok.com"}
            else None
        )
        if canonical_match:
            creator, video_id = canonical_match.groups()
            return PublicVideo(
                "tiktok",
                video_id,
                f"https://www.tiktok.com/{creator}/video/{video_id}",
            )
        if share_match:
            share_id = share_match.group(1)
            return PublicVideo("tiktok", share_id, f"https://www.tiktok.com/t/{share_id}/")
        if compact_share_match:
            share_id = compact_share_match.group(1)
            return PublicVideo("tiktok", share_id, f"https://{host}/{share_id}/")

    if host in INSTAGRAM_HOSTS:
        match = re.fullmatch(
            r"/(?:[^/]+/)?(reel|reels|p|tv)/([A-Za-z0-9_-]+)/?", parsed.path
        )
        if match:
            media_type, video_id = match.groups()
            media_type = "reel" if media_type == "reels" else media_type
            return PublicVideo(
                "instagram",
                video_id,
                f"https://www.instagram.com/{media_type}/{video_id}/",
            )

    raise ValueError("The URL must identify one public YouTube, TikTok, or Instagram video.")


def parse_instagram_page_metadata(source: str, video: PublicVideo) -> dict[str, object]:
    """Parse post text from public page metadata without treating it as speech."""
    parser = PageMetadataParser()
    parser.feed(source)
    page_description = parser.values.get("description") or parser.values.get("og:description")
    title = parser.values.get("twitter:title") or parser.values.get("og:title")

    creator = None
    if title:
        creator_match = re.search(r"\(@([A-Za-z0-9_.]+)\)", title)
        creator = creator_match.group(1) if creator_match else None
    if not creator and page_description:
        creator_match = re.search(r"\s-\s([A-Za-z0-9_.]+)\son\s", page_description)
        creator = creator_match.group(1) if creator_match else None

    post_text = page_description
    if post_text:
        _, separator, candidate = post_text.partition(": ")
        post_text = (candidate if separator else post_text).strip()
        for opening, closing in (('"', '"'), ("“", "”")):
            if post_text.startswith(opening) and post_text.endswith(closing):
                post_text = post_text[1:-1]
                break
            if post_text.startswith(opening) and post_text.endswith(f"{closing}."):
                post_text = post_text[1:-2]
                break

    canonical_url = video.canonical_url
    if parser.values.get("canonical"):
        try:
            canonical_url = normalize_public_video_url(parser.values["canonical"]).canonical_url
        except ValueError:
            pass

    return {
        "video_id": video.video_id,
        "platform": video.platform,
        "canonical_url": canonical_url,
        "title": title,
        "channel": creator,
        "creator": creator,
        "post_text": post_text,
        "post_text_source": "public HTML meta description; not a spoken transcript",
        "duration_seconds": None,
        "metadata_source": "public-html-meta-fallback",
        "retrieved_at": datetime.now(UTC).isoformat(),
    }


def fetch_instagram_page_metadata(video: PublicVideo) -> dict[str, object]:
    """Use a public HTML metadata fallback when Instagram media JSON is unavailable."""
    if video.platform != "instagram":
        raise ValueError("The public HTML metadata fallback is only for Instagram.")
    opener = build_opener(ProxyHandler({}), AllowlistedVideoRedirectHandler("instagram"))
    request = Request(
        video.canonical_url,
        headers={
            "Accept": "text/html,application/xhtml+xml",
            "User-Agent": "Mozilla/5.0 (compatible; public-video-research/1.0)",
        },
    )
    try:
        with opener.open(request, timeout=20) as response:
            source = response.read(MAX_PUBLIC_PAGE_BYTES + 1)
            charset = response.headers.get_content_charset() or "utf-8"
    except OSError as error:
        raise RuntimeError(f"Instagram public page retrieval failed: {error}") from error
    if len(source) > MAX_PUBLIC_PAGE_BYTES:
        raise RuntimeError("Instagram public page exceeded the metadata size cap.")
    return parse_instagram_page_metadata(source.decode(charset, errors="replace"), video)


def parse_timestamp(value: str) -> float:
    """Parse seconds, MM:SS, or HH:MM:SS(.mmm) into non-negative seconds."""
    raw = value.strip()
    if re.fullmatch(r"\d+(?:\.\d+)?", raw):
        return float(raw)

    parts = raw.split(":")
    if len(parts) not in (2, 3):
        raise ValueError(f"Invalid timestamp: {value!r}")
    try:
        numbers = [float(part) for part in parts]
    except ValueError as error:
        raise ValueError(f"Invalid timestamp: {value!r}") from error
    if any(number < 0 for number in numbers) or numbers[-1] >= 60 or numbers[-2] >= 60:
        raise ValueError(f"Invalid timestamp: {value!r}")
    if len(numbers) == 2:
        return numbers[0] * 60 + numbers[1]
    return numbers[0] * 3600 + numbers[1] * 60 + numbers[2]


def group_capture_windows(timestamps: Iterable[float]) -> list[CaptureWindow]:
    """Merge overlapping bounded windows while retaining each requested timestamp."""
    values = sorted(set(float(timestamp) for timestamp in timestamps))
    if not values:
        raise ValueError("Provide at least one timestamp.")
    if len(values) > MAX_CAPTURE_TIMESTAMPS:
        raise ValueError(f"Capture requests are capped at {MAX_CAPTURE_TIMESTAMPS} timestamps.")
    if any(timestamp < 0 for timestamp in values):
        raise ValueError("Timestamps cannot be negative.")

    windows: list[CaptureWindow] = []
    current_times: list[float] = []
    current_start = 0.0
    current_end = 0.0
    for timestamp in values:
        start = max(0.0, timestamp - CAPTURE_BEFORE_SECONDS)
        end = timestamp + CAPTURE_AFTER_SECONDS
        if not current_times:
            current_times = [timestamp]
            current_start, current_end = start, end
            continue
        if start <= current_end and end - current_start <= MAX_CAPTURE_WINDOW_SECONDS:
            current_times.append(timestamp)
            current_end = max(current_end, end)
            continue
        windows.append(CaptureWindow(current_start, current_end, tuple(current_times)))
        current_times = [timestamp]
        current_start, current_end = start, end
    windows.append(CaptureWindow(current_start, current_end, tuple(current_times)))
    return windows


def build_base_yt_dlp_command() -> list[str]:
    """Return an isolated yt-dlp prefix with no inherited config, plugins, or cookies."""
    return [
        "yt-dlp",
        "--ignore-config",
        "--no-plugin-dirs",
        "--no-cookies",
        "--no-cookies-from-browser",
        "--proxy",
        "",
    ]


def build_caption_command(url: str, output_dir: Path, *, automatic: bool = False) -> list[str]:
    command = build_base_yt_dlp_command()
    command.extend(
        [
            "--no-playlist",
            "--skip-download",
            "--write-auto-subs" if automatic else "--write-subs",
            "--sub-langs",
            "en.*,eng.*",
            "--sub-format",
            "srt/best",
            "--convert-subs",
            "srt",
            "-o",
            str(output_dir / "source.%(ext)s"),
            url,
        ]
    )
    return command


def _format_section_seconds(value: float) -> str:
    return f"{value:g}"


def build_segment_command(
    url: str,
    *,
    start: float,
    end: float,
    output_path: Path,
    max_height: int = DEFAULT_FRAME_MAX_HEIGHT,
) -> list[str]:
    if end <= start or end - start > MAX_CAPTURE_WINDOW_SECONDS:
        raise ValueError("Capture windows must be positive and within the configured cap.")
    if max_height not in SUPPORTED_FRAME_MAX_HEIGHTS:
        raise ValueError(f"Frame height must be one of: {', '.join(map(str, SUPPORTED_FRAME_MAX_HEIGHTS))}.")
    command = build_base_yt_dlp_command()
    command.extend(
        [
            "--no-playlist",
            "--download-sections",
            f"*{_format_section_seconds(start)}-{_format_section_seconds(end)}",
            "--force-keyframes-at-cuts",
            "-f",
            f"bv*[height<={max_height}]/bv*[height<={max_height}]",
            "--remux-video",
            "mp4",
            "-o",
            str(output_path),
            url,
        ]
    )
    return command


def safe_environment() -> dict[str, str]:
    """Remove inherited proxy and plugin settings before yt-dlp is executed."""
    environment = os.environ.copy()
    for key in (
        "ALL_PROXY",
        "HTTP_PROXY",
        "HTTPS_PROXY",
        "NO_PROXY",
        "all_proxy",
        "http_proxy",
        "https_proxy",
        "no_proxy",
        "YTDLP_PLUGIN_DIRS",
    ):
        environment.pop(key, None)
    environment["YTDLP_NO_PLUGINS"] = "1"
    return environment


def run_command(command: Sequence[str]) -> subprocess.CompletedProcess[str]:
    try:
        return subprocess.run(
            list(command),
            check=True,
            text=True,
            capture_output=True,
            env=safe_environment(),
        )
    except FileNotFoundError as error:
        raise RuntimeError(f"Required tool is not installed: {command[0]}") from error
    except subprocess.CalledProcessError as error:
        detail = (error.stderr or error.stdout or "command failed").strip()
        raise RuntimeError(f"{command[0]} failed: {detail}") from error


def require_tools(*tools: str) -> None:
    missing = [tool for tool in tools if not shutil.which(tool)]
    if missing:
        raise RuntimeError(f"Missing required tool(s): {', '.join(missing)}")


def ensure_output_dir(path: Path) -> Path:
    resolved = path.expanduser().resolve()
    if resolved == resolved.parent or ".." in path.parts:
        raise ValueError("Use a concrete workspace output directory without '..'.")
    resolved.mkdir(parents=True, exist_ok=True)
    return resolved


def write_json(path: Path, value: object) -> None:
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def caption_provenance_from_output_dir(output_dir: Path) -> dict[str, object] | None:
    """Reuse caption provenance produced by transcript mode without retrieving it again."""
    metadata_path = output_dir / "metadata.json"
    if not metadata_path.is_file():
        return None
    try:
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None
    captions = metadata.get("captions") if isinstance(metadata, dict) else None
    return captions if isinstance(captions, dict) and captions.get("available") is True else None


def fetch_metadata(video: PublicVideo | YoutubeVideo) -> dict[str, object]:
    platform = getattr(video, "platform", "youtube")
    command = build_base_yt_dlp_command() + [
        "--no-playlist",
        "--skip-download",
        "--dump-single-json",
        video.canonical_url,
    ]
    try:
        source = json.loads(run_command(command).stdout)
    except RuntimeError:
        if platform == "instagram" and isinstance(video, PublicVideo):
            return fetch_instagram_page_metadata(video)
        raise
    canonical_url = video.canonical_url
    source_url = source.get("webpage_url")
    if isinstance(source_url, str):
        try:
            canonical_url = normalize_public_video_url(source_url).canonical_url
        except ValueError:
            pass
    return {
        "video_id": source.get("id") or video.video_id,
        "platform": platform,
        "canonical_url": canonical_url,
        "title": source.get("title"),
        "channel": source.get("channel"),
        "creator": source.get("channel") or source.get("uploader"),
        "post_text": source.get("description"),
        "post_text_source": "platform description; not a spoken transcript",
        "duration_seconds": source.get("duration"),
        "retrieved_at": datetime.now(UTC).isoformat(),
    }


def _find_caption_file(output_dir: Path) -> Path | None:
    candidates = sorted(output_dir.glob("source*.srt"))
    if not candidates:
        return None
    preferred = [path for path in candidates if ".en-orig." in path.name]
    return preferred[0] if preferred else candidates[0]


def fetch_captions(video: PublicVideo | YoutubeVideo, output_dir: Path) -> dict[str, object]:
    platform = getattr(video, "platform", "youtube")
    retrieval_errors: list[str] = []
    for automatic in (False, True):
        try:
            run_command(build_caption_command(video.canonical_url, output_dir, automatic=automatic))
        except RuntimeError as error:
            retrieval_errors.append(str(error))
            if platform != "youtube":
                break
            continue
        source = _find_caption_file(output_dir)
        if source:
            target = output_dir / "captions.srt"
            source.replace(target)
            for candidate in output_dir.glob("source*.srt"):
                candidate.unlink()
            if platform == "youtube":
                caption_source = "automatic" if automatic else "creator"
                provenance_note = None
            else:
                caption_source = "platform"
                provenance_note = (
                    "The platform exposed this timed caption track, but the extraction "
                    "path does not prove whether a creator or an automatic system made it."
                )
            return {
                "available": True,
                "source": caption_source,
                "language": "English",
                "path": target.name,
                "provenance_note": provenance_note,
            }
    retrieval_error = retrieval_errors[-1] if retrieval_errors else None
    if platform == "instagram" and retrieval_errors:
        retrieval_error = (
            "No public timed caption track could be retrieved from Instagram "
            "without authentication."
        )
    return {
        "available": False,
        "source": None,
        "language": None,
        "path": None,
        "retrieval_error": retrieval_error,
    }


def format_timestamp(timestamp: float) -> str:
    milliseconds = round(timestamp * 1000)
    seconds, milliseconds = divmod(milliseconds, 1000)
    hours, seconds = divmod(seconds, 3600)
    minutes, seconds = divmod(seconds, 60)
    suffix = f"{milliseconds:03d}ms" if milliseconds else ""
    return f"{hours:02d}h{minutes:02d}m{seconds:02d}s{suffix}"


def _segment_path(output_dir: Path, index: int) -> Path:
    return output_dir / "video" / f"segment-{index:03d}.mp4"


def decoded_frame_timestamp(segment: Path, relative_timestamp: float) -> float:
    command = [
        "ffmpeg",
        "-hide_banner",
        "-loglevel",
        "info",
        "-i",
        str(segment),
        "-ss",
        f"{relative_timestamp:.6f}",
        "-frames:v",
        "1",
        "-vf",
        "showinfo",
        "-f",
        "null",
        "-",
    ]
    result = run_command(command)
    matches = re.findall(r"pts_time:([0-9.+-]+)", result.stderr)
    if not matches:
        raise RuntimeError("FFmpeg did not report a decoded frame timestamp.")
    return float(matches[-1])


def extract_frame(segment: Path, relative_timestamp: float, output_path: Path) -> float:
    command = [
        "ffmpeg",
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        str(segment),
        "-ss",
        f"{relative_timestamp:.6f}",
        "-frames:v",
        "1",
        "-q:v",
        "2",
        "-y",
        str(output_path),
    ]
    run_command(command)
    return decoded_frame_timestamp(segment, relative_timestamp)


def capture_frames(
    video: YoutubeVideo,
    output_dir: Path,
    timestamps: Sequence[float],
    metadata: dict[str, object],
    max_height: int,
) -> list[dict[str, object]]:
    duration = metadata.get("duration_seconds")
    if isinstance(duration, (int, float)) and any(timestamp > duration for timestamp in timestamps):
        raise ValueError("A requested timestamp is later than the video duration.")
    windows = group_capture_windows(timestamps)
    frames_dir = output_dir / "frames"
    video_dir = output_dir / "video"
    frames_dir.mkdir(exist_ok=True)
    video_dir.mkdir(exist_ok=True)
    entries: list[dict[str, object]] = []

    for index, window in enumerate(windows, start=1):
        segment = _segment_path(output_dir, index)
        run_command(
            build_segment_command(
                video.canonical_url,
                start=window.start,
                end=window.end,
                output_path=segment,
                max_height=max_height,
            )
        )
        if not segment.exists():
            raise RuntimeError("yt-dlp did not create the requested bounded video window.")
        for requested in window.timestamps:
            frame_path = frames_dir / f"{format_timestamp(requested)}.jpg"
            decoded_relative = extract_frame(segment, requested - window.start, frame_path)
            entries.append(
                {
                    "requested_timestamp_seconds": requested,
                    "decoded_timestamp_seconds": window.start + decoded_relative,
                    "path": str(frame_path.relative_to(output_dir)),
                    "capture_window": {
                        "start_seconds": window.start,
                        "end_seconds": window.end,
                        "segment": str(segment.relative_to(output_dir)),
                    },
                    "format": f"{max_height}p or lower video-only capture, JPEG frame",
                }
            )
    return entries


def parse_timestamps_argument(value: str | None, path: str | None) -> list[float]:
    if bool(value) == bool(path):
        raise ValueError("Provide exactly one of --timestamps or --timestamps-file.")
    if value:
        raw_timestamps = value.split(",")
    else:
        raw_timestamps = Path(path or "").read_text(encoding="utf-8").splitlines()
    return [parse_timestamp(raw) for raw in raw_timestamps if raw.strip()]


def resolved_video_identity(
    requested_video: PublicVideo, metadata: dict[str, object]
) -> PublicVideo:
    """Prefer the allowlisted canonical identity returned by platform metadata."""
    canonical_url = metadata.get("canonical_url")
    if not isinstance(canonical_url, str):
        return requested_video
    try:
        resolved = normalize_public_video_url(canonical_url)
    except ValueError:
        return requested_video
    return resolved if resolved.platform == requested_video.platform else requested_video


def command_transcript(args: argparse.Namespace) -> None:
    require_tools("yt-dlp")
    video = normalize_public_video_url(args.url)
    output_dir = ensure_output_dir(Path(args.output_dir))
    metadata = fetch_metadata(video)
    resolved_video = resolved_video_identity(video, metadata)
    metadata["captions"] = fetch_captions(resolved_video, output_dir)
    write_json(output_dir / "metadata.json", metadata)
    print(json.dumps(metadata, indent=2, sort_keys=True))


def command_frames(args: argparse.Namespace) -> None:
    require_tools("yt-dlp", "ffmpeg")
    video = normalize_public_video_url(args.url)
    output_dir = ensure_output_dir(Path(args.output_dir))
    timestamps = parse_timestamps_argument(args.timestamps, args.timestamps_file)
    captions = caption_provenance_from_output_dir(output_dir)
    metadata = fetch_metadata(video)
    resolved_video = resolved_video_identity(video, metadata)
    frames = capture_frames(
        resolved_video, output_dir, timestamps, metadata, args.max_height
    )
    index = {
        "video_id": metadata.get("video_id") or video.video_id,
        "platform": metadata.get("platform") or video.platform,
        "canonical_url": metadata.get("canonical_url") or video.canonical_url,
        "retrieved_at": datetime.now(UTC).isoformat(),
        "frames": frames,
    }
    if captions:
        index["captions"] = captions
    write_json(output_dir / "frames" / "index.json", index)
    print(json.dumps(index, indent=2, sort_keys=True))


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)
    for name, handler in (("transcript", command_transcript), ("frames", command_frames)):
        command = subparsers.add_parser(name)
        command.add_argument("url")
        command.add_argument("--output-dir", required=True)
        if name == "frames":
            timestamps = command.add_mutually_exclusive_group(required=True)
            timestamps.add_argument("--timestamps")
            timestamps.add_argument("--timestamps-file")
            command.add_argument(
                "--max-height",
                type=int,
                choices=SUPPORTED_FRAME_MAX_HEIGHTS,
                default=DEFAULT_FRAME_MAX_HEIGHT,
                help="Maximum video height for visual evidence (default: 1080).",
            )
        command.set_defaults(handler=handler)
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    try:
        args = build_parser().parse_args(argv)
        args.handler(args)
        return 0
    except (RuntimeError, ValueError, OSError) as error:
        print(f"error: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
