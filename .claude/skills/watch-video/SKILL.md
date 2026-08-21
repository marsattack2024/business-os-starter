---
name: watch-video
description: Analyze a public YouTube, TikTok, or Instagram video — captions/transcript, selected frames, and computer-use fallback when the extractor fails. Use when the owner shares a public video URL and asks what was said, shown, transcribed, reviewed, or analyzed. Never copy cookies or log into private accounts.
---

# Watch Video

Use this for evidence-based video discussion, not video generation or a summary of
a transcript the user already supplied. The transcript establishes what was said;
frames establish what was shown; a social post caption establishes only what the
creator wrote beside the post. Do not blur those evidence types together.

Works on **YouTube, TikTok, and Instagram** public video URLs (including short
TikTok share links). Private, age-gated, or login-walled posts are out of scope
unless the owner is present and explicitly drives a computer-use session themselves.

## Workflow

1. Accept one public YouTube, TikTok, or Instagram video URL. Work in
   `work/video-research/<platform>-<video-id>/` in the active workspace.
2. Retrieve captions first. This does not download video. Resolve this skill's
   directory, then run:

   ```bash
   python3 .claude/skills/watch-video/scripts/watch_video.py transcript URL \
     --output-dir work/video-research/<platform>-<video-id>
   ```

   Read `metadata.json` and `captions.srt` when present. Preserve timestamps and
   report the caption source exactly:

   - `creator`: a creator-supplied YouTube track.
   - `automatic`: a YouTube automatic-caption track; potentially imperfect.
   - `platform`: a timed TikTok or Instagram track whose creator-versus-automatic
     provenance is not exposed by this path; potentially imperfect.

   `post_text` is the public page description or social post caption. It is not a
   spoken transcript. Instagram may expose public `post_text` while withholding a
   timed caption track; report that boundary instead of substituting one for the
   other. A summary made from captions is caption-based; never imply that you
   watched the visuals.
3. Download frames only when the user asks a visual question, asks to watch/review
   the video, or the answer requires screen context. Select a few timestamps from
   the transcript; do not blanket-sample a whole video.

   ```bash
   python3 .claude/skills/watch-video/scripts/watch_video.py frames URL \
     --timestamps 315,430 --output-dir work/video-research/<platform>-<video-id>
   ```

   The command groups nearby timestamps, limits capture to 12 requested moments,
   and retrieves muted video-only windows at 1080p or lower by default. Inspect
   each resulting frame at original detail before making visual claims. For small
   text, dense controls, or subtle visual effects, explicitly request 1440p or 4K:

   ```bash
   python3 .claude/skills/watch-video/scripts/watch_video.py frames URL \
     --timestamps 430 --max-height 2160 \
     --output-dir work/video-research/<platform>-<video-id>
   ```
4. In notes, cite both the spoken timestamp and the actual decoded-frame timestamp
   from `frames/index.json`. Distinguish direct observation from inference.

## Computer-use fallback

Platform extractors and public pages change. When a public video plays in a browser
but `watch_video.py` fails:

1. Report the exact failure and the installed `yt-dlp` / `ffmpeg` versions when useful.
2. Ask the owner before opening a computer-use / browser session.
3. If they agree, watch the public page with them: pause, read on-screen captions if
   shown, and capture only the frames needed for the question.
4. Never solve extraction failure by copying browser cookies, exporting session
   storage, logging into Instagram/TikTok/YouTube as the owner, or pasting credentials.

Computer use is a supervised fallback for public pages, not a bypass for private
accounts.

## Boundaries and failures

- The script accepts only allowlisted public YouTube, TikTok, and Instagram video
  URL shapes. It rejects credentials, browser cookies, proxy settings, plugins,
  and inherited yt-dlp configuration. Do not bypass these protections silently.
- Needs `python3`, `yt-dlp`, and `ffmpeg` on PATH. Works on Mac and Windows when
  those tools are installed; if a tool is missing, say which one and stop.
- If captions are unavailable, say so. Ask before any audio transcription; it is
  outside this skill's default path.
- If the video is private, age-gated, geo-blocked, or unavailable, report that
  limitation. Do not claim the thumbnail or transcript is equivalent to video
  evidence.
- Do not retain full videos. `work/` artifacts are research scratch files and may
  be removed after the discussion.

Read [the output format](references/output-format.md) when preparing a detailed
video analysis or handing its evidence to another agent.
