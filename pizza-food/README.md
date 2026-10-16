# Pizza Food — nouveau site (refonte)

Refonte du site de Pizza Food (34 rue du Général de Gaulle, 94430 Chennevières-sur-Marne), dans le style « néon de cirque » inspiré de Lamanna : orange `#ff4100`, jaune `#ffc700`, rose `#fdbeba`, titres en blocs avec ombre 3D (Bowlby One SC), étoiles, zigzags, bords de chapiteau.

## Thème « raffiné » (version 10)

`css/raffine.css` applique le design de la maquette 01 par-dessus `css/style.css` : fonds crème et blancs, titres à plat (orange et anthracite), cartes arrondies à ombre douce, police Inter, héros avec le texte à gauche et la pizza sur un disque jaune à droite, manifeste et pied de page sombres. Toutes les fonctionnalités restent identiques.

Pour revenir à l'ancien style « néon circus », il suffit de supprimer la ligne `<link rel="stylesheet" href="css/raffine.css…">` dans les 4 pages HTML.

## Effet « liquid glass » (version 11)

`css/glass.css` (+ `js/glass.js`) ajoute des halos de couleur qui flottent derrière la page et transforme les présentations en plaques de verre : vitrine (pizza posée sur un disque de verre), pizzas stars, cartes produits, modes de commande, offres, avis, panier, fenêtres, barres de navigation. Le reflet suit la souris. Pour l'enlever : supprimer les lignes `glass.css` et `glass.js` dans les 4 pages HTML. Le curseur de la souris est celui du système (plus de point jaune).

## Ouvrir le site

Décompressez le dossier puis double-cliquez sur `index.html`. Pas d'installation, et plus besoin d'Internet pour les polices : elles sont dans `fonts/` (aucune requête vers Google au chargement).

## Pages

- `index.html` : accueil (héros, mode de commande, offres, pizzas stars, rangée de catégories pilotée par une barre, Vos envies, chiffres, infos)
- `carte.html` : les 190 produits des 21 catégories, filtre « Vos envies », barre de catégories avec flèches et barre de position (glissable)
- `livraison.html` : vérificateur de code postal, 11 villes, engagement 40 min, offres, à emporter
- `commande.html` : la commande en 3 étapes (Mon panier, Authentification et paiement, Confirmation)
- Pages légales (lisibles sans JavaScript) : `mentions-legales.html`, `cgv.html`, `cgu.html`, `confidentialite.html`, `cookies.html`, `accessibilite.html` — générées par un script, mais ce sont de simples fichiers HTML modifiables à la main

## Animations et interactions

- Pizzas (photos réelles) découpées en 8 parts : au survol, les parts s'écartent un peu et la pizza tourne (sans suivre la position de la souris). Au clic, quelques ingrédients s'échappent.
- Chargement avec pizza qui tourne, rideau entre les pages, lettres qui tombent, bandeaux défilants à vitesse constante, rangée de catégories avec barre de défilement (ou glisser les cartes), pizza vitrine qui tourne et s'ouvre au survol avec ingrédients poussés par le curseur, texte qui s'allume, compteurs, boutons magnétiques, pluie d'ingrédients au clic dans le vide.

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

- `js/data.js` : carte et allergènes (repris de pizza-food.fr)
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

Par respect du RGPD, rien n'est chargé depuis Google tant que le visiteur n'a pas cliqué sur « Afficher les avis Google ». Google renvoie jusqu'à 5 avis, affichés en carrousel avec la note moyenne et le nombre d'avis. Sans clé, le bloc propose « Voir les avis » et « Laisser un avis » vers la fiche Google : aucun avis n'est inventé.

## À brancher avant la mise en ligne

- Envoi de la commande et paiement en ligne : sans serveur, la commande part par e-mail (ou par téléphone). Pour la recevoir directement en caisse, il faudra relier le site au logiciel de commande du restaurant.
- Comptes clients : enregistrés dans le navigateur du client tant qu'il n'y a pas de serveur.
- Formulaires et newsletter : ils ouvrent la messagerie vers contact@pizza-food.fr.

## Conformité (version 12)

