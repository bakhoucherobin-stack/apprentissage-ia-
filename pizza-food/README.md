# Pizza Food — nouveau site (refonte)

Refonte du site de Pizza Food (Chennevières-sur-Marne), dans un style « néon de cirque sur un trottoir napolitain » inspiré de Lamanna's : orange colère `#ff4100`, jaune soleil `#ffc700`, rose blush `#fdbeba`, titres en blocs massifs (Bowlby One SC) avec ombre 3D sans flou.

## Lancer le site

Site statique, aucune dépendance ni build :

```bash
cd pizza-food
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

## Contenu

La carte (pizzas tomate / crème fraîche / barbecue, burgers, tacos, menus, desserts), les prix, l'adresse, les horaires, les téléphones et les 11 villes livrées sont repris du site actuel pizza-food.fr. Les données sont dans `js/main.js` (constantes `MENU`, `STARS`, `ZONES`).

## Animations

- **Chargement** : pizza qui tourne + compteur, rideau qui se lève.
- **Héros** : lettres qui tombent une à une, pizza SVG qui tourne et dont les parts s'écartent au scroll, ingrédients flottants en parallaxe (souris + scroll), badge étoile « livraison gratuite ».
- **Scroll** : barre de progression, nav qui se cache/réapparaît, bandeaux défilants dont la vitesse et le sens suivent le scroll, section « Pas que des pizzas » en défilement horizontal épinglé, manifeste dont les mots s'allument, compteurs animés, zigzags qui se dessinent, villes qui apparaissent comme des stickers.
- **Survol** : curseur personnalisé avec libellés, boutons magnétiques, lettres qui sautent, cartes en tilt 3D, une part de pizza qui sort sur les stars, lignes de la carte qui se remplissent en jaune, icônes animées (scooter, sac, assiette).
- **Panier** : ajout avec pizza qui vole jusqu'au panier, quantités, total, choix livraison / à emporter / sur place, récapitulatif (sauvegardé dans le navigateur).
- `prefers-reduced-motion` respecté.

## À brancher

Le bouton « Valider ma commande » affiche un récapitulatif et invite à appeler le restaurant : il faudra le relier au système de commande en ligne réel. Les liens Allergènes / Recrutement / Mentions légales / CGV sont à compléter.
