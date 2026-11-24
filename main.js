const {
  app, BrowserWindow, Tray, Menu, nativeImage, screen, session, desktopCapturer, ipcMain, globalShortcut, powerMonitor,
} = require('electron');
const path = require('path');
const fs = require('fs');
const readline = require('readline');
const { spawn } = require('child_process');
const mediaFilter = require('./media-filter');
app.setAppUserModelId('com.halo.overlay');

if (!app.requestSingleInstanceLock()) app.quit();

let quitting = false;

// ---------- catalogue ----------
const FONTS_FALLBACK = [
  'Segoe UI', 'Segoe UI Variable Display', 'Arial', 'Verdana', 'Tahoma', 'Trebuchet MS', 'Georgia',
  'Times New Roman', 'Cambria', 'Constantia', 'Calibri', 'Candara', 'Corbel', 'Consolas', 'Courier New',
  'Bahnschrift', 'Impact', 'Comic Sans MS', 'Lucida Handwriting', 'Brush Script MT', 'Ink Free', 'Segoe Script',
];
const SHAPES = [
  ['classic', 'Classic border'], ['rounded', 'Rounded neon'], ['liquid', 'Liquid'],
  ['bars', 'Spectrum bars'], ['aurora', 'Aurora'], ['corners', 'Corner glow'],
];
// rec = the box size (width, height) each style looks best in
const STYLE_DEFS = [
  { id: 'classic', group: 'Lyric lines', name: 'Classic', desc: 'Each word fills with colour as it is sung.', rec: [760, 170] },
  { id: 'pop', group: 'Lyric lines', name: 'Pop', desc: 'Words bounce in one by one.', rec: [760, 170] },
  { id: 'rise', group: 'Lyric lines', name: 'Rise', desc: 'Words float up and straighten.', rec: [760, 170] },
  { id: 'typewriter', group: 'Lyric lines', name: 'Typewriter', desc: 'The line is typed out letter by letter.', rec: [760, 170] },
  { id: 'wave', group: 'Lyric lines', name: 'Wave', desc: 'Letters ripple like a wave.', rec: [760, 170] },
  { id: 'beat', group: 'Lyric lines', name: 'Beat pulse', desc: 'The whole line pulses with the music.', rec: [760, 170] },
  { id: 'blur', group: 'Lyric lines', name: 'Blur focus', desc: 'Upcoming words start blurred and sharpen.', rec: [760, 170] },
  { id: 'spotlight', group: 'Lyric lines', name: 'Spotlight', desc: 'One big word at a time, the line small underneath.', rec: [760, 240] },

  { id: 'ship', group: 'Kinetic type', name: 'Ship', desc: 'Words land one by one on a wall that drifts in 3D.', rec: [760, 300] },
  { id: 'fisheye', group: 'Kinetic type', name: 'Fisheye', desc: 'Lyrics warped through a bulging spherical fisheye lens.', rec: [680, 380] },
  { id: 'visual', group: 'Kinetic type', name: 'Visual', desc: 'A centred stack, with an icon for every word that has one.', rec: [640, 300] },
  { id: 'fisheyeVisual', group: 'Kinetic type', name: 'Fisheye Visual', desc: 'Fisheye lens, with icons beside the words that have one.', rec: [680, 380] },

  { id: 'code', group: 'Motion scenes', name: 'Code', desc: 'The lyric typed out as code, under a blinking red cursor.', rec: [720, 250] },
  { id: 'codeVisual', group: 'Motion scenes', name: 'Code Visual', desc: 'Code, with icons beside the words that have one.', rec: [720, 250] },
  { id: 'branches', group: 'Motion scenes', name: 'Branches', desc: 'A line draws itself, and each word lights a node on it.', rec: [820, 240] },
  { id: 'web', group: 'Motion scenes', name: 'Web', desc: 'Each line spun into a spider\u2019s web, a strand for every word.', rec: [580, 440] },
  { id: 'constellation', group: 'Motion scenes', name: 'Constellation', desc: 'Each line traced as a constellation, star by star.', rec: [820, 290] },

  { id: 'chat', group: 'Native design', name: 'Messages', desc: 'The song as a message thread, a bubble for every line.', rec: [520, 330] },
  { id: 'money', group: 'Native design', name: 'Payments', desc: 'The song as a run of payments, one for every line.', rec: [520, 310] },
  { id: 'map', group: 'Native design', name: 'Map', desc: 'A walk across the city, with a pin for every line.', rec: [680, 380] },
  { id: 'notify', group: 'Native design', name: 'Notifications', desc: 'Lines arrive as lock-screen notifications, stacks and widgets.', rec: [520, 350] },
];
const styleDef = (id) => STYLE_DEFS.find((s) => s.id === id);
const DISC_STYLES = [
  { id: 'vinyl', name: 'Classic Vinyl', desc: 'Dark grooved LP with the album cover as its centre label and a tonearm.' },
  { id: 'picture', name: 'Picture Disc', desc: 'Full-bleed album art pressed across the entire spinning vinyl surface.' },
  { id: 'neon', name: 'Neon Acrylic', desc: 'Translucent glowing vinyl tinted with your active accent colours.' },
  { id: 'cd', name: 'Holographic CD', desc: 'Compact disc with iridescent prism reflections and a clear inner hub.' },
  { id: 'turntable', name: 'Turntable Deck', desc: 'Minimalist dark plinth deck with a glowing strobe dot and tonearm.' },
  { id: 'sleeve', name: 'Album Sleeve', desc: 'Rounded album cover sleeve with the spinning vinyl record sliding out.' },
];
const LYRIC_COLORS = [
  ['White', 'white'], ['Match album art', 'album'], ['Pink', '#ff6bb5'], ['Cyan', '#4fe3ff'],
  ['Yellow', '#ffe14f'], ['Green', '#62f08c'], ['Orange', '#ff9a3c'], ['Violet', '#a98bff'],
];
const PALETTES = [
  ['Violet / Pink', '#7c5cff', '#ff4fa3'],
  ['Cyan / Blue', '#22d3ee', '#3b82f6'],
  ['Sunset', '#ff7a18', '#ff3d6e'],
  ['Mint / Teal', '#34d399', '#06b6d4'],
  ['Gold / Red', '#ffd166', '#ef476f'],
  ['White', '#ffffff', '#9aa4ff'],
];
const HEX = /^#[0-9a-f]{6}$/i;

