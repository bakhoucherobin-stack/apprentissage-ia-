/* =========================================================
   PIZZA FOOD — génère les fichiers lus par les moteurs et
   les agents IA à partir de la carte (js/data.js) :
     llms.txt, sitemap.xml, robots.txt et les données
     structurées schema.org (JSON-LD) des pages.
   À relancer après une modification de la carte :
     node outils/generer-seo.js
   Vérifiez SITE ci-dessous (adresse définitive du site).
   ========================================================= */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const SITE = 'https://pizza-food.fr/';
const TODAY = new Date().toISOString().slice(0, 10);

global.window = {};
require(path.join(ROOT, 'js/data.js'));
const DATA = window.PF_DATA;

const INFO = {
  name: 'Pizza Food', legal: 'PIZZA FOOD (SASU)', street: '34 rue du Général de Gaulle', cp: '94430', city: 'Chennevières-sur-Marne',
  tel: '+33 1 45 94 29 50', tel2: '+33 7 49 45 89 55', email: 'contact@pizza-food.fr', geo: null
};
const ZONES = ['Chennevières-sur-Marne', 'Bonneuil-sur-Marne', 'Champigny-sur-Marne', 'La Queue-en-Brie', 'La Varenne Saint-Hilaire', 'Le Plessis-Trévise', 'Noiseau', 'Ormesson-sur-Marne', 'Saint-Maur-des-Fossés', 'Sucy-en-Brie', 'Villiers-sur-Marne'];
const PAGES = [
  ['index.html', 'Accueil', 1.0], ['carte.html', 'La carte', 0.9], ['livraison.html', 'Livraison et à emporter', 0.8], ['commande.html', 'Ma commande', 0.5],
  ['mentions-legales.html', 'Mentions légales', 0.2], ['cgv.html', 'Conditions générales de vente', 0.3], ['cgu.html', "Conditions générales d'utilisation (CGU)", 0.2],
  ['confidentialite.html', 'Politique de confidentialité', 0.3], ['cookies.html', 'Politique cookies', 0.2], ['accessibilite.html', 'Accessibilité', 0.2]
];

const cap = s => s.toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
const eur = n => n.toFixed(2).replace('.', ',') + ' €';
const priceText = it => it.s ? Object.entries(it.s).map(([k, v]) => `${k} ${eur(v)}`).join(' / ') : eur(it.p);

const restaurant = (withMenu) => {
  const r = {
    '@context': 'https://schema.org', '@type': 'Restaurant', '@id': SITE + '#restaurant',
    name: INFO.name, legalName: INFO.legal, url: SITE, telephone: INFO.tel, email: INFO.email,
    image: SITE + 'img/bandeaux/livraison.webp',
    address: { '@type': 'PostalAddress', streetAddress: INFO.street, postalCode: INFO.cp, addressLocality: INFO.city, addressRegion: 'Val-de-Marne', addressCountry: 'FR' },
    servesCuisine: ['Pizza', 'Burgers', 'Tacos', 'Tex-Mex', 'Sandwichs'],
    priceRange: '€', currenciesAccepted: 'EUR', paymentAccepted: 'Carte bancaire, Espèces, Titres-restaurant',
    openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], opens: '11:00', closes: '23:00' }],
    areaServed: ZONES.map(z => ({ '@type': 'City', name: z })),
    hasMenu: SITE + 'carte.html',
    sameAs: ['https://www.facebook.com/Pizza-Food-1682159702074299', 'https://www.instagram.com/pizzafood94430/', 'https://twitter.com/pizzafood94430', 'https://www.youtube.com/channel/UCCv9ak1TfnuyedFZNZe30Tw']
  };
  if (withMenu) {
    r.hasMenu = {
      '@type': 'Menu', name: 'La carte Pizza Food', inLanguage: 'fr', url: SITE + 'carte.html',
      hasMenuSection: DATA.cats.map(c => ({
        '@type': 'MenuSection', name: c.label,
        hasMenuItem: c.items.map(it => ({
          '@type': 'MenuItem', name: cap(it.n), description: it.d || undefined,
          offers: it.s
            ? Object.entries(it.s).map(([k, v]) => ({ '@type': 'Offer', name: k, price: v.toFixed(2), priceCurrency: 'EUR' }))
            : { '@type': 'Offer', price: it.p.toFixed(2), priceCurrency: 'EUR' }
        }))
      }))
    };
  }
  return r;
};

