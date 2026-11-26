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

  const stageLyricLabel = $('stage-lyric-label');
  const stageGlowLabel = $('stage-glow-label');
  const stageDiscLabel = $('stage-disc-label');
  const stageCounter = $('stage-counter');

  const carouselEl = $('hero-carousel');
  const autoplayBtn = $('carousel-autoplay-btn');
  const autoplayLabel = $('carousel-autoplay-label');
  const track = $('carousel-track');
  const markersNav = $('carousel-markers');
  const statusEl = $('carousel-status');
  const prevBtn = document.querySelector('[data-direction="previous"]');
  const nextBtn = document.querySelector('[data-direction="next"]');

  const lightboxDialog = $('lightbox-dialog');
  const lightboxImg = $('lightbox-img');
  const lightboxTitle = $('lightbox-title');
  const lightboxSubtitle = $('lightbox-subtitle');

  const releaseDialog = $('release-dialog');

  const AUTOPLAY_MS = 4500;
  const reducedMotionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const prefersReducedMotion = () => Boolean(reducedMotionQuery?.matches);

  const slides = track ? Array.from(track.querySelectorAll('.carousel-slide')) : [];
  let markerButtons = [];
  let lastUiIndex = -1;
  let settledIndex = 0;
  let pendingTarget = null;
  let lastRequestScrollLeft = null;
  let queuedDirection = null;
  let rafId = null;
  let settleTimer = null;
  let lockToken = 0;

  let userPaused = prefersReducedMotion();
  let isHovered = false;
  let isFocused = false;
  let isInView = true;
  let isPageVisible = !document.hidden;
  let autoplayTimer = null;
  let lastMoveWasAuto = false;

  function syncActiveUI(idx) {
    const p = PRESETS[(idx + PRESETS.length) % PRESETS.length];
    activeIndex = p.index;

    document.documentElement.style.setProperty('--accent-1', p.c1);
    document.documentElement.style.setProperty('--accent-2', p.c2);

    if (stageLyricLabel) stageLyricLabel.textContent = p.lyrics;
    if (stageGlowLabel) stageGlowLabel.textContent = p.glow;
    if (stageDiscLabel) stageDiscLabel.textContent = p.disc;
    if (stageCounter) stageCounter.textContent = `${p.index + 1} / ${PRESETS.length}`;

    if (lightboxImg) {
      lightboxImg.src = p.src;
      lightboxImg.alt = p.alt;
    }
    if (lightboxTitle) lightboxTitle.textContent = p.lyrics;
    if (lightboxSubtitle) lightboxSubtitle.textContent = `${p.glow}, ${p.disc}`;

    if (idx !== lastUiIndex) {
      lastUiIndex = idx;
      markerButtons.forEach((btn, i) => {
        if (i === idx) btn.setAttribute('aria-current', 'true');
        else btn.removeAttribute('aria-current');
      });
    }
  }

  function visualSlides() {
    return [...slides].sort((a, b) => a.offsetLeft - b.offsetLeft);
  }

  function scrollDeltaFor(slide) {
    const tRect = track.getBoundingClientRect();
    const sRect = slide.getBoundingClientRect();
    return (sRect.left + sRect.width / 2) - (tRect.left + tRect.width / 2);
  }

  function nearestSlideIndex() {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < slides.length; i++) {
      const dist = Math.abs(scrollDeltaFor(slides[i]));
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }
    return bestIdx;
  }

  function applyParking(targetIdx, { lockOverflow = true } = {}) {
    if (!track || slides.length < 3) return;
    const desired = targetIdx === null ? 'initial' : String(targetIdx);
    const current = track.style.getPropertyValue('--current').trim();
    if (current === desired) return;

    const anchor = slides[nearestSlideIndex()];
    const before = anchor.offsetLeft;

    track.style.scrollSnapType = 'none';
    track.style.scrollBehavior = 'auto';
    if (lockOverflow) track.style.overflowX = 'hidden';

    if (targetIdx === null) {
      track.style.setProperty('--current', 'initial');
    } else {
      track.style.setProperty('--current', desired);
    }

    const after = anchor.offsetLeft;
    if (after !== before) {
      track.scrollLeft += after - before;
    }

    track.style.scrollSnapType = '';
    track.style.scrollBehavior = '';

    if (lockOverflow) {
      const myToken = ++lockToken;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (myToken === lockToken) track.style.overflowX = '';
        });
      });
    } else {
      track.style.overflowX = '';
    }
  }

  function announceSlide(idx) {
    if (!statusEl) return;
    const p = PRESETS[idx];
    if (!p) return;
    statusEl.textContent = `Slide ${idx + 1} of ${PRESETS.length}: ${p.lyrics}, ${p.glow}, ${p.disc}`;
  }

  function canAutoplay() {
    return Boolean(
      track &&
      slides.length > 1 &&
      !userPaused &&
      !isHovered &&
      !isFocused &&
      isInView &&
      isPageVisible &&
      !lightboxDialog?.open &&
      !releaseDialog?.open
    );
  }

  function syncAutoplayUI() {
    if (carouselEl) {
      carouselEl.dataset.autoplay = canAutoplay() ? 'running' : 'paused';
    }
    if (autoplayLabel) {
      autoplayLabel.textContent = userPaused ? 'Play' : 'Pause';
    }
    if (autoplayBtn) {
      autoplayBtn.setAttribute('aria-label', userPaused ? 'Play automatic slideshow' : 'Pause automatic slideshow');
    }
  }

  function clearAutoplay() {
    if (autoplayTimer !== null) {
      window.clearTimeout(autoplayTimer);
      autoplayTimer = null;
    }
  }

  function scheduleAutoplay() {
    clearAutoplay();
    syncAutoplayUI();
    if (!canAutoplay()) return;
    autoplayTimer = window.setTimeout(() => {
      autoplayTimer = null;
      if (!canAutoplay() || pendingTarget !== null) {
        scheduleAutoplay();
        return;
      }
      stepBy(1, { auto: true });
    }, AUTOPLAY_MS);
  }

  function onSettle() {
    if (!track || !slides.length) return;
    if (
      pendingTarget !== null &&
      lastRequestScrollLeft !== null &&
      Math.abs(track.scrollLeft - lastRequestScrollLeft) < 1
    ) {
      return;
    }

    pendingTarget = null;
    lastRequestScrollLeft = null;

    const idx = nearestSlideIndex();
    syncActiveUI(idx);
    applyParking(idx, { lockOverflow: !queuedDirection });

    if (idx !== settledIndex && !lastMoveWasAuto) {
      announceSlide(idx);
    }
    settledIndex = idx;
    lastMoveWasAuto = false;

    if (queuedDirection !== null) {
      const dir = queuedDirection;
      queuedDirection = null;
      stepBy(dir);
      return;
    }

    scheduleAutoplay();
  }

  function stepBy(direction, { auto = false } = {}) {
    if (!track || !slides.length) return;
    lastMoveWasAuto = Boolean(auto);
    clearAutoplay();
    if (track.style.getPropertyValue('--current').trim() === 'initial') {
      queuedDirection = direction;
      return;
    }

    const baseSlide = pendingTarget !== null ? slides[pendingTarget] : slides[nearestSlideIndex()];
    const ordered = visualSlides();
    const visualPos = ordered.indexOf(baseSlide);
    const nextSlide = ordered[visualPos + direction];
    if (!nextSlide) {
      if (pendingTarget !== null && slides.length >= 3) {
        queuedDirection = direction;
      }
      return;
    }

    const nextIdx = Number(nextSlide.dataset.index);
    const delta = scrollDeltaFor(nextSlide);
    pendingTarget = nextIdx;
    lastRequestScrollLeft = track.scrollLeft;
    syncActiveUI(nextIdx);

    if (Math.abs(delta) < 1) {
      onSettle();
      return;
    }

    track.scrollBy({
      left: delta,
      behavior: prefersReducedMotion() ? 'instant' : 'smooth',
    });
  }

  function goToMarker(targetIdx) {
    if (!track || !slides[targetIdx]) return;
    lastMoveWasAuto = false;
    clearAutoplay();
    if (pendingTarget === null && nearestSlideIndex() === targetIdx) {
      syncActiveUI(targetIdx);
      scheduleAutoplay();
      return;
    }

    queuedDirection = null;
    applyParking(null, { lockOverflow: false });

    const delta = scrollDeltaFor(slides[targetIdx]);
    pendingTarget = targetIdx;
    lastRequestScrollLeft = track.scrollLeft;
    syncActiveUI(targetIdx);

    if (Math.abs(delta) < 1) {
      onSettle();
      return;
    }

    track.scrollBy({
      left: delta,
      behavior: prefersReducedMotion() ? 'instant' : 'smooth',
    });
  }

  if (track && slides.length) {
    if (!CSS.supports('order: sibling-count()')) {
      track.style.setProperty('--children-count', String(slides.length));
    }

    if (markersNav) {
      markersNav.textContent = '';
      markerButtons = slides.map((slide, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('aria-label', slide.dataset.markerName || `Go to slide ${idx + 1}`);
        btn.addEventListener('click', () => goToMarker(idx));
        markersNav.appendChild(btn);
        return btn;
      });
    }

    // Center initial slide quietly before attaching scroll listeners
    applyParking(0, { lockOverflow: false });
    track.style.scrollBehavior = 'auto';
    const initialDelta = scrollDeltaFor(slides[0]);
    if (Math.abs(initialDelta) >= 1) track.scrollLeft += initialDelta;
    track.style.scrollBehavior = '';
    settledIndex = 0;
    syncActiveUI(0);
    scheduleAutoplay();

    autoplayBtn?.addEventListener('click', () => {
      userPaused = !userPaused;
      scheduleAutoplay();
    });

    carouselEl?.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'touch') {
        isHovered = true;
        scheduleAutoplay();
      }
    });

    carouselEl?.addEventListener('pointerleave', (event) => {
      if (event.pointerType !== 'touch') {
        isHovered = false;
        scheduleAutoplay();
      }
    });

    carouselEl?.addEventListener('focusin', () => {
      isFocused = true;
      scheduleAutoplay();
    });

    carouselEl?.addEventListener('focusout', (event) => {
      if (!carouselEl.contains(event.relatedTarget)) {
        isFocused = false;
        scheduleAutoplay();
      }
    });

    document.addEventListener('visibilitychange', () => {
      isPageVisible = !document.hidden;
      scheduleAutoplay();
    });

    if (carouselEl && typeof IntersectionObserver === 'function') {
      const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          isInView = entry.isIntersecting;
          scheduleAutoplay();
        }
      }, { threshold: 0.2 });
      observer.observe(carouselEl);
    }

    reducedMotionQuery?.addEventListener('change', (event) => {
      if (event.matches) userPaused = true;
      scheduleAutoplay();
    });

    prevBtn?.addEventListener('click', () => stepBy(-1));
    nextBtn?.addEventListener('click', () => stepBy(1));

    track.addEventListener('scroll', () => {
      if (pendingTarget === null) {
        clearAutoplay();
        if (rafId === null) {
          rafId = requestAnimationFrame(() => {
            rafId = null;
            if (pendingTarget === null) syncActiveUI(nearestSlideIndex());
          });
        }
      }
      if (!('onscrollend' in window)) {
        window.clearTimeout(settleTimer);
        settleTimer = window.setTimeout(onSettle, 150);
      }
    }, { passive: true });

    if ('onscrollend' in window) {
      track.addEventListener('scrollend', onSettle);
    }

    window.addEventListener('resize', () => {
      if (pendingTarget !== null) return;
      const target = slides[settledIndex];
      if (!target) return;
      track.style.scrollBehavior = 'auto';
      const delta = scrollDeltaFor(target);
      if (Math.abs(delta) >= 1) track.scrollLeft += delta;
      track.style.scrollBehavior = '';
    });
  }

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

    dialog.addEventListener('close', () => scheduleAutoplay());

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
      syncActiveUI(activeIndex);
      lightboxDialog.removeAttribute('data-closing');
      lightboxDialog.showModal();
      clearAutoplay();
      syncAutoplayUI();
    }
  });

  function stepLightbox(direction) {
    if (track && slides.length) {
      stepBy(direction);
    } else {
      syncActiveUI(activeIndex + direction);
    }
  }

  $('lightbox-prev-btn')?.addEventListener('click', () => stepLightbox(-1));
  $('lightbox-next-btn')?.addEventListener('click', () => stepLightbox(1));

  lightboxDialog?.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      stepLightbox(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      stepLightbox(1);
    }
  });

  // Installer resolution: check local dist/Halo-Setup-6.2.0.exe first;
  // only query GitHub Releases when dist/ is not hosted on this origin.
  const REPO_SLUG = 'arvgdhi/HaloVisual';
  const RELEASES_PAGE = `https://github.com/${REPO_SLUG}/releases/latest`;
  const RELEASE_CACHE_KEY = 'halo_latest_release_v1';
  const RELEASE_CACHE_TTL_MS = 15 * 60 * 1000;

  function isTrustedReleaseUrl(rawUrl) {
    try {
      const u = new URL(rawUrl);
      return u.protocol === 'https:' &&
        u.hostname === 'github.com' &&
        u.pathname.startsWith(`/${REPO_SLUG}/releases/download/`);
    } catch {
      return false;
    }
  }

  function applyInstallerLinks() {
    document.querySelectorAll('.js-installer-link').forEach((link) => {
      link.setAttribute('href', installerHref);
      if (installerStatus === 'local') {
        link.setAttribute('download', installerName);
        link.removeAttribute('target');
        link.removeAttribute('rel');
      } else if (installerStatus === 'github' || installerStatus === 'releases-page') {
        link.removeAttribute('download');
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener');
      }
    });

    const sub = $('dl-btn-sub');
    const footerMeta = $('footer-installer-meta');
    if (installerStatus === 'local') {
      if (sub) sub.textContent = `v6.2.0 · ${installerName} (${installerSize}) · Windows 10 & 11 (x64)`;
      if (footerMeta) footerMeta.textContent = `Local installer ready (${installerSize}) · Includes tray controls & verified updates`;
    } else if (installerStatus === 'github') {
      if (sub) sub.textContent = `v6.2.0 · ${installerName} (${installerSize}) · SHA-256 verified on GitHub Releases · Win 10 & 11 (x64)`;
      if (footerMeta) footerMeta.textContent = `${installerName} (${installerSize}) · Verified updates from GitHub Releases`;
    } else if (installerStatus === 'releases-page') {
      if (sub) sub.textContent = 'Download from GitHub Releases (with SHA256SUMS.txt) · Windows 10 & 11 (x64)';
      if (footerMeta) footerMeta.textContent = 'Download latest Windows installer & SHA-256 checksums on GitHub Releases';
    } else if (installerStatus === 'unavailable') {
      if (sub) sub.textContent = 'v6.2.0 · GitHub Release pending or run from source · Windows 10 & 11 (x64)';
    }
  }

  async function resolveInstallerTarget() {
    try {
      const localRes = await fetch('dist/Halo-Setup-6.2.0.exe', {
        method: 'HEAD',
        signal: AbortSignal.timeout ? AbortSignal.timeout(4000) : undefined,
      });
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
      const cachedRaw = window.sessionStorage?.getItem(RELEASE_CACHE_KEY);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw);
        if (cached && Date.now() - cached.at < RELEASE_CACHE_TTL_MS && isTrustedReleaseUrl(cached.href)) {
          installerHref = cached.href;
          installerName = cached.name;
          installerSize = cached.size;
          installerStatus = 'github';
          applyInstallerLinks();
          return;
        }
      }
    } catch { /* ignore storage errors */ }

    try {
      const res = await fetch(`https://api.github.com/repos/${REPO_SLUG}/releases/latest`, {
        headers: { Accept: 'application/vnd.github+json' },
        signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined,
      });
      if (res.ok) {
        const rel = await res.json();
        const asset = rel && !rel.draft && !rel.prerelease
          ? (rel.assets || []).find((a) => a && /^Halo-Setup-.*\.exe$/i.test(a.name))
          : null;
        if (asset && isTrustedReleaseUrl(asset.browser_download_url)) {
          installerHref = asset.browser_download_url;
          installerName = asset.name;
          installerSize = asset.size ? `${(asset.size / (1024 * 1024)).toFixed(1)} MB` : '80.8 MB';
          installerStatus = 'github';
          try {
            window.sessionStorage?.setItem(RELEASE_CACHE_KEY, JSON.stringify({
              at: Date.now(),
              href: installerHref,
              name: installerName,
              size: installerSize,
            }));
          } catch { /* ignore storage errors */ }
          applyInstallerLinks();
          return;
        }
      } else if (res.status === 403 || res.status === 429) {
        // Rate-limited by GitHub API; link directly to the non-rate-limited Releases page.
        installerHref = RELEASES_PAGE;
        installerStatus = 'releases-page';
        applyInstallerLinks();
        return;
      }
    } catch {
      installerHref = RELEASES_PAGE;
      installerStatus = 'releases-page';
      applyInstallerLinks();
      return;
    }

    installerStatus = 'unavailable';
    applyInstallerLinks();
  }

  document.querySelectorAll('.js-installer-link').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (installerStatus === 'unavailable' && releaseDialog && typeof releaseDialog.showModal === 'function') {
        event.preventDefault();
        releaseDialog.removeAttribute('data-closing');
        releaseDialog.showModal();
        clearAutoplay();
        syncAutoplayUI();
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

  resolveInstallerTarget();
})();