// ---------- settings ----------
const DEFAULTS = {
  glow: true,
  lyrics: true,
  idleGlow: true,
  thickness: 6,
  glowSize: 1,
  useAlbum: true,
  rainbow: false,
  primary: '#7c5cff',
  secondary: '#ff4fa3',
  shape: 'classic',
  offsetMs: 0,
  font: 'Segoe UI',
  bold: true,
  fontSize: 34,
  lyricStyle: 'classic',
  lyricAlign: 'center',    // left | center | right
  lyricColor: 'white',
  nativeTheme: 'dark',     // dark | light, for Messages, Payments and Map
  lyricRot: 0,
  lyricW: 760,             // lyric box size (DIP)
  lyricH: 170,
  boxAuto: true,           // true until the box is resized by hand; then styles stop resizing it
  pastLines: 0,            // Spotify-style: lines shown before the current one
  futureLines: 1,          // ...and after it
  lineBlur: false,         // blur lines that are further from the current one
  layer: 'desktop',        // 'desktop' = behind all apps, 'top' = above all apps
  fadeSec: 10,             // fade everything after this many seconds paused (0 = never)
  musicOnly: true,         // ignore browser videos like Reels/Shorts unless they look like music
  glowDisplays: null,      // null = every screen, otherwise an array of display ids
  showDisc: true,
  discStyle: 'vinyl',
  discSize: 200,
  discRot: 0,
  lyricG: null,            // global desktop position (DIP) of the lyric box centre, null = default
  discG: null,             // same for the record
  startWithWindows: false,
  autoUpdate: true,
  installedAssetId: null,
  settingsShown: false,
  pauseFullscreen: true,
  pauseMaximized: true,
  batteryMode: 'eco',      // 'off' | 'eco' | 'pause'
  fpsCap: 60,              // 0 (native) | 20 | 30 | 60
  glowQuality: 'medium',   // 'low' | 'medium' | 'high'
  reducedEffects: false,
  audioReactive: true,
  startMinimized: false,
};
let settings = { ...DEFAULTS };
let editMode = false;
let manualPaused = false;
let systemLocked = false;
let onBattery = false;
let occludedFs = new Set();
let occludedMax = new Set();
let mediaIdleSent = null;
let lastRuntimeSig = '';
let lastAudioOwner = null;
let lastZConfig = '';
const settingsFile = () => path.join(app.getPath('userData'), 'settings.json');

function loadSettings() {
  try {
    const saved = JSON.parse(fs.readFileSync(settingsFile(), 'utf8'));
    settings = { ...DEFAULTS, ...saved };
    if (typeof saved.futureLines !== 'number' && saved.showNext === false) settings.futureLines = 0; // from older versions
    if (typeof saved.bold !== 'boolean' && typeof saved.fontWeight === 'number') settings.bold = saved.fontWeight >= 600;
    if (!styleDef(settings.lyricStyle)) settings.lyricStyle = 'classic';
    if (!DISC_STYLES.some((s) => s.id === settings.discStyle)) settings.discStyle = 'vinyl';
    if (!['off', 'eco', 'pause'].includes(settings.batteryMode)) settings.batteryMode = 'eco';
    if (!['low', 'medium', 'high'].includes(settings.glowQuality)) settings.glowQuality = 'medium';
    if (![0, 20, 30, 60].includes(settings.fpsCap)) settings.fpsCap = 60;
  } catch { /* first run */ }
}
let saveTimer = null;
function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { fs.writeFileSync(settingsFile(), JSON.stringify(settings, null, 2)); } catch { /* ignore */ }
  }, 300);
}

function scriptPath(name) {
  return app.isPackaged ? path.join(process.resourcesPath, name) : path.join(__dirname, name);
}

// ---------- displays and global positions ----------
function virtualBounds() {
  const all = screen.getAllDisplays();
  const x1 = Math.min(...all.map((d) => d.bounds.x));
  const y1 = Math.min(...all.map((d) => d.bounds.y));
  const x2 = Math.max(...all.map((d) => d.bounds.x + d.bounds.width));
  const y2 = Math.max(...all.map((d) => d.bounds.y + d.bounds.height));
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}
function insideSomeDisplay(p) {
  return screen.getAllDisplays().some((d) =>
    p.x >= d.bounds.x && p.x <= d.bounds.x + d.bounds.width && p.y >= d.bounds.y && p.y <= d.bounds.y + d.bounds.height);
}
function effPos(saved, fx, fy) {
  if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y) && insideSomeDisplay(saved)) return saved;
  const b = screen.getPrimaryDisplay().bounds;
  return { x: Math.round(b.x + b.width * fx), y: Math.round(b.y + b.height * fy) };
}
function glowOn(id) {
  return !Array.isArray(settings.glowDisplays) || settings.glowDisplays.includes(id);
}
function displayList() {
  const primaryId = screen.getPrimaryDisplay().id;
  return screen.getAllDisplays().map((d, i) => ({
    id: d.id, primary: d.id === primaryId,
    label: `Screen ${i + 1}${d.id === primaryId ? ' (primary)' : ''} \u00b7 ${d.size.width}\u00d7${d.size.height}`,
  }));
}

// ---------- overlay windows ----------
let overlays = [];
let lastMedia = null;
let lastArt = null;
let lastLyrics = { lines: null };

function liveOverlays() { return overlays.filter((w) => !w.isDestroyed()); }
function broadcast(channel, data) {
  for (const w of liveOverlays()) w.webContents.send(channel, data);
}

let audioRetryTimer = null;
let lastAudioTriggerAt = 0;

function effectivePerf() {
  const ecoActive = !!(onBattery && settings.batteryMode === 'eco');
  const fpsCap = ecoActive
    ? (settings.fpsCap === 0 ? 30 : Math.min(settings.fpsCap, 30))
    : settings.fpsCap;
  const glowQuality = ecoActive ? 'low' : settings.glowQuality;
  const reducedEffects = !!(settings.reducedEffects || ecoActive);
  return { fpsCap, glowQuality, reducedEffects, ecoActive, onBattery };
}

function rectsIntersect(a, b) {
  return a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1;
}

function displayHasContent(win) {
  if (editMode) return true;
  if (!win || win.isDestroyed()) return false;
  if (settings.glow && glowOn(win.displayId)) return true;
  const disp = screen.getAllDisplays().find((d) => d.id === win.displayId);
  if (!disp) return true;
  const db = {
    x1: disp.bounds.x,
    y1: disp.bounds.y,
    x2: disp.bounds.x + disp.bounds.width,
    y2: disp.bounds.y + disp.bounds.height,
  };
  if (settings.lyrics) {
    const lp = effPos(settings.lyricG, 0.5, 0.84);
    const r = Math.hypot(settings.lyricW, settings.lyricH) / 2 + 80;
    if (rectsIntersect({ x1: lp.x - r, y1: lp.y - r, x2: lp.x + r, y2: lp.y + r }, db)) return true;
  }
  if (settings.showDisc) {
    const dp = effPos(settings.discG, 0.11, 0.76);
    const r = settings.discSize * 0.7 + 80;
    if (rectsIntersect({ x1: dp.x - r, y1: dp.y - r, x2: dp.x + r, y2: dp.y + r }, db)) return true;
  }
  return false;
}

function pauseReasonFor(win) {
  if (editMode) return null;
  if (manualPaused) return 'manual';
  if (systemLocked) return 'locked';
  if (onBattery && settings.batteryMode === 'pause') return 'battery';
  if (settings.pauseFullscreen && occludedFs.has(win.displayId)) return 'fullscreen';
  if (settings.layer === 'desktop' && settings.pauseMaximized && occludedMax.has(win.displayId)) return 'maximized';
  if (!displayHasContent(win)) return 'empty';
  return null;
}

