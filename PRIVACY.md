# Halo Privacy Notice

Halo is a free, open-source Windows desktop music overlay. It collects **no analytics, no telemetry, no crash reports, and no user accounts**.

## What stays 100% on your device

- **System audio loopback:** Used in real time solely to compute frequency levels for the edge glow and beat pulse effects. Audio is never recorded, saved to disk, or transmitted over the network. Halo never accesses your microphone or camera.
- **Settings:** Stored locally in your Windows user profile (`%APPDATA%\halo-overlay\settings.json`).
- **Installed fonts & window state:** Read locally on Windows so you can pick fonts and pause overlays behind fullscreen or maximized apps.

## What leaves your device (and how to turn it off)

Halo only makes network requests for three optional features:

1. **Synced lyrics (`lrclib.net`):** When a music track plays and **Online lyrics & cover art** is enabled (on by default), Halo sends the track title, artist name, and duration to the public LRCLIB API to fetch time-synced lyrics.
2. **Album cover fallback (`itunes.apple.com`):** Only if Windows does not provide cover art for the track (and **Online lyrics & cover art** is enabled), Halo queries Apple's public iTunes Search API with the track title and artist name to fetch artwork.
3. **Update checks (`api.github.com` / `github.com`):** When **Auto-update from GitHub** is enabled, Halo checks the public `arvgdhi/HaloVisual` GitHub Releases page for newer tagged versions and downloads verified installers (`SHA256SUMS.txt` verified) only from GitHub.

### Running completely offline

You can turn off both **Online lyrics & cover art** (Settings → General) and **Auto-update from GitHub** (Settings → General) at any time. With both disabled, Halo makes **zero network requests**.

## Non-music & private media protection

Even when **Only react to music** is disabled, Halo never sends media titles from known communication, social, or video-conferencing apps (such as Discord, Teams, Zoom, Slack, WhatsApp, or Telegram) to external lyric or artwork APIs.
