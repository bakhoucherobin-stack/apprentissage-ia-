# Steal a Chair : accueil

Coffre Obsidian du projet. Ouvre **ce dossier** (`steal-a-chair`) avec Obsidian : *Open folder as vault*.

## Projet
- [[PROMPTS]] : les prompts Claude Code, étape par étape
- [[ANALYSE_REFERENCE]] : notes d'analyse (mesures et systèmes)

## Bibliothèque d'inspiration
- [[VFX]] : effets visuels
- [[SFX]] : bruitages
- [[Musiques]]
- [[Icones]]
- [[Modeles 3D]]

## Ajouter un pack
1. Décompresse le pack dans le bon sous-dossier de `_assets/` (`vfx`, `sfx`, `musiques`, `icones`, `modeles3d`),
   par exemple `_assets/vfx/Pack Feu Magique/`.
2. Dans un terminal ouvert dans `steal-a-chair`, lance : `python tools/catalog_assets.py`
   (ou demande à Claude : « catalogue les nouveaux assets »).
3. La fiche du pack apparaît dans `Bibliotheque/Packs/`. Remplis la section **Mes notes** (licence, idées).
   Elle est conservée quand on relance le script.

> Les fichiers lourds de `_assets/` ne sont **pas envoyés sur GitHub** (ils sont dans `.gitignore`).
> Seules les fiches sont versionnées. Voir [[Bibliotheque/LISEZ-MOI]].