function needsAudio(win) {
  return !!(
    win &&
    !win.isDestroyed() &&
    !win.paused &&
    settings.audioReactive &&
    ((settings.glow && glowOn(win.displayId)) || (settings.lyrics && settings.lyricStyle === 'beat'))
  );
}
function needsArt() {
  return !!(settings.showDisc || settings.useAlbum || settings.lyricColor === 'album');
}
function runtimeObj() {
  const live = liveOverlays();
  const totalCount = live.length;
  let activeCount = 0;
  const pauseReasons = [];
  for (const w of live) {
    if (w.paused) {
      if (w.pauseReason && !pauseReasons.includes(w.pauseReason)) pauseReasons.push(w.pauseReason);
    } else {
      activeCount++;
    }
  }
  const perf = effectivePerf();
  return {
    manualPaused,
    onBattery,
    ecoActive: perf.ecoActive,
    allPaused: totalCount > 0 ? activeCount === 0 : (manualPaused || systemLocked || (onBattery && settings.batteryMode === 'pause')),
    activeCount,
    totalCount,
    pauseReasons,
  };
}

function audioOwnerWin() {
  const live = liveOverlays().filter(needsAudio);
  if (!live.length) return null;
  return live.find((w) => settings.glow && glowOn(w.displayId)) || live[0];
}
function triggerAudio(win, forceRestart = false) {
  if (!win || win.isDestroyed()) return;
  lastAudioTriggerAt = Date.now();
  // getDisplayMedia needs a user gesture, hence the `true`
  win.webContents
    .executeJavaScript(`typeof startAudio==="function"&&startAudio(${forceRestart ? 'true' : 'false'})`, true)
    .catch(() => {});
}

function sendSettings(win, owner = audioOwnerWin()) {
  if (win.isDestroyed()) return;
  const id = win.displayId;
  const disp = screen.getAllDisplays().find((d) => d.id === id) || screen.getPrimaryDisplay();
  const live = liveOverlays();
  const isOwner = owner === win;
  win.webContents.send('settings', {
    ...settings,
    paused: !!win.paused,
    pauseReason: win.pauseReason || null,
    perf: effectivePerf(),
    here: {
      glow: glowOn(id),
      primary: id === screen.getPrimaryDisplay().id,
      audioOwner: isOwner,
      multiScreen: live.length > 1,
    },
    editMode,
    preview: false,
    origin: { x: disp.bounds.x, y: disp.bounds.y }, // this window's top-left in global desktop coordinates
    virt: virtualBounds(),
    lyricPos: effPos(settings.lyricG, 0.5, 0.84),
    discPos: effPos(settings.discG, 0.11, 0.76),
  });
}

let lastTop = null;
function applyLayerFlags(nudge = false) {
  const top = editMode || settings.layer === 'top';
  if (top !== lastTop) {
    lastTop = top;
    for (const w of liveOverlays()) {
      if (top) w.setAlwaysOnTop(true, 'screen-saver');
      else w.setAlwaysOnTop(false);
    }
  }
  applyZ(nudge);
}

function reconcileOverlays(forceSettings = false) {
  const live = liveOverlays();
  const changes = new Map();
  for (const win of live) {
    const reason = pauseReasonFor(win);
    const nextPaused = !!reason;
    const prevPaused = !!win.paused;
    const stateChanged = nextPaused !== prevPaused || reason !== (win.pauseReason || null);
    const becamePaused = nextPaused && !prevPaused;
    const becameActive = !nextPaused && prevPaused;
    win.paused = nextPaused;
    win.pauseReason = reason;
    changes.set(win, { stateChanged, becamePaused, becameActive });
  }

  const curOwner = audioOwnerWin();
  const ownerChanged = curOwner !== lastAudioOwner;
  lastAudioOwner = curOwner;

  let anyBecameActive = false;
  for (const win of live) {
    const c = changes.get(win);
    if (c.becamePaused) {
      sendSettings(win, curOwner);
      if (!win.isDestroyed()) win.hide();
    } else if (c.becameActive) {
      if (!win.isDestroyed()) win.showInactive();
      sendSettings(win, curOwner);
      anyBecameActive = true;
    } else if (forceSettings || ownerChanged || c.stateChanged) {
      sendSettings(win, curOwner);
    }

    if (win === curOwner) {
      if (forceSettings || ownerChanged || c.becameActive) triggerAudio(win, false);
    } else if (forceSettings || ownerChanged || c.becamePaused) {
      win.webContents.executeJavaScript('typeof stopAudio==="function"&&stopAudio()', false).catch(() => {});
    }
  }

  if (anyBecameActive) applyLayerFlags(true);

  const rt = runtimeObj();
  if (mediaProc && mediaProc.stdin.writable && rt.allPaused !== mediaIdleSent) {
    mediaIdleSent = rt.allPaused;
    try { mediaProc.stdin.write(rt.allPaused ? 'idle:1\n' : 'idle:0\n'); } catch { /* ignore */ }
  }

  const sig = JSON.stringify(rt);
  if (sig !== lastRuntimeSig) {
    lastRuntimeSig = sig;
    sendState();
    scheduleTray();
  }
}

function createOverlay(display) {
  const { x, y, width, height } = display.bounds;
  const win = new BrowserWindow({
    x, y, width, height,
    transparent: true,
    frame: false,
    resizable: false,
    movable: false,
    minimizable: false,
    focusable: false,
    skipTaskbar: true,
    hasShadow: false,
    thickFrame: false,
    alwaysOnTop: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      backgroundThrottling: false,
      autoplayPolicy: 'no-user-gesture-required',
      spellcheck: false,
    },
  });
  win.displayId = display.id;
  win.paused = false;
  win.pauseReason = null;
  win.webContents.on('console-message', (_e, _lvl, msg) => console.log('[overlay]', msg));
  win.setIgnoreMouseEvents(true);
  win.loadFile(path.join(__dirname, 'overlay.html'));
  win.webContents.once('did-finish-load', () => {
    if (win.isDestroyed()) return;
    const reason = pauseReasonFor(win);
    win.paused = !!reason;
    win.pauseReason = reason;
    if (!win.paused) win.showInactive();
    if (lastMedia) win.webContents.send('media', lastMedia);
    if (lastArt) win.webContents.send('art', lastArt);
    win.webContents.send('lyrics', lastLyrics);
    lastTop = null;
    applyLayerFlags(true);
    reconcileOverlays(true);
    applyZ(true);
  });
  return win;
}

function createOverlays() {
  clearTimeout(audioRetryTimer);
  audioRetryTimer = null;
  lastAudioOwner = null;
  lastTop = null;
  for (const w of liveOverlays()) w.destroy();
  overlays = screen.getAllDisplays().map(createOverlay);
}

