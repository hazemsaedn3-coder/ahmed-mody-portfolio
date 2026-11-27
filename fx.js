/* Visual effects: loader, theme toggle, live wallpaper, scroll motion, cursor */
(() => {
  'use strict';
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];

  /* ---------- Loader ---------- */
  const loader = $('#loader'), bar = $('#ldBar'), count = $('#ldCount');
  let seen = false;
  try { seen = sessionStorage.getItem('seenLoader') === '1'; sessionStorage.setItem('seenLoader', '1'); } catch (e) {}
  const minTime = reduce ? 0 : seen ? 1100 : 2400;
  let pageReady = document.readyState === 'complete';
  addEventListener('load', () => { pageReady = true; });
  const t0 = performance.now();
  const ease = t => 1 - Math.pow(1 - t, 3);
  function tickLoader(now) {
    const el = now - t0;
    let p = Math.min(1, el / minTime || 1);
    if (!pageReady && el < 5000) p = Math.min(p, 0.92);
    const v = Math.round(ease(p) * 100);
    bar.style.width = v + '%';
    count.textContent = String(v).padStart(3, '0');
    if (p >= 1 && (pageReady || el >= 5000)) return finishLoader();
    requestAnimationFrame(tickLoader);
  }
  function finishLoader() {
    loader.classList.add('done');
    setTimeout(() => {
      document.body.classList.remove('loading');
      document.body.classList.add('loaded');
    }, 450);
    setTimeout(() => loader.classList.add('gone'), 1500);
  }
  if (reduce) { loader.classList.add('gone'); document.body.classList.remove('loading'); document.body.classList.add('loaded'); }
  else requestAnimationFrame(tickLoader);

  /* ---------- Theme toggle ---------- */
  const toggle = $('#themeToggle');
  const setTheme = t => {
    root.setAttribute('data-theme', t);
    try { localStorage.setItem('theme', t); } catch (e) {}
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.content = t === 'light' ? '#f5f1e8' : '#0c0c0b';
    wallpaper.setTheme(t);
  };
  toggle.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    if (!document.startViewTransition || reduce) return setTheme(next);
    const r = toggle.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const vt = document.startViewTransition(() => setTheme(next));
    vt.ready.then(() => {
      root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
        { duration: 700, easing: 'cubic-bezier(.6,0,.2,1)', pseudoElement: '::view-transition-new(root)' });
    }).catch(() => {});
  });

  /* ---------- Live wallpaper ---------- */
  const wallpaper = (() => {
    const cv = document.createElement('canvas');
    cv.id = 'bgfx'; cv.setAttribute('aria-hidden', 'true');
    document.body.prepend(cv);
    const ctx = cv.getContext('2d');
    let W = 0, H = 0, dpr = 1, theme = root.getAttribute('data-theme') || 'dark';
    let mouse = { x: -9999, y: -9999 }, running = true, last = 0;
    const mobile = matchMedia('(max-width: 900px)').matches;
    const N = mobile ? 34 : 80;
    const parts = [];
    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 1.5);
      W = innerWidth; H = innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    addEventListener('resize', resize);
    for (let i = 0; i < N; i++) parts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25 - .05, r: Math.random() * 1.6 + .4, tw: Math.random() * Math.PI * 2 });
    addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) requestAnimationFrame(frame); });

    function orb(x, y, rad, color) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, color); g.addColorStop(1, color.replace(/[\d.]+\)$/, '0)'));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
    }

    function drawDark(t) {
      ctx.fillStyle = '#0c0c0b'; ctx.fillRect(0, 0, W, H);
      const sy = scrollY * 0.08;
      // drifting glow orbs
      ctx.globalCompositeOperation = 'lighter';
      orb(W * (.18 + .08 * Math.sin(t * .00011)), H * (.75 + .1 * Math.cos(t * .00013)) - sy % H * .2, Math.max(W, H) * .45, 'rgba(242,201,76,0.10)');
      orb(W * (.85 + .06 * Math.cos(t * .00009)), H * (.2 + .12 * Math.sin(t * .0001)), Math.max(W, H) * .35, 'rgba(217,120,33,0.08)');
      orb(W * (.55 + .2 * Math.sin(t * .00006)), H * (.5 + .2 * Math.cos(t * .00008)), Math.max(W, H) * .25, 'rgba(140,90,255,0.05)');
      ctx.globalCompositeOperation = 'source-over';
      // gold dust constellation
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy;
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
        if (d < 140) { p.x += dx / d * .8; p.y += dy / d * .8; }
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      }
      ctx.lineWidth = .6;
      for (let i = 0; i < parts.length; i++) {
        const a = parts[i];
        for (let j = i + 1; j < parts.length; j++) {
          const b = parts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 130) { ctx.strokeStyle = `rgba(242,201,76,${(1 - d / 130) * .16})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        }
      }
      for (const p of parts) {
        const tw = .55 + .45 * Math.sin(t * .002 + p.tw);
        ctx.fillStyle = `rgba(255,220,120,${.35 + .5 * tw})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (0.8 + tw * .5), 0, Math.PI * 2); ctx.fill();
      }
    }

    const blobs = [
      { c: 'rgba(247,215,116,0.55)', ax: .25, ay: .3, sx: .00011, sy: .00014, r: .55 },
      { c: 'rgba(255,186,140,0.45)', ax: .75, ay: .25, sx: .00009, sy: .00012, r: .5 },
      { c: 'rgba(245,190,200,0.40)', ax: .6, ay: .8, sx: .00013, sy: .0001, r: .5 },
      { c: 'rgba(190,215,240,0.45)', ax: .15, ay: .85, sx: .0001, sy: .00008, r: .45 },
    ];
    function drawLight(t) {
      ctx.fillStyle = '#f5f1e8'; ctx.fillRect(0, 0, W, H);
      const M = Math.max(W, H);
      for (const [i, b] of blobs.entries()) {
        const x = W * (b.ax + .18 * Math.sin(t * b.sx + i)), y = H * (b.ay + .18 * Math.cos(t * b.sy + i * 2)) - (scrollY * .05 * (i % 2 ? 1 : -1)) % H;
        orb(x, y, M * b.r, b.c);
      }
      // flowing contour lines
      const sy = scrollY * .15;
      ctx.lineWidth = 1;
      for (let k = 0; k < 7; k++) {
        ctx.strokeStyle = `rgba(166,124,0,${0.10 + k * 0.012})`;
        ctx.beginPath();
        const base = H * (.18 + k * .12) - sy % (H * .12);
        for (let x = -10; x <= W + 10; x += 14) {
          const y = base + Math.sin(x * .004 + t * .0006 + k * .7) * 28 + Math.sin(x * .011 - t * .0004 + k) * 10
            + (Math.abs(x - mouse.x) < 160 ? Math.cos((x - mouse.x) / 160 * Math.PI / 2) * -18 * Math.max(0, 1 - Math.abs(base - mouse.y) / 200) : 0);
          x === -10 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }

    function frame(t) {
      if (!running) return;
      if (t - last > 28) { // ~35fps is plenty for a background
        last = t;
        theme === 'light' ? drawLight(t) : drawDark(t);
      }
      if (!reduce) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    return { setTheme(t) { theme = t; last = 0; if (reduce) frame(performance.now()); } };
  })();

  /* ---------- Scroll-linked motion ---------- */
  const marquees = $$('.marquee').map(m => ({ el: m, track: m.querySelector('.mq-track'), speed: +m.dataset.speed || 1 }));
  const heroCopy = $('.hero-copy'), heroStack = $('#heroStack');
  let drift = 0, lastY = scrollY, vel = 0;
  function motion() {
    const y = scrollY;
    vel += ((y - lastY) - vel) * .1; lastY = y;
    drift += 0.6 + Math.abs(vel) * .4;
    for (const m of marquees) {
      const w = m.track.scrollWidth / 3 || 1;
      const x = ((drift + y * .5) * m.speed) % w;
      m.track.style.transform = `translate3d(${m.speed > 0 ? -x : -w - x}px,0,0) skewX(${Math.max(-8, Math.min(8, -vel * .3))}deg)`;
    }
    if (y < innerHeight * 1.2) {
      heroCopy.style.transform = `translate3d(0,${y * .22}px,0)`;
      heroCopy.style.opacity = Math.max(0, 1 - y / (innerHeight * .9));
      heroStack.style.transform = `translate3d(0,${y * -.12}px,0) scale(${1 - Math.min(y / 4000, .08)})`;
    }
    requestAnimationFrame(motion);
  }
  if (!reduce) requestAnimationFrame(motion);

  /* ---------- Custom cursor ---------- */
  if (matchMedia('(hover: hover) and (pointer: fine)').matches && !reduce) {
    const cur = $('#cursor'), viewer = $('#viewer'), sheetEl = $('#sheet');
    let tx = 0, ty = 0, cx = 0, cy = 0;
    addEventListener('pointermove', e => {
      tx = e.clientX; ty = e.clientY;
      const hot = e.target.closest && e.target.closest('.card, .hero-stack button, .device, .sheet-grid button, .v-strip button');
      cur.classList.toggle('big', !!hot);
      cur.classList.add('on');
    }, { passive: true });
    document.addEventListener('pointerleave', () => cur.classList.remove('on'));
    (function loop() {
      cx += (tx - cx) * .18; cy += (ty - cy) * .18;
      if (!viewer.hidden || !sheetEl.hidden) cur.classList.remove('big', 'on');
      cur.style.transform = `translate3d(${cx}px,${cy}px,0)`;
      requestAnimationFrame(loop);
    })();
  }
})();
