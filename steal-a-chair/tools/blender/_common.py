"""Outils communs aux scripts Blender de Steal a Chair (style low-poly cartoon).

Lancer un script (Blender gratuit : https://www.blender.org) :
    blender --background --python tools/blender/statue_flame.py
Chaque script exporte un .fbx dans assets/3d/ et un rendu PNG dans docs/renders/.
Budget : moins de 10 000 triangles par mesh.
"""
import math
import os
import sys

import bpy

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT_3D = os.path.join(ROOT, "assets", "3d")
OUT_RENDER = os.path.join(ROOT, "docs", "renders")
os.makedirs(OUT_3D, exist_ok=True)
os.makedirs(OUT_RENDER, exist_ok=True)


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def mat(name, rgb, emission=0.0, rough=0.6, metal=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if emission > 0:
        for key in ("Emission Color", "Emission"):
            if key in b.inputs:
                b.inputs[key].default_value = (*rgb, 1)
                break
        if "Emission Strength" in b.inputs:
            b.inputs["Emission Strength"].default_value = emission
    return m


def box(name, size, loc, material, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    o.scale = size
    o.data.materials.append(material)
    return o


def cyl(name, radius, depth, loc, material, rot=(0, 0, 0), verts=12):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=radius, depth=depth, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    o.data.materials.append(material)
    return o


def cone(name, radius, depth, loc, material, rot=(0, 0, 0), verts=8):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=radius, radius2=0, depth=depth, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    o.data.materials.append(material)
    return o


def sphere(name, radius, loc, material, seg=12):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=max(6, seg // 2), radius=radius, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.data.materials.append(material)
    return o


def chair(prefix, body, loc=(0, 0, 0), seat_w=1.2, height=2.0):
    """Chaise de base (assise, dossier, 4 pieds). Unités : 1 unité Blender = 10 studs environ."""
    x, y, z = loc
    parts = [box(prefix + "_Seat", (seat_w, seat_w, 0.2), (x, y, z + 0.9), body)]
    parts.append(box(prefix + "_Back", (seat_w, 0.2, height), (x, y - seat_w / 2 + 0.1, z + 0.9 + height / 2), body))
    for sx in (-1, 1):
        for sy in (-1, 1):
            parts.append(box(prefix + "_Leg", (0.2, 0.2, 0.9), (x + sx * (seat_w / 2 - 0.1), y + sy * (seat_w / 2 - 0.1), z + 0.45), body))
    return parts


def triangles(objs):
    total = 0
    for o in objs:
        if o.type == "MESH":
            total += sum(len(p.vertices) - 2 for p in o.data.polygons)
    return total


def finish(name, objs):
    """Fusionne, vérifie le budget de triangles, exporte le FBX et fait un rendu PNG."""
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    obj = bpy.context.active_object
    obj.name = name
    t = triangles([obj])
    print(f"[{name}] {t} triangles")
    if t >= 10000:
        sys.exit(f"{name} dépasse 10 000 triangles ({t})")
    bpy.ops.object.shade_flat()
    fbx = os.path.join(OUT_3D, name + ".fbx")
    bpy.ops.export_scene.fbx(filepath=fbx, use_selection=True, global_scale=1.0, apply_unit_scale=True,
                             bake_space_transform=True, object_types={"MESH"}, path_mode="COPY")
    # rendu de prévisualisation
    scn = bpy.context.scene
    try:
        scn.render.engine = "BLENDER_EEVEE_NEXT"
    except TypeError:
        scn.render.engine = "BLENDER_EEVEE"
    scn.render.resolution_x, scn.render.resolution_y = 800, 800
    scn.render.filepath = os.path.join(OUT_RENDER, name + ".png")
    world = bpy.data.worlds.new("W")
    world.color = (0.02, 0.01, 0.05)
    scn.world = world
    bpy.ops.object.light_add(type="SUN", location=(4, -6, 8))
    bpy.context.active_object.data.energy = 3
    bpy.ops.object.camera_add(location=(6, -7, 5))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(65), 0, math.radians(40))
    scn.camera = cam
    bpy.ops.render.render(write_still=True)
    print("OK :", fbx)
