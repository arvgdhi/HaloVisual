const canvas = document.getElementById('glow');
const ctx = canvas.getContext('2d');
const $ = (id) => document.getElementById(id);
const lyricsEl = $('lyrics'), stageEl = $('stage'), trackEl = $('track'), sceneEl = $('scene');
const handlesEl = $('handles'), tagEl = $('tag');
const playerEl = $('player'), recordEl = $('record'), labelEl = $('label'), armEl = $('armg');
const root = document.documentElement;
const SK = window.SceneKit, SC = window.SC;

let S = {
  glow: true, lyrics: true, idleGlow: true, thickness: 6, glowSize: 1, useAlbum: true, rainbow: false,
  primary: '#7c5cff', secondary: '#ff4fa3', offsetMs: 0, fontSize: 34, font: 'Segoe UI', bold: true,
  lyricStyle: 'classic', lyricAlign: 'center', nativeTheme: 'dark', lyricColor: 'white', shape: 'classic',
  lyricW: 760, lyricH: 170, pastLines: 0, futureLines: 1, lineBlur: false, fadeSec: 10, musicOnly: true,
  showDisc: true, discSize: 200, lyricRot: 0, discRot: 0,
  lyricPos: { x: innerWidth / 2, y: innerHeight * 0.84 }, discPos: { x: innerWidth * 0.11, y: innerHeight * 0.76 },
  origin: { x: 0, y: 0 }, virt: { x: 0, y: 0, w: innerWidth, h: innerHeight },
  here: { glow: true, primary: true, audioOwner: true, multiScreen: false }, editMode: false, preview: false,
};
const DEFAULT_S = S;
let media = { none: true };
let recvAt = 0;
let lines = null;
let albumColors = null;

// ---------- IPC ----------
halo.on('settings', (s) => { S = Object.assign({}, DEFAULT_S, s); applyLayout(); });
halo.on('live-pos', (d) => { if (d && d.key && d.pos) { S[d.key] = d.pos; applyLayout(); } });
halo.on('live-box', (d) => { if (d) { S.lyricW = d.w; S.lyricH = d.h; applyLayout(); } });
halo.on('media', (m) => { media = m; recvAt = performance.now(); });
halo.on('lyrics', (l) => { lines = l.lines; });
halo.on('art', (b64) => {
  if (!b64) { labelEl.style.backgroundImage = ''; return; }
  labelEl.style.backgroundImage = `url(data:image/jpeg;base64,${b64})`;
  extractColors(b64);
});
halo.on('audio-frame', (d) => {
  if (!d || S.here.audioOwner) return;
  remoteRaw = Number(d.raw) || 0;
  remoteAt = performance.now();
  if (d.bands && d.bands.length >= NB) {
    for (let i = 0; i < NB; i++) bands[i] = d.bands[i] / 255;
  }
});

