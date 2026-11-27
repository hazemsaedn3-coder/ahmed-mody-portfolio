(() => {
  'use strict';
  const { work, partners } = window.PORTFOLIO;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const h = (tag, attrs = {}, html = '') => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') el.className = v; else if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else el.setAttribute(k, v);
    }
    if (html) el.innerHTML = html;
    return el;
  };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const SECTIONS = [
    { id: 'nightlife', title: 'Nightlife & Events', short: 'Nightlife', idx: '01 / 07', desc: 'Party nights, Eid concerts and offers for hotels, lounges and beach resorts.' },
    { id: 'food', title: 'Food & Drink', short: 'Food & Drink', idx: '02 / 07', desc: 'Product shots, promos and brand identity for cafés and restaurants.' },
    { id: 'beauty', title: 'Beauty & Fashion', short: 'Beauty', idx: '03 / 07', desc: 'Campaign visuals and brand boards for skincare and apparel.' },
    { id: 'music', title: 'Music & Media', short: 'Music', idx: '04 / 07', desc: 'Release artwork, streaming promos and live-show visuals.' },
    { id: 'product', title: 'Product & Industrial', short: 'Product', idx: '05 / 07', desc: 'Product ad campaigns for manufacturers.' },
    { id: 'ads', title: 'Ads & Announcements', short: 'Ads', idx: '06 / 07', desc: 'Hiring and promo ads.' },
  ];
  const SEC = Object.fromEntries([...SECTIONS, { id: 'web', title: 'Websites', short: 'Websites' }].map(s => [s.id, s]));
  const byId = Object.fromEntries(work.map(w => [w.id, w]));
  const partnerByClient = Object.fromEntries(partners.map(p => [p.client, p]));
  const social = work.filter(w => w.section !== 'web');

  const format = w => {
    const r = w.w / w.h;
    if (w.section === 'web') return r > 1 ? 'Website · desktop' : 'Website · mobile';
    if (Math.abs(r - 1) < 0.06) return 'Square post · 1:1';
    if (Math.abs(r - 0.8) < 0.03) return 'Portrait post · 4:5';
    if (Math.abs(r - 0.75) < 0.03) return 'Portrait · 3:4';
    if (Math.abs(r - 0.707) < 0.02) return 'Poster · A-size';
    if (Math.abs(r - 0.5625) < 0.03) return 'Story / Reel · 9:16';
    if (Math.abs(r - 1.778) < 0.05) return 'Landscape · 16:9';
    return r < 1 ? 'Portrait post' : 'Landscape';
  };
  const thumb = id => `assets/thumb/${id}.webp`;
  const full = id => `assets/work/${id}.webp`;

  /* ---------- Navigation ---------- */
  const navItems = [...SECTIONS.map(s => [s.id, s.short]), ['web', 'Websites'], ['partners', 'Partners'], ['contact', 'Contact']];
  const nav = $('#nav'), rail = $('#rail');
  navItems.forEach(([id, label]) => {
    nav.append(h('a', { href: '#' + id, 'data-id': id }, esc(label)));
    rail.append(h('a', { href: '#' + id, 'data-id': id }, `<span>${esc(label)}</span>`));
  });

  /* ---------- Hero ---------- */
  const stats = [
    [social.length, 'social designs', '#nightlife'],
    [partners.length, 'partner brands', '#partners'],
    ['7', 'categories', '#nightlife'],
  ];
  stats.forEach(([n, l, href]) => $('#stats').append(h('a', { class: 'stat', href, style: 'text-decoration:none' }, `<b>${n}</b><small>${l}</small>`)));

  const stack = $('#heroStack');
  const featured = [
    { id: 'w03', x: 2, y: 30, w: 34, r: -9 },
    { id: 'w26', x: 58, y: 4, w: 34, r: 7 },
    { id: 'w32', x: 64, y: 50, w: 32, r: 10 },
    { id: 'w02', x: 6, y: 2, w: 30, r: -4 },
    { id: 'w01', x: 28, y: 14, w: 42, r: 0 },
  ];
  featured.forEach((f, i) => {
    const w = byId[f.id];
    const b = h('button', { 'aria-label': `Open ${w.title}`, style: `left:${f.x}%;top:${f.y}%;width:${f.w}%;aspect-ratio:${w.w}/${w.h};z-index:${i + 1}` },
      `<img src="${thumb(w.id)}" alt="${esc(w.title)}" width="${w.w}" height="${w.h}">`);
    b.dataset.r = f.r;
    b.style.transform = `rotate(${f.r}deg)`;
    b.addEventListener('click', () => openViewer(f.id, featured.map(x => x.id)));
    stack.append(b);
  });
  if (matchMedia('(hover:hover)').matches) {
    stack.addEventListener('pointermove', e => {
      const r = stack.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width - .5, dy = (e.clientY - r.top) / r.height - .5;
      $$('button', stack).forEach((b, i) => {
        const d = (i + 1) * 6;
        b.style.transform = `translate(${dx * d}px,${dy * d}px) rotate(${b.dataset.r}deg) rotateY(${dx * 8}deg) rotateX(${-dy * 8}deg)`;
      });
    });
    stack.addEventListener('pointerleave', () => $$('button', stack).forEach(b => b.style.transform = `rotate(${b.dataset.r}deg)`));
  }

  /* ---------- Sections ---------- */
  const host = $('#sections');
  const cardObserver = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); cardObserver.unobserve(e.target); } }), { rootMargin: '0px 0px -40px 0px' });

  const makeCard = w => {
    const c = h('button', { class: 'card reveal', 'data-id': w.id, 'data-client': w.client, 'aria-label': `${w.title}, ${w.client}. Open to zoom.` },
      `<div class="ph"><img src="${thumb(w.id)}" alt="${esc(w.title)} for ${esc(w.client)}" width="${w.w}" height="${w.h}" loading="lazy"></div>
       <span class="fmt">${esc(format(w))}</span><span class="zoom">⤢</span>
       <div class="cap"><b>${esc(w.title)}</b><span>${esc(w.client)}</span></div>`);
    const img = $('img', c);
    const done = () => img.classList.add('ld');
    img.complete ? done() : img.addEventListener('load', done, { once: true });
    cardObserver.observe(c);
    return c;
  };

  SECTIONS.forEach(s => {
    const items = work.filter(w => w.section === s.id);
    const sec = h('section', { class: 'block', id: s.id, 'data-title': s.title });
    sec.append(h('div', { class: 'block-head' }, `<span class="idx">${s.idx}</span><h2>${esc(s.title)}</h2><p>${esc(s.desc)} <span style="color:var(--dim)">· ${items.length} design${items.length > 1 ? 's' : ''}</span></p>`));
    const clients = [...new Set(items.map(w => w.client))];
    const grid = h('div', { class: 'grid' });
    if (clients.length > 2) {
      const chips = h('div', { class: 'chips', role: 'toolbar', 'aria-label': 'Filter by client' });
      const counts = c => items.filter(w => w.client === c).length;
      const opts = [['all', 'All', items.length], ...clients.sort((a, b) => counts(b) - counts(a)).map(c => [c, c, counts(c)])];
      opts.forEach(([val, label, n]) => {
        const b = h('button', { 'data-val': val, class: val === 'all' ? 'on' : '' }, `${esc(label)}<span class="n">${n}</span>`);
        b.addEventListener('click', () => {
          $$('button', chips).forEach(x => x.classList.toggle('on', x === b));
          $$('.card', grid).forEach(card => card.classList.toggle('hide', val !== 'all' && card.dataset.client !== val));
        });
        chips.append(b);
      });
      sec.append(chips);
    }
    items.forEach(w => grid.append(makeCard(w)));
    grid.addEventListener('click', e => {
      const card = e.target.closest('.card'); if (!card) return;
      const list = $$('.card:not(.hide)', grid).map(c => c.dataset.id);
      openViewer(card.dataset.id, list);
    });
    sec.append(grid);
    host.append(sec);
  });

  /* ---------- Website case ---------- */
  $$('[data-open]').forEach(el => el.addEventListener('click', e => {
    if (e.target.closest('.pin')) return;
    openViewer(el.dataset.open, ['w45', 'w46']);
  }));
  $$('.pin').forEach(p => p.addEventListener('click', e => {
    e.stopPropagation();
    $$('.pin').forEach(x => x.classList.toggle('on', x === p));
    $('#pinNote').innerHTML = `<b style="color:var(--gold)">${p.textContent.trim()}.</b> ${esc(p.dataset.pin)}`;
  }));

  /* ---------- Partners ---------- */
  const logos = $('#logos');
  partners.forEach(p => {
    const n = work.filter(w => w.client === p.client).length;
    const b = h('button', { class: 'logo reveal', 'aria-label': `${p.name}: ${n} designs` },
      `<div class="lw"><img src="assets/logos/${p.id}.webp" alt="${esc(p.name)} logo" loading="lazy"></div><small>${esc(p.name)}</small><em>${n} design${n > 1 ? 's' : ''}</em>`);
    b.addEventListener('click', () => openSheet(p.client));
    cardObserver.observe(b);
    logos.append(b);
  });

  /* ---------- Client sheet ---------- */
  const sheet = $('#sheet');
  function openSheet(client) {
    const items = work.filter(w => w.client === client);
    const p = partnerByClient[client];
    $('#sheetLogo').style.display = p ? '' : 'none';
    if (p) $('#sheetLogo').src = `assets/logos/${p.id}.webp`;
    $('#sheetName').textContent = p ? p.name : client;
    $('#sheetCount').textContent = `${items.length} design${items.length > 1 ? 's' : ''} · ${[...new Set(items.map(w => SEC[w.section].title))].join(', ')}`;
    const g = $('#sheetGrid'); g.innerHTML = '';
    items.forEach(w => {
      const b = h('button', {}, `<img src="${thumb(w.id)}" alt="" loading="lazy"><span>${esc(w.title)}</span>`);
      b.addEventListener('click', () => { closeSheet(); openViewer(w.id, items.map(x => x.id)); });
      g.append(b);
    });
    sheet.hidden = false; document.body.classList.add('locked');
    $('#sheetClose').focus();
  }
  function closeSheet() { sheet.hidden = true; if (viewer.hidden) document.body.classList.remove('locked'); }
  $('#sheetClose').addEventListener('click', closeSheet);
  sheet.addEventListener('click', e => { if (e.target === sheet) closeSheet(); });

  /* ---------- Viewer with zoom / pan ---------- */
  const viewer = $('#viewer'), stage = $('#vStage'), canvas = $('#vCanvas'), vImg = $('#vImg');
  let list = [], idx = 0, cur = null, lastFocus = null;
  const Z = { s: 1, tx: 0, ty: 0, fw: 0, fh: 0, max: 5 };

  function layout() {
    if (!cur) return;
    const SW = stage.clientWidth, SH = stage.clientHeight, pad = SW < 600 ? 12 : 36;
    const k = Math.min((SW - pad * 2) / cur.w, (SH - pad * 2) / cur.h);
    Z.fw = cur.w * k; Z.fh = cur.h * k;
    canvas.style.width = Z.fw + 'px'; canvas.style.height = Z.fh + 'px';
    Z.max = Math.max(3, Math.min(8, (cur.w / Z.fw) * 2.2));
    reset(false);
  }
  function apply(anim) {
    canvas.classList.toggle('anim', !!anim);
    canvas.style.transform = `translate3d(${Z.tx}px,${Z.ty}px,0) scale(${Z.s})`;
    $('#zLevel').textContent = Math.round(Z.s * 100) + '%';
    viewer.classList.toggle('zoomed', Z.s > 1.02);
  }
  function clamp() {
    const SW = stage.clientWidth, SH = stage.clientHeight, w = Z.fw * Z.s, hh = Z.fh * Z.s;
    Z.tx = w <= SW ? (SW - w) / 2 : Math.min(0, Math.max(SW - w, Z.tx));
    Z.ty = hh <= SH ? (SH - hh) / 2 : Math.min(0, Math.max(SH - hh, Z.ty));
  }
  function zoomAt(px, py, ns, anim) {
    ns = Math.max(1, Math.min(Z.max, ns));
    Z.tx = px - (px - Z.tx) * (ns / Z.s);
    Z.ty = py - (py - Z.ty) * (ns / Z.s);
    Z.s = ns; clamp(); apply(anim);
  }
  function reset(anim = true) { Z.s = 1; Z.tx = 0; Z.ty = 0; clamp(); apply(anim); }
  const center = () => [stage.clientWidth / 2, stage.clientHeight / 2];
  function zoomToPoint(fx, fy, ns) { // fx/fy fraction of image
    Z.s = 1; clamp();
    const SW = stage.clientWidth, SH = stage.clientHeight;
    ns = Math.min(Z.max, ns);
    Z.s = ns; Z.tx = SW / 2 - fx * Z.fw * ns; Z.ty = SH / 2 - fy * Z.fh * ns;
    clamp(); apply(true);
  }

  const preload = id => { if (id) { const i = new Image(); i.src = full(id); } };
  function show(i) {
    idx = (i + list.length) % list.length;
    cur = byId[list[idx]];
    $('#vLoading').classList.add('on');
    vImg.src = thumb(cur.id);
    vImg.alt = `${cur.title} for ${cur.client}`;
    const hi = new Image();
    hi.onload = () => { if (cur && hi.src.endsWith(full(cur.id))) { vImg.src = hi.src; $('#vLoading').classList.remove('on'); } };
    hi.src = full(cur.id);
    layout();
    $('#vCount').textContent = innerWidth < 600 ? `${idx + 1} / ${list.length}` : `${idx + 1} / ${list.length} · ${SEC[cur.section].title}`;
    $('#vPrev').style.display = $('#vNext').style.display = list.length > 1 ? '' : 'none';
    renderInfo();
    renderSpots();
    preload(list[(idx + 1) % list.length]); preload(list[(idx - 1 + list.length) % list.length]);
    history.replaceState(null, '', '#view-' + cur.id);
  }

  function renderSpots() {
    const sp = $('#vSpots'); sp.innerHTML = '';
    const spots = cur.section === 'web'
      ? (cur.w > cur.h ? [[22, 46, 'Hero & headline'], [70, 52, '3D tilt hero'], [88, 9, 'Navigation']] : [[50, 22, 'Hero & headline'], [50, 70, 'Product & call to action']])
      : [[50, 16, 'Headline & branding'], [50, 52, 'Key visual'], [50, 86, 'Details & info']];
    spots.forEach(([x, y, label], n) => {
      const b = h('button', { class: 'v-spot', style: `left:${x}%;top:${y}%`, 'aria-label': `Zoom into ${label}` }, `<i>${n + 1}</i><span>${esc(label)}</span>`);
      b.addEventListener('pointerdown', e => e.stopPropagation());
      b.addEventListener('click', e => { e.stopPropagation(); zoomToPoint(x / 100, y / 100, Math.min(Z.max, 2.6)); });
      sp.append(b);
    });
  }

  function renderInfo() {
    const w = cur, p = partnerByClient[w.client];
    $('#vSec').textContent = SEC[w.section].title;
    $('#vTitle').textContent = w.title;
    $('#vClient').textContent = w.client;
    const f = $('#vFacts'); f.innerHTML = '';
    const fact = (k, v, fn) => {
      const el = h(fn ? 'button' : 'div', { class: 'fact' }, `<span class="k">${k}</span><span class="v">${esc(v)}</span>`);
      if (fn) el.addEventListener('click', fn);
      f.append(el);
    };
    fact('Client', p ? p.name : w.client, () => { closeViewer(); openSheet(w.client); });
    fact('Category', SEC[w.section].title, () => { closeViewer(); document.getElementById(w.section).scrollIntoView({ behavior: 'smooth' }); });
    fact('Format', format(w));
    fact('Inspect', 'Zoom to details', () => zoomToPoint(.5, .86, 2.6));
    const same = work.filter(x => x.client === w.client);
    const pool = same.length > 1 ? same : work.filter(x => x.section === w.section);
    $('#vMoreLabel').textContent = same.length > 1 ? `More for ${p ? p.name : w.client}` : `More in ${SEC[w.section].title}`;
    const strip = $('#vMore'); strip.innerHTML = '';
    pool.slice(0, 15).forEach(x => {
      const b = h('button', { class: x.id === w.id ? 'cur' : '', 'aria-label': x.title }, `<img src="${thumb(x.id)}" alt="" loading="lazy">`);
      b.addEventListener('click', () => { list = pool.map(y => y.id); show(list.indexOf(x.id)); });
      strip.append(b);
    });
  }

  function openViewer(id, ids) {
    lastFocus = document.activeElement;
    list = ids && ids.length ? ids : [id];
    viewer.hidden = false; document.body.classList.add('locked');
    if (innerWidth < 900) viewer.classList.add('noinfo');
    show(Math.max(0, list.indexOf(id)));
    $('#vClose').focus({ preventScroll: true });
  }
  function closeViewer() {
    viewer.hidden = true; cur = null;
    if (sheet.hidden) document.body.classList.remove('locked');
    history.replaceState(null, '', location.pathname + location.search);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  $('#vClose').addEventListener('click', closeViewer);
  $('#vPrev').addEventListener('click', () => show(idx - 1));
  $('#vNext').addEventListener('click', () => show(idx + 1));
  $('#zIn').addEventListener('click', () => zoomAt(...center(), Z.s * 1.5, true));
  $('#zOut').addEventListener('click', () => zoomAt(...center(), Z.s / 1.5, true));
  $('#zLevel').addEventListener('click', () => reset());
  $('#vInfoBtn').addEventListener('click', () => { viewer.classList.toggle('noinfo'); requestAnimationFrame(layout); });
  addEventListener('resize', () => { if (!viewer.hidden) layout(); });

  stage.addEventListener('wheel', e => {
    e.preventDefault();
    const r = stage.getBoundingClientRect();
    const k = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0018));
    zoomAt(e.clientX - r.left, e.clientY - r.top, Z.s * k);
  }, { passive: false });

  // Pointer gestures: drag, pinch, swipe, double-tap
  const pts = new Map();
  let g = null, lastTap = 0, lastTapXY = [0, 0];
  const rel = e => { const r = stage.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  stage.addEventListener('pointerdown', e => {
    if (e.target.closest('.v-nav')) return;
    stage.setPointerCapture(e.pointerId);
    pts.set(e.pointerId, rel(e));
    canvas.classList.remove('anim');
    if (pts.size === 1) { const [x, y] = rel(e); g = { mode: 'pan', x0: x, y0: y, lx: x, ly: y, t0: performance.now(), moved: 0 }; stage.classList.add('drag'); }
    if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      g = { mode: 'pinch', d: Math.hypot(a[0] - b[0], a[1] - b[1]), m: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], moved: 99 };
    }
  });
  stage.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId) || !g) return;
    pts.set(e.pointerId, rel(e));
    if (g.mode === 'pinch' && pts.size >= 2) {
      const [a, b] = [...pts.values()];
      const d = Math.hypot(a[0] - b[0], a[1] - b[1]), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      Z.tx += m[0] - g.m[0]; Z.ty += m[1] - g.m[1];
      zoomAt(m[0], m[1], Z.s * d / g.d);
      g.d = d; g.m = m;
    } else if (g.mode === 'pan') {
      const [x, y] = rel(e);
      g.moved = Math.max(g.moved, Math.hypot(x - g.x0, y - g.y0));
      if (Z.s > 1.01) { Z.tx += x - g.lx; Z.ty += y - g.ly; clamp(); apply(false); }
      else { canvas.style.transform = `translate3d(${Z.tx + (x - g.x0) * .6}px,${Z.ty}px,0) scale(1)`; }
      g.lx = x; g.ly = y;
    }
  });
  const end = e => {
    if (!pts.has(e.pointerId)) return;
    const [x, y] = pts.get(e.pointerId);
    pts.delete(e.pointerId);
    stage.classList.remove('drag');
    if (!g) return;
    if (g.mode === 'pinch') { if (pts.size === 1) { const [p] = [...pts.values()]; g = { mode: 'pan', x0: p[0], y0: p[1], lx: p[0], ly: p[1], moved: 99 }; } else g = null; if (Z.s < 1.02) reset(); return; }
    if (g.mode === 'pan') {
      const dx = x - g.x0;
      if (Z.s <= 1.01) {
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(y - g.y0) && list.length > 1) { show(idx + (dx < 0 ? 1 : -1)); }
        else apply(true);
      }
      if (g.moved < 8) { // tap
        const now = performance.now();
        if (now - lastTap < 320 && Math.hypot(x - lastTapXY[0], y - lastTapXY[1]) < 30) {
          Z.s > 1.05 ? reset() : zoomAt(x, y, Math.min(Z.max, 2.6), true);
          lastTap = 0;
        } else { lastTap = now; lastTapXY = [x, y]; }
      }
      g = null;
    }
  };
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);

  addEventListener('keydown', e => {
    if (!sheet.hidden && e.key === 'Escape') return closeSheet();
    if (viewer.hidden) return;
    const k = e.key;
    if (k === 'Escape') closeViewer();
    else if (k === 'ArrowRight') show(idx + 1);
    else if (k === 'ArrowLeft') show(idx - 1);
    else if (k === '+' || k === '=') zoomAt(...center(), Z.s * 1.5, true);
    else if (k === '-' || k === '_') zoomAt(...center(), Z.s / 1.5, true);
    else if (k === '0') reset();
    else if (k.toLowerCase() === 'i') $('#vInfoBtn').click();
    else if (k === 'Tab') { // simple focus trap
      const f = $$('button', viewer).filter(b => b.offsetParent !== null);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });

  /* ---------- Scroll: progress, topbar, scroll spy ---------- */
  const bar = $('#progress'), top = $('#topbar');
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = (max > 0 ? scrollY / max * 100 : 0) + '%';
    top.classList.toggle('scrolled', scrollY > 10);
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  const setActive = id => {
    $$('a[data-id]').forEach(a => a.classList.toggle('active', a.dataset.id === id));
    const a = $(`.nav a[data-id="${id}"]`);
    if (a) nav.scrollTo({ left: a.offsetLeft - nav.clientWidth / 2 + a.clientWidth / 2, behavior: 'smooth' });
  };
  const spy = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) setActive(e.target.id); });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('section[data-title]').forEach(s => spy.observe(s));
  new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setActive(''); }), { rootMargin: '-45% 0px -50% 0px' }).observe($('#top'));

  /* ---------- Deep link ---------- */
  const m = location.hash.match(/^#view-(w\d+)$/);
  if (m && byId[m[1]]) {
    const w = byId[m[1]];
    openViewer(w.id, work.filter(x => x.section === w.section).map(x => x.id));
  }
})();
