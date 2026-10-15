# Pizza Food — nouveau site (refonte)

Refonte du site de Pizza Food (34 rue du Général de Gaulle, 94430 Chennevières-sur-Marne), dans le style « néon de cirque » inspiré de Lamanna : orange `#ff4100`, jaune `#ffc700`, rose `#fdbeba`, titres en blocs avec ombre 3D (Bowlby One SC), étoiles, zigzags, bords de chapiteau.

## Thème « raffiné » (version 10)

`css/raffine.css` applique le design de la maquette 01 par-dessus `css/style.css` : fonds crème et blancs, titres à plat (orange et anthracite), cartes arrondies à ombre douce, police Inter, héros avec le texte à gauche et la pizza sur un disque jaune à droite, manifeste et pied de page sombres. Toutes les fonctionnalités restent identiques.

Pour revenir à l'ancien style « néon circus », il suffit de supprimer la ligne `<link rel="stylesheet" href="css/raffine.css…">` dans les 4 pages HTML.

## Ouvrir le site

Décompressez le dossier puis double-cliquez sur `index.html`. Pas d'installation. Une connexion Internet est nécessaire pour les polices.

## Pages

- `index.html` : accueil (héros, mode de commande, offres, pizzas stars, rangée de catégories pilotée par une barre, Vos envies, chiffres, infos)
- `carte.html` : les 190 produits des 21 catégories, filtre « Vos envies », barre de catégories avec flèches et barre de position (glissable)
- `livraison.html` : vérificateur de code postal, 11 villes, engagement 40 min, offres, à emporter
- `commande.html` : la commande en 3 étapes (Mon panier, Authentification et paiement, Confirmation)

## Animations et interactions

- Pizzas (photos réelles) découpées en 8 parts : quand le curseur approche, la pizza bouge et se découpe, la part la plus proche sort. Au clic, quelques ingrédients s'échappent (rien au survol, pour garder le site fluide).
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

1. **Mon panier** : tableau produit / prix unité / quantité / prix total avec la composition de chaque article, « Modifier » et « Supprimer », type de commande, code promo, offres, total, suggestions (boissons, desserts, glaces), plateau de la commande à gauche.
2. **Authentification et paiement** : créer un compte ou se connecter, coordonnées ; adresse de livraison : choisir une adresse enregistrée sur le compte ou saisir une nouvelle adresse pour cette commande (avec la case « Enregistrer cette adresse sur mon compte ») ; sans compte, une case permet de le créer avec ces informations ; remarques, mode de paiement (carte bancaire sur terminal, espèces, tickets restaurant, comme dans les CGV), jour et heure (dès que possible ou créneau, fermé le dimanche), rappel par email ou SMS, acceptation des CGV.
3. **Confirmation** : numéro de commande, récapitulatif, bouton « Envoyer ma commande » (e-mail pré-rempli vers contact@pizza-food.fr) et « Appeler ».

Compte client : création (téléphone, email, civilité, nom, prénom, date de naissance, société, « vous nous avez connu par » et adresse de livraison : ville, n°, adresse, bâtiment, escalier, codes, interphone, étage, porte), connexion par email + téléphone comme sur le site d'origine, « Mon compte » : modifier ses informations, ajouter / supprimer des adresses, historique des commandes. Accessible aussi depuis le pied de page et le menu mobile.

### Le plateau (`js/tray.js`)

Planche en bois en perspective, avec un léger relief qui suit la souris. Chaque article y est dessiné comme un objet en volume : canettes et bouteilles aux couleurs de chaque boisson (bouteille ronde pour l'Orangina, bouteille verte pour le Perrier, bouteilles plastique pour les 1,25 L / 1,5 L / 2 L, Capri-Sun), tacos coupé avec sa garniture, burgers, sandwichs, paninis, assiettes, boîtes de tex-mex (nuggets, wings, onion rings…), riz crousty, salades, pâtes et lasagnes, tiramisus, tartes, brownies, fondants, glaces. Les pizzas utilisent leur vraie photo, avec l'épaisseur de la pâte. Les menus sont décomposés (pizzas, tex-mex et boisson choisis) et les boissons choisies dans un tacos, un burger ou une pizza sont posées à côté.

Codes promo : à déclarer dans `js/config.js` (`promoCodes`, exemples en commentaire). Aucun code n'est fourni par défaut.

## Données

- `js/data.js` : carte, allergènes, mentions légales et CGV (repris de pizza-food.fr)
- `js/options.js` : options de composition de chaque produit (relevées sur pizza-food.fr)
- `js/shop.js` : fenêtre de composition, page commande, compte client, adresses, code promo
- `js/tray.js` : dessins des articles et mise en place du plateau
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