// ---------- z-order helper (keeps the overlay behind apps, via PowerShell + user32) ----------
let zproc = null;
function startZorder() {
  const ps = spawn('powershell.exe',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath('zorder.ps1')],
    { windowsHide: true });
  ps.stdin.on('error', () => {});
  readline.createInterface({ input: ps.stdout }).on('line', (line) => {
    if (!line.startsWith('occ:')) return;
    try {
      const data = JSON.parse(line.slice(4));
      occludedFs = new Set(Array.isArray(data.fs) ? data.fs.map(Number) : []);
      occludedMax = new Set(Array.isArray(data.max) ? data.max.map(Number) : []);
      reconcileOverlays(false);
    } catch (e) {
      console.log('[zorder parse error]', e.message);
    }
  });
  readline.createInterface({ input: ps.stderr }).on('line', (l) => console.log('[zorder error]', l));
  ps.on('exit', () => { zproc = null; lastZConfig = ''; if (!quitting) setTimeout(startZorder, 3000); });
  zproc = ps;
  lastZConfig = '';
  try { ps.stdin.write(`pid:${process.pid}\n`); } catch { /* ignore */ }
  applyZ(true);
}
function applyZ(nudge = false) {
  if (!zproc || !zproc.stdin.writable) return;
  const mode = editMode || settings.layer === 'top' ? 'top' : 'bottom';
  const watchFs = !editMode && settings.pauseFullscreen ? '1' : '0';
  const watchMax = !editMode && settings.layer === 'desktop' && settings.pauseMaximized ? '1' : '0';
  const displays = screen.getAllDisplays();
  const entries = [];
  for (const w of liveOverlays()) {
    const h = w.getNativeWindowHandle();
    const hwnd = (h.length >= 8 ? h.readBigUInt64LE(0) : BigInt(h.readUInt32LE(0))).toString();
    const disp = displays.find((d) => d.id === w.displayId);
    const b = disp ? disp.bounds : w.getBounds();
    const centerDip = { x: Math.round(b.x + b.width / 2), y: Math.round(b.y + b.height / 2) };
    const pt = screen.dipToScreenPoint ? screen.dipToScreenPoint(centerDip) : centerDip;
    entries.push(`${w.displayId}=${hwnd}=${Math.round(pt.x)}=${Math.round(pt.y)}`);
  }
  const cfg = `config:${mode}|${watchFs}|${watchMax}|${entries.join(',')}`;
  if (cfg !== lastZConfig) {
    lastZConfig = cfg;
    try { zproc.stdin.write(cfg + '\n'); } catch { /* ignore */ }
  } else if (nudge) {
    try { zproc.stdin.write('nudge\n'); } catch { /* ignore */ }
  }
}

// ---------- on-screen layout editing ----------
// Overlays stay click-through except exactly where the lyric box / record / handles are,
// so the settings window and the rest of Windows remain usable while editing.
let editTimer = null;
function setEdit(on) {
  editMode = on;
  clearTimeout(editTimer);
  for (const win of liveOverlays()) {
    win.setFocusable(on);
    win.setIgnoreMouseEvents(true, on ? { forward: true } : undefined);
  }
  if (settingsWin && !settingsWin.isDestroyed()) settingsWin.setAlwaysOnTop(on, 'screen-saver');
  applyLayerFlags(true);
  reconcileOverlays(true);
  sendState();
  scheduleTray();
  if (on) editTimer = setTimeout(() => setEdit(false), 20 * 60 * 1000); // safety: auto-exit
}
ipcMain.on('edit-done', () => setEdit(false));
ipcMain.on('ignore', (e, v) => {
  const w = BrowserWindow.fromWebContents(e.sender);
  if (w && editMode) w.setIgnoreMouseEvents(!!v, { forward: true });
});

function clampGlobal(p) {
  if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return null;
  const v = virtualBounds();
  return {
    x: Math.max(v.x, Math.min(v.x + v.w, Math.round(p.x))),
    y: Math.max(v.y, Math.min(v.y + v.h, Math.round(p.y))),
  };
}
ipcMain.on('layout', (_e, d) => {
  const patch = {};
  const l = clampGlobal(d && d.lyricPos); if (l) patch.lyricG = l;
  const c = clampGlobal(d && d.discPos); if (c) patch.discG = c;
  commit(patch);
});
// live values while dragging, so the overlays on other screens follow along
ipcMain.on('live-pos', (e, d) => {
  if (!d || (d.key !== 'lyricPos' && d.key !== 'discPos')) return;
  const pos = clampGlobal(d.pos);
  if (!pos) return;
  for (const w of liveOverlays()) if (w.webContents !== e.sender) w.webContents.send('live-pos', { key: d.key, pos });
});
ipcMain.on('live-box', (e, d) => {
  if (!d || !Number.isFinite(d.w) || !Number.isFinite(d.h)) return;
  for (const w of liveOverlays()) if (w.webContents !== e.sender) w.webContents.send('live-box', { w: d.w, h: d.h });
});

// ---------- one place that validates and applies every setting change ----------
const NUM = {
  fontSize: [12, 240, 0], discSize: [60, 1000, 0], thickness: [1, 60, 0], glowSize: [0.1, 5, 2],
  lyricRot: [-180, 180, 0], discRot: [-180, 180, 0], lyricW: [120, 3000, 0], lyricH: [40, 1500, 0],
  pastLines: [0, 8, 0], futureLines: [0, 8, 0], offsetMs: [-8000, 8000, 0], fadeSec: [0, 300, 0],
};
const BOOL = [
  'glow', 'lyrics', 'showDisc', 'idleGlow', 'rainbow', 'useAlbum', 'lineBlur', 'bold',
  'startWithWindows', 'musicOnly', 'autoUpdate',
  'pauseFullscreen', 'pauseMaximized', 'reducedEffects', 'audioReactive', 'startMinimized',
];

