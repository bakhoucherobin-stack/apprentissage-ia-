/* =========================================================
   PIZZA FOOD — composition des produits, commande, compte
   - fenêtre « composer » : composition à décocher, choix
     obligatoires (pâte, sauce, viandes, boisson…), menus,
     suppléments payants, quantité (repris du site d'origine)
   - page commande.html en 3 étapes : Mon panier,
     Authentification et paiement, Confirmation
   - compte client, code promo, visuel 2D de la commande
   Initialisé par js/main.js (PF_SHOP.init) qui lui passe
   le panier et les utilitaires.
   ========================================================= */
(() => {
  'use strict';
  const OPT = window.PF_OPTIONS || { lists: {}, products: {} };
  const CONF = window.PF_CONFIG || {};
  let A = null; // utilitaires fournis par main.js

  /* ---------- Options d'un produit ---------- */
  const list = v => (typeof v === 'string' ? OPT.lists[v] || [] : v || []);
  const hasOptions = id => !!OPT.products[id];
  function optionsFor(id, size) {
    const o = OPT.products[id];
    if (!o) return null;
    const v = o.bySize ? (o.bySize[size] || o.bySize[Object.keys(o.bySize)[0]]) : o;
    return {
      compo: v.compo || [],
      slots: (v.slots || []).map(s => ({ label: s.label, items: list(s.choices) })),
      groups: (v.groups || []).map(g => ({ label: g.label, optional: !!g.optional, items: list(g.items) })),
      extras: (v.extras || []).map(e => ({ label: e.label, items: list(e.items) })),
      midi: !!v.midi
    };
  }
  const find = (items, id) => items.find(i => i.id === id);
  // Prix des options choisies (par unité)
  function optPrice(it) {
    const o = it.opt && optionsFor(it.id, it.size);
    if (!o) return 0;
    let s = 0;
    (it.opt.slots || []).forEach((id, k) => { const c = o.slots[k] && find(o.slots[k].items, id); if (c) s += c.price || 0; });
    (it.opt.groups || []).forEach((id, k) => { const c = o.groups[k] && find(o.groups[k].items, id); if (c) s += c.price || 0; });
    const all = o.extras.flatMap(e => e.items);
    (it.opt.extras || []).forEach(id => { const c = find(all, id); if (c) s += c.price || 0; });
    return s;
  }
  // Lignes lisibles : « Sans : … », « PATE : CHEESY », « Suppléments : … »
  function describe(it) {
    const o = it.opt && optionsFor(it.id, it.size);
    if (!o) return [];
    const out = [];
    const sans = (it.opt.sans || []).map(id => find(o.compo, id)).filter(Boolean);
    if (sans.length) out.push({ label: 'Sans', text: sans.map(c => c.name).join(', '), price: 0 });
    (it.opt.slots || []).forEach((id, k) => { const c = o.slots[k] && find(o.slots[k].items, id); if (c) out.push({ label: cap(o.slots[k].label), text: c.name, price: c.price || 0 }); });
    (it.opt.groups || []).forEach((id, k) => { const c = o.groups[k] && find(o.groups[k].items, id); if (c) out.push({ label: cap(o.groups[k].label), text: c.name, price: c.price || 0 }); });
    const all = o.extras.flatMap(e => e.items);
    const ex = (it.opt.extras || []).map(id => find(all, id)).filter(Boolean);
    if (ex.length) out.push({ label: 'Suppléments', text: ex.map(c => c.name).join(', '), price: ex.reduce((s, c) => s + (c.price || 0), 0), count: ex.length, unit: ex[0].price });
    return out;
  }
  const cap = s => s.charAt(0) + s.slice(1).toLowerCase();
  const optKey = opt => (opt ? JSON.stringify([opt.sans || [], opt.slots || [], opt.groups || [], (opt.extras || []).slice().sort()]) : '');

  /* =======================================================
     FENÊTRE DE COMPOSITION
     ======================================================= */
  function compose({ id, size, fromEl, edit }) {
    const { $, $$, esc, euro, PRODUCTS } = A;
    const p = PRODUCTS[id];
    if (!p) return;
    const sizes = p.s ? Object.keys(p.s) : [];
    let cur = edit ? JSON.parse(JSON.stringify(edit.opt || {})) : null;
    let sz = size || (edit && edit.size) || sizes[0] || '';
    let qty = edit ? edit.qty : 1;
    const wrap = document.createElement('div');
    wrap.className = 'cmp';
    wrap.innerHTML = `<div class="cmp__box" role="dialog" aria-modal="true" aria-labelledby="cmpTitle">
        <header class="cmp__head">
          <div class="cmp__img${p.cat.pizza ? ' is-pizza' : ''}"><img src="${p.img}" alt=""></div>
          <div class="cmp__txt"><p class="cmp__cat">${esc(p.cat.label)}</p><h2 id="cmpTitle">${esc(p.n)}</h2>${p.d ? `<p class="cmp__desc">${esc(p.d)}</p>` : ''}</div>
          <button class="cmp__x" type="button" aria-label="Fermer">×</button>
        </header>
        ${sizes.length > 1 ? `<div class="cmp__sizes" role="radiogroup" aria-label="Taille">${sizes.map(s => `<button type="button" role="radio" data-size="${s}"><b>${s}</b><small>${euro(p.s[s])}</small></button>`).join('')}</div>` : ''}
        <form class="cmp__body" novalidate></form>
        <footer class="cmp__foot">
          <p class="cmp__err" aria-live="assertive"></p>
          <div class="cmp__qty"><button type="button" data-q="-1" aria-label="Diminuer la quantité">−</button><span aria-live="polite"></span><button type="button" data-q="1" aria-label="Augmenter la quantité">+</button></div>
          <p class="cmp__total"><small>Total</small><b></b></p>
          <button class="btn btn--ghost cmp__skip" type="button">Ignorer</button>
          <button class="btn btn--dark cmp__ok" type="button">${edit ? 'Enregistrer' : 'Valider'}</button>
        </footer>
      </div>`;
    document.body.appendChild(wrap);
    document.body.classList.add('is-locked');
    const form = $('.cmp__body', wrap);
    const last = document.activeElement;

    const cbx = (name, it, checked, extraCls = '') => `<label class="opt${extraCls}"><input type="checkbox" name="${name}" value="${esc(it.id)}"${checked ? ' checked' : ''}><span class="opt__box" aria-hidden="true"></span><span class="opt__name">${esc(it.name)}</span>${it.price ? `<span class="opt__price">+${euro(it.price)}</span>` : ''}</label>`;

    function render() {
      const o = optionsFor(id, sz);
      // reprend les choix par nom quand on change de taille
      const prev = cur && cur._names;
      const byName = (items, name) => (items.find(i => i.name === name) || {}).id;
      const sel = { sans: [], slots: [], groups: [], extras: [] };
      if (cur && !prev) Object.assign(sel, cur);
      if (prev) {
        sel.sans = prev.sans.map(n => byName(o.compo, n)).filter(Boolean);
        sel.slots = o.slots.map((s, k) => byName(s.items, prev.slots[k]));
        sel.groups = o.groups.map((g, k) => byName(g.items, prev.groups[k]));
        const all = o.extras.flatMap(e => e.items);
        sel.extras = prev.extras.map(n => byName(all, n)).filter(Boolean);
      }
      let h = '';
      if (o.midi) h += `<p class="cmp__note">Menu valable uniquement le midi.</p>`;
      if (o.compo.length) h += `<fieldset class="cmp__sec"><legend>Composition <small>décochez pour retirer un ingrédient</small></legend><div class="opts">${o.compo.map(c => cbx('sans', c, !sel.sans.includes(c.id), ' opt--compo')).join('')}</div></fieldset>`;
      o.slots.forEach((s, k) => {
        h += `<fieldset class="cmp__sec" data-req="slot${k}" data-label="${esc(cap(s.label))}"><legend>${esc(cap(s.label))} <span class="tag">Obligatoire · 1 choix</span></legend><div class="opts">${s.items.map(c => cbx('slot' + k, c, sel.slots[k] === c.id)).join('')}</div></fieldset>`;
      });
      o.groups.forEach((g, k) => {
        const only = !g.optional && g.items.length === 1;
        const chosen = sel.groups[k] || (only ? g.items[0].id : null);
        h += `<fieldset class="cmp__sec"${g.optional ? '' : ` data-req="group${k}"`} data-label="${esc(cap(g.label))}"><legend>${esc(cap(g.label))} <span class="tag${g.optional ? ' tag--soft' : ''}">${g.optional ? 'Facultatif' : 'Obligatoire · 1 choix'}</span></legend><div class="opts">${g.items.map(c => cbx('group' + k, c, chosen === c.id)).join('')}</div></fieldset>`;
      });
      if (o.extras.length) {
        h += `<fieldset class="cmp__sec cmp__sec--extras"><legend>Ingrédients supplémentaires <small>facultatif</small></legend>${o.extras.map(e => `<p class="cmp__sub">${esc(e.label)}</p><div class="opts">${e.items.map(c => cbx('extra', c, sel.extras.includes(c.id))).join('')}</div>`).join('')}</fieldset>`;
      }
      form.innerHTML = h;
      $$('.cmp__sizes [data-size]', wrap).forEach(b => b.setAttribute('aria-checked', String(b.dataset.size === sz)));
      update();
    }
    // Lecture de l'état du formulaire
    function read() {
      const o = optionsFor(id, sz);
      const vals = n => $$(`input[name="${n}"]:checked`, form).map(i => i.value);
      return {
        sans: $$('input[name="sans"]', form).filter(i => !i.checked).map(i => i.value),
        slots: o.slots.map((s, k) => vals('slot' + k)[0] || null),
        groups: o.groups.map((g, k) => vals('group' + k)[0] || null),
        extras: vals('extra')
      };
    }
    function names(opt) {
      const o = optionsFor(id, sz), nm = (items, i) => (find(items, i) || {}).name;
      const all = o.extras.flatMap(e => e.items);
      return { sans: opt.sans.map(i => nm(o.compo, i)), slots: opt.slots.map((i, k) => nm(o.slots[k].items, i)), groups: opt.groups.map((i, k) => nm(o.groups[k].items, i)), extras: opt.extras.map(i => nm(all, i)) };
    }
    function update() {
      const opt = read();
      const base = p.s ? p.s[sz] : p.p;
      const unit = base + optPrice({ id, size: sz, opt });
      $('.cmp__total b', wrap).textContent = euro(unit * qty);
      $('.cmp__qty span', wrap).textContent = qty;
      $$('.opt--compo', form).forEach(l => l.classList.toggle('is-off', !$('input', l).checked));
    }
    form.addEventListener('change', e => {
      const t = e.target;
      // un seul choix par groupe obligatoire / facultatif (cases à cocher comme sur le site d'origine)
      if (/^(slot|group)\d+$/.test(t.name) && t.checked) $$(`input[name="${t.name}"]`, form).forEach(i => { if (i !== t) i.checked = false; });
      const fs = t.closest('.cmp__sec'); if (fs) fs.classList.remove('is-missing');
      $('.cmp__err', wrap).textContent = '';
      update();
    });
    wrap.addEventListener('click', e => {
      const sb = e.target.closest('.cmp__sizes [data-size]');
      if (sb && sb.dataset.size !== sz) { const opt = read(); cur = { _names: names(opt) }; sz = sb.dataset.size; render(); }
      const q = e.target.closest('[data-q]');
      if (q) { qty = Math.max(1, Math.min(99, qty + +q.dataset.q)); update(); }
      if (e.target === wrap || e.target.closest('.cmp__x, .cmp__skip')) close();
      if (e.target.closest('.cmp__ok')) ok();
    });
    const onKey = e => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    function ok() {
      const missing = $$('[data-req]', form).filter(fs => !$('input:checked', fs));
      $$('.cmp__sec', form).forEach(fs => fs.classList.toggle('is-missing', missing.includes(fs)));
      if (missing.length) {
        $('.cmp__err', wrap).textContent = 'À choisir : ' + missing.map(fs => fs.dataset.label).join(', ');
        missing[0].scrollIntoView({ behavior: A.reduceMotion ? 'auto' : 'smooth', block: 'center' });
        missing[0].classList.remove('shake'); void missing[0].offsetWidth; missing[0].classList.add('shake');
        return;
      }
      const opt = read();
      if (edit) A.replaceItem(edit, { id, size: sz, qty, opt });
      else A.addToCart(id, sz, fromEl || $('.cmp__ok', wrap), opt, qty);
      close();
    }
    function close() {
      document.removeEventListener('keydown', onKey);
      wrap.classList.remove('is-open');
      document.body.classList.remove('is-locked');
      setTimeout(() => wrap.remove(), 350);
      if (last && last.focus) last.focus();
    }
    render();
    requestAnimationFrame(() => { wrap.classList.add('is-open'); $('.cmp__x', wrap).focus(); });
  }

  /* =======================================================
     COMPTE CLIENT (enregistré dans ce navigateur)
     ======================================================= */
  const accounts = () => A.store.get('pf-accounts', {});
  const session = () => { const e = A.store.get('pf-session', ''); return e ? accounts()[e] || null : null; };
  const SOURCES = ['Email', 'SMS', 'Fax', 'Un ami', 'Un prospectus', 'Notre restaurant', 'Moteur de recherche'];
  const fld = (label, name, val = '', type = 'text', extra = '') => `<div><label for="ac-${name}">${label}</label><div class="field"><input id="ac-${name}" name="${name}" type="${type}" value="${A.esc(val || '')}" ${extra}></div></div>`;
  const sel = (label, name, opts, val = '', extra = '') => `<div><label for="ac-${name}">${label}</label><div class="field"><select id="ac-${name}" name="${name}" ${extra}>${opts.map(o => `<option${o === val ? ' selected' : ''}>${A.esc(o)}</option>`).join('')}</select></div></div>`;
  const normTel = t => (t || '').replace(/\D/g, '');

  // Adresse de livraison (mêmes champs que le site d'origine)
  const ADDR = ['ville', 'numrue', 'adresse', 'bat', 'escalier', 'code', 'code2', 'interphone', 'etage', 'porte'];
  function addrFields(v = {}, req = false) {
    const { esc, ZONES } = A;
    return `<div class="full"><label for="ac-ville">Ville${req ? ' *' : ''}</label><div class="field"><select id="ac-ville" name="ville"${req ? ' required' : ''}><option value="">Votre ville</option>${ZONES.map(([n, cp]) => `<option value="${esc(n)} ${cp}"${v.ville === n + ' ' + cp ? ' selected' : ''}>${esc(n)} ${cp}</option>`).join('')}</select></div></div>
      ${fld('N° de la voie', 'numrue', v.numrue, 'text', 'autocomplete="address-line1"')}${fld('Adresse' + (req ? ' *' : ''), 'adresse', v.adresse, 'text', (req ? 'required ' : '') + 'autocomplete="street-address"')}
      ${fld('Bâtiment', 'bat', v.bat)}${fld('Escalier', 'escalier', v.escalier)}${fld('Code 1', 'code', v.code)}${fld('Code 2', 'code2', v.code2)}
      ${fld('Interphone', 'interphone', v.interphone)}${fld('Étage', 'etage', v.etage)}${fld('Porte', 'porte', v.porte)}${fld('Nom de l\'adresse', 'nomAdr', v.nomAdr, 'text', 'placeholder="Maison, travail…"')}`;
  }
  const pickAddr = o => { const a = {}; ADDR.concat('nomAdr').forEach(k => { if (o[k]) a[k] = String(o[k]).trim(); }); return a.adresse && a.ville ? a : null; };
  const addrText = a => [[a.numrue, a.adresse].filter(Boolean).join(' '), a.ville].filter(Boolean).join(', ') + ['bat', 'escalier', 'etage', 'porte'].filter(k => a[k]).map(k => ` · ${{ bat: 'bât.', escalier: 'esc.', etage: 'étage', porte: 'porte' }[k]} ${a[k]}`).join('') + ((a.code || a.code2) ? ` · code ${[a.code, a.code2].filter(Boolean).join(' / ')}` : '') + (a.interphone ? ` · interphone ${a.interphone}` : '');
  function saveAccount(acc) { const all = accounts(); all[acc.email] = acc; A.store.set('pf-accounts', all); }
  // ancien format : une seule adresse à plat sur le compte
  function addresses(acc) {
    if (!acc) return [];
    if (!acc.addresses) { const a = pickAddr(acc); acc.addresses = a ? [a] : []; }
    return acc.addresses;
  }

  let acAfter = null;
  function account(view = 'login', after) {
    const { openModal, closeModal, $, $$, esc, euro } = A;
    if (after !== undefined) acAfter = after;
    after = acAfter;
    const me = session();
    if (me && (view === 'login' || view === 'create')) view = 'me';
    if (!me && /^(me|edit|addr)$/.test(view)) view = 'login';
    const persoFields = (v = {}) => `${fld('Téléphone *', 'tel', v.tel, 'tel', 'required autocomplete="tel"')}${fld('Email *', 'email', v.email, 'email', 'required autocomplete="email"' + (v.email ? ' readonly' : ''))}
        ${sel('Civilité', 'civ', ['Monsieur', 'Madame', 'Mademoiselle'], v.civ)}${fld('Société', 'societe', v.societe, 'text', 'autocomplete="organization"')}
        ${fld('Nom *', 'nom', v.nom, 'text', 'required autocomplete="family-name"')}${fld('Prénom *', 'prenom', v.prenom, 'text', 'required autocomplete="given-name"')}
        ${fld('Date de naissance', 'naiss', v.naiss, 'date')}`;
    if (view === 'create') {
      openModal('Nouveau compte', `<form class="form" id="acForm">
        ${persoFields()}${sel('Vous nous avez connu par', 'source', ['—'].concat(SOURCES))}
        <h4 class="full">Adresse de livraison <small>(facultatif, utile pour commander en livraison)</small></h4>
        ${addrFields()}
        <p class="form-note full">Votre compte est enregistré sur cet appareil. Il permet de retrouver vos coordonnées, vos adresses et vos commandes.</p>
        <button class="btn btn--dark" type="submit" style="justify-self:start">Créer mon compte</button>
        <p class="full ac-switch">Déjà inscrit ? <button type="button" class="linkish" data-ac="login">Se connecter</button></p>
      </form>`);
      bindAcForm(f => {
        const data = Object.fromEntries(new FormData(f));
        if ((data.adresse || data.ville) && !pickAddr(data)) return 'Pour enregistrer l\'adresse, indiquez la ville et l\'adresse.';
        const acc = {};
        ['tel', 'email', 'civ', 'societe', 'nom', 'prenom', 'naiss', 'source'].forEach(k => { acc[k] = (data[k] || '').trim(); });
        acc.email = acc.email.toLowerCase();
        if (accounts()[acc.email]) return 'Un compte existe déjà avec cet email : connectez-vous.';
        const ad = pickAddr(data);
        Object.assign(acc, { addresses: ad ? [ad] : [], orders: [], points: 0 });
        saveAccount(acc); A.store.set('pf-session', acc.email);
        A.toast(`Bienvenue <b>${esc(acc.prenom)}</b> !`);
      }, after);
    } else if (view === 'login') {
      openModal('Connexion', `<form class="form" id="acForm">
        ${fld('Email', 'email', '', 'email', 'required autocomplete="email"')}${fld('Téléphone', 'tel', '', 'tel', 'required autocomplete="tel"')}
        <button class="btn btn--dark" type="submit" style="justify-self:start">Se connecter</button>
        <p class="full ac-switch">Pas encore de compte ? <button type="button" class="linkish" data-ac="create">Je crée mon compte</button></p>
      </form>`);
      bindAcForm(f => {
        const email = f.email.value.trim().toLowerCase(), acc = accounts()[email];
        if (!acc || normTel(acc.tel) !== normTel(f.tel.value)) return 'Email ou téléphone incorrect.';
        A.store.set('pf-session', email);
        A.toast(`Bon retour <b>${esc(acc.prenom)}</b> !`);
      }, after);
    } else if (view === 'edit') {
      openModal('Mes informations', `<form class="form" id="acForm">${persoFields(me)}
        <button class="btn btn--dark" type="submit" style="justify-self:start">Enregistrer</button>
        <p class="full ac-switch"><button type="button" class="linkish" data-ac="me">← Mon compte</button></p></form>`);
      bindAcForm(f => {
        const data = Object.fromEntries(new FormData(f));
        ['tel', 'civ', 'societe', 'nom', 'prenom', 'naiss'].forEach(k => { me[k] = (data[k] || '').trim(); });
        saveAccount(me); A.toast('Informations enregistrées');
      }, after);
    } else if (view === 'addr') {
      openModal('Nouvelle adresse', `<form class="form" id="acForm">${addrFields({}, true)}
        <button class="btn btn--dark" type="submit" style="justify-self:start">Enregistrer l'adresse</button>
        <p class="full ac-switch"><button type="button" class="linkish" data-ac="me">← Mon compte</button></p></form>`);
      bindAcForm(f => {
        const ad = pickAddr(Object.fromEntries(new FormData(f)));
        if (!ad) return 'Indiquez la ville et l\'adresse.';
        addresses(me).push(ad); saveAccount(me); A.toast('Adresse enregistrée');
      }, after);
    } else {
      const orders = (me.orders || []).slice().reverse(), ads = addresses(me);
      openModal('Mon compte', `<p><b>${esc(me.civ || '')} ${esc(me.prenom)} ${esc(me.nom)}</b><br>${esc(me.email)} · ${esc(me.tel)}</p>
        <p><button type="button" class="linkish" data-ac="edit">Modifier mes informations</button></p>
        <h4>Mes adresses de livraison</h4>
        ${ads.length ? `<ul class="ac-addrs">${ads.map((ad, i) => `<li><span>${ad.nomAdr ? `<b>${esc(ad.nomAdr)}</b> · ` : ''}${esc(addrText(ad))}</span><button type="button" class="linkish" data-deladdr="${i}">Supprimer</button></li>`).join('')}</ul>` : '<p>Aucune adresse enregistrée.</p>'}
        <p><button type="button" class="btn btn--pill" data-ac="addr">+ Ajouter une adresse</button></p>
        <h4>Mes commandes</h4>
        ${orders.length ? `<ul class="ac-orders">${orders.map(o => `<li><b>${esc(o.no)}</b> · ${new Date(o.date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })} · ${esc(o.mode)}<span>${euro(o.total)}</span><small>${o.items.map(i => `${i.qty} × ${esc(i.name)}`).join(', ')}</small></li>`).join('')}</ul>` : '<p>Aucune commande pour l\'instant.</p>'}
        <p style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn btn--dark" href="carte.html">Commander</a><button class="btn btn--ghost" type="button" id="acOut"><span>Se déconnecter</span></button></p>`);
      $('#acOut').addEventListener('click', () => { A.store.set('pf-session', ''); closeModal(); A.toast('Vous êtes déconnecté.'); if (after) after(); });
      $$('[data-deladdr]').forEach(b => b.addEventListener('click', () => { ads.splice(+b.dataset.deladdr, 1); saveAccount(me); account('me'); if (after) after(); }));
    }
  }
  function bindAcForm(handler, after) {
    const f = A.$('#acForm');
    f.addEventListener('submit', e => {
      e.preventDefault();
      if (!f.checkValidity()) { f.reportValidity(); return; }
      const err = handler(f);
      let p = A.$('.ac-err', f);
      if (err) { if (!p) { p = document.createElement('p'); p.className = 'ac-err full'; f.prepend(p); } p.textContent = err; return; }
      A.closeModal();
      if (after) after();
    });
  }

  /* =======================================================
     VISUEL 2D DE LA COMMANDE (planche en bois, profondeur)
     ======================================================= */
  function visual(el, items) {
    if (!window.PF_TRAY) return;
    window.PF_TRAY.render(el, items, { PRODUCTS: A.PRODUCTS, SHOP: window.PF_SHOP, esc: A.esc, freeKeys: A.computeCart().free, reduceMotion: A.reduceMotion });
  }

  /* =======================================================
     PAGE COMMANDE : 3 ÉTAPES
     ======================================================= */
  const PAY = ['Carte bancaire (terminal de paiement)', 'Espèces', 'Tickets restaurant'];
  function promoFor(code, sub) {
    const codes = CONF.promoCodes || {};
    const k = Object.keys(codes).find(c => c.toUpperCase() === code.trim().toUpperCase());
    if (!k) return null;
    const pr = codes[k];
    if (pr.min && sub < pr.min) return { code: k, err: `Ce code est valable dès ${A.euro(pr.min)} d'achat.` };
    const amount = pr.percent ? Math.round(sub * pr.percent) / 100 : (pr.amount || 0);
    return { code: k, label: pr.label || `Code ${k}`, amount: Math.min(amount, sub) };
  }
  function totals() {
    const c = A.computeCart();
    const promoCode = A.store.get('pf-promo', '');
    const promo = promoCode ? promoFor(promoCode, c.total) : null;
    const pdisc = promo && !promo.err ? promo.amount : 0;
    return Object.assign(c, { promo, pdisc, grand: Math.max(0, c.total - pdisc) });
  }

  function checkoutPage() {
    const { $, $$, esc, euro, PRODUCTS, cart, INFO, MODES } = A;
    const root = $('#coStep'), vis = $('#coVisual');
    if (!root) return;
    let step = 1, order = null;
    const steps = $$('[data-step]');

    function go(n) {
      if (n === 2 && !cart.items.length) return;
      step = n;
      steps.forEach(s => { s.classList.toggle('is-current', +s.dataset.step === n); s.classList.toggle('is-done', +s.dataset.step < n); s.disabled = +s.dataset.step > n || n === 3; });
      if (n === 1) stepCart(); else if (n === 2) stepPay(); else stepDone();
      visual(vis, n === 3 && order ? order.items.map(i => ({ id: i.id, size: i.size, qty: i.qty, key: i.key })) : cart.items);
      root.classList.remove('is-in'); void root.offsetWidth; root.classList.add('is-in');
      const top = $('.co__steps').getBoundingClientRect().top + scrollY - 90;
      if (scrollY > top) scrollTo({ top, behavior: A.reduceMotion ? 'auto' : 'smooth' });
    }
    steps.forEach(s => s.addEventListener('click', () => { if (+s.dataset.step < step && step !== 3) go(+s.dataset.step); }));

    const accBar = () => {
      const me = session();
      return me
        ? `<div class="co__acc"><p>Connecté : <b>${esc(me.prenom)} ${esc(me.nom)}</b></p><button type="button" class="btn btn--ghost" data-acc="me"><span>Mon compte</span></button></div>`
        : `<div class="co__acc"><button type="button" class="btn btn--dark" data-acc="create">Je crée mon compte</button><p>Déjà inscrit ?</p><button type="button" class="btn btn--pill" data-acc="login">Se connecter</button></div>`;
    };
    root.addEventListener('click', e => {
      const b = e.target.closest('[data-acc]');
      if (b) account(b.dataset.acc, () => go(step));
    });

    function stepCart() {
      const t = totals();
      const rows = cart.items.map((it, idx) => {
        const p = PRODUCTS[it.id], base = p.s ? p.s[it.size] : p.p, det = describe(it), free = t.free[it.key];
        return `<div class="co__row">
          <div class="co__prod"><img src="${p.img}" alt="" class="${p.cat.pizza ? 'is-pizza' : ''}"><div><p class="co__pname"><small>${esc(p.cat.label)} :</small> ${esc(p.n)}${it.size ? ' ' + it.size : ''}</p>
            ${det.map(d => `<p class="co__det"><span>${esc(d.label)} : ${esc(d.text)}</span>${d.price ? `<em>+${euro(d.price)}</em>` : ''}</p>`).join('')}
            ${free ? `<span class="citem__free">${free > 1 ? free + ' offertes' : 'Offerte !'}</span>` : ''}
            <p class="co__actions">${hasOptions(it.id) ? `<button type="button" class="linkish" data-edit="${idx}">Modifier</button>` : ''}<button type="button" class="linkish" data-del="${idx}">Supprimer</button></p></div></div>
          <div class="co__unit" data-th="Prix unité">${euro(base + optPrice(it))}</div>
          <div class="co__q" data-th="Quantité"><span class="qty"><button data-q="-1" data-idx="${idx}" aria-label="Retirer un ${esc(p.n)}">−</button><span>${it.qty}</span><button data-q="1" data-idx="${idx}" aria-label="Ajouter un ${esc(p.n)}">+</button></span></div>
          <div class="co__tot" data-th="Prix total">${euro((base + optPrice(it)) * it.qty)}</div>
        </div>`;
      }).join('');
      const below = cart.mode === 'Livraison' && t.count && t.grand < INFO.minimum;
      root.innerHTML = `${accBar()}
        <div class="co__bar"><span>Mon panier</span><span>${t.count} article${t.count > 1 ? 's' : ''}</span></div>
        <div class="co__mode"><p>Type de commande : <b>${esc(cart.mode)}</b></p><div class="seg" role="group" aria-label="Type de commande">${MODES.map(m => `<button type="button" data-mode2="${m}" aria-pressed="${m === cart.mode}">${m}</button>`).join('')}</div></div>
        ${cart.items.length ? `<div class="co__table"><div class="co__head"><span>Produit</span><span>Prix unité</span><span>Quantité</span><span>Prix total</span></div>${rows}</div>` : `<div class="co__empty"><p>Votre panier est vide.</p><a class="btn btn--dark" href="carte.html">Voir la carte</a></div>`}
        <div class="co__bar co__bar--promo"><span>Code promo</span></div>
        <form class="co__promo" id="promoForm"><label for="promoIn">Ajouter un bon de réduction</label><div class="field"><input id="promoIn" value="${esc(t.promo ? t.promo.code : '')}" autocomplete="off" placeholder="CODE"></div><button class="btn btn--pill" type="submit">Valider</button>
          <p class="co__promo-msg" aria-live="polite">${t.promo ? (t.promo.err ? esc(t.promo.err) : `Code <b>${esc(t.promo.code)}</b> appliqué : − ${euro(t.pdisc)} <button type="button" class="linkish" data-unpromo>retirer</button>`) : ''}</p></form>
        <div class="co__sum">
          <p class="line"><span>Sous-total</span><span>${euro(t.sub)}</span></p>
          ${t.disc ? `<p class="line line--disc"><span>Offre : ${esc(t.offer.label)}</span><span>− ${euro(t.disc)}</span></p>` : ''}
          ${t.pdisc ? `<p class="line line--disc"><span>${esc(t.promo.label)}</span><span>− ${euro(t.pdisc)}</span></p>` : ''}
          <p class="line"><span>Livraison</span><span>${cart.mode === 'Livraison' ? 'Gratuite · 40 min' : '—'}</span></p>
          <p class="co__total"><span>Total</span><span>${euro(t.grand)}</span></p>
          ${below ? `<p class="cart__warn">Minimum de commande en livraison : ${euro(INFO.minimum)}. Il manque ${euro(INFO.minimum - t.grand)}.</p>` : ''}
          <button class="btn btn--dark btn--full" type="button" id="coNext"${!cart.items.length || below ? ' disabled' : ''}>Je valide ma commande ${A.ARROW}</button>
        </div>
        <div class="co__more"><p class="eyebrow">Pizza Food vous propose aussi</p><div class="co__sugg">${[['boissons', '82'], ['desserts', '196'], ['glaces', '2']].map(([cid, pid]) => { const pr = PRODUCTS[pid]; return pr ? `<a class="co__sug" href="carte.html#cat-${cid}"><img src="${pr.img}" alt="" loading="lazy"><span>${esc(pr.cat.label)}</span><b>Découvrir</b></a>` : ''; }).join('')}</div></div>`;
    }
    root.addEventListener('click', e => {
      if (step !== 1) return;
      const q = e.target.closest('[data-q]'), del = e.target.closest('[data-del]'), ed = e.target.closest('[data-edit]'), md = e.target.closest('[data-mode2]');
      if (q) { const it = cart.items[+q.dataset.idx]; it.qty += +q.dataset.q; if (it.qty <= 0) cart.items.splice(+q.dataset.idx, 1); A.saveCart(); A.renderCart(); go(1); }
      if (del) { cart.items.splice(+del.dataset.del, 1); A.saveCart(); A.renderCart(); go(1); }
      if (ed) { const it = cart.items[+ed.dataset.edit]; compose({ id: it.id, size: it.size, edit: it }); }
      if (md) { A.setMode(md.dataset.mode2, true, md); go(1); }
      if (e.target.closest('[data-unpromo]')) { A.store.set('pf-promo', ''); go(1); }
      if (e.target.closest('#coNext')) go(2);
    });
    root.addEventListener('submit', e => {
      if (e.target.id !== 'promoForm') return;
      e.preventDefault();
      const code = $('#promoIn').value.trim();
      if (!code) return;
      const pr = promoFor(code, A.computeCart().total);
      if (!pr) { $('.co__promo-msg').textContent = 'Ce code promo n\'est pas valide.'; return; }
      A.store.set('pf-promo', pr.code); go(1);
    });
    document.addEventListener('pf:cart', () => { if (step === 1) go(1); else if (step === 2) visual(vis, cart.items); });

    function days() {
      const out = [], d = new Date();
      for (let i = 0; out.length < 7 && i < 10; i++) {
        const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i);
        if (x.getDay() === 0) continue; // fermé le dimanche
        out.push([x.toISOString().slice(0, 10), i === 0 ? 'Aujourd\'hui' : i === 1 ? 'Demain' : x.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })]);
      }
      return out;
    }
    function hours(dayIso) {
      const now = new Date(), today = dayIso === now.toISOString().slice(0, 10);
      const lead = cart.mode === 'Livraison' ? 40 : 20, out = [];
      const open = now.getDay() !== 0 && now.getHours() >= 11 && now.getHours() < 23;
      if (today && open) { const t = new Date(now.getTime() + lead * 60000); out.push(['asap', `Dès que possible (vers ${t.getHours()}h${String(t.getMinutes()).padStart(2, '0')})`]); }
      for (let m = 11 * 60 + 30; m <= 22 * 60 + 45; m += 15) {
        if (today && m < now.getHours() * 60 + now.getMinutes() + lead) continue;
        const h = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
        out.push([h, h]);
      }
      return out;
    }
    function stepPay() {
      const acc = session(), me = acc || {}, saved = A.store.get('pf-checkout', {});
      const v = k => me[k] || saved[k] || '';
      const deliv = cart.mode === 'Livraison';
      const ds = days();
      const ads = addresses(acc);
      // adresse : celles du compte, ou une nouvelle pour cette commande
      const addrBlock = !deliv ? `<p class="full co__where">${cart.mode === 'À emporter' ? 'À retirer' : 'Sur place'} au <b>${esc(INFO.address)}, ${esc(INFO.city)}</b>.</p>` : `<h3 class="full">Adresse de livraison</h3>
          ${ads.length ? `<div class="full co__addrs" role="radiogroup" aria-label="Adresse de livraison">${ads.map((ad, i) => `<label class="co__addr"><input type="radio" name="addrPick" value="${i}"${i === 0 ? ' checked' : ''}><span><b>${esc(ad.nomAdr || 'Adresse enregistrée')}</b>${esc(addrText(ad))}</span></label>`).join('')}<label class="co__addr co__addr--new"><input type="radio" name="addrPick" value="new"><span><b>+ Nouvelle adresse</b>Pour cette commande</span></label></div>` : ''}
          <div class="full co__newaddr" id="newAddr"${ads.length ? ' hidden' : ''}>${addrFields(ads.length ? {} : pickAddr(saved) || {}, true)}
            ${acc ? `<label class="full co__cgv"><input type="checkbox" name="saveAddr" checked> <span>Enregistrer cette adresse sur mon compte</span></label>` : ''}</div>`;
      root.innerHTML = `${accBar()}
        <form class="form co__form" id="payForm" novalidate>
          <h3 class="full">Vos informations</h3>
          ${sel('Civilité', 'civ', ['Monsieur', 'Madame', 'Mademoiselle'], v('civ'))}${fld('Société', 'societe', v('societe'), 'text', 'autocomplete="organization"')}
          ${fld('Nom *', 'nom', v('nom'), 'text', 'required autocomplete="family-name"')}${fld('Prénom *', 'prenom', v('prenom'), 'text', 'required autocomplete="given-name"')}
          ${fld('Téléphone *', 'tel', v('tel'), 'tel', 'required autocomplete="tel" pattern="[0-9 +.]{10,}"')}${fld('Email *', 'email', v('email'), 'email', 'required autocomplete="email"')}
          ${fld('Date de naissance', 'naiss', v('naiss'), 'date')}
          ${addrBlock}
          <div class="full"><label for="ac-rem">Remarques</label><div class="field"><textarea id="ac-rem" name="remarques" rows="3">${esc(saved.remarques || '')}</textarea></div></div>
          <h3 class="full">Mode de paiement</h3>
          <div class="full radios">${PAY.map((m, i) => `<label><input type="radio" name="paiement" value="${esc(m)}"${(saved.paiement ? saved.paiement === m : i === 0) ? ' checked' : ''}><span>${esc(m)}</span></label>`).join('')}</div>
          <p class="full form-note">Paiement ${deliv ? 'à la livraison' : 'au retrait'}, comme indiqué dans nos CGV.</p>
          <h3 class="full">Quand ?</h3>
          <div><label for="ac-jour">Jour</label><div class="field"><select id="ac-jour" name="jour">${ds.map(([iso, l]) => `<option value="${iso}">${esc(l)}</option>`).join('')}</select></div></div>
          <div><label for="ac-heure">Heure</label><div class="field"><select id="ac-heure" name="heure"></select></div></div>
          <div class="full"><label>Rappel par</label><div class="radios">${['Email', 'SMS'].map((m, i) => `<label><input type="radio" name="rappel" value="${m}"${(saved.rappel ? saved.rappel === m : i === 0) ? ' checked' : ''}><span>${m}</span></label>`).join('')}</div></div>
          ${acc ? '' : `<label class="full co__cgv"><input type="checkbox" name="mkAcc"> <span>Créer mon compte avec ces informations (pour les retrouver à la prochaine commande)</span></label>`}
          <label class="full co__cgv"><input type="checkbox" name="cgv" required> <span>J'accepte les <button type="button" class="linkish" data-modal="cgv">conditions générales de vente</button></span></label>
          <p class="full ac-err" hidden></p>
          <div class="full co__btns"><button class="btn btn--ghost" type="button" id="coBack"><span>← Mon panier</span></button><button class="btn btn--dark" type="submit">Valider ma commande · ${euro(totals().grand)}</button></div>
        </form>`;
      const f = $('#payForm'), jour = $('#ac-jour'), heure = $('#ac-heure');
      const fillH = () => { const hs = hours(jour.value); heure.innerHTML = hs.length ? hs.map(([k, l]) => `<option value="${k}">${l}</option>`).join('') : '<option value="">Plus de créneau ce jour</option>'; };
      jour.addEventListener('change', fillH); fillH();
      const na = $('#newAddr');
      const toggleNew = () => {
        const pick = $('input[name="addrPick"]:checked', f), isNew = !pick || pick.value === 'new';
        if (na) { na.hidden = !isNew; $$('input, select', na).forEach(i => { i.disabled = !isNew; }); }
        $$('.co__addr', f).forEach(l => l.classList.toggle('is-on', $('input', l).checked));
      };
      f.addEventListener('change', e => { if (e.target.name === 'addrPick') toggleNew(); });
      toggleNew();
      if (!hours(ds[0][0]).length && ds[1]) { jour.value = ds[1][0]; fillH(); }
      $('#coBack').addEventListener('click', () => go(1));
      f.addEventListener('submit', e => {
        e.preventDefault();
        const err = $('.ac-err', f);
        if (!f.checkValidity() || !heure.value) {
          err.hidden = false; err.textContent = !heure.value ? 'Choisissez un créneau.' : 'Merci de compléter les champs obligatoires (*) et d\'accepter les CGV.';
          const bad = f.querySelector(':invalid'); if (bad) bad.focus();
          return;
        }
        const data = Object.fromEntries(new FormData(f));
        let ad = null;
        if (deliv) {
          ad = data.addrPick && data.addrPick !== 'new' ? ads[+data.addrPick] : pickAddr(data);
          if (!ad) { err.hidden = false; err.textContent = 'Indiquez la ville et l\'adresse de livraison.'; return; }
        }
        const client = {};
        ['civ', 'societe', 'nom', 'prenom', 'tel', 'email', 'naiss', 'remarques', 'paiement', 'jour', 'heure', 'rappel'].forEach(k => { client[k] = (data[k] || '').trim(); });
        if (ad) Object.assign(client, ad);
        // enregistrement sur le compte (nouvelle adresse) ou création du compte
        if (acc && ad && data.saveAddr && !ads.some(x => addrText(x) === addrText(ad))) { ads.push(ad); saveAccount(acc); }
        if (!acc && data.mkAcc) {
          const email = client.email.toLowerCase();
          if (!accounts()[email]) {
            saveAccount({ tel: client.tel, email, civ: client.civ, societe: client.societe, nom: client.nom, prenom: client.prenom, naiss: client.naiss, addresses: ad ? [ad] : [], orders: [], points: 0 });
            A.store.set('pf-session', email);
          }
        }
        A.store.set('pf-checkout', Object.assign({ paiement: client.paiement, rappel: client.rappel, remarques: client.remarques }, acc ? {} : client));
        placeOrder(client);
      });
    }
    function placeOrder(client) {
      const t = totals();
      const no = 'PF-' + Date.now().toString(36).toUpperCase().slice(-6);
      order = {
        no, date: Date.now(), mode: cart.mode, client,
        items: cart.items.map(it => { const p = PRODUCTS[it.id], base = p.s ? p.s[it.size] : p.p; return { id: it.id, key: it.key, size: it.size, qty: it.qty, name: p.n + (it.size ? ' ' + it.size : ''), cat: p.cat.label, unit: base + optPrice(it), lines: describe(it), free: t.free[it.key] || 0 }; }),
        sub: t.sub, disc: t.disc, offer: t.offer ? t.offer.label : '', promo: t.pdisc ? { code: t.promo.code, amount: t.pdisc } : null, total: t.grand
      };
      const me = session();
      if (me) { const all = accounts(); all[me.email].orders = (all[me.email].orders || []).concat([order]); A.store.set('pf-accounts', all); }
      cart.items.splice(0); A.saveCart(); A.renderCart(); A.store.set('pf-promo', '');
      go(3);
    }
    function orderText(o) {
      const c = o.client, L = [];
      L.push(`Commande ${o.no} — ${o.mode}`, `${c.civ || ''} ${c.prenom} ${c.nom} · ${c.tel} · ${c.email}`);
      if (c.adresse) L.push(`Adresse : ${addrText(c)}`);
      L.push(`Quand : ${c.heure === 'asap' ? 'dès que possible' : c.jour + ' à ' + c.heure} · Paiement : ${c.paiement} · Rappel : ${c.rappel}`, '');
      o.items.forEach(i => { L.push(`${i.qty} × ${i.cat} : ${i.name} — ${euro(i.unit * i.qty)}`); i.lines.forEach(d => L.push(`   ${d.label} : ${d.text}`)); });
      L.push('', `Sous-total : ${euro(o.sub)}`);
      if (o.disc) L.push(`Offre (${o.offer}) : − ${euro(o.disc)}`);
      if (o.promo) L.push(`Code ${o.promo.code} : − ${euro(o.promo.amount)}`);
      L.push(`TOTAL : ${euro(o.total)}`);
      if (c.remarques) L.push('', 'Remarques : ' + c.remarques);
      return L.join('\n');
    }
    function stepDone() {
      const o = order, c = o.client;
      const when = c.heure === 'asap' ? 'dès que possible' : `${new Date(c.jour + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à ${c.heure}`;
      const mail = `mailto:${INFO.email}?subject=${encodeURIComponent('Commande ' + o.no)}&body=${encodeURIComponent(orderText(o))}`;
      root.innerHTML = `<div class="co__done">
        <p class="eyebrow">Confirmation</p>
        <h2 class="title-3d title-3d--md">Merci ${esc(c.prenom)} !</h2>
        <p class="co__no">Commande <b>${esc(o.no)}</b> · ${esc(o.mode)} · ${esc(when)}</p>
        <div class="co__recap">${o.items.map(i => `<p class="co__rline"><span><b>${i.qty} × ${esc(i.name)}</b>${i.lines.map(d => `<small>${esc(d.label)} : ${esc(d.text)}</small>`).join('')}${i.free ? `<small class="citem__free">${i.free} offerte${i.free > 1 ? 's' : ''}</small>` : ''}</span><span>${euro(i.unit * i.qty)}</span></p>`).join('')}
          ${o.disc ? `<p class="co__rline line--disc"><span>Offre : ${esc(o.offer)}</span><span>− ${euro(o.disc)}</span></p>` : ''}
          ${o.promo ? `<p class="co__rline line--disc"><span>Code ${esc(o.promo.code)}</span><span>− ${euro(o.promo.amount)}</span></p>` : ''}
          <p class="co__total"><span>Total</span><span>${euro(o.total)}</span></p></div>
        <p>${o.mode === 'Livraison' ? `Livraison au ${esc((c.numrue || '') + ' ' + c.adresse)}, ${esc(c.ville)}.` : `${o.mode === 'À emporter' ? 'À retirer' : 'Sur place'} au ${esc(INFO.address)}, ${esc(INFO.city)}.`} Paiement : ${esc(c.paiement)}.</p>
        <p class="co__send">Envoyez la commande au restaurant pour qu'elle parte en cuisine :</p>
        <div class="co__btns"><a class="btn btn--dark" href="${mail}">Envoyer ma commande ${A.ARROW}</a><a class="btn btn--pill" href="${INFO.tel1Href}">Appeler le ${INFO.tel1}</a></div>
        <p class="form-note">L'envoi ouvre votre messagerie avec la commande pré-remplie, à destination de ${esc(INFO.email)}.</p>
        <p><a class="linkish" href="carte.html">Retour à la carte</a></p>
      </div>`;
    }
    go(1);
  }

  window.PF_SHOP = {
    init(api) {
      A = api;
      // liens « Se connecter » / « Je crée mon compte » à l'intérieur de la fenêtre
      document.addEventListener('click', e => { const b = e.target.closest('#modal [data-ac]'); if (b) account(b.dataset.ac); });
      if (api.page === 'commande') checkoutPage();
    },
    hasOptions, optionsFor, optPrice, describe, optKey, compose, account, visual
  };
})();
