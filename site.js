(() => {
  'use strict';

  const PRESETS = [
    {
      index: 0,
      lyrics: 'Fisheye',
      glow: 'Corner Glow',
      disc: 'Neon Acrylic',
      src: 'assets/screens/fisheye-corner-acrylic.jpg',
      alt: 'Halo desktop screenshot showing Fisheye lyrics, Corner Glow edge lighting, and Neon Acrylic record',
      c1: '#c850c0',
      c2: '#ff8a4c',
    },
    {
      index: 1,
      lyrics: 'Visual',
      glow: 'Rounded Neon',
      disc: 'Picture disc',
      src: 'assets/screens/visual-rounded-picture.jpg',
      alt: 'Halo desktop screenshot showing Visual lyrics, Rounded Neon border glow, and Picture disc record',
      c1: '#52e5cf',
      c2: '#e96443',
    },
    {
      index: 2,
      lyrics: 'Branch',
      glow: 'Liquid',
      disc: 'Holographic CD',
      src: 'assets/screens/branch-liquid-cd.jpg',
      alt: 'Halo desktop screenshot showing Branch curve lyrics, Liquid edge glow, and Holographic CD',
      c1: '#ff9642',
      c2: '#ff5263',
    },
    {
      index: 3,
      lyrics: 'Constellation',
      glow: 'Bars',
      disc: 'Turntable Deck',
      src: 'assets/screens/constellation-bars-turntable.jpg',
      alt: 'Halo desktop screenshot showing Constellation lyrics, Spectrum Bars edge glow, and Turntable Deck',
      c1: '#648cff',
      c2: '#e25b70',
    },
    {
      index: 4,
      lyrics: 'Messages',
      glow: 'Aurora',
      disc: 'Album Sleeve',
      src: 'assets/screens/messages-aurora-sleeve.jpg',
      alt: 'Halo desktop screenshot showing Messages chat lyrics, Aurora edge glow, and Album Sleeve',
      c1: '#6ba4ff',
      c2: '#b3c9e6',
    },
  ];

  const $ = (id) => document.getElementById(id);

  let activeIndex = 0;
  let installerHref = 'dist/Halo-Setup-6.2.0.exe';
  let installerName = 'Halo-Setup-6.2.0.exe';
  let installerSize = '80.8 MB';
  let installerStatus = 'checking';

  const stageImg = $('stage-img');
  const stageLyricLabel = $('stage-lyric-label');
  const stageGlowLabel = $('stage-glow-label');
  const stageDiscLabel = $('stage-disc-label');

  const lightboxDialog = $('lightbox-dialog');
  const lightboxImg = $('lightbox-img');
  const lightboxTitle = $('lightbox-title');
  const lightboxSubtitle = $('lightbox-subtitle');

  const releaseDialog = $('release-dialog');

  function applyPreset(idx) {
    const p = PRESETS[(idx + PRESETS.length) % PRESETS.length];
    activeIndex = p.index;

    document.documentElement.style.setProperty('--accent-1', p.c1);
    document.documentElement.style.setProperty('--accent-2', p.c2);

    if (stageLyricLabel) stageLyricLabel.textContent = p.lyrics;
    if (stageGlowLabel) stageGlowLabel.textContent = p.glow;
    if (stageDiscLabel) stageDiscLabel.textContent = p.disc;

    if (stageImg && stageImg.getAttribute('src') !== p.src) {
      stageImg.classList.add('is-swapping');
      stageImg.src = p.src;
      stageImg.alt = p.alt;
      window.setTimeout(() => stageImg.classList.remove('is-swapping'), 160);
    } else if (stageImg) {
      stageImg.alt = p.alt;
    }

    if (lightboxImg) {
      lightboxImg.src = p.src;
      lightboxImg.alt = p.alt;
    }
    if (lightboxTitle) lightboxTitle.textContent = p.lyrics;
    if (lightboxSubtitle) lightboxSubtitle.textContent = `${p.glow}, ${p.disc}`;

    const radio = document.querySelector(`.preset-strip input[name="preset"][value="${p.index}"]`);
    if (radio && !radio.checked) radio.checked = true;
  }

  document.querySelectorAll('.preset-strip input[name="preset"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      if (radio.checked) applyPreset(Number(radio.value) || 0);
    });
  });

  // Top-layer dialog animation & fallback helpers per modern-web-guidance
  let supportsDisplayTransition;
  function canTransitionDisplay() {
    if (supportsDisplayTransition !== undefined) return supportsDisplayTransition;
    if (!window.CSS?.supports?.('transition-behavior', 'allow-discrete') || !document.body) {
      supportsDisplayTransition = false;
      return false;
    }
    const probe = document.createElement('div');
    probe.style.cssText = 'transition: display 1s allow-discrete !important; display: block;';
    document.body.appendChild(probe);
    getComputedStyle(probe).display;
    probe.style.display = 'none';
    supportsDisplayTransition = getComputedStyle(probe).display === 'block';
    probe.remove();
    return supportsDisplayTransition;
  }

  function supportsTopLayerExit() {
    return Boolean(window.CSS?.supports?.('overlay', 'auto') && canTransitionDisplay());
  }

  async function closeTopLayer(dialog) {
    if (!dialog || !dialog.open) return;
    if (!supportsTopLayerExit()) {
      dialog.setAttribute('data-closing', '');
      const animations = dialog.getAnimations({ subtree: true });
      if (animations.length > 0) {
        await Promise.race([
          Promise.allSettled(animations.map((a) => a.finished)),
          new Promise((resolve) => setTimeout(resolve, 2000)),
        ]);
      }
      if (!dialog.hasAttribute('data-closing')) return;
      dialog.removeAttribute('data-closing');
    }
    dialog.close();
  }

  function setupDialog(dialog, closeButtons) {
    if (!dialog) return;

    for (const btn of closeButtons) {
      btn?.addEventListener('click', () => closeTopLayer(dialog));
    }

    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      closeTopLayer(dialog);
    });

    // Fallback for browsers without <dialog closedby="any"> support
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      dialog.addEventListener('click', (event) => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        const isDialogContent = (
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width
        );
        if (isDialogContent) return;
        closeTopLayer(dialog);
      });
    }
  }

  setupDialog(lightboxDialog, [$('lightbox-close-btn')]);
  setupDialog(releaseDialog, [$('release-close-btn'), $('release-done-btn')]);

  $('lightbox-open-btn')?.addEventListener('click', () => {
    if (lightboxDialog && typeof lightboxDialog.showModal === 'function') {
      applyPreset(activeIndex);
      lightboxDialog.removeAttribute('data-closing');
      lightboxDialog.showModal();
    }
  });

  $('lightbox-prev-btn')?.addEventListener('click', () => applyPreset(activeIndex - 1));
  $('lightbox-next-btn')?.addEventListener('click', () => applyPreset(activeIndex + 1));

  lightboxDialog?.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      applyPreset(activeIndex - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      applyPreset(activeIndex + 1);
    }
  });

  // Installer resolution: check local dist/Halo-Setup-6.2.0.exe first;
  // only query GitHub Releases when dist/ is not hosted on this origin.
  function applyInstallerLinks() {
    document.querySelectorAll('.js-installer-link').forEach((link) => {
      link.setAttribute('href', installerHref);
      if (installerStatus === 'local') {
        link.setAttribute('download', installerName);
        link.removeAttribute('target');
        link.removeAttribute('rel');
      } else if (installerStatus === 'github') {
        link.removeAttribute('download');
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener');
      }
    });

    const sub = $('dl-btn-sub');
    const footerMeta = $('footer-installer-meta');
    if (installerStatus === 'local') {
      if (sub) sub.textContent = `v6.2.0 · ${installerName} (${installerSize}) · Windows 10 & 11 (x64)`;
      if (footerMeta) footerMeta.textContent = `Local installer ready (${installerSize}) · Includes tray controls & auto-updater`;
    } else if (installerStatus === 'github') {
      if (sub) sub.textContent = `v6.2.0 · ${installerName} (${installerSize}) · GitHub Releases · Win 10 & 11 (x64)`;
      if (footerMeta) footerMeta.textContent = `${installerName} (${installerSize}) · Auto-updates from GitHub Releases`;
    } else if (installerStatus === 'unavailable') {
      if (sub) sub.textContent = 'v6.2.0 · GitHub Release pending or run from source · Windows 10 & 11 (x64)';
    }
  }

  async function resolveInstallerTarget() {
    try {
      const localRes = await fetch('dist/Halo-Setup-6.2.0.exe', { method: 'HEAD' });
      if (localRes.ok) {
        const bytes = Number(localRes.headers.get('content-length')) || 84685248;
        installerSize = `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        installerHref = 'dist/Halo-Setup-6.2.0.exe';
        installerName = 'Halo-Setup-6.2.0.exe';
        installerStatus = 'local';
        applyInstallerLinks();
        return;
      }
    } catch { /* local dist not hosted on this origin */ }

    try {
      const res = await fetch('https://api.github.com/repos/arvgdhi/HaloVisual/releases', {
        headers: { Accept: 'application/vnd.github+json' },
      });
      if (res.ok) {
        const releases = await res.json();
        if (Array.isArray(releases)) {
          for (const rel of releases) {
            if (!rel || rel.draft) continue;
            const asset = (rel.assets || []).find((a) => a && /^Halo-Setup-.*\.exe$/i.test(a.name));
            if (asset && asset.browser_download_url) {
              installerHref = asset.browser_download_url;
              installerName = asset.name;
              installerSize = asset.size ? `${(asset.size / (1024 * 1024)).toFixed(1)} MB` : '80.8 MB';
              installerStatus = 'github';
              applyInstallerLinks();
              return;
            }
          }
        }
      }
    } catch { /* fallback modal handles unavailable release */ }

    installerStatus = 'unavailable';
    applyInstallerLinks();
  }

  document.querySelectorAll('.js-installer-link').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (installerStatus === 'unavailable' && releaseDialog && typeof releaseDialog.showModal === 'function') {
        event.preventDefault();
        releaseDialog.removeAttribute('data-closing');
        releaseDialog.showModal();
      }
    });
  });

  // Copy helper
  const toast = $('copy-toast');
  let toastTimer = null;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => { toast.hidden = true; }, 2200);
  }

  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = btn.getAttribute('data-copy');
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        showToast('Copied to clipboard');
      } catch {
        showToast('Copy failed — select text manually');
      }
    });
  });

  applyPreset(0);
  resolveInstallerTarget();
})();