function sanitize(d) {
  const patch = {};
  if (!d || typeof d !== 'object') return patch;
  for (const [k, [lo, hi, dp]] of Object.entries(NUM)) {
    if (Number.isFinite(d[k])) {
      const f = 10 ** dp;
      patch[k] = Math.max(lo, Math.min(hi, Math.round(d[k] * f) / f));
    }
  }
  for (const k of BOOL) if (typeof d[k] === 'boolean') patch[k] = d[k];
  if (styleDef(d.lyricStyle)) patch.lyricStyle = d.lyricStyle;
  if (DISC_STYLES.some((s) => s.id === d.discStyle)) patch.discStyle = d.discStyle;
  if (SHAPES.some(([id]) => id === d.shape)) patch.shape = d.shape;
  if (['left', 'center', 'right'].includes(d.lyricAlign)) patch.lyricAlign = d.lyricAlign;
  if (d.nativeTheme === 'dark' || d.nativeTheme === 'light') patch.nativeTheme = d.nativeTheme;
  if (d.layer === 'desktop' || d.layer === 'top') patch.layer = d.layer;
  if (['off', 'eco', 'pause'].includes(d.batteryMode)) patch.batteryMode = d.batteryMode;
  if (['low', 'medium', 'high'].includes(d.glowQuality)) patch.glowQuality = d.glowQuality;
  if ([0, 20, 30, 60].includes(d.fpsCap)) patch.fpsCap = d.fpsCap;
  if (d.lyricColor === 'white' || d.lyricColor === 'album' || HEX.test(d.lyricColor || '')) patch.lyricColor = d.lyricColor;
  if (typeof d.font === 'string') {
    const f = d.font.replace(/['"\\;{}<>\r\n]/g, '').trim().slice(0, 80); // any installed font name
    if (f) patch.font = f;
  }
  if (HEX.test(d.primary || '')) patch.primary = d.primary;
  if (HEX.test(d.secondary || '')) patch.secondary = d.secondary;
  if ((patch.primary || patch.secondary) && !('useAlbum' in patch) && !('rainbow' in patch)) {
    patch.useAlbum = false; patch.rainbow = false; // picking a colour means "custom"
  }
  if (d.glowDisplays === null) patch.glowDisplays = null;
  else if (Array.isArray(d.glowDisplays)) {
    const ids = screen.getAllDisplays().map((x) => x.id);
    patch.glowDisplays = d.glowDisplays.filter((x) => ids.includes(x));
  }
  // box size follows the style until you size the box yourself
  if (patch.lyricStyle && patch.lyricStyle !== settings.lyricStyle && settings.boxAuto !== false) {
    const rec = styleDef(patch.lyricStyle).rec;
    patch.lyricW = rec[0]; patch.lyricH = rec[1];
  } else if (('lyricW' in patch || 'lyricH' in patch) && !patch.lyricStyle) {
    patch.boxAuto = false;
  }
  return patch;
}

function commit(patch) {
  if (!patch || !Object.keys(patch).length) return;
  const hadArt = needsArt();
  settings = { ...settings, ...patch };
  if ('startWithWindows' in patch && app.isPackaged) app.setLoginItemSettings({ openAtLogin: !!patch.startWithWindows });
  scheduleSave();
  applyLayerFlags();
  reconcileOverlays(true);
  if ('musicOnly' in patch) applySessions(lastSessions);
  if (!hadArt && needsArt() && currentKey && !lastArt && lastMedia && !lastMedia.none) {
    if (lastMedia.hasThumb && thumbRequestedFor !== currentKey && mediaProc && mediaProc.stdin.writable) {
      thumbRequestedFor = currentKey;
      try { mediaProc.stdin.write(`thumb:${currentKey}\n`); } catch { /* ignore */ }
    } else {
      const token = ++artToken;
      setTimeout(() => { if (token === artToken && !lastArt) fetchArtFallback(lastMedia, token); }, 800);
    }
  }
  sendState();
  scheduleTray();
}
ipcMain.on('prefs', (_e, d) => commit(sanitize(d)));

// ---------- GitHub auto-updater ----------
let updateState = {
  status: 'idle',
  version: null,
  releaseName: null,
  progress: 0,
  error: null,
  installerPath: null,
  assetId: null,
  assetUrl: null,
  assetName: null,
};

function cmpVer(a, b) {
  const pa = String(a || '').replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b || '').replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d;
  }
  return 0;
}

async function checkForUpdates(manual = false) {
  if (updateState.status === 'checking' || updateState.status === 'downloading') return;
  const prevReady = updateState.status === 'ready' && updateState.installerPath && fs.existsSync(updateState.installerPath) ? { ...updateState } : null;
  updateState = { ...updateState, status: 'checking', error: null };
  sendState();
  try {
    const r = await fetch('https://api.github.com/repos/arvgdhi/HaloVisual/releases', {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': `Halo/${app.getVersion()}` },
    });
    if (!r.ok) throw new Error(`GitHub HTTP ${r.status}`);
    const releases = await r.json();
    const candidates = [];
    for (const rel of Array.isArray(releases) ? releases : []) {
      if (!rel || rel.draft) continue;
      const asset = (rel.assets || []).find((a) => a && /^Halo-Setup-.*\.exe$/i.test(a.name));
      if (!asset || !asset.browser_download_url) continue;
      const tagVer = String(rel.tag_name || '').replace(/^v/i, '');
      const nameVer = asset.name.match(/Halo-Setup-(.+?)\.exe$/i);
      const ver = /^\d+\.\d+/.test(tagVer) ? tagVer : (nameVer ? nameVer[1] : app.getVersion());
      candidates.push({ rel, asset, ver });
    }
    candidates.sort((a, b) => {
      const vd = cmpVer(b.ver, a.ver);
      if (vd !== 0) return vd;
      return Date.parse(b.asset.updated_at || 0) - Date.parse(a.asset.updated_at || 0);
    });

    const best = candidates[0];
    let localMtime = 0;
    try { localMtime = fs.statSync(process.execPath).mtimeMs; } catch { /* ignore */ }
    const isNewer = best && (
      cmpVer(best.ver, app.getVersion()) > 0 ||
      (best.rel.tag_name === 'latest' && app.isPackaged && best.asset.id !== settings.installedAssetId && Date.parse(best.asset.updated_at || 0) > localMtime + 60000)
    );

    if (!isNewer) {
      updateState = {
        status: 'up-to-date', version: app.getVersion(), releaseName: null, progress: 0, error: null,
        installerPath: null, assetId: null, assetUrl: null, assetName: null,
      };
      sendState();
      return;
    }

    if (prevReady && prevReady.assetId === best.asset.id) {
      updateState = prevReady;
      sendState();
      return;
    }

    updateState = {
      status: 'available',
      version: best.ver,
      releaseName: best.rel.name || best.rel.tag_name || `v${best.ver}`,
      progress: 0,
      error: null,
      installerPath: null,
      assetId: best.asset.id,
      assetUrl: best.asset.browser_download_url,
      assetName: best.asset.name,
    };
    console.log('[update] available:', updateState.releaseName, updateState.assetName);
    sendState();
    if (settings.autoUpdate || manual === 'download') downloadUpdate();
  } catch (e) {
    console.log('[update] check failed:', e.message);
    updateState = { ...updateState, status: 'error', error: e.message || 'Check failed' };
    sendState();
  }
}

