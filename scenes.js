/* Halo scene styles. Each one is SC[id](root, env) -> { update(pos, now, idx) }.
   env: { L (lyric lines), S() settings, W(), H() box size, media(), level(), demo } */
(() => {
  'use strict';
  const SC = {};
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const easeOutBack = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  const smooth = (t) => t * t * (3 - 2 * t);

  function hash(n) {
    n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3); n = n ^ (n >>> 4);
    n = Math.imul(n, 0x27d4eb2d); n = n ^ (n >>> 15);
    return n >>> 0;
  }
  function rng(seed) {
    let s = (seed >>> 0) || 1;
    return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  }
  function mk(tag, cls, parent, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  const NS = 'http://www.w3.org/2000/svg';
  function sv(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  // ---------- word timing (lyrics are line-synced; words are timed by length) ----------
  const wordCache = new WeakMap();
  function lineWords(L, idx) {
    let m = wordCache.get(L);
    if (!m) { m = new Map(); wordCache.set(L, m); }
    if (m.has(idx)) return m.get(idx);
    const line = L[idx];
    const out = [];
    if (line && line.text) {
      const t0 = line.t;
      const t1 = L[idx + 1] ? L[idx + 1].t : t0 + 4000;
      const parts = line.text.split(/\s+/).filter(Boolean);
      const total = parts.reduce((n, p) => n + p.length + 1, 0);
      const dur = Math.max(300, Math.min(t1 - t0 - 80, total * 90 + 400));
      let cum = 0, gi = 0;
      for (const p of parts) {
        const start = t0 + (cum / total) * dur;
        cum += p.length + 1;
        out.push({ text: p, start, end: t0 + (cum / total) * dur, gi, t0, t1 });
        gi += p.length;
      }
    }
    m.set(idx, out);
    return out;
  }
  const flatCache = new WeakMap();
  function flatWords(L) {
    let f = flatCache.get(L);
    if (f) return f;
    f = [];
    for (let i = 0; i < L.length; i++) for (const w of lineWords(L, i)) f.push({ ...w, li: i });
    flatCache.set(L, f);
    return f;
  }

  // ---------- icons for words ----------
  const ICON = {
    wait: '⏳', minute: '⏱️', second: '⏱️', hour: '⌛', time: '⏰', clock: '⏰',
    love: '❤️', heart: '❤️', broken: '💔', fire: '🔥', burn: '🔥', flame: '🔥',
    sun: '☀️', sunshine: '☀️', moon: '🌙', tonight: '🌙', star: '⭐', stars: '✨',
    night: '🌃', midnight: '🌃', day: '🌅', morning: '🌅', dream: '💭',
    dance: '💃', music: '🎵', song: '🎶', sing: '🎤', voice: '🎤',
    eye: '👀', look: '👀', see: '👀', run: '🏃', rain: '🌧️',
    water: '💧', sea: '🌊', ocean: '🌊', wave: '🌊', home: '🏠', house: '🏠',
    car: '🚗', drive: '🚗', money: '💰', cash: '💵', dollar: '💵', gold: '🏅',
    diamond: '💎', ring: '💍', kiss: '💋', lip: '💋', smile: '😊', laugh: '😂',
    cry: '😢', tear: '😢', die: '💀', dead: '💀', death: '💀', skull: '💀',
    god: '🙏', pray: '🙏', light: '💡', sky: '☁️', cloud: '☁️', wind: '💨',
    flower: '🌸', pink: '🌸', rose: '🌹', hand: '✋', phone: '📞', call: '📞',
    baby: '👶', fly: '🕊️', free: '🕊️', wing: '🕊️', bird: '🐦',
    heaven: '😇', angel: '😇', hell: '😈', devil: '😈', crown: '👑', king: '👑',
    queen: '👑', ice: '🧊', cold: '🥶', hot: '🥵', party: '🎉', drink: '🍸',
    wine: '🍷', beer: '🍺', girl: '👧', boy: '👦', world: '🌍', earth: '🌍',
    road: '🛣️', ghost: '👻', thunder: '⚡', lightning: '⚡', storm: '⛈️', snow: '❄️',
    winter: '❄️', summer: '🏖️', beach: '🏖️', paradise: '🏝️', island: '🏝️',
    city: '🏙️', town: '🏙️', train: '🚂', plane: '✈️', boat: '⛵',
    key: '🔑', lock: '🔒', door: '🚪', bed: '🛏️', sleep: '😴', tired: '😴',
    coffee: '☕', tea: '🍵', pizza: '🍕', cake: '🎂', gift: '🎁', camera: '📸',
    picture: '📸', game: '🎮', fight: '🥊', blood: '🩸', guitar: '🎸', rock: '🎸',
    drum: '🥁', piano: '🎹', radio: '📻', wish: '🌠', magic: '✨', shine: '✨',
    glow: '✨', sparkle: '✨', peace: '☮️', goodbye: '👋', hello: '👋', hi: '👋',
    mind: '🧠', brain: '🧠', tree: '🌳', forest: '🌲', mountain: '⛰️', fall: '🍂',
    spring: '🌱', life: '🌱', forever: '♾️', alone: '😔', lonely: '😔', angry: '😡',
    mad: '😡', shout: '📢', whisper: '🤫', secret: '🤫', truth: '✅', rocket: '🚀',
    high: '🚀', space: '🪐', cool: '😎', glasses: '😎', shoe: '👟', dress: '👗',
    drunk: '🥴', red: '🔴', blue: '🔵', green: '🟢', black: '⚫', white: '⚪',
    yellow: '🟡', purple: '🟣', orange: '🟠', alive: '💓', body: '🕺', face: '🙂',
  };
  function iconFor(raw) {
    const w = String(raw).toLowerCase().replace(/[^a-z]/g, '');
    if (!w) return '';
    if (ICON[w]) return ICON[w];
    const cands = [];
    for (const suf of ['s', 'es', 'ing', 'ed', 'er', 'ly', 'y']) {
      if (w.length > suf.length + 2 && w.endsWith(suf)) {
        const s = w.slice(0, -suf.length);
        cands.push(s, s + 'e', s.slice(0, -1));
      }
    }
    for (const c of cands) if (ICON[c]) return ICON[c];
    return '';
  }

  const fontFor = (S) => `'${S.font}', 'Segoe UI', sans-serif`;
  const NATIVE_FONT = "'Segoe UI Variable Text','Segoe UI',system-ui,-apple-system,sans-serif";

  // ======================================================================
  // Kinetic type
  // ======================================================================

  // Ship: words land one by one on a wall that drifts in 3D
  SC.ship = (root, env) => {
    root.classList.add('sc-ship');
    const wall = mk('div', 'wall', root);
    const rows = new Map();
    function ensure(i) {
      if (rows.has(i)) return rows.get(i);
      const ws = lineWords(env.L, i);
      let r = null;
      if (ws.length) {
        const el = mk('div', 'row', wall);
        r = { el, settled: false, words: ws.map((w) => ({ el: mk('span', 'w', el, w.text), start: w.start })) };
      }
      rows.set(i, r);
      return r;
    }
    return {
      update(pos, now, idx) {
        const S = env.S(), H = env.H();
        root.style.fontSize = Math.min(S.fontSize * 1.15, H * 0.2).toFixed(1) + 'px';
        wall.style.transform = `rotateY(${(Math.sin(now / 2600) * 8).toFixed(2)}deg) rotateX(${(2 + Math.cos(now / 3300) * 4).toFixed(2)}deg)`;
        for (const [i, r] of rows) if (i > idx || i < idx - 3) { if (r) r.el.remove(); rows.delete(i); }
        for (let i = Math.max(0, idx - 3); i <= idx; i++) {
          const r = ensure(i);
          if (!r) continue;
          const d = idx - i;
          r.el.style.transform = `translate3d(0, ${(-d * 1.75).toFixed(2)}em, ${-d * 140}px) translateY(-50%)`;
          r.el.style.opacity = d === 0 ? 1 : Math.max(0, 0.55 - 0.18 * (d - 1)).toFixed(2);
          if (d > 0 && r.settled) continue;
          let all = true;
          for (const w of r.words) {
            const t = pos - w.start;
            if (t < 700) all = false;
            const e = t < 0 ? 0 : easeOutCubic(clamp01(t / 380));
            const pop = t < 0 ? 0 : Math.exp(-t / 150) * 0.18;
            w.el.style.transform = `translate3d(0, ${((e - 1) * 0.6).toFixed(3)}em, ${((1 - e) * 650).toFixed(0)}px) scale(${(1 + pop).toFixed(3)})`;
            w.el.style.opacity = t < 0 ? 0 : clamp01(t / 110).toFixed(2);
          }
          r.settled = all;
        }
      },
    };
  };

  // Fisheye: a tight stack of words bulging through a lens (optionally with icons)
  function fisheyeScene(icons) {
    return (root, env) => {
      root.classList.add('sc-fish');
      const flat = flatWords(env.L);
      const slots = [];
      for (let j = 0; j < 7; j++) {
        const el = mk('div', 'frow', root);
        const ic = icons ? mk('span', 'ic', el) : null;
        const tx = mk('span', 'tx', el);
        slots.push({ el, ic, tx, i: -999, hot: false });
      }
      return {
        update(pos) {
          const S = env.S(), H = env.H();
          root.style.fontSize = Math.min(S.fontSize * 2, H * 0.26).toFixed(1) + 'px';
          if (!flat.length) return;
          let lo = 0, hi = flat.length - 1, k = -1;
          while (lo <= hi) { const m = (lo + hi) >> 1; if (flat[m].start <= pos) { k = m; lo = m + 1; } else hi = m - 1; }
          const f = k < 0 ? -1 : k - 1 + easeOutCubic(clamp01((pos - flat[k].start) / 260));
          const base = Math.floor(f) - 2;
          const K = H * 0.4;
          for (let j = 0; j < slots.length; j++) {
            const s = slots[j], wi = base + j, w = flat[wi];
            if (s.i !== wi) {
              s.i = wi;
              if (w) {
                s.tx.textContent = w.text;
                if (s.ic) s.ic.textContent = iconFor(w.text);
              }
            }
            if (!w) { s.el.style.opacity = 0; continue; }
            const o = wi - f;
            const a = Math.exp(-o * o * 0.5);
            const y = K * Math.tanh(o * 0.95);
            const sc = 0.38 + 0.62 * Math.exp(-o * o * 0.9);
            s.el.style.opacity = a < 0.04 ? 0 : a.toFixed(3);
            s.el.style.transform = `translateY(${y.toFixed(1)}px) perspective(520px) rotateX(${(-o * 34).toFixed(1)}deg) scale(${sc.toFixed(3)})`;
            const hot = Math.abs(o) < 0.45;
            if (hot !== s.hot) { s.hot = hot; s.el.classList.toggle('hot', hot); }
          }
        },
      };
    };
  }
  SC.fisheye = fisheyeScene(false);
  SC.fisheyeVisual = fisheyeScene(true);

  // Visual: a centred stack, small italic / huge / boxed, with an icon for every word that has one
  SC.visual = (root, env) => {
    root.classList.add('sc-visual');
    let built = -9, words = [], box = null, fitSig = '', pill = null;
    function build(idx) {
      root.textContent = ''; words = []; box = null; fitSig = ''; pill = null;
      const ws = lineWords(env.L, idx);
      if (!ws.length) return;
      box = mk('div', 'vbox', root);
      const n = ws.length;
      let groups;
      if (n <= 3) groups = ws.map((w) => [w]);
      else {
        const rc = n <= 6 ? 3 : 4, b = Math.floor(n / rc), x = n % rc;
        groups = []; let p = 0;
        for (let r = 0; r < rc; r++) { const take = b + (r < x ? 1 : 0); groups.push(ws.slice(p, p + take)); p += take; }
      }
      const roles = groups.length === 1 ? ['huge'] : groups.length === 2 ? ['huge', 'box']
        : groups.length === 3 ? ['small', 'huge', 'box'] : ['small', 'huge', 'box', 'mid'];
      groups.forEach((g, gi) => {
        const row = mk('div', 'vrow ' + roles[gi], box);
        const inner = roles[gi] === 'box' ? mk('span', 'vpill', row) : row;
        if (roles[gi] === 'box') pill = { el: inner, start: g[0].start };
        for (const w of g) {
          const sp = mk('span', 'vw', inner);
          mk('span', 'vt', sp, w.text);
          const ic = iconFor(w.text);
          if (ic) mk('span', 'vi', sp, ic);
          words.push({ el: sp, start: w.start });
        }
      });
    }
    function fit() {
      if (!box) return;
      const W = env.W(), H = env.H(), S = env.S();
      const sig = W + 'x' + H + 'x' + S.fontSize;
      if (sig === fitSig) return;
      fitSig = sig;
      root.style.fontSize = (S.fontSize * 1.2).toFixed(1) + 'px';
      box.style.transform = 'translate(-50%,-50%)';
      const bw = box.offsetWidth || 1, bh = box.offsetHeight || 1;
      const s = Math.min((W * 0.94) / bw, (H * 0.92) / bh, 1.4);
      box.style.transform = `translate(-50%,-50%) scale(${s.toFixed(3)})`;
    }
    return {
      update(pos, now, idx) {
        if (idx !== built) { built = idx; build(idx); }
        fit();
        if (pill) { const t = pos - pill.start; pill.el.style.opacity = t < 0 ? 0 : clamp01(t / 140).toFixed(2); pill.el.style.transform = `scale(${(0.6 + 0.4 * easeOutBack(clamp01(t / 380))).toFixed(3)})`; }
        for (const w of words) {
          const t = pos - w.start;
          const e = t < 0 ? 0 : easeOutBack(clamp01(t / 380));
          w.el.style.transform = `scale(${(0.5 + 0.5 * e).toFixed(3)}) translateY(${((1 - e) * 0.25).toFixed(3)}em)`;
          w.el.style.opacity = t < 0 ? 0 : clamp01(t / 140).toFixed(2);
        }
      },
    };
  };

  // ======================================================================
  // Motion scenes
  // ======================================================================

  // Code: the lyric typed out as code under a blinking red cursor
  function codeScene(icons) {
    return (root, env) => {
      root.classList.add('sc-code');
      const bar = mk('div', 'cbar', root);
      mk('i', '', bar); mk('i', '', bar); mk('i', '', bar);
      mk('span', 'ctab', bar, 'lyrics.js');
      const body = mk('div', 'cbody', root);
      let built = -9, rows = [], curRow = null, lastN = -1;

      const TPL = [
        (i) => [['fn', 'sing'], ['p', '(']],
        (i) => [['kw', 'const '], ['var', 'line' + i], ['p', ' = ']],
        () => [['kw', 'yield '], ['p', '']],
      ];
      const END = [[['p', ')'], ['p', ';']], [['p', ';']], [['p', ';']]];
      const isCall = (t) => t === 0;

      function makeRow(i, withCursor) {
        const t = i % 3;
        const row = mk('div', 'cl' + (withCursor ? '' : ' old'), body);
        mk('span', 'no', row, String(i + 1));
        const code = mk('span', 'code', row);
        for (const [cls, txt] of TPL[t](i)) mk('span', cls, code, txt);
        mk('span', 'q', code, '"');
        const txt = mk('span', 'str', code);
        const cursor = withCursor ? mk('span', 'cursor', code) : null;
        mk('span', 'q', code, '"');
        for (const [cls, s] of END[t]) mk('span', cls, code, s);
        return { row, txt, cursor, i, ws: lineWords(env.L, i) };
      }
      function render(r, n) { // n = characters typed so far (Infinity = all)
        r.txt.textContent = '';
        let used = 0;
        for (let k = 0; k < r.ws.length; k++) {
          const w = r.ws[k];
          const rest = n - used;
          if (rest <= 0) break;
          const shown = Math.min(w.text.length, rest);
          mk('span', 'cw', r.txt, w.text.slice(0, shown));
          used += w.text.length + 1;
          if (shown === w.text.length) {
            const ic = icons ? iconFor(w.text) : '';
            if (ic) mk('span', 'ci', r.txt, ic);
            if (k < r.ws.length - 1 && n - used + 1 > 0) r.txt.appendChild(document.createTextNode(' '));
          }
        }
        if (r.cursor) r.txt.appendChild(r.cursor);
        body.scrollTop = body.scrollHeight;                    // follow the typing: keep the newest line in view
      }
      function rebuild(idx) {
        body.textContent = ''; rows = []; curRow = null; lastN = -1;
        const H = env.H(), S = env.S();
        const fs = Math.min(S.fontSize * 0.62, H / 6.5);
        root.style.fontSize = fs.toFixed(1) + 'px';
        const maxRows = Math.max(6, Math.floor((H - fs * 2.6) / (fs * 1.55)) + 6);
        const list = [];
        for (let i = idx; i >= 0 && list.length < maxRows; i--) if (L_text(i)) list.unshift(i);
        for (const i of list) {
          const isCur = i === idx;
          const r = makeRow(i, isCur);
          if (isCur) curRow = r; else render(r, Infinity);
          rows.push(r);
        }
        body.scrollTop = body.scrollHeight;
      }
      const L_text = (i) => !!(env.L[i] && env.L[i].text);
      let sig = '';
      return {
        update(pos, now, idx) {
          const s = idx + '|' + env.H() + '|' + env.S().fontSize;
          if (s !== sig) { sig = s; built = idx; rebuild(idx); }
          if (!curRow) return;
          const ws = curRow.ws;
          const t0 = ws[0].start, tEnd = ws[ws.length - 1].end;
          const total = ws.reduce((a, w) => a + w.text.length + 1, 0) - 1;
          const p = clamp01((pos - t0 + 60) / Math.max(200, tEnd - t0));
          const n = Math.floor(p * (total + 0.999));
          if (n !== lastN) { lastN = n; render(curRow, n); }
        },
      };
    };
  }
  SC.code = codeScene(false);
  SC.codeVisual = codeScene(true);

  // Shared machinery for scenes that draw one SVG per line (branches, constellation, web)
  function lineScene(build) {
    return (root, env) => {
      root.classList.add('sc-svg');
      const svg = sv('svg', {}, root);
      let cur = null, curIdx = -9, sig = '';
      return {
        update(pos, now, idx) {
          const W = env.W(), H = env.H(), S = env.S();
          const s = W + 'x' + H + '|' + S.fontSize;
          if (s !== sig) {
            sig = s; svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
            curIdx = -9;
            if (cur) { cur.g.remove(); cur = null; }
          }
          if (idx !== curIdx) {
            curIdx = idx;
            if (cur) {
              const old = cur;
              old.g.style.transition = 'opacity .45s';
              old.g.style.opacity = 0;
              setTimeout(() => old.g.remove(), 520);
              cur = null;
            }
            const ws = lineWords(env.L, idx);
            if (ws.length) {
              const g = sv('g', {}, svg);
              cur = build({ g, ws, idx, W, H, S });
              cur.g = g;
            }
          }
          if (cur) cur.frame(pos, now);
        },
      };
    };
  }
  function smoothPath(pts) {
    let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += ` C${(p1.x + (p2.x - p0.x) / 6).toFixed(1)} ${(p1.y + (p2.y - p0.y) / 6).toFixed(1)} ` +
        `${(p2.x - (p3.x - p1.x) / 6).toFixed(1)} ${(p2.y - (p3.y - p1.y) / 6).toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  }
  function labelFont(ws, W, S, share) {
    const n = ws.length, maxLen = Math.max(...ws.map((w) => w.text.length));
    const spacing = n > 1 ? (W * 0.84) / (n - 1) : W;
    return Math.max(11, Math.min(S.fontSize * 0.85, (share * spacing) / (maxLen * 0.6)));
  }
  const clampX = (x, text, f, W) => { const hw = text.length * f * 0.3 + 8; return Math.max(hw, Math.min(W - hw, x)); };

  // Branches: a line draws itself, and each word lights a node on it
  SC.branches = lineScene(({ g, ws, idx, W, H, S }) => {
    const n = ws.length, f = labelFont(ws, W, S, 1.9);
    const nodes = ws.map((w, i) => ({
      x: n === 1 ? W / 2 : W * 0.08 + (W * 0.84) * (i / (n - 1)),
      y: H / 2 + Math.sin(i * 1.25 + idx) * H * 0.14,
    }));
    const pts = [{ x: 6, y: H / 2 }, ...nodes, { x: W - 6, y: H / 2 + Math.sin(n * 1.25 + idx) * H * 0.1 }];
    const d = smoothPath(pts);
    sv('path', { d, class: 'br-base', fill: 'none' }, g);
    const prog = sv('path', { d, class: 'br-prog', fill: 'none' }, g);
    const total = prog.getTotalLength();
    prog.style.strokeDasharray = `${total} ${total + 2}`;
    const lens = nodes.map((nd) => {
      let a = 0, b = total;
      for (let k = 0; k < 28; k++) { const m = (a + b) / 2; if (prog.getPointAtLength(m).x < nd.x) a = m; else b = m; }
      return (a + b) / 2;
    });
    const items = ws.map((w, i) => {
      const up = i % 2 === 0, nd = nodes[i];
      const dir = up ? -1 : 1;
      const bx = nd.x, by = nd.y;
      const bd = `M${bx} ${by} C${bx + 12} ${by - dir * 14} ${bx + 26} ${by - dir * 24} ${bx + 36} ${by - dir * 42}`;
      const branch = sv('path', { d: bd, class: 'br-off', fill: 'none' }, g);
      const bl = branch.getTotalLength();
      branch.style.strokeDasharray = `${bl} ${bl + 2}`;
      const leaf = sv('circle', { cx: bx + 36, cy: by - dir * 42, r: 4, class: 'br-leaf' }, g);
      const node = sv('circle', { cx: bx, cy: by, r: 4, class: 'br-node' }, g);
      const label = sv('text', { x: clampX(nd.x, w.text, f, W), y: up ? nd.y - 18 : nd.y + 18 + f * 0.72, 'text-anchor': 'middle', class: 'br-lab' }, g);
      label.textContent = w.text;
      label.style.fontSize = f.toFixed(1) + 'px';
      return { w, node, label, branch, bl, leaf, up };
    });
    const keys = [{ t: ws[0].start - 450, l: 0 }, ...ws.map((w, i) => ({ t: w.start, l: lens[i] })), { t: ws[n - 1].end + 300, l: total }];
    return {
      frame(pos) {
        let l = 0;
        if (pos >= keys[keys.length - 1].t) l = total;
        else if (pos > keys[0].t) {
          for (let k = 1; k < keys.length; k++) if (pos <= keys[k].t) { const a = keys[k - 1], b = keys[k]; l = lerp(a.l, b.l, clamp01((pos - a.t) / Math.max(1, b.t - a.t))); break; }
        }
        prog.style.strokeDashoffset = (total - l).toFixed(1);
        for (const it of items) {
          const t = pos - it.w.start;
          const e = t < 0 ? 0 : easeOutBack(clamp01(t / 350));
          it.node.setAttribute('r', (4 + 4 * e).toFixed(2));
          it.node.classList.toggle('on', t >= 0);
          it.label.style.opacity = t < 0 ? 0 : clamp01(t / 160).toFixed(2);
          it.label.style.transform = `translateY(${((1 - easeOutCubic(clamp01(t / 300))) * (it.up ? 6 : -6)).toFixed(2)}px)`;
          const bp = clamp01((t - 80) / 420);
          it.branch.style.strokeDashoffset = (it.bl * (1 - bp)).toFixed(1);
          it.leaf.style.opacity = bp >= 1 ? 1 : 0;
        }
      },
    };
  });

  // Constellation: each line traced star by star
  const STAR = 'M0,-1 C.12,-.12 .12,-.12 1,0 C.12,.12 .12,.12 0,1 C-.12,.12 -.12,.12 -1,0 C-.12,-.12 -.12,-.12 0,-1Z';
  SC.constellation = lineScene(({ g, ws, idx, W, H, S }) => {
    const n = ws.length, f = labelFont(ws, W, S, 1.7), r = rng(hash(idx * 7919 + 13));
    const dust = rng(hash(W * 31 + H));
    for (let k = 0; k < 26; k++) {
      const c = sv('circle', { cx: (dust() * W).toFixed(1), cy: (dust() * H).toFixed(1), r: (0.6 + dust() * 1.2).toFixed(2), class: 'co-dust' }, g);
      c.style.animationDelay = (-dust() * 4).toFixed(2) + 's';
    }
    const nodes = [];
    let py = H / 2;
    for (let i = 0; i < n; i++) {
      const sp = (W * 0.8) / Math.max(1, n - 1);
      let x = n === 1 ? W / 2 : W * 0.1 + (W * 0.8) * (i / (n - 1)) + (r() - 0.5) * sp * 0.3;
      let y = H * (0.3 + 0.4 * r());
      if (Math.abs(y - py) < H * 0.12) y = Math.max(H * 0.22, Math.min(H * 0.78, py + (r() < 0.5 ? -1 : 1) * H * 0.2));
      py = y;
      nodes.push({ x: Math.max(24, Math.min(W - 24, x)), y });
    }
    const segs = [];
    for (let i = 1; i < n; i++) {
      const a = nodes[i - 1], b = nodes[i], len = Math.hypot(b.x - a.x, b.y - a.y);
      const ln = sv('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'co-seg' }, g);
      ln.style.strokeDasharray = `${len} ${len + 2}`;
      segs.push({ ln, len });
    }
    const items = ws.map((w, i) => {
      const nd = nodes[i], above = nd.y > H / 2;
      const star = sv('path', { d: STAR, class: 'co-star' }, g);
      const label = sv('text', { x: clampX(nd.x, w.text, f, W), y: above ? nd.y - 22 : nd.y + 22 + f * 0.7, 'text-anchor': 'middle', class: 'co-lab' }, g);
      label.textContent = w.text;
      label.style.fontSize = f.toFixed(1) + 'px';
      return { w, star, label, nd };
    });
    return {
      frame(pos, now) {
        segs.forEach((s, i) => {
          const t0 = ws[i + 1].start - 280;
          s.ln.style.strokeDashoffset = (s.len * (1 - smooth(clamp01((pos - t0) / 280)))).toFixed(1);
        });
        items.forEach((it, i) => {
          const t = pos - it.w.start;
          const e = t < 0 ? 0 : easeOutBack(clamp01(t / 420));
          const size = t < 0 ? 2.6 : (6 + 9 * e) * (1 + 0.1 * Math.sin(now / 240 + i * 1.7));
          it.star.setAttribute('transform', `translate(${it.nd.x.toFixed(1)} ${it.nd.y.toFixed(1)}) scale(${size.toFixed(2)})`);
          it.star.classList.toggle('on', t >= 0);
          it.label.style.opacity = t < 0 ? 0 : clamp01(t / 200).toFixed(2);
        });
      },
    };
  });

  // Web: each line spun into a spider's web, a strand for every word
  SC.web = lineScene(({ g, ws, idx, W, H, S }) => {
    const n = ws.length, spokes = Math.max(n, 5);
    const f = Math.max(12, Math.min(S.fontSize * 0.66, H * 0.07));
    const maxLab = Math.max(...ws.map((w) => w.text.length)) * f * 0.58;
    const R = Math.max(50, Math.min(H / 2 - f * 1.9, W / 2 - maxLab - 22));
    const cx = W / 2, cy = H / 2;
    const ang = (j) => -Math.PI / 2 + (j * Math.PI * 2) / spokes;
    const px = (j, r) => [cx + Math.cos(ang(j)) * r, cy + Math.sin(ang(j)) * r];
    const tOf = (j) => (j < n ? ws[j].start : ws[n - 1].end + (j - n + 1) * 130);
    const rings = [0.22, 0.42, 0.62, 0.82, 1];
    const segs = [];
    rings.forEach((rf, ri) => {
      for (let j = 0; j < spokes; j++) {
        const [x1, y1] = px(j, R * rf), [x2, y2] = px((j + 1) % spokes, R * rf);
        const am = ang(j) + Math.PI / spokes, cr = R * rf * Math.cos(Math.PI / spokes) * 0.8;
        const p = sv('path', { d: `M${x1.toFixed(1)} ${y1.toFixed(1)} Q${(cx + Math.cos(am) * cr).toFixed(1)} ${(cy + Math.sin(am) * cr).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`, class: 'wb-ring', fill: 'none' }, g);
        const len = p.getTotalLength();
        p.style.strokeDasharray = `${len} ${len + 2}`;
        segs.push({ p, len, t: (j + 1 < spokes ? tOf(j + 1) : tOf(spokes - 1) + 260) + ri * 50 });
      }
    });
    const sp = [];
    for (let j = 0; j < spokes; j++) {
      const [x, y] = px(j, R);
      const ln = sv('line', { x1: cx, y1: cy, x2: x, y2: y, class: 'wb-spoke' }, g);
      ln.style.strokeDasharray = `${R} ${R + 2}`;
      let label = null;
      if (j < n) {
        const c = Math.cos(ang(j)), s = Math.sin(ang(j));
        const lx = cx + c * (R + 12), ly = cy + s * (R + 12);
        label = sv('text', { x: lx, y: ly + (s > 0.35 ? f * 0.8 : s < -0.35 ? -4 : f * 0.33), 'text-anchor': c > 0.3 ? 'start' : c < -0.3 ? 'end' : 'middle', class: 'wb-lab' }, g);
        label.textContent = ws[j].text;
        label.style.fontSize = f.toFixed(1) + 'px';
      }
      const dew = sv('circle', { cx: x, cy: y, r: 3, class: 'wb-dew' }, g);
      sp.push({ ln, label, dew, t: tOf(j) });
    }
    return {
      frame(pos) {
        for (const s of sp) {
          const p = easeOutCubic(clamp01((pos - s.t) / 380));
          s.ln.style.strokeDashoffset = (R * (1 - p)).toFixed(1);
          s.dew.style.opacity = p >= 1 ? 1 : 0;
          if (s.label) s.label.style.opacity = clamp01((pos - s.t) / 200).toFixed(2);
        }
        for (const s of segs) s.p.style.strokeDashoffset = (s.len * (1 - smooth(clamp01((pos - s.t) / 320)))).toFixed(1);
      },
    };
  });

  // ======================================================================
  // Native design (these keep their own colours)
  // ======================================================================

  const NAMES = ['Maya Chen', 'Leo Park', 'Ava Torres', 'Noah Kim', 'Zoe Alvarez', 'Ethan Cole', 'Mia Rossi', 'Luca Bennett', 'Ivy Nakamura', 'Omar Haddad'];
  const HUES = ['#ff6b6b', '#ffa94d', '#51cf66', '#339af0', '#845ef7', '#f06595', '#20c997', '#fcc419'];
  const nativeSize = (S, lo, hi, k) => Math.max(lo, Math.min(hi, S.fontSize * k));
  const theme = (root, S) => { const d = S.nativeTheme !== 'light'; if (root.classList.contains('dark') !== d) root.classList.toggle('dark', d); };

  // Messages: a bubble for every line
  SC.chat = (root, env) => {
    root.classList.add('sc-native', 'sc-chat');
    const head = mk('div', 'chead', root);
    const av = mk('div', 'cav', head, '♪');
    const name = mk('div', 'cname', head);
    const thread = mk('div', 'cthread', root);
    const typing = mk('div', 'bub in typing', thread);
    for (let k = 0; k < 3; k++) mk('i', '', typing);
    typing.style.display = 'none';
    const els = new Map();
    let curIdx = -9, lastName = '';
    const side = (i) => (i % 2 ? 'out' : 'in');
    function add(i, animate) {
      const b = mk('div', 'bub ' + side(i), null, env.L[i].text);
      thread.insertBefore(b, typing);
      els.set(i, b);
      if (animate) { b.classList.add('pre'); requestAnimationFrame(() => requestAnimationFrame(() => b.classList.remove('pre'))); }
    }
    return {
      update(pos, now, idx) {
        const S = env.S(), m = env.media();
        theme(root, S);
        const nm = (m && m.artist) || 'Halo';
        if (nm !== lastName) { lastName = nm; name.textContent = nm; av.textContent = nm.trim().charAt(0).toUpperCase() || '♪'; }
        root.style.fontSize = nativeSize(S, 13, 26, 0.5).toFixed(1) + 'px';
        if (idx !== curIdx) {
          const inc = idx === curIdx + 1;
          if (!inc) { for (const b of els.values()) b.remove(); els.clear(); }
          const list = [];
          for (let i = idx; i >= 0 && list.length < 7; i--) if (env.L[i] && env.L[i].text) list.unshift(i);
          for (const [i, b] of els) if (!list.includes(i)) { b.remove(); els.delete(i); }
          for (const i of list) if (!els.has(i)) add(i, inc);
          curIdx = idx;
        }
        let nxt = -1;
        for (let j = idx + 1; j < env.L.length && j < idx + 4; j++) if (env.L[j].text) { nxt = j; break; }
        const show = nxt >= 0 && pos > env.L[nxt].t - 1100;
        typing.style.display = show ? '' : 'none';
        if (show) typing.className = 'bub typing ' + side(nxt);
      },
    };
  };

  // Payments: a run of payments, one for every line
  SC.money = (root, env) => {
    root.classList.add('sc-native', 'sc-money');
    const head = mk('div', 'mhead', root);
    mk('div', 'mtitle', head, 'Activity');
    const bal = mk('div', 'mbal', head);
    const list = mk('div', 'mlist', root);
    const amt = (i) => 1 + (hash(i * 31 + 7) % 49900) / 100;
    const cum = []; let run = 1000;
    for (let i = 0; i < env.L.length; i++) { if (env.L[i].text) run += amt(i); cum.push(run); }
    const cumAt = [];
    run = 1000;
    for (let i = 0; i < env.L.length; i++) { if (env.L[i].text) run += amt(i); cumAt[i] = run; }
    const els = new Map();
    let curIdx = -9, shown = 1000;
    const fmt = (v) => '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    function row(i, animate) {
      const h = hash(i * 17 + 3);
      const nm = NAMES[h % NAMES.length];
      const r = mk('div', 'prow', null);
      const av = mk('div', 'pav', r, nm.charAt(0));
      av.style.background = HUES[h % HUES.length];
      const mid = mk('div', 'pmid', r);
      mk('div', 'pname', mid, nm);
      mk('div', 'pnote', mid, env.L[i].text);
      const right = mk('div', 'pright', r);
      mk('div', 'pamt', right, '+' + fmt(amt(i)));
      mk('div', 'psub', right, 'Received');
      list.insertBefore(r, list.firstChild);
      els.set(i, r);
      if (animate) { r.classList.add('pre'); requestAnimationFrame(() => requestAnimationFrame(() => r.classList.remove('pre'))); }
    }
    return {
      update(pos, now, idx) {
        const S = env.S();
        theme(root, S);
        root.style.fontSize = nativeSize(S, 13, 26, 0.5).toFixed(1) + 'px';
        if (idx !== curIdx) {
          const inc = idx === curIdx + 1;
          if (!inc) { for (const r of els.values()) r.remove(); els.clear(); }
          const keep = [];
          for (let i = idx; i >= 0 && keep.length < 5; i--) if (env.L[i] && env.L[i].text) keep.push(i);
          for (const [i, r] of els) if (!keep.includes(i)) { r.remove(); els.delete(i); }
          for (const i of keep.slice().reverse()) if (!els.has(i)) row(i, inc);
          curIdx = idx;
          keep.forEach((i, d) => { els.get(i).style.setProperty('--d', d); els.get(i).classList.toggle('now', d === 0); });
        }
        const target = idx >= 0 ? cumAt[idx] : 1000;
        shown += (target - shown) * 0.12;
        if (Math.abs(target - shown) < 0.01) shown = target;
        bal.textContent = fmt(shown);
      },
    };
  };

  // Map: a walk across the city, with a pin for every line
  SC.map = (root, env) => {
    root.classList.add('sc-native', 'sc-map');
    const bg = mk('div', 'mbg', root);
    const layer = mk('div', 'mlayer', root);
    const under = mk('div', 'munder', layer);            // parks and diagonal avenues, always beneath the route
    const svg = sv('svg', { width: 1, height: 1 }, layer);
    svg.style.cssText = 'position:absolute;left:0;top:0;overflow:visible;z-index:1';
    const casing = sv('path', { class: 'rcase', fill: 'none' }, svg);
    const route = sv('path', { class: 'rline', fill: 'none' }, svg);
    const meas = sv('path', { fill: 'none', stroke: 'none' }, svg);
    const me = mk('div', 'me', layer);
    mk('div', 'chip top', root, '📍 San Francisco');
    const chipBot = mk('div', 'chip bot', root);

    // the walk: every stop turns by a random angle, so the route wanders instead of following the grid
    const P = [];
    function pt(i) {
      while (P.length <= i) {
        const k = P.length;
        if (k === 0) { P.push({ x: 0, y: 0, a: 0.25 }); continue; }
        const p = P[k - 1], r = rng(hash(k * 7919 + 17));
        let a = p.a + (r() - 0.5) * 2.6;                      // up to +-75 degrees at every stop
        a += Math.sin(k * 0.55) * 0.18;                       // slow drift so it does not spiral
        const len = 150 + r() * 140;
        P.push({ x: p.x + Math.cos(a) * len, y: p.y + Math.sin(a) * len * 0.8, a });
      }
      return P[i];
    }
    function pathTo(from, to) {
      const pts = [];
      for (let i = from; i <= to; i++) pts.push(pt(i));
      if (pts.length === 1) return `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
      const mid = (a, b) => [(a.x + b.x) / 2, (a.y + b.y) / 2];
      let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
      for (let i = 1; i < pts.length - 1; i++) {
        const m1 = mid(pts[i - 1], pts[i]), m2 = mid(pts[i], pts[i + 1]);
        d += ` L${m1[0].toFixed(1)} ${m1[1].toFixed(1)} Q${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)} ${m2[0].toFixed(1)} ${m2[1].toFixed(1)}`;
      }
      const last = pts[pts.length - 1];
      return d + ` L${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
    }

    const pins = new Map(), decor = [];
    let curIdx = -9, cam = null, lastNow = 0, lenBefore = 0, lenTotal = 0;
    function addDecor(kind, x, y, r) {
      const el = mk('div', kind, under);
      if (kind === 'park') {
        const w = 70 + r() * 110, h = 60 + r() * 90;
        el.style.cssText = `left:${x - w / 2}px;top:${y - h / 2}px;width:${w}px;height:${h}px;border-radius:${8 + r() * 30}px;transform:rotate(${((r() - 0.5) * 50).toFixed(1)}deg)`;
      } else {                                                // a long diagonal avenue
        const ang = (r() - 0.5) * 120;
        el.style.cssText = `left:${x - 1100}px;top:${y - 7}px;width:2200px;transform:rotate(${ang.toFixed(1)}deg)`;
      }
      decor.push(el);
      if (decor.length > 46) decor.shift().remove();
    }
    function placePin(i, animate) {
      const p = pt(i);
      const el = mk('div', 'pin' + (animate ? ' drop' : ''), layer);
      el.style.left = p.x + 'px'; el.style.top = p.y + 'px';
      mk('div', 'pdrop', el);
      mk('div', 'pcard', el, env.L[i].text);
      pins.set(i, el);
    }
    return {
      update(pos, now, idx) {
        const S = env.S(), W = env.W(), H = env.H();
        theme(root, S);
        root.style.fontSize = nativeSize(S, 13, 24, 0.5).toFixed(1) + 'px';
        const ci = Math.max(0, idx);
        if (idx !== curIdx) {
          const inc = idx === curIdx + 1;
          curIdx = idx;
          if (!inc) { for (const e of pins.values()) e.remove(); pins.clear(); for (const e of decor) e.remove(); decor.length = 0; cam = null; }
          for (let i = Math.max(0, ci - 4); i <= ci; i++) {
            if (!pins.has(i) && env.L[i] && env.L[i].text) placePin(i, inc && i === ci);
            if (!inc || i === ci) {
              const p = pt(i), r = rng(hash(i * 977 + 11));
              for (let k = 0; k < 2; k++) if (r() < 0.6) {
                const ang = r() * Math.PI * 2, dist = 90 + r() * 260;
                addDecor('park', p.x + Math.cos(ang) * dist, p.y + Math.sin(ang) * dist, r);
              }
              if (r() < 0.35) addDecor("ave", p.x + (r() - 0.5) * 300, p.y + (r() - 0.5) * 300, r);
            }
          }
          for (const [i, e] of pins) if (i < ci - 4 || i > ci) { e.remove(); pins.delete(i); }
          for (const [i, e] of pins) e.classList.toggle('on', i === ci);
          const from = Math.max(0, ci - 10);
          const dFull = pathTo(from, ci);
          casing.setAttribute('d', dFull); route.setAttribute('d', dFull);
          lenTotal = route.getTotalLength();
          meas.setAttribute('d', ci > from ? pathTo(from, ci - 1) : dFull);
          lenBefore = ci > from ? meas.getTotalLength() : 0;
          for (const p of [casing, route]) p.style.strokeDasharray = `${lenTotal + 1} ${lenTotal + 40}`;
        }
        // walk along the final leg
        const line = env.L[ci];
        const nextT = env.L[ci + 1] ? env.L[ci + 1].t : (line ? line.t + 4000 : 0);
        const frac = idx < 0 || !line ? 1 : smooth(clamp01((pos - line.t) / Math.min(1500, Math.max(600, (nextT - line.t) * 0.7))));
        const drawn = ci === 0 ? 0 : lenBefore + frac * (lenTotal - lenBefore);
        casing.style.strokeDashoffset = route.style.strokeDashoffset = (lenTotal - drawn + 0.5).toFixed(1);
        const wp = lenTotal > 0 ? route.getPointAtLength(Math.min(lenTotal, drawn)) : pt(ci);
        me.style.left = wp.x + 'px'; me.style.top = wp.y + 'px';
        chipBot.textContent = '🚶 ' + Math.max(1, Math.round(drawn / 90)) + ' min · ' + (drawn / 900).toFixed(1) + ' mi';
        // camera follows
        const b = pt(ci);
        const tx = b.x - W * 0.5, ty = b.y - H * 0.66;
        const dt = Math.min(0.1, Math.max(0, (now - lastNow) / 1000)); lastNow = now;
        if (!cam) cam = { x: tx, y: ty }; else { const k = 1 - Math.exp(-dt * 3.2); cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k; }
        layer.style.transform = `translate(${(-cam.x).toFixed(1)}px,${(-cam.y).toFixed(1)}px)`;
        bg.style.backgroundPosition = `${(-cam.x).toFixed(1)}px ${(-cam.y).toFixed(1)}px`;
      },
    };
  };

  // Notifications: lock-screen cards, stacks and widgets
  SC.notify = (root, env) => {
    root.classList.add('sc-native', 'sc-notify');
    const clock = mk('div', 'nclock', root);
    const ntime = mk('div', 'ntime', clock);
    const ndate = mk('div', 'ndate', clock);
    const stack = mk('div', 'nstack', root);
    const widgets = mk('div', 'nwidgets', root);
    const wm = mk('div', 'nw music', widgets);
    const wmTop = mk('div', 'wtop', wm);
    mk('span', 'wico', wmTop, '♪');
    const wmTxt = mk('div', 'wtxt', wmTop);
    const wTitle = mk('b', '', wmTxt); const wArtist = mk('span', '', wmTxt);
    const wBar = mk('div', 'wbar', wm); const wFill = mk('i', '', wBar);
    mk('div', 'wctl', wm, '⏮︎   ⏸︎   ⏭︎');
    const wd = mk('div', 'nw date', widgets);
    const wdDay = mk('span', '', wd); const wdNum = mk('b', '', wd);
    const wr = mk('div', 'nw ring', widgets);
    mk('div', 'rg', wr); mk('span', '', wr, '82%');
    const APPS = [
      ['Messages', '💬', 'linear-gradient(#5bf675,#0ebe2b)', true],
      ['Mail', '✉️', 'linear-gradient(#4aa8ff,#0a6cf5)', true],
      ['Music', '🎵', 'linear-gradient(#ff6b8a,#fa233b)', false],
      ['Reminders', '✅', 'linear-gradient(#ffb84a,#ff8a00)', false],
      ['Notes', '📝', 'linear-gradient(#ffe66d,#ffc400)', false],
      ['Photos', '🌸', 'linear-gradient(#ff9ecd,#9b7bff)', false],
    ];
    const cards = new Map();
    let curIdx = -9, lastMin = '';
    function card(i, animate) {
      const h = hash(i * 23 + 5), app = APPS[h % APPS.length];
      const c = mk('div', 'ncard', stack);
      const ic = mk('div', 'nico', c, app[1]); ic.style.background = app[2];
      const tx = mk('div', 'ntx', c);
      const row = mk('div', 'nrow', tx);
      mk('b', '', row, app[3] ? NAMES[h % NAMES.length].split(' ')[0] : app[0]);
      mk('span', '', row, 'now');
      mk('div', 'nbody', tx, env.L[i].text);
      cards.set(i, c);
      if (animate) { c.classList.add('pre'); requestAnimationFrame(() => requestAnimationFrame(() => c.classList.remove('pre'))); }
    }
    return {
      update(pos, now, idx) {
        const S = env.S(), m = env.media();
        root.style.fontSize = nativeSize(S, 13, 24, 0.5).toFixed(1) + 'px';
        const d = new Date();
        const tm = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M/i, '');
        if (tm !== lastMin) {
          lastMin = tm; ntime.textContent = tm;
          ndate.textContent = d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
          wdDay.textContent = d.toLocaleDateString([], { weekday: 'short' });
          wdNum.textContent = String(d.getDate());
        }
        wTitle.textContent = (m && m.title) || 'Nothing playing';
        wArtist.textContent = (m && m.artist) || '';
        const pr = m && m.durMs ? clamp01(pos / m.durMs) : clamp01((pos % 9000) / 9000);
        wFill.style.width = (pr * 100).toFixed(1) + '%';
        if (idx !== curIdx) {
          const inc = idx === curIdx + 1;
          if (!inc) { for (const c of cards.values()) c.remove(); cards.clear(); }
          const keep = [];
          for (let i = idx; i >= 0 && keep.length < 3; i--) if (env.L[i] && env.L[i].text) keep.push(i);
          for (const [i, c] of cards) if (!keep.includes(i)) { c.remove(); cards.delete(i); }
          for (const i of keep.slice().reverse()) if (!cards.has(i)) card(i, inc);
          curIdx = idx;
          keep.forEach((i, k) => {
            const c = cards.get(i);
            c.style.setProperty('--k', k);
            c.style.zIndex = 10 - k;
            c.classList.toggle('back', k > 0);
          });
        }
        const top = [...cards.entries()].sort((a, b) => b[0] - a[0])[0];
        const hh = top ? top[1].offsetHeight : 0;
        for (const c of cards.values()) c.style.setProperty('--h', hh + 'px');
      },
    };
  };

  window.SC = SC;
  window.SceneKit = { lineWords, flatWords, iconFor, hash, rng };
})();
