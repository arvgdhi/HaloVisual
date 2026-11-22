'use strict';
const $ = (id) => document.getElementById(id);
let meta = null, st = null;
const updaters = [];

// ---------- tiny DOM helper ----------
function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) if (c != null) e.append(c.nodeType ? c : document.createTextNode(c));
  return e;
}
const S = () => st.settings;
const set = (patch) => { Object.assign(st.settings, patch); hs.set(patch); sync(); };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const fmtN = (v, step) => String(step < 1 ? +Number(v).toFixed(2) : Math.round(v));

// ---------- controls ----------
function mod(title, sub, ...rows) {
  return h('div', { class: 'mod' }, h('h2', null, title), sub ? h('p', null, sub) : null, rows);
}
function row(label, hint, control, block) {
  return h('div', { class: 'row' + (block ? ' block' : '') },
    h('div', { class: 'lab' }, label, hint ? h('span', null, hint) : null), control);
}
function toggle(key, disabled) {
  const inp = h('input', { type: 'checkbox', disabled: !!disabled });
  inp.addEventListener('change', () => set({ [key]: inp.checked }));
  updaters.push(() => { inp.checked = !!S()[key]; });
  return h('label', { class: 'sw' }, inp, h('i'));
}
// slider + number box. rmin/rmax = slider range, min/max = what the box accepts
function slider(key, o) {
  const r = h('input', { type: 'range', min: o.rmin ?? o.min, max: o.rmax ?? o.max, step: o.step });
  const n = h('input', { type: 'number', min: o.min, max: o.max, step: o.step, 'aria-label': o.label || key });
  const paint = () => { const lo = +r.min, hi = +r.max; r.style.setProperty('--pct', clamp((+r.value - lo) / (hi - lo), 0, 1) * 100 + '%'); };
  r.addEventListener('input', () => { paint(); set({ [key]: +r.value }); n.value = fmtN(r.value, o.step); });
  n.addEventListener('input', () => {
    const v = parseFloat(n.value);
    if (Number.isFinite(v) && v >= o.min && v <= o.max) { r.value = v; paint(); set({ [key]: v }); }
  });
  n.addEventListener('change', () => {
    let v = parseFloat(n.value);
    if (!Number.isFinite(v)) v = S()[key];
    v = clamp(Math.round(v / o.step) * o.step, o.min, o.max);
    n.value = fmtN(v, o.step); r.value = v; paint(); set({ [key]: v });
  });
  n.addEventListener('keydown', (e) => { if (e.key === 'Enter') n.blur(); });
  updaters.push(() => {
    const v = S()[key];
    if (!Number.isFinite(v)) return;
    if (document.activeElement !== r) r.value = v;
    if (document.activeElement !== n) n.value = o.zero && v === 0 ? o.zero : fmtN(v, o.step);
    paint();
  });
  return h('div', { class: 'fader' }, r, h('div', { class: 'lcd' }, n, h('u', null, o.unit || '')));
}
function seg(key, options) {
  const btns = options.map(([v, label]) => h('button', { type: 'button', onclick: () => set({ [key]: v }) }, label));
  updaters.push(() => btns.forEach((b, i) => b.setAttribute('aria-pressed', String(S()[key] === options[i][0]))));
  return h('div', { class: 'seg', role: 'group' }, btns);
}
function colorInput(get, put) {
  const c = h('input', { type: 'color', class: 'color' });
  c.addEventListener('input', () => put(c.value));
  updaters.push(() => { if (document.activeElement !== c) c.value = get(); });
  return c;
}
function chip(label, onclick, pressed, dotStyle) {
  const b = h('button', { type: 'button', class: 'chip', onclick }, dotStyle ? h('span', { class: 'dot', style: dotStyle }) : null, label);
  updaters.push(() => b.setAttribute('aria-pressed', String(!!pressed())));
  return b;
}


