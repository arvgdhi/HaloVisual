# Halo

Free Windows desktop overlay: a music-reactive edge glow, synced lyrics in 21 styles, and a spinning record with the album cover as its label.

Works with anything in the Windows media controls (Spotify app, Spotify web in Chrome/Edge, Apple Music, Media Player).
<img width="2878" height="1799" alt="Screenshot 2026-11-24 201501" src="https://github.com/user-attachments/assets/8c3a4c30-7907-438b-9db9-c2fede447ada" />
<img width="2878" height="1799" alt="Screenshot 2026-11-24 183200" src="https://github.com/user-attachments/assets/c8abcb94-5e6a-4979-bb85-d21f687fc7f0" />
<img width="2878" height="1799" alt="Screenshot 2026-11-24 182739" src="https://github.com/user-attachments/assets/e295f6b2-6161-4df9-bd71-521d0eb055c7" />
<img width="2878" height="1799" alt="Screenshot 2026-11-24 202123" src="https://github.com/user-attachments/assets/39cf61e4-4f3b-4310-bce8-01c7655a69bf" />
<img width="2878" height="1799" alt="Screenshot 2026-11-24 201906" src="https://github.com/user-attachments/assets/ac5d1428-b5fa-475b-94d0-ad0aaa7d1d66" />
## Run

Easiest: download `Halo-Setup-<version>.exe` from GitHub Releases (or build it yourself with `npm run dist`). To run from source:

```
npm install
npm start
```
If `npm start` says "Electron failed to install correctly", run `npm run fix-electron` (downloads Electron directly from GitHub), then `npm start` again. If it still fails, add an antivirus exclusion for the folder.

The settings window opens alongside the desktop overlay when you launch Halo, and stays accessible from the Halo icon in the system tray (check the ^ overflow). The terminal prints what Halo detects (`[media]`, `[lyrics]`, `[art]`, `[fonts]`).

## Settings window

- **Styles**: a gallery of every lyric style, in four groups.
  - Lyric lines: Classic, Pop, Rise, Typewriter, Wave, Beat pulse, Blur focus, Spotlight.
  - Kinetic type: Ship, Fisheye, Visual, Fisheye Visual.
  - Motion scenes: Code, Code Visual, Branches, Web, Constellation.
  - Native design (keep their own colours): Messages, Payments, Map, Notifications.
- **Lyrics**: any installed font (scrollable picker, each name shown in its own font), bold, size, left / centre / right alignment, colour, lines before and after the current one (Spotify-style, with optional blur), box width and height, timing offset.
- **Glow**: shape, thickness, spread, colour source (album art, rainbow, presets, your own two colours), which screens get it.
- **Record**: six styles (Classic Vinyl, Picture Disc, Neon Acrylic, Holographic CD, Turntable Deck, Album Sleeve), show, size, rotation.
- **Layout**: edit on screen, lyric rotation, reset positions, layer (behind or above apps), fade-after-pause seconds (0 = never), only react to music (ignores Shorts, Reels and other browser videos).
- **Performance**: quick presets (High quality, Balanced, Low-end / Eco), automatic pausing in fullscreen or behind maximized windows, battery eco/pause mode, frame rate limit, glow resolution scaling, Lite mode (reduced effects), and audio-capture toggle.
- **General**: start with Windows (installed build only), start minimized to tray, SHA-256 verified GitHub updates, online lyrics & cover art privacy toggle, shortcuts, quit.

When you turn on **Edit on screen** (`Ctrl+Alt+L`) while nothing is playing, your screen shows a sample song so you can preview each style and position the overlay. (It sits on the desktop layer, so set Layout > Layer to "Above apps", or use Edit on screen, if windows are covering it.)

## Edit on screen (Ctrl+Alt+L, or the button in the settings window)

- Drag the lyrics or the record anywhere, including onto another screen.
- Drag the squares around the lyric box to resize it (width and height).
- Scroll over either one to change its size, Alt+scroll to rotate.
- Everything else on screen stays clickable while you edit, including the settings window.
- Done, Esc or Ctrl+Alt+L to finish.

Each style has a recommended box size, applied automatically when you pick it until you resize the box yourself. "Fit box to style" on the Lyrics tab brings it back.

## Other behaviour

- Glow, lyrics and record fade out after the pause time (default 10 s) and fade back when music resumes.
- Ctrl+Alt+Q quits Halo from anywhere.

## Notes

- Lyrics come from LRCLIB (line-synced; words inside a line are timed by length). Use Lyrics > Timing if they run early or late.
- Beat pulse reacts to the system audio, so it needs audio capture to be running (it is, by default).
- Cover art comes from Windows, with an iTunes lookup as fallback.
- Icons in Visual, Fisheye Visual and Code Visual are emoji matched to the words in the line.
- **Privacy**: See [PRIVACY.md](PRIVACY.md). System audio is captured locally through Electron's loopback capture — nothing is recorded or sent over the network, and the microphone is never used. You can disable **Online lyrics & cover art** and **Auto-update from GitHub** under Settings > General to run 100% offline.
- **Fullscreen games, anti-cheat & DRM**: Halo automatically pauses behind fullscreen apps by default. If a strict game anti-cheat, banking app, or proctored exam flags desktop audio loopback capture, toggle **Audio-reactive effects** off in Settings > Performance (or quit Halo with `Ctrl+Alt+Q`).
- Install it like normal software: run `Halo-Setup-<version>.exe` from GitHub Releases (with matching `SHA256SUMS.txt`). It installs for your user (no admin prompt), adds Start menu and desktop shortcuts, and can be removed from Windows Settings > Apps. Turn on General > "Start Halo with Windows" to launch it at sign-in.
- **Updates**: Installed copies check tagged GitHub Releases (`v*`), verify the downloaded installer against `SHA256SUMS.txt`, and prompt you to click **Install & restart** when ready.
- The installer is not code-signed yet, so Windows SmartScreen may say "unknown publisher": verify the hash against `SHA256SUMS.txt`, then choose More info > Run anyway.
- To build the installer yourself on Windows: `npm ci` then `npm run dist` (output in `dist`).
- On GitHub: every push to `main` builds a CI artifact (Actions > latest run > Artifacts). Push a semver tag like `v6.2.1` to publish a public GitHub Release with `Halo-Setup-<version>.exe` and `SHA256SUMS.txt`.

## License & Credits

- Licensed under the [MIT License](LICENSE) — provided "as is", without warranty of any kind.
- UI font: Google Sans (SIL Open Font License 1.1, see [fonts/OFL-GoogleSans.txt](fonts/OFL-GoogleSans.txt)).
- Halo (HaloVisual) is an independent open-source project and is not affiliated with, endorsed by, or sponsored by Microsoft, Spotify, Apple, or Google.
