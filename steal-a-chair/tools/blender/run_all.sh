#!/usr/bin/env bash
# Lance tous les scripts Blender (depuis la racine du projet) :  bash tools/blender/run_all.sh
# Blender doit être installé et accessible avec la commande `blender`.
set -e
cd "$(dirname "$0")"
for f in statue_flame statue_dragon statue_space base_stages wheels shops; do
  blender --background --python "$f.py"
done
echo "Terminé : FBX dans assets/3d/, rendus dans docs/renders/"