// ---------- font picker: scrolls, filters, and shows every font in its own face ----------
let fontNames = [];
const fontPickers = [];
function fontPicker() {
  const input = h('input', { type: 'text', spellcheck: 'false', placeholder: 'Search or type a font', autocomplete: 'off', role: 'combobox' });
  const caret = h('button', { type: 'button', class: 'caret', tabindex: '-1', 'aria-label': 'Show fonts' });
  const list = h('div', { class: 'fplist', role: 'listbox' });
  const wrap = h('div', { class: 'fp' }, input, caret, list);
  let hl = -1, shown = [];
  const esc = (n) => n.replace(/['"\\]/g, '');
  function render(filter) {
    const f = (filter || '').trim().toLowerCase();
    shown = fontNames.filter((n) => !f || n.toLowerCase().includes(f));
    list.textContent = '';
    if (!shown.length) list.append(h('div', { class: 'fpempty' }, f ? 'No match. Press Enter to use "' + filter.trim() + '" anyway.' : 'Loading fonts\u2026'));
    for (const n of shown) {
      const it = h('div', { class: 'fpi', role: 'option', style: `font-family:'${esc(n)}', 'Google Sans', sans-serif` }, n);
      it.setAttribute('aria-selected', String(n === S().font));
      it.addEventListener('mousedown', (e) => { e.preventDefault(); choose(n); });
      list.append(it);
    }
    hl = -1;
  }
  function open() {
    if (wrap.classList.contains('open')) return;
    wrap.classList.add('open');
    render('');
    const sel = list.querySelector('[aria-selected="true"]');
    if (sel) list.scrollTop = Math.max(0, sel.offsetTop - 100);
    loadLocalFonts();
  }
  function close() { wrap.classList.remove('open'); input.value = S().font; }
  function choose(n) { set({ font: n }); wrap.classList.remove('open'); input.value = n; input.blur(); }
  function move(d) {
    const items = list.querySelectorAll('.fpi');
    if (!items.length) return;
    if (items[hl]) items[hl].classList.remove('hl');
    hl = (hl + d + items.length) % items.length;
    items[hl].classList.add('hl'); items[hl].scrollIntoView({ block: 'nearest' });
  }
  input.addEventListener('focus', () => { input.select(); open(); });
  input.addEventListener('click', open);
  caret.addEventListener('mousedown', (e) => { e.preventDefault(); if (wrap.classList.contains('open')) { close(); input.blur(); } else { input.focus(); } });
  input.addEventListener('input', () => { wrap.classList.add('open'); render(input.value); });
  input.addEventListener('blur', close);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); open(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter') {
      const items = list.querySelectorAll('.fpi');
      if (items[hl]) choose(items[hl].textContent);
      else if (input.value.trim()) choose(input.value.trim());
    } else if (e.key === 'Escape') { close(); input.blur(); }
  });
  updaters.push(() => { if (document.activeElement !== input) input.value = S().font; });
  fontPickers.push({ refresh: () => { if (wrap.classList.contains('open')) render(input.value === S().font ? '' : input.value); } });
  return wrap;
}
let localFontsTried = false;
async function loadLocalFonts() {
  if (localFontsTried) return;
  localFontsTried = true;
  try {
    if (!window.queryLocalFonts) return;
    const all = await window.queryLocalFonts();       // Chromium's own list: every font listed here can be drawn
    const fam = [...new Set(all.map((f) => f.family))].sort((a, b) => a.localeCompare(b));
    if (fam.length) { fontNames = fam; fontPickers.forEach((p) => p.refresh()); }
  } catch (e) { /* permission refused: keep the list Windows gave us */ }
}

