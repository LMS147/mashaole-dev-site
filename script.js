(function () {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- Mobile navigation ---------------- */
  const nav       = $('header nav');
  const hamburger = $('#hamburger');
  const navLinks  = $('#navLinks');
  const closeBtn  = $('#closeBtn');
  const overlay   = $('#navOverlay');

  function openMenu() {
    navLinks.classList.add('active');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('nav-open');
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add('show'));
    // move focus into the panel for keyboard users
    const first = navLinks.querySelector('a');
    if (first) first.focus({ preventScroll: true });
  }

  function closeMenu(returnFocus) {
    navLinks.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
    overlay.classList.remove('show');
    setTimeout(() => { overlay.hidden = true; }, 350);
    if (returnFocus) hamburger.focus({ preventScroll: true });
  }

  const isOpen = () => navLinks.classList.contains('active');

  hamburger.addEventListener('click', () => (isOpen() ? closeMenu(true) : openMenu()));
  closeBtn.addEventListener('click', () => closeMenu(true));
  overlay.addEventListener('click', () => closeMenu(false));
  $$('.nav-links a').forEach(a => a.addEventListener('click', () => closeMenu(false)));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen()) closeMenu(true);
    // simple focus trap while the drawer is open
    if (e.key === 'Tab' && isOpen()) {
      const items = [closeBtn, ...$$('.nav-links a')];
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // Close the drawer if the viewport grows past the mobile breakpoint
  window.matchMedia('(min-width: 861px)').addEventListener('change', e => {
    if (e.matches && isOpen()) closeMenu(false);
  });

  /* ---------------- Scroll: nav state, progress bar, active link ------------- */
  const progress = $('#scrollProgress');
  const sections = $$('main section[id]');
  const linkFor  = {};
  $$('.nav-links a[href^="#"]').forEach(a => { linkFor[a.getAttribute('href').slice(1)] = a; });

  let ticking = false;
  function onScroll() {
    const y = window.scrollY;

    nav.classList.toggle('scrolled', y > 20);

    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;

    // active nav link
    let current = '';
    const line = y + window.innerHeight * 0.35;
    sections.forEach(s => { if (s.offsetTop <= line) current = s.id; });
    Object.entries(linkFor).forEach(([id, a]) => a.classList.toggle('active', id === current));

    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---------------- Reveal on scroll ---------------- */
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    reveals.forEach(r => io.observe(r));
  } else {
    reveals.forEach(r => r.classList.add('visible'));
  }

  /* ---------------- Animated stat counters ---------------- */
  const stats = $$('.stat-num[data-count]');
  if ('IntersectionObserver' in window && !reduceMotion && stats.length) {
    const so = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el     = entry.target;
        const target = parseInt(el.dataset.count, 10);
        const suffix = el.dataset.suffix || '';
        const start  = performance.now();
        const dur    = 1100;

        (function step(now) {
          const p = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased) + suffix;
          if (p < 1) requestAnimationFrame(step);
        })(start);

        obs.unobserve(el);
      });
    }, { threshold: 0.5 });
    stats.forEach(s => so.observe(s));
  }

  /* ---------------- Custom cursor (fine pointers only) ---------------- */
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (finePointer && !reduceMotion) {
    const dot  = $('#cursor');
    const ring = $('#cursorRing');
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;
    let visible = false;

    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx - 3}px, ${my - 3}px)`;
      if (!visible) { visible = true; dot.style.opacity = '1'; ring.style.opacity = '.3'; }
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
      dot.style.opacity = '0'; ring.style.opacity = '0'; visible = false;
    });

    (function loop() {
      rx += (mx - rx) * 0.14;
      ry += (my - ry) * 0.14;
      ring.style.transform = `translate(${rx - 18}px, ${ry - 18}px)`;
      requestAnimationFrame(loop);
    })();

    // Grow on interactive elements — delegated so it survives DOM changes
    document.addEventListener('mouseover', e => {
      if (e.target.closest('a, button, .skill-card, .stat-item')) {
        dot.classList.add('is-hover'); ring.classList.add('is-hover');
      }
    });
    document.addEventListener('mouseout', e => {
      if (e.target.closest('a, button, .skill-card, .stat-item')) {
        dot.classList.remove('is-hover'); ring.classList.remove('is-hover');
      }
    });
  }

  /* ---------------- Cloudflare email-obfuscation fallback ----------------
     Cloudflare's Scrape Shield rewrites mailto links into
     `[email protected]` + a decoder script at /cdn-cgi/. If that script is
     blocked (ad-blocker, strict CSP, offline copy) the placeholder text is
     left on screen. This decodes it ourselves so the address always shows. */
  function cfDecode(hex) {
    const key = parseInt(hex.substr(0, 2), 16);
    let out = '';
    for (let i = 2; i < hex.length; i += 2) {
      out += String.fromCharCode(parseInt(hex.substr(i, 2), 16) ^ key);
    }
    try { return decodeURIComponent(escape(out)); } catch (e) { return out; }
  }

  function fixObfuscatedEmails() {
    // Placeholder spans/anchors carrying the encoded address
    $$('.__cf_email__[data-cfemail]').forEach(el => {
      const addr = cfDecode(el.dataset.cfemail);
      if (!addr) return;
      el.textContent = addr;
      el.classList.remove('__cf_email__');
      const link = el.closest('a');
      if (link) link.href = 'mailto:' + addr;
    });

    // Anchors whose href became /cdn-cgi/l/email-protection#<hex>
    $$('a[href*="/cdn-cgi/l/email-protection"]').forEach(a => {
      const hash = a.getAttribute('href').split('#')[1];
      if (!hash) return;
      const addr = cfDecode(hash);
      if (!addr) return;
      a.href = 'mailto:' + addr;
      const val = a.querySelector('.cl-value');
      if (val && /\[email\s*protected\]/i.test(val.textContent)) val.textContent = addr;
    });
  }
  fixObfuscatedEmails();
  // Cloudflare injects late on some setups — re-run once after load.
  window.addEventListener('load', () => setTimeout(fixObfuscatedEmails, 300));

  /* ---------------- Smooth anchor scroll with nav offset ---------------- */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id === '#' || id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - (nav.offsetHeight + 12);
      window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
      history.replaceState(null, '', id);
    });
  });

})();
