/* =========================================================
   PIZZA FOOD — interactions, animations, panier & offres
   Vanilla JS, aucune dépendance. Les données (carte,
   allergènes, textes légaux) sont dans js/data.js.
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
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const escapeHTML = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // Surligne un terme trouvé dans le texte normalisé (sans accents) en gardant le texte d'origine
  const markTerm = (text, re) => {
    const m = new RegExp(re.source, 'g'), n = norm(text);
    let out = '', last = 0, r;
    while ((r = m.exec(n))) { out += escapeHTML(text.slice(last, r.index)) + '<mark>' + escapeHTML(text.slice(r.index, r.index + r[0].length)) + '</mark>'; last = r.index + r[0].length; }
    return out + escapeHTML(text.slice(last));
  };
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* stockage indisponible */ } }
  };
  const page = document.body.dataset.page;
  document.documentElement.classList.add('js');

  /* =======================================================
     DONNÉES
     ======================================================= */
  const DATA = window.PF_DATA || { cats: [], allergens: { cols: [], rows: [] }, legal: {} };
  const PRODUCTS = {};
  DATA.cats.forEach(cat => cat.items.forEach(it => { PRODUCTS[it.id] = Object.assign({ cat }, it); }));

  const INFO = {
    tel1: '01 45 94 29 50', tel1Href: 'tel:0145942950',
    tel2: '07 49 45 89 55', tel2Href: 'tel:0749458955',
    email: 'contact@pizza-food.fr',
    address: '34 rue du Général de Gaulle', city: '94430 Chennevières-sur-Marne',
    maps: 'https://www.google.com/maps/search/?api=1&query=34+Rue+du+General+de+Gaulle+94430+Chennevieres-sur-Marne',
    minimum: 15
  };

  const ZONES = [
    ['Chennevières-sur-Marne', '94430'], ['Bonneuil-sur-Marne', '94380'], ['Champigny-sur-Marne', '94500'],
    ['La Queue-en-Brie', '94510'], ['La Varenne Saint-Hilaire', '94210'], ['Le Plessis-Trévise', '94420'],
    ['Noiseau', '94880'], ['Ormesson-sur-Marne', '94490'], ['Saint-Maur-des-Fossés', '94100'],
    ['Sucy-en-Brie', '94370'], ['Villiers-sur-Marne', '94350']
  ];

  // « Vos Envies » : les 11 ingrédients du site, recherchés dans le nom + la description
  const ENVIES = [
    ['ANCHOIS', /anchois/], ['BOURSIN', /boursin/], ['CHAMPIGNONS', /champignon/], ['CHÈVRE', /chevre/],
    ['JAMBON', /jambon/], ['LARDONS', /lardon/], ['MERGUEZ', /merguez/], ['POULET PANÉ', /poulet pane/],
    ['SAUMON', /saumon/], ['THON', /\bthon\b/], ['VIANDE HACHÉE', /viande hachee/]
  ];
  const envieMatches = re => Object.values(PRODUCTS).filter(p => re.test(norm(p.n + ' ' + p.d)));

  const MODES = ['Livraison', 'À emporter', 'Sur place'];
  const OFFERS = {
    'Livraison': { every: 3, label: '2 pizzas achetées = la 3e offerte' },
    'À emporter': { every: 2, label: '1 pizza achetée = la 2e offerte' }
  };

  /* =======================================================
     PETITS GÉNÉRATEURS SVG
     ======================================================= */
  const f1 = n => n.toFixed(1);
  function burstPath(n = 18, r1 = 48, r2 = 39) {
    let d = '';
    for (let i = 0; i < n * 2; i++) {
      const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? r2 : r1;
      d += (i ? 'L' : 'M') + f1(Math.cos(a) * r) + ' ' + f1(Math.sin(a) * r);
    }
    return d + 'Z';
  }
  const burstSVG = (n = 18) => `<svg viewBox="-50 -50 100 100" aria-hidden="true"><path d="${burstPath(n)}"/></svg>`;
  const zigzagSVG = (n = 60) => {
    let pts = '';
    for (let i = 0; i <= n; i++) pts += `${f1((i / n) * 1000)},${i % 2 ? 12 : 2} `;
    return `<svg class="zz" viewBox="0 0 1000 14" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts.trim()}"/></svg>`;
  };
  const ICONS = {
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h17M14 6l6 6-6 6"/></svg>',
    fb: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8h3V4h-3c-2.8 0-4 1.8-4 4.3V10H7v4h3v8h4v-8h3l1-4h-4V8.6c0-.4.3-.6.6-.6z"/></svg>',
    ig: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7.3a4.7 4.7 0 1 0 0 9.4 4.7 4.7 0 0 0 0-9.4zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm4.9-8.9a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2zM21.9 7c-.1-1.6-.4-3-1.6-4.2S17.6 1.2 16 1.1C14.4 1 9.6 1 8 1.1 6.4 1.2 5 1.5 3.8 2.7S2.2 5.4 2.1 7C2 8.6 2 15.4 2.1 17c.1 1.6.4 3 1.6 4.2s2.6 1.6 4.2 1.7c1.6.1 6.4.1 8 0 1.6-.1 3-.4 4.2-1.7s1.6-2.6 1.7-4.2c.1-1.6.1-8.4.1-10zm-2.1 12.6a3.2 3.2 0 0 1-1.8 1.8c-1.3.5-4.3.4-5.7.4s-4.4.1-5.7-.4a3.2 3.2 0 0 1-1.8-1.8c-.5-1.3-.4-4.3-.4-5.7s-.1-4.4.4-5.7a3.2 3.2 0 0 1 1.8-1.8C6 3.9 9 4 10.4 4h1.6c1.4 0 4.4-.1 5.7.4a3.2 3.2 0 0 1 1.8 1.8c.5 1.3.4 4.3.4 5.7s.1 4.4-.4 5.7z"/></svg>',
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.8 2h3.3l-7.2 8.3L22.4 22h-6.6l-5.2-6.8L4.6 22H1.3l7.7-8.8L.9 2h6.8l4.7 6.2zm-1.2 18h1.8L6.5 3.9H4.5z"/></svg>',
    yt: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4l6.3 3.6z"/></svg>'
  };

  /* =======================================================
     ÉLÉMENTS COMMUNS (nav, footer, panier, modale)
     ======================================================= */
  function buildChrome() {
    const nav = (href, label, key) => `<a href="${href}"${page === key ? ' aria-current="page"' : ''}>${label}</a>`;
    document.body.insertAdjacentHTML('afterbegin', `
      <div class="progress" aria-hidden="true"><i id="progress"></i></div>
      <div class="cursor" id="cursor" aria-hidden="true"><span id="cursorLabel"></span></div>
      <header class="nav" id="nav">
        <a class="logo" href="index.html" aria-label="Pizza Food — accueil" data-cursor="Accueil">
          <span class="logo__mark">${burstSVG(14)}</span>
          <span class="logo__txt">Pizza<br>Food</span>
        </a>
        <nav class="nav__links" aria-label="Navigation principale">
          ${nav('index.html', 'Accueil', 'home')}
          ${nav('carte.html', 'La carte', 'carte')}
          ${nav('livraison.html', 'Livraison', 'livraison')}
          ${nav('carte.html#envies', 'Vos envies', '')}
        </nav>
        <div class="nav__right">
          <a class="nav__tel link" href="${INFO.tel1Href}" data-cursor="Appeler">${INFO.tel1}</a>
          <button class="btn nav__cart" id="cartBtn" aria-label="Ouvrir le panier" data-cursor="Panier"><span class="lbl">Commander</span><span class="count" id="cartCount">0</span></button>
          <button class="nav__burger" id="burger" aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="mmenu"><span></span><span></span><span></span></button>
        </div>
      </header>
      <div class="mmenu" id="mmenu" aria-hidden="true">
        <nav aria-label="Menu mobile">
          <a href="index.html">Accueil</a><a href="carte.html">La carte</a><a href="livraison.html">Livraison</a><a href="carte.html#envies">Vos envies</a>
        </nav>
        <a class="btn btn--light" href="${INFO.tel1Href}">Appeler le ${INFO.tel1}</a>
      </div>`);

    const flink = (label, attrs) => `<li>${attrs.startsWith('href') ? `<a ${attrs}>${label}</a>` : `<button type="button" ${attrs}>${label}</button>`}</li>`;
    document.body.insertAdjacentHTML('beforeend', `
      <footer class="footer">
        <div class="footer__top">
          <div class="news">
            <h3>Notre newsletter</h3>
            <p>Les nouveautés et les offres, en premier.</p>
            <form id="newsForm" novalidate>
              <div class="field"><label class="sr-only" for="nEmail">E-mail</label><input id="nEmail" name="email" type="email" placeholder="Votre e-mail" autocomplete="email" required></div>
              <div class="field"><label class="sr-only" for="nMobile">Mobile</label><input id="nMobile" name="mobile" type="tel" placeholder="Votre mobile" autocomplete="tel"></div>
              <button class="btn" type="submit" style="justify-self:start;margin-top:10px" data-cursor="OK">S'inscrire ${ICONS.arrow}</button>
            </form>
          </div>
          <div>
            <h3>Commander</h3>
            <ul class="flinks">
              ${flink('Zones de livraison', 'href="livraison.html"')}
              ${flink('À emporter', 'href="livraison.html#emporter"')}
              ${flink('Commander en ligne', 'href="carte.html"')}
              ${flink('Mobile', 'data-modal="mobile"')}
            </ul>
          </div>
          <div>
            <h3>La maison</h3>
            <ul class="flinks">
              ${flink('Charte qualité', 'data-modal="charte"')}
              ${flink('Programme de fidélité', 'data-modal="fidelite"')}
              ${flink('Votre appréciation', 'data-modal="appreciation"')}
              ${flink('Recrutement', 'data-modal="recrutement"')}
            </ul>
          </div>
          <div>
            <h3>Infos</h3>
            <ul class="flinks">
              ${flink('Contact', 'data-modal="contact"')}
              ${flink('Allergènes', 'data-modal="allergenes"')}
              ${flink('Mentions légales', 'data-modal="mentions"')}
              ${flink('C.G.V', 'data-modal="cgv"')}
            </ul>
            <div class="socials">
              <a href="https://www.facebook.com/Pizza-Food-1682159702074299" target="_blank" rel="noopener" aria-label="Facebook">${ICONS.fb}</a>
              <a href="https://www.instagram.com/pizzafood94430/" target="_blank" rel="noopener" aria-label="Instagram">${ICONS.ig}</a>
              <a href="https://twitter.com/pizzafood94430" target="_blank" rel="noopener" aria-label="X (Twitter)">${ICONS.x}</a>
              <a href="https://www.youtube.com/channel/UCCv9ak1TfnuyedFZNZe30Tw" target="_blank" rel="noopener" aria-label="YouTube">${ICONS.yt}</a>
            </div>
          </div>
        </div>
        <p class="footer__giant" id="giant" aria-label="Pizza Food">Pizza Food</p>
        <div class="footer__bottom">
          <span>© ${new Date().getFullYear()} Pizza Food — ${INFO.address}, ${INFO.city}</span>
          <span>${INFO.tel1} · ${INFO.tel2}</span>
        </div>
      </footer>

      <div class="overlay" id="overlay"></div>
      <aside class="cart" id="cart" aria-hidden="true" aria-label="Mon panier">
        <div class="cart__head"><h2>Panier</h2><button class="x" id="cartClose" aria-label="Fermer le panier">×</button></div>
        <div class="seg" role="group" aria-label="Type de commande">${MODES.map(m => `<button type="button" data-setmode="${m}" aria-pressed="false">${m}</button>`).join('')}</div>
        <p class="cart__hint" id="cartHint"></p>
        <ul class="cart__list" id="cartList"></ul>
        <div class="cart__empty"><p>Panier vide</p><a class="btn" href="carte.html">Voir la carte ${ICONS.arrow}</a></div>
        <div class="cart__foot">
          <p class="line"><span>Sous-total</span><span id="cartSub"></span></p>
          <p class="line line--disc" id="cartDiscLine" hidden><span id="cartDiscLbl">Offre</span><span id="cartDisc"></span></p>
          <p class="line"><span>Livraison</span><span id="cartShip"></span></p>
          <p class="line line--total"><span>Total</span><span id="cartTotal"></span></p>
          <p class="cart__warn" id="cartWarn" hidden></p>
          <button class="btn btn--hot btn--full" id="checkout" data-cursor="Miam">Valider ma commande ${ICONS.arrow}</button>
        </div>
      </aside>

      <div class="modal" id="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle" aria-hidden="true">
        <div class="modal__box">
          <div class="modal__head"><h2 id="modalTitle"></h2><button class="x" id="modalClose" aria-label="Fermer">×</button></div>
          <div class="modal__body" id="modalBody"></div>
        </div>
      </div>
      <div class="toast" id="toast" role="status" aria-live="polite"></div>`);
  }

  /* =======================================================
     PANIER + OFFRES
     ======================================================= */
  const cart = store.get('pf-cart-v2', { items: [], mode: 'Livraison' });
  if (!MODES.includes(cart.mode)) cart.mode = 'Livraison';
  cart.items = (cart.items || []).filter(i => PRODUCTS[i.id]);
  const saveCart = () => store.set('pf-cart-v2', cart);

  const unitPrice = it => {
    const p = PRODUCTS[it.id];
    return p.s ? p.s[it.size] : p.p;
  };
  // Offre valable sur les pizzas Senior et Mega, sauf la Marguerita
  const isEligible = it => {
    const p = PRODUCTS[it.id];
    return p.cat.pizza && (it.size === 'Senior' || it.size === 'Mega') && norm(p.n) !== 'marguerita';
  };

  function computeCart() {
    const sub = cart.items.reduce((s, i) => s + unitPrice(i) * i.qty, 0);
    const offer = OFFERS[cart.mode];
    const free = {};
    let disc = 0, eligibleCount = 0;
    if (offer) {
      const units = [];
      cart.items.forEach(i => { if (isEligible(i)) for (let k = 0; k < i.qty; k++) units.push({ key: i.key, price: unitPrice(i) }); });
      eligibleCount = units.length;
      // Les pizzas offertes sont les moins chères de chaque groupe
      units.sort((a, b) => b.price - a.price);
      units.forEach((u, idx) => {
        if ((idx + 1) % offer.every === 0) { disc += u.price; free[u.key] = (free[u.key] || 0) + 1; }
      });
    }
    const total = sub - disc;
    const count = cart.items.reduce((s, i) => s + i.qty, 0);
    return { sub, disc, total, free, count, offer, eligibleCount };
  }

  function addToCart(id, size, fromEl) {
    const key = id + '|' + (size || '');
    const found = cart.items.find(i => i.key === key);
    if (found) found.qty++;
    else cart.items.push({ key, id, size: size || '', qty: 1 });
    saveCart();
    const p = PRODUCTS[id];
    flyToCart(fromEl, p.img).then(() => {
      renderCart();
      const b = $('#cartBtn');
      b.classList.remove('is-bump'); void b.offsetWidth; b.classList.add('is-bump');
    });
    const c = computeCart();
    let msg = `+1 <b>${escapeHTML(p.n)}</b>${size ? ' ' + size : ''}`;
    if (c.offer && isEligible({ id, size })) {
      const left = c.offer.every - (c.eligibleCount % c.offer.every);
      msg += left === c.offer.every ? ' · <b>pizza offerte !</b>' : '';
    }
    toast(msg);
  }

  function renderCart() {
    const c = computeCart();
    $('#cartCount').textContent = c.count;
    $('#cart').classList.toggle('is-empty', !c.count);
    $$('[data-setmode]').forEach(b => b.setAttribute('aria-pressed', b.dataset.setmode === cart.mode));
    $$('.mode[data-mode]').forEach(m => m.setAttribute('aria-checked', m.dataset.mode === cart.mode));
    $$('[data-modelabel]').forEach(el => { el.textContent = cart.mode; });

    $('#cartList').innerHTML = cart.items.map((it, idx) => {
      const p = PRODUCTS[it.id];
      const free = c.free[it.key];
      return `<li class="citem">
        <img src="${p.img}" alt="" class="${p.cat.pizza ? 'is-pizza' : ''}" loading="lazy">
        <div><div class="citem__name">${escapeHTML(p.n)}</div><div class="citem__meta">${it.size ? it.size + ' · ' : ''}${escapeHTML(p.cat.label)} · ${euro(unitPrice(it))}</div>${free ? `<span class="citem__free">${free > 1 ? free + ' offertes' : 'Offerte'}</span>` : ''}</div>
        <div class="citem__right"><span class="citem__price">${euro(unitPrice(it) * it.qty)}</span>
          <span class="qty"><button data-qty="-1" data-idx="${idx}" aria-label="Retirer un ${escapeHTML(p.n)}">−</button><span>${it.qty}</span><button data-qty="1" data-idx="${idx}" aria-label="Ajouter un ${escapeHTML(p.n)}">+</button></span>
        </div></li>`;
    }).join('');

    $('#cartSub').textContent = euro(c.sub);
    $('#cartDiscLine').hidden = !c.disc;
    $('#cartDisc').textContent = '− ' + euro(c.disc);
    $('#cartDiscLbl').textContent = c.offer ? 'Offre ' + c.offer.label.replace(/ =.*/, ' : ') + c.offer.label.replace(/.*= /, '') : 'Offre';
    $('#cartShip').textContent = cart.mode === 'Livraison' ? 'Gratuite' : '—';
    $('#cartTotal').textContent = euro(c.total);

    let hint = '';
    if (c.offer) {
      const left = c.offer.every - (c.eligibleCount % c.offer.every);
      hint = `Offre ${cart.mode.toLowerCase()} : <b>${c.offer.label}</b>. `;
      hint += left === c.offer.every && c.eligibleCount ? 'Remise appliquée ✓' : `Encore ${left} pizza${left > 1 ? 's' : ''} Senior ou Mega pour en profiter.`;
      hint += ' <span style="opacity:.75">(hors Marguerita)</span>';
    } else hint = 'Sur place : pas d’offre en ligne, les offres concernent la livraison et la vente à emporter.';
    $('#cartHint').innerHTML = hint;

    const warn = $('#cartWarn');
    const below = cart.mode === 'Livraison' && c.count && c.total < INFO.minimum;
    warn.hidden = !below;
    if (below) warn.textContent = `Minimum de commande en livraison : ${euro(INFO.minimum)}. Il manque ${euro(INFO.minimum - c.total)}.`;
    $('#checkout').disabled = !!below;
    $('#checkout').style.opacity = below ? .45 : 1;
  }

  function setMode(mode, announce) {
    if (!MODES.includes(mode)) return;
    cart.mode = mode;
    saveCart();
    renderCart();
    if (announce) {
      const o = OFFERS[mode];
      toast(`Mode : <b>${mode}</b>${o ? ' · ' + o.label : ''}`);
    }
  }

  function flyToCart(fromEl, img) {
    if (reduceMotion || !fromEl) return Promise.resolve();
    const a = fromEl.getBoundingClientRect();
    const b = $('#cartBtn').getBoundingClientRect();
    const fly = document.createElement('div');
    fly.className = 'flyer';
    fly.innerHTML = `<img src="${img}" alt="">`;
    document.body.appendChild(fly);
    const x0 = a.left + a.width / 2, y0 = a.top + a.height / 2, x1 = b.left + b.width / 2, y1 = b.top + b.height / 2;
    const anim = fly.animate([
      { transform: `translate(${x0}px,${y0}px) scale(.5) rotate(0deg)`, opacity: 1 },
      { transform: `translate(${(x0 + x1) / 2}px,${Math.min(y0, y1) - 140}px) scale(1.5) rotate(180deg)`, opacity: 1, offset: .5 },
      { transform: `translate(${x1}px,${y1}px) scale(.3) rotate(360deg)`, opacity: .6 }
    ], { duration: 850, easing: 'cubic-bezier(.5,0,.5,1)' });
    return anim.finished.then(() => fly.remove()).catch(() => fly.remove());
  }

  let toastT;
  function toast(html) {
    const t = $('#toast');
    t.innerHTML = html;
    t.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove('is-on'), 2600);
  }

  function bindCart() {
    const cartEl = $('#cart'), overlay = $('#overlay');
    let last;
    const open = () => { last = document.activeElement; cartEl.classList.add('is-open'); overlay.classList.add('is-on'); cartEl.setAttribute('aria-hidden', 'false'); $('#cartClose').focus(); };
    const close = () => { cartEl.classList.remove('is-open'); overlay.classList.remove('is-on'); cartEl.setAttribute('aria-hidden', 'true'); if (last) last.focus(); };
    $('#cartBtn').addEventListener('click', open);
    $('#cartClose').addEventListener('click', close);
    overlay.addEventListener('click', close);
    bindCart.close = close;

    $('#cartList').addEventListener('click', e => {
      const b = e.target.closest('[data-qty]');
      if (!b) return;
      const it = cart.items[+b.dataset.idx];
      it.qty += +b.dataset.qty;
      if (it.qty <= 0) cart.items.splice(+b.dataset.idx, 1);
      saveCart();
      renderCart();
    });

    document.addEventListener('click', e => {
      const add = e.target.closest('[data-add]');
      if (add) {
        addToCart(add.dataset.add, add.dataset.size, add);
        add.classList.remove('is-added'); void add.offsetWidth; add.classList.add('is-added');
      }
      const m = e.target.closest('[data-setmode], .mode[data-mode]');
      if (m) setMode(m.dataset.setmode || m.dataset.mode, true);
    });

    $('#checkout').addEventListener('click', () => {
      const c = computeCart();
      const lines = cart.items.map(i => {
        const p = PRODUCTS[i.id];
        return `<p><span>${i.qty} × ${escapeHTML(p.n)}${i.size ? ' (' + i.size + ')' : ''}</span><span>${euro(unitPrice(i) * i.qty)}</span></p>`;
      }).join('');
      openModal('Votre commande', `
        <div class="recap">
          <p><span>Mode</span><b>${cart.mode}</b></p>
          ${lines}
          ${c.disc ? `<p style="color:var(--orange);font-weight:700"><span>Offre ${c.offer.label}</span><span>− ${euro(c.disc)}</span></p>` : ''}
          ${cart.mode === 'Livraison' ? '<p><span>Livraison</span><span>Gratuite · 40 min</span></p>' : ''}
          <p class="total"><span>Total</span><span>${euro(c.total)}</span></p>
        </div>
        <p style="margin-top:22px">Pour confirmer, appelez le restaurant : la commande est préparée à votre appel${cart.mode === 'Livraison' ? ' et livrée en 40 minutes environ' : ''}.</p>
        <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:16px">
          <a class="btn btn--hot" href="${INFO.tel1Href}">Appeler le ${INFO.tel1}</a>
          <a class="btn" href="${INFO.tel2Href}">${INFO.tel2}</a>
        </div>`);
    });
  }

  /* =======================================================
     MODALES (pages du footer)
     ======================================================= */
  const radios = (name, opts, type = 'radio') => `<div class="radios">${opts.map((o, i) => `<label><input type="${type}" name="${name}" value="${o}"${type === 'radio' && i === 0 ? ' checked' : ''}><span>${o}</span></label>`).join('')}</div>`;
  const field = (label, name, type = 'text', full = false, extra = '') => `<label class="${full ? 'full' : ''}" for="f-${name}">${label}</label>` +
    (type === 'textarea' ? `<div class="field ${full ? 'full' : ''}"><textarea id="f-${name}" name="${label}" rows="4" ${extra}></textarea></div>`
      : `<div class="field ${full ? 'full' : ''}"><input id="f-${name}" name="${label}" type="${type}" ${extra}></div>`);
  // Les champs label + input sont empilés : on les regroupe par paire dans une grille 2 colonnes
  const pair = (...html) => `<div>${html.join('')}</div>`;
  const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const mailNote = `<p class="form-note">L'envoi ouvre votre messagerie avec le formulaire pré-rempli, à destination de ${INFO.email}.</p>`;

  const MODALS = {
    charte: ['Charte qualité', `
      <p>Toujours soucieux de la qualité de ses produits, Pizza Food a mis en place une charte qualité répondant à 3 critères :</p>
      <h4>La sélection des produits</h4>
      <p>La qualité des produits servis faisant la force de son concept, Pizza Food a toujours eu pour principe de sélectionner les meilleurs produits. Plusieurs livraisons par semaine assurent une qualité constante et permettent à Pizza Food de vous apporter des produits savoureux chez vous.</p>
      <h4>Traçabilité des produits</h4>
      <p>Pizza Food vérifie scrupuleusement tous ses produits à chaque livraison et entretient des relations régulières avec des fournisseurs sélectionnés pour la qualité des produits.</p>
      <h4>Respect de la chaîne du froid</h4>
      <p>Pizza Food exerce un contrôle minutieux sur ses produits. Ainsi, tous les produits frais et surgelés qu'utilise Pizza Food sont des produits livrés par camion frigorifique, et respectant la chaîne du froid.</p>`],
    fidelite: ['Programme de fidélité', `
      <p class="quote" style="margin-bottom:20px">Votre fidélité chez nous est récompensée…</p>
      <h4>Une fidélité récompensée</h4>
      <p>Transformez vos points en cadeaux ! Consultez votre compte pour suivre vos points.</p>
      <p style="margin-top:20px"><a class="btn" href="carte.html">Commander ${ICONS.arrow}</a></p>`],
    mobile: ['Mobile', `
      <p class="quote" style="margin-bottom:20px">Choisissez, commandez, c'est livré.</p>
      <p>Commandez à partir de votre mobile sur notre nouvelle interface. Quelle que soit la marque de votre mobile, pas d'application à télécharger : juste une adresse à composer, <b>pizza-food.fr</b>.</p>`],
    mentions: ['Mentions légales', () => DATA.legal.mentions || ''],
    cgv: ['Conditions générales de vente', () => DATA.legal.cgv || ''],
    contact: ['Contact', `
      <p><b>Pizza Food</b><br>${INFO.address}<br>${INFO.city}<br>Tél : <a href="${INFO.tel1Href}">${INFO.tel1}</a> · <a href="${INFO.tel2Href}">${INFO.tel2}</a><br>E-mail : <a href="mailto:${INFO.email}">${INFO.email}</a></p>
      <form class="form" data-mail="Contact depuis le site">
        ${pair(field('Nom', 'nom', 'text', false, 'required autocomplete="family-name"'))}${pair(field('Prénom', 'prenom', 'text', false, 'autocomplete="given-name"'))}
        ${pair(field('E-mail', 'email', 'email', false, 'required autocomplete="email"'))}${pair(field('Téléphone', 'tel', 'tel', false, 'autocomplete="tel"'))}
        ${field('Objet', 'objet', 'text', true)}
        ${field('Commentaires', 'com', 'textarea', true, 'required')}
        <button class="btn btn--hot full" type="submit" style="justify-self:start;margin-top:16px">Envoyer ${ICONS.arrow}</button>
        ${mailNote}
      </form>`],
    recrutement: ['Recrutement', `
      <h4>Une entreprise qui se développe et qui développe ses collaborateurs</h4>
      <p>La recherche de l'excellence passe en premier lieu par le recrutement le plus adapté et l'accompagnement de nos collaborateurs dans le développement de leur carrière.</p>
      <h4>Intégrer Pizza Food, c'est intégrer</h4>
      <ul><li>Une entreprise qui va de l'avant, qui évolue grâce à ses innovations produits, au dynamisme et à la motivation des équipes qui la composent</li>
      <li>Une entreprise qui offre de véritables opportunités de carrières</li>
      <li>Une entreprise qui met en œuvre une politique sociale axée sur la formation et sur la confiance qu'elle accorde au potentiel de chacun</li></ul>
      <form class="form" data-mail="Candidature">
        <div class="full"><label>Civilité</label>${radios('Civilité', ['Madame', 'Mademoiselle', 'Monsieur'])}</div>
        ${pair(field('Nom', 'rnom', 'text', false, 'required'))}${pair(field('Prénom', 'rprenom', 'text', false, 'required'))}
        ${pair(field('Adresse mail', 'rmail', 'email', false, 'required'))}${pair(field('Date de naissance', 'rnaiss', 'date'))}
        ${field('Adresse', 'radr', 'text', true)}
        ${pair(field('Code postal', 'rcp', 'text', false, 'inputmode="numeric"'))}${pair(field('Ville', 'rville'))}
        ${pair(field('Téléphone 1', 'rtel1', 'tel', false, 'required'))}${pair(field('Téléphone 2', 'rtel2', 'tel'))}
        <div class="full"><label>Vous recherchez</label>${radios('Vous recherchez', ['Temps plein', 'Temps partiel'])}</div>
        <div><label>Disponibilités (matin)</label>${radios('Matin', DAYS, 'checkbox')}</div>
        <div><label>Disponibilités (soir)</label>${radios('Soir', DAYS, 'checkbox')}</div>
        <button class="btn btn--hot full" type="submit" style="justify-self:start;margin-top:16px">Envoyer ${ICONS.arrow}</button>
        ${mailNote}
      </form>`],
    appreciation: ['Votre appréciation', `
      <p>Toujours dans le but d'améliorer notre qualité de service, et de satisfaire pleinement vos attentes, nous attachons une grande importance à votre appréciation.</p>
      <form class="form" data-mail="Votre appréciation">
        <div class="full"><label>Civilité</label>${radios('Civilité', ['Madame', 'Mademoiselle', 'Monsieur'])}</div>
        ${pair(field('Nom', 'anom', 'text', false, 'required'))}${pair(field('Prénom', 'aprenom'))}
        ${field('Votre e-mail', 'amail', 'email', true, 'required')}
        <div class="full"><label>Sujet</label>${radios('Sujet', ['Idées et questions', "J'ai aimé…", "Je n'ai pas aimé…"])}</div>
        <div class="full"><label>Restaurant concerné</label>${radios('Restaurant concerné', ['Site web', 'Pizza Food'])}</div>
        ${field('Commentaires', 'acom', 'textarea', true, 'required')}
        <div class="full"><label>Appréciation globale</label>${radios('Appréciation globale', ['Très satisfaisant', 'Satisfaisant', 'Moyen', 'Insatisfaisant', 'Très insatisfaisant'])}</div>
        <div class="full"><label>Rapport qualité/prix</label>${radios('Rapport qualité/prix', ['Très satisfaisant', 'Satisfaisant', 'Moyen', 'Insatisfaisant', 'Très insatisfaisant'])}</div>
        <div class="full"><label>Recommanderiez-vous ce restaurant à un ami ?</label>${radios('Recommandation', ['Oui', 'Non'])}</div>
        <button class="btn btn--hot full" type="submit" style="justify-self:start;margin-top:16px">Envoyer ${ICONS.arrow}</button>
        ${mailNote}
      </form>`],
    allergenes: ['Allergènes', () => {
      const a = DATA.allergens;
      return `<p><b>Allergènes dans les produits Pizza Food — carte 2026 (France).</b> Légende : « X » = présence.</p>
        <p>Ces informations ont été établies sur la base des déclarations de nos fournisseurs à propos de la composition de leurs produits. Outre les présences signalées dans le tableau, nous ne pouvons pas exclure une présence accidentelle d'autres ingrédients allergènes qui serait apparue lors de la fabrication des produits chez nos fournisseurs ou lors de leur manipulation dans nos restaurants.</p>
        <div class="allergens-wrap"><table class="allergens">
          <thead><tr><th scope="col">Produit</th>${a.cols.map(c => `<th scope="col">${escapeHTML(c)}</th>`).join('')}</tr></thead>
          <tbody>${a.rows.map(([n, bits]) => `<tr><th scope="row">${escapeHTML(n)}</th>${[...bits].map(b => `<td class="${b === '1' ? 'x-on' : ''}">${b === '1' ? 'X' : ''}</td>`).join('')}</tr>`).join('')}</tbody>
        </table></div>`;
    }]
  };

  let modalLast;
  function openModal(title, html) {
    modalLast = document.activeElement;
    $('#modalTitle').textContent = title;
    $('#modalBody').innerHTML = html;
    $('#modalBody').scrollTop = 0;
    const m = $('#modal');
    m.classList.add('is-open');
    m.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');
    $('#modalClose').focus();
  }
  function closeModal() {
    const m = $('#modal');
    m.classList.remove('is-open');
    m.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-locked');
    if (modalLast) modalLast.focus();
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
    // Formulaires → messagerie pré-remplie
    document.addEventListener('submit', e => {
      const form = e.target.closest('form[data-mail]');
      if (!form) return;
      e.preventDefault();
      if (!form.reportValidity()) return;
      const fd = new FormData(form);
      const lines = [];
      for (const [k, v] of fd.entries()) if (String(v).trim()) lines.push(`${k} : ${v}`);
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

  /* =======================================================
     MENU MOBILE
     ======================================================= */
  function toggleMenu(force) {
    const mm = $('#mmenu'), b = $('#burger');
    const open = typeof force === 'boolean' ? force : !mm.classList.contains('is-open');
    mm.classList.toggle('is-open', open);
    mm.setAttribute('aria-hidden', !open);
    b.setAttribute('aria-expanded', open);
    document.body.classList.toggle('is-locked', open);
  }

  /* =======================================================
     RENDUS PAR PAGE
     ======================================================= */
  const sizeChips = p => p.s
    ? Object.entries(p.s).map(([sz, pr]) => `<button class="chip" data-add="${p.id}" data-size="${sz}" aria-label="Ajouter ${escapeHTML(p.n)} ${sz}, ${euro(pr)}"><small>${sz}</small><b>${euro(pr).replace(/\s/g, '')}</b></button>`).join('')
    : `<button class="chip" data-add="${p.id}" data-size="" aria-label="Ajouter ${escapeHTML(p.n)}, ${euro(p.p)}"><small>Ajouter</small></button>`;

  function cardHTML(p, i) {
    const desc = escapeHTML(p.d || (p.cat.pizza ? '' : p.cat.label));
    return `<article class="card" data-id="${p.id}" style="--i:${i}">
      <div class="card__media${p.cat.pizza ? ' is-pizza' : ''}" data-cursor="${p.s ? 'Une part ?' : 'Miam'}"><img src="${p.img}" alt="${escapeHTML(p.n)}" loading="lazy" width="260" height="250"></div>
      <h3 class="card__name">${escapeHTML(p.n)}</h3>
      <p class="card__desc">${desc}</p>
      <div class="card__foot">${p.s ? '' : `<span class="card__price">${euro(p.p)}</span>`}<div class="sizes">${sizeChips(p)}</div></div>
    </article>`;
  }

  function renderSignatures() {
    const el = $('#sigGrid');
    if (!el) return;
    const ids = ['80', '120', '304', '307', '303', '104'];
    el.innerHTML = ids.map((id, i) => {
      const p = PRODUCTS[id];
      const short = p.d.replace(/^(Sauce \w+|Crème fraîche), (fromage|mozzarella), /i, '').replace(/\.$/, '');
      return `<article class="sig" data-reveal style="--d:${(i % 3) * 120}ms">
        <span class="sig__num">0${i + 1} — ${escapeHTML(p.cat.label)}</span>
        <div class="sig__media" data-cursor="Une part ?"><div class="burst">${burstSVG(16)}</div><img src="${p.img}" alt="Pizza ${escapeHTML(p.n)}" loading="lazy"></div>
        <h3 class="sig__name">${escapeHTML(p.n)}</h3>
        <p class="sig__desc">${escapeHTML(short.charAt(0).toUpperCase() + short.slice(1))}.</p>
        <div class="sizes">${sizeChips(p)}</div>
      </article>`;
    }).join('');
  }

  function renderEnvieLinks() {
    $$('[data-envies-links]').forEach(el => {
      el.innerHTML = ENVIES.map(([label, re]) => `<a class="envie" href="carte.html?envie=${encodeURIComponent(label)}#envies" data-cursor="Voir">${label}<small>${envieMatches(re).length}</small></a>`).join('');
    });
  }

  function renderZones() {
    const el = $('#zonesList');
    if (!el) return;
    el.innerHTML = ZONES.map(([n, cp], i) => `<li class="zone" data-cp="${cp}" data-reveal style="--d:${i * 50}ms">
      <span class="zone__n">${String(i + 1).padStart(2, '0')}</span><span class="zone__name">${n}</span>
      <span class="zone__t">Gratuit · 40 min</span><span class="zone__cp">${cp}</span></li>`).join('');

    const form = $('#checkForm'), input = $('#cpInput'), res = $('#checkRes');
    if (!form) return;
    const check = () => {
      const v = input.value.trim().toLowerCase();
      $$('.zone').forEach(z => z.classList.remove('is-match'));
      if (!v) { res.className = 'checker__res'; res.innerHTML = ''; return; }
      const hits = ZONES.filter(([n, cp]) => cp === v || (v.length > 2 && norm(n).includes(norm(v))));
      if (hits.length) {
        hits.forEach(([, cp]) => $$(`.zone[data-cp="${cp}"]`).forEach(z => z.classList.add('is-match')));
        res.className = 'checker__res is-ok';
        res.innerHTML = `<b>On vous livre</b><span>${hits.map(h => h[0] + ' (' + h[1] + ')').join(', ')} — livraison gratuite en 40 minutes, dès ${euro(INFO.minimum)} de commande.</span>`;
      } else if (/^\d{5}$/.test(v) || v.length > 2) {
        res.className = 'checker__res is-ko';
        res.innerHTML = `<b>Hors zone</b><span>Pas de livraison ici pour l'instant… mais votre commande peut être à emporter au ${INFO.address} : <a href="#emporter">1 pizza achetée = la 2e offerte</a>.</span>`;
      }
    };
    form.addEventListener('submit', e => { e.preventDefault(); check(); });
    input.addEventListener('input', () => { if (input.value.trim().length >= 5 || input.value.trim().length === 0 || /\D/.test(input.value)) check(); });
  }

  /* ----- Page carte ----- */
  function renderCarte() {
    const wrap = $('#menu');
    if (!wrap) return;
    $('#catbar').innerHTML = DATA.cats.map(c => `<a href="#cat-${c.id}" data-cat="${c.id}">${c.label}<sup>${c.items.length}</sup></a>`).join('');
    wrap.innerHTML = DATA.cats.map(c => `<section class="cat" id="cat-${c.id}" data-cat="${c.id}">
        <div class="cat__head"><h2 class="split-me">${c.label}</h2><span class="cat__count" data-count-cat>${c.items.length} produits${c.pizza ? ' · Junior / Senior / Mega' : ''}</span></div>
        <div class="grid">${c.items.map((it, i) => cardHTML(PRODUCTS[it.id], i)).join('')}</div>
      </section>`).join('') + `<div class="empty-msg" id="emptyMsg"><p class="display display--sm">Aucun produit</p></div>`;

    // Vos envies
    const box = $('#enviesBtns');
    box.innerHTML = ENVIES.map(([label, re], i) => `<button type="button" class="envie" data-envie="${i}" aria-pressed="false">${label}<small>${envieMatches(re).length}</small></button>`).join('');
    let active = -1;
    const apply = (idx, scroll) => {
      active = idx;
      $$('.envie', box).forEach((b, i) => b.setAttribute('aria-pressed', i === idx));
      const status = $('#enviesStatus');
      if (idx < 0) {
        $$('.card', wrap).forEach(c => { c.classList.remove('is-hidden', 'is-pop'); });
        $$('.cat', wrap).forEach(s => {
          s.classList.remove('is-hidden');
          const n = $$('.card', s).length;
          $('[data-count-cat]', s).textContent = `${n} produits${DATA.cats.find(c => c.id === s.dataset.cat).pizza ? ' · Junior / Senior / Mega' : ''}`;
        });
        $$('.card__desc mark', wrap).forEach(m => m.replaceWith(m.textContent));
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
          const d = $('.card__desc', card);
          d.innerHTML = escapeHTML(p.d || (p.cat.pizza ? '' : p.cat.label));
          if (hit) {
            n++;
            void card.offsetWidth;
            card.style.setProperty('--i', k++);
            card.classList.add('is-pop');
            d.innerHTML = markTerm(p.d || '', re);
          }
        });
        s.classList.toggle('is-hidden', !n);
        $('[data-count-cat]', s).textContent = `${n} produit${n > 1 ? 's' : ''} avec ${label.toLowerCase()}`;
        total += n;
      });
      status.innerHTML = `<b>${total} produit${total > 1 ? 's' : ''}</b> avec ${label.toLowerCase()} · <button type="button" class="link" id="enviesReset" style="border:0;background:none;padding:0">tout afficher</button>`;
      $('#emptyMsg').classList.toggle('is-on', !total);
      try { history.replaceState(null, '', `?envie=${encodeURIComponent(label)}${location.hash}`); } catch (e) { /* file:// */ }
      if (scroll) $('#menu').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    };
    box.addEventListener('click', e => {
      const b = e.target.closest('[data-envie]');
      if (b) apply(+b.dataset.envie === active ? -1 : +b.dataset.envie, true);
    });
    document.addEventListener('click', e => { if (e.target.id === 'enviesReset') apply(-1); });
    const q = new URLSearchParams(location.search).get('envie');
    const qi = q ? ENVIES.findIndex(([l]) => norm(l) === norm(q)) : -1;
    apply(qi, false);

    // Catégorie active dans la barre (scrollspy)
    const links = $$('#catbar a');
    const spy = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        links.forEach(a => {
          const on = a.dataset.cat === en.target.dataset.cat;
          a.classList.toggle('is-active', on);
          if (on) {
            const bar = a.parentElement;
            bar.scrollTo({ left: a.offsetLeft - bar.clientWidth / 2 + a.offsetWidth / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
          }
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('.cat', wrap).forEach(s => spy.observe(s));
  }

  /* =======================================================
     OUVERT / FERMÉ (heure de Paris)
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
  function splitWords(el) {
    if (el.dataset.split) return;
    el.dataset.split = '1';
    const label = el.textContent.replace(/\s+/g, ' ').trim();
    let i = 0;
    const walk = node => {
      const frag = document.createDocumentFragment();
      node.childNodes.forEach(ch => {
        if (ch.nodeType === 3) {
          ch.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            w.className = 'w';
            const inner = document.createElement('span');
            inner.textContent = part;
            w.style.setProperty('--i', i++);
            w.appendChild(inner);
            inner.style.setProperty('--i', i);
            frag.appendChild(w);
          });
        } else if (ch.nodeType === 1 && ch.tagName !== 'BR') {
          const c = ch.cloneNode(false);
          c.appendChild(walk(ch));
          frag.appendChild(c);
        } else frag.appendChild(ch.cloneNode(true));
      });
      return frag;
    };
    const frag = walk(el);
    el.textContent = '';
    el.appendChild(frag);
    el.classList.add('split');
    if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', label);
    $$('.w', el).forEach(w => w.setAttribute('aria-hidden', 'true'));
  }

  function hydrate() {
    $$('[data-burst]').forEach(el => { el.innerHTML = burstSVG(+el.dataset.burst || 18) + el.innerHTML; });
    $$('[data-zigzag]').forEach(el => { el.outerHTML = zigzagSVG(+el.dataset.zigzag || 60); });
    $$('.zz polyline').forEach(p => { try { p.style.setProperty('--len', Math.ceil(p.getTotalLength() + 20)); } catch (e) { /* noop */ } });
    $$('.split-me, .display, .hero__title').forEach(splitWords);
    const giant = $('#giant');
    if (giant) giant.innerHTML = [...giant.textContent].map(ch => ch === ' ' ? ' ' : `<span class="ch" aria-hidden="true">${ch}</span>`).join('');
  }

  function startReveals() {
    const targets = $$('[data-reveal], .split, .zz, [data-count]');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      targets.forEach(t => t.classList.add('is-in'));
      $$('[data-count]').forEach(el => { el.textContent = el.dataset.count; });
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        if (en.target.dataset.count) countUp(en.target);
        io.unobserve(en.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(t => io.observe(t));
    // Les nouvelles cartes (filtre) apparaissent sans attendre
    startReveals.io = io;
  }
  function countUp(el) {
    const target = +el.dataset.count, t0 = performance.now();
    const tick = now => {
      const p = clamp((now - t0) / 1500), e = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(target * e);
      if (p < 1) requestAnimationFrame(tick);
    };
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

  function setupCursor() {
    if (!finePointer || reduceMotion) return null;
    document.documentElement.classList.add('has-cursor');
    const el = $('#cursor'), lbl = $('#cursorLabel');
    document.addEventListener('pointerover', e => {
      const t = e.target.closest('[data-cursor], a, button, label');
      el.classList.toggle('is-big', !!(t && t.dataset.cursor));
      lbl.textContent = t && t.dataset.cursor ? t.dataset.cursor : '';
      el.style.scale = t && !t.dataset.cursor ? '2' : '1';
    });
    document.addEventListener('mouseleave', () => { el.style.opacity = 0; });
    document.addEventListener('mouseenter', () => { el.style.opacity = 1; });
    return el;
  }

  function setupMagnetic() {
    if (!finePointer || reduceMotion) return;
    $$('.magnetic').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        el.style.translate = `${(e.clientX - r.left - r.width / 2) * .25}px ${(e.clientY - r.top - r.height / 2) * .35}px`;
      });
      el.addEventListener('pointerleave', () => { el.style.translate = '0 0'; });
    });
  }

  function loop(marquees, cursorEl) {
    const nav = $('#nav'), bar = $('#progress');
    const heroMedia = $('.hero__media');
    const heroEl = $('.hero');
    const hSec = $('.hscroll'), hTrack = $('.hscroll__track');
    const hPanels = hTrack ? $$('.hpanel', hTrack) : [];
    const mouse = { x: innerWidth / 2, y: innerHeight / 2 }, cpos = { ...mouse };
    let lastY = scrollY, vel = 0, dir = 1, hDist = 0;

    addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    const size = () => {
      if (hSec) { hDist = Math.max(0, hTrack.scrollWidth - innerWidth); hSec.style.height = (hDist + innerHeight) + 'px'; }
      marquees.forEach(m => { m.half = m.track.scrollWidth / 2; });
    };
    size();
    addEventListener('resize', size);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(size);

    const frame = () => {
      const y = scrollY, vh = innerHeight, dy = y - lastY;
      vel = lerp(vel, dy, .2);
      if (Math.abs(dy) > .5) dir = dy > 0 ? 1 : -1;

      const max = document.documentElement.scrollHeight - vh;
      bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

      const heroBottom = heroEl ? heroEl.offsetHeight - 90 : 40;
      nav.classList.toggle('is-solid', y > heroBottom || !heroEl);
      if (!$('#mmenu').classList.contains('is-open')) {
        if (dy > 6 && y > 500) nav.classList.add('is-hidden');
        else if (dy < -6 || y < 500) nav.classList.remove('is-hidden');
      }

      if (!reduceMotion) {
        if (heroMedia && y < vh * 1.2) heroMedia.style.translate = `0 ${y * .3}px`;
        marquees.forEach(m => {
          m.x -= m.dir * dir * (1 + Math.min(Math.abs(vel) * .3, 26));
          if (m.x <= -m.half) m.x += m.half;
          if (m.x > 0) m.x -= m.half;
          m.track.style.transform = `translate3d(${m.x}px,0,0)`;
        });
        if (cursorEl) {
          cpos.x = lerp(cpos.x, mouse.x, .2); cpos.y = lerp(cpos.y, mouse.y, .2);
          cursorEl.style.translate = `${cpos.x}px ${cpos.y}px`;
        }
      }

      if (hSec) {
        const r = hSec.getBoundingClientRect();
        if (r.top < vh && r.bottom > 0) {
          const p = clamp(-r.top / Math.max(1, r.height - vh));
          hTrack.style.transform = `translate3d(${-p * hDist}px,0,0)`;
          hPanels.forEach(pn => {
            const pr = pn.getBoundingClientRect();
            pn.style.setProperty('--p', reduceMotion ? 1 : (1 - clamp(Math.abs(pr.left + pr.width / 2 - innerWidth / 2) / innerWidth)).toFixed(3));
          });
        }
      }
      lastY = y;
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  /* =======================================================
     TRANSITIONS ENTRE PAGES
     ======================================================= */
  function setupCurtain() {
    const curtain = $('#curtain');
    if (!curtain) return Promise.resolve();
    let seen = false;
    try { seen = sessionStorage.getItem('pf-seen') === '1'; sessionStorage.setItem('pf-seen', '1'); } catch (e) { /* noop */ }
    if (reduceMotion) { curtain.remove(); return Promise.resolve(); }
    if (seen) curtain.classList.add('is-quick');
    const wait = seen ? 350 : 1300;
    const fontsReady = document.fonts ? Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 2500))]) : Promise.resolve();
    const lifted = Promise.all([fontsReady, new Promise(r => setTimeout(r, wait))]).then(() => {
      curtain.classList.add('is-up');
      document.body.classList.remove('is-locked');
    });

    // Rideau qui retombe avant de changer de page
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href]');
      if (!a || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      const href = a.getAttribute('href');
      if (!/^[\w-]+\.html/.test(href)) return;
      const samePage = href.split(/[?#]/)[0] === (location.pathname.split('/').pop() || 'index.html');
      if (samePage && href.includes('#') && !href.includes('?')) return;
      e.preventDefault();
      curtain.classList.add('is-quick');
      curtain.classList.remove('is-up');
      setTimeout(() => { location.href = href; }, 620);
    });
    addEventListener('pageshow', e => { if (e.persisted) curtain.classList.add('is-up'); });
    return lifted;
  }

  /* =======================================================
     INITIALISATION
     ======================================================= */
  buildChrome();
  bindCart();
  bindModals();
  $('#burger').addEventListener('click', () => toggleMenu());
  $$('#mmenu a').forEach(a => a.addEventListener('click', () => toggleMenu(false)));

  renderSignatures();
  renderEnvieLinks();
  renderZones();
  renderCarte();
  renderCart();
  updateOpen();
  setInterval(updateOpen, 60000);
  hydrate();

  const marquees = setupMarquees();
  const cursorEl = setupCursor();
  setupMagnetic();
  setupCurtain().then(() => {
    startReveals();
    if (location.hash) {
      const t = document.getElementById(location.hash.slice(1));
      if (t) setTimeout(() => t.scrollIntoView({ behavior: 'auto', block: 'start' }), 50);
    }
  });
  loop(marquees, cursorEl);
})();
