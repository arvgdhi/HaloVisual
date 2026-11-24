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

// ---------- iOS squircle row icons ----------
const ICONS = {
  font: '<path d="M5 18L12 5l7 13M7.5 14h9"/>',
  bold: '<path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z"/>',
  size: '<path d="M4 17l4-10 4 10M5.5 14h5M15 9v9M12.5 12.5L15 9l2.5 3.5"/>',
  align: '<path d="M4 6h16M4 10h11M4 14h16M4 18h11"/>',
  palette: '<circle cx="12" cy="12" r="8.5"/><circle cx="9.5" cy="9.5" r="1"/><circle cx="14.5" cy="9.5" r="1"/><circle cx="15" cy="14" r="1"/>',
  lines: '<path d="M4 7h16M6 12h12M8 17h8"/>',
  blur: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4" opacity=".6"/><circle cx="12" cy="12" r="1.5"/>',
  box: '<rect x="4" y="5" width="16" height="14" rx="2.5"/><path d="M8 9h8M8 13h5"/>',
  fit: '<path d="M4 9V5h4M16 5h4v4M20 15v4h-4M8 19H4v-4"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5l3.2 2"/>',
  glow: '<rect x="3.5" y="5" width="17" height="14" rx="3.5"/><rect x="7" y="8.5" width="10" height="7" rx="1.5" opacity=".55"/>',
  sparkle: '<path d="M12 3l1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7z"/>',
  shape: '<rect x="4" y="4" width="7" height="7" rx="2"/><circle cx="16.5" cy="7.5" r="3.5"/><path d="M4 19l4-6 4 6z"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
  thickness: '<path d="M4 7h16" stroke-width="1.5"/><path d="M4 12h16" stroke-width="2.5"/><path d="M4 17.5h16" stroke-width="3.6"/>',
  spread: '<path d="M4 12h16M7 9l-3 3 3 3M17 9l3 3-3 3"/>',
  screen: '<rect x="3" y="4.5" width="18" height="12" rx="2"/><path d="M8 20h8M12 16.5V20"/>',
  disc: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.8"/>',
  rotate: '<path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4v4.5h-4.5"/>',
  move: '<path d="M12 3v18M3 12h18M12 3l-2.5 2.5M12 3l2.5 2.5M12 21l-2.5-2.5M12 21l2.5-2.5M3 12l2.5-2.5M3 12l2.5 2.5M21 12l-2.5-2.5M21 12l-2.5 2.5"/>',
  reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3.5V8h4.5"/>',
  layers: '<path d="M12 4l8 4.5-8 4.5-8-4.5z"/><path d="M4 12.5l8 4.5 8-4.5M4 16.5l8 4.5 8-4.5"/>',
  fade: '<circle cx="12" cy="12" r="8.5" stroke-dasharray="3 2.5"/><path d="M12 8v4l2.5 1.5"/>',
  music: '<path d="M9 17.5V6.5l10-2v11"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="15.5" r="2.5"/>',
  power: '<path d="M12 3v8M6.3 6.3a8 8 0 1 0 11.4 0"/>',
  keyboard: '<rect x="3" y="6" width="18" height="12" rx="2.5"/><path d="M7 10h1M11 10h2M16 10h1M7 14h10"/>',
  update: '<path d="M12 4v10M8 10l4 4 4-4M5 19h14"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
  bolt: '<path d="M13 2L4.5 13.5h6.5L10 22l9.5-11.5h-6.5z"/>',
  fullscreen: '<path d="M4 9V5h4M16 5h4v4M20 15v4h-4M8 19H4v-4"/><rect x="8" y="8" width="8" height="8" rx="1.5"/>',
  maximize: '<rect x="4" y="4" width="16" height="16" rx="2.5"/><path d="M4 9h16"/>',
  battery: '<rect x="3" y="7" width="16" height="10" rx="2"/><path d="M21 10.5v3M7 10.5v3M10.5 10.5v3"/>',
  fps: '<circle cx="12" cy="13" r="8"/><path d="M12 13l3.5-3.5M9 3h6"/>',
  resolution: '<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><path d="M8 12h8M12 8.5v7"/>',
  lite: '<path d="M19 5c-6 0-11 3-13 10l-2 4 4-2c7-2 11-7 11-12z"/><path d="M6 15c3-3 6-5 10-7"/>',
  audio: '<path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4"/>',
  pause: '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>',
};
function ico(name, bg) {
  return h('span', { class: 'ri', style: `background:${bg}`, html: `<svg viewBox="0 0 24 24">${ICONS[name] || ''}</svg>` });
}

// ---------- controls ----------
function mod(title, sub, ...rows) {
  return h('div', { class: 'mod' }, h('h2', null, title), sub ? h('p', null, sub) : null, rows);
}
function row(label, hint, control, block, icon) {
  return h('div', { class: 'row' + (block ? ' block' : '') + (icon ? ' has-ico' : '') },
    icon || null,
    h('div', { class: 'lab' }, label, hint ? h('span', null, hint) : null),
    control ? h('div', { class: 'ctl' }, control) : null);
}
function toggle(key, disabled) {
  const inp = h('input', { type: 'checkbox', role: 'switch', switch: '', disabled: !!disabled });
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

// ---------- font picker ----------
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
    const all = await window.queryLocalFonts();
    const fam = [...new Set(all.map((f) => f.family))].sort((a, b) => a.localeCompare(b));
    if (fam.length) { fontNames = fam; fontPickers.forEach((p) => p.refresh()); }
  } catch (e) { /* keep system list */ }
}

