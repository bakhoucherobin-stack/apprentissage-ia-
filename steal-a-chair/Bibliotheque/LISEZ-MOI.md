# Bibliothèque d'assets : fonctionnement

Retour : [[00 - Accueil]]

## Deux endroits séparés
| Quoi | Où | Sur GitHub ? |
|---|---|---|
| Les **fichiers** (sons, VFX, modèles, icônes) | `_assets/<categorie>/<pack>/` | ❌ non, trop lourd |
| Les **fiches** (description, liste, aperçus, licence, idées) | `Bibliotheque/` | ✅ oui |

Obsidian lit les deux : depuis une fiche, tu vois les images en aperçu, tu peux écouter les sons
et cliquer sur un fichier pour l'ouvrir.
Claude lit d'abord les fiches (légères), puis va chercher le fichier précis dans `_assets/` quand tu le lui demandes.

## Partager les gros fichiers avec ton collègue ou Claude dans le cloud
`_assets/` reste sur ton PC. Pour que ton collègue, ou une session Claude Code dans le cloud, y ait accès :
- **Google Drive** (15 Go gratuits) : mets `_assets/` dans un dossier Drive synchronisé, ou envoie les packs zippés.
- Ou **Git LFS** : gratuit sur GitHub jusqu'à 1 Go seulement, donc à réserver à quelques fichiers choisis.

## Licences : à vérifier avant d'utiliser un asset dans le jeu
- Packs « libres de droits » ou CC0 : OK.
- « Usage personnel uniquement » : à ne pas mettre dans un jeu publié (le jeu peut rapporter des Robux).
- Assets récupérés d'autres jeux Roblox : interdits (risque de ban).
La fiche affiche ⚠️ quand aucun fichier de licence n'a été trouvé dans le pack.
