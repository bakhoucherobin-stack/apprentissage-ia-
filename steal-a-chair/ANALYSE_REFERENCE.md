# Analyse du fichier de référence « Voler un Brainrot » (.rbxl)

Analyse faite à partir du fichier `place_109983668079237_Voler_un_Brainrot.rbxl` fourni.
Elle sert de **référence de design** (dimensions, systèmes, architecture) pour *Steal a Chair*.
Aucun code ni asset de ce fichier n'est copié dans notre projet.

## ⚠️ Ce qu'est vraiment ce fichier

- C'est une copie du vrai jeu faite avec un outil d'exploit (`UniversalSynSaveInstance`, « Join to Copy Games »).
- **Il ne contient pas le code serveur** (`ServerScriptService`, `ServerStorage`) : il est impossible de le récupérer
  avec ce genre d'outil. Le jeu ne peut donc pas fonctionner tel quel.
- Les meshes, textures et sons sont **privés** : ils n'apparaissent pas dans Studio.
- Les ID de produits Robux appartiennent au jeu original.
- **Publier ce fichier, ou du code ou des assets qui en viennent, = risque de ban du compte Roblox et de plainte DMCA.**
  On s'en sert uniquement pour mesurer et comprendre, puis on reconstruit tout nous-mêmes.

Contenu : 134 387 instances, 126 classes, 1 351 scripts (client et modules partagés seulement).

## 1. Disposition de la map (mesures réelles, en studs)

| Élément | Valeur relevée |
|---|---|
| Sol total | 252 (X) × 401 (Z), centré sur X = -410, Z = 59 |
| Tapis central (`Map/Carpet`) | 20 de large × 401 de long, sur l'axe Z |
| Tapis roulant (`Road`) | 3 voies parallèles (X = -435 / -411 / -387, donc 24 studs entre elles), de Z = -136 (Start) à Z = 256 (End), soit ~392 studs |
| Bases (`Plots`) | **8** dans l'original : 4 par côté, centres à **±93 studs** du tapis, espacées de **107 studs** en Z |
| Emprise d'une base | ~44 × 44 (hitbox de vol 44 × 16 × 44) |
| Entrée de base | `DeliveryHitbox` 48 × 17 × 14 côté tapis, panneau `PlotSign` à l'entrée |
| Couloirs | ~50 studs de chaque côté du tapis, entre le tapis et les entrées des bases |
| Spawn joueurs | au centre de la map, à côté du tapis |
| Boutiques et roue | au milieu de la longueur (Z ≈ 40-60), de part et d'autre du tapis, dans les couloirs : boutique « Cash » d'un côté, boutique Robux + roue de l'autre |

➡️ **Pour Steal a Chair (10 bases)** : 5 par côté, même espacement de ~107 studs, donc une map d'environ
**260 × 560 studs**, avec un tapis de ~540 studs. Les deux boutiques et les deux roues vont dans le couloir **gauche**, au milieu.

## 2. Structure d'une base (`Plots/<id>`)

- `AnimalPodiums/1..10` : 10 emplacements au rez-de-chaussée, en **2 rangées de 5**
  (espacement ~7,5 studs, rangées à ~37 studs l'une de l'autre). Chaque emplacement contient `Base` (socle) et `Claim` (zone de collecte).
- Étage 2 (+18 studs en Y) : emplacements 11 à 17, débloqués avec la progression (= **croissance tycoon**).
- `Laser` (22 lasers) + `LaserHitbox` : la barrière du **lock de la base**.
- `Purchases/PlotBlock` : le bouton pour verrouiller la base.
- `DeliveryHitbox` : on y dépose ce qu'on a volé. `StealHitbox` : la zone de vol.
- `Cash` : les panneaux d'argent à collecter. `Multiplier` : billboard du multiplicateur.
- `PlotSign` (nom du propriétaire, « YOUR BASE »), `FriendPanel` (autoriser ses amis), `Skin` (skins de base),
  `Unlock` (déblocage des étages), `Decorations`, `InvisibleWalls`, `Spawn`.

## 3. Systèmes de jeu (lus dans les modules de données)

- **Tapis** (`Datas/Game.RoadSpawn`) : vitesse 10 studs/s, une apparition toutes les 3 s,
  **pity** : un Legendary garanti au bout de 300 apparitions, un Mythic au bout de 900.
- **Lock de base** (`BlockBase`) : 60 s, gratuit. Le rebirth ajoute +10, +20, +30 s…
- **Revente** : 50 % du prix. **Gains hors ligne** : 60 min max (120 avec un bonus).
- **Niveaux de base** (`Datas/Bases`) : niveau 0-1 = 10 emplacements (modèle `FirstFloor`), puis +1 emplacement
  par niveau (modèle `SecondFloor`, etc.). Le modèle 3D change à certains paliers.
- **Raretés** (`Datas/Rarities`) : Common → Rare → Epic → Legendary → Mythic → Brainrot God → Secret → OG,
  chacune avec une couleur et un dégradé animé (Rainbow, Zebra…).
- **Rebirth** (`Datas/Rebirth`) : il faut une somme d'argent ET des personnages précis. Il donne de l'argent de départ,
  un multiplicateur, du temps de lock, des emplacements et des objets (gifles, grappin, taser…).
- **Roues** (`Datas/*SpinWheel`) : liste de récompenses **pondérées** (`Weight`), de type
  Animal / Cash-Pack / Item / Server-Luck. Le tirage se fait côté serveur.
- **Vol** : un attribut `Stealing` est posé sur le joueur pendant qu'il porte un objet. Remotes `StealService/Grab`,
  puis dépôt dans sa propre `DeliveryHitbox`.

## 4. Architecture du code (à reproduire avec nos propres outils open source)

- **Services côté serveur et contrôleurs côté client** (`ReplicatedStorage/Controllers/*Controller`).
  Les remotes sont nommés `Service/Action` (ex. `PlotService/ClaimCoins`, `ShopService/Purchase`).
- **Bibliothèques open source utilisées** (gratuites, utilisables légalement en version officielle) :
  `Net` (remotes), `Replion` (réplication de l'état joueur), `Promise`, `Signal`, `Trove` (nettoyage),
  `Spr` / `Spring` (animations), `TopbarPlus`, `Observers`, `Timer`, `SimplePath` (pathfinding).
- Toutes les données d'équilibrage sont dans des modules `Datas/*` séparés du code (bonne pratique à reprendre).

## 5. Correspondance avec Steal a Chair

| Brainrot | Steal a Chair |
|---|---|
| Brainrots sur le tapis | Chaises sur le tapis |
| Cash | **Aura** (flamme 3D noire-violette au-dessus de la tête) |
| Base `FirstFloor` / `SecondFloor` | Base **en forme de chaise** qui grandit (stades 1 à 5) |
| Lasers de lock | Barrière thématisée (laser violet, pieds de chaise qui se croisent…) |
| Boutique Cash + boutique Robux | Boutique **Aura** + boutique **Robux**, toutes les deux à gauche du tapis |
| Roues d'événement | Roue **journalière** + roue **hebdomadaire** |
| Murs décorés | Murs avec des **chaises-statues** incrustées (enflammées, dragoniques, spatiales) |
