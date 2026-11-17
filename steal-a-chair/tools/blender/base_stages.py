"""Les 5 stades de la base-chaise (tabouret -> trône à 2 étages). 1 unité Blender ~ 10 studs. Entrée vers +Y."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from _common import *

STAGES = [
    ("Tabouret", (0.55, 0.35, 0.17), 0.8, False, False),
    ("Chaise", (0.47, 0.12, 0.24), 1.4, False, False),
    ("Fauteuil", (0.35, 0.16, 0.63), 2.0, True, False),
    ("Royal", (0.6, 0.24, 1.0), 2.6, True, True),
    ("Trone", (0.92, 0.72, 0.2), 3.4, True, True),
]
for k, (label, rgb, back_h, arms, crown) in enumerate(STAGES, 1):
    reset()
    body = mat("Corps", rgb, rough=0.5)
    gold = mat("Or", (0.92, 0.72, 0.2), rough=0.3, metal=0.8)
    glow = mat("Gemme", (0.6, 0.25, 1.0), emission=5)
    S = 4.4  # 44 studs
    parts = [box("Seat", (S, S, 0.15), (0, 0, 0.5), body)]
    parts.append(box("Back", (S, 0.3, back_h), (0, -S / 2 + 0.15, 0.5 + back_h / 2), body))
    for sx in (-1, 1):
        for sy in (-1, 1):
            parts.append(box("Leg", (0.5, 0.5, 0.42), (sx * (S / 2 - 0.3), sy * (S / 2 - 0.3), 0.21), body))
    if arms:
        for sx in (-1, 1):
            parts.append(box("Arm", (0.3, 3.0, 0.6), (sx * (S / 2 - 0.15), -0.4, 0.8), body))
    if crown:
        for i in range(-4, 5):
            parts.append(cone("Spike", 0.15, 0.5, (i * 0.5, -S / 2 + 0.15, 0.5 + back_h + 0.25), gold))
    if k == 5:
        for sx in (-1, 1):
            parts.append(box("Wing", (0.2, 1.6, 2.2), (sx * (S / 2 + 0.2), -S / 2 + 0.6, 0.5 + back_h - 0.6), gold))
        for i in range(-2, 3):
            parts.append(sphere("Gem", 0.15, (i * 0.8, -S / 2 + 0.3, 0.5 + back_h - 0.5), glow))
        parts.append(box("Floor2", (S, 1.7, 0.15), (0, -S / 2 + 0.85 + 0.0, 2.3), body))
    finish(f"base_stage{k}_{label.lower()}", parts)