const block = obj => `<!-- seo:jsonld (généré par outils/generer-seo.js) -->\n  <script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>\n  <!-- /seo:jsonld -->`;
function inject(file, obj) {
  const p = path.join(ROOT, file);
  let s = fs.readFileSync(p, 'utf8');
  const re = /<!-- seo:jsonld[\s\S]*?<!-- \/seo:jsonld -->/;
  s = re.test(s) ? s.replace(re, block(obj)) : s.replace('</head>', '  ' + block(obj) + '\n</head>');
  fs.writeFileSync(p, s);
}
inject('index.html', restaurant(false));
inject('livraison.html', restaurant(false));
inject('carte.html', restaurant(true));

// ---------- llms.txt : résumé lisible par les agents IA ----------
const L = [];
L.push('# Pizza Food', '',
  `> Pizzeria et restauration rapide au ${INFO.street}, ${INFO.cp} ${INFO.city} (Val-de-Marne, France). Pizzas, burgers, tacos, tex-mex, sandwichs, salades et desserts, en livraison gratuite, à emporter ou sur place.`, '',
  '## Infos pratiques', '',
  `- Téléphone : 01 45 94 29 50 ou 07 49 45 89 55 — e-mail : ${INFO.email}`,
  '- Horaires : du lundi au samedi, de 11 h à 23 h (fermé le dimanche).',
  '- Livraison gratuite, minimum de commande 15 €, délai indicatif 40 minutes. À emporter : environ 20 minutes.',
  `- Villes livrées : ${ZONES.join(', ')}.`,
  '- Offres : en livraison, 2 pizzas achetées = la 3e offerte ; à emporter, 1 pizza achetée = la 2e offerte.',
  '- Paiement à la livraison ou au retrait uniquement : carte bancaire (terminal), espèces, titres-restaurant. Aucun paiement en ligne.',
  '- Commande : par téléphone (le site aide à préparer un récapitulatif à dicter) ou par e-mail.',
  '- Allergènes : tableau sur le site pour les pizzas ; pour les autres produits, appeler le restaurant avant de commander.', '',
  '## Pages', '');
PAGES.forEach(([f, t]) => L.push(`- [${t}](${SITE}${f})`));
L.push('', '## La carte (prix TTC en euros)', '');
DATA.cats.forEach(c => {
  L.push(`### ${c.label}`, '');
  c.items.forEach(it => L.push(`- ${cap(it.n)} — ${priceText(it)}${it.d ? ` — ${it.d}` : ''}`));
  L.push('');
});
L.push(`Mis à jour le ${TODAY}. Les prix et la disponibilité confirmés lors de la commande font foi.`);
fs.writeFileSync(path.join(ROOT, 'llms.txt'), L.join('\n') + '\n');

// ---------- sitemap.xml et robots.txt ----------
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGES.map(([f, , pr]) => `  <url><loc>${SITE}${f === 'index.html' ? '' : f}</loc><lastmod>${TODAY}</lastmod><priority>${pr.toFixed(1)}</priority></url>`).join('\n')}
</urlset>
`);
fs.writeFileSync(path.join(ROOT, 'robots.txt'), `# Pizza Food — tous les robots, moteurs et agents IA sont les bienvenus.
User-agent: *
Allow: /

Sitemap: ${SITE}sitemap.xml
`);
console.log('llms.txt, sitemap.xml, robots.txt et JSON-LD générés.');