// ---------- thumbnails for style galleries ----------
const T = (inner) => `<div class="th">${inner}</div>`;
function waveLetters(word) {
  return [...word].map((c, i) => `<span style="display:inline-block;transform:translateY(${(Math.sin(i * 1.1) * 5).toFixed(1)}px)">${c}</span>`).join('');
}
function webSvg() {
  let s = '<svg viewBox="0 0 190 120"><g stroke="#fff" fill="none" stroke-linecap="round">';
  const cx = 95, cy = 60, n = 7;
  for (let j = 0; j < n; j++) { const a = -Math.PI / 2 + (j * 2 * Math.PI) / n; s += `<line x1="${cx}" y1="${cy}" x2="${(cx + Math.cos(a) * 48).toFixed(1)}" y2="${(cy + Math.sin(a) * 48).toFixed(1)}" stroke-opacity=".8" stroke-width="1.4"/>`; }
  for (const r of [12, 23, 34, 46]) {
    let d = '';
    for (let j = 0; j < n; j++) {
      const a1 = -Math.PI / 2 + (j * 2 * Math.PI) / n, a2 = -Math.PI / 2 + ((j + 1) * 2 * Math.PI) / n, am = (a1 + a2) / 2;
      const x1 = cx + Math.cos(a1) * r, y1 = cy + Math.sin(a1) * r, x2 = cx + Math.cos(a2) * r, y2 = cy + Math.sin(a2) * r;
      const cr = r * Math.cos(Math.PI / n) * 0.82;
      d += `${j ? '' : 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1)} Q${(cx + Math.cos(am) * cr).toFixed(1)} ${(cy + Math.sin(am) * cr).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)} `;
    }
    s += `<path d="${d}" stroke-opacity=".55" stroke-width="1.1"/>`;
  }
  return s + '</g></svg>';
}
const STAR = (x, y, s) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0-6 L1.4-1.4 L6 0 L1.4 1.4 L0 6 L-1.4 1.4 L-6 0 L-1.4-1.4Z" fill="#fff"/>`;
const THUMBS = {
  classic: () => T('<div style="padding:0 12px;text-align:center"><span>Each word</span> <span class="dim">fills in</span></div>'),
  pop: () => T('<div style="display:flex;align-items:baseline;gap:6px"><span style="font-size:.9em">Words</span><span style="font-size:1.5em;color:#5ac8fa">pop</span><span style="font-size:1em">in</span></div>'),
  rise: () => T('<div style="display:flex;gap:7px"><span style="transform:translateY(5px) rotate(-6deg)">Words</span><span style="transform:translateY(-4px) rotate(3deg)">float</span><span>up</span></div>'),
  typewriter: () => T('<div>Type it out<span class="caret"></span></div>'),
  wave: () => T(`<div>${waveLetters('Ripple like')}<br><span style="display:block;text-align:center">${waveLetters('a wave')}</span></div>`),
  beat: () => T('<div style="position:relative;display:grid;place-items:center"><span style="position:absolute;width:116px;height:52px;border-radius:50%;box-shadow:0 0 0 6px rgba(255,255,255,.09),0 0 0 15px rgba(255,255,255,.04)"></span><span style="font-size:1.3em;position:relative">Feel it</span></div>'),
  blur: () => T('<div style="display:flex;gap:7px"><span>Sharp</span><span style="filter:blur(1.6px);opacity:.7">then</span><span style="filter:blur(3.4px);opacity:.45">blur</span></div>'),
  spotlight: () => T('<div class="stack"><span class="sm">Wait another minute</span><span style="font-size:2.05em;font-weight:800">another</span></div>'),

  ship: () => T('<div style="perspective:260px"><div style="transform:rotateY(-22deg) rotateX(6deg);display:flex;flex-direction:column;gap:2px;align-items:center;transform-style:preserve-3d"><span style="transform:translateZ(-40px);opacity:.5">words</span><span style="transform:translateZ(0)">land on a</span><span style="font-size:1.45em;transform:translateZ(36px);text-shadow:0 0 12px rgba(139,108,255,.85)">wall</span></div></div>'),
  fisheye: () => T('<svg viewBox="0 0 190 120"><defs><linearGradient id="fe-g" x1="0" x2="1"><stop offset="0%" stop-color="#8b6cff"/><stop offset="100%" stop-color="#ff5fb0"/></linearGradient><path id="fe-top" d="M22 42 Q95 14 168 42"/><path id="fe-bot" d="M22 80 Q95 108 168 80"/></defs><ellipse cx="95" cy="60" rx="78" ry="50" fill="rgba(255,255,255,.03)" stroke="#fff" stroke-opacity=".18" stroke-width="1"/><text font-size="11" font-weight="600" fill="#fff" opacity=".62" text-anchor="middle"><textPath href="#fe-top" startOffset="50%">another minute</textPath></text><text x="95" y="68" font-size="27" font-weight="900" fill="url(#fe-g)" text-anchor="middle" letter-spacing="-.02em">LENS</text><text font-size="11" font-weight="600" fill="#fff" opacity=".62" text-anchor="middle"><textPath href="#fe-bot" startOffset="50%">under the moon</textPath></text></svg>'),
  visual: () => T('<div class="stack"><span style="font-size:.75em;font-style:italic;font-weight:600">wait ⏳</span><span style="font-size:1.95em;font-weight:900;letter-spacing:-.02em">another</span><span class="pillw" style="font-size:.95em;margin-top:3px">minute</span></div>'),
  fisheyeVisual: () => T('<svg viewBox="0 0 190 120"><defs><linearGradient id="fev-g" x1="0" x2="1"><stop offset="0%" stop-color="#8b6cff"/><stop offset="100%" stop-color="#ff5fb0"/></linearGradient><path id="fev-top" d="M20 42 Q95 14 170 42"/><path id="fev-bot" d="M20 80 Q95 108 170 80"/></defs><ellipse cx="95" cy="60" rx="78" ry="50" fill="rgba(255,255,255,.03)" stroke="#fff" stroke-opacity=".18" stroke-width="1"/><text font-size="10.5" font-weight="600" fill="#fff" opacity=".62" text-anchor="middle"><textPath href="#fev-top" startOffset="50%">🌙 night sky</textPath></text><text x="95" y="68" font-size="23" font-weight="900" fill="url(#fev-g)" text-anchor="middle">❤️ heart</text><text font-size="10.5" font-weight="600" fill="#fff" opacity=".62" text-anchor="middle"><textPath href="#fev-bot" startOffset="50%">🔥 fire burns</textPath></text></svg>'),

  code: () => T('<div class="code"><i class="gr">1</i> <i class="f">sing</i>(<i class="s">"wait"</i>);<br><i class="gr">2</i> <i class="k">const</i> line = <i class="s">"minu<span class="caret redcaret"></span>"</i></div>'),
  codeVisual: () => T('<div class="code"><i class="gr">1</i> <i class="f">sing</i>(<i class="s">"wait ⏳ another"</i>);<br><i class="gr">2</i> <i class="k">const</i> line = <i class="s">"minu<span class="caret redcaret"></span>"</i></div>'),
  branches: () => T('<svg viewBox="0 0 190 120"><path d="M6 70 C36 38 58 96 95 66 S150 40 184 60" stroke="#8b6cff" stroke-width="3.2" fill="none" stroke-linecap="round"/><g fill="#fff" stroke="#8b6cff" stroke-width="2"><circle cx="38" cy="62" r="4.2"/><circle cx="95" cy="66" r="4.2"/><circle cx="148" cy="49" r="4.2"/></g><g stroke="#ff5fb0" stroke-width="2" fill="none" stroke-linecap="round"><path d="M38 62 q8 12 14 20"/><path d="M95 66 q6 -10 14 -18"/></g><g fill="#fff" font-size="10.5" font-weight="700" text-anchor="middle"><text x="38" y="49">wait</text><text x="95" y="88">another</text><text x="148" y="36">minute</text></g></svg>'),
  web: () => T(webSvg()),
  constellation: () => T(`<svg viewBox="0 0 190 120"><polyline points="28,84 68,46 114,74 158,36" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.4"/>${STAR(28, 84, 1.1)}${STAR(68, 46, 1.3)}${STAR(114, 74, 1.1)}${STAR(158, 36, 1.35)}<g fill="#fff" font-size="10" font-weight="700" text-anchor="middle"><text x="28" y="102">wait</text><text x="68" y="65">another</text><text x="114" y="93">minute</text></g><g fill="#fff" opacity=".45"><circle cx="20" cy="22" r="1.1"/><circle cx="92" cy="18" r="1.1"/><circle cx="170" cy="96" r="1.1"/><circle cx="140" cy="106" r="1.1"/></g></svg>`),

  chat: () => T('<div class="bub" style="left:10%;top:18px;background:#3a3a44">Wait another minute</div><div class="bub" style="right:10%;top:50px;background:#0a84fe">Fire in my heart</div><div class="bub" style="left:10%;top:82px;background:#3a3a44;letter-spacing:2px">•••</div>'),
  money: () => T('<div class="row2" style="top:16px"><em style="background:#ff6b6b"></em>Another minute<u>+$24</u></div><div class="row2" style="top:48px;opacity:.85"><em style="background:#51cf66"></em>Fire in my heart<u>+$6</u></div><div class="row2" style="top:80px;opacity:.6"><em style="background:#339af0"></em>The moon<u>+$48</u></div>'),
  map: () => T('<div class="mapbg"></div><svg viewBox="0 0 190 120"><path d="M10 102 H60 V68 H112 V36 H152" stroke="#4285f4" stroke-width="4.5" fill="none" stroke-linejoin="round"/><path d="M152 36 m-6.5 -2 a6.5 6.5 0 1 1 13 0 c0 5 -6.5 11 -6.5 11 c0 0 -6.5 -6 -6.5 -11z" fill="#ea4335" transform="translate(0 -4)"/><circle cx="60" cy="68" r="3.5" fill="#ea4335"/></svg><div class="bub" style="left:50%;top:8px;transform:translateX(-12%);background:#fff;color:#1f2430;font-weight:700;font-size:10.5px">Another minute</div>'),
  notify: () => T('<div style="position:absolute;inset:0;background:linear-gradient(165deg,#2c2a7a,#b24a8d 60%,#f29a5c)"></div><div style="position:absolute;top:9px;width:100%;text-align:center;font-size:22px;font-weight:700">9:41</div><div class="notif" style="top:46px;opacity:.55;transform:scale(.93) translateY(6px)"></div><div class="notif" style="top:44px">Messages<br><span style="font-weight:500;opacity:.82">Another minute</span></div><div style="position:absolute;left:8%;right:8%;bottom:8px;height:22px;border-radius:9px;background:rgba(30,30,38,.62)"></div>'),
};