// ---------- thumbnails for the style gallery ----------
const T = (inner) => `<div class="th">${inner}</div>`;
function waveLetters(word) {
  return [...word].map((c, i) => `<span style="display:inline-block;transform:translateY(${(Math.sin(i * 1.1) * 5).toFixed(1)}px)">${c}</span>`).join('');
}
function webSvg() {
  let s = '<svg viewBox="0 0 190 112"><g stroke="#fff" fill="none" stroke-linecap="round">';
  const cx = 95, cy = 56, n = 7;
  for (let j = 0; j < n; j++) { const a = -Math.PI / 2 + (j * 2 * Math.PI) / n; s += `<line x1="${cx}" y1="${cy}" x2="${(cx + Math.cos(a) * 46).toFixed(1)}" y2="${(cy + Math.sin(a) * 46).toFixed(1)}" stroke-opacity=".8" stroke-width="1.3"/>`; }
  for (const r of [12, 22, 32, 44]) {
    let d = '';
    for (let j = 0; j < n; j++) {
      const a1 = -Math.PI / 2 + (j * 2 * Math.PI) / n, a2 = -Math.PI / 2 + ((j + 1) * 2 * Math.PI) / n, am = (a1 + a2) / 2;
      const x1 = cx + Math.cos(a1) * r, y1 = cy + Math.sin(a1) * r, x2 = cx + Math.cos(a2) * r, y2 = cy + Math.sin(a2) * r;
      const cr = r * Math.cos(Math.PI / n) * 0.82;
      d += `${j ? '' : 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1)} Q${(cx + Math.cos(am) * cr).toFixed(1)} ${(cy + Math.sin(am) * cr).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)} `;
    }
    s += `<path d="${d}" stroke-opacity=".5" stroke-width="1"/>`;
  }
  return s + '</g></svg>';
}
const STAR = (x, y, s) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0-6 L1.4-1.4 L6 0 L1.4 1.4 L0 6 L-1.4 1.4 L-6 0 L-1.4-1.4Z" fill="#fff"/>`;
const THUMBS = {
  classic: () => T('<div><span>Each word</span> <span class="dim">fills in</span></div>'),
  pop: () => T('<div style="display:flex;align-items:baseline;gap:5px"><span style="font-size:.85em">Words</span><span style="font-size:1.45em">pop</span><span style="font-size:1em">in</span></div>'),
  rise: () => T('<div style="display:flex;gap:6px"><span style="transform:translateY(5px) rotate(-6deg)">Words</span><span style="transform:translateY(-4px) rotate(3deg)">float</span><span>up</span></div>'),
  typewriter: () => T('<div>Type it out<span class="caret"></span></div>'),
  wave: () => T(`<div>${waveLetters('Ripple like')}<br><span style="display:block;text-align:center">${waveLetters('a wave')}</span></div>`),
  beat: () => T('<div style="position:relative;display:grid;place-items:center"><span style="position:absolute;width:110px;height:50px;border-radius:50%;box-shadow:0 0 0 6px rgba(255,255,255,.08),0 0 0 14px rgba(255,255,255,.04)"></span><span style="font-size:1.25em;position:relative">Feel it</span></div>'),
  blur: () => T('<div style="display:flex;gap:6px"><span>Sharp</span><span style="filter:blur(1.6px);opacity:.7">then</span><span style="filter:blur(3.4px);opacity:.45">blur</span></div>'),
  spotlight: () => T('<div class="stack"><span class="sm">Wait another minute</span><span style="font-size:2em;font-weight:800">another</span></div>'),

  ship: () => T('<div style="perspective:260px"><div style="transform:rotateY(-22deg) rotateX(6deg);display:flex;flex-direction:column;gap:2px;align-items:center;transform-style:preserve-3d"><span style="transform:translateZ(-40px);opacity:.45">words</span><span style="transform:translateZ(0)">land on a</span><span style="font-size:1.4em;transform:translateZ(36px);text-shadow:0 0 12px rgba(139,108,255,.8)">wall</span></div></div>'),
  fisheye: () => T('<div class="stack" style="gap:1px"><span class="sm" style="transform:scaleY(.7)">tight</span><span style="font-size:1.9em;background:linear-gradient(90deg,#8b6cff,#ff5fb0);-webkit-background-clip:text;color:transparent;font-weight:800">lens</span><span class="sm" style="transform:scaleY(.7)">stack</span></div>'),
  visual: () => T('<div class="stack"><span style="font-size:.72em;font-style:italic;font-weight:600">wait ⏳</span><span style="font-size:1.9em;font-weight:900;letter-spacing:-.02em">another</span><span class="pillw" style="font-size:.95em;margin-top:2px">minute</span></div>'),
  fisheyeVisual: () => T('<div class="stack" style="gap:1px"><span class="sm" style="transform:scaleY(.7)">🌙 night</span><span style="font-size:1.7em;font-weight:800;background:linear-gradient(90deg,#8b6cff,#ff5fb0);-webkit-background-clip:text;color:transparent">❤️ heart</span><span class="sm" style="transform:scaleY(.7)">🔥 fire</span></div>'),

  code: () => T('<div class="code"><i class="gr">1</i> <i class="f">sing</i>(<i class="s">"wait"</i>);<br><i class="gr">2</i> <i class="k">const</i> line = <i class="s">"minu<span class="caret redcaret"></span>"</i></div>'),
  codeVisual: () => T('<div class="code"><i class="gr">1</i> <i class="f">sing</i>(<i class="s">"wait ⏳ another"</i>);<br><i class="gr">2</i> <i class="k">const</i> line = <i class="s">"minu<span class="caret redcaret"></span>"</i></div>'),
  branches: () => T('<svg viewBox="0 0 190 112"><path d="M6 66 C36 36 58 92 95 62 S150 38 184 56" stroke="#8b6cff" stroke-width="3" fill="none" stroke-linecap="round"/><g fill="#fff" stroke="#8b6cff" stroke-width="2"><circle cx="38" cy="58" r="4"/><circle cx="95" cy="62" r="4"/><circle cx="148" cy="46" r="4"/></g><g stroke="#ff5fb0" stroke-width="2" fill="none" stroke-linecap="round"><path d="M38 58 q8 12 14 20"/><path d="M95 62 q6 -10 14 -18"/></g><g fill="#fff" font-size="10" font-weight="700" text-anchor="middle"><text x="38" y="46">wait</text><text x="95" y="82">another</text><text x="148" y="34">minute</text></g></svg>'),
  web: () => T(webSvg()),
  constellation: () => T(`<svg viewBox="0 0 190 112"><polyline points="30,78 68,44 112,70 156,34" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.2"/>${STAR(30, 78, 1)}${STAR(68, 44, 1.2)}${STAR(112, 70, 1)}${STAR(156, 34, 1.3)}<g fill="#fff" font-size="9" font-weight="700" text-anchor="middle"><text x="30" y="94">wait</text><text x="68" y="62">another</text><text x="112" y="88">minute</text></g><g fill="#fff" opacity=".4"><circle cx="20" cy="20" r="1"/><circle cx="90" cy="18" r="1"/><circle cx="170" cy="90" r="1"/><circle cx="140" cy="100" r="1"/></g></svg>`),

  chat: () => T('<div class="bub" style="left:12%;top:20px;background:#3a3a40">Wait another minute</div><div class="bub" style="right:12%;top:52px;background:#0b84fe">Fire in my heart</div><div class="bub" style="left:12%;top:84px;background:#3a3a40;letter-spacing:2px">•••</div>'),
  money: () => T('<div class="row2" style="top:16px"><em style="background:#ff6b6b"></em>Another minute<u>+$24</u></div><div class="row2" style="top:48px;opacity:.8"><em style="background:#51cf66"></em>Fire in my heart<u>+$6</u></div><div class="row2" style="top:80px;opacity:.55"><em style="background:#339af0"></em>The moon<u>+$48</u></div>'),
  map: () => T('<div class="mapbg"></div><svg viewBox="0 0 190 112"><path d="M10 96 H60 V64 H112 V34 H150" stroke="#4285f4" stroke-width="4" fill="none" stroke-linejoin="round"/><path d="M150 34 m-6 -2 a6 6 0 1 1 12 0 c0 5 -6 10 -6 10 c0 0 -6 -5 -6 -10z" fill="#ea4335" transform="translate(0 -4)"/><circle cx="60" cy="64" r="3" fill="#ea4335"/></svg><div class="bub" style="left:50%;top:6px;transform:translateX(-10%);background:#fff;color:#1f2430;font-weight:700;font-size:10px">Another minute</div>'),
  notify: () => T('<div style="position:absolute;inset:0;background:linear-gradient(165deg,#2c2a7a,#b24a8d 60%,#f29a5c)"></div><div style="position:absolute;top:8px;width:100%;text-align:center;font-size:22px;font-weight:700">9:41</div><div class="notif" style="top:44px;opacity:.5;transform:scale(.92) translateY(6px)"></div><div class="notif" style="top:42px">Messages<br><span style="font-weight:500;opacity:.8">Another minute</span></div><div style="position:absolute;left:9%;right:9%;bottom:8px;height:22px;border-radius:9px;background:rgba(30,30,38,.6)"></div>'),
};
const GROUP_NOTE = {
  'Lyric lines': 'Classic karaoke and its variations',
  'Kinetic type': 'Words that move as a scene',
  'Motion scenes': 'Each line becomes a small animation',
  'Native design': 'Keep their own colours, light or dark',
};
const GROUP_CLASS = { 'Lyric lines': 'g-lines', 'Kinetic type': 'g-kinetic', 'Motion scenes': 'g-motion', 'Native design': 'g-native' };

