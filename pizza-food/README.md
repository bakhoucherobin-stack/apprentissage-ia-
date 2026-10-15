# Pizza Food — nouveau site (refonte)

Refonte du site de Pizza Food (34 rue du Général de Gaulle, 94430 Chennevières-sur-Marne), dans le style « néon de cirque » inspiré de Lamanna : orange `#ff4100`, jaune `#ffc700`, rose `#fdbeba`, titres en blocs avec ombre 3D (Bowlby One SC), étoiles, zigzags, bords de chapiteau.

## Ouvrir le site

Décompressez le dossier puis double-cliquez sur `index.html`. Pas d'installation. Une connexion Internet est nécessaire pour les polices.

## Pages

- `index.html` : accueil (héros, mode de commande, offres, pizzas stars, rangée de catégories pilotée par une barre, Vos envies, chiffres, infos)
- `carte.html` : les 190 produits des 21 catégories, filtre « Vos envies », barre de catégories
- `livraison.html` : vérificateur de code postal, 11 villes, engagement 40 min, offres, à emporter
- `commande.html` : la commande en 3 étapes (Mon panier, Authentification et paiement, Confirmation)

## Animations et interactions

- Pizzas (photos réelles) découpées en 8 parts : quand le curseur approche, la pizza bouge et se découpe, la part la plus proche sort ; au survol les ingrédients de la recette s'envolent ; au clic, explosion.
- Les autres produits projettent aussi leurs ingrédients (frites, salade, cheddar, chocolat…).
- Chargement avec pizza qui tourne, rideau entre les pages, lettres qui tombent, bandeaux défilants à vitesse constante, rangée de catégories avec barre de défilement (ou glisser les cartes), pizza vitrine qui tourne et s'ouvre au survol avec ingrédients poussés par le curseur, texte qui s'allume, compteurs, curseur personnalisé, boutons magnétiques, pluie d'ingrédients au clic dans le vide.

## Composer un produit (comme sur le site d'origine)

Cliquer « Ajouter » (ou une taille) sur une pizza, un menu, des tacos, un burger, un sandwich… ouvre la fenêtre de composition, avec les options relevées sur pizza-food.fr pour chaque produit et chaque taille :

- Composition : les ingrédients sont cochés, on décoche pour retirer (« Sans fromage »…).
- Choix obligatoires, une case par groupe : pâte (classique / cheesy), viandes des tacos, gratinage, sauce, boisson, pizzas des menus…
- Choix facultatifs : boisson en supplément, ingrédients supplémentaires (légumes, viandes/poissons, fromages) au prix du site (1 € Junior, 1,50 € Senior, 2 € Mega).
- Quantité, prix mis à jour en direct, « Valider » ou « Ignorer ». On peut changer de taille sans perdre ses choix.
- Les produits sans options (boissons, desserts, glaces, tex-mex, menus enfants, pâtes) s'ajoutent directement, comme sur le site d'origine.

Dans le panier, chaque article affiche sa composition et un bouton « Modifier » qui rouvre la fenêtre avec les choix déjà faits.

Les 4 menus du midi ne sont proposés par le site d'origine qu'à midi : leurs choix ont été reconstitués à partir de leur description (pizza junior / salade / sandwich grec ou chicken / tex-mex, dessert et boisson 33 cl au choix).

## La commande en 3 étapes (`commande.html`)

1. **Mon panier** : tableau produit / prix unité / quantité / prix total avec la composition de chaque article, « Modifier » et « Supprimer », type de commande, code promo, offres, total, suggestions (boissons, desserts, glaces), visuel 2D du plateau à gauche (planche en bois en perspective, pizzas qui tournent, vapeur, produits debout, léger relief qui suit la souris).
2. **Authentification et paiement** : créer un compte ou se connecter, coordonnées et adresse de livraison (11 villes), remarques, mode de paiement (carte bancaire sur terminal, espèces, tickets restaurant, comme dans les CGV), jour et heure (dès que possible ou créneau, fermé le dimanche), rappel par email ou SMS, acceptation des CGV.
3. **Confirmation** : numéro de commande, récapitulatif, bouton « Envoyer ma commande » (e-mail pré-rempli vers contact@pizza-food.fr) et « Appeler ».

Compte client : création (téléphone, email, civilité, nom, prénom, date de naissance, société, « vous nous avez connu par »), connexion par email + téléphone comme sur le site d'origine, historique des commandes. Accessible aussi depuis le pied de page et le menu mobile.

Codes promo : à déclarer dans `js/config.js` (`promoCodes`, exemples en commentaire). Aucun code n'est fourni par défaut.

## Données

- `js/data.js` : carte, allergènes, mentions légales et CGV (repris de pizza-food.fr)
- `js/options.js` : options de composition de chaque produit (relevées sur pizza-food.fr)
- `js/shop.js` : fenêtre de composition, page commande, compte client, code promo, plateau 2D
- `img/produits/` : photos des produits en WebP, ravivées (couleurs, contraste, netteté)
- `img/bandeaux/` : bandeaux du site actuel, recadrés sans le texte incrusté

## Offres (calculées dans le panier)

En livraison 2 pizzas achetées = la 3e offerte, à emporter 1 achetée = la 2e offerte, sur les pizzas Senior et Mega sauf Marguerita. Minimum de 15 € en livraison.

## Avis Google

Le bloc « Avis Google » de l'accueil importe les avis en direct depuis la fiche Google de la pizzeria dès qu'une clé est renseignée dans `js/config.js` :

1. Sur Google Cloud (compte de la pizzeria), créer un projet et activer « Maps JavaScript API » et « Places API (New) » (facturation à activer).
2. Créer une clé d'API et la restreindre au domaine du site.
3. Coller la clé dans `googleMapsKey`. L'identifiant de la fiche (`googlePlaceId`) est facultatif : sinon la fiche est cherchée par son adresse.

Google renvoie jusqu'à 5 avis, affichés en carrousel avec la note moyenne et le nombre d'avis. Sans clé, le bloc propose « Voir les avis » et « Laisser un avis » vers la fiche Google : aucun avis n'est inventé.

## À brancher avant la mise en ligne

- Envoi de la commande et paiement en ligne : sans serveur, la commande part par e-mail (ou par téléphone). Pour la recevoir directement en caisse, il faudra relier le site au logiciel de commande du restaurant.
- Comptes clients : enregistrés dans le navigateur du client tant qu'il n'y a pas de serveur.
- Formulaires et newsletter : ils ouvrent la messagerie vers contact@pizza-food.fr.