const DISC_THUMBS = {
  vinyl: () => T('<svg viewBox="0 0 190 120"><circle cx="95" cy="60" r="44" fill="#111217" stroke="#2c2e38" stroke-width="1.5"/><circle cx="95" cy="60" r="34" fill="none" stroke="#fff" stroke-opacity=".08" stroke-width="1"/><circle cx="95" cy="60" r="24" fill="none" stroke="#fff" stroke-opacity=".08" stroke-width="1"/><circle cx="95" cy="60" r="17" fill="#ff375f"/><circle cx="95" cy="60" r="3.5" fill="#0d0e12"/><path d="M148 22 L120 48" stroke="#d4d7e0" stroke-width="2.4" stroke-linecap="round"/><circle cx="148" cy="22" r="4" fill="#484a56" stroke="#b0b4c0" stroke-width="1"/></svg>'),
  picture: () => T('<svg viewBox="0 0 190 120"><defs><linearGradient id="pd-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ff375f"/><stop offset="50%" stop-color="#5e5ce6"/><stop offset="100%" stop-color="#30d158"/></linearGradient></defs><circle cx="95" cy="60" r="44" fill="url(#pd-g)"/><circle cx="95" cy="60" r="34" fill="none" stroke="#000" stroke-opacity=".22" stroke-width="1"/><circle cx="95" cy="60" r="22" fill="none" stroke="#000" stroke-opacity=".22" stroke-width="1"/><circle cx="95" cy="60" r="7" fill="#121318"/><circle cx="95" cy="60" r="2.5" fill="#fff" fill-opacity=".4"/><path d="M148 22 L120 48" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>'),
  neon: () => T('<svg viewBox="0 0 190 120"><defs><radialGradient id="ne-g" cx="35%" cy="35%"><stop offset="0%" stop-color="#22d3ee"/><stop offset="100%" stop-color="#ff375f" stop-opacity=".85"/></radialGradient></defs><circle cx="95" cy="60" r="46" fill="#0a84ff" fill-opacity=".2"/><circle cx="95" cy="60" r="42" fill="url(#ne-g)" stroke="#fff" stroke-opacity=".45" stroke-width="1.5"/><circle cx="95" cy="60" r="30" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="1"/><circle cx="95" cy="60" r="15" fill="#181922"/><circle cx="95" cy="60" r="3" fill="#fff" fill-opacity=".55"/></svg>'),
  cd: () => T('<svg viewBox="0 0 190 120"><defs><linearGradient id="cd-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f472b6"/><stop offset="30%" stop-color="#60a5fa"/><stop offset="60%" stop-color="#4ade80"/><stop offset="100%" stop-color="#facc15"/></linearGradient></defs><circle cx="95" cy="60" r="44" fill="url(#cd-g)" stroke="#fff" stroke-opacity=".55" stroke-width="1.5"/><circle cx="95" cy="60" r="15" fill="#1d202b" fill-opacity=".7" stroke="#fff" stroke-opacity=".5" stroke-width="1.2"/><circle cx="95" cy="60" r="6.5" fill="#14151c" stroke="#fff" stroke-opacity=".6" stroke-width="1.2"/></svg>'),
  turntable: () => T('<svg viewBox="0 0 190 120"><rect x="44" y="10" width="102" height="100" rx="18" fill="#232530" stroke="#fff" stroke-opacity=".16" stroke-width="1.2"/><circle cx="95" cy="60" r="37" fill="#101116" stroke="#2c2e38" stroke-width="1"/><circle cx="95" cy="60" r="14" fill="#0a84ff"/><circle cx="95" cy="60" r="3" fill="#0d0e12"/><circle cx="57" cy="96" r="3.5" fill="#0a84ff"/><path d="M134 24 L114 49" stroke="#d4d7e0" stroke-width="2.2" stroke-linecap="round"/></svg>'),
  sleeve: () => T('<svg viewBox="0 0 190 120"><defs><linearGradient id="sl-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#5e5ce6"/><stop offset="100%" stop-color="#ff375f"/></linearGradient></defs><circle cx="116" cy="60" r="36" fill="#111218" stroke="#2c2e38" stroke-width="1.2"/><circle cx="116" cy="60" r="13" fill="#ff375f"/><circle cx="116" cy="60" r="3" fill="#0d0e12"/><rect x="38" y="18" width="76" height="84" rx="10" fill="url(#sl-g)" stroke="#fff" stroke-opacity=".22" stroke-width="1"/></svg>'),
};

