"""Roue journalière (petite, 8 parts) et roue hebdomadaire (grande, 12 parts, couronne dorée)."""
import os, sys, math
sys.path.insert(0, os.path.dirname(__file__))
from _common import *

for name, radius, n, ca, cb, rim in (("wheel_daily", 0.9, 8, (0.6, 0.25, 1.0), (0.2, 0.08, 0.45), (0.35, 0.8, 1.0)),
                                      ("wheel_weekly", 1.4, 12, (1.0, 0.75, 0.15), (0.7, 0.12, 0.47), (0.92, 0.72, 0.2))):
    reset()
    dark = mat("Metal", (0.08, 0.05, 0.14), rough=0.3, metal=0.8)
    a, b, r = mat("SegA", ca, emission=3), mat("SegB", cb, emission=3), mat("Rim", rim, emission=4)
    parts = [cyl("Disc", radius, 0.2, (0, 0, radius + 0.6), dark, rot=(math.radians(90), 0, 0), verts=n * 2)]
    parts.append(cyl("Rim", radius + 0.08, 0.14, (0, -0.1, radius + 0.6), r, rot=(math.radians(90), 0, 0), verts=n * 2))
    for i in range(n):
        ang = (i + 0.5) / n * 2 * math.pi
        parts.append(box(f"Seg{i}", (radius * 0.28, 0.08, radius * 0.8),
                         (math.sin(ang) * radius * 0.5, -0.17, radius + 0.6 + math.cos(ang) * radius * 0.5),
                         a if i % 2 else b, rot=(0, -ang, 0)))
    parts.append(cyl("Hub", 0.2, 0.3, (0, -0.2, radius + 0.6), r, rot=(math.radians(90), 0, 0)))
    for sx in (-1, 1):
        parts.append(box("Support", (0.15, 0.3, radius + 0.6), (sx * (radius + 0.2), 0, (radius + 0.6) / 2), dark))
    parts.append(cone("Pointer", 0.15, 0.4, (0, -0.25, radius * 2 + 0.9), mat("Pointeur", (1, 0.2, 0.2), emission=5), rot=(math.radians(180), 0, 0)))
    finish(name, parts)
