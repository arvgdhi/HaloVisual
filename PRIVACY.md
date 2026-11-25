# Halo Privacy Policy

**Last updated:** November 25, 2026

Halo (HaloVisual) is a free, open-source Windows desktop music overlay developed by Aarav Gandhi. It collects **no analytics, no telemetry, no advertising identifiers, no crash reports, and requires no user account**.

## 1. Data that stays 100% on your device

- **System audio loopback:** Used in real time solely to compute frequency levels for the edge glow and beat pulse effects. Audio is never recorded, stored to disk, or transmitted over any network. Halo never accesses your microphone or camera.
- **App settings:** Stored locally in your Windows user profile (`%APPDATA%\halo-overlay\settings.json`).
- **Installed fonts & window state:** Read locally on Windows so you can pick fonts and automatically pause overlays behind fullscreen or maximized apps.

## 2. Data transmitted to third-party services (optional)

Halo only makes network requests for the following optional features:

1. **Synced lyrics ([LRCLIB](https://lrclib.net)):** When a music track plays and **Online lyrics & cover art** is enabled (on by default), Halo sends the track title, artist name, and track duration to the public LRCLIB API to retrieve time-synced lyrics.
2. **Album cover fallback ([Apple iTunes Search API](https://www.apple.com/legal/privacy/)):** Only if Windows does not provide cover art for the track (and **Online lyrics & cover art** is enabled), Halo sends the track title and artist name to Apple's public iTunes Search API to retrieve album artwork.
3. **Update checks ([GitHub](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement)):** In direct GitHub installer builds when **Auto-update from GitHub** is enabled, Halo checks the public `arvgdhi/HaloVisual` GitHub Releases API for newer tagged versions and verifies downloads with `SHA256SUMS.txt`. **Microsoft Store builds do not perform GitHub update checks**; updates are delivered exclusively through the Microsoft Store.

### Running completely offline

You can disable **Online lyrics & cover art** (Settings → General) and, on non-Store builds, **Auto-update from GitHub** (Settings → General) at any time. With these disabled, Halo makes **zero network requests**.

### Non-music & private media protection

Even if you turn off **Only react to music**, Halo never sends media titles from known communication, social, or video-conferencing apps (such as Discord, Microsoft Teams, Zoom, Slack, WhatsApp, or Telegram) to external lyric or artwork APIs.

## 3. Data retention and deletion

Halo does not operate any backend servers and stores no user data remotely. Local preferences are stored only on your PC and can be removed at any time by uninstalling Halo and deleting `%APPDATA%\halo-overlay`.

## 4. Children's privacy

Halo does not knowingly collect personal information from anyone, including children under 13.

## 5. Contact

If you have questions about this privacy policy or Halo's data practices, please open an issue on GitHub at [https://github.com/arvgdhi/HaloVisual/issues](https://github.com/arvgdhi/HaloVisual/issues).