const GROUP_NOTE = {
  'Lyric lines': 'Classic karaoke and its variations',
  'Kinetic type': 'Words that move as a scene',
  'Motion scenes': 'Each line becomes a small animation',
  'Native design': 'Keep their own colours, light or dark',
};
const GROUP_CLASS = { 'Lyric lines': 'g-lines', 'Kinetic type': 'g-kinetic', 'Motion scenes': 'g-motion', 'Native design': 'g-native' };

function pauseReasonLabel(reason) {
  if (reason === 'manual') return 'Paused manually';
  if (reason === 'fullscreen') return 'Fullscreen app';
  if (reason === 'maximized') return 'Maximized window';
  if (reason === 'battery') return 'Battery saver';
  if (reason === 'locked') return 'Screen locked';
  if (reason === 'empty') return 'Nothing on screen';
  return 'Paused';
}

function buildStyles(sec) {
  sec.textContent = '';

  const pStatus = h('span', { class: 'dpill on' }, h('i'), 'Active');
  const pGlow = h('span', { class: 'dpill' }, h('i'), 'Edge glow');
  const pLyrics = h('span', { class: 'dpill' }, h('i'), 'Lyrics');
  const pDisc = h('span', { class: 'dpill' }, h('i'), 'Record');
  const pLayer = h('span', { class: 'dpill on' }, h('i'), 'Behind apps');
  const layerBtn = h('button', {
    class: 'pill-btn', type: 'button',
    onclick: () => set({ layer: S().layer === 'top' ? 'desktop' : 'top' }),
  }, 'Above apps');
  const editQuick = h('button', {
    class: 'pill-btn pri', type: 'button',
    onclick: () => hs.act('toggle-edit'),
  }, 'Edit on screen');

  updaters.push(() => {
    const rt = st.runtime || {};
    const reasons = Array.isArray(rt.pauseReasons) ? rt.pauseReasons : [];
    if (rt.allPaused) {
      pStatus.className = 'dpill warn';
      pStatus.lastChild.textContent = reasons.length ? `Paused \u00b7 ${pauseReasonLabel(reasons[0])}` : 'Paused';
    } else if (reasons.length) {
      pStatus.className = 'dpill warn';
      pStatus.lastChild.textContent = `${rt.activeCount || 0}/${rt.totalCount || 0} active \u00b7 ${pauseReasonLabel(reasons[0])}`;
    } else if (rt.ecoActive) {
      pStatus.className = 'dpill warn';
      pStatus.lastChild.textContent = 'Eco mode';
    } else {
      pStatus.className = 'dpill on';
      pStatus.lastChild.textContent = 'Active';
    }
    pGlow.classList.toggle('on', !!S().glow);
    pLyrics.classList.toggle('on', !!S().lyrics);
    pDisc.classList.toggle('on', !!S().showDisc);
    const isTop = S().layer === 'top';
    pLayer.lastChild.textContent = isTop ? 'Above apps' : 'Behind apps';
    layerBtn.textContent = isTop ? 'Move behind apps' : 'Show above apps';
    editQuick.textContent = st.editMode ? 'Done editing' : 'Edit on screen';
  });

  const banner = h('div', { class: 'desk-banner' },
    h('div', { class: 'desk-ic', html: `<svg viewBox="0 0 24 24">${ICONS.screen}</svg>` }),
    h('div', { class: 'desk-body' },
      h('b', null, "Halo's elements are active on your desktop"),
      h('p', null, 'Edge glow, synced lyrics, and your record player live directly on the desktop. Play music to see them appear, or tap Edit on screen to preview and position them.'),
      h('div', { class: 'desk-pills' }, pStatus, pGlow, pLyrics, pDisc, pLayer)),
    h('div', { class: 'desk-actions' }, editQuick, layerBtn));

  sec.append(
    h('h1', null, 'Styles'),
    h('p', { class: 'lede' }, 'Pick how synced lyrics move and animate on your screen.'),
    banner,
  );

  const groups = [...new Set(meta.styles.map((s) => s.group))];
  for (const g of groups) {
    sec.append(h('div', { class: 'gal-head' }, h('h2', null, g), h('span', null, GROUP_NOTE[g] || '')));
    if (g === 'Native design') sec.append(h('div', { class: 'theme-row' }, 'Theme for Messages, Payments and Map', seg('nativeTheme', [['dark', 'Dark'], ['light', 'Light']])));
    const grid = h('div', { class: 'gal ' + GROUP_CLASS[g] });
    for (const s of meta.styles.filter((x) => x.group === g)) {
      const card = h('button', { type: 'button', class: 'card', onclick: () => set({ lyricStyle: s.id }) },
        h('div', { class: 'th-wrap', html: (THUMBS[s.id] || (() => T(s.name)))() }),
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
  const prev = h('div', { class: 'preview-line row-full' }, 'The quick brown fox jumps over the lazy dog');
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
      row('Font', 'Every font installed on this PC, shown in its own style', fontIn, false, ico('font', '#0a84ff')),
      h('div', { class: 'row block' }, prev),
      row('Bold', null, toggle('bold'), false, ico('bold', '#5e5ce6')),
      row('Size', 'Also changes with the scroll wheel in edit mode', slider('fontSize', { rmin: 18, rmax: 96, min: 12, max: 240, step: 1, unit: 'px', label: 'Text size' }), false, ico('size', '#bf5af2')),
      row('Alignment', null, seg('lyricAlign', [['left', 'Left'], ['center', 'Centre'], ['right', 'Right']]), false, ico('align', '#30d158')),
      row('Colour', 'Native design styles keep their own colours', h('div', { class: 'chips' }, colorChips, custom), true, ico('palette', '#ff375f'))),
    mod('Lines', 'Show the lines around the current one, like Spotify.',
      row('Lines before', null, slider('pastLines', { min: 0, max: 8, step: 1 }), false, ico('lines', '#0a84ff')),
      row('Lines after', null, slider('futureLines', { min: 0, max: 8, step: 1 }), false, ico('lines', '#5e5ce6')),
      row('Blur distant lines', null, toggle('lineBlur'), false, ico('blur', '#bf5af2'))),
    mod('Box', 'The area the lyrics live in. You can also drag the squares around it in edit mode.',
      row('Width', null, slider('lyricW', { rmin: 240, rmax: 1600, min: 120, max: 3000, step: 1, unit: 'px' }), false, ico('box', '#ff9f0a')),
      row('Height', null, slider('lyricH', { rmin: 80, rmax: 800, min: 40, max: 1500, step: 1, unit: 'px' }), false, ico('box', '#ff9f0a')),
      row('Best size for this style', null, h('button', { class: 'btn', type: 'button', onclick: () => hs.act('fit-box') }, 'Fit box to style'), false, ico('fit', '#30d158'))),
    mod('Timing', 'If the words run early or late, nudge them here.',
      row('Offset', 'Positive moves lyrics later', slider('offsetMs', { rmin: -3000, rmax: 3000, min: -8000, max: 8000, step: 50, unit: 'ms' }), false, ico('clock', '#64d2ff'))),
  );
}

function buildGlow(sec) {
  sec.textContent = '';
  const shapeChips = meta.shapes.map(([id, label]) => chip(label, () => set({ shape: id }), () => S().shape === id));
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
      row('Show glow', null, toggle('glow'), false, ico('glow', '#ff9f0a')),
      row('Keep a soft glow when quiet', null, toggle('idleGlow'), false, ico('sparkle', '#5e5ce6')),
      row('Shape', null, h('div', { class: 'chips' }, shapeChips), true, ico('shape', '#0a84ff')),
      row('Thickness', null, slider('thickness', { rmin: 1, rmax: 30, min: 1, max: 60, step: 1, unit: 'px' }), false, ico('thickness', '#30d158')),
      row('Spread', 'How far the light reaches', slider('glowSize', { rmin: 0.2, rmax: 3, min: 0.1, max: 5, step: 0.05, unit: '×' }), false, ico('spread', '#64d2ff'))),
    mod('Colour', null,
      row('Colour source', null, h('div', { class: 'chips' }, albumChip, rainChip, palChips), true, ico('palette', '#ff375f')),
      row('Your own two colours', 'Picking one switches to custom', h('div', { class: 'pair' },
        colorInput(() => S().primary, (v) => set({ primary: v })), colorInput(() => S().secondary, (v) => set({ secondary: v }))), false, ico('palette', '#bf5af2'))),
    mod('Screens', 'Choose which screens get the glow. Lyrics and the record live wherever you put them.',
      row('Show glow on', null, scr, true, ico('screen', '#0a84ff'))),
  );
  updaters.push(() => {
    const key = st.displays.map((d) => d.id + d.label).join('|');
    if (scr.dataset.key !== key) {
      scr.dataset.key = key; scr.textContent = '';
      for (const d of st.displays) {
        const b = h('button', { type: 'button', class: 'chip', onclick: () => {
          const all = st.displays.map((x) => x.id);
          const cur = Array.isArray(S().glowDisplays) ? S().glowDisplays : all;
          const next = cur.includes(d.id) ? cur.filter((x) => x !== d.id) : [...cur, d.id];
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
  const discGrid = h('div', { class: 'gal g-disc' });
  for (const ds of (meta.discStyles || [])) {
    const card = h('button', { type: 'button', class: 'card', onclick: () => set({ discStyle: ds.id }) },
      h('div', { class: 'th-wrap', html: (DISC_THUMBS[ds.id] || (() => T(ds.name)))() }),
      h('div', { class: 'meta' }, h('b', null, ds.name), h('span', null, ds.desc)),
      h('div', { class: 'tick' }, '✓'));
    updaters.push(() => card.setAttribute('aria-pressed', String((S().discStyle || 'vinyl') === ds.id)));
    discGrid.append(card);
  }
  sec.append(
    h('h1', null, 'Record'), h('p', { class: 'lede' }, 'Pick a player style and adjust its size and angle on your desktop.'),
    h('div', { class: 'gal-head' }, h('h2', null, 'Player style'), h('span', null, 'Six looks for the spinning cover')),
    discGrid,
    h('div', { style: 'height:18px' }),
    mod('Player & Size', null,
      row('Show record', null, toggle('showDisc'), false, ico('disc', '#0a84ff')),
      row('Size', null, slider('discSize', { rmin: 100, rmax: 500, min: 60, max: 1000, step: 1, unit: 'px' }), false, ico('size', '#5e5ce6')),
      row('Rotation', null, slider('discRot', { min: -180, max: 180, step: 1, unit: '°' }), false, ico('rotate', '#ff9f0a'))),
  );
}

function buildLayout(sec) {
  sec.textContent = '';
  sec.append(
    h('h1', null, 'Layout'), h('p', { class: 'lede' }, 'Where things sit, and how they behave around your windows.'),
    mod('Place things on screen', 'Drag the lyrics and the record anywhere, including onto another screen. Drag the squares to resize the lyric box.',
      row('Edit layout', 'Or press Ctrl+Alt+L anywhere', h('button', { class: 'btn pri', type: 'button', id: 'edit2', onclick: () => hs.act('toggle-edit') }, 'Edit on screen'), false, ico('move', '#0a84ff')),
      row('Lyrics rotation', null, slider('lyricRot', { min: -180, max: 180, step: 1, unit: '°' }), false, ico('rotate', '#bf5af2')),
      row('Reset positions', 'Puts both back to their starting places', h('button', { class: 'btn', type: 'button', onclick: () => hs.act('reset-layout') }, 'Reset'), false, ico('reset', '#ff9f0a'))),
    mod('Behaviour', null,
      row('Layer', 'Desktop keeps everything behind your apps', seg('layer', [['desktop', 'Behind apps'], ['top', 'Above apps']]), false, ico('layers', '#30d158')),
      row('Fade after pause', 'Seconds of silence before everything fades. 0 keeps it visible.', slider('fadeSec', { rmin: 0, rmax: 60, min: 0, max: 300, step: 1, unit: 's', zero: 'never' }), false, ico('fade', '#5e5ce6')),
      row('Only react to music', 'Ignore Shorts, Reels and other browser videos', toggle('musicOnly'), false, ico('music', '#ff375f'))),
  );
}

function buildPerformance(sec) {
  sec.textContent = '';

  const pState = h('span', { class: 'dpill on' }, h('i'), 'Running');
  const pPower = h('span', { class: 'dpill' }, h('i'), 'Plugged in');
  const pEco = h('span', { class: 'dpill' }, h('i'), 'Eco');
  const pauseBtn = h('button', {
    class: 'pill-btn pri', type: 'button',
    onclick: () => hs.act('toggle-pause'),
  }, 'Pause overlay');

  updaters.push(() => {
    const rt = st.runtime || {};
    const reasons = Array.isArray(rt.pauseReasons) ? rt.pauseReasons : [];
    const total = rt.totalCount || 0;
    const active = rt.activeCount || 0;
    if (rt.allPaused) {
      pState.className = 'dpill warn';
      pState.lastChild.textContent = reasons.length ? `Paused (${pauseReasonLabel(reasons[0])})` : 'Paused';
    } else if (reasons.length) {
      pState.className = 'dpill warn';
      pState.lastChild.textContent = `${active} of ${total} active (${pauseReasonLabel(reasons[0])})`;
    } else {
      pState.className = 'dpill on';
      pState.lastChild.textContent = total > 1 ? `Active on ${active} of ${total} screens` : 'Active on desktop';
    }
    pPower.className = rt.onBattery ? 'dpill warn' : 'dpill';
    pPower.lastChild.textContent = rt.onBattery ? 'On battery' : 'Plugged in';
    pEco.style.display = rt.ecoActive ? '' : 'none';
    pEco.className = 'dpill warn';
    pEco.lastChild.textContent = 'Battery Eco active';
    pauseBtn.textContent = rt.manualPaused ? 'Resume overlay' : 'Pause overlay';
    pauseBtn.className = 'pill-btn' + (rt.manualPaused ? ' pri' : '');
  });

  const banner = h('div', { class: 'desk-banner' },
    h('div', { class: 'desk-ic', style: 'background:linear-gradient(145deg,#00c7be,#0a84ff)', html: `<svg viewBox="0 0 24 24">${ICONS.bolt}</svg>` }),
    h('div', { class: 'desk-body' },
      h('b', null, 'Resource & power status'),
      h('p', null, 'Halo automatically hides occluded overlays, throttles idle animations, and puts the renderer to sleep when music stops.'),
      h('div', { class: 'desk-pills' }, pState, pPower, pEco)),
    h('div', { class: 'desk-actions' }, pauseBtn));

  const presetChips = h('div', { class: 'chips' },
    chip('High quality',
      () => set({ fpsCap: 0, glowQuality: 'high', reducedEffects: false }),
      () => S().fpsCap === 0 && S().glowQuality === 'high' && !S().reducedEffects),
    chip('Balanced',
      () => set({ fpsCap: 60, glowQuality: 'medium', reducedEffects: false }),
      () => S().fpsCap === 60 && S().glowQuality === 'medium' && !S().reducedEffects),
    chip('Low-end / Eco',
      () => set({ fpsCap: 30, glowQuality: 'low', reducedEffects: true, pauseFullscreen: true, pauseMaximized: true }),
      () => S().fpsCap === 30 && S().glowQuality === 'low' && !!S().reducedEffects),
  );

  sec.append(
    h('h1', null, 'Performance'),
    h('p', { class: 'lede' }, 'Tune CPU, GPU, and battery usage for low-end PCs, laptops, and gaming.'),
    banner,
    mod('Quick presets', 'Choose a baseline profile or customize individual controls below.',
      row('Quality profile', null, presetChips, true, ico('bolt', '#00c7be'))),
    mod('Smart pausing', 'Hidden overlays stop drawing, drop to 0% GPU, and slow down background checks.',
      row('Pause in fullscreen apps', 'Turns off the overlay when a fullscreen game or video covers the screen', toggle('pauseFullscreen'), false, ico('fullscreen', '#0a84ff')),
      row('Pause behind maximized apps', 'Pauses desktop view when a maximized window completely covers the screen (Behind apps mode)', toggle('pauseMaximized'), false, ico('maximize', '#5e5ce6')),
      row('On battery power', 'Eco mode caps FPS to 30 and uses Lite effects when unplugged', seg('batteryMode', [['off', 'Keep running'], ['eco', 'Eco mode'], ['pause', 'Pause']]), true, ico('battery', '#30d158'))),
    mod('Rendering & audio', 'Lower frame rates and Lite mode save significant CPU and GPU on integrated graphics.',
      row('Frame rate limit', 'Lower caps reduce GPU and CPU work on high-refresh monitors', seg('fpsCap', [[20, '20 fps'], [30, '30 fps'], [60, '60 fps'], [0, 'Native']]), true, ico('fps', '#ff9f0a')),
      row('Glow resolution', 'Scales the edge glow canvas before stretching it across the screen', seg('glowQuality', [['low', 'Low'], ['medium', 'Medium'], ['high', 'High']]), false, ico('resolution', '#bf5af2')),
      row('Reduced effects (Lite mode)', 'Disables heavy blurs, drop shadows, and extra shader passes', toggle('reducedEffects'), false, ico('lite', '#30d158')),
      row('Audio-reactive effects', 'Turn off to stop system loopback audio capture and save CPU', toggle('audioReactive'), false, ico('audio', '#ff375f'))),
    mod('Memory & sleep', 'Closing this Settings window releases its memory immediately. Idle overlays automatically sleep at 0% GPU once faded out.'),
  );
}

function buildGeneral(sec) {
  sec.textContent = '';
  const ver = h('span', null, '');
  const upHint = h('span', null, 'Up to date');
  const upFill = h('i');
  const upBar = h('div', { class: 'up-bar' }, upFill);
  const upBtn = h('button', { class: 'btn', type: 'button' }, 'Check for updates');
  upBtn.addEventListener('click', () => {
    const u = st.update || {};
    if (u.status === 'ready') hs.act('install-update');
    else if (u.status === 'available') hs.act('download-update');
    else hs.act('check-update');
  });

  updaters.push(() => {
    ver.textContent = 'Version ' + st.version;
    const u = st.update || { status: 'idle' };
    upBar.classList.toggle('show', u.status === 'downloading');
    upFill.style.width = (u.progress || 0) + '%';
    upBtn.disabled = u.status === 'checking' || u.status === 'downloading';
    upBtn.className = 'btn' + (u.status === 'ready' ? ' ok' : u.status === 'available' ? ' pri' : '');
    if (u.status === 'checking') {
      upHint.textContent = 'Checking GitHub releases\u2026';
      upBtn.textContent = 'Checking\u2026';
    } else if (u.status === 'available') {
      upHint.textContent = `${u.releaseName || ('v' + u.version)} is available on GitHub`;
      upBtn.textContent = 'Download update';
    } else if (u.status === 'downloading') {
      upHint.textContent = `Downloading ${u.releaseName || ('v' + u.version)} (${u.progress || 0}%)`;
      upBtn.textContent = 'Downloading\u2026';
    } else if (u.status === 'ready') {
      upHint.textContent = `${u.releaseName || ('v' + u.version)} ready \u2014 installs automatically on quit, or restart now`;
      upBtn.textContent = 'Install & restart';
    } else if (u.status === 'up-to-date') {
      upHint.textContent = `Halo v${st.version} is up to date`;
      upBtn.textContent = 'Check for updates';
    } else if (u.status === 'error') {
      upHint.textContent = `Update check failed (${u.error || 'network error'})`;
      upBtn.textContent = 'Retry';
    } else {
      upHint.textContent = `Halo v${st.version} \u00b7 GitHub Releases`;
      upBtn.textContent = 'Check for updates';
    }
  });

  const upRow = h('div', { class: 'row has-ico' },
    ico('update', '#0a84ff'),
    h('div', { class: 'lab up-wrap' }, 'GitHub updates', upHint, upBar),
    h('div', { class: 'ctl' }, upBtn));

  sec.append(
    h('h1', null, 'General'), h('p', { class: 'lede' }, 'Startup, automatic GitHub updates, shortcuts and quitting.'),
    mod('Startup', null,
      row('Start Halo with Windows', st.packaged ? null : 'Available in the installed version (npm run dist)', toggle('startWithWindows', !st.packaged), false, ico('power', '#30d158')),
      row('Start minimized to tray', 'Launch directly in the background without opening this window', toggle('startMinimized'), false, ico('screen', '#0a84ff'))),
    mod('Updates', 'Checks github.com/arvgdhi/HaloVisual for newer installer releases.',
      row('Auto-update from GitHub', 'Download new releases in the background and install automatically on quit', toggle('autoUpdate'), false, ico('sparkle', '#5e5ce6')),
      upRow),
    mod('Shortcuts', 'These work from anywhere in Windows.',
      row('Edit layout on screen', null, h('kbd', null, 'Ctrl + Alt + L'), false, ico('keyboard', '#636366')),
      row('Quit Halo', null, h('kbd', null, 'Ctrl + Alt + Q'), false, ico('keyboard', '#636366')),
      row('Leave edit mode', null, h('kbd', null, 'Esc'), false, ico('keyboard', '#636366'))),
    mod('About', 'Lyrics from LRCLIB, covers from Windows with an iTunes fallback. Audio is captured as loopback only; nothing is saved and the microphone is never used.',
      row(ver, null, h('button', { class: 'btn danger', type: 'button', onclick: () => hs.act('quit') }, 'Quit Halo'), false, ico('info', '#636366'))),
  );
}

// ---------- shell ----------
function sync() {
  for (const u of updaters) u();
  if ($('brand-ver') && st) $('brand-ver').textContent = 'v' + st.version + ' \u00b7 Desktop overlay';
  const on = !!st.editMode;
  const b = $('edit');
  const bSpan = b.querySelector('span');
  if (bSpan) bSpan.textContent = on ? 'Done editing' : 'Edit on screen';
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
  buildRecord($('tab-record')); buildLayout($('tab-layout')); buildPerformance($('tab-performance')); buildGeneral($('tab-general'));
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