async function downloadUpdate() {
  if (!updateState.assetUrl || updateState.status === 'downloading') return;
  const safeName = path.basename(updateState.assetName || 'Halo-Setup.exe');
  const dest = path.join(app.getPath('temp'), safeName);
  const part = dest + '.part';
  updateState = { ...updateState, status: 'downloading', progress: 0, error: null };
  sendState();
  try {
    const r = await fetch(updateState.assetUrl, { headers: { 'User-Agent': `Halo/${app.getVersion()}` } });
    if (!r.ok || !r.body) throw new Error(`Download HTTP ${r.status}`);
    const total = Number(r.headers.get('content-length')) || 0;
    let loaded = 0;
    let lastEmit = 0;
    const out = fs.createWriteStream(part);
    let writeErr = null;
    out.on('error', (err) => { writeErr = err; });
    const reader = r.body.getReader();
    while (true) {
      if (writeErr) throw writeErr;
      const { done, value } = await reader.read();
      if (done) break;
      if (!out.write(value)) {
        await new Promise((resolve, reject) => {
          if (writeErr) return reject(writeErr);
          out.once('drain', resolve);
        });
      }
      loaded += value.length;
      if (total > 0) {
        const pct = Math.min(99, Math.round((loaded / total) * 100));
        const now = Date.now();
        if (pct !== updateState.progress && now - lastEmit > 150) {
          lastEmit = now;
          updateState.progress = pct;
          sendState();
        }
      }
    }
    if (writeErr) throw writeErr;
    await new Promise((resolve, reject) => out.end((err) => (err ? reject(err) : resolve())));
    fs.renameSync(part, dest);
    updateState = { ...updateState, status: 'ready', progress: 100, installerPath: dest, error: null };
    console.log('[update] downloaded to', dest);
    sendState();
    scheduleTray();
  } catch (e) {
    try { if (fs.existsSync(part)) fs.unlinkSync(part); } catch { /* ignore */ }
    console.log('[update] download failed:', e.message);
    updateState = { ...updateState, status: 'error', error: e.message || 'Download failed' };
    sendState();
  }
}

function installUpdate() {
  if (updateState.status !== 'ready' || !updateState.installerPath || !fs.existsSync(updateState.installerPath)) return;
  settings.installedAssetId = updateState.assetId;
  try { fs.writeFileSync(settingsFile(), JSON.stringify(settings, null, 2)); } catch { /* ignore */ }
  const psCmd = 'Start-Sleep -Seconds 2; Start-Process -FilePath $env:HALO_SETUP -ArgumentList "/S" -Wait; Start-Process -FilePath $env:HALO_EXE';
  const child = spawn('powershell.exe', ['-NoProfile', '-WindowStyle', 'Hidden', '-Command', psCmd], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
    env: { ...process.env, HALO_SETUP: updateState.installerPath, HALO_EXE: process.execPath },
  });
  child.unref();
  app.quit();
}

// ---------- the settings window ----------
let settingsWin = null;
function stateObj() {
  return {
    settings: { ...settings },
    editMode,
    runtime: runtimeObj(),
    displays: displayList(),
    packaged: app.isPackaged,
    version: app.getVersion(),
    update: { ...updateState },
  };
}
function metaObj() {
  return {
    fonts: systemFonts.length ? systemFonts : FONTS_FALLBACK,
    shapes: SHAPES,
    styles: STYLE_DEFS,
    discStyles: DISC_STYLES,
    palettes: PALETTES,
    lyricColors: LYRIC_COLORS,
  };
}
function sendState() {
  if (settingsWin && !settingsWin.isDestroyed()) settingsWin.webContents.send('state', stateObj());
}
function openSettings() {
  loadSystemFonts();
  if (settingsWin && !settingsWin.isDestroyed()) {
    settingsWin.show();
    settingsWin.focus();
    return;
  }
  settingsWin = new BrowserWindow({
    width: 1060, height: 760, minWidth: 820, minHeight: 580,
    backgroundColor: '#000000', title: 'Halo', icon: path.join(__dirname, 'build', 'icon.png'), autoHideMenuBar: true, show: false,
    webPreferences: { preload: path.join(__dirname, 'settings-preload.js'), spellcheck: false },
  });
  settingsWin.removeMenu();
  if (editMode) settingsWin.setAlwaysOnTop(true, 'screen-saver');
  settingsWin.loadFile(path.join(__dirname, 'settings.html'));
  settingsWin.once('ready-to-show', () => settingsWin.show());
  settingsWin.on('closed', () => { settingsWin = null; });
}
ipcMain.handle('hs-init', () => ({ meta: metaObj(), state: stateObj() }));
ipcMain.on('hs-set', (_e, d) => commit(sanitize(d)));
ipcMain.on('hs-act', (_e, name) => {
  if (name === 'toggle-edit') setEdit(!editMode);
  else if (name === 'toggle-pause') { manualPaused = !manualPaused; reconcileOverlays(false); }
  else if (name === 'reset-layout') commit({ lyricG: null, discG: null, lyricRot: 0, discRot: 0 });
  else if (name === 'fit-box') { const r = styleDef(settings.lyricStyle).rec; commit({ lyricW: r[0], lyricH: r[1], boxAuto: true }); }
  else if (name === 'check-update') checkForUpdates(true);
  else if (name === 'download-update') downloadUpdate();
  else if (name === 'install-update') installUpdate();
  else if (name === 'quit') app.quit();
});

// ---------- every font installed on this PC (loaded lazily when Settings opens) ----------
let systemFonts = [];
let fontsLoaded = false;
let fontsLoading = false;
function loadSystemFonts() {
  if (fontsLoaded || fontsLoading) return;
  fontsLoading = true;
  const cmd = '[Console]::OutputEncoding=[Text.Encoding]::UTF8; Add-Type -AssemblyName System.Drawing; ' +
    '(New-Object System.Drawing.Text.InstalledFontCollection).Families | ForEach-Object { $_.Name } | ConvertTo-Json -Compress';
  const ps = spawn('powershell.exe', ['-NoProfile', '-Command', cmd], { windowsHide: true });
  let out = '';
  ps.stdout.on('data', (c) => { out += c; });
  ps.stderr.on('data', (c) => console.log('[fonts error]', String(c).trim()));
  ps.on('exit', () => {
    fontsLoading = false;
    try {
      let list = JSON.parse(out);
      if (typeof list === 'string') list = [list];
      systemFonts = [...new Set(list.filter((n) => typeof n === 'string' && n.trim()))]
        .sort((a, b) => a.localeCompare(b));
      fontsLoaded = true;
      console.log('[fonts]', systemFonts.length, 'installed fonts found');
      if (settingsWin && !settingsWin.isDestroyed()) settingsWin.webContents.send('meta', metaObj());
    } catch (e) { console.log('[fonts] could not read the font list:', e.message); }
  });
}

// ---------- system audio loopback (no native modules needed) ----------
let pendingSources = null;
function getScreenSources() {
  if (!pendingSources) {
    pendingSources = desktopCapturer
      .getSources({ types: ['screen'], thumbnailSize: { width: 0, height: 0 } })
      .finally(() => { pendingSources = null; });
  }
  return pendingSources;
}
function isAllowedPermission(permission, details) {
  if (permission === 'local-fonts' || permission === 'display-capture') return true;
  if (permission === 'media') {
    // Electron 33 triggers 'media' with mediaTypes: [] for getDisplayMedia loopback capture;
    // still deny camera/microphone checks where mediaType/mediaTypes specify 'audio' or 'video'.
    if (details && Array.isArray(details.mediaTypes)) return details.mediaTypes.length === 0;
    if (details && details.mediaType) return details.mediaType === 'unknown';
  }
  return false;
}
function setupLoopback() {
  session.defaultSession.setPermissionRequestHandler((_wc, permission, cb, details) => {
    const ok = isAllowedPermission(permission, details);
    if (!ok) console.log('[perm denied]', permission, details && details.mediaTypes);
    cb(ok);
  });
  session.defaultSession.setPermissionCheckHandler((_wc, permission, _origin, details) => {
    const ok = isAllowedPermission(permission, details);
    if (!ok) console.log('[perm check denied]', permission, details && details.mediaType);
    return ok;
  });
  session.defaultSession.setDisplayMediaRequestHandler((_req, callback) => {
    getScreenSources()
      .then((sources) => {
        if (!sources || !sources.length) {
          console.log('[loopback] no screen sources available');
          callback({});
          return;
        }
        callback({ video: sources[0], audio: 'loopback' });
      })
      .catch((e) => {
        console.log('[loopback] getSources failed:', e && e.message);
        callback({});
      });
  });
}

