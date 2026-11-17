"""Stands de boutique : ROBUX (trône doré) et AURA (noir-violet avec braseros)."""
import os, sys, math
sys.path.insert(0, os.path.dirname(__file__))
from _common import *

def stand(name, accent, dark_rgb, throne):
    reset()
    dark = mat("Base", dark_rgb, rough=0.4, metal=0.6)
    acc = mat("Accent", accent, emission=4)
    parts = [box("Platform", (1.8, 1.6, 0.1), (0, 0, 0.05), dark)]
    parts.append(box("Counter", (1.4, 0.3, 0.4), (0, 0.4, 0.3), dark))
    parts.append(box("CounterTop", (1.45, 0.35, 0.06), (0, 0.4, 0.53), acc))
    parts.append(box("Roof", (1.9, 1.4, 0.15), (0, -0.2, 1.75), dark))
    for sx in (-1, 1):
        parts.append(box("Pillar", (0.2, 0.2, 1.6), (sx * 0.8, -0.5, 0.95), dark))
    parts.append(box("Sign", (1.6, 0.1, 0.4), (0, 0.55, 1.4), acc))
    if throne:
        parts.append(box("ThroneBack", (0.8, 0.15, 1.2), (0, -0.6, 0.75), acc))
        for i in range(-2, 3):
            parts.append(cone("Crown", 0.07, 0.3, (i * 0.18, -0.6, 1.5), acc))
    else:
        for sx in (-1, 1):
            parts.append(cyl("Brazier", 0.15, 0.3, (sx * 0.65, -0.2, 0.25), dark))
            parts.append(cone("Flame", 0.14, 0.5, (sx * 0.65, -0.2, 0.65), acc))
        parts.append(sphere("AuraOrb", 0.25, (0, -0.2, 0.95), acc))
    finish(name, parts)

stand("shop_robux", (0.92, 0.72, 0.2), (0.35, 0.23, 0.06), True)
stand("shop_aura", (0.6, 0.25, 1.0), (0.06, 0.02, 0.12), False)
