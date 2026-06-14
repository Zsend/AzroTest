(function(){
  const doc = document.documentElement;
  const body = document.body;
  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const prefersReducedMotion = () => reduceMotionQuery.matches;
  doc.classList.add('rs-js-ready');
  // v174: full mobile scroll effects restored; performance guards no longer disable section/card motion.
  // v172: expose direction and keep legacy rail patches off the mobile hot path.
  window.__rsScrollDirection = 'down';

  document.querySelectorAll('[data-year]').forEach(node => {
    node.textContent = new Date().getFullYear();
  });

  const siteHeader = document.querySelector('.site-header');

  // v83: Direction-aware scroll state. Scroll-loaded cards should never
  // visually unload while the customer scrolls upward, but they should reset
  // once they are safely below the viewport so the entrance can replay on the
  // next downward pass. This keeps the motion editorial, controlled, and
  // repeatable without creating slippery reverse animation.
  const getRSScrollY = () => window.scrollY || window.pageYOffset || doc.scrollTop || body.scrollTop || 0;

  // v172: mobile edge-overscroll / pull-to-refresh guard. Prevent only the
  // native edge pull that can expose browser chrome, reload the page, or make the
  // page appear to jump to the top. Normal scrolling, nested scrollers, forms,
  // and all scroll-linked storytelling remain untouched.
  (function setupRSMobileEdgeOverscrollGuard(){
    // v191: NEUTRALIZED. The stylesheet already prevents pull-to-refresh and
    // edge rubber-banding the correct, non-janky way via `overscroll-behavior-y:
    // none`. This former JS guard additionally forced `root.scrollTop = 1` on
    // every touchstart and called preventDefault() on touchmove near the edges,
    // which interfered with normal scrolling and contributed to the mobile
    // jump/reload feel. Disabled in favor of the CSS-native behavior.
    return;
    /* eslint-disable no-unreachable */
    const isTouchDevice = ('ontouchstart' in window) || ((navigator.maxTouchPoints || 0) > 0);
    if (!isTouchDevice) return;

    let startX = 0;
    let startY = 0;
    let tracking = false;
    const interactiveSelector = 'input, textarea, select, [contenteditable="true"]';
    const rootScroller = () => document.scrollingElement || doc;
    const viewportHeight = () => Math.max(1, (window.visualViewport && window.visualViewport.height) || window.innerHeight || doc.clientHeight || 1);

    const canNestedScrollerMove = (target, dy) => {
      if (target && target.closest && target.closest(interactiveSelector)) return true;
      let node = target && target.nodeType === 1 ? target : target && target.parentElement;
      while (node && node !== body && node !== doc) {
        const style = window.getComputedStyle(node);
        const overflowY = style.overflowY;
        const scrollable = (overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight + 1;
        if (scrollable) {
          const atTop = node.scrollTop <= 0;
          const atBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 1;
          if ((dy > 0 && !atTop) || (dy < 0 && !atBottom)) return true;
        }
        node = node.parentElement;
      }
      return false;
    };

    const onTouchStart = (event) => {
      if (!event.touches || event.touches.length !== 1) {
        tracking = false;
        return;
      }
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
      tracking = true;

      // v190: keep the root scroller one pixel away from native mobile
      // rubber-band edges. This reduces accidental pull-to-refresh/top-snap
      // without changing normal scrolling, forms, nested scrollers, or any
      // scroll-linked site effects.
      try {
        if (event.target && event.target.closest && event.target.closest(interactiveSelector)) return;
        const root = rootScroller();
        const maxY = Math.max(0, root.scrollHeight - viewportHeight());
        if (maxY <= 1) return;
        const y = getRSScrollY();
        if (y <= 0) {
          root.scrollTop = 1;
          if (getRSScrollY() <= 0) window.scrollTo(0, 1);
        } else if (y >= maxY) {
          root.scrollTop = Math.max(0, maxY - 1);
        }
      } catch (e) { /* ignore */ }
    };

    const onTouchMove = (event) => {
      if (!event.cancelable || !tracking || !event.touches || event.touches.length !== 1 || event.defaultPrevented) return;
      const touch = event.touches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      if (Math.abs(dy) < 6 || Math.abs(dx) > Math.abs(dy)) return;

      // v172: stay out of the hot path during normal scrolling. The previous
      // guard walked the DOM and called getComputedStyle on every touchmove;
      // that can make mobile scrolling feel sticky/janky. Only do the nested
      // scroller check when the root document is actually being pulled beyond
      // its top or bottom edge.
      const root = rootScroller();
      const y = getRSScrollY();
      const maxY = Math.max(0, root.scrollHeight - viewportHeight());
      const pullingPastTop = y <= 1 && dy > 0;
      const pullingPastBottom = y >= maxY - 1 && dy < 0;
      if (!pullingPastTop && !pullingPastBottom) return;
      if (canNestedScrollerMove(event.target, dy)) return;
      event.preventDefault();
    };

    const stopTracking = () => { tracking = false; };
    try { document.addEventListener('touchstart', onTouchStart, { passive:true, capture:true }); } catch (e) { window.addEventListener('touchstart', onTouchStart, { passive:true }); }
    try { document.addEventListener('touchmove', onTouchMove, { passive:false, capture:true }); } catch (e) { window.addEventListener('touchmove', onTouchMove, { passive:false }); }
    window.addEventListener('touchend', stopTracking, { passive:true });
    window.addEventListener('touchcancel', stopTracking, { passive:true });
  })();

  let rsLastScrollY = getRSScrollY();
  let rsScrollDirection = 'down';
  const syncRSScrollDirection = () => {
    const y = getRSScrollY();
    if (Math.abs(y - rsLastScrollY) > 0.5) {
      rsScrollDirection = y > rsLastScrollY ? 'down' : 'up';
      window.__rsScrollDirection = rsScrollDirection;
      window.__rsLastScrollAt = Date.now();
      rsLastScrollY = y;
    }
    return rsScrollDirection;
  };
  window.RSSyncScrollDirection = syncRSScrollDirection;
  window.addEventListener('scroll', syncRSScrollDirection, { passive: true });
  window.addEventListener('pageshow', () => {
    rsLastScrollY = getRSScrollY();
    rsScrollDirection = 'down';
    window.__rsScrollDirection = rsScrollDirection;
    window.__rsLastScrollAt = Date.now();
  });

  // v154: production scroll-stability guard. The site should never feel as if
  // it randomly jumped or reloaded while fonts, sticky rails, or browser mobile
  // viewport chrome settle. Layout measurements may be refreshed, but any
  // height change is anchored to the customer's current reading position.
  const rsNow = () => (window.performance && performance.now) ? performance.now() : Date.now();
  const rsIsTouchLike = () => {
    try {
      return ('ontouchstart' in window) || ((navigator.maxTouchPoints || 0) > 0) ||
        (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    } catch (e) { return false; }
  };
  window.RSShouldSkipMobileResizeRefresh = () => {
    try {
      if (!(rsIsTouchLike() || window.innerWidth <= 760)) return false;
      return (Date.now() - (window.__rsLastScrollAt || 0)) < 520;
    } catch (e) { return false; }
  };
  window.RSRunAfterMobileScrollSettles = (fn) => {
    if (typeof fn !== 'function') return;
    if (window.RSShouldSkipMobileResizeRefresh && window.RSShouldSkipMobileResizeRefresh()) {
      window.setTimeout(fn, 650);
      return;
    }
    fn();
  };
  let rsScriptedScrollUntil = 0;
  const markRSScriptedScroll = (duration = 900) => { rsScriptedScrollUntil = rsNow() + duration; };
  const rsIsScriptedScrollWindow = () => rsNow() < rsScriptedScrollUntil;

  // v190: mobile scroll-resilience guard. The site was visually correct in
  // v188; this only protects the document position from mobile browser reload,
  // tab discard, and rare top-snap behavior. It continuously checkpoints the
  // same-tab reading position and restores only when mobile returns to the very
  // top without a hash target or intentional touch-driven scroll-to-top.
  (function setupRSMobileScrollResilienceGuard(){
    // v191: NEUTRALIZED — this was the primary cause of the mobile jump.
    // Its onScroll "top-snap detector" restored the document to the last deep
    // "stable" position whenever the reader scrolled back near the top, firing
    // window.scrollTo(deepY) three times over ~220ms. Reproduced in a 375px
    // viewport: scrolling to 0 yanked the page back to 6000px. Combined with
    // scrollRestoration='manual' (now reverted to 'auto' below), it produced
    // exactly the "jumps to the top / feels like it reloaded" behavior.
    // The browser's native scroll restoration plus CSS overscroll-behavior
    // handle mobile reload/return correctly without fighting the user.
    // Preserve the one global other code may call, then stop.
    window.RSAllowIntentionalTopScroll = function(){};
    return;
    /* eslint-disable no-unreachable */
    const KEY = 'rs_mobile_reading_position_v190';
    const PATH_KEY = 'rs_mobile_seen_path_v190';
    const mobileLike = () => {
      try { return rsIsTouchLike() || window.innerWidth <= 820; }
      catch (e) { return false; }
    };
    const currentPath = () => `${window.location.pathname || '/'}${window.location.search || ''}`;
    const rootScroller = () => document.scrollingElement || doc;
    const viewportH = () => Math.max(1, (window.visualViewport && window.visualViewport.height) || window.innerHeight || doc.clientHeight || 1);
    const maxScrollY = () => {
      const root = rootScroller();
      return Math.max(0, (root.scrollHeight || doc.scrollHeight || body.scrollHeight || 0) - viewportH());
    };
    const navType = () => {
      try {
        const entry = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
        if (entry && entry.type) return entry.type;
      } catch (e) { /* ignore */ }
      try {
        if (performance.navigation && performance.navigation.type === 1) return 'reload';
        if (performance.navigation && performance.navigation.type === 2) return 'back_forward';
      } catch (e) { /* ignore */ }
      return '';
    };
    const readSaved = () => {
      let data = null;
      try { data = JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) { data = null; }
      if (!data) {
        try { data = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { data = null; }
      }
      return data;
    };

    let lastWriteAt = 0;
    let pendingWriteTimer = 0;
    let pendingWriteY = 0;
    const writeSaved = (y, force = false) => {
      if (!mobileLike()) return;
      const time = Date.now();
      if (!force && time - lastWriteAt < 240) return;
      const maxY = maxScrollY();
      const safeY = Math.round(Math.max(0, Math.min(Number(y) || 0, maxY)));
      if (safeY < 96 || window.location.hash) return;
      lastWriteAt = time;
      const payload = JSON.stringify({ path: currentPath(), y: safeY, max: maxY, t: time });
      try {
        sessionStorage.setItem(KEY, payload);
        sessionStorage.setItem(PATH_KEY, currentPath());
      } catch (e) { /* ignore */ }
      try { localStorage.setItem(KEY, payload); } catch (e) { /* ignore */ }
    };
    const scheduleWriteSaved = (y) => {
      if (!mobileLike()) return;
      pendingWriteY = y;
      const time = Date.now();
      const run = () => {
        pendingWriteTimer = 0;
        writeSaved(pendingWriteY, true);
      };
      if (time - lastWriteAt > 240) {
        if (pendingWriteTimer) { try { window.clearTimeout(pendingWriteTimer); } catch (e) { /* ignore */ } }
        run();
      } else if (!pendingWriteTimer) {
        pendingWriteTimer = window.setTimeout(run, Math.max(80, 260 - (time - lastWriteAt)));
      }
    };
    const sameTabSeenPath = () => {
      try { return sessionStorage.getItem(PATH_KEY) === currentPath(); }
      catch (e) { return false; }
    };

    let touchActive = false;
    let lastTouchAt = 0;
    let lastObservedY = getRSScrollY();
    let lastStableY = lastObservedY > 96 ? lastObservedY : 0;
    let lastStableAt = Date.now();
    let allowTopUntil = Date.now() + 1400;
    let restoring = false;

    const markTouch = () => { touchActive = true; lastTouchAt = Date.now(); };
    const clearTouch = () => { touchActive = false; lastTouchAt = Date.now(); };
    try {
      window.addEventListener('touchstart', markTouch, { passive: true, capture: true });
      window.addEventListener('touchend', clearTouch, { passive: true, capture: true });
      window.addEventListener('touchcancel', clearTouch, { passive: true, capture: true });
      window.addEventListener('pointerdown', (event) => { if (event.pointerType === 'touch') markTouch(); }, { passive: true, capture: true });
      window.addEventListener('pointerup', (event) => { if (event.pointerType === 'touch') clearTouch(); }, { passive: true, capture: true });
      window.addEventListener('pointercancel', (event) => { if (event.pointerType === 'touch') clearTouch(); }, { passive: true, capture: true });
    } catch (e) { /* ignore */ }

    const restoreTo = (target, reason) => {
      if (!mobileLike() || restoring || window.location.hash) return;
      const y = Math.round(Math.max(0, Math.min(Number(target) || 0, maxScrollY())));
      if (y < 120) return;
      restoring = true;
      markRSScriptedScroll(900);
      const apply = () => {
        const prevHtmlScrollBehavior = doc.style.scrollBehavior;
        const prevBodyScrollBehavior = body.style.scrollBehavior;
        try {
          doc.style.scrollBehavior = 'auto';
          body.style.scrollBehavior = 'auto';
          try { window.scrollTo({ top: y, left: 0, behavior: 'auto' }); }
          catch (e) { window.scrollTo(0, y); }
        } finally {
          window.setTimeout(() => {
            doc.style.scrollBehavior = prevHtmlScrollBehavior;
            body.style.scrollBehavior = prevBodyScrollBehavior;
          }, 60);
        }
        try { document.dispatchEvent(new CustomEvent('rs:scrollfx-refresh')); } catch (eventError) { /* ignore */ }
      };
      window.requestAnimationFrame(() => {
        apply();
        window.setTimeout(apply, 80);
        window.setTimeout(() => { apply(); restoring = false; }, 220);
      });
    };

    const maybeRestoreSavedPosition = (reason) => {
      if (!mobileLike() || window.location.hash) return;
      if (getRSScrollY() > 72) return;
      const saved = readSaved();
      if (!saved || saved.path !== currentPath()) return;
      if (!saved.t || Date.now() - saved.t > 6 * 60 * 60 * 1000) return;
      const type = navType();
      const likelyReturn = reason === 'persisted' || reason === 'pagehide-return' || reason === 'visible' || type === 'reload' || type === 'back_forward' || document.wasDiscarded === true || sameTabSeenPath();
      if (!likelyReturn) return;
      restoreTo(saved.y, reason);
    };

    const onScroll = () => {
      if (!mobileLike()) return;
      const time = Date.now();
      const y = getRSScrollY();
      const previousY = lastObservedY;
      lastObservedY = y;

      if (y > 96) {
        const fallingWithoutInput = lastStableY > 0 && !touchActive && time - lastTouchAt > 1600 && y < lastStableY - Math.max(220, viewportH() * 0.25);
        if (!fallingWithoutInput) {
          lastStableY = y;
          lastStableAt = time;
          if (!rsIsScriptedScrollWindow()) scheduleWriteSaved(y);
        }
        return;
      }

      if (y > 72 || restoring || rsIsScriptedScrollWindow() || time < allowTopUntil || window.location.hash) return;
      if (touchActive || time - lastTouchAt < 1600) return;

      const suddenDrop = previousY - y > Math.max(260, viewportH() * 0.38);
      const recentStable = lastStableY > Math.max(420, viewportH() * 0.72) && time - lastStableAt < 6 * 60 * 60 * 1000;
      if ((suddenDrop && recentStable) || recentStable) restoreTo(lastStableY, 'runtime-top-snap');
    };

    try { window.addEventListener('scroll', onScroll, { passive: true, capture: true }); } catch (e) { /* ignore */ }
    try { window.addEventListener('pagehide', () => writeSaved(getRSScrollY(), true), { capture: true }); } catch (e) { /* ignore */ }
    try { window.addEventListener('beforeunload', () => writeSaved(getRSScrollY(), true), { capture: true }); } catch (e) { /* ignore */ }
    try {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') writeSaved(getRSScrollY(), true);
        else if (document.visibilityState === 'visible') window.setTimeout(() => maybeRestoreSavedPosition('visible'), 60);
      }, { capture: true });
    } catch (e) { /* ignore */ }
    try { window.addEventListener('pageshow', (event) => { window.setTimeout(() => maybeRestoreSavedPosition(event && event.persisted ? 'persisted' : 'pageshow'), 60); }); } catch (e) { /* ignore */ }
    try { window.addEventListener('load', () => { window.setTimeout(() => maybeRestoreSavedPosition('pagehide-return'), 120); }, { once: true }); } catch (e) { /* ignore */ }
    try {
      window.setInterval(() => {
        if (!mobileLike()) return;
        const y = getRSScrollY();
        if (y > 96 && !rsIsScriptedScrollWindow()) {
          const now = Date.now();
          const fallingWithoutInput = lastStableY > 0 && !touchActive && now - lastTouchAt > 1600 && y < lastStableY - Math.max(220, viewportH() * 0.25);
          lastObservedY = y;
          if (!fallingWithoutInput) {
            lastStableY = y;
            lastStableAt = now;
            scheduleWriteSaved(y);
          }
        }
      }, 650);
    } catch (e) { /* ignore */ }

    window.RSAllowIntentionalTopScroll = (duration = 1600) => { allowTopUntil = Date.now() + duration; };
  })();

  const withStableViewportAnchor = (mutate) => {
    if (typeof mutate !== 'function') return undefined;
    // Never use programmatic scroll correction on touch/mobile viewports. The
    // desktop rail-height sync is useful, but mobile browsers can treat any
    // script-driven scroll during viewport chrome/keyboard changes as a jump.
    // Scroll-linked visuals may repaint; the document scroll position must stay
    // under the customer's finger.
    if (rsIsTouchLike() || window.innerWidth <= 1200) return mutate();
    const yBefore = getRSScrollY();
    if (yBefore < 96 || rsIsScriptedScrollWindow() || !document.elementFromPoint) {
      return mutate();
    }
    const anchorX = Math.max(1, Math.min(window.innerWidth - 1, Math.round(window.innerWidth * 0.50)));
    const anchorY = Math.max(1, Math.min(window.innerHeight - 1, Math.round(window.innerHeight * 0.34)));
    const anchor = document.elementFromPoint(anchorX, anchorY);
    if (!anchor || anchor === doc || anchor === body) return mutate();
    const topBefore = anchor.getBoundingClientRect().top;
    const result = mutate();
    const topAfter = anchor.getBoundingClientRect().top;
    const delta = topAfter - topBefore;
    if (Math.abs(delta) > 1.25 && Math.abs(delta) < Math.max(160, window.innerHeight * 0.72)) {
      markRSScriptedScroll(350);
      try { window.scrollBy(0, delta); } catch (e) { /* ignore */ }
    }
    return result;
  };


  // v191: use the browser's NATIVE scroll restoration. Setting this to 'manual'
  // (the prior behavior) disabled the browser's built-in, reliable position
  // restoration after reloads / back-forward navigation, then handed the job to
  // the custom resilience guard above — which was gated behind a dozen
  // conditions and frequently failed, stranding mobile users at the top after
  // an iOS tab-discard reload. 'auto' is the correct, robust default for a
  // static document and is what actually prevents "reloaded to the top".
  try { if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'auto'; } catch (e) { /* ignore */ }
  window.addEventListener('pageshow', () => {
    window.requestAnimationFrame(() => {
      try { document.dispatchEvent(new CustomEvent('rs:scrollfx-refresh')); } catch (e) { /* ignore */ }
    });
  }, { once: true });

  // v121 customer-ready build — last-known-good scroll engine restored — refined hero scale, precision section anchoring, replayable downward card reveals, final color polish, and production launch fixes.
  // v63: mark exact page links for assistive tech and browser UI quality.
  const currentFile = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('a[href]').forEach((link) => {
    const href = link.getAttribute('href') || '';
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    const hrefFile = (href.split('#')[0].split('?')[0] || 'index.html').split('/').pop().toLowerCase();
    if (hrefFile === currentFile && !href.includes('#')) {
      link.setAttribute('aria-current', 'page');
    }
  });

  // v154: prevent same-page links from doing a full document reload. This is
  // especially important for the logo/home links on a static GitHub Pages build:
  // accidental taps should not make the page appear to randomly reload or jump.
  const normalizedCurrentFile = currentFile || 'index.html';
  const isPlainPrimaryClick = (event) => event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
  document.addEventListener('click', (event) => {
    if (!isPlainPrimaryClick(event)) return;
    const link = event.target.closest && event.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href') || '';
    if (!href || href.includes('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    let url;
    try { url = new URL(href, window.location.href); }
    catch (e) { return; }
    if (url.origin !== window.location.origin) return;
    const hrefFile = (url.pathname.split('/').pop() || 'index.html').toLowerCase();
    if (hrefFile !== normalizedCurrentFile || url.search) return;
    // Current-page non-hash links should not reload the document and should not
    // scroll the customer to the top. On mobile, an accidental tap on the logo or
    // current page link can otherwise feel like a random refresh.
    event.preventDefault();
    if (link.closest('.brand') || link.classList.contains('rs-footer__home')) {
      const rsMotionEngine = document.querySelector('[data-motion-section]');
      try { window.scrollTo({ top: 0, left: 0, behavior: rsMotionEngine ? 'auto' : 'smooth' }); }
      catch (err) { window.scrollTo(0, 0); }
      if (window.history && window.history.replaceState && window.location.hash) {
        try { window.history.replaceState(null, '', window.location.pathname + window.location.search); } catch (err) { /* ignore */ }
      }
    }
    try { link.blur(); } catch (e) { /* ignore */ }
  }, true);

  // v63: light-touch perceived-performance prefetch for internal HTML routes.
  const prefetchedRoutes = new Set();
  const prefetchRoute = (href) => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection && (connection.saveData || ['slow-2g', '2g'].includes(connection.effectiveType))) return;
    if (!href || prefetchedRoutes.has(href)) return;
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    const cleanHref = href.split('#')[0].split('?')[0];
    if (!cleanHref || (!cleanHref.endsWith('.html') && cleanHref !== './' && cleanHref !== '/')) return;
    prefetchedRoutes.add(href);
    const preload = document.createElement('link');
    preload.rel = 'prefetch';
    preload.href = cleanHref;
    preload.as = 'document';
    document.head.appendChild(preload);
  };
  document.querySelectorAll('a[href]').forEach((link) => {
    const href = link.getAttribute('href') || '';
    link.addEventListener('pointerenter', () => prefetchRoute(href), { once: true, passive: true });
    link.addEventListener('focus', () => prefetchRoute(href), { once: true });
  });

  if (siteHeader && !siteHeader.querySelector('.site-progress-head')) {
    const progressHead = document.createElement('span');
    progressHead.className = 'site-progress-head';
    progressHead.setAttribute('aria-hidden', 'true');
    siteHeader.appendChild(progressHead);
  }

  const navToggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-site-nav]');
  const desktopNavBreakpoint = 1320;

  const syncNavA11y = (isOpen = false) => {
    if (!nav) return;
    if (window.innerWidth <= desktopNavBreakpoint) {
      nav.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    } else {
      nav.removeAttribute('aria-hidden');
    }
  };

  const closeNav = (restoreFocus = false) => {
    if (!nav || !navToggle) return;
    nav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    body.classList.remove('has-menu-open');
    syncNavA11y(false);
    if (restoreFocus) {
      try { navToggle.focus({ preventScroll: true }); }
      catch (error) { navToggle.focus(); }
    }
  };

  if (nav && navToggle) {
    syncNavA11y(false);

    navToggle.addEventListener('click', (event) => {
      event.stopPropagation();
      const willOpen = !nav.classList.contains('is-open');
      nav.classList.toggle('is-open', willOpen);
      navToggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      // v190: keep mobile menu opening from changing root scroll geometry.
      // Desktop keeps the existing body lock; mobile avoids iOS-style top snaps.
      body.classList.toggle('has-menu-open', willOpen && !(rsIsTouchLike() || window.innerWidth <= desktopNavBreakpoint));
      syncNavA11y(willOpen);
    });

    nav.addEventListener('click', (event) => {
      event.stopPropagation();
      if (event.target.closest('a')) closeNav();
    });

    document.addEventListener('click', (event) => {
      if (!nav.classList.contains('is-open')) return;
      if (!nav.contains(event.target) && !navToggle.contains(event.target)) closeNav();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeNav(true);
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > desktopNavBreakpoint) closeNav();
      else syncNavA11y(nav.classList.contains('is-open'));
    });
  }

  const reviewForm = document.getElementById('review-form');
  if (reviewForm) {
    const status = reviewForm.querySelector('.form-status');
    const submitButton = reviewForm.querySelector('button[type="submit"]');
    const inbox = (window.RS_CONFIG && window.RS_CONFIG.reviewInbox) ? window.RS_CONFIG.reviewInbox : 'support@reservestandard.com';
    const configuredEndpoint = (window.RS_CONFIG && window.RS_CONFIG.reviewFormEndpoint) ? String(window.RS_CONFIG.reviewFormEndpoint).trim() : '';
    const endpoint = configuredEndpoint || `https://formsubmit.co/ajax/${inbox}`;

    const setReviewStatus = (message, state = '') => {
      if (!status) return;
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      status.textContent = message;
      status.dataset.state = state;
    };

    const compact = (value) => String(value || '').replace(/\s+/g, ' ').trim();
    const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());

    const buildReviewPayload = (data) => {
      const name = compact(data.get('name'));
      const business = compact(data.get('business'));
      const email = compact(data.get('email'));
      const website = compact(data.get('website'));
      const industry = compact(data.get('industry'));
      const surplus = compact(data.get('surplus'));
      const objective = compact(data.get('objective'));
      const submittedAt = new Date().toISOString();
      return {
        _subject: `Bitcoin Treasury Review — ${business || 'New request'}`,
        _template: 'table',
        _captcha: 'false',
        _replyto: email,
        name,
        business,
        email,
        website: website || 'N/A',
        industry: industry && industry !== 'Choose one' ? industry : 'N/A',
        monthly_treasury_range: surplus && surplus !== 'Choose one' ? surplus : 'N/A',
        current_treasury_inflation_pressure_objective: objective || 'N/A',
        message: [
          'Reserve Standard — Bitcoin Treasury Review Request',
          '',
          `Name: ${name}`,
          `Business: ${business}`,
          `Email: ${email}`,
          `Website: ${website || 'N/A'}`,
          `Industry: ${industry && industry !== 'Choose one' ? industry : 'N/A'}`,
          `Monthly treasury range: ${surplus && surplus !== 'Choose one' ? surplus : 'N/A'}`,
          '',
          'Current treasury / inflation pressure / objective:',
          objective || 'N/A',
          '',
          `Submitted from ${window.location.href}`,
          `Submitted at ${submittedAt}`
        ].join('\n'),
        page: document.title || 'Reserve Standard',
        path: window.location.pathname,
        submitted_at: submittedAt,
        source: 'reserve-standard-review-form'
      };
    };

    const submitHiddenReviewForm = (fields) => new Promise((resolve) => {
      try {
        const host = document.body || document.documentElement;
        const targetName = 'rs-review-submit-' + Date.now().toString(36);
        const iframe = document.createElement('iframe');
        iframe.name = targetName;
        iframe.title = '';
        iframe.tabIndex = -1;
        iframe.setAttribute('aria-hidden', 'true');
        iframe.style.cssText = 'position:absolute!important;width:0!important;height:0!important;border:0!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;clip-path:inset(50%)!important;white-space:nowrap!important;';
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = endpoint.replace('/ajax/', '/');
        form.target = targetName;
        form.acceptCharset = 'UTF-8';
        form.setAttribute('aria-hidden', 'true');
        form.style.cssText = iframe.style.cssText;
        Object.keys(fields).forEach((key) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = String(fields[key] == null ? '' : fields[key]);
          form.appendChild(input);
        });
        host.appendChild(iframe);
        host.appendChild(form);
        form.submit();
        window.setTimeout(() => {
          try { if (form.parentNode) form.parentNode.removeChild(form); } catch (error) {}
          try { if (iframe.parentNode) iframe.parentNode.removeChild(iframe); } catch (error) {}
          resolve(true);
        }, 1200);
      } catch (error) {
        resolve(false);
      }
    });

    reviewForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = new FormData(reviewForm);
      if (String(data.get('_honey') || '').trim()) return;
      const name = compact(data.get('name'));
      const business = compact(data.get('business'));
      const email = compact(data.get('email'));

      if (!name || !email) {
        setReviewStatus('Please add your name and email before sending.', 'error');
        return;
      }
      if (!validEmail(email)) {
        setReviewStatus('Please enter a valid business email address.', 'error');
        return;
      }

      const fields = buildReviewPayload(data);
      const encoded = new URLSearchParams();
      Object.keys(fields).forEach((key) => encoded.set(key, fields[key]));

      const originalLabel = submitButton ? submitButton.textContent : '';
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Sending request';
      }
      setReviewStatus('Sending your private review request…', 'sending');

      let sent = false;
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8', 'Accept': 'application/json' },
          body: encoded.toString()
        });
        sent = response.ok;
      } catch (error) {
        sent = false;
      }

      if (!sent) {
        sent = await submitHiddenReviewForm(fields);
      }

      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalLabel || 'Send review request';
      }

      if (sent) {
        reviewForm.reset();
        setReviewStatus('Review request sent. Reserve Standard will review fit privately and respond from support@reservestandard.com.', 'success');
      } else {
        setReviewStatus('The form could not send from this browser. Please use “Email support instead” or send directly to support@reservestandard.com.', 'error');
      }
    });
  }

  const chapterRail = document.querySelector('.chapter-rail');
  const chapterLinks = [...document.querySelectorAll('.chapter-rail [data-rail-target]')];
  const sectionLinks = [...document.querySelectorAll('.site-nav a[href^="index.html#"], .site-nav a[href^="#"]')];
  const chapterSections = chapterLinks
    .map(link => {
      const id = link.getAttribute('data-rail-target');
      const el = id ? document.getElementById(id) : null;
      return el ? { link, el, id } : null;
    })
    .filter(Boolean);

  const navSectionLinks = sectionLinks.map(link => {
    const href = link.getAttribute('href') || '';
    const id = href.includes('#') ? href.split('#')[1] : '';
    const el = id ? document.getElementById(id) : null;
    return el ? { link, el } : null;
  }).filter(Boolean);

  // v85: Precision in-page navigation. Native hash jumps target the section
  // wrapper; this site has generous section padding, so default anchors land
  // with too much blank space under the sticky header. Aim each click at the
  // section's readable optical start instead: the intro on light sections and
  // the dark proof panel itself on the proof section. This keeps Why now,
  // Framework, and Proof feeling intentional and consistent.
  const sectionAnchorTarget = (section) => {
    if (!section) return null;
    if (section.id === 'proof') return section.querySelector('.proof-shell') || section;
    return section.querySelector('.section-intro') || section;
  };

  const sectionAnchorGap = () => {
    if (window.innerWidth <= 640) return 24;
    if (window.innerWidth <= 960) return 32;
    return 46;
  };

  const scrollToSectionAnchor = (id, behavior = 'smooth', updateHash = true) => {
    const section = id ? document.getElementById(id) : null;
    const target = sectionAnchorTarget(section);
    if (!target) return false;
    const headerBottom = siteHeader ? siteHeader.getBoundingClientRect().bottom : 0;
    const intro = section.querySelector('.section-intro');
    if (intro) intro.classList.add('is-visible');
    section.querySelectorAll('[data-reveal]').forEach(node => node.classList.add('is-visible'));
    target.classList.add('is-visible');
    const targetY = target.getBoundingClientRect().top + window.scrollY - headerBottom - sectionAnchorGap();
    markRSScriptedScroll(1200);
    window.scrollTo({ top: Math.max(0, Math.round(targetY)), behavior: prefersReducedMotion() ? 'auto' : behavior });
    if (updateHash && window.history && window.history.pushState) {
      const keepHashInUrl = !(rsIsTouchLike() || window.innerWidth <= 820);
      if (keepHashInUrl) {
        window.history.pushState(null, '', `#${id}`);
      } else if (window.history.replaceState && window.location.hash) {
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
      }
    }
    return true;
  };

  const normalizeInternalHash = (href) => {
    if (!href || !href.includes('#')) return '';
    const [path, hash] = href.split('#');
    if (!hash) return '';
    const cleanPath = (path || '').split('/').pop().toLowerCase();
    const onIndex = currentFile === '' || currentFile === 'index.html';
    const pointsToIndex = !cleanPath || cleanPath === 'index.html';
    return onIndex && pointsToIndex ? hash : '';
  };

  document.addEventListener('click', (event) => {
    const link = event.target.closest && event.target.closest('a[href]');
    if (!link) return;
    const id = normalizeInternalHash(link.getAttribute('href') || '');
    if (!id || !document.getElementById(id)) return;
    event.preventDefault();
    if (nav && nav.classList.contains('is-open')) closeNav();
    scrollToSectionAnchor(id, 'smooth', true);
  }, true);

  if (window.location.hash) {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id && document.getElementById(id)) {
      const clearMobileHash = () => {
        try {
          if ((rsIsTouchLike() || window.innerWidth <= 820) && window.history && window.history.replaceState) {
            window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
          }
        } catch (e) { /* ignore */ }
      };
      window.setTimeout(() => { scrollToSectionAnchor(id, 'auto', false); clearMobileHash(); }, 120);
      window.addEventListener('load', () => window.setTimeout(() => { scrollToSectionAnchor(id, 'auto', false); clearMobileHash(); }, 40), { once: true });
    }
  }

  const revealNodes = [
    '.hero-copy > *',
    '.hero-stack > *',
    '.section-intro',
    '.copy-block',
    '.stack-card',
    '.matrix-shell',
    '.band-card',
    '.proof-panel',
    '.proof-sidebar',
    '.process-card',
    '.final-cta',
    '.review-hero > *',
    '.review-side > *',
    '.review-form-shell > *',
    '.article-hero > *',
    '.article > *',
    '.side-card',
    '.cover-frame',
    '.legal-wrap > *',
    '.footer-grid > *',
    '.footer-base > *'
  ].flatMap(selector => [...document.querySelectorAll(selector)]);

  const uniqueReveal = [];
  const revealSet = new Set();
  revealNodes.forEach((node, index) => {
    if (revealSet.has(node)) return;
    revealSet.add(node);
    node.setAttribute('data-reveal', '');
    node.style.setProperty('--reveal-delay', `${(index % 6) * 60}ms`);
    uniqueReveal.push(node);
  });

  if (!prefersReducedMotion() && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });

    uniqueReveal.forEach(node => revealObserver.observe(node));
  } else {
    uniqueReveal.forEach(node => node.classList.add('is-visible'));
  }

  // ---------------------------------------------------------------------
  // v29 — SCROLL-DRIVEN slide-in animation for the three Framework
  // band-cards (Asset / Problem / System). The cards progress from
  // initial state to final state based on the user's scroll position,
  // not on a timer. Each card has a per-card scroll offset so they
  // reveal one after another as the user scrolls down — slow,
  // deliberate fintech motion graphics quality.
  //
  // Direct inline-style mutations (no CSS transitions, no WAAPI) so
  // the animation plays reliably even under prefers-reduced-motion at
  // the OS level — Chrome pauses CSS transitions and WAAPI under that
  // setting, but DOM mutations driven by scroll events always run.
  // ---------------------------------------------------------------------
  const slideInBandCards = [...document.querySelectorAll('.band-grid .band-card')];
  if (slideInBandCards.length) {
    // Strip the global reveal pipeline from these cards so it doesn't
    // mark them is-visible instantly with no animation.
    slideInBandCards.forEach((card) => {
      card.removeAttribute('data-reveal');
      card.classList.remove('is-visible');
      card.style.setProperty('will-change', 'transform, opacity, filter');
    });

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    // Per-card stagger: each card's "effective top" is offset by this
    // many pixels, so card 1 starts animating SCROLL_STAGGER px of
    // scroll AFTER card 0 starts, card 2 starts 2× that after card 0.
    // Asset → Problem → System cadence.
    const SCROLL_STAGGER = 95;

    // Progress = 0 when the card's effective top crosses START_RATIO of
    // viewport height. With START_RATIO > 1.0, animation starts while
    // the card is still slightly BELOW the viewport — anticipatory
    // reveal, classic editorial scroll-storytelling pattern.
    //
    // Progress = 1 when the effective top reaches END_RATIO of viewport
    // height. With END_RATIO = 0.62, the LAST card (System) completes
    // when its actual rect.top ≈ 370 (matches the position in the
    // the lower-middle of the viewport with breathing room above).
    //
    // Range = (1.10 - 0.62) × viewport ≈ 0.48 × vh ≈ 432px on a 900px
    // viewport. Slow, deliberate. Total reveal span ≈ 432 + 2×95 =
    // 622px of scroll for all three cards to land.
    const START_RATIO = 1.10;
    const END_RATIO = 0.62;

    const updateCards = () => {
      // v174: keep scroll-storytelling alive in both scroll directions.
      // Progress is still one-way per card (max progress below), so cards never
      // visually unload, but we must continue painting while scrolling upward or
      // sections can look frozen/not initialized after a gate unlock or fast swipe.
      if (window.RSSyncScrollDirection) window.RSSyncScrollDirection();
      const viewportH = window.innerHeight;
      const startY = viewportH * START_RATIO;
      const endY = viewportH * END_RATIO;
      const range = Math.max(1, startY - endY);

      slideInBandCards.forEach((card, idx) => {
        const rect = card.getBoundingClientRect();
        // Add idx-based offset so the cards stagger by scroll position.
        const effectiveTop = rect.top + idx * SCROLL_STAGGER;
        const raw = (startY - effectiveTop) / range;
        const progress = Math.max(0, Math.min(1, raw));

        // v146: one-pass entrance. Professional marketing-page motion should
        // reward the first down-scroll, then stay settled instead of replaying
        // or reverse-unloading when the user scrolls back. Reloading the page
        // is the only reset. On mobile, enter upward from below instead of
        // sliding in from the right to avoid horizontal-feeling motion.
        const wasComplete = card._rsSlideCompleted === true;
        let storedProgress = wasComplete
          ? 1
          : (typeof card._rsSlideProgress === 'number' ? card._rsSlideProgress : progress);
        storedProgress = wasComplete ? 1 : Math.max(storedProgress, progress);
        if (storedProgress >= 0.995) {
          storedProgress = 1;
          card._rsSlideCompleted = true;
        }
        card._rsSlideProgress = storedProgress;

        const e = easeOutCubic(storedProgress);
        const isMobileSlide = window.innerWidth <= 760;
        const tx = isMobileSlide ? 0 : (1 - e) * 140;
        const ty = isMobileSlide ? (1 - e) * 42 : 0;
        const sc = 0.96 + e * 0.04;
        const bl = isMobileSlide ? 0 : (1 - e) * 10;
        card.style.setProperty('opacity', String(e), 'important');
        card.style.setProperty(
          'transform',
          `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) scale(${sc.toFixed(4)})`,
          'important'
        );
        card.style.setProperty('filter', isMobileSlide ? 'none' : `blur(${bl.toFixed(2)}px)`, 'important');
        if (storedProgress >= 1) {
          card.style.removeProperty('will-change');
        } else {
          card.style.setProperty('will-change', isMobileSlide ? 'transform, opacity' : 'transform, opacity, filter');
        }
      });
    };

    // v172: align scroll card paint with the browser frame. setTimeout can
    // fire mid-scroll and make upward mobile scrolling feel sticky.
    let scheduled = false;
    const scheduleUpdate = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => { updateCards(); scheduled = false; });
    };

    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', () => { if (window.RSShouldSkipMobileResizeRefresh && window.RSShouldSkipMobileResizeRefresh()) return; scheduleUpdate(); });
    window.addEventListener('load', scheduleUpdate, { once: true });
    window.addEventListener('pageshow', scheduleUpdate);
    document.addEventListener('rs:gate-unlocked', scheduleUpdate);
    document.addEventListener('rs:scrollfx-refresh', scheduleUpdate);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => window.RSRunAfterMobileScrollSettles ? window.RSRunAfterMobileScrollSettles(scheduleUpdate) : scheduleUpdate()).catch(() => {});
    }
    window.setTimeout(scheduleUpdate, 120);
    // Initial run so cards are in correct state on page load.
    updateCards();
  }

  let refreshClosingScrollCards = null;

  // ---------------------------------------------------------------------
  // v79 — Closing-card scroll choreography timed to the screenshot point.
  //
  // Desired sequence:
  //   1) Operator Materials loads slowly and deliberately.
  //   2) A short scroll-based pause follows.
  //   3) Next Step begins after that pause and finishes exactly when the row
  //      header — not before that point, and not after it.
  //
  // Critical implementation detail: the progress math uses layout top from
  // offsetTop, not getBoundingClientRect().top, because transforms/scale change
  // the bounding rect while the card is animating. That feedback loop is what
  // made earlier versions look early or late. Layout-top progress gives a stable,
  // testable landing point.
  // ---------------------------------------------------------------------
  const closingScrollCards = [...document.querySelectorAll('.download-grid [data-closing-scroll-card]')];
  if (closingScrollCards.length) {
    closingScrollCards.forEach((card) => {
      card.removeAttribute('data-reveal');
      card.classList.remove('is-visible', 'rs-scroll-slide-card', 'is-landed', 'has-scroll-landed', 'is-cta-focus-window', 'is-scroll-paused');
      const isMobileClosingInit = window.innerWidth <= 760;
      card.style.setProperty('will-change', isMobileClosingInit ? 'transform, opacity' : 'transform, opacity, filter');
      card.style.setProperty('opacity', '0', 'important');
      card.style.setProperty('transform', isMobileClosingInit ? 'translate3d(0, 46px, 0) scale(0.9620)' : 'translate3d(144px, 0, 0) scale(0.9580)', 'important');
      card.style.setProperty('filter', isMobileClosingInit ? 'none' : 'blur(10px)', 'important');
    });

    const clamp01 = (value) => Math.max(0, Math.min(1, value));
    const clampPx = (value, min, max) => Math.max(min, Math.min(max, value));
    const easeOutCubicClosing = (t) => 1 - Math.pow(1 - t, 3);

    // A near-linear scroll scrub for the CTA card. This prevents the card from
    // looking fully loaded too early while still feeling smooth and controlled.
    const easeExactArrival = (t) => Math.pow(clamp01(t), 1.10);

    const getHeaderBottom = () => {
      const header = document.querySelector('.site-header');
      if (!header) return 92;
      const rect = header.getBoundingClientRect();
      return Math.max(0, rect.bottom || rect.height || 92);
    };

    const getLayoutTop = (el) => {
      let top = 0;
      let node = el;
      while (node) {
        top += node.offsetTop || 0;
        node = node.offsetParent;
      }
      return top - window.scrollY;
    };

    const progressFromTopPx = (top, startY, endY) => {
      return clamp01((startY - top) / Math.max(1, startY - endY));
    };

    const getDesktopTiming = (viewportH) => {
      const headerBottom = getHeaderBottom();

      // Screenshot-equivalent landing point. In the reference capture, the row
      // is settled when its top sits around 27.5% down the viewport, roughly one
      // calm visual beat below the sticky progress rail. Use both a viewport
      // ratio and the live header height so the finish stays aligned through
      // browser zoom, retina/non-retina captures, and laptop/desktop heights.
      const opticalGap = clampPx(viewportH * 0.10, 54, 112);
      const arrivalY = clampPx(
        Math.max(viewportH * 0.275, headerBottom + opticalGap),
        headerBottom + 46,
        viewportH * 0.34
      );

      const nextStartY = clampPx(
        arrivalY + clampPx(viewportH * 0.26, 160, 260),
        viewportH * 0.50,
        viewportH * 0.72
      );
      const operatorEndY = clampPx(
        nextStartY + clampPx(viewportH * 0.075, 56, 90),
        viewportH * 0.56,
        viewportH * 0.80
      );
      const operatorStartY = viewportH * 1.20;

      return [
        { startY: operatorStartY, endY: operatorEndY, drift: 144, mobileDrift: 48, blur: 10, scaleFrom: 0.958, ease: easeOutCubicClosing },
        { startY: nextStartY, endY: arrivalY, drift: 146, mobileDrift: 46, blur: 10, scaleFrom: 0.958, ease: easeExactArrival, exactArrivalY: arrivalY }
      ];
    };

    const getStackedTiming = (viewportH, idx) => {
      const headerBottom = getHeaderBottom();
      const opticalGap = clampPx(viewportH * 0.11, 52, 100);
      const arrivalY = clampPx(
        Math.max(viewportH * 0.30, headerBottom + opticalGap),
        headerBottom + 42,
        viewportH * 0.43
      );
      const startY = idx === 0
        ? arrivalY + clampPx(viewportH * 0.34, 160, 260)
        : arrivalY + clampPx(viewportH * 0.29, 140, 230);

      return {
        startY,
        endY: arrivalY,
        drift: idx === 0 ? 84 : 78,
        mobileDrift: idx === 0 ? 48 : 44,
        blur: 9,
        scaleFrom: 0.962,
        ease: idx === 0 ? easeOutCubicClosing : easeExactArrival,
        exactArrivalY: idx === 1 ? arrivalY : undefined
      };
    };

    const paintClosingCard = (card, progress, timing, top) => {
      const hasExactArrival = typeof timing.exactArrivalY === 'number';
      const hasArrived = hasExactArrival ? top <= timing.exactArrivalY + 0.75 : progress >= 1;
      const e = hasArrived ? 1 : (timing.ease || easeOutCubicClosing)(progress);

      const isMobileClosing = window.innerWidth <= 760;
      const tx = isMobileClosing ? 0 : (1 - e) * timing.drift;
      const ty = isMobileClosing ? (1 - e) * (timing.mobileDrift || 46) : 0;
      const sc = timing.scaleFrom + e * (1 - timing.scaleFrom);
      const bl = isMobileClosing ? 0 : (1 - e) * timing.blur;

      card.style.setProperty('opacity', String(e), 'important');
      card.style.setProperty(
        'transform',
        `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) scale(${sc.toFixed(4)})`,
        'important'
      );
      card.style.setProperty('filter', isMobileClosing ? 'none' : `blur(${bl.toFixed(2)}px)`, 'important');
      if (hasArrived || progress >= 0.995) {
        card.style.removeProperty('will-change');
      } else {
        card.style.setProperty('will-change', isMobileClosing ? 'transform, opacity' : 'transform, opacity, filter');
      }
      card.classList.toggle('has-scroll-landed', hasArrived || progress >= 0.995);
    };

    const closingProgressMemory = closingScrollCards.map(() => 0);

    const updateClosingScrollCards = () => {
      const viewportH = window.innerHeight || document.documentElement.clientHeight || 800;
      const firstTop = getLayoutTop(closingScrollCards[0]);
      const secondTop = closingScrollCards[1] ? getLayoutTop(closingScrollCards[1]) : firstTop;
      const isStacked = Math.abs(secondTop - firstTop) > 44;
      const desktopTiming = getDesktopTiming(viewportH);
      if (window.RSSyncScrollDirection) window.RSSyncScrollDirection();

      closingScrollCards.forEach((card, idx) => {
        const top = isStacked ? getLayoutTop(card) : firstTop;
        const timing = isStacked
          ? getStackedTiming(viewportH, idx)
          : (desktopTiming[idx] || desktopTiming[desktopTiming.length - 1]);
        const rawProgress = progressFromTopPx(top, timing.startY, timing.endY);
        const storedProgress = typeof closingProgressMemory[idx] === 'number' ? closingProgressMemory[idx] : rawProgress;

        // v146: one-pass closing-card entrance. Advance on first exposure,
        // never reverse or replay during the same page session. This feels
        // calmer and more premium than reloading the cards every time the
        // visitor scrolls back through the section. Reloading resets naturally.
        let progress = Math.max(storedProgress, rawProgress);
        if (rawProgress >= 0.995 || (typeof timing.exactArrivalY === 'number' && top <= timing.exactArrivalY + 0.75)) progress = 1;
        progress = clamp01(progress);
        closingProgressMemory[idx] = progress;

        paintClosingCard(card, progress, timing, top);
        card.classList.toggle('is-scroll-paused', !isStacked && idx === 0 && firstTop < desktopTiming[0].endY && firstTop > desktopTiming[1].startY);
        card.classList.toggle('is-cta-focus-window', idx === 1 && progress > 0.10 && progress < 1);
      });
    };

    refreshClosingScrollCards = updateClosingScrollCards;

    let closingScrollScheduled = false;
    const scheduleClosingScrollUpdate = () => {
      if (closingScrollScheduled) return;
      closingScrollScheduled = true;
      window.requestAnimationFrame(() => {
        updateClosingScrollCards();
        closingScrollScheduled = false;
      });
    };

    // v152: scroll updates for these cards are handled by the main requestAnimationFrame pipeline.
    // Keeping a second direct scroll listener here caused duplicate paint work on mobile.
    window.addEventListener('resize', () => { if (window.RSShouldSkipMobileResizeRefresh && window.RSShouldSkipMobileResizeRefresh()) return; scheduleClosingScrollUpdate(); });
    window.addEventListener('load', scheduleClosingScrollUpdate, { once: true });
    window.addEventListener('pageshow', scheduleClosingScrollUpdate);
    document.addEventListener('rs:gate-unlocked', scheduleClosingScrollUpdate);
    document.addEventListener('rs:scrollfx-refresh', scheduleClosingScrollUpdate);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => window.RSRunAfterMobileScrollSettles ? window.RSRunAfterMobileScrollSettles(scheduleClosingScrollUpdate) : scheduleClosingScrollUpdate()).catch(() => {});
    }
    window.setTimeout(scheduleClosingScrollUpdate, 80);
    window.setTimeout(scheduleClosingScrollUpdate, 240);
    updateClosingScrollCards();
  }

  const proofCharts = [...document.querySelectorAll('.path-chart')];
  proofCharts.forEach(chart => {
    chart.querySelectorAll('svg path[stroke^="url("]').forEach(path => {
      path.setAttribute('data-line', '');
      try {
        const len = path.getTotalLength();
        path.style.setProperty('--line-length', `${len}`);
      } catch (error) {
        path.style.setProperty('--line-length', '1');
      }
    });
    chart.querySelectorAll('svg circle').forEach(circle => circle.setAttribute('data-endpoint', ''));
  });


  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const ramp = (progress, start, span) => clamp((progress - start) / Math.max(0.001, span));

  let whyNowCopy = document.querySelector('#why-now .copy-block');
  if (whyNowCopy && !whyNowCopy.parentElement.classList.contains('copy-rail')) {
    const rail = document.createElement('div');
    rail.className = 'copy-rail';
    whyNowCopy.parentNode.insertBefore(rail, whyNowCopy);
    rail.appendChild(whyNowCopy);
  }
  const syncWhyNowRail = () => {
    const section = document.getElementById('why-now');
    if (!section) return;
    const rail = section.querySelector('.copy-rail');
    const copy = section.querySelector('.copy-rail > .copy-block');
    const target = section.querySelector('.stack-card[data-sequence-card="3"]');
    if (!(rail && copy && target)) return;

    rail.style.removeProperty('height');

    if (window.innerWidth <= 960) {
      rail.style.removeProperty('height');
      return;
    }

    const railTop = rail.getBoundingClientRect().top + window.scrollY;
    const targetBottom = target.getBoundingClientRect().bottom + window.scrollY;
    const railHeight = Math.max(copy.offsetHeight, Math.round(targetBottom - railTop));
    rail.style.height = `${railHeight}px`;
  };
  const scheduleWhyNowRailSync = () => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => withStableViewportAnchor(syncWhyNowRail)));
  };

  whyNowCopy = document.querySelector('#why-now .copy-rail > .copy-block') || document.querySelector('#why-now .copy-block');
  const whyNowStack = document.querySelector('#why-now .stack-sequence');
  const whyNowCards = [...document.querySelectorAll('#why-now [data-sequence-card]')];
  const frameworkMatrix = document.querySelector('#framework .matrix-shell-animated');
  const frameworkRows = [...document.querySelectorAll('#framework [data-matrix-row]')];
  const frameworkBands = [...document.querySelectorAll('#framework .band-card')];
  const processGrid = document.querySelector('#process .process-grid-animated');
  const processCards = [...document.querySelectorAll('#process [data-process-card]')];

  // v114: Outcome Quality uses the same sticky-rail geometry principle as
  // Pressure Building. The left proof lens needs a real rail height that ends
  // at the bottom of the right-side proof story. Without this explicit sync,
  // responsive typography / font loading can make the sticky stop feel uneven.
  const proofSection = document.getElementById('proof');
  const proofRail = proofSection ? proofSection.querySelector('.proof-rail') : null;
  const proofPanel = proofSection ? proofSection.querySelector('.proof-panel') : null;
  const proofStack = proofSection ? proofSection.querySelector('.proof-scroll-stack') : null;

  const syncProofRail = () => {
    if (!(proofSection && proofRail && proofPanel && proofStack)) return;

    proofRail.style.removeProperty('height');
    proofRail.style.removeProperty('min-height');

    // Match the desktop sticky storytelling breakpoint. On tablet/mobile the
    // proof section stacks naturally, so no artificial rail height is needed.
    if (window.innerWidth <= 1200) {
      proofRail.style.removeProperty('height');
      proofRail.style.removeProperty('min-height');
      return;
    }

    const railTop = proofRail.getBoundingClientRect().top + window.scrollY;
    const stackBottom = proofStack.getBoundingClientRect().bottom + window.scrollY;
    const panelHeight = proofPanel.getBoundingClientRect().height || proofPanel.offsetHeight || 0;
    const railHeight = Math.max(panelHeight, Math.round(stackBottom - railTop));
    proofRail.style.height = `${railHeight}px`;
    proofRail.style.minHeight = `${railHeight}px`;
  };
  const scheduleProofRailSync = () => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => withStableViewportAnchor(syncProofRail)));
  };

  if (whyNowCopy) whyNowCopy.style.setProperty('--copy-progress', '0');
  if (whyNowStack) whyNowStack.style.setProperty('--stack-sweep', '0');
  if (frameworkMatrix) frameworkMatrix.style.setProperty('--matrix-sweep', '0');
  if (processGrid) processGrid.style.setProperty('--process-sweep', '0');
  whyNowCards.forEach(card => card.style.setProperty('--card-progress', '0'));
  frameworkRows.forEach(row => row.style.setProperty('--row-progress', '0'));
  frameworkBands.forEach(card => card.style.setProperty('--band-progress', '0'));
  processCards.forEach(card => card.style.setProperty('--process-card-progress', '0'));

  // v121: chart motion is owned by the final chart scrub engine at the end of this file.
  // Keep this hook as a no-op so the approved homepage scroll choreography stays intact
  // without multiple chart handlers fighting each other.
  const updateProofChartMotion = () => {};

  const hero = document.querySelector('.hero');
  const rsFooterPanel = document.querySelector('.rs-footer__panel');
  let scrollFxSections = [...document.querySelectorAll('.section[id]')];
  const refreshScrollFxSectionCache = () => { scrollFxSections = [...document.querySelectorAll('.section[id]')]; };
  let ticking = false;

  const getProgressFloor = (scrollable) => {
    const fallback = 0.10;
    const whyNow = document.getElementById('why-now');
    if (!whyNow) return fallback;

    const style = window.getComputedStyle(whyNow);
    const scrollMarginTop = parseFloat(style.scrollMarginTop) || 0;
    const targetY = Math.max(0, whyNow.offsetTop - scrollMarginTop);

    // Match the old zero-start rail's visible progress at the “Why this
    // matters now” anchor, while keeping the first impression restrained
    // across unusually short or tall viewports.
    return clamp(targetY / Math.max(1, scrollable), 0.10, 0.28);
  };

  const updateScrollFx = () => {
    ticking = false;
    const direction = window.RSSyncScrollDirection ? window.RSSyncScrollDirection() : window.__rsScrollDirection || 'down';

    const scrollableRaw = doc.scrollHeight - window.innerHeight;
    const scrollable = Math.max(1, scrollableRaw);
    const rawPageProgress = Math.max(0, Math.min(1, window.scrollY / scrollable));

    // v174: no upward-scroll fast return. The v170/v172 optimization made some
    // mobile scroll effects appear frozen or absent when the visitor reversed
    // direction. Entrance effects below are already monotonic, so running the
    // painter in both directions preserves the approved behavior without reverse
    // unloading the cards.

    if (refreshClosingScrollCards) refreshClosingScrollCards();
    updateProofChartMotion();

    // v84: restrained ambient light field. The values drive only low-alpha
    // decorative gradients on dark institutional surfaces and the footer;
    // they do not affect layout or card choreography.
    const ambientX = 82 - rawPageProgress * 18;
    const ambientY = 14 + rawPageProgress * 8;
    const ambientGlow = 0.12 + rawPageProgress * 0.035;
    doc.style.setProperty('--rs-ambient-x', `${ambientX.toFixed(2)}%`);
    doc.style.setProperty('--rs-ambient-y', `${ambientY.toFixed(2)}%`);
    doc.style.setProperty('--rs-ambient-glow', ambientGlow.toFixed(3));

    if (rsFooterPanel) {
      const footerRect = rsFooterPanel.getBoundingClientRect();
      const footerRaw = clamp((window.innerHeight - footerRect.top) / Math.max(1, window.innerHeight * 0.95));
      const footerEase = 1 - Math.pow(1 - footerRaw, 3);
      rsFooterPanel.style.setProperty('--rs-footer-progress', footerEase.toFixed(3));
      rsFooterPanel.style.setProperty('--rs-footer-light-x', `${(88 - footerEase * 18).toFixed(2)}%`);
      rsFooterPanel.style.setProperty('--rs-footer-light-y', `${(8 + footerEase * 10).toFixed(2)}%`);
      rsFooterPanel.style.setProperty('--rs-footer-glow', (0.12 + footerEase * 0.06).toFixed(3));
      rsFooterPanel.style.setProperty('--rs-footer-drift-x', `${(-8 * footerEase).toFixed(2)}px`);
      rsFooterPanel.style.setProperty('--rs-footer-drift-y', `${(4 * footerEase).toFixed(2)}px`);
    }

    const progressFloor = getProgressFloor(scrollable);
    const isAtEnd = scrollableRaw <= 1 || (window.scrollY + window.innerHeight >= doc.scrollHeight - 2);
    const pageProgress = isAtEnd
      ? 1
      : Math.max(progressFloor, Math.min(1, progressFloor + rawPageProgress * (1 - progressFloor)));

    const railFeatherBase = Math.max(16, Math.min(30, window.innerWidth * 0.0185));
    const railFeatherTaper = isAtEnd ? 0 : Math.max(0, Math.min(1, (1 - rawPageProgress) / 0.04));
    const railFeatherFull = railFeatherBase * railFeatherTaper;
    const railFeatherMid = Math.max(0, railFeatherFull * 0.50);

    doc.style.setProperty('--page-progress-raw', rawPageProgress.toFixed(4));
    doc.style.setProperty('--page-progress-floor', progressFloor.toFixed(4));
    doc.style.setProperty('--page-progress', pageProgress.toFixed(4));
    doc.style.setProperty('--page-progress-pct', `${(pageProgress * 100).toFixed(2)}%`);
    doc.style.setProperty('--rs-progress-feather-full', `${railFeatherFull.toFixed(2)}px`);
    doc.style.setProperty('--rs-progress-feather-mid', `${railFeatherMid.toFixed(2)}px`);
    body.classList.toggle('is-scrolled', window.scrollY > 20);
    body.classList.toggle('is-progress-complete', isAtEnd || pageProgress >= 0.999);

    if (hero && !prefersReducedMotion()) {
      const rect = hero.getBoundingClientRect();
      const travel = Math.max(1, rect.height * 0.95);
      const heroProgress = Math.max(0, Math.min(1, (0 - rect.top) / travel));
      hero.style.setProperty('--hero-progress', heroProgress.toFixed(4));
    }

    let activeIndex = -1;
    let bestDistance = Infinity;
    const viewportCenter = window.innerHeight / 2;

    scrollFxSections.forEach((section, index) => {
      const rect = section.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const distance = Math.abs(center - viewportCenter);
      const intensity = Math.max(0, 1 - distance / (window.innerHeight * 0.8));
      const progress = Math.max(0, Math.min(1, (viewportCenter - rect.top) / Math.max(1, rect.height)));
      const surfaceY = ((1 - intensity) * 12 - intensity * 4).toFixed(2);
      const surfaceScale = (0.992 + intensity * 0.008).toFixed(4);
      const shadowAlpha = (0.07 + intensity * 0.07).toFixed(3);
      const borderAlpha = (0.09 + intensity * 0.09).toFixed(3);

      section.style.setProperty('--section-progress', progress.toFixed(3));
      section.style.setProperty('--section-focus', intensity.toFixed(3));
      section.style.setProperty('--section-surface-y', `${surfaceY}px`);
      section.style.setProperty('--section-surface-scale', surfaceScale);
      section.style.setProperty('--section-shadow-alpha', shadowAlpha);
      section.style.setProperty('--section-border-alpha', borderAlpha);

      if (section.id === 'why-now') {
        const copyProgressRaw = ramp(progress, 0.02, 0.5);
        const stackSweepRaw = ramp(progress, 0.06, 0.82);
        const copyProgress = Math.max(Number(whyNowCopy && whyNowCopy.dataset.rsMaxCopyProgress || 0) || 0, copyProgressRaw);
        const stackSweep = Math.max(Number(whyNowStack && whyNowStack.dataset.rsMaxStackSweep || 0) || 0, stackSweepRaw);
        if (whyNowCopy) {
          whyNowCopy.dataset.rsMaxCopyProgress = String(copyProgress);
          whyNowCopy.style.setProperty('--copy-progress', copyProgress.toFixed(3));
        }
        if (whyNowStack) {
          whyNowStack.dataset.rsMaxStackSweep = String(stackSweep);
          whyNowStack.style.setProperty('--stack-sweep', stackSweep.toFixed(3));
        }
        whyNowCards.forEach((card, idx) => {
          const start = idx * 0.15;
          const progressWindowRaw = ramp(progress, start + 0.04, 0.34);
          const progressWindow = Math.max(Number(card.dataset.rsMaxCardProgress || 0) || 0, progressWindowRaw);
          card.dataset.rsMaxCardProgress = String(progressWindow);
          card.style.setProperty('--card-progress', progressWindow.toFixed(3));
        });
      }

      if (section.id === 'framework') {
        const matrixProgressRaw = ramp(progress, 0.02, 0.88);
        const matrixSweepRaw = ramp(progress, 0.06, 0.8);
        const matrixProgress = Math.max(Number(section.dataset.rsMaxMatrixProgress || 0) || 0, matrixProgressRaw);
        const matrixSweep = Math.max(Number(frameworkMatrix && frameworkMatrix.dataset.rsMaxMatrixSweep || 0) || 0, matrixSweepRaw);
        section.dataset.rsMaxMatrixProgress = String(matrixProgress);
        section.style.setProperty('--matrix-progress', matrixProgress.toFixed(3));
        if (frameworkMatrix) {
          frameworkMatrix.dataset.rsMaxMatrixSweep = String(matrixSweep);
          frameworkMatrix.style.setProperty('--matrix-sweep', matrixSweep.toFixed(3));
        }
        frameworkRows.forEach((row, idx) => {
          const rowProgressRaw = ramp(progress, idx * 0.13 + 0.03, 0.28);
          const rowProgress = Math.max(Number(row.dataset.rsMaxRowProgress || 0) || 0, rowProgressRaw);
          row.dataset.rsMaxRowProgress = String(rowProgress);
          row.style.setProperty('--row-progress', rowProgress.toFixed(3));
        });
        frameworkBands.forEach((card, idx) => {
          const bandProgress = ramp(progress, 0.34 + idx * 0.1, 0.26);
          // v172: one-pass card reveal. These are entrance/proof-reading cues,
          // not progress meters; once a customer has seen them, keep them landed
          // for the rest of the page session so scrolling upward never feels like
          // slow content is re-loading.
          const cardProgress = Math.max(Number(card._rsDirectionalBandProgress || 0) || 0, bandProgress);
          card._rsDirectionalBandProgress = cardProgress;
          card.style.setProperty('--band-progress', cardProgress.toFixed(3));
        });
      }

      if (section.id === 'process') {
        // v95: drive the connector from the actual process-grid position,
        // not from the full section height. This makes the line reach the
        // final card while the card row is still visibly in the reading zone
        // on desktop and wide laptop viewports.
        const gridRect = processGrid ? processGrid.getBoundingClientRect() : rect;
        const lineStartY = window.innerHeight * 0.82;
        const lineEndY = window.innerHeight * 0.46;
        const geometryProgressRaw = clamp((lineStartY - gridRect.top) / Math.max(1, lineStartY - lineEndY));
        // v186: the connector itself is a live scroll meter. Keep it tied to
        // current scroll geometry so it moves every time the visitor scrolls
        // through this section, while the card reveal state below remains
        // monotonic and stable.
        const processProgress = geometryProgressRaw;
        const processSweep = geometryProgressRaw;
        section.style.setProperty('--process-progress', processProgress.toFixed(3));
        if (processGrid) processGrid.style.setProperty('--process-sweep', processSweep.toFixed(3));
        processCards.forEach((card, idx) => {
          const stepProgressRaw = ramp(processProgress, idx * 0.22 - 0.02, 0.24);
          const stepProgress = Math.max(Number(card.dataset.rsMaxProcessCardProgress || 0) || 0, stepProgressRaw);
          card.dataset.rsMaxProcessCardProgress = String(stepProgress);
          card.style.setProperty('--process-card-progress', stepProgress.toFixed(3));
        });
      }

      if (distance < bestDistance) {
        bestDistance = distance;
        activeIndex = index;
      }
    });

    const sections = scrollFxSections;
    const firstTrackedSection = sections[0];
    if (firstTrackedSection && firstTrackedSection.getBoundingClientRect().top > window.innerHeight * 0.64) {
      activeIndex = -1;
    }
    sections.forEach((section, index) => {
      const isActive = index === activeIndex;
      const isPast = activeIndex > index;
      section.classList.toggle('is-active', isActive);
      section.classList.toggle('is-past', isPast);
    });

    if (chapterSections.length) {
      const firstTop = chapterSections[0].el.offsetTop;
      const lastTop = chapterSections[chapterSections.length - 1].el.offsetTop;
      const railAnchor = window.scrollY + viewportCenter;
      const railProgress = Math.max(0, Math.min(1, (railAnchor - firstTop) / Math.max(1, lastTop - firstTop)));
      if (chapterRail) chapterRail.style.setProperty('--rail-progress', railProgress.toFixed(4));

      chapterSections.forEach((item, index) => {
        const isActive = index === activeIndex;
        const isPast = activeIndex > index;
        item.link.classList.toggle('is-active', isActive);
        item.link.classList.toggle('is-past', isPast);
        if (isActive) item.link.setAttribute('aria-current', 'location');
        else item.link.removeAttribute('aria-current');
      });
    }

    if (navSectionLinks.length) {
      navSectionLinks.forEach(item => {
        item.link.classList.remove('is-active');
        item.link.removeAttribute('aria-current');
      });
      if (activeIndex >= 0 && navSectionLinks[activeIndex]) {
        navSectionLinks[activeIndex].link.classList.add('is-active');
        navSectionLinks[activeIndex].link.setAttribute('aria-current', 'location');
      }
    }
  };

  const requestScrollFx = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateScrollFx);
  };

  scheduleWhyNowRailSync();
  scheduleProofRailSync();
  window.addEventListener('load', () => {
    refreshScrollFxSectionCache();
    scheduleWhyNowRailSync();
    scheduleProofRailSync();
    requestScrollFx();
  });
  const refreshPrimaryScrollFx = () => {
    refreshScrollFxSectionCache();
    scheduleWhyNowRailSync();
    scheduleProofRailSync();
    requestScrollFx();
  };
  window.addEventListener('scroll', requestScrollFx, { passive: true });
  window.addEventListener('resize', () => { if (window.RSShouldSkipMobileResizeRefresh && window.RSShouldSkipMobileResizeRefresh()) return; refreshPrimaryScrollFx(); });
  window.addEventListener('pageshow', refreshPrimaryScrollFx);
  document.addEventListener('rs:gate-unlocked', refreshPrimaryScrollFx);
  document.addEventListener('rs:scrollfx-refresh', refreshPrimaryScrollFx);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      const run = () => {
        scheduleWhyNowRailSync();
        scheduleProofRailSync();
        requestScrollFx();
      };
      if (window.RSRunAfterMobileScrollSettles) window.RSRunAfterMobileScrollSettles(run);
      else run();
    }).catch(() => {});
    document.fonts.addEventListener?.('loadingdone', () => {
      scheduleWhyNowRailSync();
      scheduleProofRailSync();
      requestScrollFx();
    });
  }
  if (reduceMotionQuery.addEventListener) {
    reduceMotionQuery.addEventListener('change', requestScrollFx);
  }
  requestScrollFx();
})();


