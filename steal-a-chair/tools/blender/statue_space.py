"""Chaise-statue de l'ESPACE : métal, bandes néon cyan, planète et lune en orbite."""
import os, sys, math
sys.path.insert(0, os.path.dirname(__file__))
from _common import *

reset()
steel = mat("Acier", (0.25, 0.3, 0.4), rough=0.3, metal=0.9)
cyan = mat("NeonCyan", (0.1, 0.9, 1.0), emission=6)
planet = mat("Planete", (0.9, 0.45, 0.2))
moon = mat("Lune", (0.8, 0.82, 0.9))
parts = chair("Space", steel)
for sx in (-1, 1):
    parts.append(box("Strip", (0.05, 0.05, 1.8), (sx * 0.5, -0.42, 1.95), cyan))
parts.append(box("Band", (1.2, 0.05, 0.05), (0, -0.42, 2.4), cyan))
parts.append(sphere("Planet", 0.28, (-0.9, 0, 3.3), planet))
parts.append(cyl("Ring", 0.5, 0.02, (-0.9, 0, 3.3), cyan, rot=(math.radians(70), 0, 0), verts=24))
parts.append(sphere("Moon", 0.15, (0.9, 0.1, 3.6), moon))
finish("statue_space", parts)
