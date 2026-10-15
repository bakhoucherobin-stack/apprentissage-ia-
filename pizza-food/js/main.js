/* =========================================================
   PIZZA FOOD — site, panier, offres, animations
   Dépend de js/data.js (carte, allergènes, textes légaux)
   et js/pizza.js (pizzas interactives, particules).
   L'aperçu 3D (js/order3d.js + Three.js) est chargé à la
   validation de la commande.
   ========================================================= */
(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const euro = n => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const markTerm = (text, re) => {
    const m = new RegExp(re.source, 'g'), n = norm(text);
    let out = '', last = 0, r;
    while ((r = m.exec(n))) { out += esc(text.slice(last, r.index)) + '<mark>' + esc(text.slice(r.index, r.index + r[0].length)) + '</mark>'; last = r.index + r[0].length; }
    return out + esc(text.slice(last));
  };
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* stockage indisponible */ } }
  };
  const page = document.body.dataset.page;
  const PZ = window.PF_PIZZA;
  document.documentElement.classList.add('js');

  /* =======================================================
     DONNÉES
     ======================================================= */
  const DATA = window.PF_DATA || { cats: [], allergens: { cols: [], rows: [] }, legal: {} };
  const PRODUCTS = {};
  DATA.cats.forEach(cat => cat.items.forEach(it => { PRODUCTS[it.id] = Object.assign({ cat }, it); }));

  const INFO = {
    tel1: '01 45 94 29 50', tel1Href: 'tel:0145942950', tel2: '07 49 45 89 55', tel2Href: 'tel:0749458955',
    email: 'contact@pizza-food.fr', address: '34 rue du Général de Gaulle', city: '94430 Chennevières-sur-Marne', minimum: 15
  };
  const ZONES = [
    ['Chennevières-sur-Marne', '94430'], ['Bonneuil-sur-Marne', '94380'], ['Champigny-sur-Marne', '94500'],
    ['La Queue-en-Brie', '94510'], ['La Varenne Saint-Hilaire', '94210'], ['Le Plessis-Trévise', '94420'],
    ['Noiseau', '94880'], ['Ormesson-sur-Marne', '94490'], ['Saint-Maur-des-Fossés', '94100'],
    ['Sucy-en-Brie', '94370'], ['Villiers-sur-Marne', '94350']
  ];
  // « Vos Envies » : les 11 ingrédients du site, cherchés dans le nom + la description
  const ENVIES = [
    ['ANCHOIS', /anchois/], ['BOURSIN', /boursin/], ['CHAMPIGNONS', /champignon/], ['CHÈVRE', /chevre/],
    ['JAMBON', /jambon/], ['LARDONS', /lardon/], ['MERGUEZ', /merguez/], ['POULET PANÉ', /poulet pane/],
    ['SAUMON', /saumon/], ['THON', /\bthon\b/], ['VIANDE HACHÉE', /viande hachee/]
  ];
  const STICKER = [['var(--yellow)', 'var(--charcoal)'], ['var(--cream)', 'var(--charcoal)'], ['var(--orange)', 'var(--yellow)'], ['var(--lemon)', 'var(--charcoal)'], ['var(--pink)', 'var(--charcoal)']];
  const envieMatches = re => Object.values(PRODUCTS).filter(p => re.test(norm(p.n + ' ' + p.d)));
  const MODES = ['Livraison', 'À emporter', 'Sur place'];
  const OFFERS = { 'Livraison': { every: 3, label: '2 pizzas achetées = la 3e offerte' }, 'À emporter': { every: 2, label: '1 pizza achetée = la 2e offerte' } };

  /* =======================================================
     SVG utilitaires
     ======================================================= */
  const f1 = n => n.toFixed(1);
  function burstPath(n = 18, r1 = 48, r2 = 39) {
    let d = '';
    for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? r2 : r1; d += (i ? 'L' : 'M') + f1(Math.cos(a) * r) + ' ' + f1(Math.sin(a) * r); }
    return d + 'Z';
  }
  const burstSVG = (n = 18, r2 = 39) => `<svg viewBox="-50 -50 100 100" aria-hidden="true"><path d="${burstPath(n, 48, r2)}"/></svg>`;
  const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>';
  const ICONS = {
    fb: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8h3V4h-3c-2.8 0-4 1.8-4 4.3V10H7v4h3v8h4v-8h3l1-4h-4V8.6c0-.4.3-.6.6-.6z"/></svg>',
    ig: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7.3a4.7 4.7 0 1 0 0 9.4 4.7 4.7 0 0 0 0-9.4zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm4.9-8.9a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2zM21.9 7c-.1-1.6-.4-3-1.6-4.2S17.6 1.2 16 1.1C14.4 1 9.6 1 8 1.1 6.4 1.2 5 1.5 3.8 2.7S2.2 5.4 2.1 7C2 8.6 2 15.4 2.1 17c.1 1.6.4 3 1.6 4.2s2.6 1.6 4.2 1.7c1.6.1 6.4.1 8 0 1.6-.1 3-.4 4.2-1.7s1.6-2.6 1.7-4.2c.1-1.6.1-8.4.1-10zm-2.1 12.6a3.2 3.2 0 0 1-1.8 1.8c-1.3.5-4.3.4-5.7.4s-4.4.1-5.7-.4a3.2 3.2 0 0 1-1.8-1.8c-.5-1.3-.4-4.3-.4-5.7s-.1-4.4.4-5.7a3.2 3.2 0 0 1 1.8-1.8C6 3.9 9 4 10.4 4h1.6c1.4 0 4.4-.1 5.7.4a3.2 3.2 0 0 1 1.8 1.8c.5 1.3.4 4.3.4 5.7s.1 4.4-.4 5.7z"/></svg>',
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.8 2h3.3l-7.2 8.3L22.4 22h-6.6l-5.2-6.8L4.6 22H1.3l7.7-8.8L.9 2h6.8l4.7 6.2zm-1.2 18h1.8L6.5 3.9H4.5z"/></svg>',
    yt: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4l6.3 3.6z"/></svg>'
  };

  /* =======================================================
     ÉLÉMENTS COMMUNS
     ======================================================= */
  function buildChrome() {
    const link = (href, label, key) => `<a href="${href}" class="nav__link"${page === key ? ' aria-current="page"' : ''} data-cursor="${label}"><span data-text="${label}">${label}</span></a>`;
    document.body.insertAdjacentHTML('afterbegin', `
      <div class="progress" aria-hidden="true"><i id="progress"></i></div>
      <div class="cursor" id="cursor" aria-hidden="true"><span id="cursorLabel"></span></div>
      <header class="nav" id="nav">
        <div class="nav__side">
          <button class="nav__burger" id="burger" aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="mmenu"><span></span><span></span><span></span></button>
          <nav class="nav__links" aria-label="Navigation principale">
            ${link('carte.html', 'La carte', 'carte')}${link('livraison.html', 'Livraison', 'livraison')}${link('carte.html#envies', 'Vos envies', '')}
          </nav>
        </div>
        <a href="index.html" class="logo" aria-label="Pizza Food — accueil" data-cursor="Accueil">${burstSVG(18, 40)}<span class="logo__text"><span>Pizza</span><span>Food</span></span></a>
        <div class="nav__side nav__right">
          <a href="${INFO.tel1Href}" class="nav__link nav__tel" data-cursor="Allô ?"><span data-text="${INFO.tel1}">${INFO.tel1}</span></a>
          <button class="nav__cart" id="cartBtn" aria-label="Ouvrir mon panier" data-cursor="Panier">
            <span class="nav__cart-ring"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 11h18l-2 15H9z"/><path d="M12 11V8a4 4 0 0 1 8 0v3"/></svg><span class="nav__cart-count" id="cartCount">0</span></span>
            <span class="nav__cart-label">Commander</span>
          </button>
        </div>
      </header>
      <div class="mobile-menu" id="mmenu" aria-hidden="true">
        <nav aria-label="Menu mobile"><a href="index.html">Accueil</a><a href="carte.html">La carte</a><a href="livraison.html">Livraison</a><a href="carte.html#envies">Vos envies</a></nav>
        <a href="${INFO.tel1Href}" class="mobile-menu__tel">${INFO.tel1}</a>
      </div>`);

    const fl = (label, attrs) => `<li>${attrs.startsWith('href') ? `<a ${attrs}>${label}</a>` : `<button type="button" ${attrs}>${label}</button>`}</li>`;
    document.body.insertAdjacentHTML('beforeend', `
      <div class="tent" style="--from: var(--orange); --to: var(--yellow)" aria-hidden="true"></div>
      <footer class="footer band--yellow">
        <div class="footer__top">
          <div class="news">
            <h3>Notre newsletter</h3>
            <p>Les nouveautés et les offres, en premier.</p>
            <form id="newsForm" novalidate>
              <div class="field"><label class="sr-only" for="nEmail">E-mail</label><input id="nEmail" type="email" placeholder="Votre e-mail" autocomplete="email" required></div>
              <div class="field"><label class="sr-only" for="nMobile">Mobile</label><input id="nMobile" type="tel" placeholder="Votre mobile" autocomplete="tel"></div>
              <button class="btn btn--dark" type="submit" style="justify-self:start" data-cursor="OK">OK ${ARROW}</button>
            </form>
          </div>
          <div><h3>Commander</h3><ul class="flinks">
            ${fl('Zones de livraison', 'href="livraison.html#zones"')}${fl('À emporter', 'href="livraison.html#emporter"')}${fl('Commander en ligne', 'href="carte.html"')}${fl('Mobile', 'data-modal="mobile"')}
          </ul></div>
          <div><h3>La maison</h3><ul class="flinks">
            ${fl('Charte qualité', 'data-modal="charte"')}${fl('Programme de fidélité', 'data-modal="fidelite"')}${fl('Votre appréciation', 'data-modal="appreciation"')}${fl('Recrutement', 'data-modal="recrutement"')}
          </ul></div>
          <div><h3>Infos</h3><ul class="flinks">
            ${fl('Contact', 'data-modal="contact"')}${fl('Allergènes', 'data-modal="allergenes"')}${fl('Mentions légales', 'data-modal="mentions"')}${fl('C.G.V', 'data-modal="cgv"')}
          </ul>
            <div class="socials">
              <a href="https://www.facebook.com/Pizza-Food-1682159702074299" target="_blank" rel="noopener" aria-label="Facebook">${ICONS.fb}</a>
              <a href="https://www.instagram.com/pizzafood94430/" target="_blank" rel="noopener" aria-label="Instagram">${ICONS.ig}</a>
              <a href="https://twitter.com/pizzafood94430" target="_blank" rel="noopener" aria-label="X (Twitter)">${ICONS.x}</a>
              <a href="https://www.youtube.com/channel/UCCv9ak1TfnuyedFZNZe30Tw" target="_blank" rel="noopener" aria-label="YouTube">${ICONS.yt}</a>
            </div>
          </div>
        </div>
        <p class="footer__giant" id="giant" data-split>Pizza Food</p>
        <div class="footer__bottom"><span>© ${new Date().getFullYear()} Pizza Food — ${INFO.address}, ${INFO.city}</span><span>${INFO.tel1} · ${INFO.tel2}</span></div>
      </footer>

      <div class="overlay" id="overlay"></div>
      <aside class="cart is-empty" id="cart" aria-hidden="true" aria-label="Mon panier">
        <div class="cart__head"><h2>Mon panier</h2><button class="x" id="cartClose" aria-label="Fermer le panier">×</button></div>
        <div class="seg" role="group" aria-label="Type de commande">${MODES.map(m => `<button type="button" data-setmode="${m}" aria-pressed="false">${m}</button>`).join('')}</div>
        <p class="cart__hint" id="cartHint"></p>
        <ul class="cart__list" id="cartList"></ul>
        <div class="cart__empty"><div class="pz pz--svg" id="emptyPizza"></div><p>Panier vide !<br>Votre estomac mérite mieux.</p><a class="btn btn--dark" href="carte.html">Voir la carte</a></div>
        <div class="cart__foot">
          <p class="line"><span>Sous-total</span><span id="cartSub"></span></p>
          <p class="line line--disc" id="cartDiscLine" hidden><span id="cartDiscLbl"></span><span id="cartDisc"></span></p>
          <p class="line"><span>Livraison</span><span id="cartShip"></span></p>
          <p class="line line--total"><span>Total</span><span id="cartTotal"></span></p>
          <p class="cart__warn" id="cartWarn" hidden></p>
          <button class="btn btn--dark btn--full" id="checkout" data-cursor="Miam">Valider ma commande ${ARROW}</button>
        </div>
      </aside>

      <div class="modal" id="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle" aria-hidden="true">
        <div class="modal__box"><div class="modal__head"><h2 id="modalTitle"></h2><button class="x" id="modalClose" aria-label="Fermer">×</button></div><div class="modal__body" id="modalBody"></div></div>
      </div>
      <div class="toast" id="toast" role="status" aria-live="polite"></div>
      <button class="to-top" id="toTop" aria-label="Revenir en haut"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg></button>`);
  }

  /* =======================================================
     PANIER + OFFRES
     ======================================================= */
  const cart = store.get('pf-cart-v2', { items: [], mode: 'Livraison' });
  if (!MODES.includes(cart.mode)) cart.mode = 'Livraison';
  cart.items = (cart.items || []).filter(i => PRODUCTS[i.id]);
  const saveCart = () => store.set('pf-cart-v2', cart);
  const unitPrice = it => { const p = PRODUCTS[it.id]; return p.s ? p.s[it.size] : p.p; };
  // Offre : pizzas Senior et Mega, sauf la Marguerita
  const isEligible = it => { const p = PRODUCTS[it.id]; return p.cat.pizza && (it.size === 'Senior' || it.size === 'Mega') && norm(p.n) !== 'marguerita'; };

  function computeCart() {
    const sub = cart.items.reduce((s, i) => s + unitPrice(i) * i.qty, 0);
    const offer = OFFERS[cart.mode], free = {};
    let disc = 0, eligibleCount = 0;
    if (offer) {
      const units = [];
      cart.items.forEach(i => { if (isEligible(i)) for (let k = 0; k < i.qty; k++) units.push({ key: i.key, price: unitPrice(i) }); });
      eligibleCount = units.length;
      units.sort((a, b) => b.price - a.price); // les pizzas offertes sont les moins chères de chaque groupe
      units.forEach((u, idx) => { if ((idx + 1) % offer.every === 0) { disc += u.price; free[u.key] = (free[u.key] || 0) + 1; } });
    }
    return { sub, disc, total: sub - disc, free, count: cart.items.reduce((s, i) => s + i.qty, 0), offer, eligibleCount };
  }

  function addToCart(id, size, fromEl) {
    const key = id + '|' + (size || '');
    const found = cart.items.find(i => i.key === key);
    if (found) found.qty++; else cart.items.push({ key, id, size: size || '', qty: 1 });
    saveCart();
    const p = PRODUCTS[id];
    const r = fromEl.getBoundingClientRect();
    PZ.burst(r.left + r.width / 2, r.top + r.height / 2, PZ.bitsFor(p), { count: 16, power: 8 });
    flyToCart(fromEl, p).then(() => {
      renderCart();
      const b = $('#cartBtn'); b.classList.remove('is-bump'); void b.offsetWidth; b.classList.add('is-bump');
    });
    const c = computeCart();
    let msg = `+1 <b>${esc(p.n)}</b>${size ? ' ' + size : ''}`;
    if (c.offer && isEligible({ id, size }) && c.eligibleCount % c.offer.every === 0) msg += ' · <b>pizza offerte !</b>';
    toast(msg);
  }

  function renderCart() {
    const c = computeCart();
    $('#cartCount').textContent = c.count;
    $('#cart').classList.toggle('is-empty', !c.count);
    $$('[data-setmode]').forEach(b => b.setAttribute('aria-pressed', b.dataset.setmode === cart.mode));
    $$('.mode__card[data-mode]').forEach(m => m.setAttribute('aria-checked', m.dataset.mode === cart.mode));
    $$('[data-modelabel]').forEach(el => { el.textContent = cart.mode; });
    $('#cartList').innerHTML = cart.items.map((it, idx) => {
      const p = PRODUCTS[it.id], free = c.free[it.key];
      return `<li class="citem"><img src="${p.img}" alt="" class="${p.cat.pizza ? 'is-pizza' : ''}" loading="lazy">
        <div><div class="citem__name">${esc(p.n)}</div><div class="citem__meta">${it.size ? it.size + ' · ' : ''}${euro(unitPrice(it))}</div>${free ? `<span class="citem__free">${free > 1 ? free + ' offertes' : 'Offerte !'}</span>` : ''}</div>
        <div class="citem__right"><span class="citem__price">${euro(unitPrice(it) * it.qty)}</span>
        <span class="qty"><button data-qty="-1" data-idx="${idx}" aria-label="Retirer un ${esc(p.n)}">−</button><span>${it.qty}</span><button data-qty="1" data-idx="${idx}" aria-label="Ajouter un ${esc(p.n)}">+</button></span></div></li>`;
    }).join('');
    $('#cartSub').textContent = euro(c.sub);
    $('#cartDiscLine').hidden = !c.disc;
    $('#cartDisc').textContent = '− ' + euro(c.disc);
    $('#cartDiscLbl').textContent = c.offer ? 'Offre : ' + c.offer.label : '';
    $('#cartShip').textContent = cart.mode === 'Livraison' ? 'Gratuite · 40 min' : '—';
    $('#cartTotal').textContent = euro(c.total);
    let hint;
    if (c.offer) {
      const left = c.offer.every - (c.eligibleCount % c.offer.every);
      hint = `${cart.mode} : <b>${c.offer.label}</b>. ` + (left === c.offer.every && c.eligibleCount ? 'Remise appliquée ✓' : `Encore ${left} pizza${left > 1 ? 's' : ''} Senior ou Mega pour en profiter.`) + ' (hors Marguerita)';
    } else hint = 'Sur place : les offres concernent la livraison et la vente à emporter.';
    $('#cartHint').innerHTML = hint;
    const below = cart.mode === 'Livraison' && c.count && c.total < INFO.minimum;
    $('#cartWarn').hidden = !below;
    if (below) $('#cartWarn').textContent = `Minimum de commande en livraison : ${euro(INFO.minimum)}. Il manque ${euro(INFO.minimum - c.total)}.`;
    $('#checkout').disabled = !!below;
  }

  function setMode(mode, announce, fromEl) {
    if (!MODES.includes(mode)) return;
    cart.mode = mode; saveCart(); renderCart();
    if (announce) {
      const o = OFFERS[mode];
      toast(`Mode : <b>${mode}</b>${o ? ' · ' + o.label : ''}`);
      if (fromEl) { const r = fromEl.getBoundingClientRect(); PZ.burst(r.left + r.width / 2, r.top + r.height / 3, ['star', 'pepperoni', 'basil', 'cheese'], { count: 18, power: 9 }); }
    }
  }

  function flyToCart(fromEl, p) {
    if (reduceMotion || !fromEl) return Promise.resolve();
    const a = fromEl.getBoundingClientRect(), b = $('.nav__cart-ring').getBoundingClientRect();
    const fly = document.createElement('div');
    fly.className = 'flyer' + (p.cat.pizza ? '' : ' is-thing');
    fly.innerHTML = `<img src="${p.img}" alt="">`;
    document.body.appendChild(fly);
    const x0 = a.left + a.width / 2, y0 = a.top + a.height / 2, x1 = b.left + b.width / 2, y1 = b.top + b.height / 2;
    const anim = fly.animate([
      { transform: `translate(${x0}px,${y0}px) scale(.6) rotate(0deg)` },
      { transform: `translate(${(x0 + x1) / 2}px,${Math.min(y0, y1) - 160}px) scale(1.7) rotate(240deg)`, offset: .5 },
      { transform: `translate(${x1}px,${y1}px) scale(.3) rotate(480deg)` }
    ], { duration: 850, easing: 'cubic-bezier(.5,0,.5,1)' });
    return anim.finished.then(() => fly.remove()).catch(() => fly.remove());
  }

  let toastT;
  function toast(html) {
    const t = $('#toast'); t.innerHTML = html; t.classList.add('is-on');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('is-on'), 2600);
  }

  function bindCart() {
    const cartEl = $('#cart'), overlay = $('#overlay');
    let last;
    const open = () => { last = document.activeElement; cartEl.classList.add('is-open'); overlay.classList.add('is-on'); cartEl.setAttribute('aria-hidden', 'false'); $('#cartClose').focus(); };
    const close = () => { cartEl.classList.remove('is-open'); overlay.classList.remove('is-on'); cartEl.setAttribute('aria-hidden', 'true'); if (last && last.focus) last.focus(); };
    bindCart.open = open; bindCart.close = close;
    $('#cartBtn').addEventListener('click', open);
    $('#cartClose').addEventListener('click', close);
    overlay.addEventListener('click', close);
    $('#cartList').addEventListener('click', e => {
      const b = e.target.closest('[data-qty]');
      if (!b) return;
      const it = cart.items[+b.dataset.idx];
      it.qty += +b.dataset.qty;
      if (it.qty <= 0) cart.items.splice(+b.dataset.idx, 1);
      saveCart(); renderCart();
    });
    document.addEventListener('click', e => {
      const add = e.target.closest('[data-add]');
      if (add) { addToCart(add.dataset.add, add.dataset.size, add); add.classList.remove('is-added'); void add.offsetWidth; add.classList.add('is-added'); }
      const m = e.target.closest('[data-setmode], .mode__card[data-mode]');
      if (m) setMode(m.dataset.setmode || m.dataset.mode, true, m);
    });
    $('#checkout').addEventListener('click', checkout);
  }

  /* =======================================================
     FIN DE COMMANDE : aperçu 3D
     ======================================================= */
  function loadScript(src) {
    return new Promise((res, rej) => {
      if ([...document.scripts].some(s => s.src && s.src.endsWith(src.split('/').pop())) && (src.includes('three') ? window.THREE : src.includes('photos') ? window.PF_PHOTOS : window.PF_ORDER3D)) return res();
      const s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
      setTimeout(() => rej(new Error('timeout')), 12000);
    });
  }

  function ticketHTML() {
    const c = computeCart();
    const now = new Date().toLocaleString('fr-FR', { weekday: 'long', hour: '2-digit', minute: '2-digit' });
    return `<p class="ticket__brand">Pizza Food</p>
      <p class="ticket__meta">${cart.mode} · ${now}</p>
      <ul class="ticket__list">${cart.items.map((i, idx) => {
        const p = PRODUCTS[i.id], free = c.free[i.key];
        return `<li data-o3d="${idx}" style="--i:${idx}"><img src="${p.img}" alt="" class="${p.cat.pizza ? 'is-pizza' : ''}"><span><b>${i.qty} × ${esc(p.n)}</b><small>${i.size ? i.size + ' · ' : ''}${esc(p.cat.label)}</small>${free ? `<span class="ticket__free">${free} offerte${free > 1 ? 's' : ''}</span>` : ''}</span><span class="p">${euro(unitPrice(i) * i.qty)}</span></li>`;
      }).join('')}</ul>
      <div class="ticket__totals">
        <p class="line"><span>Sous-total</span><span>${euro(c.sub)}</span></p>
        ${c.disc ? `<p class="line line--disc"><span>${c.offer.label}</span><span>− ${euro(c.disc)}</span></p>` : ''}
        <p class="line"><span>Livraison</span><span>${cart.mode === 'Livraison' ? 'Gratuite · 40 min' : '—'}</span></p>
        <p class="line line--total"><span>Total</span><span>${euro(c.total)}</span></p>
      </div>
      <p class="ticket__msg">Votre commande est prête à partir au four. Elle est préparée à votre appel${cart.mode === 'Livraison' ? ', puis livrée en 40 minutes environ' : ''} : appelez le restaurant pour la confirmer.</p>
      <div class="ticket__ctas">
        <a class="btn btn--dark btn--full" href="${INFO.tel1Href}">Appeler le ${INFO.tel1}</a>
        <a class="btn btn--pill btn--full" href="${INFO.tel2Href}">${INFO.tel2}</a>
        <button class="btn btn--ghost" type="button" id="o3dEdit"><span>Modifier ma commande</span></button>
      </div>`;
  }

  async function checkout() {
    const btn = $('#checkout');
    btn.disabled = true;
    const label = btn.innerHTML;
    btn.textContent = 'Le four chauffe…';
    try {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
      await loadScript('js/photos3d.js');
      await loadScript('js/order3d.js');
      bindCart.close();
      const items = cart.items.slice(0, 14).map((i, idx) => {
        const p = PRODUCTS[i.id];
        return { index: idx, product: p, size: i.size, qty: i.qty, pizza: p.cat.pizza, free: !!computeCart().free[i.key] };
      });
      window.PF_ORDER3D.open({ items, ticketHTML: ticketHTML() });
      const edit = $('#o3dEdit');
      if (edit) edit.addEventListener('click', () => { window.PF_ORDER3D.close(); setTimeout(bindCart.open, 500); });
    } catch (e) {
      // Sans connexion (Three.js indisponible) : récapitulatif simple
      openModal('Votre commande', `<div class="o3d__ticket" style="border:0;padding:0">${ticketHTML()}</div>`);
      const edit = $('#o3dEdit');
      if (edit) edit.addEventListener('click', () => { closeModal(); bindCart.open(); });
    } finally {
      btn.innerHTML = label;
      renderCart();
    }
  }

  /* =======================================================
     MODALES (pages du footer)
     ======================================================= */
  const radios = (name, opts, type = 'radio') => `<div class="radios">${opts.map((o, i) => `<label><input type="${type}" name="${name}" value="${o}"${type === 'radio' && i === 0 ? ' checked' : ''}><span>${o}</span></label>`).join('')}</div>`;
  const field = (label, name, type = 'text', full = false, extra = '') => `<div class="${full ? 'full' : ''}"><label for="f-${name}">${label}</label><div class="field">${type === 'textarea' ? `<textarea id="f-${name}" name="${label}" rows="4" ${extra}></textarea>` : `<input id="f-${name}" name="${label}" type="${type}" ${extra}>`}</div></div>`;
  const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const mailNote = `<p class="form-note">L'envoi ouvre votre messagerie avec le formulaire pré-rempli, à destination de ${INFO.email}.</p>`;
  const submit = `<button class="btn btn--dark full" type="submit" style="justify-self:start;margin-top:16px">Envoyer ${ARROW}</button>`;
  const LEVELS = ['Très satisfaisant', 'Satisfaisant', 'Moyen', 'Insatisfaisant', 'Très insatisfaisant'];

  const MODALS = {
    charte: ['Charte qualité', `<p>Toujours soucieux de la qualité de ses produits, Pizza Food a mis en place une charte qualité répondant à 3 critères :</p>
      <h4>La sélection des produits</h4><p>La qualité des produits servis faisant la force de son concept, Pizza Food a toujours eu pour principe de sélectionner les meilleurs produits. Plusieurs livraisons par semaine assurent une qualité constante et permettent à Pizza Food de vous apporter des produits savoureux chez vous.</p>
      <h4>Traçabilité des produits</h4><p>Pizza Food vérifie scrupuleusement tous ses produits à chaque livraison et entretient des relations régulières avec des fournisseurs sélectionnés pour la qualité des produits.</p>
      <h4>Respect de la chaîne du froid</h4><p>Pizza Food exerce un contrôle minutieux sur ses produits. Ainsi, tous les produits frais et surgelés qu'utilise Pizza Food sont des produits livrés par camion frigorifique, et respectant la chaîne du froid.</p>`],
    fidelite: ['Programme de fidélité', `<p class="quote">Votre fidélité chez nous est récompensée…</p><h4>Une fidélité récompensée</h4><p>Transformez vos points en cadeaux ! Consultez votre compte pour suivre vos points.</p><p><a class="btn btn--dark" href="carte.html">Commander ${ARROW}</a></p>`],
    mobile: ['Mobile', `<p class="quote">Choisissez, commandez, c'est livré.</p><p>Commandez à partir de votre mobile sur notre nouvelle interface. Quelle que soit la marque de votre mobile, pas d'application à télécharger : juste une adresse à composer, <b>pizza-food.fr</b>.</p>`],
    mentions: ['Mentions légales', () => DATA.legal.mentions || ''],
    cgv: ['C.G.V', () => DATA.legal.cgv || ''],
    contact: ['Contact', `<p><b>Pizza Food</b><br>${INFO.address}<br>${INFO.city}<br>Tél : <a href="${INFO.tel1Href}">${INFO.tel1}</a> · <a href="${INFO.tel2Href}">${INFO.tel2}</a><br>E-mail : <a href="mailto:${INFO.email}">${INFO.email}</a></p>
      <form class="form" data-mail="Contact depuis le site">
        ${field('Nom', 'nom', 'text', false, 'required autocomplete="family-name"')}${field('Prénom', 'prenom', 'text', false, 'autocomplete="given-name"')}
        ${field('E-mail', 'email', 'email', false, 'required autocomplete="email"')}${field('Téléphone', 'tel', 'tel', false, 'autocomplete="tel"')}
        ${field('Objet', 'objet', 'text', true)}${field('Commentaires', 'com', 'textarea', true, 'required')}${submit}${mailNote}
      </form>`],
    recrutement: ['Recrutement', `<h4>Une entreprise qui se développe et qui développe ses collaborateurs</h4>
      <p>La recherche de l'excellence passe en premier lieu par le recrutement le plus adapté et l'accompagnement de nos collaborateurs dans le développement de leur carrière.</p>
      <h4>Intégrer Pizza Food, c'est intégrer</h4>
      <p>Une entreprise qui va de l'avant, qui évolue grâce à ses innovations produits, au dynamisme et à la motivation des équipes qui la composent. Une entreprise qui offre de véritables opportunités de carrières. Une entreprise qui met en œuvre une politique sociale axée sur la formation et sur la confiance qu'elle accorde au potentiel de chacun.</p>
      <form class="form" data-mail="Candidature">
        <div class="full"><label>Civilité</label>${radios('Civilité', ['Madame', 'Mademoiselle', 'Monsieur'])}</div>
        ${field('Nom', 'rnom', 'text', false, 'required')}${field('Prénom', 'rprenom', 'text', false, 'required')}
        ${field('Adresse mail', 'rmail', 'email', false, 'required')}${field('Date de naissance', 'rnaiss', 'date')}
        ${field('Adresse', 'radr', 'text', true)}${field('Code postal', 'rcp', 'text', false, 'inputmode="numeric"')}${field('Ville', 'rville')}
        ${field('Téléphone 1', 'rtel1', 'tel', false, 'required')}${field('Téléphone 2', 'rtel2', 'tel')}
        <div class="full"><label>Vous recherchez</label>${radios('Vous recherchez', ['Temps plein', 'Temps partiel'])}</div>
        <div><label>Disponibilités (matin)</label>${radios('Matin', DAYS, 'checkbox')}</div><div><label>Disponibilités (soir)</label>${radios('Soir', DAYS, 'checkbox')}</div>
        ${submit}${mailNote}
      </form>`],
    appreciation: ['Votre appréciation', `<p>Toujours dans le but d'améliorer notre qualité de service, et de satisfaire pleinement vos attentes, nous attachons une grande importance à votre appréciation.</p>
      <form class="form" data-mail="Votre appréciation">
        <div class="full"><label>Civilité</label>${radios('Civilité', ['Madame', 'Mademoiselle', 'Monsieur'])}</div>
        ${field('Nom', 'anom', 'text', false, 'required')}${field('Prénom', 'aprenom')}${field('Votre e-mail', 'amail', 'email', true, 'required')}
        <div class="full"><label>Sujet</label>${radios('Sujet', ['Idées et questions', "J'ai aimé…", "Je n'ai pas aimé…"])}</div>
        <div class="full"><label>Restaurant concerné</label>${radios('Restaurant concerné', ['Site web', 'Pizza Food'])}</div>
        ${field('Commentaires', 'acom', 'textarea', true, 'required')}
        <div class="full"><label>Appréciation globale</label>${radios('Appréciation globale', LEVELS)}</div>
        <div class="full"><label>Rapport qualité/prix</label>${radios('Rapport qualité/prix', LEVELS)}</div>
        <div class="full"><label>Recommanderiez-vous ce restaurant à un ami ?</label>${radios('Recommandation', ['Oui', 'Non'])}</div>
        ${submit}${mailNote}
      </form>`],
    allergenes: ['Allergènes', () => {
      const a = DATA.allergens;
      return `<p><b>Allergènes dans les produits Pizza Food — carte 2026 (France).</b> Légende : « X » = présence.</p>
        <p>Ces informations ont été établies sur la base des déclarations de nos fournisseurs à propos de la composition de leurs produits. Outre les présences signalées dans le tableau, nous ne pouvons pas exclure une présence accidentelle d'autres ingrédients allergènes qui serait apparue lors de la fabrication des produits chez nos fournisseurs ou lors de leur manipulation dans nos restaurants.</p>
        <div class="allergens-wrap"><table class="allergens"><thead><tr><th scope="col">Produit</th>${a.cols.map(c => `<th scope="col">${esc(c)}</th>`).join('')}</tr></thead>
        <tbody>${a.rows.map(([n, bits]) => `<tr><th scope="row">${esc(n)}</th>${[...bits].map(b => `<td class="${b === '1' ? 'on' : ''}">${b === '1' ? 'X' : ''}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    }]
  };

  let modalLast;
  function openModal(title, html) {
    modalLast = document.activeElement;
    $('#modalTitle').textContent = title;
    $('#modalBody').innerHTML = html;
    $('#modalBody').scrollTop = 0;
    const m = $('#modal'); m.classList.add('is-open'); m.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');
    $('#modalClose').focus();
  }
  function closeModal() {
    const m = $('#modal'); m.classList.remove('is-open'); m.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-locked');
    if (modalLast && modalLast.focus) modalLast.focus();
  }
  function bindModals() {
    document.addEventListener('click', e => {
      const t = e.target.closest('[data-modal]');
      if (!t) return;
      e.preventDefault();
      const [title, body] = MODALS[t.dataset.modal];
      openModal(title, typeof body === 'function' ? body() : body);
    });
    $('#modalClose').addEventListener('click', closeModal);
    $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      if ($('#modal').classList.contains('is-open')) closeModal();
      else if ($('#cart').classList.contains('is-open')) bindCart.close();
      else if ($('#mmenu').classList.contains('is-open')) toggleMenu(false);
    });
    document.addEventListener('submit', e => {
      const form = e.target.closest('form[data-mail]');
      if (!form) return;
      e.preventDefault();
      if (!form.reportValidity()) return;
      const lines = [];
      for (const [k, v] of new FormData(form).entries()) if (String(v).trim()) lines.push(`${k} : ${v}`);
      window.location.href = `mailto:${INFO.email}?subject=${encodeURIComponent(form.dataset.mail + ' — pizza-food.fr')}&body=${encodeURIComponent(lines.join('\n'))}`;
      toast('Votre messagerie s’ouvre…');
    });
    $('#newsForm').addEventListener('submit', e => {
      e.preventDefault();
      const email = $('#nEmail');
      if (!email.value || !email.checkValidity()) { email.focus(); toast('Indiquez un e-mail valide'); return; }
      const body = `Bonjour,\nJe souhaite m'inscrire à la newsletter Pizza Food.\nE-mail : ${email.value}\nMobile : ${$('#nMobile').value}`;
      window.location.href = `mailto:${INFO.email}?subject=${encodeURIComponent('Inscription newsletter')}&body=${encodeURIComponent(body)}`;
      toast('Votre messagerie s’ouvre…');
    });
  }

  function toggleMenu(force) {
    const mm = $('#mmenu'), b = $('#burger');
    const open = typeof force === 'boolean' ? force : !mm.classList.contains('is-open');
    mm.classList.toggle('is-open', open); mm.setAttribute('aria-hidden', !open);
    b.setAttribute('aria-expanded', open);
    document.body.classList.toggle('is-locked', open);
  }

  /* =======================================================
     PIZZAS & PRODUITS
     ======================================================= */
  function media(p) {
    return p.cat.pizza
      ? `<div class="pz" data-pz="${p.id}" data-cursor="Croque !">${PZ.photoPizza(p.img, esc(p.n))}</div>`
      : `<img src="${p.img}" alt="${esc(p.n)}" loading="lazy" data-thing="${p.id}">`;
  }
  function activate(root = document) {
    $$('.pz[data-pz]:not([data-on])', root).forEach(el => { el.dataset.on = '1'; PZ.register(el, PZ.bitsFor(PRODUCTS[el.dataset.pz])); });
    $$('img[data-thing]:not([data-on])', root).forEach(img => {
      img.dataset.on = '1';
      let last = 0;
      const pop = () => {
        const now = performance.now();
        if (now - last < 700) return;
        last = now;
        const r = img.getBoundingClientRect();
        PZ.burst(r.left + r.width / 2, r.top + r.height / 2, PZ.bitsFor(PRODUCTS[img.dataset.thing]), { count: 18, power: 9 });
      };
      img.addEventListener('pointerenter', pop);
      img.addEventListener('pointerdown', pop);
    });
  }
  const sizeChips = p => p.s
    ? Object.entries(p.s).map(([sz, pr]) => `<button class="chip" data-add="${p.id}" data-size="${sz}" aria-label="Ajouter ${esc(p.n)} ${sz}, ${euro(pr)}"><small>${sz}</small><b>${euro(pr).replace(/\s/g, '')}</b></button>`).join('')
    : `<button class="chip" data-add="${p.id}" data-size="" aria-label="Ajouter ${esc(p.n)}, ${euro(p.p)}">Ajouter</button>`;

  function cardHTML(p, i) {
    return `<article class="card" data-id="${p.id}" style="--i:${i}">
      <div class="card__media">${media(p)}</div>
      <h3 class="card__name">${esc(p.n)}</h3>
      <p class="card__desc">${esc(p.d || p.cat.label)}</p>
      <div class="card__foot">${p.s ? '' : `<span class="card__price">${euro(p.p)}</span>`}<div class="sizes">${sizeChips(p)}</div></div>
    </article>`;
  }

  function renderStars() {
    const el = $('#starsGrid');
    if (!el) return;
    const picks = [['80', 'La classique'], ['120', 'Sucré-salé'], ['85', 'Pepperoni'], ['304', 'Truffe'], ['307', 'Curry'], ['104', 'Mega viande']];
    el.innerHTML = picks.map(([id, tag], i) => {
      const p = PRODUCTS[id];
      const short = p.d.replace(/^(Sauce \w+|Crème fraîche), (fromage|mozzarella), /i, '').replace(/\.$/, '');
      return `<article class="star" data-reveal="up" style="--d:${(i % 3) * 120}ms">
        <div class="star__burst">${burstSVG(14 + (i % 3) * 3, 41)}<span class="star__tag">${tag}</span>${media(p)}</div>
        <h3 class="star__name">${esc(p.n)}</h3>
        <p class="star__desc">${esc(short.charAt(0).toUpperCase() + short.slice(1))}.</p>
        <div class="sizes">${sizeChips(p)}</div>
      </article>`;
    }).join('');
  }

  function renderEnvieLinks() {
    $$('[data-envies-links]').forEach(el => {
      el.innerHTML = ENVIES.map(([label, re], i) => {
        const [c, t] = STICKER[i % STICKER.length];
        return `<a class="envie" href="carte.html?envie=${encodeURIComponent(label)}#envies" style="--c:${c};--t:${t};--r:${((i * 37) % 11) - 5}deg" data-cursor="Voir">${label}<small>${envieMatches(re).length}</small></a>`;
      }).join('');
    });
  }

  function renderZones() {
    const el = $('#zonesList');
    if (!el) return;
    el.innerHTML = ZONES.map(([n, cp], i) => {
      const [c, t] = i === 0 ? ['var(--orange)', 'var(--yellow)'] : STICKER[i % STICKER.length];
      return `<li class="zone${i === 0 ? ' zone--hq' : ''}" data-cp="${cp}" style="--i:${i};--c:${c};--t:${t};--r:${((i * 29) % 11) - 5}deg" data-cursor="Livré !">${n}<small>${cp}</small></li>`;
    }).join('');
    const form = $('#checkForm'), input = $('#cpInput'), res = $('#checkRes');
    if (!form) return;
    const check = () => {
      const v = input.value.trim().toLowerCase();
      $$('.zone').forEach(z => z.classList.remove('is-match'));
      if (!v) { res.innerHTML = ''; return; }
      const hits = ZONES.filter(([n, cp]) => cp === v || (v.length > 2 && norm(n).includes(norm(v))));
      if (hits.length) {
        hits.forEach(([, cp]) => $$(`.zone[data-cp="${cp}"]`).forEach(z => z.classList.add('is-match')));
        res.innerHTML = `<b>On vous livre !</b><span>${hits.map(h => h[0] + ' (' + h[1] + ')').join(', ')} : livraison gratuite en 40 minutes, dès ${euro(INFO.minimum)} de commande.</span>`;
        const r = input.getBoundingClientRect();
        PZ.burst(r.left + r.width / 2, r.top, ['star', 'pepperoni', 'basil', 'olive', 'cheese'], { count: 30, power: 11 });
      } else if (/^\d{5}$/.test(v) || v.length > 2) {
        res.innerHTML = `<b>Hors zone…</b><span>Pas de livraison ici pour l'instant, mais votre commande peut être à emporter au ${INFO.address} : <a href="#emporter">1 pizza achetée = la 2e offerte</a>.</span>`;
      }
    };
    form.addEventListener('submit', e => { e.preventDefault(); check(); });
    input.addEventListener('input', () => { const v = input.value.trim(); if (v.length >= 5 || !v || /\D/.test(v)) check(); });
  }

  function renderCarte() {
    const wrap = $('#menu');
    if (!wrap) return;
    $('#catbar').innerHTML = DATA.cats.map(c => `<a href="#cat-${c.id}" data-cat="${c.id}">${c.label}<sup>${c.items.length}</sup></a>`).join('');
    const countTxt = (c, n) => `${n} produit${n > 1 ? 's' : ''}${c.pizza ? ' · Junior / Senior / Mega' : ''}`;
    wrap.innerHTML = DATA.cats.map(c => `<section class="cat" id="cat-${c.id}" data-cat="${c.id}">
        <div class="cat__head"><h2 class="title-3d title-3d--md" data-split>${c.label}</h2><span class="cat__count" data-count-cat>${countTxt(c, c.items.length)}</span></div>
        <div class="grid">${c.items.map((it, i) => cardHTML(PRODUCTS[it.id], i)).join('')}</div>
      </section>`).join('') + `<div class="empty-msg" id="emptyMsg"><p class="title-3d title-3d--sm">Aucun produit</p></div>`;

    const box = $('#enviesBtns');
    box.innerHTML = ENVIES.map(([label, re], i) => {
      const [c, t] = STICKER[i % STICKER.length];
      return `<button type="button" class="envie" data-envie="${i}" aria-pressed="false" style="--c:${c};--t:${t};--r:${((i * 37) % 11) - 5}deg">${label}<small>${envieMatches(re).length}</small></button>`;
    }).join('');
    let active = -1;
    const apply = (idx, scroll, fromEl) => {
      active = idx;
      $$('.envie', box).forEach((b, i) => b.setAttribute('aria-pressed', i === idx));
      const status = $('#enviesStatus');
      if (idx < 0) {
        $$('.card', wrap).forEach(c => { c.classList.remove('is-hidden', 'is-pop'); const p = PRODUCTS[c.dataset.id]; $('.card__desc', c).textContent = p.d || p.cat.label; });
        $$('.cat', wrap).forEach(s => { s.classList.remove('is-hidden'); const c = DATA.cats.find(x => x.id === s.dataset.cat); $('[data-count-cat]', s).textContent = countTxt(c, c.items.length); });
        status.innerHTML = 'Choisissez un ingrédient : on vous montre tous les produits qui en contiennent.';
        $('#emptyMsg').classList.remove('is-on');
        try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) { /* file:// */ }
        return;
      }
      const [label, re] = ENVIES[idx];
      let total = 0, k = 0;
      $$('.cat', wrap).forEach(s => {
        let n = 0;
        $$('.card', s).forEach(card => {
          const p = PRODUCTS[card.dataset.id];
          const hit = re.test(norm(p.n + ' ' + p.d));
          card.classList.toggle('is-hidden', !hit);
          card.classList.remove('is-pop');
          $('.card__desc', card).innerHTML = hit ? markTerm(p.d || '', re) : esc(p.d || p.cat.label);
          if (hit) { n++; void card.offsetWidth; card.style.setProperty('--i', k++); card.classList.add('is-pop'); }
        });
        s.classList.toggle('is-hidden', !n);
        $('[data-count-cat]', s).textContent = `${n} avec ${label.toLowerCase()}`;
        total += n;
      });
      status.innerHTML = `<b>${total} produit${total > 1 ? 's' : ''}</b> avec ${label.toLowerCase()} · <button type="button" id="enviesReset">tout afficher</button>`;
      $('#emptyMsg').classList.toggle('is-on', !total);
      try { history.replaceState(null, '', `?envie=${encodeURIComponent(label)}${location.hash}`); } catch (e) { /* file:// */ }
      if (fromEl) { const r = fromEl.getBoundingClientRect(); PZ.burst(r.left + r.width / 2, r.top + r.height / 2, PZ.bitsFor({ n: label, d: label, cat: { pizza: true } }), { count: 24, power: 10 }); }
      if (scroll) setTimeout(() => wrap.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }), 250);
    };
    box.addEventListener('click', e => { const b = e.target.closest('[data-envie]'); if (b) apply(+b.dataset.envie === active ? -1 : +b.dataset.envie, true, b); });
    document.addEventListener('click', e => { if (e.target.id === 'enviesReset') apply(-1); });
    const q = new URLSearchParams(location.search).get('envie');
    apply(q ? ENVIES.findIndex(([l]) => norm(l) === norm(q)) : -1, false);

    const links = $$('#catbar a');
    const spy = new IntersectionObserver(entries => entries.forEach(en => {
      if (!en.isIntersecting) return;
      links.forEach(a => {
        const on = a.dataset.cat === en.target.dataset.cat;
        a.classList.toggle('is-active', on);
        if (on) { const bar = a.parentElement; bar.scrollTo({ left: a.offsetLeft - bar.clientWidth / 2 + a.offsetWidth / 2, behavior: reduceMotion ? 'auto' : 'smooth' }); }
      });
    }), { rootMargin: '-45% 0px -50% 0px' });
    $$('.cat', wrap).forEach(s => spy.observe(s));
  }

  function heroPizza() {
    $$('[data-svgpizza]').forEach(el => {
      const p = PRODUCTS[el.dataset.svgpizza] || { n: 'Pizza Food', d: 'Sauce tomate, fromage, pepperoni, champignons, olives, poivrons.', cat: { pizza: true } };
      const rec = PZ.recipe(p);
      if (!el.dataset.svgpizza) rec.toppings = ['pepperoni', 'olive', 'basil', 'mushroom', 'pepper'];
      el.innerHTML = PZ.svgPizza(rec, el.dataset.label || '');
      if (el.dataset.interactive !== 'off') PZ.register(el, [...new Set(rec.toppings.concat(['cheese', 'basil']))]);
    });
  }

  /* =======================================================
     AVIS GOOGLE
     Avec une clé (js/config.js) : avis importés en direct via
     Google Maps JavaScript API (Places). Sans clé : lien vers
     la fiche Google, aucun avis n'est inventé.
     ======================================================= */
  const MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Pizza Food 34 Rue du Général de Gaulle 94430 Chennevières-sur-Marne');
  const starsTxt = n => '★★★★★'.slice(0, Math.round(n)) + '☆☆☆☆☆'.slice(0, 5 - Math.round(n));

  function reviewsFallback(body, reason) {
    body.innerHTML = `<div class="reviews__empty">
      <p>Retrouvez les avis de nos clients et donnez le vôtre directement sur notre fiche Google.</p>
      <div class="reviews__btns">
        <a class="btn btn--dark" href="${MAPS_URL}" target="_blank" rel="noopener" data-cursor="Avis">Voir les avis</a>
        <a class="btn btn--pill" href="${MAPS_URL}" target="_blank" rel="noopener" data-cursor="Merci !">Laisser un avis</a>
      </div>
      ${reason ? `<p class="reviews__source">${reason}</p>` : ''}
    </div>`;
  }

  function reviewsCarousel(body, place) {
    const reviews = (place.reviews || []).filter(r => r.text);
    $('#reviewsSummary').innerHTML = place.rating
      ? `<b>${place.rating.toFixed(1).replace('.', ',')}</b><span class="stars" aria-hidden="true">${starsTxt(place.rating)}</span><span>${place.userRatingCount || ''} avis</span>`
      : 'Ce que nos clients disent de nous';
    if (!reviews.length) { reviewsFallback(body); return; }
    body.innerHTML = `<div class="reviews__viewport"><div class="reviews__track">${reviews.map(r => {
      const who = r.authorAttribution || {};
      const name = esc(who.displayName || 'Client Google');
      const avatar = who.photoURI ? `<img src="${esc(who.photoURI)}" alt="" referrerpolicy="no-referrer" loading="lazy">` : `<span class="review__avatar">${name.charAt(0)}</span>`;
      return `<figure class="review">
        <figcaption class="review__who">${avatar}<span><span class="review__name">${name}</span><br><span class="review__when">${esc(r.relativePublishTimeDescription || '')}</span></span></figcaption>
        <span class="stars" aria-label="${r.rating} sur 5">${starsTxt(r.rating || 5)}</span>
        <blockquote class="review__text">${esc(r.text)}</blockquote>
      </figure>`;
    }).join('')}</div></div>
    <div class="reviews__nav">
      <div class="reviews__dots">${reviews.map((_, i) => `<button type="button" aria-label="Avis ${i + 1}" data-rv="${i}"></button>`).join('')}</div>
      <a class="reviews__source" href="${esc(place.googleMapsURI || MAPS_URL)}" target="_blank" rel="noopener">Avis publiés sur Google</a>
      <div class="reviews__arrows"><button type="button" data-rvstep="-1" aria-label="Avis précédent">←</button><button type="button" data-rvstep="1" aria-label="Avis suivant">→</button></div>
    </div>`;
    const track = $('.reviews__track', body), dots = $$('[data-rv]', body);
    let i = 0, timer;
    const go = n => {
      i = (n + reviews.length) % reviews.length;
      track.style.transform = `translateX(${-i * 100}%)`;
      dots.forEach((d, k) => d.setAttribute('aria-current', k === i));
    };
    const auto = () => { clearInterval(timer); if (!reduceMotion) timer = setInterval(() => go(i + 1), 6000); };
    body.addEventListener('click', e => {
      const d = e.target.closest('[data-rv]'), st = e.target.closest('[data-rvstep]');
      if (d) { go(+d.dataset.rv); auto(); }
      if (st) { go(i + +st.dataset.rvstep); auto(); }
    });
    body.addEventListener('pointerenter', () => clearInterval(timer));
    body.addEventListener('pointerleave', auto);
    go(0); auto();
  }

  async function renderReviews() {
    const body = $('#reviewsBody');
    if (!body) return;
    const cfg = window.PF_CONFIG || {};
    if (!cfg.googleMapsKey) { reviewsFallback(body); return; }
    body.innerHTML = '<p class="reviews__source">Chargement des avis Google…</p>';
    try {
      if (!(window.google && google.maps && google.maps.importLibrary)) {
        await new Promise((res, rej) => {
          window.__pfMaps = res;
          const sc = document.createElement('script');
          sc.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(cfg.googleMapsKey)}&v=weekly&loading=async&language=fr&callback=__pfMaps`;
          sc.async = true; sc.onerror = rej;
          document.head.appendChild(sc);
          setTimeout(() => rej(new Error('timeout')), 10000);
        });
      }
      const { Place } = await google.maps.importLibrary('places');
      let id = cfg.googlePlaceId;
      if (!id) {
        const { places } = await Place.searchByText({ textQuery: cfg.googlePlaceQuery, fields: ['id'], maxResultCount: 1, language: 'fr' });
        if (!places || !places.length) throw new Error('fiche introuvable');
        id = places[0].id;
      }
      const place = new Place({ id, requestedLanguage: 'fr' });
      await place.fetchFields({ fields: ['rating', 'userRatingCount', 'reviews', 'googleMapsURI'] });
      reviewsCarousel(body, place);
    } catch (e) {
      reviewsFallback(body, 'Les avis n’ont pas pu être chargés depuis Google.');
    }
  }

  /* =======================================================
     OUVERT / FERMÉ
     ======================================================= */
  function updateOpen() {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date()).map(p => [p.type, p.value]));
    const day = parts.weekday, mins = (+parts.hour % 24) * 60 + +parts.minute;
    const open = day !== 'Sun' && mins >= 660 && mins < 1380;
    let txt;
    if (open) txt = 'Ouvert maintenant · jusqu’à 23h';
    else if (day === 'Sun' || (day === 'Sat' && mins >= 1380)) txt = 'Fermé · réouverture lundi 11h';
    else if (mins < 660) txt = 'Fermé · ouvre à 11h';
    else txt = 'Fermé · réouverture demain 11h';
    $$('[data-open]').forEach(el => { el.classList.toggle('is-closed', !open); el.innerHTML = `<i></i>${txt}`; });
  }

  /* =======================================================
     ANIMATIONS
     ======================================================= */
  function splitText(el) {
    if (el.classList.contains('split')) return;
    const label = el.textContent.replace(/\s+/g, ' ').trim();
    let i = 0;
    const walk = node => {
      const frag = document.createDocumentFragment();
      node.childNodes.forEach(ch => {
        if (ch.nodeType === 3) {
          ch.textContent.split(/( )/).forEach(part => {
            if (part === ' ') { frag.appendChild(document.createTextNode(' ')); return; }
            if (!part) return;
            const w = document.createElement('span'); w.className = 'word';
            [...part].forEach(c => { const s = document.createElement('span'); s.className = 'char'; s.textContent = c; s.style.setProperty('--i', i++); w.appendChild(s); });
            frag.appendChild(w);
          });
        } else if (ch.nodeType === 1 && ch.tagName !== 'BR') { const c = ch.cloneNode(false); c.appendChild(walk(ch)); frag.appendChild(c); }
        else frag.appendChild(ch.cloneNode(true));
      });
      return frag;
    };
    const inner = walk(el);
    el.textContent = '';
    const wrap = document.createElement('span'); wrap.setAttribute('aria-hidden', 'true'); wrap.appendChild(inner);
    el.appendChild(wrap);
    if (!el.closest('[aria-label]')) el.setAttribute('aria-label', label);
    el.classList.add('split');
  }

  function hydrate() {
    $$('[data-burst]').forEach(el => { el.insertAdjacentHTML('afterbegin', burstSVG(+el.dataset.burst || 18, +el.dataset.inner || 40)); });
    $$('[data-zigzag]').forEach(pl => {
      const [w, h, n] = pl.dataset.zigzag.split(',').map(Number), horiz = pl.hasAttribute('data-h');
      const pts = [];
      for (let i = 0; i <= n; i++) pts.push(horiz ? `${f1((i / n) * w)},${i % 2 ? h - 4 : 4}` : `${i % 2 ? w - 4 : 4},${f1((i / n) * h)}`);
      pl.setAttribute('points', pts.join(' '));
      try { pl.style.setProperty('--len', Math.ceil(pl.getTotalLength() + 10)); } catch (e) { /* noop */ }
    });
    $$('[data-split], .title-3d').forEach(splitText);
  }

  function startReveals() {
    const targets = $$('[data-reveal], .split:not(.hero__line), .zigzag, .zones, .number');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      targets.concat($$('.hero__line')).forEach(t => t.classList.add('is-in'));
      $$('[data-count]').forEach(el => { el.textContent = el.dataset.count; });
      return;
    }
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      $$('[data-count]', en.target).forEach(countUp);
      if (en.target.matches('.zones')) setTimeout(() => en.target.classList.add('settled'), 1600);
      io.unobserve(en.target);
    }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(t => io.observe(t));
    $$('.hero__line').forEach(t => t.classList.add('is-in'));
  }
  function countUp(el) {
    const target = +el.dataset.count, t0 = performance.now(), suf = el.dataset.suffix || '';
    const tick = now => { const p = clamp((now - t0) / 1400); el.textContent = Math.round(target * (1 - Math.pow(1 - p, 4))) + suf; if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }

  function setupMarquees() {
    return $$('[data-marquee]').map(m => {
      const track = $('.marquee__track', m);
      m.setAttribute('aria-hidden', 'true');
      const original = track.innerHTML;
      let guard = 0;
      while (track.scrollWidth < innerWidth * 1.6 && guard++ < 12) track.innerHTML += original;
      track.innerHTML += track.innerHTML;
      return { track, dir: +m.dataset.marquee, x: 0, half: track.scrollWidth / 2 };
    });
  }

  function setupPointer() {
    if (!finePointer || reduceMotion) return null;
    document.documentElement.classList.add('has-cursor');
    const el = $('#cursor'), lbl = $('#cursorLabel');
    document.addEventListener('pointerover', e => {
      const t = e.target.closest('[data-cursor], a, button, label');
      el.classList.toggle('is-big', !!t);
      lbl.textContent = t ? (t.dataset.cursor || 'Clic') : '';
    });
    document.addEventListener('pointerdown', () => el.classList.add('is-down'));
    document.addEventListener('pointerup', () => el.classList.remove('is-down'));
    document.addEventListener('mouseleave', () => { el.style.opacity = 0; });
    document.addEventListener('mouseenter', () => { el.style.opacity = 1; });
    $$('.magnetic').forEach(m => {
      m.addEventListener('pointermove', e => { const r = m.getBoundingClientRect(); m.style.translate = `${(e.clientX - r.left - r.width / 2) * .3}px ${(e.clientY - r.top - r.height / 2) * .4}px`; });
      m.addEventListener('pointerleave', () => { m.style.translate = '0 0'; });
    });
    // Clic dans le vide : petite pluie d'ingrédients
    document.addEventListener('pointerdown', e => {
      if (e.target.closest('a, button, input, textarea, label, .pz, img, .cart, .modal, .o3d')) return;
      PZ.burst(e.clientX, e.clientY, ['pepperoni', 'basil', 'olive', 'cheese', 'tomato', 'mushroom'], { count: 10, power: 7 });
    });
    return el;
  }

  function loop(marquees, cursorEl) {
    const nav = $('#nav'), bar = $('#progress'), toTop = $('#toTop');
    const heroWrap = $('#heroPizzaWrap'), hero = $('.hero');
    const floaties = $$('.floaty'), speedEls = $$('[data-speed]');
    const hSec = $('.hscroll'), hTrack = $('.hscroll__track'), hPanels = hTrack ? $$('.hpanel', hTrack) : [];
    const mani = $('#manifesto');
    let maniWords = [];
    if (mani) {
      const HL = /^(fromage|gratuite|Mega)/i;
      const words = mani.textContent.trim().split(/\s+/);
      mani.setAttribute('aria-label', mani.textContent.trim());
      mani.innerHTML = '<span aria-hidden="true">' + words.map(w => `<span class="w${HL.test(w) ? ' hl' : ''}">${w}</span>`).join(' ') + '</span>';
      maniWords = $$('.w', mani);
    }
    const mouse = { x: innerWidth / 2, y: innerHeight / 2, nx: 0, ny: 0 }, cpos = { ...mouse };
    addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.nx = e.clientX / innerWidth * 2 - 1; mouse.ny = e.clientY / innerHeight * 2 - 1; }, { passive: true });
    let lastY = scrollY, vel = 0, dir = 1, hDist = 0;
    const size = () => {
      if (hSec) { hDist = Math.max(0, hTrack.scrollWidth - innerWidth); hSec.style.height = (hDist + innerHeight) + 'px'; }
      marquees.forEach(m => { m.half = m.track.scrollWidth / 2; });
    };
    size();
    addEventListener('resize', size);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(size);
    toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

    const frame = () => {
      const y = scrollY, vh = innerHeight, dy = y - lastY;
      vel = lerp(vel, dy, .2);
      if (Math.abs(dy) > .5) dir = dy > 0 ? 1 : -1;
      const max = document.documentElement.scrollHeight - vh, p = max > 0 ? y / max : 0;
      bar.style.transform = `scaleX(${p})`;
      toTop.style.setProperty('--p', p);
      toTop.classList.toggle('is-on', y > vh * .9);
      nav.classList.toggle('is-scrolled', y > 30);
      if (!$('#mmenu').classList.contains('is-open')) {
        if (dy > 6 && y > 400) nav.classList.add('is-hidden');
        else if (dy < -6 || y < 400) nav.classList.remove('is-hidden');
      }
      if (!reduceMotion) {
        if (heroWrap && hero && y < vh * 1.5) {
          const hp = clamp(y / hero.offsetHeight);
          heroWrap.style.transform = `rotate(${y * .2}deg) scale(${1 + hp * .25})`;
          heroWrap.style.setProperty('--scut', (hp * 40).toFixed(1));
        }
        floaties.forEach(el => { const d = +el.dataset.depth; el.style.translate = `${mouse.nx * d * 30}px ${mouse.ny * d * 30 - y * d * .35}px`; });
        speedEls.forEach(el => { const r = el.parentElement.getBoundingClientRect(); el.style.translate = `0 ${((r.top + r.height / 2 - vh / 2) * +el.dataset.speed).toFixed(1)}px`; });
        marquees.forEach(m => {
          m.x -= m.dir * dir * (1.2 + Math.min(Math.abs(vel) * .35, 30));
          if (m.x <= -m.half) m.x += m.half;
          if (m.x > 0) m.x -= m.half;
          m.track.style.transform = `translate3d(${m.x}px,0,0)`;
        });
        if (cursorEl) { cpos.x = lerp(cpos.x, mouse.x, .22); cpos.y = lerp(cpos.y, mouse.y, .22); cursorEl.style.translate = `${cpos.x}px ${cpos.y}px`; }
      }
      if (hSec) {
        const r = hSec.getBoundingClientRect();
        if (r.top < vh && r.bottom > 0) {
          const hp = clamp(-r.top / Math.max(1, r.height - vh));
          hTrack.style.transform = `translate3d(${-hp * hDist}px,0,0)`;
          hPanels.forEach(pn => { const pr = pn.getBoundingClientRect(); pn.style.setProperty('--p', reduceMotion ? 1 : (1 - clamp(Math.abs(pr.left + pr.width / 2 - innerWidth / 2) / innerWidth)).toFixed(3)); });
        }
      }
      if (mani) {
        const mr = mani.getBoundingClientRect();
        if (mr.top < vh && mr.bottom > 0) {
          const n = Math.round((reduceMotion ? 1 : clamp((vh * .85 - mr.top) / (mr.height + vh * .2))) * maniWords.length);
          maniWords.forEach((w, i) => w.classList.toggle('on', i < n));
        }
      }
      lastY = y;
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  /* =======================================================
     CHARGEMENT / TRANSITIONS
     ======================================================= */
  function curtain() {
    const c = $('#curtain');
    if (!c) return Promise.resolve();
    let seen = false;
    try { seen = sessionStorage.getItem('pf-seen') === '1'; sessionStorage.setItem('pf-seen', '1'); } catch (e) { /* noop */ }
    if (reduceMotion) { c.remove(); return Promise.resolve(); }
    if (seen) c.classList.add('is-quick');
    const count = $('#curtainCount');
    const t0 = performance.now(), minD = seen ? 300 : 1300;
    const fonts = document.fonts ? Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 2500))]) : Promise.resolve();
    const done = new Promise(res => {
      let ready = false;
      fonts.then(() => { ready = true; });
      const tick = now => {
        const e = now - t0;
        if (count) count.textContent = Math.round(Math.min(ready ? 1 : .9, e / minD) * 100);
        if ((ready || e > 3000) && e >= minD) { c.classList.add('is-up'); res(); } else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href]');
      if (!a || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      const href = a.getAttribute('href');
      if (!/^[\w-]+\.html/.test(href)) return;
      const same = href.split(/[?#]/)[0] === (location.pathname.split('/').pop() || 'index.html');
      if (same && href.includes('#') && !href.includes('?')) return;
      e.preventDefault();
      c.classList.add('is-quick'); c.classList.remove('is-up');
      setTimeout(() => { location.href = href; }, 620);
    });
    addEventListener('pageshow', e => { if (e.persisted) c.classList.add('is-up'); });
    return done;
  }

  /* =======================================================
     INITIALISATION
     ======================================================= */
  buildChrome();
  bindCart();
  bindModals();
  $('#burger').addEventListener('click', () => toggleMenu());
  $$('#mmenu a').forEach(a => a.addEventListener('click', () => toggleMenu(false)));

  renderStars();
  renderEnvieLinks();
  renderZones();
  renderCarte();
  heroPizza();
  activate();
  renderCart();
  renderReviews();
  updateOpen();
  setInterval(updateOpen, 60000);
  hydrate();

  const marquees = setupMarquees();
  const cursorEl = setupPointer();
  curtain().then(() => {
    startReveals();
    if (location.hash) { const t = document.getElementById(location.hash.slice(1)); if (t) setTimeout(() => t.scrollIntoView({ block: 'start' }), 60); }
  });
  loop(marquees, cursorEl);
})();