/* v112: after private-gate unlock, repaint the stable scroll engine once.
   Do not dispatch resize or force scrollTop; those were the likely source of
   mobile "jump/reload" feeling on some browsers. */
document.addEventListener('rs:gate-unlocked', function(){
  window.requestAnimationFrame(function(){
    try {
      // Do not synthesize a browser scroll event on unlock. Instead, notify the
      // specific scroll-effect engines to remeasure and repaint after the gate
      // overlay is removed. This preserves the approved no-jump behavior while
      // keeping every story rail, chart, and card motion initialized.
      document.documentElement.classList.add('rs-gate-visuals-ready');
      try { document.dispatchEvent(new CustomEvent('rs:scrollfx-refresh')); } catch (eventError) {}
      window.requestAnimationFrame(function(){
        try { document.dispatchEvent(new CustomEvent('rs:scrollfx-refresh')); } catch (eventError) {}
      });
    } catch (e) {}
  });
});

/* v112: chapter seams use the stable section-progress timing again. */


/* v112: Outcome Quality desktop/mobile motion parity.
   This reads the already-rendered proof story cards and assigns per-card
   progress variables. It does not alter the core homepage scroll engine or
   any of the tuned card choreography. */
(function(){
  const rows = Array.from(document.querySelectorAll('#proof .proof-table-story tr'));
  const lensMetrics = Array.from(document.querySelectorAll('#proof .proof-sidebar .metric'));
  if (!rows.length && !lensMetrics.length) return;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (v) => Math.max(0, Math.min(1, v));
  let ticking = false;

  const setProgress = (el, name, value) => {
    el.style.setProperty(name, value.toFixed(3));
  };

  const update = () => {
    ticking = false;
    if (window.RSSyncScrollDirection) window.RSSyncScrollDirection();
    if (reduce && reduce.matches) {
      rows.forEach(row => setProgress(row, '--proof-card-progress', 1));
      lensMetrics.forEach(metric => setProgress(metric, '--proof-lens-progress', 1));
      return;
    }
    const vh = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 1);
    rows.forEach((row, idx) => {
      const rect = row.getBoundingClientRect();
      const start = vh * 0.88;
      const end = vh * 0.44;
      const raw = (start - rect.top) / Math.max(1, start - end);
      const stagger = idx * 0.035;
      const next = Math.max(Number(row.dataset.rsMaxProofCardProgress || 0) || 0, clamp(raw - stagger));
      row.dataset.rsMaxProofCardProgress = String(next);
      setProgress(row, '--proof-card-progress', next);
    });
    lensMetrics.forEach((metric, idx) => {
      const rect = metric.getBoundingClientRect();
      const start = vh * 0.92;
      const end = vh * 0.54;
      const raw = (start - rect.top) / Math.max(1, start - end);
      const next = Math.max(Number(metric.dataset.rsMaxProofLensProgress || 0) || 0, clamp(raw - idx * 0.025));
      metric.dataset.rsMaxProofLensProgress = String(next);
      setProgress(metric, '--proof-lens-progress', next);
    });
  };
  const request = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  };
  window.addEventListener('scroll', request, { passive:true });
  window.addEventListener('resize', () => { if (window.RSShouldSkipMobileResizeRefresh && window.RSShouldSkipMobileResizeRefresh()) return; request(); });
  window.addEventListener('load', request);
  document.addEventListener('rs:gate-unlocked', request);
  document.addEventListener('rs:scrollfx-refresh', request);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => window.RSRunAfterMobileScrollSettles ? window.RSRunAfterMobileScrollSettles(request) : request()).catch(()=>{});
  if (reduce && reduce.addEventListener) reduce.addEventListener('change', request);
  request();
})();



