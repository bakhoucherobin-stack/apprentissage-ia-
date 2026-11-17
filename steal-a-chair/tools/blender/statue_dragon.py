"""Chaise-statue DRAGONIQUE : écailles, cornes, ailes, yeux lumineux."""
import os, sys, math
sys.path.insert(0, os.path.dirname(__file__))
from _common import *

reset()
scales = mat("Ecailles", (0.15, 0.45, 0.22), rough=0.5)
bone = mat("Os", (0.9, 0.86, 0.72))
eye = mat("Oeil", (1.0, 0.9, 0.1), emission=8)
parts = chair("Dragon", scales)
for sx in (-1, 1):
    parts.append(cone("Horn", 0.1, 0.8, (sx * 0.4, -0.45, 3.3), bone, rot=(0, math.radians(sx * 15), 0)))
    parts.append(box("Wing", (0.05, 1.2, 1.4), (sx * 0.9, -0.55, 2.4), scales, rot=(0, math.radians(sx * 25), 0)))
    parts.append(sphere("Eye", 0.07, (sx * 0.25, -0.35, 2.7), eye))
    parts.append(cone("Claw", 0.07, 0.3, (sx * 0.5, 0.55, 0.15), bone, rot=(math.radians(90), 0, 0)))
for i in range(-3, 4):
    parts.append(cone("Spike", 0.08, 0.3, (i * 0.15, -0.45, 3.1), scales))
finish("statue_dragon", parts)