Ce qui a été fait :

- **Données minimales** : plus de civilité, de date de naissance ni de « Vous nous avez connu par ». Les champs obligatoires portent un « * ». Le formulaire de recrutement ne demande plus l'adresse ni la date de naissance.
- **Information RGPD** au moment de la collecte, sous chaque formulaire, avec un lien vers `confidentialite.html` (finalités, bases légales, durées, droits, CNIL).
- **Newsletter** : case de consentement obligatoire (non cochée), mobile facultatif.
- **Commande** : bouton « Commander avec obligation de paiement » (art. L221-14 du Code de la consommation), lien vers les CGV, rappel de l'absence de rétractation (art. L221-28), mention Bloctel. Les coordonnées ne sont mémorisées sur l'appareil que si le client coche « Mémoriser mes coordonnées ».
- **Compte client** : bouton « Supprimer mon compte et mes données de cet appareil ».
- **Cookies** : aucun cookie, aucun traceur publicitaire ni de mesure d'audience ; seulement le stockage local nécessaire (panier, compte, préférences), exempté de consentement → **pas de bandeau**. Les polices sont hébergées sur le site ; les avis Google ne se chargent qu'après un clic. `cookies.html` liste tout ce qui est stocké et propose un bouton d'effacement.
- **Allergènes** : les pizzas sans aucune information dans le tableau affichent « Information à demander au restaurant » (au lieu d'un tableau vide qui faisait croire à l'absence d'allergènes) ; pour les autres produits, invitation à appeler avant de commander.
- **Accessibilité** : lien « Aller au contenu », un seul titre principal par page, textes alternatifs, groupes de choix annoncés, contrastes ≥ 4,5:1 (texte courant) vérifiés sur les 10 pages en ordinateur et iPhone, bandeaux défilants en pause au survol, animations désactivables.
- **Agents IA et moteurs** : données structurées schema.org (Restaurant, et la carte complète sur `carte.html`), `llms.txt` (infos + carte complète avec les prix), `robots.txt`, `sitemap.xml`. Après une modification de la carte : `node outils/generer-seo.js`.

**⚠️ Nom de domaine** : d'après le registre AFNIC (16/10/2026), pizza-food.fr est enregistré au nom de DESCLICK (l'ancienne agence) et expire le 6 décembre 2026 ; le site actuel et la boîte contact@pizza-food.fr tournent sur un serveur géré par des-click (Scaleway). Faire transférer le domaine au nom de PIZZA FOOD, le renouveler, et migrer la messagerie avant tout changement d'hébergement.

**Fiche pour le restaurant** : `../pizza-food-a-remplir/A-REMPLIR-PAR-LE-RESTAURANT.md` et le tableau `allergenes-pizza-food-a-remplir.xlsx` (190 produits). Une fois rempli : `python3 outils/importer-allergenes.py chemin/du/fichier.xlsx` (seules les lignes « Vérifié = OUI » sont publiées).

**Commandes** : le récapitulatif (étape 3) met en avant l'appel au restaurant ; l'e-mail reste en option.

**À compléter avant la mise en ligne** (repérés en jaune `[À compléter : …]` dans les pages) :

1. `mentions-legales.html` : nom du **directeur de la publication** ; **hébergeur** (nom, adresse, téléphone) ; ville du **greffe RCS** (voir l'extrait Kbis).
2. `cgv.html` : **médiateur de la consommation** (adhésion obligatoire, art. L612-1 du Code de la consommation).
3. `confidentialite.html` : fournisseur de **messagerie** de contact@pizza-food.fr et hébergeur.
4. Vérifier l'adresse définitive du site dans `outils/generer-seo.js` (`SITE`, aujourd'hui `https://pizza-food.fr/`), puis relancer le script.
5. Compléter le tableau des allergènes (pizzas sans données, burgers, tacos, etc.).

À faire côté restaurant : confirmer chaque commande reçue (par e-mail ou téléphone), comme l'indiquent les CGV ; tenir le registre des traitements (art. 30 du RGPD, modèle sur cnil.fr) ; faire relire CGV et mentions par un professionnel du droit.
