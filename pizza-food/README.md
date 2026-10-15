# Pizza Food — nouveau site (refonte)

Refonte du site de Pizza Food (34 rue du Général de Gaulle, 94430 Chennevières-sur-Marne), dans le style « néon de cirque » inspiré de Lamanna : orange `#ff4100`, jaune `#ffc700`, rose `#fdbeba`, titres en blocs avec ombre 3D (Bowlby One SC), étoiles, zigzags, bords de chapiteau.

## Ouvrir le site

Décompressez le dossier puis double-cliquez sur `index.html`. Pas d'installation. Une connexion Internet est nécessaire pour les polices et pour l'aperçu 3D (Three.js).

## Pages

- `index.html` : accueil (héros, mode de commande, offres, pizzas stars, défilement horizontal, Vos envies, chiffres, infos)
- `carte.html` : les 190 produits des 21 catégories, filtre « Vos envies », barre de catégories
- `livraison.html` : vérificateur de code postal, 11 villes, engagement 40 min, offres, à emporter

## Animations et interactions

- Pizzas (photos réelles) découpées en 8 parts : quand le curseur approche, la pizza bouge et se découpe, la part la plus proche sort ; au survol les ingrédients de la recette s'envolent ; au clic, explosion.
- Les autres produits projettent aussi leurs ingrédients (frites, salade, cheddar, chocolat…).
- Chargement avec pizza qui tourne, rideau entre les pages, lettres qui tombent, bandeaux défilants liés au scroll, défilement horizontal épinglé, texte qui s'allume, compteurs, curseur personnalisé, boutons magnétiques, pluie d'ingrédients au clic dans le vide.

## Fin de commande : aperçu 3D

« Valider ma commande » ouvre une scène 3D (Three.js) : chaque pizza est construite en 3D à partir de la vraie photo du produit (pâte, bord, 8 parts), à la bonne taille (Junior / Senior / Mega), posée sur une planche en bois ; les autres produits sont placés autour. On peut tourner la scène, zoomer, cliquer une pizza pour la découper ; survoler une ligne du ticket fait sauter le produit correspondant. Le ticket (offres, total, appel) est à côté.

Les pizzas 3D sont générées par le code à partir des photos et des recettes, pas par un modèle d'IA d'images.

## Données

- `js/data.js` : carte, allergènes, mentions légales et CGV (repris de pizza-food.fr)
- `js/photos3d.js` : photos des pizzas intégrées pour les textures 3D (chargé seulement à la validation)
- `img/produits/` : photos des produits en WebP, ravivées (couleurs, contraste, netteté)
- `img/bandeaux/` : bandeaux du site actuel, recadrés sans le texte incrusté

## Offres (calculées dans le panier)

En livraison 2 pizzas achetées = la 3e offerte, à emporter 1 achetée = la 2e offerte, sur les pizzas Senior et Mega sauf Marguerita. Minimum de 15 € en livraison.

## À brancher avant la mise en ligne

- Paiement / envoi de la commande : le ticket invite à appeler le restaurant.
- Formulaires et newsletter : ils ouvrent la messagerie vers contact@pizza-food.fr.
