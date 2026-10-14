/* =========================================================
   PIZZA FOOD — interactions, animations au scroll & panier
   Vanilla JS, aucune dépendance.
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

  document.documentElement.classList.add('js');

  /* =======================================================
     DONNÉES — reprises du site pizza-food.fr
     ======================================================= */
  const P_STD = { Junior: 11, Senior: 17, Mega: 23 };
  const P_PREM = { Junior: 11, Senior: 18, Mega: 25 };
  const P_MARG = { Junior: 8, Senior: 12, Mega: 16 };

  const MENU = [
    {
      id: 'tomate', label: 'Pizzas tomate', kind: 'pizza', sauce: 'tomato',
      note: 'Base sauce tomate · Junior, Senior ou Mega',
      items: [
        ['Marguerita', 'Sauce tomate, fromage, olives.', P_MARG],
        ['Reine', 'Sauce tomate, fromage, jambon, champignons.', P_STD],
        ['Napolitaine', 'Sauce tomate, fromage, anchois, câpres, olives.', P_STD],
        ['Végétarienne', 'Sauce tomate, fromage, champignons, tomates fraîches, poivrons, oignons, olives.', P_STD],
        ['Paysanne', 'Sauce tomate, fromage, lardons, œuf.', P_STD],
        ['Texas', 'Sauce tomate, fromage, pepperoni, viande hachée, oignons.', P_STD],
        ['Campione', 'Sauce tomate, fromage, viande hachée, champignons, œuf.', P_STD],
        ['Neptune', 'Sauce tomate, fromage, thon, poivrons, œuf, olives.', P_STD],
        ['Buffalo', 'Sauce tomate, mozzarella, viande hachée, poivrons, oignons rouges, sauce barbecue.', P_STD],
        ['Bolognaise', 'Sauce tomate, fromage, viande hachée, pommes de terre, oignons.', P_STD],
        ['Orientale', 'Sauce tomate, fromage, merguez, poivrons, œuf, olives.', P_STD],
        ['4 Saisons', 'Sauce tomate, fromage, jambon, artichauts, champignons, poivrons.', P_STD],
        ['Chicken', 'Sauce tomate, fromage, poulet, pommes de terre, poivrons, fromage à raclette.', P_STD],
        ['Boursin', 'Sauce tomate, fromage, viande hachée, oignons, boursin.', P_STD],
        ['Kebab', 'Sauce tomate, fromage, viande de kebab, tomates fraîches, œuf, origan.', P_STD],
        ['Mexicaine', 'Sauce tomate, fromage, poulet paprika, poivrons, oignons, tomates fraîches.', P_STD],
        ['4 Fromages', 'Sauce tomate, fromage, assortiment de 4 fromages.', P_STD],
        ['3 Jambons', 'Sauce tomate, fromage, jambon, chorizo, lardons.', P_STD]
      ]
    },
    {
      id: 'creme', label: 'Pizzas crème fraîche', kind: 'pizza', sauce: 'cream',
      note: 'Base crème fraîche · Junior, Senior ou Mega',
      items: [
        ['Fermière', 'Crème fraîche, fromage, poulet, pommes de terre.', P_STD],
        ['Milano', 'Crème fraîche, fromage, lardons, raclette, pommes de terre, oignons.', P_STD],
        ['Tartiflette', 'Crème fraîche, fromage, lardons, reblochon, pommes de terre, oignons.', P_STD],
        ['Capricieuse', 'Crème fraîche, fromage, jambon, pommes de terre, oignons.', P_STD],
        ['Spéciale', 'Crème fraîche, fromage, viande hachée, pommes de terre, reblochon, oignons.', P_STD],
        ['Casanova', 'Crème fraîche, fromage, bacon, reblochon, pommes de terre.', P_STD],
        ['Chèvre miel', 'Crème fraîche, fromage, chèvre, miel.', P_PREM],
        ['Hawaïenne poulet', 'Crème fraîche, fromage, poulet, ananas.', P_PREM],
        ['Hawaïenne jambon', 'Crème fraîche, fromage, jambon, ananas.', P_PREM],
        ['Pacifico', 'Crème fraîche, fromage, saumon fumé.', P_PREM],
        ['Tartoffu', 'Crème fraîche, mozzarella, crème de truffe, champignons.', P_PREM],
        ['Toscane', 'Crème fraîche, mozzarella, poulet, chèvre, miel, noix.', P_PREM]
      ]
    },
    {
      id: 'bbq', label: 'Pizzas barbecue', kind: 'pizza', sauce: 'bbq',
      note: 'Base sauce barbecue · Junior, Senior ou Mega',
      items: [
        ['Miami', 'Sauce barbecue, fromage, poulet, viande hachée, oignons.', P_STD],
        ['Latina', 'Sauce barbecue, fromage, jambon, poulet, champignons.', P_STD],
        ['Playa', 'Sauce barbecue, fromage, poulet rôti, bacon, poivrons, oignons rouges.', P_STD],
        ['Crousty', 'Sauce barbecue, mozzarella, cheddar, tenders crispy, olives, poivrons, oignons rouges.', P_STD],
        ['Indienne', 'Sauce curry, chicken curry, chicken tandoori, cheddar, tenders crispy, olives, poivrons, oignons rouges.', P_PREM]
      ]
    },
    {
      id: 'burgers', label: 'Burgers', kind: 'single', art: '.art-burger',
      note: 'Tous les burgers sont servis avec des frites',
      items: [
        ['Cheese', '1 steak 45g, cheddar + frites.', 5],
        ['Double cheese', '2 steaks 45g, double cheddar + frites.', 6.5],
        ['Royal cheese', 'Steak 90g, double cheddar, crudités + frites.', 6.5],
        ['Chicken burger', 'Poulet pané, cheddar + frites.', 6.5],
        ['Double royal', '2 steaks 90g, cheddar, crudités + frites.', 7.5],
        ['Triple cheese', '3 steaks 45g, triple cheddar + frites.', 7.5],
        ['Double chicken', 'Double poulet pané, double cheddar + frites.', 8],
        ['Fish', 'Poisson pané, cheddar + frites.', 8],
        ['Double fish', 'Double poisson pané, double cheddar + frites.', 8],
        ['Le 180', '1 steak 180g, cheddar, crudités + frites.', 9],
        ['Le 360', '2 steaks 180g, double cheddar, crudités + frites.', 11],
        ['Le Mastoc', '3 steaks 180g, triple cheddar, crudités + frites.', 13]
      ]
    },
    {
      id: 'tacos', label: 'Tacos', kind: 'single', art: '.art-tacos',
      note: 'Garnis de frites + sauce fromagère',
      items: [
        ['Tacos 1 viande', 'Frites, sauce fromagère + 1 viande au choix.', 8],
        ['Tacos 2 viandes', 'Frites, sauce fromagère + 2 viandes au choix.', 9],
        ['Tacos 3 viandes', 'Frites, sauce fromagère + 3 viandes au choix.', 11],
        ['Tacos 4 viandes', 'Frites, sauce fromagère + 4 viandes au choix.', 13]
      ]
    },
    {
      id: 'menus', label: 'Menus', kind: 'single', art: '.art-box',
      note: 'Pour un, pour deux ou pour toute la bande',
      items: [
        ['Menu Solo', '1 pizza Junior au choix + 6 wings ou 6 nuggets + 1 boisson 33cl au choix.', 14.5],
        ['Menu Triple', '3 pizzas Junior au choix + 1 boisson maxi 1,5L.', 26],
        ['Menu Duo', '2 pizzas Senior au choix + 10 wings ou 10 nuggets + 1 boisson maxi 1,5L.', 29]
      ]
    },
    {
      id: 'desserts', label: 'Desserts', kind: 'single', art: '.art-tiramisu',
      note: 'Les tiramisus sont faits maison',
      items: [
        ['Salade de fruits', 'Fraîcheur garantie.', 2.5],
        ['Brownie', 'Chocolat, fondant au cœur.', 3.5],
        ['Fondant au chocolat', 'Pour les vrais gourmands.', 3.5],
        ['Tarte au citron', 'Acidulée juste comme il faut.', 3.5],
        ['Tarte aux pommes', 'Le classique.', 3.5],
        ['Tarte aux poires', 'Tout en douceur.', 3.5],
        ['Tarte aux Daim', 'Caramel croquant.', 3.5],
        ['Tiramisu Kinder', 'Fait maison.', 3.5],
        ['Tiramisu Oreo', 'Fait maison.', 3.5],
        ['Tiramisu M&M\'s', 'Fait maison.', 3.5],
        ['Tiramisu caramel', 'Fait maison.', 3.5],
        ['Tiramisu spéculoos', 'Fait maison.', 3.5],
        ['Tiramisu Nutella', 'Fait maison.', 3.5],
        ['Tiramisu Daim', 'Fait maison.', 3.5]
      ]
    }
  ];

  const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  // Index des pizzas par slug (pour les recettes SVG)
  const PIZZAS = {};
  MENU.filter(c => c.kind === 'pizza').forEach(cat => {
    cat.items.forEach(([name, desc, prices]) => {
      PIZZAS[slug(name)] = { name, desc, prices, sauce: /curry/i.test(desc) ? 'curry' : cat.sauce };
    });
  });

  const STARS = [
    { id: 'reine', tag: 'La classique' },
    { id: 'chevre-miel', tag: 'Sucré-salé' },
    { id: 'texas', tag: 'Pepperoni' },
    { id: 'tartoffu', tag: 'Truffe' },
    { id: 'indienne', tag: 'Curry' },
    { id: 'toscane', tag: 'Noix & miel' }
  ];

  const ZONES = [
    'Chennevières-sur-Marne', 'Ormesson-sur-Marne', 'Sucy-en-Brie', 'Champigny-sur-Marne',
    'La Queue-en-Brie', 'Le Plessis-Trévise', 'Saint-Maur-des-Fossés', 'La Varenne Saint-Hilaire',
    'Bonneuil-sur-Marne', 'Villiers-sur-Marne', 'Noiseau'
  ];

  /* =======================================================
     GÉNÉRATEUR DE PIZZAS SVG
     Chaque pizza est dessinée à partir de sa liste
     d'ingrédients, puis découpée en 8 parts animables.
     ======================================================= */
  const CH = '#292a2c';
  const SAUCES = {
    tomato: { sauce: '#e8300c', cheese: '#ffc700' },
    cream: { sauce: '#fff1d6', cheese: '#f6e653' },
    bbq: { sauce: '#7a2410', cheese: '#ffc700' },
    curry: { sauce: '#f29a00', cheese: '#ffe27a' }
  };

  const TOPPINGS = {
    olive: () => `<circle r="6.5" fill="${CH}"/><circle r="2.6" fill="#ff4100"/>`,
    basil: () => `<path d="M0-11C8-6 8 6 0 11-8 6-8-6 0-11z" fill="#1f8a4c" stroke="${CH}" stroke-width="1.6"/><path d="M0-8V9" stroke="${CH}" stroke-width="1.2"/>`,
    ham: () => `<rect x="-8" y="-6.5" width="16" height="13" rx="3" fill="#fdbeba" stroke="#e07c7c" stroke-width="1.6"/>`,
    mushroom: () => `<path d="M-9 1a9 8 0 0 1 18 0z" fill="#fee3c1" stroke="${CH}" stroke-width="1.6"/><path d="M-3 1h6v7h-6z" fill="#fee3c1" stroke="${CH}" stroke-width="1.6"/>`,
    anchovy: () => `<path d="M-11 0q11-6 22 0q-11 6-22 0z" fill="#8a7b6e" stroke="${CH}" stroke-width="1.2"/>`,
    caper: () => `<circle r="3.2" fill="#6f8f2c" stroke="${CH}" stroke-width="1"/>`,
    tomato: () => `<circle r="9" fill="#e8240b" stroke="${CH}" stroke-width="1.5"/><circle r="5.8" fill="#ff6a3d"/><circle cx="-2.5" cy="-1" r="1.3" fill="#ffc700"/><circle cx="2.5" cy="-1" r="1.3" fill="#ffc700"/><circle cy="2.5" r="1.3" fill="#ffc700"/>`,
    pepper: () => `<path d="M-8 4q8-14 16 0" fill="none" stroke="#1f8a4c" stroke-width="4" stroke-linecap="round"/>`,
    onion: () => `<circle r="7" fill="none" stroke="#c0569a" stroke-width="2.4"/><circle r="3.5" fill="none" stroke="#e9a0c8" stroke-width="1.6"/>`,
    bacon: () => `<rect x="-5" y="-4" width="10" height="8" rx="1.8" fill="#ff8f7a" stroke="#b3412a" stroke-width="1.4"/>`,
    egg: () => `<path d="M-11 0c0-7 5-10 11-9s11 4 10 10-6 9-12 8-9-3-9-9z" fill="#fff" stroke="${CH}" stroke-width="1.4"/><circle r="5" fill="#ff9d00" stroke="${CH}" stroke-width="1.2"/>`,
    pepperoni: () => `<circle r="10" fill="#c41e00" stroke="#7a1200" stroke-width="1.6"/><circle cx="-3" cy="-3" r="1.6" fill="#ff6a3d"/><circle cx="3.5" cy="1" r="1.6" fill="#ff6a3d"/><circle cx="-1" cy="4" r="1.3" fill="#ff6a3d"/>`,
    beef: () => `<path d="M-6-3l4-4 6 2 2 5-4 4-6-1z" fill="#6b2a14" stroke="${CH}" stroke-width="1"/>`,
    tuna: () => `<path d="M-7-2l5-4 7 1 2 5-5 4-7-2z" fill="#f2c4a8" stroke="#b98b6f" stroke-width="1.3"/>`,
    merguez: () => `<rect x="-9" y="-3.5" width="18" height="7" rx="3.5" fill="#8f1d0b" stroke="${CH}" stroke-width="1.2"/>`,
    artichoke: () => `<path d="M0-8C6-4 7 4 0 8-7 4-6-4 0-8z" fill="#a3b53a" stroke="${CH}" stroke-width="1.3"/><path d="M0-5V6" stroke="#6f8f2c" stroke-width="1.3"/>`,
    chicken: () => `<path d="M-8-3l5-5 8 1 3 6-4 6-9-1z" fill="#f4d9a8" stroke="#c48a3a" stroke-width="1.5"/>`,
    potato: () => `<rect x="-4.5" y="-4.5" width="9" height="9" rx="2" fill="#f6e653" stroke="#c9a400" stroke-width="1.3"/>`,
    whitecheese: () => `<path d="M-8-5h16l-3 10h-10z" fill="#fff6d6" stroke="#d6c08a" stroke-width="1.3"/>`,
    goat: () => `<circle r="8" fill="#ffffff" stroke="#e0d6c5" stroke-width="1.6"/><circle r="5" fill="none" stroke="#efe8dc" stroke-width="1"/>`,
    kebab: () => `<path d="M-9-1q9-5 18 0v3q-9-5-18 0z" fill="#9a4a1f" stroke="${CH}" stroke-width="1"/>`,
    chorizo: () => `<circle r="7" fill="#b8250c" stroke="#7a1200" stroke-width="1.4"/><circle cx="-2" cy="-2" r="1.3" fill="#fdbeba"/><circle cx="2.5" cy="2" r="1.3" fill="#fdbeba"/>`,
    pineapple: () => `<path d="M0-8L8 6H-8z" fill="#ffe14d" stroke="#d4a800" stroke-width="1.5" stroke-linejoin="round"/>`,
    salmon: () => `<path d="M-10-3q10-6 20 0v6q-10-6-20 0z" fill="#ff8a65" stroke="#d65a35" stroke-width="1.2"/><path d="M-6-2v5M0-3v5M6-2v5" stroke="#ffd2c2" stroke-width="1.2"/>`,
    truffle: () => `<circle r="4" fill="#2a1a12"/><circle cx="7" cy="3" r="2" fill="#2a1a12"/>`,
    walnut: () => `<path d="M-6 0a6 5 0 0 1 12 0a6 5 0 0 1-12 0z" fill="#8a5a2b" stroke="${CH}" stroke-width="1.2"/><path d="M0-5v10" stroke="${CH}" stroke-width="1"/>`,
    tenders: () => `<rect x="-8" y="-4" width="16" height="8" rx="4" fill="#d98a2b" stroke="${CH}" stroke-width="1.3"/>`,
    cheddar: () => `<rect x="-5" y="-5" width="10" height="10" fill="#ff9d00" stroke="#c96f00" stroke-width="1.2"/>`
  };

  const KEYWORDS = [
    [/jambon/i, 'ham'], [/champignon/i, 'mushroom'], [/olive/i, 'olive'], [/anchois/i, 'anchovy'],
    [/câpres/i, 'caper'], [/tomates fraîches/i, 'tomato'], [/poivron/i, 'pepper'], [/oignon/i, 'onion'],
    [/lardon|bacon/i, 'bacon'], [/œuf/i, 'egg'], [/pepperoni/i, 'pepperoni'], [/viande hachée/i, 'beef'],
    [/thon/i, 'tuna'], [/merguez/i, 'merguez'], [/artichaut/i, 'artichoke'], [/poulet|chicken/i, 'chicken'],
    [/pommes de terre/i, 'potato'], [/raclette|reblochon|boursin|4 fromages/i, 'whitecheese'], [/chèvre/i, 'goat'],
    [/kebab/i, 'kebab'], [/chorizo/i, 'chorizo'], [/ananas/i, 'pineapple'], [/saumon/i, 'salmon'],
    [/truffe/i, 'truffle'], [/noix/i, 'walnut'], [/tenders/i, 'tenders'], [/cheddar/i, 'cheddar']
  ];

  const SPECIAL = {
    hero: { name: 'Pizza Food', sauce: 'tomato', toppings: ['pepperoni', 'olive', 'basil', 'mushroom'] },
    marguerita: { name: 'Marguerita', sauce: 'tomato', toppings: ['olive', 'basil'] }
  };

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    return () => {
      seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const f = n => n.toFixed(1);

  function wavyCircle(r, amp, waves, phase) {
    let d = '';
    for (let i = 0; i <= 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      const rr = r + amp * Math.sin(a * waves + phase);
      d += (i ? 'L' : 'M') + f(Math.cos(a) * rr) + ' ' + f(Math.sin(a) * rr);
    }
    return d + 'Z';
  }

  function recipeFor(key) {
    if (SPECIAL[key]) return SPECIAL[key];
    const p = PIZZAS[key];
    if (!p) return SPECIAL.marguerita;
    const toppings = KEYWORDS.filter(([re]) => re.test(p.desc)).map(([, t]) => t);
    if (/miel/i.test(p.desc)) toppings.push('honey');
    if (/origan/i.test(p.desc)) toppings.push('oregano');
    return { name: p.name, sauce: p.sauce, toppings };
  }

  let uid = 0;
  function pizzaSVG(key, label) {
    const r = recipeFor(key);
    const rand = rng(hash(r.name));
    const col = SAUCES[r.sauce] || SAUCES.tomato;
    const id = 'pz' + (++uid);
    let g = '';

    // pâte + bulles
    g += `<circle r="95" fill="#f2a33a" stroke="${CH}" stroke-width="3.5"/>`;
    g += `<circle r="86" fill="#ffbf5e"/>`;
    for (let i = 0; i < 12; i++) {
      const a = rand() * Math.PI * 2;
      g += `<ellipse cx="${f(Math.cos(a) * 90)}" cy="${f(Math.sin(a) * 90)}" rx="3.2" ry="2" fill="#d9822b" opacity=".7" transform="rotate(${f(a * 57.3)} ${f(Math.cos(a) * 90)} ${f(Math.sin(a) * 90)})"/>`;
    }
    // sauce + fromage fondu
    g += `<path d="${wavyCircle(80, 2.5, 14, rand() * 6)}" fill="${col.sauce}"/>`;
    g += `<path d="${wavyCircle(68, 6, 11, rand() * 6)}" fill="${col.cheese}"/>`;
    for (let i = 0; i < 9; i++) {
      const a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * 60;
      g += `<circle cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d)}" r="${f(3 + rand() * 5)}" fill="${col.sauce}" opacity=".85"/>`;
    }

    // garnitures
    const placeable = r.toppings.filter(t => TOPPINGS[t]);
    const pts = [];
    const per = placeable.length ? clamp(Math.round(24 / placeable.length), 4, 12) : 0;
    placeable.forEach(t => {
      let n = 0, tries = 0;
      while (n < per && tries < 300) {
        tries++;
        const a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * 66;
        const x = Math.cos(a) * d, y = Math.sin(a) * d;
        if (pts.every(([px, py]) => Math.hypot(px - x, py - y) > 15)) {
          pts.push([x, y]);
          g += `<g transform="translate(${f(x)} ${f(y)}) rotate(${Math.round(rand() * 360)})">${TOPPINGS[t]()}</g>`;
          n++;
        }
      }
    });
    if (r.toppings.includes('honey')) {
      for (let k = 0; k < 2; k++) {
        let d = `M${f(-60 + rand() * 20)} ${f(-40 + k * 50)}`;
        for (let i = 0; i < 6; i++) d += ` q${f(10)} ${f(-14 + rand() * 6)} ${f(20)} 0`;
        g += `<path d="${d}" fill="none" stroke="#f6b100" stroke-width="3" stroke-linecap="round" opacity=".9"/>`;
      }
    }
    if (r.toppings.includes('oregano')) {
      for (let i = 0; i < 26; i++) {
        const a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * 70;
        g += `<circle cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d)}" r="1.2" fill="#1f8a4c"/>`;
      }
    }

    // découpe en 8 parts
    const wedge = (i, rad) => {
      const a0 = (i * 45 - 90) * Math.PI / 180, a1 = a0 + Math.PI / 4;
      return `M0 0L${f(Math.cos(a0) * rad)} ${f(Math.sin(a0) * rad)}A${rad} ${rad} 0 0 1 ${f(Math.cos(a1) * rad)} ${f(Math.sin(a1) * rad)}Z`;
    };
    let defs = `<g id="${id}">${g}</g>`;
    let slices = '';
    for (let i = 0; i < 8; i++) {
      const mid = (i * 45 - 90 + 22.5) * Math.PI / 180;
      defs += `<clipPath id="${id}c${i}"><path d="${wedge(i, 100)}"/></clipPath>`;
      slices += `<g class="slice" style="--dx:${Math.cos(mid).toFixed(3)};--dy:${Math.sin(mid).toFixed(3)}"><use href="#${id}" clip-path="url(#${id}c${i})"/><path class="slice-edge" d="${wedge(i, 95)}"/></g>`;
    }
    const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true" focusable="false"';
    return `<svg viewBox="-110 -110 220 220" ${a11y}><defs>${defs}</defs>${slices}</svg>`;
  }

  function renderPizza(el) {
    const key = el.dataset.recipe;
    const label = el.id === 'heroPizza' ? 'Pizza en rotation' : (el.dataset.label || '');
    el.innerHTML = pizzaSVG(key, label);
  }

  /* =======================================================
     PETITS GÉNÉRATEURS SVG (étoiles, zigzags)
     ======================================================= */
  function burstPath(n, r1, r2) {
    let d = '';
    for (let i = 0; i < n * 2; i++) {
      const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 ? r2 : r1;
      d += (i ? 'L' : 'M') + f(Math.cos(a) * r) + ' ' + f(Math.sin(a) * r);
    }
    return d + 'Z';
  }
  function hydrateShapes(root = document) {
    $$('[data-burst]', root).forEach(p => {
      const [n, r1, r2] = p.dataset.burst.split(',').map(Number);
      p.setAttribute('d', burstPath(n, r1 * 0.97, r2 * 0.97));
    });
    $$('[data-zigzag]', root).forEach(pl => {
      const [w, h, n] = pl.dataset.zigzag.split(',').map(Number);
      const pts = [];
      for (let i = 0; i <= n; i++) pts.push(`${i % 2 ? w - 4 : 4},${f((i / n) * h)}`);
      pl.setAttribute('points', pts.join(' '));
    });
    $$('[data-zigzag-h]', root).forEach(pl => {
      const [w, h, n] = pl.dataset.zigzagH.split(',').map(Number);
      const pts = [];
      for (let i = 0; i <= n; i++) pts.push(`${f((i / n) * w)},${i % 2 ? h - 4 : 4}`);
      pl.setAttribute('points', pts.join(' '));
    });
    $$('.zigzag polyline', root).forEach(pl => {
      try { pl.style.setProperty('--len', Math.ceil(pl.getTotalLength() + 10)); } catch (e) { /* noop */ }
    });
  }

  /* =======================================================
     DÉCOUPE DU TEXTE EN LETTRES
     ======================================================= */
  function splitText(el) {
    if (el.classList.contains('split')) return;
    const label = el.textContent.replace(/\s+/g, ' ').trim();
    let i = 0;
    const walk = node => {
      const frag = document.createDocumentFragment();
      node.childNodes.forEach(child => {
        if (child.nodeType === 3) {
          child.textContent.split(/( )/).forEach(part => {
            if (part === ' ') { frag.appendChild(document.createTextNode(' ')); return; }
            if (!part) return;
            const word = document.createElement('span');
            word.className = 'word';
            [...part].forEach(ch => {
              const c = document.createElement('span');
              c.className = 'char';
              c.textContent = ch;
              c.style.setProperty('--i', i++);
              word.appendChild(c);
            });
            frag.appendChild(word);
          });
        } else if (child.nodeType === 1 && child.tagName !== 'BR') {
          const clone = child.cloneNode(false);
          clone.appendChild(walk(child));
          frag.appendChild(clone);
        } else {
          frag.appendChild(child.cloneNode(true));
        }
      });
      return frag;
    };
    const inner = walk(el);
    el.textContent = '';
    const wrap = document.createElement('span');
    wrap.setAttribute('aria-hidden', 'true');
    wrap.appendChild(inner);
    el.appendChild(wrap);
    if (!el.closest('[aria-label]')) el.setAttribute('aria-label', label);
    el.classList.add('split');
  }

  /* =======================================================
     RENDUS : stars, carte, zones
     ======================================================= */
  function sizeChips(name, prices, recipe) {
    return Object.entries(prices).map(([size, price]) =>
      `<button class="chip" data-add="${name}" data-size="${size}" data-price="${price}" data-recipe="${recipe || ''}" aria-label="Ajouter ${name} ${size} ${euro(price)}"><small>${size}</small><b>${String(price).replace('.', ',')}€</b></button>`
    ).join('');
  }

  function renderStars() {
    const grid = $('#starsGrid');
    grid.innerHTML = STARS.map(({ id, tag }, i) => {
      const p = PIZZAS[id];
      const short = p.desc.replace(/^(Sauce \w+|Crème fraîche), (fromage|mozzarella), /i, '').replace(/\.$/, '');
      return `<article class="star" data-reveal="up" style="--d:${(i % 3) * 120}ms">
        <div class="star__inner">
          <div class="star__burst" data-cursor="Une part ?">
            <svg viewBox="-50 -50 100 100" aria-hidden="true"><path data-burst="${14 + (i % 3) * 3},50,41"/></svg>
            <span class="star__tag">${tag}</span>
            <div class="pizza" data-recipe="${id}" data-label="Pizza ${p.name}"></div>
          </div>
          <h3 class="star__name">${p.name}</h3>
          <p class="star__desc">${short.charAt(0).toUpperCase() + short.slice(1)}.</p>
          <div class="star__sizes">${sizeChips(p.name, p.prices, id)}</div>
        </div>
      </article>`;
    }).join('');
    hydrateShapes(grid);
    $$('.pizza', grid).forEach(renderPizza);
  }

  let currentTab = MENU[0].id;
  function renderTabs() {
    const tabs = $('#tabs');
    tabs.innerHTML = MENU.map(c =>
      `<button class="tab" role="tab" id="tab-${c.id}" aria-controls="menuList" aria-selected="${c.id === currentTab}" tabindex="${c.id === currentTab ? 0 : -1}" data-tab="${c.id}" data-cursor="${c.label.split(' ')[0]}">${c.label}</button>`
    ).join('');
    tabs.addEventListener('click', e => {
      const b = e.target.closest('[data-tab]');
      if (b) selectTab(b.dataset.tab, true);
    });
    tabs.addEventListener('keydown', e => {
      if (!['ArrowRight', 'ArrowLeft'].includes(e.key)) return;
      const idx = MENU.findIndex(c => c.id === currentTab);
      const next = MENU[(idx + (e.key === 'ArrowRight' ? 1 : -1) + MENU.length) % MENU.length];
      selectTab(next.id, true);
      $(`#tab-${next.id}`).focus();
    });
  }

  function selectTab(id, scrollIntoView) {
    currentTab = id;
    $$('.tab').forEach(t => {
      const on = t.dataset.tab === id;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      if (on && scrollIntoView) t.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
    });
    renderMenu();
  }

  function renderMenu() {
    const cat = MENU.find(c => c.id === currentTab);
    const list = $('#menuList');
    list.setAttribute('role', 'tabpanel');
    list.setAttribute('aria-labelledby', `tab-${cat.id}`);
    $('#carteNote').textContent = cat.note;
    list.innerHTML = cat.items.map(([name, desc, price], i) => {
      const id = slug(name);
      const visual = cat.kind === 'pizza'
        ? `<div class="pizza menu-item__pizza" data-recipe="${id}"></div>`
        : `<div class="menu-item__icon" data-art="${cat.art}"></div>`;
      const prices = cat.kind === 'pizza' ? sizeChips(name, price, id)
        : `<button class="chip" data-add="${name}" data-size="" data-price="${price}" aria-label="Ajouter ${name} ${euro(price)}"><b>${euro(price).replace(/\s/g, '')}</b></button>`;
      return `<li class="menu-item" style="--i:${i}">
        ${visual}
        <div class="menu-item__text"><h3 class="menu-item__name">${name}</h3><p class="menu-item__desc">${desc}</p></div>
        <div class="menu-item__prices">${prices}</div>
      </li>`;
    }).join('');
    $$('.pizza', list).forEach(renderPizza);
    $$('[data-art]', list).forEach(el => {
      const art = $(el.dataset.art);
      if (art) {
        const clone = art.cloneNode(true);
        clone.style.width = '78%';
        el.appendChild(clone);
      }
    });
    const items = $$('.menu-item', list);
    requestAnimationFrame(() => requestAnimationFrame(() => items.forEach(it => it.classList.add('is-in'))));
  }

  function renderZones() {
    const colors = [
      ['var(--color-sun-yellow)', 'var(--color-charcoal)'],
      ['var(--color-cream)', 'var(--color-charcoal)'],
      ['var(--color-anger-orange)', 'var(--color-sun-yellow)'],
      ['var(--color-lemon-cream)', 'var(--color-charcoal)']
    ];
    const rand = rng(42);
    $('#zonesList').innerHTML = ZONES.map((z, i) => {
      const [c, t] = i === 0 ? ['var(--color-anger-orange)', 'var(--color-sun-yellow)'] : colors[i % colors.length];
      const r = (rand() * 10 - 5).toFixed(1);
      return `<li class="zone${i === 0 ? ' zone--hq' : ''}" style="--i:${i};--c:${c};--t:${t};--r:${r}deg" data-cursor="Livré !">${z}</li>`;
    }).join('');
  }

  /* =======================================================
     PANIER
     ======================================================= */
  const cart = { items: [], mode: 'Livraison' };
  try {
    const saved = JSON.parse(localStorage.getItem('pf-cart') || 'null');
    if (saved && Array.isArray(saved.items)) Object.assign(cart, saved);
  } catch (e) { /* stockage indisponible */ }
  const save = () => { try { localStorage.setItem('pf-cart', JSON.stringify(cart)); } catch (e) { /* noop */ } };

  function addToCart(name, size, price, recipe, fromEl) {
    const key = name + '|' + size;
    const found = cart.items.find(i => i.key === key);
    if (found) found.qty++;
    else cart.items.push({ key, name, size, price: Number(price), qty: 1, recipe });
    save();
    flyToCart(fromEl, recipe).then(() => {
      renderCart();
      const btn = $('#cartBtn');
      btn.classList.remove('is-bump');
      void btn.offsetWidth;
      btn.classList.add('is-bump');
    });
    toast(`+1 ${name}${size ? ' ' + size : ''} !`);
  }

  function renderCart() {
    const list = $('#cartList');
    const count = cart.items.reduce((s, i) => s + i.qty, 0);
    const total = cart.items.reduce((s, i) => s + i.qty * i.price, 0);
    $('#cartCount').textContent = count;
    $('#cartTotal').textContent = euro(total);
    $('#cartMode').textContent = cart.mode;
    $('#cart').classList.toggle('is-empty', !count);
    list.innerHTML = cart.items.map((it, idx) => `
      <li class="cart__item">
        <div><div class="cart__item-name">${it.name}</div><div class="cart__item-size">${it.size ? it.size + ' · ' : ''}${euro(it.price)}</div></div>
        <div class="cart__item-price">${euro(it.price * it.qty)}</div>
        <div class="qty">
          <button data-qty="-1" data-idx="${idx}" aria-label="Retirer un ${it.name}">−</button>
          <span>${it.qty}</span>
          <button data-qty="1" data-idx="${idx}" aria-label="Ajouter un ${it.name}">+</button>
        </div>
      </li>`).join('');
  }

  $('#cartList').addEventListener('click', e => {
    const b = e.target.closest('[data-qty]');
    if (!b) return;
    const it = cart.items[+b.dataset.idx];
    it.qty += +b.dataset.qty;
    if (it.qty <= 0) cart.items.splice(+b.dataset.idx, 1);
    save();
    renderCart();
  });

  function flyToCart(fromEl, recipe) {
    if (reduceMotion || !fromEl) return Promise.resolve();
    const a = fromEl.getBoundingClientRect();
    const b = $('.nav__cart-ring').getBoundingClientRect();
    const fly = document.createElement('div');
    fly.className = 'flyer';
    fly.innerHTML = `<div class="pizza">${pizzaSVG(recipe && (PIZZAS[recipe] || SPECIAL[recipe]) ? recipe : 'marguerita')}</div>`;
    document.body.appendChild(fly);
    const x0 = a.left + a.width / 2, y0 = a.top + a.height / 2;
    const x1 = b.left + b.width / 2, y1 = b.top + b.height / 2;
    const mx = (x0 + x1) / 2, my = Math.min(y0, y1) - 160;
    const anim = fly.animate([
      { transform: `translate(${x0}px, ${y0}px) scale(.6) rotate(0deg)` },
      { transform: `translate(${mx}px, ${my}px) scale(1.6) rotate(240deg)`, offset: 0.5 },
      { transform: `translate(${x1}px, ${y1}px) scale(.4) rotate(480deg)` }
    ], { duration: 800, easing: 'cubic-bezier(.5,0,.5,1)' });
    return anim.finished.then(() => fly.remove()).catch(() => fly.remove());
  }

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('is-on'), 2200);
  }

  // Ajout depuis n'importe quel bouton [data-add]
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-add]');
    if (!b) return;
    addToCart(b.dataset.add, b.dataset.size, b.dataset.price, b.dataset.recipe, b);
    b.classList.remove('is-added');
    void b.offsetWidth;
    b.classList.add('is-added');
  });

  // Ouverture / fermeture du panier
  const cartEl = $('#cart'), overlay = $('#overlay');
  let lastFocus = null;
  function openCart() {
    lastFocus = document.activeElement;
    cartEl.classList.add('is-open');
    overlay.classList.add('is-open');
    cartEl.setAttribute('aria-hidden', 'false');
    $('#cartClose').focus();
  }
  function closeCart() {
    cartEl.classList.remove('is-open');
    overlay.classList.remove('is-open');
    cartEl.setAttribute('aria-hidden', 'true');
    if (lastFocus) lastFocus.focus();
  }
  $('#cartBtn').addEventListener('click', openCart);
  $('#cartClose').addEventListener('click', closeCart);
  overlay.addEventListener('click', closeCart);
  $('#cartModeChange').addEventListener('click', closeCart);

  // Validation
  const modal = $('#modal');
  $('#checkout').addEventListener('click', () => {
    const total = cart.items.reduce((s, i) => s + i.qty * i.price, 0);
    $('#modalRecap').innerHTML =
      `<p><span>Mode</span><b>${cart.mode}</b></p>` +
      cart.items.map(i => `<p><span>${i.qty} × ${i.name}${i.size ? ' (' + i.size + ')' : ''}</span><span>${euro(i.qty * i.price)}</span></p>`).join('') +
      `<p class="total"><span>Total</span><span>${euro(total)}</span></p>`;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    $('#modalClose').focus();
  });
  const closeModal = () => { modal.classList.remove('is-open'); modal.setAttribute('aria-hidden', 'true'); };
  $('#modalClose').addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (modal.classList.contains('is-open')) closeModal();
    else if (cartEl.classList.contains('is-open')) closeCart();
    else if (mobileMenu.classList.contains('is-open')) toggleMenu(false);
  });

  /* =======================================================
     MODE DE COMMANDE
     ======================================================= */
  const modeCards = $$('.mode__card');
  function setMode(mode, announce) {
    cart.mode = mode;
    save();
    modeCards.forEach(c => c.setAttribute('aria-checked', c.dataset.mode === mode));
    $('#modeStatus').textContent = mode;
    renderCart();
    if (announce) toast(`Mode : ${mode}`);
  }
  modeCards.forEach(c => c.addEventListener('click', () => setMode(c.dataset.mode, true)));

  /* =======================================================
     MENU MOBILE
     ======================================================= */
  const burger = $('#burger'), mobileMenu = $('#mobileMenu');
  function toggleMenu(force) {
    const open = typeof force === 'boolean' ? force : !mobileMenu.classList.contains('is-open');
    mobileMenu.classList.toggle('is-open', open);
    mobileMenu.setAttribute('aria-hidden', !open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    document.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', () => toggleMenu());
  $$('a', mobileMenu).forEach(a => a.addEventListener('click', () => toggleMenu(false)));

  /* =======================================================
     OUVERT / FERMÉ (heure de Paris)
     ======================================================= */
  function updateOpen() {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Paris', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(new Date()).map(p => [p.type, p.value]));
    const day = parts.weekday; // Mon..Sun
    const mins = (+parts.hour % 24) * 60 + +parts.minute;
    const isSunday = day === 'Sun';
    const open = !isSunday && mins >= 11 * 60 && mins < 23 * 60;
    let text;
    if (open) text = 'Ouvert maintenant · jusqu\'à 23h';
    else if (isSunday || (day === 'Sat' && mins >= 23 * 60)) text = 'Fermé · réouverture lundi 11h';
    else if (mins < 11 * 60) text = 'Fermé · ouvre à 11h';
    else text = 'Fermé · réouverture demain 11h';
    $('#openText').textContent = text;
    $('#openBadge').classList.toggle('is-closed', !open);
  }

  /* =======================================================
     APPARITIONS (IntersectionObserver)
     ======================================================= */
  let io;
  function startReveals() {
    const targets = $$('[data-reveal], [data-split]:not(.hero__line), .zigzag, .zones__list, .number');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      targets.forEach(t => t.classList.add('is-in'));
      $$('.hero__line').forEach(t => t.classList.add('is-in'));
      $$('[data-count]').forEach(el => { el.textContent = el.dataset.count + (el.dataset.suffix || ''); });
      return;
    }
    io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        $$('[data-count]', en.target).forEach(countUp);
        if (en.target.matches('.zones__list')) setTimeout(() => en.target.classList.add('settled'), 1600);
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    targets.forEach(t => io.observe(t));
    $$('.hero__line').forEach(t => t.classList.add('is-in'));
  }

  function countUp(el) {
    const target = +el.dataset.count, suffix = el.dataset.suffix || '';
    const t0 = performance.now(), dur = 1400;
    const tick = now => {
      const p = clamp((now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(target * e) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* =======================================================
     MARQUEES
     ======================================================= */
  const marquees = $$('[data-marquee]').map(m => {
    const track = $('.marquee__track', m);
    m.setAttribute('aria-hidden', 'true');
    const original = track.innerHTML;
    let guard = 0;
    while (track.scrollWidth < window.innerWidth * 1.5 && guard++ < 10) track.innerHTML += original;
    track.innerHTML += track.innerHTML;
    return { track, dir: +m.dataset.marquee, x: 0, half: track.scrollWidth / 2 };
  });

  /* =======================================================
     SCROLL HORIZONTAL
     ======================================================= */
  const hSection = $('#plus'), hTrack = $('#hTrack');
  const hPanels = $$('.hpanel', hTrack);
  let hDist = 0;
  function sizeHScroll() {
    hDist = Math.max(0, hTrack.scrollWidth - window.innerWidth);
    hSection.style.height = (hDist + window.innerHeight) + 'px';
    marquees.forEach(m => { m.half = m.track.scrollWidth / 2; });
  }

  /* =======================================================
     MANIFESTE — mots qui s'allument au scroll
     ======================================================= */
  const mani = $('#manifesto');
  const HL = /^(fromage|file,|débordent,|trois|gratuite|Mega)/i;
  (function splitWords() {
    const words = mani.textContent.trim().split(/\s+/);
    mani.setAttribute('aria-label', mani.textContent.trim());
    mani.innerHTML = '<span aria-hidden="true">' + words.map(w => `<span class="w${HL.test(w) ? ' hl' : ''}">${w}</span>`).join(' ') + '</span>';
  })();
  const maniWords = $$('.w', mani);

  /* =======================================================
     CURSEUR, MAGNÉTISME, TILT
     ======================================================= */
  const cursor = $('#cursor'), cursorLabel = $('#cursorLabel');
  const mouse = { x: innerWidth / 2, y: innerHeight / 2, nx: 0, ny: 0 };
  const cpos = { x: mouse.x, y: mouse.y };
  const useCursor = finePointer && !reduceMotion;
  if (useCursor) document.documentElement.classList.add('has-cursor');

  window.addEventListener('pointermove', e => {
    mouse.x = e.clientX; mouse.y = e.clientY;
    mouse.nx = (e.clientX / innerWidth) * 2 - 1;
    mouse.ny = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });

  if (useCursor) {
    document.addEventListener('pointerover', e => {
      const t = e.target.closest('[data-cursor], a, button');
      if (t) {
        cursor.classList.add('is-big');
        cursorLabel.textContent = t.dataset.cursor || 'Clic';
      } else cursor.classList.remove('is-big');
    });
    document.addEventListener('pointerdown', () => cursor.classList.add('is-down'));
    document.addEventListener('pointerup', () => cursor.classList.remove('is-down'));
    document.addEventListener('mouseleave', () => { cursor.style.opacity = 0; });
    document.addEventListener('mouseenter', () => { cursor.style.opacity = 1; });
  }

  if (finePointer && !reduceMotion) {
    $$('.magnetic').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        el.style.translate = `${dx * 0.3}px ${dy * 0.4}px`;
      });
      el.addEventListener('pointerleave', () => { el.style.translate = '0 0'; });
    });

    document.addEventListener('pointermove', e => {
      const star = e.target.closest('.star');
      $$('.star__inner.is-tilt').forEach(s => {
        if (!star || !star.contains(s)) { s.style.transform = ''; s.classList.remove('is-tilt'); }
      });
      if (!star) return;
      const inner = $('.star__inner', star);
      const r = star.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      inner.classList.add('is-tilt');
      inner.style.transform = `rotateY(${px * 18}deg) rotateX(${-py * 14}deg)`;
    }, { passive: true });
  }

  /* =======================================================
     BOUCLE D'ANIMATION (scroll + souris)
     ======================================================= */
  const nav = $('#nav'), bar = $('#progressBar'), toTop = $('#toTop');
  const hero = $('#top'), heroPizza = $('#heroPizza');
  const floaties = $$('.floaty');
  const speedEls = $$('[data-speed]');
  let lastY = scrollY, vel = 0, scrollDir = 1;

  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

  function frame() {
    const y = scrollY, vh = innerHeight;
    const dy = y - lastY;
    vel = lerp(vel, dy, 0.2);
    if (Math.abs(dy) > 0.5) scrollDir = dy > 0 ? 1 : -1;

    // progression globale
    const max = document.documentElement.scrollHeight - vh;
    const p = max > 0 ? y / max : 0;
    bar.style.transform = `scaleX(${p})`;
    toTop.style.setProperty('--p', p);
    toTop.classList.toggle('is-on', y > vh * 0.9);

    // nav
    nav.classList.toggle('is-scrolled', y > 30);
    if (!mobileMenu.classList.contains('is-open')) {
      if (dy > 6 && y > 400) nav.classList.add('is-hidden');
      else if (dy < -6 || y < 400) nav.classList.remove('is-hidden');
    }

    if (!reduceMotion) {
      // héros : la pizza tourne et s'ouvre au scroll
      const hp = clamp(y / hero.offsetHeight);
      heroPizza.style.transform = `rotate(${y * 0.25}deg) scale(${1 + hp * 0.25})`;
      heroPizza.style.setProperty('--spull', (hp * 34).toFixed(2));

      floaties.forEach(el => {
        const d = +el.dataset.depth;
        el.style.translate = `${mouse.nx * d * 30}px ${mouse.ny * d * 30 - y * d * 0.35}px`;
      });

      speedEls.forEach(el => {
        const r = el.parentElement.getBoundingClientRect();
        const offset = (r.top + r.height / 2 - vh / 2) * +el.dataset.speed;
        el.style.translate = `0 ${offset.toFixed(1)}px`;
      });

      // marquees : vitesse liée au scroll, sens inversé quand on remonte
      marquees.forEach(m => {
        m.x -= m.dir * scrollDir * (1.2 + Math.min(Math.abs(vel) * 0.35, 30));
        if (m.x <= -m.half) m.x += m.half;
        if (m.x > 0) m.x -= m.half;
        m.track.style.transform = `translate3d(${m.x}px,0,0)`;
      });

      // curseur
      if (useCursor) {
        cpos.x = lerp(cpos.x, mouse.x, 0.22);
        cpos.y = lerp(cpos.y, mouse.y, 0.22);
        cursor.style.translate = `${cpos.x}px ${cpos.y}px`;
      }
    }

    // scroll horizontal (fonctionne aussi en mouvement réduit : c'est de la navigation)
    const hr = hSection.getBoundingClientRect();
    if (hr.top < vh && hr.bottom > 0) {
      const hp = clamp(-hr.top / Math.max(1, hr.height - vh));
      hTrack.style.transform = `translate3d(${-hp * hDist}px,0,0)`;
      hPanels.forEach(panel => {
        const pr = panel.getBoundingClientRect();
        const vis = 1 - clamp(Math.abs(pr.left + pr.width / 2 - innerWidth / 2) / innerWidth);
        panel.style.setProperty('--p', reduceMotion ? 1 : vis.toFixed(3));
      });
    }

    // manifeste
    const mr = mani.getBoundingClientRect();
    if (mr.top < vh && mr.bottom > 0) {
      const mp = reduceMotion ? 1 : clamp((vh * 0.85 - mr.top) / (mr.height + vh * 0.2));
      const n = Math.round(mp * maniWords.length);
      maniWords.forEach((w, i) => w.classList.toggle('on', i < n));
    }

    lastY = y;
    requestAnimationFrame(frame);
  }

  /* =======================================================
     LOADER + INITIALISATION
     ======================================================= */
  function init() {
    hydrateShapes();
    $$('.pizza[data-recipe]').forEach(renderPizza);
    $$('[data-split]').forEach(splitText);
    renderStars();
    renderTabs();
    renderMenu();
    renderZones();
    setMode(cart.mode, false);
    renderCart();
    updateOpen();
    setInterval(updateOpen, 60000);
    $('#year').textContent = new Date().getFullYear();
    sizeHScroll();
    window.addEventListener('resize', sizeHScroll);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(sizeHScroll);
    requestAnimationFrame(frame);
  }

  function runLoader() {
    const loader = $('#loader'), count = $('#loaderCount');
    const finish = () => {
      loader.classList.add('is-done');
      document.body.classList.remove('is-loading');
      startReveals();
      setTimeout(() => loader.remove(), 1100);
    };
    if (reduceMotion) { loader.remove(); document.body.classList.remove('is-loading'); startReveals(); return; }
    const t0 = performance.now(), minDur = 1300;
    let loaded = document.readyState === 'complete';
    window.addEventListener('load', () => { loaded = true; });
    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
    let fontsOk = false;
    fontsReady.then(() => { fontsOk = true; });
    const tick = now => {
      const elapsed = now - t0;
      const ready = (loaded && fontsOk) || elapsed > 3500;
      const p = ready ? clamp(elapsed / minDur) : Math.min(0.9, elapsed / (minDur * 1.4));
      count.textContent = Math.round(p * 100);
      if (ready && elapsed >= minDur) finish();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  init();
  runLoader();
})();
