---
name: youtube-publish
description: Prepare a video for YouTube — title, description, tags, thumbnail, and upload. Use when the owner has a video to post or asks about their YouTube channel.
---

# Publish to YouTube

> **Needs a connection first.** Without a connected YouTube channel, this skill writes everything and the owner uploads it themselves in about two minutes. Run `connect-accounts` when they want the upload handled here too.

## Read first

- `context/voice.md` — titles and descriptions are still the owner talking
- `context/offer.md` — what the description points at
- `context/gtm.md` — the angle this video is part of (skip if empty)

## Steps

1. Ask what the video is and who it's for. If there's a script or transcript, read it — everything below should come out of what's actually in the video.

2. Write **five title options**. Each under 60 characters, each promising something real that the video delivers. A title the video doesn't pay off costs more than a boring one. Mark the one you'd pick and say why in one line.

3. Write the description:
   - First two lines carry it — that's all anyone sees before "more"
   - What the video covers, in three lines
   - Timestamps, if the video is over five minutes
   - One link and one clear next step

4. Suggest a thumbnail: what's in frame, and the three to five words on it. Keep the words readable on a phone. Say plainly if the owner needs to shoot or find the image themselves.

5. Uploading:
   - **Connected** — upload it as **private**, set the title, description, and tags, then send the owner the link to check. They flip it public themselves.
   - **Not connected** — hand them the title, description, tags, and thumbnail note as a copy-paste checklist.

6. Offer `repurpose` next — one video is a week of posts.

## Save it

`content/YYYY-MM-DD-youtube-<topic>.md` — the five titles, the chosen one, the description, tags, and the thumbnail note.

## Done when

- Five titles exist and one is recommended with a reason.
- The description's first two lines work on their own.
- Nothing was made public without the owner looking at it first.
