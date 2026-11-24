(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);

  // ---------- Authentic Halo Catalogue Data (from main.js / settings.js) ----------
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
    { id: 'web', group: 'Motion scenes', name: 'Web', desc: 'Each line spun into a spider’s web, a strand for every word.', rec: [580, 440] },
    { id: 'constellation', group: 'Motion scenes', name: 'Constellation', desc: 'Each line traced as a constellation, star by star.', rec: [820, 290] },

    { id: 'chat', group: 'Native design', name: 'Messages', desc: 'The song as a message thread, a bubble for every line.', rec: [520, 330] },
    { id: 'money', group: 'Native design', name: 'Payments', desc: 'The song as a run of payments, one for every line.', rec: [520, 310] },
    { id: 'map', group: 'Native design', name: 'Map', desc: 'A walk across the city, with a pin for every line.', rec: [680, 380] },
    { id: 'notify', group: 'Native design', name: 'Notifications', desc: 'Lines arrive as lock-screen notifications, stacks and widgets.', rec: [520, 350] },
  ];

  const GROUP_NOTE = {
    'Lyric lines': 'Classic karaoke and its variations',
    'Kinetic type': 'Words that move as a scene',
    'Motion scenes': 'Each line becomes a small animation',
    'Native design': 'Keep their own colours, light or dark',
  };

  const GROUP_CLASS = {
    'Lyric lines': 'g-lines',
    'Kinetic type': 'g-kinetic',
    'Motion scenes': 'g-motion',
    'Native design': 'g-native',
  };

  const GLOW_SHAPES = [
    { id: 'classic', name: 'Classic border', desc: 'Rotating dual-colour gradient stroke hugging every display edge.' },
    { id: 'rounded', name: 'Rounded neon', desc: 'Curved neon tube inset softly inside your monitor perimeter.' },
    { id: 'liquid', name: 'Liquid', desc: 'Two layered audio-reactive wave ribbons flowing along all four sides.' },
    { id: 'bars', name: 'Spectrum bars', desc: '64-band FFT equaliser bars radiating inward from screen edges.' },
    { id: 'aurora', name: 'Aurora', desc: 'Soft additive northern-lights curtains swelling to bass energy.' },
    { id: 'corners', name: 'Corner glow', desc: 'Warm pulsing radial spotlights anchored at all four corners.' },
  ];

  const DISC_STYLES = [
    { id: 'vinyl', name: 'Classic Vinyl', desc: 'Dark grooved LP with the album cover as its centre label and a tonearm.' },
    { id: 'picture', name: 'Picture Disc', desc: 'Full-bleed album art pressed across the entire spinning vinyl surface.' },
    { id: 'neon', name: 'Neon Acrylic', desc: 'Translucent glowing vinyl tinted with your active accent colours.' },
    { id: 'cd', name: 'Holographic CD', desc: 'Compact disc with iridescent prism reflections and a clear inner hub.' },
    { id: 'turntable', name: 'Turntable Deck', desc: 'Minimalist dark plinth deck with a glowing strobe dot and tonearm.' },
    { id: 'sleeve', name: 'Album Sleeve', desc: 'Rounded album cover sleeve with the spinning vinyl record sliding out.' },
  ];

  const PALETTES = [
    { id: 'rainbow', label: 'Rainbow', rainbow: true, p: '#ff5fb0', s: '#22d3ee' },
    { id: 'violet', label: 'Violet / Pink', p: '#7c5cff', s: '#ff4fa3' },
    { id: 'cyan', label: 'Cyan / Blue', p: '#22d3ee', s: '#3b82f6' },
    { id: 'sunset', label: 'Sunset', p: '#ff7a18', s: '#ff3d6e' },
    { id: 'mint', label: 'Mint / Teal', p: '#34d399', s: '#06b6d4' },
    { id: 'gold', label: 'Gold / Red', p: '#ffd166', s: '#ef476f' },
  ];

  const DEMO_TRACKS = [
    {
      id: 'starlight',
      title: 'Midnight Vinyl',
      artist: 'Halo Session',
      durMs: 16500,
      lines: [
        { t: 0, text: 'Wait another minute' },
        { t: 2800, text: 'Fire in my heart tonight' },
        { t: 5600, text: 'Dancing under the moon' },
        { t: 8400, text: 'Money cannot buy this love' },
        { t: 11200, text: 'Dreams are made of gold' },
        { t: 14000, text: '' },
      ],
    },
    {
      id: 'city',
      title: 'Late Night Walk',
      artist: 'Chrome & Neon',
      durMs: 16500,
      lines: [
        { t: 0, text: 'Lights across the midnight city' },
        { t: 2800, text: 'Rain drops on the window glass' },
        { t: 5600, text: 'Drive forever down the ocean road' },
        { t: 8400, text: 'Music echoes in the summer sky' },
        { t: 11200, text: 'Keep the stars alive inside your eyes' },
        { t: 14000, text: '' },
      ],
    },
  ];

  // ---------- Thumbnails (from settings.js) ----------
  const T = (inner) => `<div class="th">${inner}</div>`;
  const waveLetters = (word) => [...word].map((c, i) => `<span style="display:inline-block;transform:translateY(${(Math.sin(i * 1.1) * 5).toFixed(1)}px)">${c}</span>`).join('');
  const STAR = (x, y, s) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0-6 L1.4-1.4 L6 0 L1.4 1.4 L0 6 L-1.4 1.4 L-6 0 L-1.4-1.4Z" fill="#fff"/>`;
  function webSvg() {
    let s = '<svg viewBox="0 0 190 120"><g stroke="#fff" fill="none" stroke-linecap="round">';
    const cx = 95, cy = 60, n = 7;
    for (let j = 0; j < n; j++) {
      const a = -Math.PI / 2 + (j * 2 * Math.PI) / n;
      s += `<line x1="${cx}" y1="${cy}" x2="${(cx + Math.cos(a) * 48).toFixed(1)}" y2="${(cy + Math.sin(a) * 48).toFixed(1)}" stroke-opacity=".8" stroke-width="1.4"/>`;
    }
    for (const r of [12, 23, 34, 46]) {
      let d = '';
      for (let j = 0; j < n; j++) {
        const a1 = -Math.PI / 2 + (j * 2 * Math.PI) / n;
        const a2 = -Math.PI / 2 + ((j + 1) * 2 * Math.PI) / n;
        const am = (a1 + a2) / 2;
        const x1 = cx + Math.cos(a1) * r, y1 = cy + Math.sin(a1) * r;
        const x2 = cx + Math.cos(a2) * r, y2 = cy + Math.sin(a2) * r;
        const cr = r * Math.cos(Math.PI / n) * 0.82;
        d += `${j ? '' : 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1)} Q${(cx + Math.cos(am) * cr).toFixed(1)} ${(cy + Math.sin(am) * cr).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)} `;
      }
      s += `<path d="${d}" stroke-opacity=".55" stroke-width="1.1"/>`;
    }
    return s + '</g></svg>';
  }

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

  // ---------- 1. Motion & Lazy-Media Management ----------
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let motionPaused = reducedMotionQuery.matches;

  function syncMotionUI() {
    document.body.classList.toggle('motion-paused', motionPaused);
    const labelEl = $('motion-toggle-label');
    const btnEl = $('motion-toggle');
    if (labelEl) labelEl.textContent = motionPaused ? 'Play motion' : 'Pause motion';
    if (btnEl) {
      btnEl.setAttribute(
        'aria-label',
        motionPaused
          ? 'Play ambient animations and autoplaying previews'
          : 'Pause ambient animations and autoplaying previews',
      );
    }
    for (const video of document.querySelectorAll('video')) {
      if (motionPaused) {
        video.removeAttribute('autoplay');
        if (!video.paused) video.pause();
      } else if (video.id === 'hero-video') {
        video.play().catch(() => {});
      }
    }
  }

  $('motion-toggle')?.addEventListener('click', () => {
    motionPaused = !motionPaused;
    syncMotionUI();
  });

  reducedMotionQuery.addEventListener('change', (e) => {
    motionPaused = e.matches;
    syncMotionUI();
  });

  // Fallback for browsers without native <video loading="lazy">
  if (!Object.hasOwn(HTMLMediaElement.prototype, 'loading')) {
    const lazyVideos = document.querySelectorAll('video[loading="lazy"]');
    if ('IntersectionObserver' in window && lazyVideos.length) {
      const vidObs = new IntersectionObserver((entries, observer) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const media = entry.target;
          if (media.dataset.poster) {
            media.poster = media.dataset.poster;
            delete media.dataset.poster;
          }
          if (media.dataset.preload) {
            media.preload = media.dataset.preload;
            delete media.dataset.preload;
          }
          for (const source of media.querySelectorAll('source[data-src]')) {
            source.src = source.dataset.src;
            delete source.dataset.src;
          }
          media.load();
          observer.unobserve(media);
        }
      }, { rootMargin: '220px 0px' });

      for (const media of lazyVideos) {
        if (media.hasAttribute('poster')) {
          media.dataset.poster = media.getAttribute('poster');
          media.removeAttribute('poster');
        }
        if (media.hasAttribute('preload') && media.getAttribute('preload') !== 'none') {
          media.dataset.preload = media.getAttribute('preload');
        }
        for (const source of media.querySelectorAll('source[src]')) {
          source.dataset.src = source.getAttribute('src');
          source.removeAttribute('src');
        }
        media.preload = 'none';
        vidObs.observe(media);
      }
    }
  }

  // ---------- 2. Dual-State Release Launch Dock & Temporal Countdown ----------
  const TARGET_DATE = '2026-11-26';
  const TARGET_TIME = '00:00:00';
  let userTz = 'UTC';
  try {
    userTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch { /* ignore */ }

  let isTimeReleased = false;
  let previewLaunchMode = false;
  let installerStatus = 'checking'; // 'local' | 'github' | 'unavailable'
  let resolvedInstallerHref = 'dist/Halo-Setup-6.2.0.exe';
  let resolvedInstallerSize = '80.7 MB';
  let resolvedInstallerName = 'Halo-Setup-6.2.0.exe';

  const pad2 = (n) => String(Math.max(0, Math.floor(n))).padStart(2, '0');

  function syncDockState() {
    const dock = $('launch-dock');
    const countdownView = $('launch-countdown-view');
    const releasedView = $('launch-released-view');
    const statusLabel = $('dock-status-label');
    const previewBtn = $('preview-launch-btn');
    const footerTitle = $('footer-cta-title');
    const footerBtn = $('footer-download-btn');
    const footerMini = $('footer-countdown-mini');

    const showReleased = isTimeReleased || previewLaunchMode;
    if (dock) dock.setAttribute('data-state', showReleased ? 'released' : 'countdown');
    if (countdownView) countdownView.hidden = showReleased;
    if (releasedView) releasedView.hidden = !showReleased;

    if (previewBtn) {
      previewBtn.hidden = isTimeReleased;
      previewBtn.setAttribute('aria-pressed', String(previewLaunchMode));
      previewBtn.textContent = previewLaunchMode ? '← Back to Live Countdown' : 'Preview Nov 26 Launch';
    }

    if (statusLabel) {
      if (isTimeReleased) statusLabel.textContent = 'Official Launch Live · v6.2.0';
      else if (previewLaunchMode) statusLabel.textContent = 'Previewing Nov 26 Post-Countdown Launch';
      else statusLabel.textContent = 'Premiere Countdown · Nov 26, 2026';
    }

    if (footerTitle) {
      footerTitle.textContent = showReleased ? 'Halo v6.2.0 Is Live' : 'Premiere: November 26';
    }
    if (isTimeReleased && footerMini) {
      footerMini.textContent = 'Released Nov 26, 2026';
    }
    if (footerBtn) {
      footerBtn.classList.toggle('btn-launch', showReleased);
      footerBtn.classList.toggle('btn-primary', !showReleased);
      footerBtn.textContent = showReleased ? 'Download Halo for Windows' : 'Download v6.2.0 (.exe)';
    }
  }

  $('preview-launch-btn')?.addEventListener('click', () => {
    previewLaunchMode = !previewLaunchMode;
    syncDockState();
  });

  function formatHumanDuration(days, hours, mins, secs, temporalDuration) {
    if (temporalDuration && typeof temporalDuration.toLocaleString === 'function') {
      try {
        const str = temporalDuration.toLocaleString('en-US', { style: 'long' });
        if (str) return `Releases in ${str}`;
      } catch { /* fallback below */ }
    }
    if (typeof Intl !== 'undefined' && typeof Intl.DurationFormat === 'function') {
      try {
        const fmt = new Intl.DurationFormat('en-US', { style: 'long' });
        return `Releases in ${fmt.format({ days, hours, minutes: mins, seconds: secs })}`;
      } catch { /* fallback below */ }
    }
    return `Releases in ${days}d ${hours}h ${mins}m ${secs}s`;
  }

  function updateCountdown() {
    const tzBadge = $('countdown-tz');
    if (tzBadge) tzBadge.textContent = userTz.replace(/_/g, ' ');

    if (typeof globalThis.Temporal !== 'undefined') {
      try {
        const tz = Temporal.Now.timeZoneId();
        const now = Temporal.Now.zonedDateTimeISO(tz);
        const target = Temporal.PlainDate.from(TARGET_DATE)
          .toPlainDateTime(TARGET_TIME)
          .toZonedDateTime(tz);
        const rem = now.until(target, { largestUnit: 'day', smallestUnit: 'second' });

        if (rem.sign <= 0) {
          isTimeReleased = true;
          $('cd-days').textContent = '00';
          $('cd-hours').textContent = '00';
          $('cd-mins').textContent = '00';
          $('cd-secs').textContent = '00';
          $('release-countdown-iso')?.setAttribute('datetime', 'PT0S');
          syncDockState();
          return;
        }

        isTimeReleased = false;
        $('cd-days').textContent = pad2(rem.days);
        $('cd-hours').textContent = pad2(rem.hours);
        $('cd-mins').textContent = pad2(rem.minutes);
        $('cd-secs').textContent = pad2(rem.seconds);
        $('release-countdown-iso')?.setAttribute('datetime', rem.toString());
        const humanEl = $('countdown-human');
        if (humanEl) humanEl.textContent = formatHumanDuration(rem.days, rem.hours, rem.minutes, rem.seconds, rem);
        const footerMini = $('footer-countdown-mini');
        if (footerMini) footerMini.textContent = `${rem.days}d ${pad2(rem.hours)}h ${pad2(rem.minutes)}m until Nov 26`;
        syncDockState();
        return;
      } catch { /* fallback until polyfill completes */ }
    }

    // Immediate synchronous fallback while temporal-polyfill loads (or offline)
    const [y, m, d] = TARGET_DATE.split('-').map(Number);
    const targetDate = new Date(y, m - 1, d, 0, 0, 0, 0);
    const diffMs = targetDate.getTime() - Date.now();
    if (diffMs <= 0) {
      isTimeReleased = true;
      $('cd-days').textContent = '00';
      $('cd-hours').textContent = '00';
      $('cd-mins').textContent = '00';
      $('cd-secs').textContent = '00';
      syncDockState();
      return;
    }
    isTimeReleased = false;
    const totalSec = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    $('cd-days').textContent = pad2(days);
    $('cd-hours').textContent = pad2(hours);
    $('cd-mins').textContent = pad2(mins);
    $('cd-secs').textContent = pad2(secs);
    $('release-countdown-iso')?.setAttribute('datetime', `P${days}DT${hours}H${mins}M${secs}S`);
    const humanEl = $('countdown-human');
    if (humanEl) humanEl.textContent = formatHumanDuration(days, hours, mins, secs, null);
    const footerMini = $('footer-countdown-mini');
    if (footerMini) footerMini.textContent = `${days}d ${pad2(hours)}h ${pad2(mins)}m until Nov 26`;
    syncDockState();
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  // Conditionally load temporal-polyfill when native Temporal is unavailable
  (async () => {
    if (typeof globalThis.Temporal === 'undefined') {
      try {
        const mod = await import('https://esm.sh/temporal-polyfill');
        if (mod && mod.Temporal) {
          globalThis.Temporal = mod.Temporal;
          updateCountdown();
        }
      } catch { /* stay on deterministic fallback if offline */ }
    }
  })();

  // Zero-404 installer resolution: verify local dist/Halo-Setup-6.2.0.exe first;
  // only query GitHub Releases if the local binary isn't served on this origin.
  function applyInstallerLinks() {
    document.querySelectorAll('.js-installer-link').forEach((link) => {
      link.setAttribute('href', resolvedInstallerHref);
      if (installerStatus === 'local') {
        link.setAttribute('download', resolvedInstallerName);
        link.removeAttribute('target');
      } else if (installerStatus === 'github') {
        link.removeAttribute('download');
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener');
      }
    });
    const sub = $('dl-btn-sub');
    if (sub) {
      if (installerStatus === 'local') {
        sub.textContent = `Local Installer Ready · ${resolvedInstallerSize} · Win 10 & 11 (x64)`;
      } else if (installerStatus === 'github') {
        sub.textContent = `Windows 10 & 11 (x64 · ${resolvedInstallerSize}) · ${resolvedInstallerName}`;
      } else {
        sub.textContent = 'Run or build from source (Windows 10 & 11 x64)';
      }
    }
  }

  async function resolveInstallerTarget() {
    try {
      const localRes = await fetch('dist/Halo-Setup-6.2.0.exe', { method: 'HEAD' });
      if (localRes.ok) {
        const bytes = Number(localRes.headers.get('content-length')) || 84672588;
        resolvedInstallerSize = `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        resolvedInstallerHref = 'dist/Halo-Setup-6.2.0.exe';
        resolvedInstallerName = 'Halo-Setup-6.2.0.exe';
        installerStatus = 'local';
        applyInstallerLinks();
        return;
      }
    } catch { /* not hosted alongside local dist/ */ }

    try {
      const r = await fetch('https://api.github.com/repos/arvgdhi/HaloVisual/releases', {
        headers: { Accept: 'application/vnd.github+json' },
      });
      if (r.ok) {
        const releases = await r.json();
        if (Array.isArray(releases)) {
          for (const rel of releases) {
            if (!rel || rel.draft) continue;
            const asset = (rel.assets || []).find((a) => a && /^Halo-Setup-.*\.exe$/i.test(a.name));
            if (asset && asset.browser_download_url) {
              resolvedInstallerHref = asset.browser_download_url;
              resolvedInstallerName = asset.name;
              resolvedInstallerSize = asset.size ? `${(asset.size / (1024 * 1024)).toFixed(1)} MB` : '80.7 MB';
              installerStatus = 'github';
              applyInstallerLinks();
              return;
            }
          }
        }
      }
    } catch { /* fallback to modal helper below */ }

    installerStatus = 'unavailable';
    applyInstallerLinks();
  }
  resolveInstallerTarget();

  const releaseDialog = $('release-dialog');
  document.querySelectorAll('.js-installer-link').forEach((link) => {
    link.addEventListener('click', (e) => {
      if (installerStatus === 'unavailable' && releaseDialog?.showModal) {
        e.preventDefault();
        releaseDialog.showModal();
      }
    });
  });

  $('dialog-close-btn')?.addEventListener('click', () => releaseDialog?.close());
  $('dialog-done-btn')?.addEventListener('click', () => releaseDialog?.close());
  releaseDialog?.addEventListener('click', (e) => {
    if (e.target === releaseDialog) releaseDialog.close();
  });

  // Theater View toggle
  const theaterBtn = $('theater-toggle-btn');
  if (theaterBtn) {
    theaterBtn.addEventListener('click', () => {
      const hero = $('top');
      if (!hero) return;
      const active = hero.classList.toggle('is-theater');
      theaterBtn.setAttribute('aria-pressed', String(active));
      theaterBtn.textContent = active ? 'Standard View' : 'Theater View';
      syncCanvasSizes();
    });
  }

  // ---------- 3. Hero Video Switcher & Footage Screenshot Toggles ----------
  document.querySelectorAll('.hero-clip-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.hero-clip-btn').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      const vid = $('hero-video');
      const src = $('hero-video-src');
      const title = $('hero-video-title');
      if (title && btn.dataset.title) title.textContent = btn.dataset.title;
      if (vid && src && btn.dataset.src) {
        vid.poster = btn.dataset.poster || '';
        src.src = btn.dataset.src;
        vid.load();
        if (!motionPaused) vid.play().catch(() => {});
      }
      if (btn.dataset.c1 && btn.dataset.c2) {
        setPaletteColors(btn.dataset.c1, btn.dataset.c2, btn.dataset.clip === 'rainbow');
      }
    });
  });

  document.querySelectorAll('.footage-card .toggle-media-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.footage-card');
      const vid = card?.querySelector('video');
      const nextStill = card?.getAttribute('data-mode') !== 'still';
      card?.setAttribute('data-mode', nextStill ? 'still' : 'video');
      btn.setAttribute('aria-pressed', String(nextStill));
      btn.textContent = nextStill ? 'Play Video' : 'Screenshot';
      if (vid) {
        if (nextStill && !vid.paused) vid.pause();
        else if (!nextStill && !motionPaused) vid.play().catch(() => {});
      }
    });
  });

  // ---------- 4. Interactive Desktop Simulator (21 Lyric Styles + 6 Glow + 6 Discs) ----------
  const sim = {
    lyricStyle: 'classic',
    shape: 'classic',
    discStyle: 'vinyl',
    paletteId: 'rainbow',
    rainbow: true,
    primary: '#7c5cff',
    secondary: '#22d3ee',
    nativeTheme: 'dark',
    font: 'Google Sans',
    bold: true,
    fontSize: 32,
    lyricAlign: 'center',
    lyricColor: 'white',
    pastLines: 1,
    futureLines: 1,
    lineBlur: false,
    thickness: 6,
    glowSize: 1,
    lyricW: 680,
    lyricH: 300,
    trackIdx: 0,
    playing: true,
  };

  const simMedia = { title: DEMO_TRACKS[0].title, artist: DEMO_TRACKS[0].artist, durMs: DEMO_TRACKS[0].durMs, playing: true };

  // Helpers mirroring renderer.js
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const easeOutBack = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const rgbStr = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

  function hsvToRgb(h, s, v) {
    const f = (n) => { const k = (n + h * 6) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
    return [f(5) * 255, f(3) * 255, f(1) * 255];
  }

  let curP = hexToRgb(sim.primary);
  let curS = hexToRgb(sim.secondary);

  function setPaletteColors(c1, c2, isRainbow = false) {
    sim.primary = c1;
    sim.secondary = c2;
    sim.rainbow = isRainbow;
    if (!isRainbow) {
      document.documentElement.style.setProperty('--c1', c1);
      document.documentElement.style.setProperty('--c2', c2);
      document.documentElement.style.setProperty('--glow', c1);
    }
    syncUIState();
  }

  function currentPalette(now) {
    if (sim.rainbow) {
      const h = (now / 9000) % 1;
      return [hsvToRgb(h, 0.72, 1), hsvToRgb((h + 0.14) % 1, 0.72, 1)];
    }
    return [hexToRgb(sim.primary), hexToRgb(sim.secondary)];
  }

  // Simulated 64-band FFT audio envelope
  const NB = 64;
  const simBands = new Float32Array(NB);
  let simLevel = 0.25;
  function updateAudioSim(now) {
    if (!sim.playing || motionPaused) {
      simLevel = 0.14;
      for (let i = 0; i < NB; i++) simBands[i] *= 0.92;
      return 0.12;
    }
    const beat = Math.pow(Math.max(0, Math.sin(now / 260)), 6);
    const pulse = Math.pow(Math.max(0, Math.sin(now / 520 + 1.1)), 4);
    const raw = 0.22 + beat * 0.55 + pulse * 0.23;
    simLevel = Math.max(raw, simLevel * 0.88);
    for (let i = 0; i < NB; i++) {
      const target = clamp01(0.18 + 0.55 * Math.sin(now / 220 + i * 0.24) * 0.5 + beat * (1 - i / NB) * 0.5);
      simBands[i] = lerp(simBands[i], target, 0.22);
    }
    return raw;
  }

  // Canvas Glow Drawer (reused for both #demo-glow and subtle ambient #site-glow)
  function drawEdgeGlow(canvas, ctx, now, shape, alphaScale, spreadScale) {
    const w = canvas.width, h = canvas.height;
    if (!w || !h) return;
    ctx.clearRect(0, 0, w, h);
    const vis = alphaScale;
    if (vis <= 0.01) return;

    const eachEdge = (fn) => {
      const E = [[0, 0, 0, w], [w, 0, Math.PI / 2, h], [w, h, Math.PI, w], [0, h, -Math.PI / 2, h]];
      E.forEach(([x, y, r, len], i) => { ctx.save(); ctx.translate(x, y); ctx.rotate(r); fn(len, i); ctx.restore(); });
    };
    const edgeGrad = (len) => {
      const g = ctx.createLinearGradient(0, 0, len, 0);
      g.addColorStop(0, rgbStr(curP));
      g.addColorStop(0.5, rgbStr(curS));
      g.addColorStop(1, rgbStr(curP));
      return g;
    };
    const bandAt = (t) => simBands[Math.min(NB - 1, Math.floor(Math.abs(2 * t - 1) * NB))];
    const gSize = sim.glowSize * spreadScale;

    ctx.save();
    if (shape === 'classic' || shape === 'rounded') {
      const a = now / 5000, cx = w / 2, cy = h / 2, r = Math.hypot(w, h) / 2;
      const g = ctx.createLinearGradient(cx - Math.cos(a) * r, cy - Math.sin(a) * r, cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      g.addColorStop(0, rgbStr(curP)); g.addColorStop(0.5, rgbStr(curS)); g.addColorStop(1, rgbStr(curP));
      const lw = Math.max(2, sim.thickness * spreadScale * (1 + simLevel * 1.1));
      ctx.lineWidth = lw;
      ctx.strokeStyle = g;
      ctx.shadowColor = rgbStr(curP);
      ctx.shadowBlur = (22 + simLevel * 55) * gSize;
      ctx.globalAlpha = (0.45 + simLevel * 0.55) * vis;
      for (let i = 0; i < 2; i++) {
        if (shape === 'rounded') {
          const inset = lw / 2 + 6;
          ctx.beginPath();
          ctx.roundRect(inset, inset, Math.max(10, w - inset * 2), Math.max(10, h - inset * 2), 26);
          ctx.stroke();
        } else {
          ctx.strokeRect(0, 0, w, h);
        }
      }
    } else if (shape === 'liquid') {
      const time = now / 1000;
      const waveH = (t, tm, seed) => {
        const amp = 74 * gSize;
        const body = 0.55 * bandAt(t) + 0.45 * simLevel * (0.6 + 0.4 * Math.sin(t * 5 + tm + seed));
        const wob = 5 * Math.sin(t * 13 + tm * 1.7 + seed) + 3 * Math.sin(t * 29 - tm * 2.3 + seed * 1.7);
        return Math.max(2, sim.thickness * 1.8 + amp * body + wob);
      };
      eachEdge((len, i) => {
        for (let layer = 0; layer < 2; layer++) {
          const k = layer ? 0.7 : 1;
          ctx.globalAlpha = (layer ? 0.45 : 0.85) * vis * (0.65 + 0.35 * simLevel);
          ctx.fillStyle = edgeGrad(len);
          ctx.shadowColor = rgbStr(curP);
          ctx.shadowBlur = 16 * gSize;
          const step = Math.max(8, len / 72);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          let px = 0, py = waveH(0, time + layer * 1.3, i + layer * 3) * k;
          ctx.lineTo(0, py);
          for (let x = step; x <= len + step; x += step) {
            const cx = Math.min(x, len);
            const y = waveH(cx / len, time + layer * 1.3, i + layer * 3) * k;
            ctx.quadraticCurveTo(px, py, (px + cx) / 2, (py + y) / 2);
            px = cx; py = y;
          }
          ctx.lineTo(len, py); ctx.lineTo(len, 0); ctx.closePath(); ctx.fill();
        }
      });
    } else if (shape === 'bars') {
      ctx.shadowColor = rgbStr(curP);
      ctx.shadowBlur = 10 * gSize;
      ctx.globalAlpha = (0.55 + simLevel * 0.45) * vis;
      eachEdge((len) => {
        const n = 44, slot = len / n, bw = Math.max(2.5, slot * 0.6);
        ctx.fillStyle = edgeGrad(len);
        for (let b = 0; b < n; b++) {
          const t = (b + 0.5) / n;
          const v = simBands[Math.min(NB - 1, Math.floor(t * NB * 0.85))];
          const hgt = sim.thickness + v * (38 + 50 * gSize) + 2 * Math.sin(now / 400 + b);
          ctx.beginPath();
          ctx.roundRect(b * slot + (slot - bw) / 2, 0, bw, hgt, bw / 2);
          ctx.fill();
        }
      });
    } else if (shape === 'aurora') {
      const time = now / 1000;
      ctx.globalCompositeOperation = 'lighter';
      const depth = (45 + simLevel * 95) * gSize + sim.thickness * 2;
      eachEdge((len, i) => {
        for (let layer = 0; layer < 3; layer++) {
          const col = layer % 2 ? curS : curP;
          const g = ctx.createLinearGradient(0, 0, 0, depth);
          g.addColorStop(0, rgbStr(col, 0.55));
          g.addColorStop(1, rgbStr(col, 0));
          ctx.fillStyle = g;
          ctx.globalAlpha = (0.5 + simLevel * 0.4) * vis;
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
    } else if (shape === 'corners') {
      const R = (130 + simLevel * 220) * gSize + sim.thickness * 4;
      const corners = [[0, 0, curP], [w, 0, curS], [w, h, curP], [0, h, curS]];
      ctx.globalCompositeOperation = 'lighter';
      corners.forEach(([x, y, col], i) => {
        const pulse = 0.75 + 0.25 * Math.sin(now / 700 + i * 1.6);
        const g = ctx.createRadialGradient(x, y, 0, x, y, R * pulse);
        g.addColorStop(0, rgbStr(col, 0.85));
        g.addColorStop(0.45, rgbStr(col, 0.3));
        g.addColorStop(1, rgbStr(col, 0));
        ctx.globalAlpha = (0.5 + simLevel * 0.5) * vis;
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      });
    }
    ctx.restore();
  }

  // Simulator Stage Resizing & Canvas DPR
  const simStageEl = $('sim-stage');
  const demoGlowCanvas = $('demo-glow');
  const demoGlowCtx = demoGlowCanvas?.getContext('2d');
  const siteGlowCanvas = $('site-glow');
  const siteGlowCtx = siteGlowCanvas?.getContext('2d');
  const demoLyricsEl = $('demo-lyrics');
  const demoStageEl = $('demo-stage');
  const demoTrackEl = $('demo-track');
  const demoSceneEl = $('demo-scene');
  const demoPlayerEl = $('demo-player');
  const demoRecordEl = $('demo-record');
  const demoArmEl = $('demo-armg');

  function syncCanvasSizes() {
    if (siteGlowCanvas) {
      siteGlowCanvas.width = window.innerWidth;
      siteGlowCanvas.height = window.innerHeight;
    }
    if (simStageEl && demoGlowCanvas) {
      const r = simStageEl.getBoundingClientRect();
      demoGlowCanvas.width = Math.max(300, Math.round(r.width));
      demoGlowCanvas.height = Math.max(180, Math.round(r.height));

      // Keep the 680x300 lyric box cleanly scaled inside the responsive stage
      if (demoLyricsEl) {
        const stDef = STYLE_DEFS.find((x) => x.id === sim.lyricStyle);
        const bw = stDef ? stDef.rec[0] : 680;
        const bh = stDef ? stDef.rec[1] : 260;
        sim.lyricW = bw;
        sim.lyricH = bh;
        demoLyricsEl.style.width = bw + 'px';
        demoLyricsEl.style.height = bh + 'px';
        demoLyricsEl.style.fontSize = sim.fontSize + 'px';
        const availW = r.width * 0.64;
        const availH = r.height * 0.78;
        const scale = Math.min(1, availW / bw, availH / bh);
        demoLyricsEl.style.setProperty('--sim-scale', scale.toFixed(3));
      }
    }
  }
  window.addEventListener('resize', syncCanvasSizes);

  // Simulator List Lyric Engine (from renderer.js)
  const SK = window.SceneKit;
  const SC = window.SC || {};
  const KIN = new Set(['pop', 'rise', 'typewriter', 'wave', 'blur']);
  const NATIVE = new Set(['chat', 'money', 'map', 'notify', 'code', 'codeVisual']);
  const OPA = [1, 0.52, 0.32, 0.2, 0.14];

  let listL = null, lineEls = [], activeIdx = -2, activeWords = [], big = null, bigIdx = -2, activeStyle = '';
  let trackY = 0, placed = false, lastRange = [0, -1], lastLayoutSig = '';
  let scene = null, sceneKey = '', sceneL = null;

  function fillPlain(rec) {
    rec.inn.textContent = '';
    for (const w of rec.words) {
      const s = document.createElement('span');
      s.className = 'word';
      s.textContent = w.text;
      rec.inn.appendChild(s);
    }
  }

  function buildList(L) {
    demoTrackEl.textContent = '';
    lineEls = [];
    activeIdx = -2; activeWords = []; big = null; placed = false; lastRange = [0, -1]; lastLayoutSig = '';
    L.forEach((line, i) => {
      const el = document.createElement('div');
      el.className = 'ln' + (line.text ? '' : ' empty');
      const inn = document.createElement('div');
      inn.className = 'in';
      el.appendChild(inn);
      const rec = { el, inn, empty: !line.text, words: SK ? SK.lineWords(L, i) : [] };
      if (!rec.empty) fillPlain(rec);
      demoTrackEl.appendChild(el);
      lineEls.push(rec);
    });
    listL = L;
  }

  function deactivate() {
    const r = lineEls[activeIdx];
    if (r) {
      r.el.classList.remove('cur', 'kin', 'grad');
      r.inn.style.transform = '';
      if (!r.empty) fillPlain(r);
    }
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
        for (const ch of w.text) {
          const c = document.createElement('span');
          c.className = 'ch'; c.textContent = ch;
          span.appendChild(c); chars.push(c);
        }
      } else {
        span.textContent = w.text;
      }
      host.appendChild(span);
      activeWords.push({ el: span, chars, start: w.start, end: w.end, gi: w.gi, p: -1, last: '', s: null, n: -1 });
    }
  }

  function markSung(w, on) { if (w.s !== on) { w.s = on; w.el.classList.toggle('sung', on); } }
  function setW(w, transform, opacity, filter) {
    const key = transform + '|' + opacity + '|' + filter;
    if (key === w.last) return;
    w.last = key;
    w.el.style.transform = transform;
    w.el.style.opacity = opacity;
    w.el.style.filter = filter;
  }

  function animateWord(w, pos, now, style) {
    const t = pos - w.start;
    const dur = Math.max(1, w.end - w.start);
    switch (style) {
      case 'pop': {
        const e = t < 0 ? 0 : easeOutBack(clamp01(t / 320));
        setW(w, `scale(${(0.3 + 0.7 * e).toFixed(3)})`, t < 0 ? 0 : clamp01(t / 140).toFixed(2), 'none');
        markSung(w, t >= 0);
        break;
      }
      case 'rise': {
        const e = t < 0 ? 0 : easeOutCubic(clamp01(t / 360));
        setW(w, `translateY(${((1 - e) * 0.75).toFixed(3)}em) rotate(${((1 - e) * 7).toFixed(2)}deg)`, e.toFixed(2), 'none');
        markSung(w, t >= 0);
        break;
      }
      case 'blur': {
        const e = t < 0 ? 0 : easeOutCubic(clamp01(t / 450));
        setW(w, `scale(${(1.12 - 0.12 * e).toFixed(3)})`, (0.18 + 0.82 * e).toFixed(2), `blur(${((1 - e) * 14).toFixed(1)}px)`);
        markSung(w, t >= 0);
        break;
      }
      case 'typewriter': {
        const len = w.chars.length;
        const n = t < 0 ? 0 : Math.min(len, Math.floor(t / (dur / len)) + 1);
        if (n !== w.n) { w.n = n; w.chars.forEach((c, i) => { c.style.opacity = i < n ? 1 : 0; }); }
        markSung(w, t >= 0);
        break;
      }
      case 'wave': {
        const amp = t >= 0 ? 0.16 : 0.05;
        for (let i = 0; i < w.chars.length; i++) {
          w.chars[i].style.transform = `translateY(${(Math.sin(now / 230 + (w.gi + i) * 0.6) * amp).toFixed(3)}em)`;
        }
        markSung(w, t >= 0);
        break;
      }
      default: {
        const p = clamp01(t / dur);
        if (Math.abs(p - w.p) > 0.01) { w.p = p; w.el.style.setProperty('--p', p); }
      }
    }
  }

  function layoutLines(idx) {
    const past = sim.pastLines, fut = sim.futureLines;
    const a = Math.max(0, Math.min(lastRange[0], idx - past - 1));
    const b = Math.min(lineEls.length - 1, Math.max(lastRange[1], idx + fut + 1));
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
    }
    lastRange = [Math.max(0, idx - past - 1), Math.min(lineEls.length - 1, idx + fut + 1)];
  }

  let dtLast = performance.now();
  function updateList(L, pos, now, idx, style) {
    if (L !== listL) buildList(L);
    demoTrackEl.classList.toggle('sp', style === 'spotlight');
    demoStageEl.classList.add('fade');
    const sig = [idx, style, sim.lyricW, sim.lyricH].join('|');
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
      const e = simLevel;
      const jitter = e > 0.65 ? (Math.sin(now / 35) * 0.7) : 0;
      rec.inn.style.transform = `scale(${(1 + e * 0.16).toFixed(3)}) rotate(${jitter.toFixed(2)}deg)`;
    }
    const cur = idx >= 0 ? lineEls[idx] : lineEls[0];
    if (cur) {
      const mid = cur.el.offsetTop + cur.el.offsetHeight / 2 + (idx < 0 ? cur.el.offsetHeight : 0);
      const target = sim.lyricH / 2 - mid;
      const dt = Math.min(0.1, (now - dtLast) / 1000);
      if (!placed) { trackY = target; placed = true; }
      else trackY += (target - trackY) * (1 - Math.exp(-dt * 9));
      demoTrackEl.style.transform = `translateY(${trackY.toFixed(1)}px)`;
    }
  }

  function ensureScene(L, style) {
    if (scene && sceneL === L && sceneKey === style) return;
    if (scene && scene.destroy) scene.destroy();
    demoSceneEl.textContent = '';
    demoSceneEl.className = '';
    demoSceneEl.removeAttribute('style');
    sceneL = L; sceneKey = style;
    const env = {
      L, demo: true,
      S: () => sim,
      W: () => sim.lyricW,
      H: () => sim.lyricH,
      media: () => simMedia,
      level: () => simLevel,
    };
    scene = SC[style](demoSceneEl, env);
    demoStageEl.classList.toggle('isScene', NATIVE.has(style));
  }

  function setSceneMode(isScene) {
    demoTrackEl.style.display = isScene ? 'none' : '';
    demoSceneEl.style.display = isScene ? '' : 'none';
    if (!isScene) {
      if (scene && scene.destroy) scene.destroy();
      scene = null; sceneKey = ''; demoStageEl.classList.remove('isScene');
    } else {
      listL = null;
    }
  }

  // Disc rotation state
  let discAng = 0, discSpin = 0, armAng = 0, lastFrameTime = performance.now();
  let accentTick = 0;

  let simClockMs = 0;
  function simTick(now) {
    requestAnimationFrame(simTick);
    const dt = Math.min(0.08, Math.max(0, (now - lastFrameTime) / 1000));
    lastFrameTime = now;

    if (sim.playing && !motionPaused) {
      simClockMs += dt * 1000;
    }

    updateAudioSim(now);
    const [tp, ts] = currentPalette(now);
    for (let i = 0; i < 3; i++) {
      curP[i] = lerp(curP[i], tp[i], 0.08);
      curS[i] = lerp(curS[i], ts[i], 0.08);
    }

    if (sim.rainbow && now - accentTick > 250) {
      accentTick = now;
      document.documentElement.style.setProperty('--c1', rgbStr(curP));
      document.documentElement.style.setProperty('--c2', rgbStr(curS));
      document.documentElement.style.setProperty('--glow', rgbStr(curP, 0.52));
    }

    // Draw glows
    if (demoGlowCanvas && demoGlowCtx) {
      drawEdgeGlow(demoGlowCanvas, demoGlowCtx, now, sim.shape, 0.92, 0.8);
    }
    if (siteGlowCanvas && siteGlowCtx) {
      drawEdgeGlow(siteGlowCanvas, siteGlowCtx, now, sim.shape, motionPaused ? 0.25 : 0.42, 0.45);
    }

    // Spin demo record
    const activePlay = sim.playing && !motionPaused;
    if (demoPlayerEl) {
      demoPlayerEl.classList.toggle('playing', activePlay);
      discSpin += ((activePlay ? 200 : 0) - discSpin) * Math.min(1, dt * 2.5);
      discAng = (discAng + discSpin * dt) % 360;
      if (demoRecordEl) demoRecordEl.style.transform = `rotate(${discAng.toFixed(2)}deg)`;
      armAng += ((activePlay ? 0 : -50) - armAng) * Math.min(1, dt * 3);
      if (demoArmEl) demoArmEl.setAttribute('transform', `rotate(${armAng.toFixed(2)} 112 -6)`);
    }

    // Update lyrics/scene
    const track = DEMO_TRACKS[sim.trackIdx];
    const L = track.lines;
    const pos = simClockMs % track.durMs;
    let idx = -1;
    for (let i = 0; i < L.length; i++) {
      if (L[i].t <= pos) idx = i;
      else break;
    }

    const isScene = !!SC[sim.lyricStyle];
    if (isScene !== (demoTrackEl?.style.display === 'none')) setSceneMode(isScene);
    if (isScene) {
      ensureScene(L, sim.lyricStyle);
      demoStageEl?.classList.remove('fade');
      scene.update(pos, now, idx);
    } else if (demoTrackEl) {
      updateList(L, pos, now, idx, sim.lyricStyle);
    }
    dtLast = now;
  }

  // ---------- 5. Render Style Cards, Glow Cards, Disc Cards, & Control Chips ----------
  function syncUIState() {
    const sDef = STYLE_DEFS.find((x) => x.id === sim.lyricStyle);
    const gDef = GLOW_SHAPES.find((x) => x.id === sim.shape);
    const dDef = DISC_STYLES.find((x) => x.id === sim.discStyle);

    if (demoPlayerEl) demoPlayerEl.dataset.disc = sim.discStyle;

    const summary = $('sim-active-summary');
    if (summary && sDef && gDef && dDef) {
      summary.textContent = `Style: ${sDef.name} · Glow: ${gDef.name} · Record: ${dDef.name}`;
    }

    document.querySelectorAll('#styles-catalogue .style-card').forEach((card) => {
      card.setAttribute('aria-pressed', String(card.dataset.id === sim.lyricStyle));
    });
    document.querySelectorAll('#glow-shapes-grid .style-card').forEach((card) => {
      card.setAttribute('aria-pressed', String(card.dataset.id === sim.shape));
    });
    document.querySelectorAll('#disc-styles-grid .style-card').forEach((card) => {
      card.setAttribute('aria-pressed', String(card.dataset.id === sim.discStyle));
    });
    document.querySelectorAll('.theme-btn').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.theme === sim.nativeTheme));
    });
    document.querySelectorAll('#sim-palette-chips .sim-chip').forEach((c) => {
      c.setAttribute('aria-pressed', String(c.dataset.id === sim.paletteId));
    });
    document.querySelectorAll('#sim-track-chips .sim-chip').forEach((c) => {
      c.setAttribute('aria-pressed', String(Number(c.dataset.idx) === sim.trackIdx));
    });
  }

  function renderStylesCatalogue(filterGroup = 'all') {
    const host = $('styles-catalogue');
    if (!host) return;
    host.textContent = '';

    const groups = filterGroup === 'all'
      ? [...new Set(STYLE_DEFS.map((s) => s.group))]
      : [filterGroup];

    for (const g of groups) {
      const wrap = document.createElement('div');
      wrap.className = 'style-group';

      const head = document.createElement('div');
      head.className = 'style-group-head';
      head.innerHTML = `<h3>${g}</h3><span>${GROUP_NOTE[g] || ''}</span>`;
      wrap.appendChild(head);

      const grid = document.createElement('div');
      grid.className = `gal ${GROUP_CLASS[g] || ''}`;

      for (const s of STYLE_DEFS.filter((x) => x.group === g)) {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'style-card';
        card.dataset.id = s.id;
        card.setAttribute('aria-pressed', String(sim.lyricStyle === s.id));
        card.innerHTML = `
          <div class="th-wrap">${(THUMBS[s.id] || (() => T(s.name)))()}</div>
          <div class="meta">
            <div class="meta-top">
              <b>${s.name}</b>
              <span class="rec-size">${s.rec[0]}×${s.rec[1]}</span>
            </div>
            <span>${s.desc}</span>
          </div>
          <div class="tick" aria-hidden="true">✓</div>
        `;
        card.addEventListener('click', () => {
          sim.lyricStyle = s.id;
          syncCanvasSizes();
          syncUIState();
          const simTop = $('simulator')?.getBoundingClientRect().top ?? 0;
          if (simTop < -180) {
            $('simulator')?.scrollIntoView({ behavior: reducedMotionQuery.matches ? 'auto' : 'smooth', block: 'center' });
          }
        });
        grid.appendChild(card);
      }

      wrap.appendChild(grid);
      host.appendChild(wrap);
    }
  }

  function renderGlowAndDiscCards() {
    const glowHost = $('glow-shapes-grid');
    if (glowHost) {
      glowHost.textContent = '';
      for (const sh of GLOW_SHAPES) {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'style-card';
        card.dataset.id = sh.id;
        card.setAttribute('aria-pressed', String(sim.shape === sh.id));
        let previewHtml = `<div class="glow-preview gp-${sh.id}"><span>${sh.name}</span></div>`;
        if (sh.id === 'bars') {
          const bars = [26, 52, 78, 60, 88, 44, 72, 92, 64, 38, 82, 54]
            .map((v) => `<i style="--h:${v}%"></i>`).join('');
          previewHtml = `<div class="glow-preview gp-bars"><span>${sh.name}</span><div class="gp-bars-viz">${bars}</div></div>`;
        }
        card.innerHTML = `
          <div class="th-wrap">${previewHtml}</div>
          <div class="meta"><b>${sh.name}</b><span>${sh.desc}</span></div>
          <div class="tick" aria-hidden="true">✓</div>
        `;
        card.addEventListener('click', () => {
          sim.shape = sh.id;
          syncUIState();
        });
        glowHost.appendChild(card);
      }
    }

    const discHost = $('disc-styles-grid');
    if (discHost) {
      discHost.textContent = '';
      for (const ds of DISC_STYLES) {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'style-card g-disc';
        card.dataset.id = ds.id;
        card.setAttribute('aria-pressed', String(sim.discStyle === ds.id));
        card.innerHTML = `
          <div class="th-wrap">${(DISC_THUMBS[ds.id] || (() => T(ds.name)))()}</div>
          <div class="meta"><b>${ds.name}</b><span>${ds.desc}</span></div>
          <div class="tick" aria-hidden="true">✓</div>
        `;
        card.addEventListener('click', () => {
          sim.discStyle = ds.id;
          syncUIState();
        });
        discHost.appendChild(card);
      }
    }
  }

  function renderSimulatorChips() {
    const palHost = $('sim-palette-chips');
    if (palHost) {
      palHost.textContent = '';
      for (const pal of PALETTES) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'sim-chip';
        b.dataset.id = pal.id;
        const swatchBg = pal.rainbow
          ? 'linear-gradient(90deg,#f66,#fc3,#6f9,#4cf,#a6f)'
          : `linear-gradient(135deg,${pal.p},${pal.s})`;
        b.innerHTML = `<span class="swatch" style="background:${swatchBg}"></span>${pal.label}`;
        b.addEventListener('click', () => {
          sim.paletteId = pal.id;
          setPaletteColors(pal.p, pal.s, !!pal.rainbow);
        });
        palHost.appendChild(b);
      }
    }

    const trackHost = $('sim-track-chips');
    if (trackHost) {
      trackHost.textContent = '';
      DEMO_TRACKS.forEach((tr, idx) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'sim-chip';
        b.dataset.idx = String(idx);
        b.textContent = tr.title;
        b.addEventListener('click', () => {
          sim.trackIdx = idx;
          simMedia.title = tr.title;
          simMedia.artist = tr.artist;
          simMedia.durMs = tr.durMs;
          simClockMs = 0;
          syncUIState();
        });
        trackHost.appendChild(b);
      });
    }

    document.querySelectorAll('.theme-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        sim.nativeTheme = btn.dataset.theme === 'light' ? 'light' : 'dark';
        syncUIState();
      });
    });

    $('sim-play-btn')?.addEventListener('click', () => {
      sim.playing = !sim.playing;
      simMedia.playing = sim.playing;
      $('sim-play-btn').textContent = sim.playing ? 'Pause Beat' : 'Resume Beat';
    });
  }

  // ---------- 6. Accessible Category Tabs (focusgroup + keyboard fallback) ----------
  const tabButtons = [...document.querySelectorAll('[role="tablist"] [role="tab"]')];
  const panelEl = $('styles-panel');

  function selectTab(tab) {
    for (const t of tabButtons) {
      const selected = t === tab;
      t.setAttribute('aria-selected', String(selected));
      t.toggleAttribute('focusgroupstart', selected);
    }
    if (panelEl) panelEl.setAttribute('aria-labelledby', tab.id);
    const group = tab.dataset.group || 'all';
    renderStylesCatalogue(group);
    tab.scrollIntoView({ block: 'nearest', inline: 'nearest', container: 'nearest' });
  }

  tabButtons.forEach((tab, idx) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('focus', () => {
      if (tab.getAttribute('aria-selected') !== 'true') selectTab(tab);
    });
    tab.addEventListener('keydown', (e) => {
      let next = -1;
      if (e.key === 'ArrowRight') next = (idx + 1) % tabButtons.length;
      else if (e.key === 'ArrowLeft') next = (idx - 1 + tabButtons.length) % tabButtons.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabButtons.length - 1;
      if (next >= 0) {
        e.preventDefault();
        tabButtons[next].focus();
        selectTab(tabButtons[next]);
      }
    });
  });

  // ---------- 7. Copy Commands Toast ----------
  let toastTimer = null;
  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy || '';
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        const toast = $('copy-toast');
        if (toast) {
          toast.hidden = false;
          clearTimeout(toastTimer);
          toastTimer = setTimeout(() => { toast.hidden = true; }, 2200);
        }
        const prev = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = prev; }, 1400);
      } catch { /* ignore */ }
    });
  });

  // ---------- 8. Chapter Visibility ----------
  document.querySelectorAll('.reveal-block').forEach((el) => el.classList.add('is-visible'));

  // ---------- Boot ----------
  renderSimulatorChips();
  renderStylesCatalogue('all');
  renderGlowAndDiscCards();
  syncCanvasSizes();
  syncUIState();
  syncMotionUI();
  requestAnimationFrame(simTick);
})();
