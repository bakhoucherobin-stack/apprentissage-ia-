# Prompts Claude Code : Steal a Chair

Mode d'emploi : envoie les étapes **une par une**, dans l'ordre, et teste dans Roblox Studio entre chaque étape.
Colle le **bloc CONTEXTE** au début de chaque prompt.

---

## 🧱 Bloc CONTEXTE (à coller au début de chaque prompt)

```markdown
# CONTEXTE DU PROJET : "Steal a Chair" (jeu Roblox)

Jeu Roblox inspiré de "Steal a Brainrot", mais les objets à voler sont des CHAISES.
Boucle de jeu : des chaises arrivent sur un tapis roulant → on les achète → on les pose dans sa base
→ elles génèrent de l'AURA (la monnaie) → on peut voler les chaises des autres bases.

Règles fixes :
- Budget 0 € : uniquement des outils gratuits (Roblox Studio, Rojo, Blender, Python, Node).
- Monnaie du jeu = l'AURA, représentée par une flamme 3D noire-violette qui brûle au-dessus de la tête des joueurs.
- Tout est thématisé "chaises" (décor, bases, boutiques, UI, effets).
- Tout est MODULAIRE : chaque élément est un Model séparé, bien nommé et rangé dans des dossiers,
  pour que je puisse le peaufiner moi-même dans Studio.
- Projet structuré avec Rojo, code en Luau `--!strict`, commenté en français.
  Architecture "Services serveur / Controllers client", remotes nommés `Service/Action`,
  toutes les données d'équilibrage dans `src/Shared/Data/*`.
- Il n'y a AUCUN fichier ni asset de référence : tout est créé de zéro à partir des consignes de ce prompt.
- Utilise les meilleurs skills disponibles (design, UI/UX, artifact-design, 3D, frontend…).
  Dis-moi lesquels tu utilises et pourquoi.
- À la fin de chaque étape : résumé, liste de ce que je dois faire à la main dans Studio,
  puis commit et push.
```

---

## Étape 1 : la map ⭐

```markdown
[COLLER LE BLOC CONTEXTE]

## ÉTAPE 1 : CRÉATION DE LA MAP
Proportions inspirées de Steal a Brainrot, avec 10 bases. Respecte les dimensions ci-dessous.

### Disposition (en studs, axe Z = longueur de la map)
- Sol d'environ 260 × 560, centré en (0, 0, 0).
- Tapis roulant au centre, sur l'axe Z : 20 studs de large et environ 540 de long, avec 3 voies
  (X = -24 / 0 / +24). Points `Start` et `End` à chaque bout.
- 10 bases : 5 à gauche (X ≈ -93) et 5 à droite (X ≈ +93), espacées de 107 studs en Z,
  entrées tournées vers le tapis. Emprise d'environ 44 × 44 par base.
- Couloirs d'environ 50 studs entre le tapis et les entrées des bases.
- Au MILIEU de la map, dans le couloir GAUCHE du tapis :
  1. La boutique ROBUX (stand premium doré en forme de trône, avec un PNJ vendeur)
  2. La boutique AURA (stand noir-violet, flammes d'aura, avec un PNJ vendeur)
  3. La ROUE JOURNALIÈRE et la ROUE HEBDOMADAIRE : deux grandes roues 3D côte à côte,
     avec un design différent pour chacune (l'hebdomadaire est plus grande et plus épique)
- `SpawnLocation` au centre, dans le couloir droit, en face des boutiques.

### Les bases EN FORME DE CHAISE (style tycoon)
- Chaque base est une chaise géante dans laquelle on entre : le dossier sert de mur du fond,
  l'assise sert de plateforme, les pieds servent de piliers.
- 5 STADES de croissance, chacun un Model séparé : `BaseStage1` (tabouret en bois, 10 emplacements)
  → `BaseStage5` (trône géant, à 2 étages, environ 18 emplacements). Le 2e étage est à +18 studs.
- Chaque base contient :
  `ChairSlots/1..N` (2 rangées de 5 au rez-de-chaussée, chaque slot avec `Pedestal` et `Collect`),
  `DeliveryZone` (48 × 17 × 14 à l'entrée), `StealZone`, `LockBarrier` (lasers violets) + `LockButton`,
  `OwnerSign` (nom du propriétaire), `AuraCollector`, `Spawn`, `Decorations`.
- Attributs sur chaque plot : `PlotId`, `Owner` (vide), `Stage` (= 1).
  La logique de croissance viendra à l'étape 3 : là, je veux seulement les modèles.

### Les murs d'enceinte (très important pour le style)
- Grands murs sombres tout autour des 10 bases.
- Dans les murs, des chaises-statues qui "sortent" à moitié du mur, comme figées dedans :
  - chaises ENFLAMMÉES (feu + braises en ParticleEmitter)
  - chaises DRAGONIQUES (écailles, cornes, ailes, yeux lumineux)
  - chaises de l'ESPACE (métal, néons cyan, petites planètes ou étoiles en orbite)
- Alternées de façon rythmée, avec des éclairages (PointLight/SpotLight).

### Ambiance
- Ciel NOIR (Sky noir, Lighting sombre, un peu d'Atmosphere violette), pas de soleil visible.
- Sol thématisé (parquet sombre ou dalles avec des motifs de chaises).
- Éclairage qui met en valeur le tapis, les boutiques, les roues et les statues.

### Méthode technique
1. **Blender (gratuit)** : scripts Python `bpy` dans `tools/blender/` qui génèrent les statues
   (enflammée, dragonique, spatiale), les 5 stades de base-chaise, les 2 roues et les 2 stands de boutique.
   Style low-poly cartoon Roblox, moins de 10 000 triangles par mesh, export `.fbx` dans `assets/3d/`.
   Si Blender est installable dans ton environnement, lance les scripts et fais des rendus PNG de prévisualisation.
   Sinon, donne-moi la commande exacte pour les lancer chez moi.
2. **`tools/MapBuilder.lua`** : script à exécuter dans la barre de commande de Studio. Il génère TOUTE la map
   en Parts (placeholders), avec en haut du fichier tous les paramètres (nombre de bases, espacement,
   longueur du tapis, couleurs…). Les meshes Blender remplacent ensuite les placeholders.
3. **Hiérarchie Workspace** :
   `Map/Plots/Plot1..10`, `Map/Conveyor`, `Map/Shops/RobuxShop`, `Map/Shops/AuraShop`,
   `Map/Wheels/DailyWheel`, `Map/Wheels/WeeklyWheel`, `Map/Walls`, `Map/WallStatues`, `Map/Decor`, `SpawnLocation`.
4. **VFX** : ParticleEmitter, Beam et Trail directement dans les Models. Si j'utilise un plugin de VFX
   (type VFX Studio), donne-moi aussi les réglages à appliquer.
5. **Plan** vu du dessus avec les cotes : `docs/MAP_PLAN.png` (SVG rendu en PNG).

### Livrables
`tools/MapBuilder.lua`, `tools/blender/*.py`, `assets/3d/*.fbx`, les rendus PNG, `docs/MAP_PLAN.png`,
et un guide pas à pas : importer les FBX (3D Importer), lancer le MapBuilder, remplacer les placeholders.
```

---

## Étape 2 : le tapis roulant et les chaises

```markdown
[COLLER LE BLOC CONTEXTE]

## ÉTAPE 2 : TAPIS ROULANT + CHAISES
- `src/Shared/Data/Chairs.lua` : au moins 15 chaises (nom drôle, rareté, prix en aura, aura/seconde).
- `src/Shared/Data/Rarities.lua` : Commune → Rare → Épique → Légendaire → Mythique → Chaise Divine → Secrète,
  chacune avec une couleur et un dégradé animé pour les plus rares.
- `src/Shared/Data/Game.lua`, avec ces valeurs de départ : vitesse du tapis 10 studs/s,
  une apparition toutes les 3 s, pity (Légendaire garanti après 300 apparitions, Mythique après 900).
- Les chaises avancent sur les 3 voies, avec un BillboardGui (nom, rareté, prix, aura/s).
- Achat avec un ProximityPrompt : la chaise "marche" (petite animation de pieds) jusqu'à la base de l'acheteur.
- Validation côté serveur (argent, distance, rate-limit).
- Modèles Blender pour 5 chaises de démonstration.
```

## Étape 3 : les bases (croissance + lock + collecte)

```markdown
[COLLER LE BLOC CONTEXTE]

## ÉTAPE 3 : BASES
- Attribution automatique d'une base libre quand un joueur arrive. Libération quand il part.
- Chaque chaise posée génère de l'aura en continu. Le joueur la récupère en marchant sur `Collect` ou `AuraCollector`.
- Revente d'une chaise à 50 % de son prix. Gains hors ligne limités à 60 minutes.
- Croissance (`src/Shared/Data/Bases.lua`) : niveau 1 = 10 emplacements, +1 par niveau. Le modèle passe de
  `BaseStage1` à `BaseStage5` à certains paliers, avec une animation de croissance (tween + particules + son).
- Lock : barrière laser pendant 60 s, puis cooldown. Affichage du temps restant sur `OwnerSign`.
```

## Étape 4 : le vol de chaises

```markdown
[COLLER LE BLOC CONTEXTE]

## ÉTAPE 4 : VOL
- On entre dans une base non verrouillée, on prend une chaise : elle est portée au-dessus de la tête
  et l'attribut `Stealing` est posé sur le joueur.
- On la ramène dans SA `DeliveryZone` pour la garder. Le voleur est ralenti, mis en surbrillance,
  et la victime reçoit l'alerte "ON VOLE TA CHAISE !".
- Frappé = il lâche la chaise, qui retourne à sa base. Anti-triche serveur (téléportation, distance, rate-limit).
```

## Étape 5 : l'aura

```markdown
[COLLER LE BLOC CONTEXTE]

## ÉTAPE 5 : AURA
- Flamme 3D noire-violette au-dessus de la tête (mesh Blender + ParticleEmitter + PointLight violet).
  Sa taille, sa couleur et ses particules évoluent par paliers d'aura.
- HUD : compteur d'aura et aura/s avec l'icône de la flamme, plus des leaderstats.
- Sauvegarde DataStore fiable (retries, session lock, migration de version des données).
```

## Étape 6 : les boutiques

```markdown
[COLLER LE BLOC CONTEXTE]

## ÉTAPE 6 : BOUTIQUES
- Boutique Aura (`src/Shared/Data/AuraShop.lua`) : objets de frappe (gifle, chaise pliante…),
  bobines de vitesse, boosts, skins de flamme, skins de base.
- Boutique Robux (`src/Shared/Data/RobuxShop.lua`) : gamepasses (x2 aura, lock plus long, VIP)
  et Developer Products (packs d'aura, tours de roue). MarketplaceService + ProcessReceipt fiable
  (idempotent, sauvegardé). Les ID restent VIDES : je les remplirai avec les miens.
- Interfaces cartoon, lisibles sur mobile, conçues avec les skills UI/UX.
  Elles s'ouvrent à l'approche des stands (ProximityPrompt).
```

## Étape 7 : les roues journalière et hebdomadaire

```markdown
[COLLER LE BLOC CONTEXTE]

## ÉTAPE 7 : ROUES
- `src/Shared/Data/DailyWheel.lua` et `WeeklyWheel.lua` : récompenses pondérées (`Weight`),
  de type Chair / AuraPack / Item / ServerLuck.
- Journalière : 1 tour gratuit toutes les 24 h. Hebdomadaire : 1 tour tous les 7 jours, avec de meilleures récompenses.
- Le tirage est fait par le SERVEUR (horodatage sauvegardé). Le client anime la roue 3D de la map et l'UI
  (accélération, ralentissement, suspense, confettis). Minuteur au-dessus de chaque roue.
  Tours supplémentaires en Robux.
```

## Étape 8 : animations et VFX

```markdown
[COLLER LE BLOC CONTEXTE]

## ÉTAPE 8 : ANIMATIONS & VFX
- Animations : porter une chaise, frapper, chaise qui marche, base qui grandit, achat, obtention d'une chaise rare.
- VFX : apparition des légendaires sur le tapis, flamme d'aura, roues, statues des murs.
- Sons libres de droits, camera shake quand on se fait voler.
```

## Étape 9 : rebirth, finitions et vitrine

```markdown
[COLLER LE BLOC CONTEXTE]

## ÉTAPE 9 : REBIRTH + VITRINE
- Rebirth (`src/Shared/Data/Rebirth.lua`) : il faut de l'aura ET des chaises précises. Il donne un multiplicateur,
  du temps de lock en plus, des emplacements et des objets.
- Miniature 1920×1080, icône 512×512, page vitrine HTML (skills design, Hyperframes pour un trailer si disponible).
- Checklist de publication sur Roblox.
```