/* =====================================================================
   v124 — proof chart + chapter-parity long-run rail engine.
   This replaces the accumulated chart fixes with one deterministic model:
   - desktop chart starts when the chart's original layout position enters
     the lower reading field, then draws over a long scroll window while the
     panel is sticky;
   - mobile keeps the chart-in-viewport behavior;
   - the long-run answer rail uses the same base/fill/beam language and
     section-progress feel as the 03 Outcome quality seam.
   ===================================================================== */
(function(){
  const proof = document.getElementById('proof');
  const charts = Array.from(document.querySelectorAll('#proof .path-chart'));
  const calls = Array.from(document.querySelectorAll('.outcome-call-with-line'));
  if (!charts.length && !calls.length) return;

  const reduceQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const clamp01 = (n) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
  const vh = () => Math.max(1, window.innerHeight || document.documentElement.clientHeight || 1);
  const docTop = (el) => {
    let y = 0;
    let node = el;
    while (node) {
      y += node.offsetTop || 0;
      node = node.offsetParent;
    }
    return y;
  };
  const docBottom = (el) => docTop(el) + (el.offsetHeight || el.getBoundingClientRect().height || 0);
  const setImportant = (el, prop, value) => {
    if (el && el.style) el.style.setProperty(prop, value, 'important');
  };

  const prepareChart = (chart) => {
    const svg = chart.querySelector('svg');
    if (!svg) return;
    chart.dataset.rsLayoutTop = String(docTop(chart));
    svg.querySelectorAll('path[stroke^="url("], path[data-line]').forEach((path) => {
      path.setAttribute('data-line', '');
      let len = Number(path.dataset.rsV123Length || path.dataset.lineLength || 0);
      if (!len) {
        try { len = Math.max(1, path.getTotalLength()); }
        catch (e) { len = 1; }
      }
      path.dataset.rsV123Length = String(len);
      setImportant(path, 'stroke-dasharray', String(len));
      setImportant(path, 'stroke-dashoffset', String(len));
      path.style.setProperty('--rs-line-length', String(len));
      path.style.setProperty('--rs-line-offset', String(len));
    });
    svg.querySelectorAll('path[fill^="url("], path[data-chart-area]').forEach((path) => {
      path.setAttribute('data-chart-area', '');
      path.style.setProperty('--chart-area-clip', 'inset(0 100% 0 0)');
      path.style.setProperty('--chart-area-opacity', '0');
      setImportant(path, 'clip-path', 'inset(0 100% 0 0)');
      setImportant(path, 'opacity', '0');
    });
    svg.querySelectorAll('circle, [data-endpoint]').forEach((circle) => {
      circle.setAttribute('data-endpoint', '');
      circle.style.transformBox = 'fill-box';
      circle.style.transformOrigin = 'center';
      circle.style.setProperty('--chart-endpoint-opacity', '0');
      circle.style.setProperty('--chart-endpoint-scale', '.72');
      setImportant(circle, 'opacity', '0');
      setImportant(circle, 'transform', 'scale(.72)');
    });
    // v174: cache chart pieces once. Querying inside every scroll frame can
    // make mobile upward scroll feel lower quality, especially around the proof
    // section. The visual behavior is unchanged; only lookup work is reduced.
    chart._rsChartLines = Array.from(svg.querySelectorAll('[data-line]'));
    chart._rsChartAreas = Array.from(svg.querySelectorAll('[data-chart-area]'));
    chart._rsChartEndpoints = Array.from(svg.querySelectorAll('[data-endpoint]'));
  };

  const refreshChartLayoutTops = () => {
    charts.forEach((chart) => { chart.dataset.rsLayoutTop = String(docTop(chart)); });
  };

  charts.forEach(prepareChart);

  const desktopChartProgress = (chart) => {
    const height = vh();
    const chartTop = Number(chart.dataset.rsLayoutTop || docTop(chart));
    // v131: desktop must mirror the mobile Benchmark lens chart draw.
    // The chart is inside a sticky proof panel on wide screens, so use its
    // original document position but the same lower-to-upper viewport window.
    const start = chartTop - height * 0.92;
    const end = chartTop - height * 0.18;
    return clamp01((window.scrollY - start) / Math.max(1, end - start));
  };

  const mobileChartProgress = (chart) => {
    const rect = chart.getBoundingClientRect();
    const height = vh();
    const start = height * 0.92;
    const end = height * 0.18;
    return clamp01((start - rect.top) / Math.max(1, start - end));
  };

  const getChartProgress = (chart) => {
    if (window.innerWidth >= 1024) return desktopChartProgress(chart);
    return mobileChartProgress(chart);
  };

  const paintChart = (chart, raw, reduced) => {
    // v152: the Benchmark Lens chart is one-way per viewport visit. It never
    // visibly undraws while the chart remains on screen; after the chart fully
    // leaves the viewport, the next visit can build again from zero.
    const candidate = clamp01(raw);
    const previousMax = Number(chart.dataset.rsMaxChartProgress || 0) || 0;
    const p = Math.max(previousMax, candidate);
    chart.dataset.rsMaxChartProgress = String(p);
    const areaP = clamp01((p - 0.015) / 0.92);
    const endpointP = clamp01((p - 0.88) / 0.12);
    chart.style.setProperty('--chart-progress', p.toFixed(4), 'important');
    chart.style.setProperty('--chart-ready', p.toFixed(4), 'important');
    chart.style.setProperty('--chart-sweep', p.toFixed(4), 'important');

    (chart._rsChartLines || chart.querySelectorAll('[data-line]')).forEach((path) => {
      const len = Number(path.dataset.rsV123Length || path.dataset.lineLength || 1) || 1;
      const offset = (1 - p) * len;
      path.style.setProperty('--rs-line-length', String(len));
      path.style.setProperty('--rs-line-offset', String(offset));
      setImportant(path, 'stroke-dasharray', String(len));
      setImportant(path, 'stroke-dashoffset', String(offset));
    });

    (chart._rsChartAreas || chart.querySelectorAll('[data-chart-area]')).forEach((path) => {
      const clip = `inset(0 ${(1 - areaP) * 100}% 0 0)`;
      const opacity = areaP <= 0 ? '0' : String(0.10 + areaP * 0.90);
      path.style.setProperty('--chart-area-clip', clip);
      path.style.setProperty('--chart-area-opacity', opacity);
      setImportant(path, 'clip-path', clip);
      setImportant(path, 'opacity', opacity);
    });

    (chart._rsChartEndpoints || chart.querySelectorAll('[data-endpoint]')).forEach((circle) => {
      const scale = 0.72 + endpointP * 0.28;
      const opacity = String(endpointP);
      circle.style.setProperty('--chart-endpoint-opacity', opacity);
      circle.style.setProperty('--chart-endpoint-scale', String(scale));
      setImportant(circle, 'opacity', opacity);
      setImportant(circle, 'transform', `scale(${scale})`);
    });
    chart.dataset.rsLastPaintedChartProgress = String(p);
  };

  const ensureCallRail = (call) => {
    let rail = call.querySelector('.outcome-call-rail');
    if (!rail) {
      rail = document.createElement('span');
      rail.className = 'outcome-call-rail chapter-seam-line';
      rail.setAttribute('aria-hidden', 'true');
      call.appendChild(rail);
    }
    rail.classList.add('chapter-seam-line');
    let fill = rail.querySelector('.outcome-call-rail-fill');
    if (!fill) {
      fill = document.createElement('span');
      fill.className = 'outcome-call-rail-fill chapter-seam-fill';
      rail.appendChild(fill);
    }
    fill.classList.add('chapter-seam-fill');
    let beam = rail.querySelector('.outcome-call-rail-beam');
    if (!beam) {
      beam = document.createElement('span');
      beam.className = 'outcome-call-rail-beam chapter-seam-beam';
      beam.setAttribute('aria-hidden', 'true');
      rail.appendChild(beam);
    }
    beam.classList.add('chapter-seam-beam');
  };
  calls.forEach(ensureCallRail);

  // v124: Make this rail the same component and scroll behavior as the
  // chapter-seam rail next to “03 Outcome quality.” We drive the same
  // --section-progress / --section-focus variables from the rail's viewport
  // entry, then let the shared chapter-seam CSS render the fill and beam.
  const callProgress = (call) => {
    const rail = call.querySelector('.outcome-call-rail') || call;
    const rect = rail.getBoundingClientRect();
    const height = vh();
    const start = height * 0.88;
    const end = height * 0.46;
    return clamp01((start - rect.top) / Math.max(1, start - end));
  };

  const paintCall = (call, raw, reduced) => {
    const p = clamp01(raw);
    call.style.setProperty('--section-progress', p.toFixed(4));
    call.style.setProperty('--section-focus', clamp01(p * 1.35).toFixed(4));
    call.style.setProperty('--outcome-call-line-progress', p.toFixed(4));
    call.style.setProperty('--outcome-call-seam-progress', clamp01(0.14 + p * 3.44).toFixed(4));
    const fill = call.querySelector('.outcome-call-rail-fill');
    const beam = call.querySelector('.outcome-call-rail-beam');
    if (fill) {
      fill.style.removeProperty('transform');
      fill.style.removeProperty('opacity');
    }
    if (beam) {
      beam.style.removeProperty('transform');
      beam.style.removeProperty('opacity');
    }
  };

  let ticking = false;
  const chartVisitProgress = (chart) => {
    /*
      v152: Benchmark Lens chart replay model.
      - The visible chart never undraws/reverses.
      - While any part of the chart is on screen, progress can only increase.
      - If the visitor scrolls past the chart, it stays complete while offscreen
        above, so scrolling upward never reveals a reverse draw.
      - It resets only when it is fully below the viewport again, allowing the
        next downward pass from above the section to replay from zero.
    */
    const rect = chart.getBoundingClientRect();
    const height = vh();
    const visible = rect.bottom > 0 && rect.top < height;
    let maxProgress = Number(chart.dataset.rsMaxChartProgress || 0) || 0;

    if (!visible) {
      if (rect.top >= height) {
        maxProgress = 0;
        chart.dataset.rsChartState = 'before';
      } else if (rect.bottom <= 0) {
        maxProgress = Math.max(maxProgress, 1);
        chart.dataset.rsChartState = 'after';
      }
      chart.dataset.rsMaxChartProgress = String(maxProgress);
      return maxProgress;
    }

    const candidate = getChartProgress(chart);
    const next = Math.max(maxProgress, candidate);
    chart.dataset.rsChartState = 'visible';
    chart.dataset.rsMaxChartProgress = String(next);
    return next;
  };
  const update = () => {
    ticking = false;
    const reduced = !!(reduceQuery && reduceQuery.matches);
    if (window.RSSyncScrollDirection) window.RSSyncScrollDirection();
    charts.forEach((chart) => {
      const progress = chartVisitProgress(chart);
      const last = Number(chart.dataset.rsLastPaintedChartProgress);
      if (!Number.isFinite(last) || Math.abs(progress - last) > 0.0008) {
        paintChart(chart, progress, reduced);
      }
    });
    // v172: final universal rail engine owns rail painting; avoid duplicate writes.
    // calls.forEach((call) => paintCall(call, callProgress(call), reduced));
  };
  const request = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  };
  const relayout = () => {
    refreshChartLayoutTops();
    request();
  };

  window.addEventListener('scroll', request, { passive:true });
  window.addEventListener('resize', () => { if (window.RSShouldSkipMobileResizeRefresh && window.RSShouldSkipMobileResizeRefresh()) return; relayout(); });
  window.addEventListener('orientationchange', relayout);
  window.addEventListener('load', relayout, { once:true });
  window.addEventListener('pageshow', relayout);
  document.addEventListener('rs:gate-unlocked', relayout);
  document.addEventListener('rs:scrollfx-refresh', relayout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => window.RSRunAfterMobileScrollSettles ? window.RSRunAfterMobileScrollSettles(relayout) : relayout()).catch(() => {});
  if (reduceQuery && reduceQuery.addEventListener) reduceQuery.addEventListener('change', request);
  [0,120,360,900].forEach((delay) => window.setTimeout(relayout, delay));
  request();
})();

