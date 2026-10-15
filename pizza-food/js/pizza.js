/* =========================================================
   PIZZA FOOD — moteur des pizzas
   - recettes déduites des vraies descriptions
   - pizzas SVG dessinées (héros, chargement)
   - pizzas photo découpées en 8 parts (cartes)
   - ingrédients qui s'envolent (canvas + physique)
   - proximité du curseur : les pizzas bougent et se découpent
   ========================================================= */
(() => {
  'use strict';

  const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  // Animations actives par défaut ; un bouton du pied de page permet de les couper
  const reduceMotion = (() => { try { return localStorage.getItem('pf-motion') === 'off'; } catch (e) { return false; } })();
  const CH = '#292a2c';

  /* ---------- Recettes ---------- */
  const KEYWORDS = [
    [/jambon/, 'ham'], [/champignon|forestiere/, 'mushroom'], [/olive/, 'olive'], [/anchois/, 'anchovy'],
    [/capres/, 'caper'], [/tomates/, 'tomato'], [/poivron/, 'pepper'], [/oignon/, 'onion'],
    [/lardon|bacon/, 'bacon'], [/oeuf|omelette/, 'egg'], [/pepperoni/, 'pepperoni'], [/viande hachee|steak|bolognaise/, 'beef'],
    [/\bthon\b/, 'tuna'], [/merguez/, 'merguez'], [/artichaut/, 'artichoke'], [/poulet|chicken|escalope|volaille/, 'chicken'],
    [/pommes de terre|galette/, 'potato'], [/raclette|reblochon|boursin|fromages|brie|bleu|camembert/, 'whitecheese'], [/chevre/, 'goat'],
    [/kebab|grec/, 'kebab'], [/chorizo/, 'chorizo'], [/ananas/, 'pineapple'], [/saumon/, 'salmon'],
    [/truffe|tartuffa/, 'truffle'], [/noix/, 'walnut'], [/tenders|crispy|nuggets/, 'tenders'], [/cheddar|cheese/, 'cheddar'],
    [/fruits de mer|crevette|calamar/, 'shrimp'], [/aubergine/, 'aubergine'], [/avocat|avocado/, 'avocado'], [/mais\b/, 'corn'],
    [/frites/, 'fries'], [/salade|crudites/, 'salad']
  ];

  const SAUCES = {
    tomato: { sauce: '#e8300c', cheese: '#ffc700', dark: '#b81f00' },
    cream: { sauce: '#fff1d6', cheese: '#f6e653', dark: '#e9d7b0' },
    bbq: { sauce: '#7a2410', cheese: '#ffc700', dark: '#4f1407' },
    curry: { sauce: '#f29a00', cheese: '#ffe27a', dark: '#c46f00' }
  };

  const CAT_BITS = {
    menuenfants: ['fries', 'cheddar', 'tenders'], menus: ['pepperoni', 'tenders', 'olive', 'fries'], menumidi: ['fries', 'salad', 'tomato', 'cheddar'],
    pates: ['basil', 'whitecheese', 'tomato', 'mushroom'], assiettes: ['fries', 'salad', 'tomato', 'kebab'], sandwichs: ['fries', 'salad', 'tomato', 'cheddar'],
    burgergourmands: ['sesame', 'salad', 'cheddar', 'tomato', 'bacon'], burgers: ['sesame', 'salad', 'cheddar', 'tomato'], hummers: ['sesame', 'cheddar', 'fries'],
    paninis: ['cheddar', 'fries', 'ham'], tacos: ['fries', 'cheddar', 'chili'], tex_mex: ['fries', 'chili', 'cheddar', 'tenders'],
    riz_crousty: ['corn', 'chili', 'tenders'], salades: ['salad', 'tomato', 'olive', 'corn'], desserts: ['choco', 'cream', 'mint', 'star'],
    glaces: ['cream', 'choco', 'star', 'ice'], boissons: ['bubble', 'ice', 'bubble', 'star']
  };

  function recipe(product) {
    const txt = norm(product.n + ' ' + (product.d || ''));
    let sauce = 'tomato';
    if (/creme fraiche/.test(txt)) sauce = 'cream';
    if (/sauce barbecue/.test(txt) && !/sauce tomate/.test(txt)) sauce = 'bbq';
    if (/sauce curry/.test(txt)) sauce = 'curry';
    const toppings = KEYWORDS.filter(([re]) => re.test(txt)).map(([, t]) => t).filter(t => t !== 'fries' && t !== 'salad');
    if (/miel/.test(txt)) toppings.push('honey');
    if (/origan|persil/.test(txt)) toppings.push('oregano');
    if (!toppings.filter(t => t !== 'honey' && t !== 'oregano').length) toppings.push('olive', 'basil');
    return { name: product.n, sauce, toppings };
  }
  function bitsFor(product) {
    if (product.cat && product.cat.pizza) {
      const r = recipe(product);
      return [...new Set(r.toppings.filter(t => DRAW[t]).concat(['cheese', 'basil']))];
    }
    const txt = norm(product.n + ' ' + (product.d || ''));
    const found = KEYWORDS.filter(([re]) => re.test(txt)).map(([, t]) => t).filter(t => DRAW[t]);
    const base = (product.cat && CAT_BITS[product.cat.id]) || ['cheese', 'tomato', 'basil'];
    return [...new Set(found.concat(base))].slice(0, 6);
  }

  /* ---------- Dessin des ingrédients sur canvas (particules) ---------- */
  const ring = (c, r, col, w) => { c.beginPath(); c.arc(0, 0, r, 0, 7); c.lineWidth = w; c.strokeStyle = col; c.stroke(); };
  const disc = (c, r, fill, stroke, w = 1.6) => { c.beginPath(); c.arc(0, 0, r, 0, 7); c.fillStyle = fill; c.fill(); if (stroke) { c.lineWidth = w; c.strokeStyle = stroke; c.stroke(); } };
  const blob = (c, pts, fill, stroke) => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fillStyle = fill; c.fill(); if (stroke) { c.lineWidth = 1.4; c.strokeStyle = stroke; c.stroke(); } };
  const rr = (c, x, y, w, h, r, fill, stroke) => { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); c.fillStyle = fill; c.fill(); if (stroke) { c.lineWidth = 1.4; c.strokeStyle = stroke; c.stroke(); } };
  const leaf = (c, col) => { c.beginPath(); c.moveTo(0, -12); c.bezierCurveTo(9, -6, 9, 6, 0, 12); c.bezierCurveTo(-9, 6, -9, -6, 0, -12); c.fillStyle = col; c.fill(); c.lineWidth = 1.6; c.strokeStyle = CH; c.stroke(); c.beginPath(); c.moveTo(0, -9); c.lineTo(0, 10); c.lineWidth = 1.2; c.stroke(); };

  const DRAW = {
    olive: c => { disc(c, 7, CH); disc(c, 2.8, '#ff4100'); },
    basil: c => leaf(c, '#1f8a4c'),
    mint: c => leaf(c, '#3fbf6f'),
    ham: c => rr(c, -8, -6.5, 16, 13, 3, '#fdbeba', '#e07c7c'),
    mushroom: c => { c.beginPath(); c.arc(0, 1, 9, Math.PI, 0); c.closePath(); c.fillStyle = '#fee3c1'; c.fill(); c.lineWidth = 1.6; c.strokeStyle = CH; c.stroke(); rr(c, -3, 1, 6, 8, 1, '#fee3c1', CH); },
    anchovy: c => blob(c, [[-11, 0], [0, -4], [11, 0], [0, 4]], '#8a7b6e', CH),
    caper: c => disc(c, 3.4, '#6f8f2c', CH, 1),
    tomato: c => { disc(c, 9, '#e8240b', CH, 1.5); disc(c, 6, '#ff6a3d'); c.fillStyle = '#ffc700'; [[-2.5, -1], [2.5, -1], [0, 2.5]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 1.4, 0, 7); c.fill(); }); },
    pepper: c => { c.beginPath(); c.arc(0, 6, 9, Math.PI * 1.1, Math.PI * 1.9); c.lineWidth = 4; c.lineCap = 'round'; c.strokeStyle = '#1f8a4c'; c.stroke(); },
    onion: c => { ring(c, 7, '#c0569a', 2.4); ring(c, 3.6, '#e9a0c8', 1.6); },
    bacon: c => rr(c, -6, -4, 12, 8, 2, '#ff8f7a', '#b3412a'),
    egg: c => { blob(c, [[-11, 0], [-6, -9], [4, -9], [11, -1], [6, 8], [-5, 9]], '#fff', CH); disc(c, 5, '#ff9d00', CH, 1.2); },
    pepperoni: c => { disc(c, 10, '#c41e00', '#7a1200'); c.fillStyle = '#ff6a3d'; [[-3, -3], [3.5, 1], [-1, 4]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 1.6, 0, 7); c.fill(); }); },
    beef: c => blob(c, [[-6, -3], [-2, -7], [4, -5], [6, 0], [2, 4], [-4, 3]], '#6b2a14', CH),
    tuna: c => blob(c, [[-7, -2], [-2, -6], [5, -5], [7, 0], [2, 4], [-5, 2]], '#f2c4a8', '#b98b6f'),
    merguez: c => rr(c, -10, -3.5, 20, 7, 3.5, '#8f1d0b', CH),
    artichoke: c => leaf(c, '#a3b53a'),
    chicken: c => blob(c, [[-8, -3], [-3, -8], [5, -7], [8, -1], [4, 5], [-5, 4]], '#f4d9a8', '#c48a3a'),
    potato: c => rr(c, -5, -5, 10, 10, 2, '#f6e653', '#c9a400'),
    whitecheese: c => blob(c, [[-8, -5], [8, -5], [5, 5], [-5, 5]], '#fff6d6', '#d6c08a'),
    goat: c => { disc(c, 8, '#fff', '#e0d6c5'); ring(c, 5, '#efe8dc', 1); },
    kebab: c => blob(c, [[-10, -1], [0, -5], [10, -1], [10, 2], [0, -2], [-10, 2]], '#9a4a1f', CH),
    chorizo: c => { disc(c, 7, '#b8250c', '#7a1200', 1.4); c.fillStyle = '#fdbeba'; c.beginPath(); c.arc(-2, -2, 1.3, 0, 7); c.arc(2.5, 2, 1.3, 0, 7); c.fill(); },
    pineapple: c => blob(c, [[0, -8], [8, 6], [-8, 6]], '#ffe14d', '#d4a800'),
    salmon: c => { blob(c, [[-10, -3], [0, -7], [10, -3], [10, 3], [0, -1], [-10, 3]], '#ff8a65', '#d65a35'); },
    truffle: c => { disc(c, 4.5, '#2a1a12'); },
    walnut: c => { c.beginPath(); c.ellipse(0, 0, 7, 5, 0, 0, 7); c.fillStyle = '#8a5a2b'; c.fill(); c.lineWidth = 1.2; c.strokeStyle = CH; c.stroke(); },
    tenders: c => rr(c, -9, -4, 18, 8, 4, '#d98a2b', CH),
    cheddar: c => rr(c, -5.5, -5.5, 11, 11, 1, '#ff9d00', '#c96f00'),
    cheese: c => { blob(c, [[-9, 6], [9, 6], [9, -2], [-9, -7]], '#ffc700', CH); c.fillStyle = '#e9a800'; c.beginPath(); c.arc(-3, 1, 2, 0, 7); c.arc(4, 3, 1.5, 0, 7); c.fill(); },
    shrimp: c => { c.beginPath(); c.arc(0, 0, 7, Math.PI * .2, Math.PI * 1.6); c.lineWidth = 5; c.lineCap = 'round'; c.strokeStyle = '#ff8a65'; c.stroke(); },
    aubergine: c => { c.beginPath(); c.ellipse(0, 0, 8, 6, 0, 0, 7); c.fillStyle = '#5b2a6e'; c.fill(); c.beginPath(); c.ellipse(0, 0, 5.5, 3.8, 0, 0, 7); c.fillStyle = '#e8d9a8'; c.fill(); },
    avocado: c => { c.beginPath(); c.ellipse(0, 0, 9, 6, 0, 0, 7); c.fillStyle = '#2f6b2a'; c.fill(); c.beginPath(); c.ellipse(0, 0, 7, 4.5, 0, 0, 7); c.fillStyle = '#c9e07a'; c.fill(); },
    corn: c => disc(c, 3.5, '#ffd23f', '#c99a00', 1),
    fries: c => { c.rotate(.3); rr(c, -2.5, -11, 5, 22, 1, '#ffd23f', '#c99a00'); },
    salad: c => { c.beginPath(); for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; c.lineTo(Math.cos(a) * (i % 2 ? 6 : 11), Math.sin(a) * (i % 2 ? 6 : 11)); } c.closePath(); c.fillStyle = '#58b947'; c.fill(); c.lineWidth = 1.2; c.strokeStyle = '#2f6b2a'; c.stroke(); },
    sesame: c => { c.beginPath(); c.ellipse(0, 0, 4, 2.2, 0, 0, 7); c.fillStyle = '#fee3c1'; c.fill(); c.lineWidth = 1; c.strokeStyle = CH; c.stroke(); },
    chili: c => { blob(c, [[-11, 3], [-4, 6], [6, 3], [11, -5], [8, -7], [3, -1], [-6, 1]], '#e8240b', CH); },
    choco: c => rr(c, -6, -6, 12, 12, 2, '#5a2d14', '#2a1408'),
    cream: c => { disc(c, 6, '#fff7e8', '#e9d7b0'); },
    bubble: c => { ring(c, 6, 'rgba(255,255,255,.95)', 2); },
    ice: c => rr(c, -6, -6, 12, 12, 3, 'rgba(210,240,255,.9)', '#7fb8d8'),
    star: c => { c.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 4.5 : 11; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fillStyle = '#ffc700'; c.fill(); c.lineWidth = 1.4; c.strokeStyle = CH; c.stroke(); },
    honey: c => { c.beginPath(); c.moveTo(0, -8); c.bezierCurveTo(7, 0, 6, 8, 0, 8); c.bezierCurveTo(-6, 8, -7, 0, 0, -8); c.fillStyle = '#f6b100'; c.fill(); },
    oregano: c => disc(c, 2.2, '#1f8a4c')
  };

  /* ---------- Système de particules ---------- */
  const canvas = document.createElement('canvas');
  canvas.className = 'fx';
  canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d');
  let parts = [], running = false, dpr = 1;
  function sizeCanvas() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + 'px'; canvas.style.height = innerHeight + 'px';
  }
  function burst(x, y, types, opts = {}) {
    if (reduceMotion || !types || !types.length) return;
    ensureCanvas();
    const n = opts.count || 18, power = opts.power || 9, spread = opts.radius || 0;
    for (let i = 0; i < n && parts.length < 420; i++) {
      const a = Math.random() * Math.PI * 2, sp = power * (.45 + Math.random() * .8);
      parts.push({
        t: types[(Math.random() * types.length) | 0],
        x: x + Math.cos(a) * spread * Math.random(), y: y + Math.sin(a) * spread * Math.random(),
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - power * .55,
        r: Math.random() * 6.28, vr: (Math.random() - .5) * .45,
        s: (opts.scale || 1.25) * (.75 + Math.random() * .7), life: 1, decay: .008 + Math.random() * .01
      });
    }
    if (!running) { running = true; requestAnimationFrame(tick); }
  }
  // Ingrédients « satellites » : ils tournent autour de la pizza survolée,
  // la suivent quand elle bouge, fuient le curseur, puis s'envolent.
  let sats = [];
  function ensureCanvas() {
    if (!canvas.isConnected) { document.body.appendChild(canvas); sizeCanvas(); addEventListener('resize', sizeCanvas); }
  }
  function attach(el) {
    if (reduceMotion || el._sats || !el._bits) return;
    ensureCanvas();
    const r = el.getBoundingClientRect(), n = 9;
    el._sats = [];
    for (let i = 0; i < n; i++) {
      const s = {
        el, t: el._bits[i % el._bits.length], a: (i / n) * Math.PI * 2, rr: .6 + (i % 3) * .1,
        x: r.left + r.width / 2, y: r.top + r.height / 2, vx: 0, vy: 0, r: Math.random() * 6.28, vr: (Math.random() - .5) * .1,
        s: 1.1 + Math.random() * .6, born: performance.now() + i * 35
      };
      el._sats.push(s); sats.push(s);
    }
    if (!running) { running = true; requestAnimationFrame(tick); }
  }
  function release(el) {
    if (!el._sats) return;
    el._sats.forEach(s => {
      const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = s.x - cx, dy = s.y - cy, d = Math.hypot(dx, dy) || 1;
      parts.push({ t: s.t, x: s.x, y: s.y, vx: s.vx + dx / d * 6 - dy / d * 4, vy: s.vy + dy / d * 6 + dx / d * 4 - 4, r: s.r, vr: s.vr * 3, s: s.s, life: 1, decay: .015 });
    });
    sats = sats.filter(s => s.el !== el);
    el._sats = null;
  }
  function tickSats(now) {
    const rects = new Map();
    for (const s of sats) {
      let r = rects.get(s.el);
      if (!r) { r = s.el.getBoundingClientRect(); rects.set(s.el, r); }
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2, R = r.width / 2;
      const grow = clamp((now - s.born) / 450);
      s.a += .022;
      const tx = cx + Math.cos(s.a) * R * s.rr * (.2 + grow * .8 + .55), ty = cy + Math.sin(s.a) * R * s.rr * (.2 + grow * .8 + .55) + Math.sin(now / 300 + s.a * 3) * 4;
      s.vx += (tx - s.x) * .14; s.vy += (ty - s.y) * .14;
      if (mouse.active) {
        const mx = s.x - mouse.x, my = s.y - mouse.y, md = Math.hypot(mx, my);
        if (md < 70) { s.vx += mx / (md || 1) * (70 - md) * .09; s.vy += my / (md || 1) * (70 - md) * .09; }
      }
      s.vx *= .72; s.vy *= .72; s.x += s.vx; s.y += s.vy; s.r += s.vr + s.vx * .01;
      ctx.setTransform(dpr * s.s * (.3 + grow * .7), 0, 0, dpr * s.s * (.3 + grow * .7), s.x * dpr, s.y * dpr);
      ctx.rotate(s.r);
      ctx.globalAlpha = 1;
      (DRAW[s.t] || DRAW.cheese)(ctx);
    }
  }
  function tick(now) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (sats.length) tickSats(now || performance.now());
    parts = parts.filter(p => p.life > 0 && p.y < innerHeight + 60);
    for (const p of parts) {
      p.vy += .34; p.vx *= .985; p.vy *= .985;
      p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life -= p.decay;
      ctx.setTransform(dpr * p.s, 0, 0, dpr * p.s, p.x * dpr, p.y * dpr);
      ctx.rotate(p.r);
      ctx.globalAlpha = clamp(p.life * 2.2);
      (DRAW[p.t] || DRAW.cheese)(ctx);
    }
    ctx.globalAlpha = 1;
    if (parts.length || sats.length) requestAnimationFrame(tick); else { running = false; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); }
  }

  /* ---------- Pizza SVG (héros, chargement) ---------- */
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { return () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const f = n => n.toFixed(1);
  function wavyCircle(r, amp, waves, phase) {
    let d = '';
    for (let i = 0; i <= 72; i++) { const a = (i / 72) * Math.PI * 2, R = r + amp * Math.sin(a * waves + phase); d += (i ? 'L' : 'M') + f(Math.cos(a) * R) + ' ' + f(Math.sin(a) * R); }
    return d + 'Z';
  }
  // Les mêmes dessins qu'en canvas, en SVG (garnitures du héros)
  const SVGTOP = {
    olive: () => `<circle r="6.5" fill="${CH}"/><circle r="2.6" fill="#ff4100"/>`,
    basil: () => `<path d="M0-11C8-6 8 6 0 11-8 6-8-6 0-11z" fill="#1f8a4c" stroke="${CH}" stroke-width="1.6"/><path d="M0-8V9" stroke="${CH}" stroke-width="1.2"/>`,
    ham: () => `<rect x="-8" y="-6.5" width="16" height="13" rx="3" fill="#fdbeba" stroke="#e07c7c" stroke-width="1.6"/>`,
    mushroom: () => `<path d="M-9 1a9 8 0 0 1 18 0z" fill="#fee3c1" stroke="${CH}" stroke-width="1.6"/><path d="M-3 1h6v7h-6z" fill="#fee3c1" stroke="${CH}" stroke-width="1.6"/>`,
    tomato: () => `<circle r="9" fill="#e8240b" stroke="${CH}" stroke-width="1.5"/><circle r="5.8" fill="#ff6a3d"/>`,
    pepper: () => `<path d="M-8 4q8-14 16 0" fill="none" stroke="#1f8a4c" stroke-width="4" stroke-linecap="round"/>`,
    onion: () => `<circle r="7" fill="none" stroke="#c0569a" stroke-width="2.4"/>`,
    pepperoni: () => `<circle r="10" fill="#c41e00" stroke="#7a1200" stroke-width="1.6"/><circle cx="-3" cy="-3" r="1.6" fill="#ff6a3d"/><circle cx="3.5" cy="1" r="1.6" fill="#ff6a3d"/>`,
    beef: () => `<path d="M-6-3l4-4 6 2 2 5-4 4-6-1z" fill="#6b2a14" stroke="${CH}" stroke-width="1"/>`,
    egg: () => `<path d="M-11 0c0-7 5-10 11-9s11 4 10 10-6 9-12 8-9-3-9-9z" fill="#fff" stroke="${CH}" stroke-width="1.4"/><circle r="5" fill="#ff9d00" stroke="${CH}" stroke-width="1.2"/>`,
    chicken: () => `<path d="M-8-3l5-5 8 1 3 6-4 6-9-1z" fill="#f4d9a8" stroke="#c48a3a" stroke-width="1.5"/>`,
    goat: () => `<circle r="8" fill="#fff" stroke="#e0d6c5" stroke-width="1.6"/>`,
    pineapple: () => `<path d="M0-8L8 6H-8z" fill="#ffe14d" stroke="#d4a800" stroke-width="1.5"/>`,
    potato: () => `<rect x="-4.5" y="-4.5" width="9" height="9" rx="2" fill="#f6e653" stroke="#c9a400" stroke-width="1.3"/>`,
    bacon: () => `<rect x="-5" y="-4" width="10" height="8" rx="1.8" fill="#ff8f7a" stroke="#b3412a" stroke-width="1.4"/>`,
    merguez: () => `<rect x="-9" y="-3.5" width="18" height="7" rx="3.5" fill="#8f1d0b" stroke="${CH}" stroke-width="1.2"/>`
  };
  let uid = 0;
  function svgPizza(rec, label) {
    const rand = rng(hash(rec.name));
    const col = SAUCES[rec.sauce] || SAUCES.tomato;
    const id = 'sp' + (++uid);
    let g = `<circle r="95" fill="#f2a33a" stroke="${CH}" stroke-width="3.5"/><circle r="86" fill="#ffbf5e"/>`;
    for (let i = 0; i < 12; i++) { const a = rand() * Math.PI * 2; g += `<ellipse cx="${f(Math.cos(a) * 90)}" cy="${f(Math.sin(a) * 90)}" rx="3.2" ry="2" fill="#d9822b" opacity=".7"/>`; }
    g += `<path d="${wavyCircle(80, 2.5, 14, rand() * 6)}" fill="${col.sauce}"/><path d="${wavyCircle(68, 6, 11, rand() * 6)}" fill="${col.cheese}"/>`;
    for (let i = 0; i < 9; i++) { const a = rand() * 6.28, d = Math.sqrt(rand()) * 60; g += `<circle cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d)}" r="${f(3 + rand() * 5)}" fill="${col.sauce}" opacity=".85"/>`; }
    const tops = rec.toppings.filter(t => SVGTOP[t]);
    const pts = [], per = tops.length ? clamp(Math.round(24 / tops.length), 4, 12) : 0;
    tops.forEach(t => {
      let n = 0, tries = 0;
      while (n < per && tries++ < 300) {
        const a = rand() * 6.28, d = Math.sqrt(rand()) * 66, x = Math.cos(a) * d, y = Math.sin(a) * d;
        if (pts.every(([px, py]) => Math.hypot(px - x, py - y) > 15)) { pts.push([x, y]); g += `<g transform="translate(${f(x)} ${f(y)}) rotate(${Math.round(rand() * 360)})">${SVGTOP[t]()}</g>`; n++; }
      }
    });
    const wedge = (i, R) => { const a0 = (i * 45 - 90) * Math.PI / 180, a1 = a0 + Math.PI / 4; return `M0 0L${f(Math.cos(a0) * R)} ${f(Math.sin(a0) * R)}A${R} ${R} 0 0 1 ${f(Math.cos(a1) * R)} ${f(Math.sin(a1) * R)}Z`; };
    let defs = `<g id="${id}">${g}</g>`, slices = '';
    for (let i = 0; i < 8; i++) {
      const m = (i * 45 - 90 + 22.5) * Math.PI / 180;
      defs += `<clipPath id="${id}c${i}"><path d="${wedge(i, 100)}"/></clipPath>`;
      slices += `<g class="pz__s" style="--dx:${Math.cos(m).toFixed(3)};--dy:${Math.sin(m).toFixed(3)}"><use href="#${id}" clip-path="url(#${id}c${i})"/><path d="${wedge(i, 95)}" fill="none" stroke="${CH}" stroke-width="2.6" stroke-linejoin="round"/></g>`;
    }
    return `<svg viewBox="-110 -110 220 220" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}><defs>${defs}</defs>${slices}</svg>`;
  }

  /* ---------- Pizza photo découpée en 8 parts ---------- */
  function slicePoly(i) {
    const a0 = (i * 45 - 90) * Math.PI / 180, a1 = a0 + Math.PI / 4, R = 62;
    const p = a => `${(50 + Math.cos(a) * R).toFixed(2)}% ${(50 + Math.sin(a) * R).toFixed(2)}%`;
    return `polygon(50% 50%, ${p(a0)}, ${p(a1)})`;
  }
  function photoPizza(src, alt) {
    let s = '';
    for (let i = 0; i < 8; i++) {
      const m = (i * 45 - 90 + 22.5) * Math.PI / 180;
      s += `<span class="pz__s" style="--dx:${Math.cos(m).toFixed(3)};--dy:${Math.sin(m).toFixed(3)};clip-path:${slicePoly(i)}"><span class="pz__crust"><img src="${src}" alt="${i ? '' : alt}" loading="lazy" draggable="false"></span></span>`;
    }
    return s;
  }

  /* ---------- Proximité du curseur + survol ---------- */
  const tracked = new Set();
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => (e.isIntersecting ? tracked.add(e.target) : tracked.delete(e.target))), { rootMargin: '120px' }) : null;
  const mouse = { x: -9999, y: -9999, active: false };
  addEventListener('pointermove', e => { if (e.pointerType === 'mouse' || e.pointerType === 'pen') { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; } }, { passive: true });
  document.addEventListener('mouseleave', () => { mouse.active = false; });

  function register(el, bits) {
    el._bits = bits;
    el._slices = [...el.querySelectorAll('.pz__s')];
    el._hover = false; el._last = 0; el._cut = 0;
    if (io) io.observe(el); else tracked.add(el);
    // Toucher / clic : explosion d'ingrédients
    el.addEventListener('pointerdown', e => {
      const r = el.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, el._bits, { count: 3, power: 10, radius: r.width * .2 });
      el.classList.remove('is-boom'); void el.offsetWidth; el.classList.add('is-boom');
    });
  }

  function proximityFrame() {
    for (const el of tracked) {
      const r = el.getBoundingClientRect();
      if (!r.width) continue;
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = mouse.x - cx, dy = mouse.y - cy, d = Math.hypot(dx, dy) || 1;
      const R = r.width * .75 + 140;
      const k = mouse.active ? Math.pow(clamp(1 - (d - r.width / 2) / R), 1.6) : 0;
      const inside = mouse.active && d < r.width / 2;
      if (inside && !el._hover) {
        el._hover = true;
        // plus d'ingrédients qui s'envolent au survol (seulement au clic)
      } else if (!inside && el._hover) { el._hover = false; }
      const scale = r.width / 260;
      // pizza « fixe » (vitrine) : elle s'ouvre au survol mais ne suit pas le curseur
      if (el.dataset.steady) { el.style.setProperty('--cut', (inside ? 9 * scale : 0).toFixed(2)); continue; }
      const cut = (k * 7 + (inside ? 9 : 0)) * scale;
      // La pizza fuit légèrement le curseur et tourne vers lui
      const push = -k * 10 * scale;
      el.style.setProperty('--cut', cut.toFixed(2));
      el.style.setProperty('--mx', (dx / d * push).toFixed(1) + 'px');
      el.style.setProperty('--my', (dy / d * push).toFixed(1) + 'px');
      el.style.setProperty('--rot', (k * (dx > 0 ? 14 : -14)).toFixed(1) + 'deg');
      // La part la plus proche du curseur sort davantage
      const ang = Math.atan2(dy, dx), idx = (((Math.round(((ang * 180 / Math.PI) + 90 - 22.5) / 45) % 8) + 8) % 8);
      el._slices.forEach((s, i) => s.style.setProperty('--e', i === idx ? (k * 16 * scale).toFixed(2) : '0'));
    }
    requestAnimationFrame(proximityFrame);
  }
  if (!reduceMotion) requestAnimationFrame(proximityFrame);

  const svgTop = t => SVGTOP[t] ? `<svg viewBox="-15 -15 30 30" aria-hidden="true">${SVGTOP[t]()}</svg>` : '';
  window.PF_PIZZA = { recipe, bitsFor, burst, svgPizza, photoPizza, register, svgTop, DRAW, SAUCES, norm, mouse };
})();