ipcMain.on('audio-frame', (e, data) => {
  const owner = audioOwnerWin();
  if (!owner || e.sender !== owner.webContents) return;
  for (const w of liveOverlays()) {
    if (w !== owner && needsAudio(w)) w.webContents.send('audio-frame', data);
  }
});
ipcMain.on('audio-retry', (e, opts) => {
  const owner = audioOwnerWin();
  if (!owner || e.sender !== owner.webContents) return;
  const restart = !!(opts && opts.restart);
  const reqDelay = Number(opts && opts.delayMs) || 0;
  const minWait = Math.max(0, 1200 - (Date.now() - lastAudioTriggerAt));
  const wait = Math.max(minWait, reqDelay);
  clearTimeout(audioRetryTimer);
  audioRetryTimer = setTimeout(() => {
    audioRetryTimer = null;
    const curOwner = audioOwnerWin();
    if (curOwner) triggerAudio(curOwner, restart);
  }, wait);
});

// ---------- tray ----------
let tray = null;
let trayTimer = null;
function scheduleTray() { clearTimeout(trayTimer); trayTimer = setTimeout(buildTray, 250); }
function trayIcon() {
  const img = nativeImage.createFromPath(path.join(__dirname, 'build', 'logo.png'));
  return img.isEmpty() ? nativeImage.createEmpty() : img.resize({ width: 32, height: 32 });
}
function buildTray() {
  if (!tray) {
    tray = new Tray(trayIcon());
    tray.on('click', openSettings);
  }
  const rt = runtimeObj();
  tray.setToolTip(rt.allPaused ? 'Halo (Paused) \u2013 click for settings' : 'Halo \u2013 click for settings');
  const toggle = (label, key) => ({ label, type: 'checkbox', checked: !!settings[key], click: (i) => commit({ [key]: i.checked }) });
  const items = [
    { label: 'Open Halo settings', click: openSettings },
    {
      label: manualPaused ? 'Resume desktop overlay' : 'Pause desktop overlay',
      click: () => { manualPaused = !manualPaused; reconcileOverlays(false); },
    },
  ];
  if (updateState.status === 'ready') {
    items.push({ label: `Install update (${updateState.releaseName || 'new'}) & restart`, click: installUpdate });
  }
  items.push(
    { type: 'separator' },
    toggle('Edge glow', 'glow'),
    toggle('Lyrics', 'lyrics'),
    toggle('Record player', 'showDisc'),
    { type: 'separator' },
    { label: 'Edit layout on screen  (Ctrl+Alt+L)', type: 'checkbox', checked: editMode, click: () => setEdit(!editMode) },
    { type: 'separator' },
    { label: 'Quit Halo  (Ctrl+Alt+Q)', click: () => app.quit() },
  );
  tray.setContextMenu(Menu.buildFromTemplate(items));
}

// ---------- lyrics (LRCLIB, free, no key) ----------
let lyricToken = 0;

function parseLrc(text) {
  const out = [];
  for (const raw of text.split('\n')) {
    const tags = [...raw.matchAll(/\[(\d+):(\d+(?:\.\d+)?)\]/g)];
    if (!tags.length) continue;
    const line = raw.replace(/\[[^\]]*\]/g, '').trim();
    for (const t of tags) out.push({ t: Math.round((+t[1] * 60 + +t[2]) * 1000), text: line });
  }
  return out.sort((a, b) => a.t - b.t);
}

async function fetchJson(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'Halo/6.0 (personal overlay)' } });
  return r.ok ? r.json() : null;
}

async function loadLyrics(m) {
  const token = ++lyricToken;
  lastLyrics = { lines: null };
  broadcast('lyrics', lastLyrics);
  if (!m.title) return;
  let data = null;
  try {
    const q = new URLSearchParams({ artist_name: m.artist || '', track_name: m.title });
    if (m.durMs) q.set('duration', String(Math.round(m.durMs / 1000)));
    data = await fetchJson(`https://lrclib.net/api/get?${q}`);
    const clean = mediaFilter.cleanTitle(m.title);
    if ((!data || !data.syncedLyrics) && clean && clean !== m.title) {
      const q2 = new URLSearchParams({ artist_name: m.artist || '', track_name: clean });
      if (m.durMs) q2.set('duration', String(Math.round(m.durMs / 1000)));
      data = await fetchJson(`https://lrclib.net/api/get?${q2}`);
    }
    if ((!data || !data.syncedLyrics) && m.artist) {
      const term = clean || m.title;
      const list = await fetchJson(`https://lrclib.net/api/search?${new URLSearchParams({ q: `${m.artist} ${term}` })}`);
      data = mediaFilter.pickBestLyricMatch(m, list);
    }
  } catch (e) { console.log('[lyrics] lookup failed:', e.message); }
  if (token !== lyricToken) return; // track changed meanwhile
  lastLyrics = { lines: data && data.syncedLyrics ? parseLrc(data.syncedLyrics) : null };
  console.log('[lyrics]', lastLyrics.lines ? `${lastLyrics.lines.length} lines` : 'none found', '-', m.artist, '-', m.title);
  broadcast('lyrics', lastLyrics);
}

// ---------- album cover fallback (iTunes search, free, no key) ----------
let artToken = 0;
async function fetchArtFallback(m, token) {
  try {
    if (!m.title || !m.artist) return;
    const clean = mediaFilter.cleanTitle(m.title) || m.title;
    const r = await fetchJson(`https://itunes.apple.com/search?${new URLSearchParams({ term: `${m.artist} ${clean}`, entity: 'song', limit: '5' })}`);
    const url = mediaFilter.pickBestItunesArt(m, r && r.results);
    if (!url) { console.log('[art] fallback found nothing'); return; }
    const sz = settings.discSize <= 260 ? '300x300bb' : '600x600bb';
    const img = await fetch(url.replace('100x100bb', sz));
    if (!img.ok) return;
    const b64 = Buffer.from(await img.arrayBuffer()).toString('base64');
    if (token !== artToken || lastArt) return;
    lastArt = b64;
    console.log('[art] fallback cover from iTunes,', Math.round(b64.length / 1024), 'KB');
    broadcast('art', b64);
  } catch (e) { console.log('[art] fallback failed:', e.message); }
}

// ---------- media session via PowerShell ----------
let currentKey = null;
let lastLogged = '';
let lastIgnoredSig = '';
let lastSessions = [];
let thumbRequestedFor = null;
let lastSentMedia = null;
let lastSentAt = 0;