/* =====================================================================
   v172 — duplicate rail-engine cleanup.
   The final universal rail engine below owns the long-run, proof, and Next Step
   rails. Older rail-only repaint engines were removed to reduce mobile scroll
   frame work without changing the approved visual behavior.
   ===================================================================== */

/* =====================================================================
   v126b — universal rail parity engine.
   Restores the moving rail beside “03 Outcome quality” and gives the long-run
   treasury answer line the exact same viewport-progress behavior on desktop
   and mobile. Runs last to override older accumulated rail patches.
   ===================================================================== */
(function(){
  const clamp01 = (value) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  const reduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const setImportant = (el, prop, value) => { if (el && el.style) el.style.setProperty(prop, value, 'important'); };

  const buildTargets = () => {
    const targets = [];
    const proof = document.querySelector('#proof .chapter-seam-light');
    if (proof) targets.push({
      root: proof,
      line: proof.querySelector('.chapter-seam-line'),
      fill: proof.querySelector('.chapter-seam-fill'),
      beam: proof.querySelector('.chapter-seam-beam')
    });
    document.querySelectorAll('.outcome-call-with-line').forEach((call) => {
      targets.push({
        root: call,
        line: call.querySelector('.outcome-call-rail, .chapter-seam-line'),
        fill: call.querySelector('.outcome-call-rail-fill, .chapter-seam-fill'),
        beam: call.querySelector('.outcome-call-rail-beam, .chapter-seam-beam')
      });
    });
    document.querySelectorAll('.outcome-call-equal-seam .outcome-call-chapter-seam').forEach((seam) => {
      targets.push({
        root: seam,
        line: seam.querySelector('.chapter-seam-line'),
        fill: seam.querySelector('.chapter-seam-fill'),
        beam: seam.querySelector('.chapter-seam-beam')
      });
    });
    document.querySelectorAll('.next-step-scroll-rule').forEach((rail) => {
      targets.push({
        root: rail,
        line: rail,
        fill: rail.querySelector('.next-step-scroll-rule-fill'),
        beam: rail.querySelector('.next-step-scroll-rule-beam')
      });
    });
    return targets.filter((target) => target.root && target.line && target.fill && target.beam);
  };

  let targets = buildTargets();
  if (!targets.length) return;

  const progressFromLine = (line) => {
    const rect = line.getBoundingClientRect();
    const height = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 1);
    const y = rect.top + rect.height * 0.5;
    const start = height * 0.88;
    const end = height * 0.56;
    return clamp01((start - y) / Math.max(1, start - end));
  };

  const paint = () => {
    ticking = false;
    if (window.RSSyncScrollDirection) window.RSSyncScrollDirection();
    if (!targets.length) targets = buildTargets();
    const reduced = !!(reduce && reduce.matches);
    targets.forEach(({root,line,fill,beam}) => {
      const raw = progressFromLine(line);
      const p = clamp01(0.14 + raw * 0.86);
      const last = Number(root.dataset.rsLastLiveSeamProgress);
      if (Number.isFinite(last) && Math.abs(p - last) <= 0.0008) return;
      root.dataset.rsLastLiveSeamProgress = String(p);
      root.style.setProperty('--section-progress', raw.toFixed(4), 'important');
      root.style.setProperty('--section-focus', clamp01(raw * 1.35).toFixed(4), 'important');
      root.style.setProperty('--chapter-seam-progress', p.toFixed(4), 'important');
      root.style.setProperty('--rs-live-seam-progress', p.toFixed(4), 'important');
      root.style.setProperty('--outcome-call-line-progress', p.toFixed(4), 'important');
      root.style.setProperty('--outcome-call-seam-progress', p.toFixed(4), 'important');
      setImportant(fill, 'transform', `scaleX(${p})`);
      setImportant(fill, 'opacity', String(0.18 + p * 0.78));
      setImportant(beam, 'transform', `translate3d(${-120 + p * 220}%,0,0) skewX(-18deg)`);
      setImportant(beam, 'opacity', String(0.10 + p * 0.62));
    });
  };

  let ticking = false;
  const request = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(paint);
  };
  const refresh = () => { targets = buildTargets(); request(); };

  window.addEventListener('scroll', request, { passive:true });
  window.addEventListener('resize', () => { if (window.RSShouldSkipMobileResizeRefresh && window.RSShouldSkipMobileResizeRefresh()) return; refresh(); });
  window.addEventListener('orientationchange', refresh);
  window.addEventListener('load', refresh, { once:true });
  window.addEventListener('pageshow', refresh);
  document.addEventListener('rs:gate-unlocked', refresh);
  document.addEventListener('rs:scrollfx-refresh', refresh);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => window.RSRunAfterMobileScrollSettles ? window.RSRunAfterMobileScrollSettles(refresh) : refresh()).catch(() => {});
  if (reduce && reduce.addEventListener) reduce.addEventListener('change', request);
  [0,80,220,520,980].forEach((delay) => window.setTimeout(refresh, delay));
  request();
})();


/* =====================================================================
   v130 — desktop rail parity correction.
   The two editorial rails remain scroll-scrubbed under desktop reduced-motion
   environments. Reduced motion removes timed transitions elsewhere; it must not
   pin these scroll-position indicators to 100% on desktop.
   ===================================================================== */

