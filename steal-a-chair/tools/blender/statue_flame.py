"""Chaise-statue ENFLAMMÉE : chaise de basalte avec langues de feu sculptées sur le dossier."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from _common import *

reset()
body = mat("Basalte", (0.12, 0.06, 0.05), rough=0.8)
fire = mat("Feu", (1.0, 0.35, 0.05), emission=6)
parts = chair("Flame", body)
for i, h in enumerate((0.9, 1.4, 1.9, 1.4, 0.9)):
    parts.append(cone(f"Tongue{i}", 0.16, h, ((i - 2) * 0.24, -0.45, 3.0 + h / 2), fire))
parts.append(cyl("EmberBowl", 0.5, 0.12, (0, 0.1, 1.05), fire))
finish("statue_flame", parts)