function buildStyles(sec) {
  sec.textContent = '';
  sec.append(h('h1', null, 'Styles'), h('p', { class: 'lede' }, 'Pick how the words move. While this window is open, your screen shows a sample song so you can see each style.'));
  const groups = [...new Set(meta.styles.map((s) => s.group))];
  for (const g of groups) {
    sec.append(h('div', { class: 'gal-head' }, h('h2', null, g), h('span', null, GROUP_NOTE[g] || '')));
    if (g === 'Native design') sec.append(h('div', { class: 'theme-row' }, 'Theme for Messages, Payments and Map', seg('nativeTheme', [['dark', 'Dark'], ['light', 'Light']])));
    const grid = h('div', { class: 'gal ' + GROUP_CLASS[g] });
    for (const s of meta.styles.filter((x) => x.group === g)) {
      const card = h('button', { type: 'button', class: 'card', onclick: () => set({ lyricStyle: s.id }) },
        h('div', { html: (THUMBS[s.id] || (() => T(s.name)))() }),
        h('div', { class: 'meta' }, h('b', null, s.name), h('span', null, s.desc)),
        h('div', { class: 'tick' }, '✓'));
      updaters.push(() => card.setAttribute('aria-pressed', String(S().lyricStyle === s.id)));
      grid.append(card);
    }
    sec.append(grid);
  }
}

