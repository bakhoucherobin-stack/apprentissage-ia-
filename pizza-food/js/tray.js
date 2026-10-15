/* =========================================================
   PIZZA FOOD — plateau de la commande
   Chaque article est dessiné comme un objet en volume
   (vue de trois quarts, ombres et reflets) : canettes et
   bouteilles aux couleurs de la boisson, tacos, burgers,
   sandwichs, paninis, assiettes, tex-mex, salades, pâtes,
   desserts, glaces. Les pizzas utilisent leur vraie photo.
   Les menus et les boissons incluses sont décomposés.
   ========================================================= */
(() => {
  'use strict';
  let n = 0;
  const uid = () => 'tr' + (++n).toString(36);
  const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  /* ---------- Couleurs ---------- */
  const hex = h => { const v = parseInt(h.slice(1), 16); return [v >> 16 & 255, v >> 8 & 255, v & 255]; };
  const toHex = c => '#' + c.map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');
  const shade = (h, f) => { const c = hex(h); return toHex(f >= 1 ? c.map(x => x + (255 - x) * (f - 1)) : c.map(x => x * f)); };
  const lin = (id, stops, x2 = 1, y2 = 0) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</linearGradient>`;
  const rad = (id, stops, cx = .4, cy = .35, r = .7) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</radialGradient>`;
  // dégradé de cylindre : bords sombres, reflet à gauche
  const cyl = (id, c) => lin(id, [[0, shade(c, .5)], [.18, shade(c, 1.35)], [.3, shade(c, 1.12)], [.62, c], [.88, shade(c, .62)], [1, shade(c, .45)]]);
  const svg = (vb, body, defs) => `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>${defs}</defs>${body}</svg>`;
  const txt = (x, y, s, size, fill, extra = '') => `<text x="${x}" y="${y}" font-family="'Bowlby One SC', Impact, sans-serif" font-size="${size}" fill="${fill}" text-anchor="middle" ${extra}>${s}</text>`;

  /* ---------- Boissons ---------- */
  const DRINKS = [
    [/coca.*zero|zero/, { c: '#1b1b1d', a: '#e4002b', t: 'COCA ZERO', tc: '#e4002b' }],
    [/cherry/, { c: '#7c0f2e', a: '#f2d7de', t: 'CHERRY', tc: '#fff' }],
    [/coca/, { c: '#d9150b', a: '#ffffff', t: 'COCA-COLA', tc: '#fff' }],
    [/pepsi/, { c: '#0b3a8f', a: '#e4002b', t: 'PEPSI', tc: '#fff' }],
    [/orangina/, { c: '#ff8a00', a: '#0a3e8c', t: 'ORANGINA', tc: '#fff', shape: 'orangina' }],
    [/fanta.*citron/, { c: '#f7d418', a: '#1f8a3b', t: 'FANTA', tc: '#1f6b2d' }],
    [/fanta/, { c: '#ff7a00', a: '#123f9b', t: 'FANTA', tc: '#123f9b' }],
    [/mirinda/, { c: '#ff6d00', a: '#00843d', t: 'MIRINDA', tc: '#fff' }],
    [/schweppes/, { c: '#f5c518', a: '#7a5b00', t: 'SCHWEPPES', tc: '#4a3800' }],
    [/7 ?up/, { c: '#11a54a', a: '#e4002b', t: '7UP', tc: '#fff' }],
    [/oasis.*(pomme|cassis)/, { c: '#7b1d6f', a: '#e83f6f', t: 'OASIS', tc: '#fff' }],
    [/oasis.*tropical/, { c: '#ffb300', a: '#e53935', t: 'OASIS', tc: '#fff' }],
    [/oasis/, { c: '#ff8f00', a: '#2e7d32', t: 'OASIS', tc: '#fff' }],
    [/ice tea.*framboise/, { c: '#c2185b', a: '#ffd1e1', t: 'ICE TEA', tc: '#fff' }],
    [/ice tea.*(pasteque|menthe)/, { c: '#e53950', a: '#2e9d4a', t: 'ICE TEA', tc: '#fff' }],
    [/ice tea/, { c: '#f39434', a: '#fff1d6', t: 'ICE TEA', tc: '#fff' }],
    [/perrier/, { c: '#1d7a3a', a: '#f5d300', t: 'PERRIER', tc: '#f5d300', shape: 'perrier' }],
    [/cristaline|eau/, { c: '#cfe9f7', a: '#1565c0', t: 'CRISTALINE', tc: '#fff', shape: 'water' }],
    [/tropico/, { c: '#ffb300', a: '#e65100', t: 'TROPICO', tc: '#fff' }],
    [/capri/, { c: '#c0c6cc', a: '#ff8f00', t: 'CAPRI-SUN', tc: '#0d47a1', shape: 'pouch' }],
    [/freez/, { c: '#e91e63', a: '#ffeb3b', t: 'FREEZ', tc: '#fff', shape: 'small' }],
    [/compote/, { c: '#7cb342', a: '#fff', t: 'COMPOTE', tc: '#fff', shape: 'pouch' }]
  ];
  function drink(name) {
    const nn = norm(name);
    const d = Object.assign({ c: '#d9150b', a: '#fff', t: name.split(' ')[0].toUpperCase(), tc: '#fff' }, (DRINKS.find(([re]) => re.test(nn)) || [, {}])[1]);
    const big = /(1[.,]25|1[.,]5|2) ?l|50 ?cl|maxi/.test(nn);
    if (d.shape === 'orangina') return orangina(d);
    if (d.shape === 'perrier') return glassBottle(d);
    if (d.shape === 'water') return pet(d, true);
    if (d.shape === 'pouch') return pouch(d);
    if (d.shape === 'small') return glassBottle(Object.assign({}, d, { clear: true }));
    return big ? pet(d) : can(d);
  }
  function can(d) {
    const i = uid();
    const defs = cyl(i + 'b', d.c) + lin(i + 'm', [[0, '#8d949b'], [.25, '#f4f6f8'], [.5, '#c3c8cd'], [1, '#6c737a']]);
    return { w: 9, svg: svg('0 0 60 112', `
      <path d="M8 16 Q8 10 14 9 L46 9 Q52 10 52 16 L52 98 Q52 104 46 105 L14 105 Q8 104 8 98 Z" fill="url(#${i}b)"/>
      <ellipse cx="30" cy="11" rx="22" ry="6" fill="url(#${i}m)"/><ellipse cx="30" cy="11" rx="17" ry="4" fill="#9aa1a8"/>
      <ellipse cx="33" cy="10.5" rx="5" ry="1.8" fill="#5f666d"/><path d="M8 100 Q30 112 52 100 L52 98 Q52 104 46 105 L14 105 Q8 104 8 98Z" fill="url(#${i}m)"/>
      <path d="M8 40 Q30 47 52 40 L52 46 Q30 53 8 46 Z" fill="${d.a}" opacity=".9"/>
      ${txt(30, 74, d.t, d.t.length > 8 ? 7.5 : 9.5, d.tc, `transform="rotate(-90 30 70)"`)}
      <rect x="14" y="18" width="5" height="80" rx="2.5" fill="#fff" opacity=".28"/>`, defs) };
  }
  function pet(d, water) {
    const i = uid();
    const liquid = water ? '#d6eefb' : d.c;
    const defs = cyl(i + 'b', liquid) + lin(i + 'c', [[0, shade(d.a, .6)], [.4, shade(d.a, 1.3)], [1, shade(d.a, .55)]]);
    return { w: 10, svg: svg('0 0 60 150', `
      <rect x="22" y="2" width="16" height="12" rx="3" fill="url(#${i}c)"/><rect x="21" y="13" width="18" height="3" rx="1.5" fill="${shade(d.a, .7)}"/>
      <path d="M24 16 L36 16 Q37 30 46 40 Q52 47 52 58 L52 136 Q52 146 42 147 L18 147 Q8 146 8 136 L8 58 Q8 47 14 40 Q23 30 24 16Z" fill="url(#${i}b)" opacity="${water ? .85 : 1}"/>
      <rect x="8" y="70" width="44" height="34" fill="${water ? d.a : '#fff'}" opacity=".95"/>
      <rect x="8" y="70" width="44" height="34" fill="url(#${i}b)" opacity=".25"/>
      ${txt(30, 92, d.t, d.t.length > 8 ? 6.5 : 8.5, water ? '#fff' : d.c)}
      <path d="M13 50 Q13 44 18 40" stroke="#fff" stroke-width="3" fill="none" opacity=".45" stroke-linecap="round"/>
      <rect x="13" y="108" width="4" height="30" rx="2" fill="#fff" opacity=".3"/>`, defs) };
  }
  function orangina(d) {
    const i = uid();
    const defs = rad(i + 'b', [[0, '#ffd27a'], [.45, '#ff9a1f'], [1, '#c45a00']], .35, .4, .75) + rad(i + 'h', [[0, '#fff', .8], [1, '#fff', 0]], .5, .5, .5);
    let pulp = '';
    for (let k = 0; k < 22; k++) pulp += `<circle cx="${14 + (k * 37) % 34}" cy="${58 + (k * 23) % 40}" r="${.8 + (k % 3) * .4}" fill="#ffe0a0" opacity=".7"/>`;
    return { w: 9, svg: svg('0 0 60 110', `
      <rect x="24" y="4" width="12" height="9" rx="2" fill="#e5e7ea"/><rect x="24" y="4" width="12" height="3" fill="#0a3e8c"/>
      <path d="M25 13 L35 13 L36 34 Q54 44 54 74 Q54 104 30 106 Q6 104 6 74 Q6 44 24 34Z" fill="url(#${i}b)"/>
      ${pulp}
      <path d="M8 70 Q30 78 52 70 L52 84 Q30 92 8 84Z" fill="${d.a}"/>
      ${txt(30, 82, 'ORANGINA', 6.5, '#fff')}
      <ellipse cx="20" cy="56" rx="5" ry="12" fill="url(#${i}h)"/>`, defs) };
  }
  function glassBottle(d) {
    const i = uid();
    const body = d.clear ? d.c : d.c;
    const defs = cyl(i + 'b', body);
    return { w: 8, svg: svg('0 0 50 130', `
      <rect x="19" y="2" width="12" height="8" rx="2" fill="${shade(d.a, .9)}"/>
      <path d="M20 10 L30 10 L31 34 Q44 46 44 66 L44 118 Q44 126 36 127 L14 127 Q6 126 6 118 L6 66 Q6 46 19 34Z" fill="url(#${i}b)"/>
      <path d="M6 76 Q25 82 44 76 L44 98 Q25 104 6 98Z" fill="${d.a}"/>
      ${txt(25, 92, d.t, d.t.length > 7 ? 5.8 : 7.5, d.tc === d.a ? body : d.tc)}
      <rect x="11" y="50" width="4" height="66" rx="2" fill="#fff" opacity=".35"/>`, defs) };
  }
  function pouch(d) {
    const i = uid();
    const defs = lin(i + 'b', [[0, shade(d.c, .65)], [.3, shade(d.c, 1.35)], [.7, d.c], [1, shade(d.c, .6)]]);
    return { w: 8, svg: svg('0 0 60 100', `
      <path d="M10 12 Q30 6 50 12 L54 92 Q30 98 6 92Z" fill="url(#${i}b)"/>
      <rect x="35" y="2" width="4" height="22" rx="2" fill="#fff" transform="rotate(12 37 12)"/>
      <circle cx="30" cy="54" r="15" fill="${d.a}"/>${txt(30, 82, d.t, 6.5, d.tc)}
      <path d="M14 20 L12 86" stroke="#fff" stroke-width="3" opacity=".35" stroke-linecap="round"/>`, defs) };
  }

  /* ---------- Plats ---------- */
  const grill = (x0, y0, x1, y1, n, col = '#7a3d12') => { let s = ''; for (let k = 0; k < n; k++) { const t = (k + .5) / n; s += `<path d="M${x0 + (x1 - x0) * t - 8} ${y0} L${x0 + (x1 - x0) * t + 8} ${y1}" stroke="${col}" stroke-width="2.6" opacity=".55" stroke-linecap="round"/>`; } return s; };
  function tacos() {
    const i = uid();
    const defs = lin(i + 't', [[0, '#f9dc9a'], [.45, '#eab05a'], [1, '#b36a1c']], 0, 1) + lin(i + 'e', [[0, '#e9a94b'], [1, '#a35c17']], 0, 1);
    let fries = '', meat = '';
    for (let k = 0; k < 9; k++) fries += `<rect x="${30 + k * 8.5}" y="${62 + (k % 3) * 4}" width="4" height="15" rx="1.2" fill="${k % 2 ? '#ffd54f' : '#ffca28'}" transform="rotate(${(k % 2 ? 14 : -10)} ${32 + k * 8.5} 70)"/>`;
    for (let k = 0; k < 8; k++) meat += `<path d="M${28 + k * 10} ${58 + (k % 2) * 3} q5 -6 10 0 q-2 6 -10 0Z" fill="${k % 2 ? '#7a3210' : '#9c4a1c'}"/>`;
    // demi-tacos grillé posé derrière, et une moitié coupée qui montre sa garniture
    return { w: 22, svg: svg('0 0 140 104', `
      <ellipse cx="70" cy="96" rx="60" ry="7" fill="#000" opacity=".2"/>
      <path d="M20 40 Q20 16 46 14 L108 12 Q130 12 130 34 L130 52 Q130 64 112 64 L44 66 Q20 66 20 54Z" fill="url(#${i}t)"/>
      <clipPath id="${i}c"><path d="M20 40 Q20 16 46 14 L108 12 Q130 12 130 34 L130 52 Q130 64 112 64 L44 66 Q20 66 20 54Z"/></clipPath>
      <g clip-path="url(#${i}c)">${grill(10, 10, 140, 66, 9)}</g>
      <path d="M34 20 Q70 14 112 16" stroke="#fff" stroke-width="3" opacity=".35" fill="none" stroke-linecap="round"/>
      <rect x="12" y="46" width="112" height="46" rx="20" fill="url(#${i}e)"/>
      <rect x="18" y="51" width="100" height="36" rx="15" fill="#f4c56b"/>
      <rect x="22" y="54" width="92" height="30" rx="12" fill="#8a3b12"/>
      ${meat}${fries}
      <path d="M22 70 Q34 64 46 72 Q58 64 70 72 Q82 64 94 72 Q106 64 114 70 L114 74 Q68 82 22 74Z" fill="#ffb300"/>
      <path d="M24 80 Q36 76 50 82 Q62 76 76 82 Q90 76 112 80" stroke="#ffe082" stroke-width="2.4" fill="none"/>
      <path d="M40 84 q2 8 6 8 q4 0 4 -8" fill="#ffb300"/>`, defs) };
  }
  function burger(wide) {
    const i = uid(), W = wide ? 140 : 110, c = W / 2;
    const defs = rad(i + 'b', [[0, '#f8c76a'], [.6, '#d98a2b'], [1, '#9c5514']], .4, .3, .8) + lin(i + 'm', [[0, '#7a3b16'], [1, '#3e1a07']], 0, 1);
    let sesame = '';
    for (let k = 0; k < 14; k++) sesame += `<ellipse cx="${c - 32 + (k * 17) % 64}" cy="${18 + (k * 11) % 16}" rx="2" ry="1.1" fill="#fff6dc" transform="rotate(${k * 25} ${c - 32 + (k * 17) % 64} ${18 + (k * 11) % 16})"/>`;
    return { w: wide ? 22 : 18, svg: svg(`0 0 ${W} 100`, `
      <ellipse cx="${c}" cy="93" rx="${c - 8}" ry="6" fill="#000" opacity=".2"/>
      <path d="M10 76 Q10 90 ${c} 90 Q${W - 10} 90 ${W - 10} 76Z" fill="#d9913a"/><rect x="10" y="72" width="${W - 20}" height="6" rx="3" fill="#e9a94b"/>
      <path d="M8 64 Q${c} 78 ${W - 8} 64 L${W - 8} 72 Q${c} 82 8 72Z" fill="url(#${i}m)"/>
      <path d="M6 60 L${W - 6} 60 L${W - 14} 68 L${c + 10} 64 L${c} 70 L${c - 12} 64 L14 70Z" fill="#ffc107"/>
      <path d="M6 56 Q${c / 2} 64 ${c} 56 Q${c * 1.5} 64 ${W - 6} 56 L${W - 6} 60 Q${c} 66 6 60Z" fill="#43a047"/>
      <path d="M12 56 Q10 12 ${c} 10 Q${W - 10} 12 ${W - 12} 56Z" fill="url(#${i}b)"/>${sesame}
      <path d="M24 30 Q30 18 44 16" stroke="#fff" stroke-width="4" opacity=".35" fill="none" stroke-linecap="round"/>`, defs) };
  }
  function baguette(kind) {
    const i = uid();
    const defs = lin(i + 'p', [[0, '#f6c977'], [.5, '#dc9a45'], [1, '#a9661f']], 0, 1);
    const filling = kind === 'chicken' ? '#e8b04a' : '#8a3b12';
    return { w: 22, svg: svg('0 0 140 90', `
      <ellipse cx="70" cy="82" rx="62" ry="6" fill="#000" opacity=".18"/>
      <path d="M8 56 Q10 76 40 78 L110 78 Q132 76 132 56Z" fill="url(#${i}p)"/>
      <path d="M12 52 Q40 40 70 48 Q100 40 128 52 L128 58 Q70 66 12 58Z" fill="#43a047"/>
      <path d="M14 50 Q40 36 70 44 Q100 34 126 48 L126 54 Q70 60 14 54Z" fill="${filling}"/>
      ${[30, 58, 86, 110].map(x => `<circle cx="${x}" cy="46" r="5" fill="#e53935"/>`).join('')}
      <path d="M16 46 Q40 38 70 44 Q100 36 124 46" stroke="#fff" stroke-width="3" fill="none" opacity=".85"/>
      <path d="M10 46 Q12 18 44 16 L104 16 Q130 18 130 46 Q100 34 70 40 Q40 32 10 46Z" fill="url(#${i}p)"/>
      ${grill(30, 18, 120, 34, 5, '#b8711f')}`, defs) };
  }
  function panini() {
    const i = uid();
    const defs = lin(i + 'p', [[0, '#f3d08a'], [1, '#c98a3a']], 0, 1);
    let stripes = '';
    for (let k = 0; k < 6; k++) stripes += `<path d="M${18 + k * 18} 22 L${8 + k * 18} 60" stroke="#6d3610" stroke-width="3.2" opacity=".55" stroke-linecap="round"/>`;
    return { w: 18, svg: svg('0 0 130 90', `
      <ellipse cx="65" cy="80" rx="58" ry="6" fill="#000" opacity=".18"/>
      <path d="M10 30 L112 18 Q122 18 122 28 L120 60 L18 72 Q8 72 8 62Z" fill="url(#${i}p)"/>${stripes}
      <path d="M18 72 L120 60 L120 68 L18 80 Q8 80 8 70 L8 62 Q8 72 18 72Z" fill="#b8711f"/>
      <path d="M10 66 L120 54" stroke="#ffca28" stroke-width="4" opacity=".9"/>`, defs) };
  }
  function plate(inner) {
    const i = uid();
    const defs = rad(i + 'p', [[0, '#ffffff'], [.75, '#f1f1f1'], [1, '#cfcfcf']], .45, .4, .6);
    return { w: 22, svg: svg('0 0 140 80', `
      <ellipse cx="70" cy="46" rx="66" ry="30" fill="#000" opacity=".15"/>
      <ellipse cx="70" cy="40" rx="66" ry="30" fill="url(#${i}p)"/><ellipse cx="70" cy="40" rx="50" ry="21" fill="#f7f7f7" stroke="#e0e0e0"/>
      ${inner}`, defs) };
  }
  const friesPile = (x, y) => { let s = ''; for (let k = 0; k < 12; k++) s += `<rect x="${x + (k * 7) % 30}" y="${y + (k * 5) % 10}" width="4" height="16" rx="1.2" fill="${k % 3 ? '#ffd54f' : '#ffca28'}" transform="rotate(${(k % 2 ? 1 : -1) * (20 + k * 7)} ${x + (k * 7) % 30 + 2} ${y + 8})"/>`; return s; };
  function assiette(name) {
    const nn = norm(name);
    const meat = /omelette/.test(nn) ? `<ellipse cx="88" cy="38" rx="20" ry="11" fill="#ffd54f"/><ellipse cx="84" cy="36" rx="8" ry="4" fill="#fff59d"/>`
      : /wings/.test(nn) ? [0, 1, 2].map(k => `<ellipse cx="${80 + k * 9}" cy="${34 + (k % 2) * 6}" rx="9" ry="6" fill="#c0601b"/>`).join('')
      : /steak/.test(nn) ? `<ellipse cx="88" cy="38" rx="18" ry="10" fill="#5d2a0c"/><path d="M76 36 L100 34" stroke="#3b1806" stroke-width="2"/>`
      : `<path d="M72 34 Q88 24 104 34 Q100 46 86 46 Q74 44 72 34Z" fill="${/chicken/.test(nn) ? '#e0a34a' : '#8a3b12'}"/>`;
    return plate(`${friesPile(34, 26)}${meat}<circle cx="60" cy="50" r="5" fill="#e53935"/><path d="M48 52 Q56 44 66 52 Q58 58 48 52Z" fill="#66bb6a"/>`);
  }
  function box(pieces, label) {
    const i = uid();
    const defs = lin(i + 'b', [[0, '#e53935'], [1, '#b71c1c']], 0, 1);
    let stripes = '';
    for (let k = 0; k < 5; k++) stripes += `<path d="M${16 + k * 20} 48 L${20 + k * 20} 86" stroke="#fff" stroke-width="7"/>`;
    return { w: 16, svg: svg('0 0 120 100', `
      <ellipse cx="60" cy="92" rx="50" ry="6" fill="#000" opacity=".18"/>
      ${pieces}
      <path d="M8 46 L112 46 L104 88 Q60 96 16 88Z" fill="url(#${i}b)"/>
      <clipPath id="${i}c"><path d="M8 46 L112 46 L104 88 Q60 96 16 88Z"/></clipPath><g clip-path="url(#${i}c)" opacity=".9">${stripes}</g>
      <path d="M8 46 L112 46" stroke="#7f0000" stroke-width="3"/>${label ? txt(60, 76, label, 9, '#ffd54f', 'stroke="#7f0000" stroke-width=".6"') : ''}`, defs) };
  }
  function texmex(name) {
    const nn = norm(name);
    let p = '';
    const gold = '#d98a2b', gold2 = '#f1b44c';
    for (let k = 0; k < 7; k++) {
      const x = 22 + (k * 13) % 72, y = 18 + (k % 3) * 9;
      if (/wings/.test(nn)) p += `<path d="M${x} ${y + 14} Q${x - 6} ${y} ${x + 6} ${y - 2} Q${x + 18} ${y + 2} ${x + 12} ${y + 16}Z" fill="#b5541a"/><rect x="${x + 2}" y="${y + 12}" width="4" height="10" fill="#f3e5c0"/>`;
      else if (/onion|calamar/.test(nn)) p += `<ellipse cx="${x + 6}" cy="${y + 8}" rx="9" ry="7" fill="none" stroke="${gold2}" stroke-width="5"/>`;
      else if (/mozzarella|tenders/.test(nn)) p += `<rect x="${x}" y="${y - 6}" width="9" height="30" rx="4" fill="${/tenders/.test(nn) ? gold : gold2}" transform="rotate(${(k % 2 ? 1 : -1) * 14} ${x + 4} ${y + 8})"/>`;
      else if (/jalapeno/.test(nn)) p += `<ellipse cx="${x + 6}" cy="${y + 8}" rx="8" ry="11" fill="${gold}"/><path d="M${x + 6} ${y - 4} l2 -5" stroke="#2e7d32" stroke-width="2.5"/>`;
      else if (/camembert/.test(nn)) p += `<path d="M${x} ${y + 14} L${x + 7} ${y} L${x + 15} ${y + 14}Z" fill="${gold2}"/>`;
      else p += `<path d="M${x} ${y + 10} Q${x} ${y} ${x + 9} ${y + 1} Q${x + 17} ${y + 3} ${x + 15} ${y + 12} Q${x + 8} ${y + 18} ${x} ${y + 10}Z" fill="${k % 2 ? gold : gold2}"/>`;
    }
    const num = (nn.match(/^\d+/) || [''])[0];
    return box(p, num ? '×' + num : '');
  }
  function fries() {
    const i = uid();
    let f = '';
    for (let k = 0; k < 13; k++) f += `<rect x="${24 + k * 5.5}" y="${8 + (k % 4) * 5}" width="5" height="44" rx="1.4" fill="${k % 3 ? '#ffd54f' : '#ffca28'}" transform="rotate(${(k - 6) * 2.4} ${26 + k * 5.5} 40)"/>`;
    return { w: 11, svg: svg('0 0 120 110', `
      <ellipse cx="60" cy="104" rx="38" ry="5" fill="#000" opacity=".2"/>${f}
      <path d="M20 42 L100 42 L90 102 Q60 108 30 102Z" fill="#e53935"/><path d="M20 42 Q60 56 100 42" fill="#c62828"/>
      <path d="M30 60 L40 98" stroke="#fff" stroke-width="3" opacity=".35"/>${txt(60, 84, 'FRITES', 10, '#ffd54f')}`, '') };
  }
  function bowl(inner, kraft) {
    const i = uid();
    const defs = lin(i + 'b', kraft ? [[0, '#c69c6d'], [.4, '#e3c194'], [1, '#8d6a43']] : [[0, '#dfe8ea', .7], [.4, '#ffffff', .85], [1, '#b8c4c8', .7]]);
    return { w: 18, svg: svg('0 0 130 100', `
      <ellipse cx="65" cy="92" rx="52" ry="6" fill="#000" opacity=".18"/>
      <ellipse cx="65" cy="40" rx="58" ry="18" fill="${kraft ? '#a57b4c' : '#cfdadd'}"/>${inner}
      <path d="M7 40 Q10 90 65 92 Q120 90 123 40 Q65 62 7 40Z" fill="url(#${i}b)"/>
      <path d="M18 52 Q24 74 40 82" stroke="#fff" stroke-width="4" opacity=".4" fill="none" stroke-linecap="round"/>`, defs) };
  }
  function salad() {
    let s = '';
    for (let k = 0; k < 14; k++) s += `<path d="M${18 + (k * 23) % 92} ${34 + (k * 7) % 12} q8 -12 16 0 q-8 8 -16 0Z" fill="${['#66bb6a', '#43a047', '#9ccc65'][k % 3]}"/>`;
    s += [[40, 34], [70, 30], [92, 38]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="#e53935"/><circle cx="${x - 2}" cy="${y - 2}" r="1.5" fill="#fff" opacity=".6"/>`).join('');
    s += `<ellipse cx="58" cy="40" rx="7" ry="5" fill="#fff"/><ellipse cx="58" cy="40" rx="3" ry="2.5" fill="#ffca28"/>`;
    return bowl(s, false);
  }
  function riz() {
    let s = '<ellipse cx="65" cy="40" rx="52" ry="14" fill="#fafafa"/>';
    for (let k = 0; k < 6; k++) s += `<path d="M${30 + k * 13} ${30 + (k % 2) * 8} q6 -8 13 -2 q2 8 -6 10 q-8 0 -7 -8Z" fill="#d98a2b"/>`;
    s += '<path d="M28 34 Q50 26 64 36 Q80 28 104 34" stroke="#e53935" stroke-width="2.6" fill="none"/><path d="M34 42 Q56 36 70 42 Q86 36 100 42" stroke="#fff3c4" stroke-width="2.2" fill="none"/>';
    return bowl(s, true);
  }
  function pasta(name) {
    if (/lasagne/.test(norm(name))) {
      const i = uid();
      return { w: 18, svg: svg('0 0 130 90', `<ellipse cx="65" cy="84" rx="56" ry="5" fill="#000" opacity=".18"/>
        <path d="M10 34 L120 34 L114 80 L16 80Z" fill="#cfd8dc"/><path d="M14 30 L116 30 L112 72 L18 72Z" fill="#e8b04a"/>
        ${[40, 50, 60].map((y, k) => `<path d="M17 ${y} L113 ${y}" stroke="${k % 2 ? '#c62828' : '#fff3c4'}" stroke-width="4"/>`).join('')}
        <path d="M14 30 L116 30 L112 38 L18 38Z" fill="#d98a2b"/><circle cx="40" cy="33" r="3" fill="#8d4a14"/><circle cx="84" cy="34" r="3" fill="#8d4a14"/>`, '') };
    }
    let s = '';
    for (let k = 0; k < 9; k++) s += `<path d="M${22 + k * 10} 44 q8 -16 16 -4 q6 10 -4 16" stroke="${k % 2 ? '#f6d27a' : '#ecc35c'}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    s += '<circle cx="60" cy="34" r="4" fill="#fff8e1"/><circle cx="82" cy="40" r="3" fill="#8d4a14"/>';
    return bowl(s, true);
  }
  function dessert(name) {
    const nn = norm(name), i = uid();
    if (/tiramisu/.test(nn)) {
      const top = /oreo/.test(nn) ? '#2b2b2b' : /speculoos|caramel/.test(nn) ? '#b5651d' : /m&m|m.m/.test(nn) ? '#e53935' : /kinder/.test(nn) ? '#f5f5f5' : /daim/.test(nn) ? '#c88a3a' : '#5d3a1a';
      let bits = '';
      for (let k = 0; k < 6; k++) bits += `<circle cx="${16 + k * 6}" cy="${16 + (k % 2) * 3}" r="2.3" fill="${/m&m|m.m/.test(nn) ? ['#e53935', '#fdd835', '#1e88e5', '#43a047'][k % 4] : top}"/>`;
      return { w: 8, svg: svg('0 0 60 90', `<ellipse cx="30" cy="85" rx="20" ry="4" fill="#000" opacity=".2"/>
        <path d="M8 14 L52 14 L47 82 Q30 86 13 82Z" fill="#fff" opacity=".35"/>
        <path d="M10 22 L50 22 L48 40 L12 40Z" fill="#fff6e0"/><path d="M12 40 L48 40 L47 52 L13 52Z" fill="#8d5524"/><path d="M13 52 L47 52 L46 66 L14 66Z" fill="#fff6e0"/><path d="M14 66 L46 66 L45 80 Q30 84 15 80Z" fill="#8d5524"/>
        <ellipse cx="30" cy="20" rx="21" ry="5" fill="#fff6e0"/><ellipse cx="30" cy="19" rx="19" ry="4" fill="${top}" opacity="${/kinder/.test(nn) ? 1 : .85}"/>${bits}
        <path d="M8 14 L52 14 L47 82 Q30 86 13 82Z" fill="none" stroke="#fff" stroke-opacity=".7"/><rect x="12" y="24" width="3" height="52" fill="#fff" opacity=".45"/>`, '') };
    }
    if (/tarte/.test(nn)) {
      const fill = /citron/.test(nn) ? '#ffe14d' : /pomme/.test(nn) ? '#e9b04a' : /poire/.test(nn) ? '#f0dfa0' : '#b5651d';
      return { w: 11, svg: svg('0 0 90 70', `<ellipse cx="45" cy="64" rx="38" ry="5" fill="#000" opacity=".2"/>
        <path d="M8 40 L80 22 L82 46 L10 60Z" fill="#d9913a"/><path d="M8 40 L80 22 L74 16 Z" fill="${fill}"/><path d="M8 40 L74 16 L80 22Z" fill="${shade(fill, .85)}"/>
        <path d="M10 48 L81 32" stroke="${fill}" stroke-width="6"/>${/citron/.test(nn) ? '<path d="M14 34 Q30 20 44 26 Q58 16 72 20" stroke="#fff8e1" stroke-width="6" fill="none" stroke-linecap="round"/>' : ''}`, '') };
    }
    if (/salade de fruits/.test(nn)) return dessertCup(['#e53935', '#fdd835', '#43a047', '#ff9800', '#8e24aa']);
    // brownie / fondant
    const fondant = /fondant/.test(nn);
    return { w: 10, svg: svg('0 0 90 70', fondant ? `<ellipse cx="45" cy="62" rx="34" ry="6" fill="#000" opacity=".2"/>
        <path d="M14 40 Q14 14 45 12 Q76 14 76 40 L76 52 Q45 64 14 52Z" fill="#4e2a12"/><ellipse cx="45" cy="18" rx="22" ry="6" fill="#fff" opacity=".65"/><path d="M58 40 Q64 50 60 60" stroke="#2b1306" stroke-width="5" fill="none"/>`
      : `<ellipse cx="45" cy="62" rx="38" ry="6" fill="#000" opacity=".2"/><path d="M8 30 L60 18 L84 26 L84 46 L32 58 L8 50Z" fill="#3e2010"/><path d="M8 30 L60 18 L84 26 L32 38Z" fill="#5d3317"/>
        ${[[30, 28], [48, 26], [60, 30]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="3" fill="#c9a06b"/>`).join('')}`, '') };
  }
  function dessertCup(colors) {
    let s = '';
    for (let k = 0; k < 10; k++) s += `<rect x="${14 + (k * 11) % 32}" y="${22 + (k * 7) % 40}" width="7" height="7" rx="1.5" fill="${colors[k % colors.length]}"/>`;
    return { w: 8, svg: svg('0 0 60 90', `<ellipse cx="30" cy="85" rx="20" ry="4" fill="#000" opacity=".2"/><path d="M8 16 L52 16 L47 82 Q30 86 13 82Z" fill="#fff" opacity=".4"/>${s}<path d="M8 16 L52 16 L47 82 Q30 86 13 82Z" fill="none" stroke="#fff"/>`, '') };
  }
  function glace(name) {
    const nn = norm(name), i = uid();
    if (/magnum/.test(nn)) return { w: 7, svg: svg('0 0 50 110', `<rect x="22" y="70" width="6" height="34" rx="2" fill="#d7b98a"/><rect x="10" y="6" width="30" height="70" rx="14" fill="#4a2410"/><path d="M14 18 Q20 12 26 16" stroke="#7a4421" stroke-width="3" fill="none"/><rect x="14" y="20" width="4" height="46" rx="2" fill="#fff" opacity=".18"/>`, '') };
    const big = /500/.test(nn);
    const defs = cyl(i + 'b', '#7b1530');
    return { w: big ? 10 : 7, svg: svg('0 0 70 80', `<ellipse cx="35" cy="75" rx="27" ry="4" fill="#000" opacity=".2"/>
      <path d="M8 22 L62 22 L58 70 Q35 76 12 70Z" fill="url(#${i}b)"/><ellipse cx="35" cy="22" rx="27" ry="8" fill="#d4af37"/><ellipse cx="35" cy="20" rx="27" ry="8" fill="#e6c55a"/>
      ${txt(35, 52, 'HÄAGEN', 8, '#e6c55a')}${txt(35, 62, 'DAZS', 8, '#e6c55a')}`, defs) };
  }

  /* ---------- Quel dessin pour quel produit ---------- */
  function thingFor(p, nameOverride) {
    const cat = p && p.cat ? p.cat.id : '', nm = nameOverride || (p ? p.n : '');
    const nn = norm(nm);
    if (cat === 'boissons' || /33 ?cl|1[.,]5 ?l|1[.,]25 ?l|50 ?cl|2 ?l|275 ?ml|capri|compote/.test(nn)) return drink(nm);
    if (cat === 'tacos' || cat === 'boxtacos') return tacos();
    if (cat === 'burgers' || cat === 'burgergourmands') return burger(false);
    if (cat === 'hummers') return burger(true);
    if (cat === 'sandwichs') return baguette(/chicken|poulet|tenders|escalope/.test(nn) ? 'chicken' : 'meat');
    if (cat === 'paninis') return panini();
    if (cat === 'assiettes') return assiette(nm);
    if (cat === 'tex_mex' || /nuggets|wings|tenders|onion|mozzarella|jalapeno|camembert|calamar/.test(nn)) return texmex(nm);
    if (cat === 'riz_crousty') return riz();
    if (cat === 'salades') return salad();
    if (cat === 'pates') return pasta(nm);
    if (cat === 'desserts' || /tiramisu|tarte|brownie|fondant/.test(nn)) return dessert(nm);
    if (cat === 'glaces') return glace(nm);
    if (/frites/.test(nn)) return fries();
    if (/burger/.test(nn)) return burger(false);
    return null;
  }

  // Décompose un article du panier en objets posés sur le plateau
  function pieces(it, ctx) {
    const { PRODUCTS, SHOP } = ctx;
    const p = PRODUCTS[it.id];
    if (!p) return [];
    const out = [];
    const o = SHOP && it.opt ? SHOP.optionsFor(it.id, it.size) : null;
    const pizzaPiece = (prod, size, extra) => out.push(Object.assign({ kind: 'pizza', p: prod, size, qty: it.qty, key: it.key }, extra || {}));
    const thing = (prod, name, main) => {
      let t = thingFor(prod, name);
      if (!t && prod) t = { w: 14, svg: `<img src="${prod.img}" alt="">` }; // sans dessin : la photo du produit
      if (t) out.push({ kind: 'thing', t, qty: it.qty, key: it.key, main, name: name || prod.n });
    };
    if (o && o.slots.length && it.opt.slots) {
      // menus : chaque choix devient un objet
      o.slots.forEach((s, k) => {
        const c = s.items.find(x => x.id === it.opt.slots[k]);
        if (!c) return;
        const prod = PRODUCTS[c.id];
        if (prod && prod.cat.pizza) pizzaPiece(prod, /senior/i.test(s.label) ? 'Senior' : /mega/i.test(s.label) ? 'Mega' : 'Junior');
        else thing(prod && !prod.cat.pizza ? prod : null, c.name, !/boisson|dessert/i.test(s.label));
      });
    } else if (p.cat.id === 'menuenfants') {
      thing(null, /nuggets/i.test(p.n) ? '6 NUGGETS' : 'BURGER', true); thing(null, 'FRITES', true); thing(null, 'CAPRI-SUN'); thing(null, 'COMPOTE');
    } else if (p.cat.id === 'menus' || p.cat.id === 'menumidi') {
      thing(p, '', true);
    } else if (p.cat.pizza) pizzaPiece(p, it.size, { free: true });
    else thing(p, null, p.cat.id !== 'boissons' && p.cat.id !== 'desserts' && p.cat.id !== 'glaces');
    // boisson incluse ou en supplément
    if (o && it.opt.groups) o.groups.forEach((g, k) => {
      if (!/boisson/i.test(g.label)) return;
      const c = g.items.find(x => x.id === it.opt.groups[k]);
      if (c) thing(null, c.name, false);
    });
    return out;
  }

  /* ---------- Mise en place sur la planche ---------- */
  function render(el, items, ctx) {
    const { esc, freeKeys = {} } = ctx;
    const all = items.flatMap(it => pieces(it, ctx));
    if (!all.length) { el.innerHTML = '<div class="v2d v2d--empty"><p>Ton plateau est vide…</p></div>'; return; }
    const pz = all.filter(x => x.kind === 'pizza').slice(0, 6);
    const stand = all.filter(x => x.kind === 'thing' && x.main).concat(all.filter(x => x.kind === 'thing' && !x.main)).slice(0, 16);
    const SZ = { Junior: 34, Senior: 41, Mega: 48 };
    const parts = [];
    // objets debout : on cherche la plus grande taille qui tient en 1 à 3 rangées
    const maxRows = pz.length ? 2 : 3, ROW = 86;
    let rows = [], scale = 1.35;
    for (; scale > .4; scale *= .9) {
      rows = [[]]; let w = 0;
      stand.forEach(x => { const xw = x.t.w * scale; if (w + xw > ROW && rows[rows.length - 1].length) { rows.push([]); w = 0; } rows[rows.length - 1].push(x); w += xw; });
      if (rows.length <= maxRows) break;
    }
    if (!stand.length) rows = [];
    const pzY = rows.length ? (rows.length > 1 ? 26 : 34) : 50;
    const rowYs = rows.length === 1 ? [pz.length ? 80 : 60] : rows.length === 2 ? (pz.length ? [64, 88] : [50, 78]) : [40, 64, 88];
    let delay = 0;
    if (pz.length) {
      const np = pz.length, ps = (np > 4 ? .62 : np > 2 ? .72 : np > 1 ? .86 : 1) * (rows.length > 1 ? .85 : 1);
      const step = np > 1 ? Math.min(34, 84 / np) : 0;
      pz.forEach((x, k) => {
        const off = (k - (np - 1) / 2) * step;
        parts.push(`<div class="v2d__pz" style="--x:${50 + off}%;--y:${pzY + (k % 2 ? 4 : 0)}%;--w:${(SZ[x.size] || 40) * ps}%;--d:${delay}ms;--r:${(k * 47) % 360}deg" title="${esc(x.p.n)}"><i class="v2d__crust"></i><img src="${x.p.img}" alt="">${x.qty > 1 ? `<b class="v2d__qty">×${x.qty}</b>` : ''}${x.free && freeKeys[x.key] ? '<span class="v2d__free">Offerte</span>' : ''}<i class="v2d__steam"></i><i class="v2d__steam"></i></div>`);
        delay += 110;
      });
    }
    rows.forEach((list, ri) => {
      const y = rowYs[ri], total = list.reduce((sum, x) => sum + x.t.w * scale, 0);
      let x0 = 50 - total / 2;
      list.forEach(x => {
        const w = x.t.w * scale, cx = x0 + w / 2, off = cx - 50;
        parts.push(`<div class="v2d__thing" style="--x:${cx}%;--y:${y - off * off * .004}%;--w:${w}%;--d:${delay}ms" title="${esc(x.name)}">${x.t.svg}${x.qty > 1 ? `<b class="v2d__qty">×${x.qty}</b>` : ''}</div>`);
        x0 += w; delay += 80;
      });
    });
    el.innerHTML = `<div class="v2d"><div class="v2d__tilt"><div class="v2d__board">${parts.join('')}</div></div></div>`;
    const v = el.firstChild, tilt = v.firstChild;
    if (!ctx.reduceMotion) {
      v.addEventListener('pointermove', e => { const b = v.getBoundingClientRect(); tilt.style.setProperty('--tx', ((e.clientX - b.left) / b.width - .5).toFixed(3)); tilt.style.setProperty('--ty', ((e.clientY - b.top) / b.height - .5).toFixed(3)); });
      v.addEventListener('pointerleave', () => { tilt.style.setProperty('--tx', 0); tilt.style.setProperty('--ty', 0); });
    }
  }

  window.PF_TRAY = { render, thingFor, pieces };
})();
