#!/usr/bin/env python3
"""Catalogue la bibliothèque d'assets de Steal a Chair pour Obsidian et Claude.

Structure attendue :
    _assets/<categorie>/<nom du pack>/...   (vfx, sfx, musiques, icones, modeles3d)

Pour chaque pack, le script écrit une fiche `Bibliotheque/Packs/<categorie> - <pack>.md`
(nombre de fichiers, poids, types, liste, aperçus des images et des sons) et met à jour
la note d'index de chaque catégorie. Les notes que tu as écrites à la main dans la section
« Mes notes » d'une fiche sont conservées.

Usage (depuis le dossier steal-a-chair) :
    python tools/catalog_assets.py
"""
from __future__ import annotations

import os
import re
from collections import Counter
from datetime import date
from pathlib import Path

VAULT = Path(__file__).resolve().parent.parent
ASSETS = VAULT / "_assets"
BIBLIO = VAULT / "Bibliotheque"
PACKS = BIBLIO / "Packs"

CATEGORIES = {
    "vfx": ("VFX", "Effets visuels : particules, textures d'effets, flipbooks…"),
    "sfx": ("SFX", "Bruitages : coups, achats, vol, UI…"),
    "musiques": ("Musiques", "Musiques d'ambiance et de menu."),
    "icones": ("Icones", "Icônes d'UI, de monnaie, d'objets."),
    "modeles3d": ("Modeles 3D", "Modèles 3D : chaises, décors, accessoires."),
}

IMAGE_EXT = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp", ".tga"}
AUDIO_EXT = {".mp3", ".ogg", ".wav", ".flac", ".m4a"}
MODEL_EXT = {".fbx", ".obj", ".glb", ".gltf", ".blend", ".rbxm", ".rbxmx", ".dae", ".stl"}
LICENSE_HINTS = ("licen", "readme", "credit", "terms", "copyright")
MAX_LISTED = 300      # nombre max de fichiers listés par fiche
MAX_PREVIEWS = 24     # nombre max d'aperçus intégrés par fiche
MANUAL_MARK = "## Mes notes"


def human(n: float) -> str:
    for unit in ("o", "Ko", "Mo", "Go"):
        if n < 1024:
            return f"{n:.0f} {unit}" if unit == "o" else f"{n:.1f} {unit}"
        n /= 1024
    return f"{n:.1f} To"


def safe_name(s: str) -> str:
    return re.sub(r'[\\/:*?"<>|#^\[\]]', "-", s).strip()


def kind(ext: str) -> str:
    if ext in IMAGE_EXT:
        return "image"
    if ext in AUDIO_EXT:
        return "son"
    if ext in MODEL_EXT:
        return "modele 3D"
    return ext.lstrip(".") or "sans extension"


def read_manual_notes(note: Path) -> str:
    if note.exists():
        text = note.read_text(encoding="utf-8")
        if MANUAL_MARK in text:
            return text.split(MANUAL_MARK, 1)[1].strip("\n")
    return "- Licence vérifiée : non\n- Utilisable pour : \n- Idées : "


def catalog_pack(cat: str, pack: Path) -> dict:
    files = sorted(p for p in pack.rglob("*") if p.is_file() and not p.name.startswith("."))
    total = sum(p.stat().st_size for p in files)
    kinds = Counter(kind(p.suffix.lower()) for p in files)
    licenses = [p for p in files if any(h in p.name.lower() for h in LICENSE_HINTS)]
    title = f"{CATEGORIES[cat][0]} - {pack.name}"
    note = PACKS / f"{safe_name(title)}.md"
    rel_root = os.path.relpath(VAULT, note.parent)

    def link(p: Path) -> str:
        return Path(rel_root, p.relative_to(VAULT)).as_posix().replace(" ", "%20")

    lines = [
        "---",
        f"categorie: {cat}",
        f"pack: \"{pack.name}\"",
        f"fichiers: {len(files)}",
        f"poids: \"{human(total)}\"",
        f"chemin: \"{pack.relative_to(VAULT).as_posix()}\"",
        f"licence_trouvee: {'oui' if licenses else 'non'}",
        f"mis_a_jour: {date.today().isoformat()}",
        f"tags: [asset, {cat}]",
        "---",
        f"# {title}",
        "",
        f"Retour : [[{CATEGORIES[cat][0]}]] · [[00 - Accueil]]",
        "",
        f"- **Dossier** : `{pack.relative_to(VAULT).as_posix()}`",
        f"- **Fichiers** : {len(files)} ({human(total)})",
        "- **Types** : " + (", ".join(f"{k} ×{v}" for k, v in kinds.most_common()) or "aucun"),
        "- **Licence** : " + (", ".join(f"[{p.name}]({link(p)})" for p in licenses)
                              if licenses else "⚠️ aucun fichier de licence trouvé, à vérifier avant usage"),
        "",
        MANUAL_MARK,
        read_manual_notes(note),
        "",
    ]
    previews = [p for p in files if p.suffix.lower() in IMAGE_EXT | AUDIO_EXT][:MAX_PREVIEWS]
    if previews:
        lines += ["## Aperçus", ""]
        lines += [f"**{p.name}**\n\n![{p.name}]({link(p)})\n" for p in previews]
    lines += ["## Contenu", ""]
    for p in files[:MAX_LISTED]:
        lines.append(f"- [{p.relative_to(pack).as_posix()}]({link(p)}) · {human(p.stat().st_size)}")
    if len(files) > MAX_LISTED:
        lines.append(f"- … et {len(files) - MAX_LISTED} autres fichiers")
    note.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return {"title": note.stem, "files": len(files), "size": total, "license": bool(licenses)}


def main() -> None:
    PACKS.mkdir(parents=True, exist_ok=True)
    for cat, (label, desc) in CATEGORIES.items():
        folder = ASSETS / cat
        folder.mkdir(parents=True, exist_ok=True)
        packs = sorted(p for p in folder.iterdir() if p.is_dir() and not p.name.startswith("."))
        rows = [catalog_pack(cat, p) for p in packs]
        index = [
            "---", f"tags: [index, {cat}]", "---", f"# {label}", "", desc, "",
            f"Dossier des fichiers : `_assets/{cat}/` · Retour : [[00 - Accueil]]", "",
        ]
        if rows:
            index += ["| Pack | Fichiers | Poids | Licence |", "|---|---|---|---|"]
            index += [f"| [[{r['title']}]] | {r['files']} | {human(r['size'])} | {'✅' if r['license'] else '⚠️'} |"
                      for r in rows]
        else:
            index.append(f"*Aucun pack pour l'instant. Dépose un dossier dans `_assets/{cat}/`, "
                         "puis relance `python tools/catalog_assets.py`.*")
        (BIBLIO / f"{label}.md").write_text("\n".join(index) + "\n", encoding="utf-8")
        print(f"{label:12} {len(rows)} pack(s)")


if __name__ == "__main__":
    main()