function buildLyrics(sec) {
  sec.textContent = '';
  const fontIn = fontPicker();
  const prev = h('div', { class: 'preview-line' }, 'The quick brown fox jumps over the lazy dog');
  updaters.push(() => {
    prev.style.fontFamily = `'${S().font}', 'Segoe UI', sans-serif`;
    prev.style.fontWeight = S().bold ? 700 : 500;
  });
  const colorChips = meta.lyricColors.map(([label, v]) => chip(label, () => set({ lyricColor: v }), () => S().lyricColor === v,
    v === 'white' ? 'background:#fff' : v === 'album' ? 'background:conic-gradient(#ff6bb5,#4fe3ff,#ffe14f,#ff6bb5)' : `background:${v}`));
  const custom = colorInput(() => (/^#/.test(S().lyricColor) ? S().lyricColor : '#ffffff'), (v) => set({ lyricColor: v }));
  sec.append(
    h('h1', null, 'Lyrics'), h('p', { class: 'lede' }, 'Font, size, colour and how many lines you see at once.'),
    mod('Text', null,
      row('Font', 'Every font installed on this PC, shown in its own style', fontIn),
      h('div', { class: 'row block' }, prev),
      row('Bold', null, toggle('bold')),
      row('Size', 'Also changes with the scroll wheel in edit mode', slider('fontSize', { rmin: 18, rmax: 96, min: 12, max: 240, step: 1, unit: 'px', label: 'Text size' })),
      row('Alignment', null, seg('lyricAlign', [['left', 'Left'], ['center', 'Centre'], ['right', 'Right']])),
      row('Colour', 'Native design styles keep their own colours', h('div', { class: 'chips' }, colorChips, custom), true)),
    mod('Lines', 'Show the lines around the current one, like Spotify.',
      row('Lines before', null, slider('pastLines', { min: 0, max: 8, step: 1 })),
      row('Lines after', null, slider('futureLines', { min: 0, max: 8, step: 1 })),
      row('Blur distant lines', null, toggle('lineBlur'))),
    mod('Box', 'The area the lyrics live in. You can also drag the squares around it in edit mode.',
      row('Width', null, slider('lyricW', { rmin: 240, rmax: 1600, min: 120, max: 3000, step: 1, unit: 'px' })),
      row('Height', null, slider('lyricH', { rmin: 80, rmax: 800, min: 40, max: 1500, step: 1, unit: 'px' })),
      row('Best size for this style', null, h('button', { class: 'btn', type: 'button', onclick: () => hs.act('fit-box') }, 'Fit box to style'))),
    mod('Timing', 'If the words run early or late, nudge them here.',
      row('Offset', 'Positive moves lyrics later', slider('offsetMs', { rmin: -3000, rmax: 3000, min: -8000, max: 8000, step: 50, unit: 'ms' }))),
  );
}

function buildGlow(sec) {
  sec.textContent = '';
  const shapeChips = meta.shapes.map(([id, label]) => chip(label, () => set({ shape: id }), () => S().shape === id));
  const custom = S().primary;
  const palChips = meta.palettes.map(([label, a, b]) => chip(label,
    () => set({ primary: a, secondary: b }),
    () => !S().rainbow && !S().useAlbum && S().primary.toLowerCase() === a && S().secondary.toLowerCase() === b,
    `background:linear-gradient(135deg,${a},${b})`));
  const albumChip = chip('Match album art', () => set({ useAlbum: true, rainbow: false }), () => S().useAlbum && !S().rainbow, 'background:conic-gradient(#ff6bb5,#4fe3ff,#ffe14f,#ff6bb5)');
  const rainChip = chip('Rainbow', () => set({ rainbow: true }), () => S().rainbow, 'background:linear-gradient(90deg,#f66,#fc3,#6f9,#4cf,#a6f)');
  const scr = h('div', { class: 'chips' });
  sec.append(
    h('h1', null, 'Glow'), h('p', { class: 'lede' }, 'The light around your screen edges, reacting to whatever is playing.'),
    mod('Edge glow', null,
      row('Show glow', null, toggle('glow')),
      row('Keep a soft glow when quiet', null, toggle('idleGlow')),
      row('Shape', null, h('div', { class: 'chips' }, shapeChips), true),
      row('Thickness', null, slider('thickness', { rmin: 1, rmax: 30, min: 1, max: 60, step: 1, unit: 'px' })),
      row('Spread', 'How far the light reaches', slider('glowSize', { rmin: 0.2, rmax: 3, min: 0.1, max: 5, step: 0.05, unit: '×' }))),
    mod('Colour', null,
      row('Colour source', null, h('div', { class: 'chips' }, albumChip, rainChip, palChips), true),
      row('Your own two colours', 'Picking one switches to custom', h('div', { class: 'pair' },
        colorInput(() => S().primary, (v) => set({ primary: v })), colorInput(() => S().secondary, (v) => set({ secondary: v }))))),
    mod('Screens', 'Choose which screens get the glow. Lyrics and the record live wherever you put them.', row('Show glow on', null, scr, true)),
  );
  // screens are rebuilt whenever the display list changes
  updaters.push(() => {
    const key = st.displays.map((d) => d.id + d.label).join('|');
    if (scr.dataset.key !== key) {
      scr.dataset.key = key; scr.textContent = '';
      for (const d of st.displays) {
        const b = h('button', { type: 'button', class: 'chip', onclick: () => {
          const all = st.displays.map((x) => x.id);
          const cur = Array.isArray(S().glowDisplays) ? S().glowDisplays : all;
          let next = cur.includes(d.id) ? cur.filter((x) => x !== d.id) : [...cur, d.id];
          set({ glowDisplays: next.length === all.length ? null : next });
        } }, d.label);
        b.dataset.id = d.id;
        scr.append(b);
      }
    }
    const gd = S().glowDisplays;
    for (const b of scr.children) b.setAttribute('aria-pressed', String(!Array.isArray(gd) || gd.includes(+b.dataset.id)));
  });
}

function buildRecord(sec) {
  sec.textContent = '';
  sec.append(
    h('h1', null, 'Record'), h('p', { class: 'lede' }, 'A spinning record with the album cover as its label. It spins while music plays.'),
    mod('Record player', null,
      row('Show record', null, toggle('showDisc')),
      row('Size', null, slider('discSize', { rmin: 100, rmax: 500, min: 60, max: 1000, step: 1, unit: 'px' })),
      row('Rotation', null, slider('discRot', { min: -180, max: 180, step: 1, unit: '°' }))),
  );
}

function buildLayout(sec) {
  sec.textContent = '';
  sec.append(
    h('h1', null, 'Layout'), h('p', { class: 'lede' }, 'Where things sit, and how they behave around your windows.'),
    mod('Place things on screen', 'Drag the lyrics and the record anywhere, including onto another screen. Drag the squares to resize the lyric box.',
      row('Edit layout', 'Or press Ctrl+Alt+L anywhere', h('button', { class: 'btn', type: 'button', id: 'edit2', onclick: () => hs.act('toggle-edit') }, 'Edit on screen')),
      row('Lyrics rotation', null, slider('lyricRot', { min: -180, max: 180, step: 1, unit: '°' })),
      row('Reset positions', 'Puts both back to their starting places', h('button', { class: 'btn', type: 'button', onclick: () => hs.act('reset-layout') }, 'Reset'))),
    mod('Behaviour', null,
      row('Layer', 'Desktop keeps everything behind your apps', seg('layer', [['desktop', 'Behind apps'], ['top', 'Above apps']])),
      row('Fade after pause', 'Seconds of silence before everything fades. 0 keeps it visible.', slider('fadeSec', { rmin: 0, rmax: 60, min: 0, max: 300, step: 1, unit: 's', zero: 'never' }))),
  );
}

function buildGeneral(sec) {
  sec.textContent = '';
  const ver = h('span', null, '');
  updaters.push(() => { ver.textContent = 'Version ' + st.version; });
  sec.append(
    h('h1', null, 'General'), h('p', { class: 'lede' }, 'Startup, shortcuts and quitting.'),
    mod('Startup', null,
      row('Start Halo with Windows', st.packaged ? null : 'Available in the installed version (npm run dist)', toggle('startWithWindows', !st.packaged))),
    mod('Shortcuts', 'These work from anywhere in Windows.',
      row('Edit layout on screen', null, h('kbd', null, 'Ctrl + Alt + L')),
      row('Quit Halo', null, h('kbd', null, 'Ctrl + Alt + Q')),
      row('Leave edit mode', null, h('kbd', null, 'Esc'))),
    mod('About', 'Lyrics from LRCLIB, covers from Windows with an iTunes fallback. Audio is captured as loopback only; nothing is saved and the microphone is never used.',
      row(ver, null, h('button', { class: 'btn danger', type: 'button', onclick: () => hs.act('quit') }, 'Quit Halo'))),
  );
}

// ---------- shell ----------
function sync() {
  for (const u of updaters) u();
  const on = !!st.editMode;
  const b = $('edit');
  b.textContent = on ? 'Done editing' : 'Edit on screen';
  b.classList.toggle('on', on);
  $('editnote').textContent = on ? 'Drag on your screen. Esc or Ctrl+Alt+L to finish.' : 'Drag the lyrics and the record where you want them.';
  const e2 = $('edit2');
  if (e2) e2.textContent = on ? 'Done editing' : 'Edit on screen';
}
function fillFonts() {
  if (!localFontsTried || !fontNames.length) fontNames = meta.fonts.slice();
  fontPickers.forEach((p) => p.refresh());
}
function showTab(name) {
  for (const s of document.querySelectorAll('main > section')) s.classList.toggle('show', s.id === 'tab-' + name);
  for (const n of document.querySelectorAll('.nav')) { if (n.dataset.tab === name) n.setAttribute('aria-current', 'page'); else n.removeAttribute('aria-current'); }
  $('tab-' + name).parentElement.scrollTop = 0;
  try { sessionStorage.setItem('tab', name); } catch { /* ignore */ }
}
function build() {
  updaters.length = 0;
  buildStyles($('tab-styles')); buildLyrics($('tab-lyrics')); buildGlow($('tab-glow'));
  buildRecord($('tab-record')); buildLayout($('tab-layout')); buildGeneral($('tab-general'));
  fillFonts();
  sync();
}
document.querySelectorAll('.nav').forEach((n) => n.addEventListener('click', () => showTab(n.dataset.tab)));
$('edit').addEventListener('click', () => hs.act('toggle-edit'));

hs.init().then(({ meta: m, state }) => {
  meta = m; st = state;
  build();
  let tab = 'styles';
  try { tab = sessionStorage.getItem('tab') || 'styles'; } catch { /* ignore */ }
  showTab(document.getElementById('tab-' + tab) ? tab : 'styles');
});
hs.onState((s) => { st = s; if (meta) sync(); });
hs.onMeta((m) => { meta = m; fillFonts(); });
