#!/usr/bin/env python3
"""Va chercher les packs d'assets dans le dossier Téléchargements et les range dans _assets/.

- Regarde les archives (.zip, et .rar/.7z si 7-Zip est installé) et les dossiers du dossier Téléchargements.
- Devine la catégorie (vfx, sfx, musiques, icones, modeles3d) d'après les types de fichiers et les noms.
- COPIE le pack dans `_assets/<categorie>/<nom du pack>/` : les originaux ne sont jamais supprimés.
- Note ce qui a été importé dans `_assets/.imports.json` pour ne pas l'importer deux fois.
- Si la catégorie est incertaine, le pack va dans `_assets/_a_trier/`.
- Relance ensuite tools/catalog_assets.py pour créer les fiches Obsidian.

Usage (depuis le dossier steal-a-chair) :
    python tools/import_downloads.py              # montre seulement ce qui SERAIT fait
    python tools/import_downloads.py --apply      # fait vraiment l'import
Options :
    --dossier CHEMIN   autre dossier que Téléchargements
    --jours N          ne regarde que ce qui a été téléchargé ces N derniers jours (défaut : 30)
    --force-categorie vfx|sfx|musiques|icones|modeles3d   impose la catégorie
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import tempfile
import time
import zipfile
from collections import Counter
from pathlib import Path

VAULT = Path(__file__).resolve().parent.parent
ASSETS = VAULT / "_assets"
LOG = ASSETS / ".imports.json"
CATS = ["vfx", "sfx", "musiques", "icones", "modeles3d"]

AUDIO = {".mp3", ".ogg", ".wav", ".flac", ".m4a"}
IMAGE = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".tga", ".bmp", ".psd"}
MODEL = {".fbx", ".obj", ".glb", ".gltf", ".blend", ".rbxm", ".rbxmx", ".dae", ".stl"}
ARCHIVES = {".zip", ".rar", ".7z"}
KEYWORDS = {
    "vfx": ["vfx", "particle", "particule", "flipbook", "spritesheet", "sprite sheet", "smoke", "fire", "flame",
            "explosion", "slash", "magic", "aura", "effect", "effet", "trail", "beam", "glow", "lightning"],
    "sfx": ["sfx", "sound effect", "bruitage", "foley", "hit", "whoosh", "click", "impact", "ui sound"],
    "musiques": ["music", "musique", "ost", "soundtrack", "ambient", "ambiance", "loop", "theme", "bgm"],
    "icones": ["icon", "icone", "icône", "ui", "gui", "button", "bouton", "badge", "hud"],
    "modeles3d": ["model", "modele", "modèle", "3d", "mesh", "low poly", "lowpoly", "prop", "asset pack"],
}


def downloads_dir() -> Path:
    home = Path.home()
    for name in ("Downloads", "Téléchargements", "Telechargements"):
        if (home / name).is_dir():
            return home / name
    return home / "Downloads"


def list_names(item: Path) -> list[str] | None:
    """Liste les fichiers d'un pack sans l'extraire. None = illisible."""
    if item.is_dir():
        return [p.relative_to(item).as_posix() for p in item.rglob("*") if p.is_file()]
    if item.suffix.lower() == ".zip":
        try:
            with zipfile.ZipFile(item) as z:
                return [n for n in z.namelist() if not n.endswith("/")]
        except zipfile.BadZipFile:
            return None
    seven = shutil.which("7z") or shutil.which("7za")
    if seven:
        out = subprocess.run([seven, "l", "-slt", "-ba", str(item)], capture_output=True, text=True)
        if out.returncode == 0:
            return [l[7:] for l in out.stdout.splitlines() if l.startswith("Path = ")]
    return None


def guess(name: str, files: list[str]) -> tuple[str | None, str]:
    exts = Counter(Path(f).suffix.lower() for f in files)
    n_audio = sum(v for k, v in exts.items() if k in AUDIO)
    n_img = sum(v for k, v in exts.items() if k in IMAGE)
    n_model = sum(v for k, v in exts.items() if k in MODEL)
    if n_audio + n_img + n_model == 0:
        return None, "aucun son, image ou modèle 3D : ce n'est pas un pack d'assets"
    text = (name + " " + " ".join(files[:200])).lower()
    kw = {c: sum(text.count(k) for k in words) for c, words in KEYWORDS.items()}
    score = Counter()
    if n_model:
        score["modeles3d"] += 3 * n_model
    if n_audio:
        music_bias = kw["musiques"] > kw["sfx"]
        score["musiques" if music_bias else "sfx"] += 2 * n_audio
    if n_img:
        score["icones" if kw["icones"] > kw["vfx"] else "vfx"] += n_img
    for c, v in kw.items():
        score[c] += v
    (best, s1), *rest = score.most_common(2) + [(None, 0)]
    s2 = rest[0][1]
    detail = f"{n_audio} son(s), {n_img} image(s), {n_model} modèle(s)"
    if s1 < 2 or (s2 and s1 < 1.5 * s2):
        return "_a_trier", detail + " · catégorie incertaine"
    return best, detail


def safe_extract(zf: zipfile.ZipFile, dest: Path) -> None:
    root = dest.resolve()
    for m in zf.infolist():
        target = (dest / m.filename).resolve()
        if root != target and root not in target.parents:
            raise ValueError(f"chemin dangereux dans l'archive : {m.filename}")
    zf.extractall(dest)


def flatten(folder: Path) -> None:
    """Si l'archive contient un seul dossier racine, on remonte son contenu d'un niveau."""
    kids = [k for k in folder.iterdir() if not k.name.startswith(("__MACOSX", "."))]
    if len(kids) == 1 and kids[0].is_dir():
        inner = kids[0]
        for k in list(inner.iterdir()):
            shutil.move(str(k), folder / k.name)
        inner.rmdir()


def import_item(item: Path, cat: str) -> Path:
    dest = ASSETS / cat / item.stem if item.is_file() else ASSETS / cat / item.name
    base, i = dest, 2
    while dest.exists():
        dest = base.with_name(f"{base.name} ({i})")
        i += 1
    if item.is_dir():
        shutil.copytree(item, dest)
    elif item.suffix.lower() == ".zip":
        dest.mkdir(parents=True)
        with zipfile.ZipFile(item) as z:
            safe_extract(z, dest)
    else:
        seven = shutil.which("7z") or shutil.which("7za")
        dest.mkdir(parents=True)
        with tempfile.TemporaryDirectory() as tmp:
            subprocess.run([seven, "x", "-y", f"-o{tmp}", str(item)], check=True, capture_output=True)
            for k in Path(tmp).iterdir():
                shutil.move(str(k), dest / k.name)
    shutil.rmtree(dest / "__MACOSX", ignore_errors=True)
    flatten(dest)
    return dest


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--dossier", type=Path, default=None)
    ap.add_argument("--jours", type=float, default=30)
    ap.add_argument("--force-categorie", choices=CATS)
    args = ap.parse_args()

    src = args.dossier or downloads_dir()
    if not src.is_dir():
        sys.exit(f"Dossier introuvable : {src}")
    done = json.loads(LOG.read_text(encoding="utf-8")) if LOG.exists() else {}
    limit = time.time() - args.jours * 86400

    candidates = [p for p in sorted(src.iterdir())
                  if not p.name.startswith(".")
                  and (p.is_dir() or p.suffix.lower() in ARCHIVES)
                  and p.stat().st_mtime >= limit]
    print(f"Dossier analysé : {src}  ({len(candidates)} archive(s)/dossier(s) récents)\n")
    plan = []
    for p in candidates:
        key = f"{p.name}|{p.stat().st_size if p.is_file() else ''}|{int(p.stat().st_mtime)}"
        if key in done:
            print(f"  = déjà importé : {p.name} → {done[key]}")
            continue
        files = list_names(p)
        if files is None:
            print(f"  ? illisible : {p.name} (archive .rar/.7z : installe 7-Zip, ou décompresse-la à la main)")
            continue
        cat, detail = guess(p.name, files)
        if cat is None:
            print(f"  - ignoré : {p.name} ({detail})")
            continue
        cat = args.force_categorie or cat
        print(f"  → {p.name}  ⇒  _assets/{cat}/   [{detail}]")
        plan.append((p, cat, key))

    if not plan:
        print("\nRien de nouveau à importer.")
        return
    if not args.apply:
        print("\nAperçu seulement. Relance avec --apply pour importer.")
        return
    for p, cat, key in plan:
        dest = import_item(p, cat)
        done[key] = dest.relative_to(VAULT).as_posix()
        print(f"  ✓ {p.name} importé dans {done[key]}")
    LOG.write_text(json.dumps(done, ensure_ascii=False, indent=2), encoding="utf-8")
    print("\nMise à jour des fiches Obsidian…")
    subprocess.run([sys.executable, str(VAULT / "tools" / "catalog_assets.py")], check=False)


if __name__ == "__main__":
    main()
