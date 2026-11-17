#!/usr/bin/env python3
"""Génère docs/MAP_PLAN.svg + docs/MAP_PLAN.png : plan de la map vu du dessus, avec les cotes (studs).
Usage : python tools/make_map_plan.py   (nécessite : pip install cairosvg)"""
from pathlib import Path

DOCS = Path(__file__).resolve().parent.parent / "docs"
DOCS.mkdir(exist_ok=True)
K = 1.7                      # pixels par stud
W, L = 260, 560
MX, MY = 150, 140            # marges
SW, SH = int(W * K) + 2 * MX, int(L * K) + 2 * MY + 60
cx = lambda x: MX + (x + W / 2) * K
cz = lambda z: MY + (z + L / 2) * K   # Z négatif en haut

o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{SW}" height="{SH}" font-family="Arial, sans-serif">',
     f'<rect width="{SW}" height="{SH}" fill="#0b0716"/>',
     f'<text x="{SW/2}" y="44" fill="#d9b8ff" font-size="28" font-weight="bold" text-anchor="middle">STEAL A CHAIR : plan de la map (vue du dessus)</text>',
     f'<text x="{SW/2}" y="70" fill="#8a7aa8" font-size="14" text-anchor="middle">Cotes en studs · axe Z vertical · tapis du haut (Start) vers le bas (End)</text>']

def rect(x, z, w, l, fill, stroke="none", op=1, label=None, fs=12, tc="#fff", rx=3):
    o.append(f'<rect x="{cx(x - w/2):.1f}" y="{cz(z - l/2):.1f}" width="{w*K:.1f}" height="{l*K:.1f}" rx="{rx}" fill="{fill}" fill-opacity="{op}" stroke="{stroke}" stroke-width="1.5"/>')
    if label:
        o.append(f'<text x="{cx(x):.1f}" y="{cz(z)+fs/3:.1f}" fill="{tc}" font-size="{fs}" text-anchor="middle">{label}</text>')

def dim(x1, z1, x2, z2, text, off=0, vertical=False):
    a, b, c, d = cx(x1), cz(z1), cx(x2), cz(z2)
    o.append(f'<line x1="{a:.1f}" y1="{b:.1f}" x2="{c:.1f}" y2="{d:.1f}" stroke="#ffd166" stroke-width="1.2" marker-start="url(#t)" marker-end="url(#t)"/>')
    if vertical:
        o.append(f'<text x="{a+off:.1f}" y="{(b+d)/2:.1f}" fill="#ffd166" font-size="12" text-anchor="middle" transform="rotate(-90 {a+off:.1f} {(b+d)/2:.1f})">{text}</text>')
    else:
        o.append(f'<text x="{(a+c)/2:.1f}" y="{b+off:.1f}" fill="#ffd166" font-size="12" text-anchor="middle">{text}</text>')

o.append('<defs><marker id="t" markerWidth="6" markerHeight="6" refX="3" refY="3"><circle cx="3" cy="3" r="2" fill="#ffd166"/></marker></defs>')
rect(0, 0, W, L, "#261c1e", "#6a32be", label=None)                       # sol
rect(0, 0, 68, 540, "#1b1b26", "#9b4dff")                               # tapis
for lane in (-24, 0, 24):
    rect(lane, 0, 20, 540, "#232334", "#9b4dff", 0.9)
    o.append(f'<text x="{cx(lane):.1f}" y="{cz(0)}" fill="#bda0ff" font-size="11" text-anchor="middle" transform="rotate(-90 {cx(lane):.1f} {cz(0)})">VOIE X={lane}</text>')
o.append(f'<text x="{cx(0)}" y="{cz(-262)}" fill="#9b4dff" font-size="12" text-anchor="middle">START ▼</text>')
o.append(f'<text x="{cx(0)}" y="{cz(272)}" fill="#9b4dff" font-size="12" text-anchor="middle">▼ END</text>')
n = 1
for side in (-1, 1):
    for i in range(5):
        z = (i - 2) * 107
        rect(side * 93, z, 44, 44, "#5a3b1c", "#ffb347", label=f"Plot{n}", fs=13)
        rect(side * (93 - side * 0) - side * 0, z, 0, 0, "none")           # (repère)
        rect(side * 71, z, 4, 20, "#a43cff", "#a43cff", 0.8)             # rampe/entrée
        n += 1
# boutiques et roues
for name, z, col in (("ROBUX", -70, "#e0b030"), ("AURA", -37, "#9b4dff")):
    rect(-50, z, 16, 18, col, "#fff", 0.85, name, 9, "#000")
rect(-50, 35, 4, 18, "#b070ff", "#fff", 0.9, "", 10)
o.append(f'<text x="{cx(-50)-34:.1f}" y="{cz(35)+4}" fill="#e6d4ff" font-size="11" text-anchor="end">Roue jour</text>')
rect(-50, 72, 4, 28, "#ffc233", "#fff", 0.9, "", 10)
o.append(f'<text x="{cx(-50)-34:.1f}" y="{cz(72)+4}" fill="#ffe08a" font-size="11" text-anchor="end">Roue semaine</text>')
rect(52, 0, 12, 12, "#00e5ff", "#fff", 0.85, "SPAWN", 11, "#000")
# murs
rect(-131, 0, 6, 566, "#3a3550", "#000", 1)
rect(131, 0, 6, 566, "#3a3550", "#000", 1)
rect(0, -283, 268, 6, "#3a3550", "#000", 1)
rect(0, 283, 268, 6, "#3a3550", "#000", 1)
for i in range(11):                                                     # statues
    z = (i - 5) * 53.5
    for s, col in ((-1, ("#ff7a1a", "#3fae5a", "#2ee6ff")[i % 3]),):
        rect(-124, z, 7, 7, col, "none", 1, rx=2)
    rect(124, z, 7, 7, ("#ff7a1a", "#3fae5a", "#2ee6ff")[(i + 0) % 3], "none", 1, rx=2)
# cotes
dim(-130, -300, 130, -300, "260 (largeur du sol)", off=-6)
dim(-163, -280, -163, 280, "560 (longueur)", off=-6, vertical=True)
dim(-34, 292, 34, 292, "68 (3 voies de 20, espacées de 24)", off=18)
dim(-93, 245, 93, 245, "186 = 2 x 93 (centre des bases)", off=-6)
dim(171, -214, 171, -107, "107", off=14, vertical=True)
dim(-115, 148, -71, 148, "44", off=-5)
o.append(f'<text x="{MX}" y="{SH-38}" fill="#8a7aa8" font-size="12">Plots 1-5 à gauche (X=-93), 6-10 à droite (X=+93), 107 studs entre chaque, entrées vers le tapis.</text>')
o.append(f'<text x="{MX}" y="{SH-20}" fill="#8a7aa8" font-size="12">Statues dans les murs : orange = feu, vert = dragon, cyan = espace.</text>')
o.append('</svg>')
svg = DOCS / "MAP_PLAN.svg"
svg.write_text("\n".join(o), encoding="utf-8")
import cairosvg
cairosvg.svg2png(url=str(svg), write_to=str(DOCS / "MAP_PLAN.png"), scale=1.0)
print("OK", DOCS / "MAP_PLAN.png")
