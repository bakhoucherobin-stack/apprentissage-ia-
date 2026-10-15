# Pizza Food — nouveau site (refonte)

Refonte du site de Pizza Food (34 rue du Général de Gaulle, 94430 Chennevières-sur-Marne).

Le style mélange deux références :

- **Amrit Palace** pour la base : fond parchemin `#d8cbb8`, titres serif très fins en capitales (Cormorant Garamond 300), texte en sans-serif (Manrope 500), filets de 1 px, coins droits, photos sombres en pleine largeur.
- **Lamanna** pour l'énergie : orange `#ff4100` et jaune `#ffc700` sur les offres, étoiles qui tournent, bandeaux défilants, typo en blocs avec ombre 3D (Bowlby One SC), effets au survol.

## Ouvrir le site

Décompressez le dossier puis double-cliquez sur `index.html`. Pas de serveur ni d'installation nécessaires. Une connexion Internet est utile pour les polices.

## Les pages

| Page | Contenu |
|------|---------|
| `index.html` — Accueil | Choix du mode (livraison / à emporter / sur place), offres, pizzas signatures, défilement horizontal des autres catégories, « Vos envies », chiffres, adresse et horaires |
| `carte.html` — La carte | Les 190 produits des 21 catégories avec photo, description et prix (Junior / Senior / Mega pour les pizzas), barre de catégories, filtre « Vos envies » |
| `livraison.html` — Livraison | Vérificateur de code postal, 11 villes avec codes postaux, engagement 40 min, minimum 15 €, offres, à emporter, choix du mode |

Le pied de page (newsletter, 12 liens, réseaux sociaux) et le panier sont communs aux trois pages. Charte qualité, recrutement, appréciation, fidélité, mentions légales, CGV, contact, mobile et allergènes s'ouvrent dans une fenêtre.

## Contenu repris de pizza-food.fr

- `js/data.js` : la carte (190 produits), le tableau des allergènes (46 produits × 14 allergènes) et les textes des mentions légales et CGV. Ce fichier est généré à partir du site actuel.
- `img/produits/` : les vraies photos des produits, converties en WebP (29 Mo de PNG → 3,8 Mo).
- `img/bandeaux/` : les bandeaux de la page d'accueil, recadrés pour retirer le texte incrusté.

## Offres (calculées dans le panier)

- En livraison : 2 pizzas achetées = la 3e offerte.
- À emporter : 1 pizza achetée = la 2e offerte.
- Valable sur les pizzas Senior et Mega, sauf Marguerita. Les pizzas offertes sont les moins chères de chaque groupe.
- En livraison, le minimum de commande de 15 € bloque la validation.

## À brancher avant la mise en ligne

- **Paiement / prise de commande** : « Valider ma commande » affiche le récapitulatif et invite à appeler le restaurant.
- **Formulaires** (contact, recrutement, appréciation, newsletter) : ils ouvrent la messagerie avec un e-mail pré-rempli vers contact@pizza-food.fr. Il faudra un vrai envoi côté serveur.
- **Fidélité** : il n'y a pas de comptes clients, la fenêtre reprend seulement le texte du site actuel.