// ---------- colours ----------
const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6; if (h < 0) h += 1;
  }
  return [h, max ? d / max : 0, max];
}
function hsvToRgb(h, s, v) {
  const f = (n) => { const k = (n + h * 6) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
  return [f(5) * 255, f(3) * 255, f(1) * 255];
}
function targetColors(now) {
  if (S.rainbow) {
    const h = (now / 9000) % 1;
    return [hsvToRgb(h, 0.7, 1), hsvToRgb((h + 0.14) % 1, 0.7, 1)];
  }
  if (S.useAlbum && albumColors) return [albumColors.p, albumColors.s];
  return [hexToRgb(S.primary), hexToRgb(S.secondary)];
}
function lyricRgb() {
  if (S.lyricColor === 'album') return albumColors ? albumColors.p : [255, 255, 255];
  if (/^#[0-9a-f]{6}$/i.test(S.lyricColor)) return hexToRgb(S.lyricColor);
  return [255, 255, 255];
}
function setAccent() {
  const [p, s] = targetColors(performance.now());
  root.style.setProperty('--c1', rgb(p));
  root.style.setProperty('--c2', rgb(s));
  root.style.setProperty('--glow', rgb(p, 0.55));
  const on = lyricRgb();
  root.style.setProperty('--ly-on', rgb(on));
  root.style.setProperty('--ly-off', rgb(on, 0.38));
}

const clampN = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeOutBack = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

let pending = {};
let prefsTimer = null;
function sendPrefs(patch) {
  Object.assign(pending, patch);
  Object.assign(S, patch);
  clearTimeout(prefsTimer);
  prefsTimer = setTimeout(() => { halo.send('prefs', pending); pending = {}; }, 120);
  applyLayout();
}

// ---------- layout ----------
const ORIGIN = { left: '0%', center: '50%', right: '100%' };
let lastEdit = false;
function applyLayout() {
  const O = S.origin || { x: 0, y: 0 };
  lyricsEl.style.fontSize = S.fontSize + 'px';
  lyricsEl.style.fontFamily = `'${S.font}', 'Segoe UI', sans-serif`;
  lyricsEl.style.fontWeight = S.bold ? 700 : 500;
  lyricsEl.style.width = S.lyricW + 'px';
  lyricsEl.style.height = S.lyricH + 'px';
  lyricsEl.style.left = S.lyricPos.x - O.x + 'px';
  lyricsEl.style.top = S.lyricPos.y - O.y + 'px';
  lyricsEl.style.setProperty('--rot', (S.lyricRot || 0) + 'deg');
  lyricsEl.style.setProperty('--align', S.lyricAlign || 'center');
  lyricsEl.style.setProperty('--origin', ORIGIN[S.lyricAlign] || '50%');
  playerEl.style.left = S.discPos.x - O.x + 'px';
  playerEl.style.top = S.discPos.y - O.y + 'px';
  playerEl.style.setProperty('--d', S.discSize + 'px');
  playerEl.style.setProperty('--rot', (S.discRot || 0) + 'deg');
  document.body.classList.toggle('edit', !!S.editMode);
  document.body.classList.toggle('bar', !!(S.editMode && S.here.primary));
  tagEl.textContent = `Lyrics · ${Math.round(S.lyricW)} × ${Math.round(S.lyricH)}`;
  if (S.editMode !== lastEdit) { lastEdit = S.editMode; ignoring = true; drag = null; rs = null; }
  setAccent();
}
let ignoring = true;

// resize handles on the lyric box
const HANDLES = [[0, 0], [0.5, 0], [1, 0], [0, 0.5], [1, 0.5], [0, 1], [0.5, 1], [1, 1]];
const CURSORS = ['nwse-resize', 'ns-resize', 'nesw-resize', 'ew-resize', 'ew-resize', 'nesw-resize', 'ns-resize', 'nwse-resize'];
HANDLES.forEach(([x, y], i) => {
  const h = document.createElement('div');
  h.className = 'h';
  h.style.left = x * 100 + '%'; h.style.top = y * 100 + '%'; h.style.cursor = CURSORS[i];
  h.dataset.hx = String(x === 0 ? -1 : x === 1 ? 1 : 0);
  h.dataset.hy = String(y === 0 ? -1 : y === 1 ? 1 : 0);
  handlesEl.appendChild(h);
});

$('done').addEventListener('click', () => halo.send('edit-done'));
addEventListener('keydown', (e) => { if (e.key === 'Escape' && S.editMode) halo.send('edit-done'); });

// ---------- edit mode: the overlay is click-through except over the box, the record and the pill ----------
function setIgnore(v) {
  if (ignoring === v) return;
  ignoring = v;
  halo.send('ignore', v);
}
addEventListener('mousemove', (e) => {
  if (!S.editMode || drag || rs) return;
  const hit = !!(e.target && e.target.closest && e.target.closest('#lyrics,#player,#pill'));
  setIgnore(!hit);
});

// ---------- drag and resize (global desktop coordinates, so it works across screens) ----------
let drag = null, rs = null;
let lastLive = 0;
function startDrag(key, el, e) {
  if (!S.editMode) return;
  const r = el.getBoundingClientRect();
  drag = { key, dx: e.clientX - (r.left + r.width / 2), dy: e.clientY - (r.top + r.height / 2) };
  e.preventDefault();
}
lyricsEl.addEventListener('mousedown', (e) => {
  if (e.target.classList && e.target.classList.contains('h')) {
    const O = S.origin;
    rs = {
      hx: +e.target.dataset.hx, hy: +e.target.dataset.hy,
      x0: e.clientX + O.x, y0: e.clientY + O.y, w0: S.lyricW, h0: S.lyricH,
      rot: ((S.lyricRot || 0) * Math.PI) / 180,
    };
    e.preventDefault(); e.stopPropagation();
    return;
  }
  startDrag('lyricPos', lyricsEl, e);
});
playerEl.addEventListener('mousedown', (e) => startDrag('discPos', playerEl, e));
addEventListener('mousemove', (e) => {
  const now = performance.now();
  if (rs) {
    const O = S.origin;
    const dx = e.clientX + O.x - rs.x0, dy = e.clientY + O.y - rs.y0;
    const c = Math.cos(rs.rot), s = Math.sin(rs.rot);
    const du = dx * c + dy * s, dv = -dx * s + dy * c;
    if (rs.hx) S.lyricW = Math.round(clampN(rs.w0 + 2 * rs.hx * du, 120, 3000));
    if (rs.hy) S.lyricH = Math.round(clampN(rs.h0 + 2 * rs.hy * dv, 40, 1500));
    applyLayout();
    if (now - lastLive > 30) { lastLive = now; halo.send('live-box', { w: S.lyricW, h: S.lyricH }); }
    return;
  }
  if (!drag) return;
  const O = S.origin, V = S.virt;
  S[drag.key] = {
    x: Math.round(clampN(e.clientX - drag.dx + O.x, V.x + 10, V.x + V.w - 10)),
    y: Math.round(clampN(e.clientY - drag.dy + O.y, V.y + 10, V.y + V.h - 10)),
  };
  applyLayout();
  if (now - lastLive > 25) { lastLive = now; halo.send('live-pos', { key: drag.key, pos: S[drag.key] }); }
});
addEventListener('mouseup', () => {
  if (rs) { const w = S.lyricW, h = S.lyricH; rs = null; sendPrefs({ lyricW: w, lyricH: h }); return; }
  if (!drag) return;
  drag = null;
  halo.send('layout', { lyricPos: S.lyricPos, discPos: S.discPos });
});
// scroll = text / record size, Alt+scroll = rotate
function wheelHandler(sizeKey, rotKey, lo, hi, step, el) {
  el.addEventListener('wheel', (e) => {
    if (!S.editMode) return;
    const dir = e.deltaY < 0 ? 1 : -1;
    if (e.altKey) {
      let r = (S[rotKey] || 0) + dir * 5;
      if (r > 180) r -= 360; if (r < -180) r += 360;
      sendPrefs({ [rotKey]: r });
    } else {
      sendPrefs({ [sizeKey]: clampN(S[sizeKey] + dir * step, lo, hi) });
    }
  }, { passive: true });
}
wheelHandler('fontSize', 'lyricRot', 12, 240, 3, lyricsEl);
wheelHandler('discSize', 'discRot', 60, 1000, 12, playerEl);

// ---------- audio (system loopback) ----------
const RETRY_DELAYS = [1500, 3000, 5000, 10000, 15000, 30000];
const STALE_THRESHOLDS = [8000, 20000, 50000, 120000];
const NB = 64;
const bands = new Float32Array(NB);
const relayBuf = new Uint8Array(NB);

let audioCtx = null, audioStream = null, audioOnlyStream = null, audioTrack = null, audioSource = null, audioGain = null;
let analyser = null, freq = null, starting = false, queuedRestart = false, captureGen = 0;
let retryAttempt = 0, remoteRaw = 0, remoteAt = 0, lastRelayAt = 0;
let silentSince = 0, staleRestarts = 0, lastTrackKey = null, wasPlaying = false;

function stopAudio() {
  captureGen++;
  const prevTrack = audioTrack;
  const prevCtx = audioCtx;
  audioTrack = null;
  audioCtx = null;
  audioOnlyStream = null;
  analyser = null;
  freq = null;
  if (audioSource) { try { audioSource.disconnect(); } catch {} audioSource = null; }
  if (audioGain) { try { audioGain.disconnect(); } catch {} audioGain = null; }
  if (prevTrack) prevTrack.onended = null;
  if (audioStream) {
    audioStream.getTracks().forEach((t) => { try { t.stop(); } catch {} });
    audioStream = null;
  }
  if (prevCtx) {
    prevCtx.onstatechange = null;
    if (prevCtx.state !== 'closed') prevCtx.close().catch(() => {});
  }
}

async function startAudio(forceRestart = false) {
  if (starting) { if (forceRestart) queuedRestart = true; return; }
  if (!forceRestart && analyser && audioTrack && audioTrack.readyState === 'live' && audioCtx) {
    if (audioCtx.state === 'running') return;
    if (audioCtx.state === 'suspended') {
      try {
        await audioCtx.resume();
        if (audioCtx && audioCtx.state === 'running') return;
      } catch { /* fall through to full restart */ }
    }
  }

  starting = true;
  queuedRestart = false;
  if (forceRestart || analyser || audioCtx || audioStream) stopAudio();
  const myGen = ++captureGen;

  let stream = null;
  let ac = null;
  try {
    stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    if (myGen !== captureGen) {
      stream.getTracks().forEach((t) => { try { t.stop(); } catch {} });
      return;
    }
    stream.getVideoTracks().forEach((t) => t.stop());
    const aTracks = stream.getAudioTracks();
    if (!aTracks.length) throw new Error('no audio track from loopback');

    const track = aTracks[0];
    const aOnly = new MediaStream([track]);
    ac = new AudioContext();
    await ac.resume();
    if (myGen !== captureGen) {
      stream.getTracks().forEach((t) => { try { t.stop(); } catch {} });
      if (ac.state !== 'closed') ac.close().catch(() => {});
      return;
    }
    if (ac.state !== 'running') throw new Error(`AudioContext state=${ac.state}`);

    const src = ac.createMediaStreamSource(aOnly);
    const an = ac.createAnalyser();
    an.fftSize = 1024;
    an.smoothingTimeConstant = 0.7;
    // Keep the Web Audio pull graph active with zero audible output.
    const gain = ac.createGain();
    gain.gain.value = 0;
    src.connect(an);
    an.connect(gain);
    gain.connect(ac.destination);

    audioStream = stream;
    audioOnlyStream = aOnly;
    audioTrack = track;
    audioCtx = ac;
    audioSource = src;
    audioGain = gain;
    freq = new Uint8Array(an.frequencyBinCount);
    analyser = an;
    retryAttempt = 0;

    track.onended = () => {
      if (audioTrack !== track) return;
      console.warn('audio loopback track ended');
      stopAudio();
      if (S.here.audioOwner) halo.send('audio-retry', { restart: true, delayMs: 1200 });
    };
    ac.onstatechange = () => {
      if (audioCtx !== ac) return;
      if (ac.state === 'suspended') {
        ac.resume().catch(() => {
          if (audioCtx === ac && S.here.audioOwner) halo.send('audio-retry', { restart: false, delayMs: 1200 });
        });
      } else if (ac.state === 'closed') {
        stopAudio();
        if (S.here.audioOwner) halo.send('audio-retry', { restart: true, delayMs: 1200 });
      }
    };
    console.log('audio capture started, tracks:', aTracks.length, 'ctx:', ac.state, 'rate:', ac.sampleRate);
  } catch (e) {
    console.error('audio capture failed:', e && e.message);
    if (stream) stream.getTracks().forEach((t) => { try { t.stop(); } catch {} });
    if (ac && ac.state !== 'closed') ac.close().catch(() => {});
    if (myGen !== captureGen) return;
    stopAudio();
    if (S.here.audioOwner) {
      const delayMs = RETRY_DELAYS[Math.min(retryAttempt, RETRY_DELAYS.length - 1)];
      retryAttempt++;
      halo.send('audio-retry', { restart: false, delayMs });
    }
  } finally {
    starting = false;
    if (queuedRestart && S.here.audioOwner) {
      queuedRestart = false;
      halo.send('audio-retry', { restart: true, delayMs: 0 });
    }
  }
}
window.startAudio = startAudio;
window.stopAudio = stopAudio;

if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
  let devTimer = null;
  navigator.mediaDevices.addEventListener('devicechange', () => {
    if (!S.here.audioOwner) return;
    clearTimeout(devTimer);
    devTimer = setTimeout(() => {
      if (S.here.audioOwner) halo.send('audio-retry', { restart: true, delayMs: 0 });
    }, 1200);
  });
}

function readEnergy() {
  if (!analyser) { for (let i = 0; i < NB; i++) bands[i] *= 0.9; return 0; }
  analyser.getByteFrequencyData(freq);
  for (let i = 0; i < NB; i++) {
    const a = Math.floor(Math.pow(372, i / NB));
    const b = Math.max(a + 1, Math.floor(Math.pow(372, (i + 1) / NB)));
    let m = 0;
    for (let k = a; k < b && k < freq.length; k++) if (freq[k] > m) m = freq[k];
    bands[i] = Math.max(m / 255, bands[i] * 0.86);
  }
  let bass = 0, all = 0;
  for (let i = 1; i < 8; i++) bass += freq[i];
  for (let i = 1; i < 120; i++) all += freq[i];
  return Math.min(1, (bass / 7 / 255) * 0.7 + (all / 119 / 255) * 1.3);
}

function checkStaleAudio(now, raw) {
  if (!S.here.audioOwner) { silentSince = 0; staleRestarts = 0; return; }
  const key = media.none ? null : media.key;
  const playing = !!media.playing && !media.none;
  if (key !== lastTrackKey || (playing && !wasPlaying)) {
    lastTrackKey = key;
    silentSince = 0;
    staleRestarts = 0;
  }
  wasPlaying = playing;
  if (!playing || raw > 0.002) {
    silentSince = 0;
    if (raw > 0.002) staleRestarts = 0;
    return;
  }
  if (!silentSince) { silentSince = now; return; }
  if (staleRestarts < STALE_THRESHOLDS.length && now - silentSince >= STALE_THRESHOLDS[staleRestarts]) {
    staleRestarts++;
    silentSince = now;
    console.warn('audio loopback silent while playing; restarting #' + staleRestarts);
    halo.send('audio-retry', { restart: true, delayMs: 0 });
  }
}

// ---------- colours from the album cover ----------
function extractColors(b64) {
  const img = new Image();
  img.onerror = () => console.error('cover image failed to decode');
  img.onload = () => {
    const c = document.createElement('canvas');
    c.width = c.height = 32;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(img, 0, 0, 32, 32);
    const d = x.getImageData(0, 0, 32, 32).data;
    const bins = new Map();
    for (let i = 0; i < d.length; i += 4) {
      const [h, s, v] = rgbToHsv(d[i], d[i + 1], d[i + 2]);
      if (v < 0.2 || s < 0.25) continue;
      const k = Math.floor(h * 12) % 12;
      const w = s * v;
      const b = bins.get(k) || { w: 0, h: 0 };
      b.w += w; b.h += h * w;
      bins.set(k, b);
    }
    const ranked = [...bins.entries()].sort((a, b) => b[1].w - a[1].w);
    if (!ranked.length) albumColors = { p: [225, 225, 255], s: [140, 150, 210] };
    else {
      const hueOf = (b) => b[1].h / b[1].w;
      const h1 = hueOf(ranked[0]);
      const far = ranked.find((r) => { const dh = Math.abs(hueOf(r) - h1); return Math.min(dh, 1 - dh) > 0.12; });
      const h2 = far ? hueOf(far) : (h1 + 0.09) % 1;
      albumColors = { p: hsvToRgb(h1, 0.75, 1), s: hsvToRgb(h2, 0.7, 1) };
    }
    console.log('album colours', rgb(albumColors.p), rgb(albumColors.s));
    applyLayout();
  };
  img.src = 'data:image/jpeg;base64,' + b64;
}

// ---------- visibility (fade out after a pause) ----------
let lastActive = performance.now();
let vis = 1;
function updateVis(now, raw) {
  const active = !!media.playing || (!S.musicOnly && raw > 0.04);
  if (active) lastActive = now;
  const idleTooLong = S.fadeSec > 0 && now - lastActive > S.fadeSec * 1000;
  const target = idleTooLong && !S.editMode && !S.preview ? 0 : 1;
  vis += (target - vis) * (target ? 0.15 : 0.025);
  if (vis < 0.005) vis = 0;
}

// ---------- glow ----------
function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
addEventListener('resize', resize);
resize();

let curP = hexToRgb('#7c5cff');
let curS = hexToRgb('#ff4fa3');
let level = 0;

function eachEdge(fn) {
  const w = canvas.width, h = canvas.height;
  const E = [[0, 0, 0, w], [w, 0, Math.PI / 2, h], [w, h, Math.PI, w], [0, h, -Math.PI / 2, h]];
  E.forEach(([x, y, r, len], i) => { ctx.save(); ctx.translate(x, y); ctx.rotate(r); fn(len, i); ctx.restore(); });
}
function edgeGrad(len) {
  const g = ctx.createLinearGradient(0, 0, len, 0);
  g.addColorStop(0, rgb(curP)); g.addColorStop(0.5, rgb(curS)); g.addColorStop(1, rgb(curP));
  return g;
}
const bandAt = (t) => bands[Math.min(NB - 1, Math.floor(Math.abs(2 * t - 1) * NB))];

function drawClassic(now, rounded) {
  const w = canvas.width, h = canvas.height;
  const a = now / 5000, cx = w / 2, cy = h / 2, r = Math.hypot(w, h) / 2;
  const g = ctx.createLinearGradient(cx - Math.cos(a) * r, cy - Math.sin(a) * r, cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  g.addColorStop(0, rgb(curP)); g.addColorStop(0.5, rgb(curS)); g.addColorStop(1, rgb(curP));
  const lw = S.thickness * (1 + level * 1.2);
  ctx.lineWidth = lw;
  ctx.strokeStyle = g;
  ctx.shadowColor = rgb(curP);
  ctx.shadowBlur = (25 + level * 70) * S.glowSize;
  ctx.globalAlpha = (0.45 + level * 0.55) * vis;
  for (let i = 0; i < 2; i++) {
    if (rounded) {
      const inset = lw / 2 + 6;
      ctx.beginPath();
      ctx.roundRect(inset, inset, w - inset * 2, h - inset * 2, 38);
      ctx.stroke();
    } else ctx.strokeRect(0, 0, w, h);
  }
}
function waveHeight(t, time, seed) {
  const amp = 130 * S.glowSize;
  const body = 0.55 * bandAt(t) + 0.45 * level * (0.6 + 0.4 * Math.sin(t * 5 + time + seed));
  const wob = 7 * Math.sin(t * 13 + time * 1.7 + seed) + 5 * Math.sin(t * 29 - time * 2.3 + seed * 1.7);
  return Math.max(2, S.thickness * 2.2 + amp * body + wob);
}
function drawLiquid(now) {
  const time = now / 1000;
  eachEdge((len, i) => {
    for (let layer = 0; layer < 2; layer++) {
      const k = layer ? 0.7 : 1;
      ctx.globalAlpha = (layer ? 0.45 : 0.85) * vis * (0.65 + 0.35 * level);
      ctx.fillStyle = edgeGrad(len);
      ctx.shadowColor = rgb(curP);
      ctx.shadowBlur = 22 * S.glowSize;
      const step = Math.max(8, len / 90);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      let px = 0, py = waveHeight(0, time + layer * 1.3, i + layer * 3) * k;
      ctx.lineTo(0, py);
      for (let x = step; x <= len + step; x += step) {
        const cx = Math.min(x, len);
        const y = waveHeight(cx / len, time + layer * 1.3, i + layer * 3) * k;
        ctx.quadraticCurveTo(px, py, (px + cx) / 2, (py + y) / 2);
        px = cx; py = y;
      }
      ctx.lineTo(len, py); ctx.lineTo(len, 0); ctx.closePath(); ctx.fill();
    }
  });
}
function drawBars(now) {
  ctx.shadowColor = rgb(curP);
  ctx.shadowBlur = 12 * S.glowSize;
  ctx.globalAlpha = (0.55 + level * 0.45) * vis;
  eachEdge((len) => {
    const n = len > 1500 ? 72 : 56, slot = len / n, bw = Math.max(3, slot * 0.62);
    ctx.fillStyle = edgeGrad(len);
    for (let b = 0; b < n; b++) {
      const t = (b + 0.5) / n;
      const v = bands[Math.min(NB - 1, Math.floor(t * NB * 0.85))];
      const hgt = S.thickness * 1.2 + v * (70 + 90 * S.glowSize) + 3 * Math.sin(now / 400 + b);
      ctx.beginPath();
      ctx.roundRect(b * slot + (slot - bw) / 2, 0, bw, hgt, bw / 2);
      ctx.fill();
    }
  });
}
function drawAurora(now) {
  const time = now / 1000;
  ctx.globalCompositeOperation = 'lighter';
  const depth = (80 + level * 190) * S.glowSize + S.thickness * 3;
  eachEdge((len, i) => {
    for (let layer = 0; layer < 3; layer++) {
      const col = layer % 2 ? curS : curP;
      const g = ctx.createLinearGradient(0, 0, 0, depth);
      g.addColorStop(0, rgb(col, 0.55)); g.addColorStop(1, rgb(col, 0));
      ctx.fillStyle = g;
      ctx.globalAlpha = (0.5 + level * 0.4) * vis;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      for (let x = 0; x <= len; x += 14) {
        const t = x / len;
        const swell = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * (5 + layer * 2) + time * (0.55 + 0.25 * layer) + layer * 2 + i));
        ctx.lineTo(x, depth * swell * (0.75 + 0.5 * bandAt(t)));
      }
      ctx.lineTo(len, 0); ctx.closePath(); ctx.fill();
    }
  });
  ctx.globalCompositeOperation = 'source-over';
}
function drawCorners(now) {
  const w = canvas.width, h = canvas.height;
  const R = (220 + level * 420) * S.glowSize + S.thickness * 6;
  const corners = [[0, 0, curP], [w, 0, curS], [w, h, curP], [0, h, curS]];
  ctx.globalCompositeOperation = 'lighter';
  corners.forEach(([x, y, col], i) => {
    const pulse = 0.75 + 0.25 * Math.sin(now / 700 + i * 1.6);
    const g = ctx.createRadialGradient(x, y, 0, x, y, R * pulse);
    g.addColorStop(0, rgb(col, 0.85)); g.addColorStop(0.45, rgb(col, 0.3)); g.addColorStop(1, rgb(col, 0));
    ctx.globalAlpha = (0.5 + level * 0.5) * vis;
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
  ctx.globalCompositeOperation = 'source-over';
}
function drawGlow(now, raw) {
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  if (!S.glow || !S.here.glow || vis === 0) return;
  let energy = (!S.musicOnly || media.playing) ? raw : 0;
  if (energy < 0.03 && S.idleGlow) energy = 0.12 + 0.05 * Math.sin(now / 900);
  level = Math.max(energy, level * 0.88);
  const [tp, ts] = targetColors(now);
  for (let i = 0; i < 3; i++) { curP[i] = lerp(curP[i], tp[i], 0.06); curS[i] = lerp(curS[i], ts[i], 0.06); }
  ctx.save();
  switch (S.shape) {
    case 'rounded': drawClassic(now, true); break;
    case 'liquid': drawLiquid(now); break;
    case 'bars': drawBars(now); break;
    case 'aurora': drawAurora(now); break;
    case 'corners': drawCorners(now); break;
    default: drawClassic(now, false);
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

// ---------- record player ----------
let ang = 0, spin = 0, armA = -50, lastT = performance.now();
function updateDisc(now) {
  const dt = Math.min(0.1, (now - lastT) / 1000);
  lastT = now;
  const show = S.showDisc && (!media.none || S.editMode || S.preview);
  playerEl.style.opacity = show ? vis : 0;
  if (!show) return;
  const playing = !!media.playing;
  spin += ((playing ? 200 : 0) - spin) * Math.min(1, dt * 2.2);
  ang = (ang + spin * dt) % 360;
  recordEl.style.transform = `rotate(${ang.toFixed(2)}deg)`;
  armA += ((playing ? 0 : -50) - armA) * Math.min(1, dt * 3);
  armEl.setAttribute('transform', `rotate(${armA.toFixed(2)} 112 -6)`);
}

// ======================================================================
// lyrics
// ======================================================================
const KIN = new Set(['pop', 'rise', 'typewriter', 'wave', 'blur']);
const DEMO = [
  { t: 0, text: 'Wait another minute' },
  { t: 2800, text: 'Fire in my heart tonight' },
  { t: 5600, text: 'Dancing under the moon' },
  { t: 8400, text: 'Money cannot buy this love' },
  { t: 11200, text: 'Dreams are made of gold' },
  { t: 14000, text: '' },
];
const DEMO_LOOP = 15500;
const OPA = [1, 0.52, 0.32, 0.2, 0.14, 0.1, 0.08, 0.06, 0.05];

function position() {
  const base = media.playing ? media.posMs + (performance.now() - recvAt) : (media.posMs || 0);
  return base + S.offsetMs;
}

// ----- list styles: every line lives in a scrolling track, Spotify-style -----
let listL = null, lineEls = [];
let activeIdx = -2, activeWords = [], big = null, bigIdx = -2, activeStyle = '';
let trackY = 0, placed = false, lastRange = [0, -1], lastLayoutSig = '';

function fillPlain(rec) {
  rec.inn.textContent = '';
  for (const w of rec.words) { const s = document.createElement('span'); s.className = 'word'; s.textContent = w.text; rec.inn.appendChild(s); }
}
function buildList(L) {
  trackEl.textContent = '';
  lineEls = [];
  activeIdx = -2; activeWords = []; big = null; placed = false; lastRange = [0, -1]; lastLayoutSig = '';
  L.forEach((line, i) => {
    const el = document.createElement('div');
    el.className = 'ln' + (line.text ? '' : ' empty');
    const inn = document.createElement('div');
    inn.className = 'in';
    el.appendChild(inn);
    const rec = { el, inn, empty: !line.text, words: SK.lineWords(L, i) };
    if (!rec.empty) fillPlain(rec);
    trackEl.appendChild(el);
    lineEls.push(rec);
  });
  listL = L;
}
function deactivate() {
  const r = lineEls[activeIdx];
  if (r) { r.el.classList.remove('cur', 'kin', 'grad'); r.inn.style.transform = ''; if (!r.empty) fillPlain(r); }
  activeWords = []; big = null; bigIdx = -2;
}
function activate(idx, style) {
  deactivate();
  activeIdx = idx; activeStyle = style;
  const r = lineEls[idx];
  if (!r || r.empty) return;
  r.el.classList.add('cur', KIN.has(style) ? 'kin' : 'grad');
  r.inn.textContent = '';
  let host = r.inn;
  if (style === 'spotlight') {
    big = document.createElement('div'); big.className = 'big';
    host = document.createElement('div'); host.className = 'small';
    r.inn.appendChild(big); r.inn.appendChild(host);
  }
  for (const w of r.words) {
    const span = document.createElement('span');
    span.className = 'word';
    let chars = null;
    if (style === 'typewriter' || style === 'wave') {
      chars = [];
      for (const ch of w.text) { const c = document.createElement('span'); c.className = 'ch'; c.textContent = ch; span.appendChild(c); chars.push(c); }
    } else span.textContent = w.text;
    host.appendChild(span);
    activeWords.push({ el: span, chars, start: w.start, end: w.end, gi: w.gi, p: -1, last: '', s: null, n: -1 });
  }
}
function markSung(w, on) { if (w.s !== on) { w.s = on; w.el.classList.toggle('sung', on); } }
function setW(w, transform, opacity, filter) {
  const key = transform + '|' + opacity + '|' + filter;
  if (key === w.last) return;
  w.last = key;
  w.el.style.transform = transform; w.el.style.opacity = opacity; w.el.style.filter = filter;
}
function animateWord(w, pos, now, style) {
  const t = pos - w.start;
  const dur = Math.max(1, w.end - w.start);
  switch (style) {
    case 'pop': {
      const e = t < 0 ? 0 : easeOutBack(clamp01(t / 320));
      setW(w, `scale(${(0.3 + 0.7 * e).toFixed(3)})`, t < 0 ? 0 : clamp01(t / 140).toFixed(2), 'none');
      markSung(w, t >= 0); break;
    }
    case 'rise': {
      const e = t < 0 ? 0 : easeOutCubic(clamp01(t / 360));
      setW(w, `translateY(${((1 - e) * 0.75).toFixed(3)}em) rotate(${((1 - e) * 7).toFixed(2)}deg)`, e.toFixed(2), 'none');
      markSung(w, t >= 0); break;
    }
    case 'blur': {
      const e = t < 0 ? 0 : easeOutCubic(clamp01(t / 450));
      setW(w, `scale(${(1.12 - 0.12 * e).toFixed(3)})`, (0.18 + 0.82 * e).toFixed(2), `blur(${((1 - e) * 14).toFixed(1)}px)`);
      markSung(w, t >= 0); break;
    }
    case 'typewriter': {
      const len = w.chars.length;
      const n = t < 0 ? 0 : Math.min(len, Math.floor(t / (dur / len)) + 1);
      if (n !== w.n) { w.n = n; w.chars.forEach((c, i) => { c.style.opacity = i < n ? 1 : 0; }); }
      markSung(w, t >= 0); break;
    }
    case 'wave': {
      const amp = t >= 0 ? 0.16 : 0.05;
      for (let i = 0; i < w.chars.length; i++) w.chars[i].style.transform = `translateY(${(Math.sin(now / 230 + (w.gi + i) * 0.6) * amp).toFixed(3)}em)`;
      markSung(w, t >= 0); break;
    }
    default: {
      const p = clamp01(t / dur);
      if (Math.abs(p - w.p) > 0.01) { w.p = p; w.el.style.setProperty('--p', p); }
    }
  }
}
function layoutLines(idx) {
  const past = S.pastLines | 0, fut = S.futureLines | 0;
  const a = Math.max(0, Math.min(lastRange[0], idx - past - 1)), b = Math.min(lineEls.length - 1, Math.max(lastRange[1], idx + fut + 1));
  for (let i = a; i <= b; i++) {
    const r = lineEls[i];
    if (!r) continue;
    const d = i - idx;
    const inside = d < 0 ? -d <= past : d <= fut;
    if (!inside || r.empty) {
      r.el.classList.remove('vis'); r.el.style.opacity = 0;
      continue;
    }
    r.el.classList.add('vis');
    const k = Math.abs(d);
    r.el.style.opacity = OPA[Math.min(k, OPA.length - 1)];
    r.el.style.transform = d === 0 ? 'none' : 'scale(.86)';
    r.el.style.filter = S.lineBlur && d !== 0 ? `blur(${(k * 1.3).toFixed(1)}px)` : 'none';
  }
  lastRange = [Math.max(0, idx - past - 1), Math.min(lineEls.length - 1, idx + fut + 1)];
}

let dtLast = performance.now();
function updateList(L, pos, now, idx, style, demo) {
  if (L !== listL) buildList(L);
  trackEl.classList.toggle('sp', style === 'spotlight');
  stageEl.classList.toggle('fade', (S.pastLines | 0) + (S.futureLines | 0) > 0);
  const sig = [idx, style, S.pastLines, S.futureLines, S.lineBlur, S.lyricH, S.lyricW, S.fontSize, S.font, S.bold, S.lyricAlign].join('|');
  if (idx !== activeIdx || style !== activeStyle) activate(idx, style);
  if (sig !== lastLayoutSig) { lastLayoutSig = sig; layoutLines(idx); }

  for (const w of activeWords) animateWord(w, pos, now, style);
  const rec = lineEls[activeIdx];
  if (style === 'spotlight' && big) {
    let ai = -1;
    for (let i = 0; i < activeWords.length; i++) if (pos >= activeWords[i].start) ai = i;
    if (ai !== bigIdx) { bigIdx = ai; big.textContent = ai >= 0 ? activeWords[ai].el.textContent : ''; }
    if (ai >= 0) big.style.transform = `scale(${(1 + 0.4 * Math.exp(-(pos - activeWords[ai].start) / 170)).toFixed(3)})`;
  }
  if (style === 'beat' && rec && !rec.empty) {
    let e = Math.max(level, lastRaw);
    if (demo) e = Math.max(e, 0.55 * Math.pow(Math.max(0, Math.sin(now / 230)), 6));
    const jitter = e > 0.75 ? (Math.random() - 0.5) * 1.4 : 0;
    rec.inn.style.transform = `scale(${(1 + e * 0.2).toFixed(3)}) rotate(${jitter.toFixed(2)}deg)`;
  }
  // keep the current line in the middle of the box
  const cur = idx >= 0 ? lineEls[idx] : lineEls[0];
  if (cur) {
    const mid = cur.el.offsetTop + cur.el.offsetHeight / 2 + (idx < 0 ? cur.el.offsetHeight : 0);
    const target = S.lyricH / 2 - mid;
    const dt = Math.min(0.1, (now - dtLast) / 1000);
    if (!placed) { trackY = target; placed = true; } else trackY += (target - trackY) * (1 - Math.exp(-dt * 9));
    trackEl.style.transform = `translateY(${trackY.toFixed(1)}px)`;
  }
}

// ----- scene styles (scenes.js) -----
let scene = null, sceneKey = '', sceneL = null;
const NATIVE = new Set(['chat', 'money', 'map', 'notify', 'code', 'codeVisual']);
function ensureScene(L, style, demo) {
  if (scene && sceneL === L && sceneKey === style) return;
  if (scene && scene.destroy) scene.destroy();
  sceneEl.textContent = '';
  sceneEl.className = '';
  sceneEl.removeAttribute('style');
  sceneL = L; sceneKey = style;
  const env = {
    L, demo,
    S: () => S, W: () => S.lyricW, H: () => S.lyricH,
    media: () => media, level: () => level,
  };
  scene = SC[style](sceneEl, env);
  stageEl.classList.toggle('isScene', NATIVE.has(style));
}
function setMode(isScene) {
  trackEl.style.display = isScene ? 'none' : '';
  sceneEl.style.display = isScene ? '' : 'none';
  if (!isScene) {
    if (scene && scene.destroy) scene.destroy();
    scene = null; sceneKey = ''; stageEl.classList.remove('isScene');
  } else {
    listL = null;
  }
}

let lastRaw = 0;
function updateLyrics(now) {
  const real = lines && lines.length && !media.none;
  const demo = !real && (S.editMode || S.preview);
  const L = real ? lines : demo ? DEMO : null;
  if (!L) { lyricsEl.style.opacity = 0; return; }
  const style = S.lyricStyle || 'classic';
  const pos = real ? position() : now % DEMO_LOOP;
  lyricsEl.style.opacity = S.editMode ? (S.lyrics ? 1 : 0.35) : (S.lyrics ? vis : 0);
  if (!S.lyrics && !S.editMode) return;

  let idx = -1;
  { let lo = 0, hi = L.length - 1; while (lo <= hi) { const m = (lo + hi) >> 1; if (L[m].t <= pos) { idx = m; lo = m + 1; } else hi = m - 1; } }

  const isScene = !!SC[style];
  if (isScene === (trackEl.style.display === 'none')) { /* mode already right */ } else setMode(isScene);
  if (isScene) {
    ensureScene(L, style, demo);
    stageEl.classList.remove('fade');
    scene.update(pos, now, idx);
  } else {
    updateList(L, pos, now, idx, style, demo);
  }
  dtLast = now;
}

let accentTick = 0;
function frame(now) {
  requestAnimationFrame(frame);
  let raw = 0;
  if (S.here.audioOwner) {
    raw = readEnergy();
    checkStaleAudio(now, raw);
    if (S.here.multiScreen && now - lastRelayAt > 32) {
      lastRelayAt = now;
      for (let i = 0; i < NB; i++) relayBuf[i] = Math.round(clamp01(bands[i]) * 255);
      halo.send('audio-frame', { raw, bands: relayBuf });
    }
  } else if (S.here.glow || S.lyricStyle === 'beat') {
    if (now - remoteAt <= 250) raw = remoteRaw;
    else { for (let i = 0; i < NB; i++) bands[i] *= 0.9; }
  }
  lastRaw = raw;
  updateVis(now, raw);
  drawGlow(now, raw);
  updateDisc(now);
  updateLyrics(now);
  if ((S.rainbow || (S.useAlbum && albumColors)) && now - accentTick > 400) { accentTick = now; setAccent(); }
}
applyLayout();
setMode(false);
requestAnimationFrame(frame);
