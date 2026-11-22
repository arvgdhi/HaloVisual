# Halo

Free Windows desktop overlay: a music-reactive edge glow, synced lyrics in 21 styles, and a spinning record with the album cover as its label.

Works with anything in the Windows media controls (Spotify app, Spotify web in Chrome/Edge, Apple Music, Media Player).

## Run

Easiest: download `Halo-Setup-<version>.exe` from GitHub Releases (or build it yourself with `npm run dist`). To run from source:

```
npm install
npm start
```
If `npm start` says "Electron failed to install correctly", run `npm run fix-electron` (downloads Electron directly from GitHub), then `npm start` again. If it still fails, add an antivirus exclusion for the folder.

The settings window opens by itself the first time. After that, click the Halo icon in the system tray (check the ^ overflow), or right-click it for quick toggles. The terminal prints what Halo detects (`[media]`, `[lyrics]`, `[art]`, `[fonts]`).

## Settings window

- **Styles**: a gallery of every lyric style, in four groups.
  - Lyric lines: Classic, Pop, Rise, Typewriter, Wave, Beat pulse, Blur focus, Spotlight.
  - Kinetic type: Ship, Fisheye, Visual, Fisheye Visual.
  - Motion scenes: Code, Code Visual, Branches, Web, Constellation.
  - Native design (keep their own colours): Messages, Payments, Map, Notifications.
- **Lyrics**: any installed font (scrollable picker, each name shown in its own font), bold, size, left / centre / right alignment, colour, lines before and after the current one (Spotify-style, with optional blur), box width and height, timing offset.
- **Glow**: shape, thickness, spread, colour source (album art, rainbow, presets, your own two colours), which screens get it.
- **Record**: show, size, rotation.
- **Layout**: edit on screen, lyric rotation, reset positions, layer (behind or above apps), fade-after-pause seconds (0 = never), only react to music (ignores Shorts, Reels and other browser videos).
- **General**: start with Windows (installed build only), shortcuts, quit.

While the settings window is open and nothing is playing, your screen shows a sample song so you can preview each style. (It sits on the desktop layer, so set Layout > Layer to "Above apps", or use Edit on screen, if windows are covering it.)

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
- System audio is captured through Electron's loopback capture. Nothing is saved and the microphone is never used.
- Install it like normal software: run `Halo-Setup-<version>.exe` (see Releases, or the latest Actions run > Artifacts). It installs for your user (no admin prompt), adds Start menu and desktop shortcuts, and can be removed from Windows Settings > Apps. Turn on General > "Start Halo with Windows" to launch it at sign-in.
- The installer is not code-signed, so Windows SmartScreen may say "unknown publisher": choose More info > Run anyway.
- To build the installer yourself on Windows: `npm install` then `npm run dist` (output in `dist`).
- On GitHub: every push to `main` builds the installer (Actions > latest run > Artifacts). Push a tag like `v6.2.0` and it is also published as a Release download.

## Credits

UI font: Google Sans (SIL Open Font License, see `fonts/OFL-GoogleSans.txt`).