function applySessions(sessions) {
  lastSessions = Array.isArray(sessions) ? sessions : [];
  const m = mediaFilter.pickBestSession(lastSessions, settings.musicOnly);

  if (!m) {
    const playingOther = lastSessions.filter((s) => s && s.playing);
    if (playingOther.length) {
      const igSig = playingOther.map((s) => `${s.app}|${s.artist}-${s.title}`).join(';');
      if (igSig !== lastIgnoredSig) {
        lastIgnoredSig = igSig;
        console.log('[media] ignored non-music:', igSig);
      }
    }
    const noneMsg = { none: true };
    if (lastLogged !== 'none') { lastLogged = 'none'; console.log('[media] none'); }
    if (currentKey !== null) {
      currentKey = null; lastArt = null; thumbRequestedFor = null;
      ++lyricToken; ++artToken;
      lastLyrics = { lines: null };
      broadcast('lyrics', lastLyrics);
      broadcast('art', null);
    }
    lastMedia = noneMsg;
    if (lastSentMedia !== 'none') {
      lastSentMedia = 'none';
      lastSentAt = Date.now();
      broadcast('media', noneMsg);
    }
    return;
  }

  lastIgnoredSig = '';
  const sig = `${m.app} | ${m.artist} - ${m.title} | playing=${m.playing}`;
  if (sig !== lastLogged) { lastLogged = sig; console.log('[media]', sig); }

  if (m.key !== currentKey) {
    currentKey = m.key;
    lastArt = null;
    thumbRequestedFor = null;
    broadcast('art', null);
    loadLyrics(m);
    // if Windows hands us no cover within a couple of seconds, look one up
    if (needsArt()) {
      const token = ++artToken;
      setTimeout(() => { if (token === artToken && !lastArt) fetchArtFallback(m, token); }, 2500);
    }
  }

  const art = m.art;
  if (art) {
    delete m.art;
    lastArt = art;
    console.log('[art] cover from Windows,', Math.round(art.length / 1024), 'KB');
    broadcast('art', art);
  } else if (needsArt() && !lastArt && m.hasThumb && thumbRequestedFor !== m.key && mediaProc && mediaProc.stdin.writable) {
    thumbRequestedFor = m.key;
    try { mediaProc.stdin.write(`thumb:${m.key}\n`); } catch { /* ignore */ }
  }

  const out = { ...m };
  delete out.art;
  const now = Date.now();
  const prev = lastSentMedia && typeof lastSentMedia === 'object' ? lastSentMedia : null;
  const wasPlaying = !!(prev && prev.playing);
  let shouldSend = !prev || prev.key !== out.key || prev.playing !== out.playing || prev.durMs !== out.durMs;
  if (!shouldSend && out.playing) {
    const predictedPos = (prev.posMs || 0) + (now - lastSentAt);
    if (Math.abs((out.posMs || 0) - predictedPos) > 350 || now - lastSentAt >= 2000) {
      shouldSend = true;
    }
  } else if (!shouldSend && !out.playing && prev.posMs !== out.posMs) {
    shouldSend = true;
  }
  lastMedia = out;
  if (shouldSend) {
    lastSentMedia = { ...out };
    lastSentAt = now;
    broadcast('media', out);
  }
  if (!wasPlaying && out.playing) {
    const owner = audioOwnerWin();
    if (owner) triggerAudio(owner, false);
  }
}

function onMediaLine(line) {
  let msg;
  try { msg = JSON.parse(line); } catch { console.log('[media raw]', line.slice(0, 200)); return; }
  if (msg && 'sessions' in msg) {
    const arr = Array.isArray(msg.sessions) ? msg.sessions : (msg.sessions ? [msg.sessions] : []);
    applySessions(arr);
    return;
  }
  if (msg && msg.none) { applySessions([]); return; }
  if (msg && msg.key) applySessions([msg]);
}

let mediaProc = null;
function startMedia() {
  const ps = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath('media.ps1')], { windowsHide: true });
  ps.stdin.on('error', () => {});
  readline.createInterface({ input: ps.stdout }).on('line', onMediaLine);
  readline.createInterface({ input: ps.stderr }).on('line', (l) => console.log('[media.ps1 error]', l));
  ps.on('exit', () => {
    mediaProc = null;
    mediaIdleSent = null;
    if (!quitting) setTimeout(startMedia, 3000);
  });
  mediaProc = ps;
  const allPaused = runtimeObj().allPaused;
  if (allPaused && ps.stdin.writable) {
    mediaIdleSent = true;
    try { ps.stdin.write('idle:1\n'); } catch { /* ignore */ }
  }
}

// ---------- boot ----------
app.whenReady().then(() => {
  loadSettings();
  onBattery = powerMonitor.isOnBatteryPower();
  setupLoopback();
  buildTray();
  createOverlays();
  startMedia();
  startZorder();
  const refresh = () => { editMode = false; createOverlays(); buildTray(); sendState(); };
  const recoverAudio = () => {
    setTimeout(() => {
      const owner = audioOwnerWin();
      if (owner) triggerAudio(owner, true);
    }, 1500);
  };
  const updateBattery = () => {
    const next = powerMonitor.isOnBatteryPower();
    if (next !== onBattery) {
      onBattery = next;
      reconcileOverlays(true);
    }
  };
  // emergency exits that work even if the overlay or tray is hard to reach
  globalShortcut.register('CommandOrControl+Alt+L', () => setEdit(!editMode));
  globalShortcut.register('CommandOrControl+Alt+Q', () => app.quit());
  screen.on('display-added', refresh);
  screen.on('display-removed', refresh);
  screen.on('display-metrics-changed', refresh);
  powerMonitor.on('on-battery', updateBattery);
  powerMonitor.on('on-ac', updateBattery);
  powerMonitor.on('lock-screen', () => { systemLocked = true; reconcileOverlays(false); });
  powerMonitor.on('suspend', () => { systemLocked = true; reconcileOverlays(false); });
  powerMonitor.on('unlock-screen', () => { systemLocked = false; reconcileOverlays(false); recoverAudio(); });
  powerMonitor.on('resume', () => { systemLocked = false; reconcileOverlays(false); recoverAudio(); });
  // Open the desktop window alongside the background desktop overlays on startup unless minimized
  if (!settings.startMinimized || !settings.settingsShown) {
    settings.settingsShown = true;
    scheduleSave();
    openSettings();
  }
  setTimeout(() => { if (settings.autoUpdate) checkForUpdates(false); }, 6000);
  setInterval(() => { if (settings.autoUpdate) checkForUpdates(false); }, 2 * 60 * 60 * 1000);
});

app.on('second-instance', openSettings);
app.on('before-quit', () => {
  quitting = true;
  clearTimeout(audioRetryTimer);
  globalShortcut.unregisterAll();
  if (mediaProc) mediaProc.kill();
  if (zproc) zproc.kill();
});
app.on('window-all-closed', (e) => e.preventDefault()); // keep running in the tray
