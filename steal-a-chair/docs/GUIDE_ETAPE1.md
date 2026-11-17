# Étape 1 : la map. Guide pas à pas

> ⚠️ `MapBuilder.lua` et les scripts Blender ont été écrits sans Roblox Studio ni Blender sous la main :
> la syntaxe du Lua a été vérifiée, mais **rien n'a encore été lancé pour de vrai**. Si une erreur apparaît
> dans la fenêtre Output de Studio, copie-la et donne-la à Claude : il corrigera.

## A. Générer la map (5 minutes, aucun logiciel en plus)
1. Roblox Studio > nouvelle place (modèle **Baseplate**).
2. Onglet **Affichage** > **Barre de commande**.
3. Ouvre `tools/MapBuilder.lua`, copie TOUT, colle dans la barre de commande, **Entrée**.
4. Regarde la fenêtre **Output** : `[MapBuilder] OK : … parts, 10 plots, … statues`.
5. Résultat dans l'Explorer : `Workspace > Map` (`Plots`, `Conveyor`, `Shops`, `Wheels`, `Walls`, `WallStatues`, `Decor`,
   `StagePreview`) + `SpawnLocation`. Les gabarits des 5 stades sont dans `ServerStorage > BaseStages`.
6. Tout se règle dans la section **PARAMÈTRES** en haut du script, puis relance (il recrée `Workspace.Map`).
   Quand tu commences à peaufiner à la main, passe `REBUILD = false` ou n'utilise plus le script.

Si une rampe ou une aile semble à l'envers : sélectionne-la et tourne-la de 180° sur l'axe Y.

## B. Fabriquer les modèles 3D avec Blender (gratuit)
1. Installe Blender : https://www.blender.org/download/
2. Dans un terminal, depuis `steal-a-chair` : `bash tools/blender/run_all.sh`
   (si `blender` n'est pas reconnu, mets son chemin complet, par exemple
   `"C:\Program Files\Blender Foundation\Blender 4.x\blender.exe" --background --python tools/blender/statue_flame.py`).
3. Les `.fbx` arrivent dans `assets/3d/` et les rendus PNG dans `docs/renders/`.
   Pièces : 3 statues, 5 stades de base, 2 roues, 2 stands. Chaque mesh fait moins de 10 000 triangles.
4. Studio : **Affichage > 3D Importer** > choisis le `.fbx` > Importer. Place le mesh à la position du placeholder,
   puis supprime le placeholder. Mêmes noms de Model qu'avant pour que les futurs scripts s'y retrouvent.

Échelle : 1 unité Blender ≈ 10 studs. Si un mesh est trop grand ou petit, change sa `Size` dans Studio.

## C. Ce que tu dois faire à la main dans Studio
- Regarder la map en mode **Play** pour vérifier le spawn et la lumière.
- Remplacer les placeholders par les meshes Blender (B.4).
- VFX : les flammes sont des `ParticleEmitter` déjà dans les Models. Pour des effets plus beaux, importe des textures
  depuis ta bibliothèque d'assets (`Bibliotheque/VFX.md`) et change la propriété `Texture` des emitters.
- Remplacer le texte des panneaux (`SurfaceGui`) si tu veux d'autres polices.

## D. Plan
`docs/MAP_PLAN.png` (régénéré avec `python tools/make_map_plan.py`).

## Ce qui n'est PAS dans cette étape
Le tapis ne bouge pas encore et les boutiques/roues sont inertes (étapes 2, 6, 7) ; la croissance des bases est à l'étape 3.
