"""Generate every Ringlock ledger length listed in the archived Wellmade catalogue.

Catalogue lengths are treated as model datums, not proven connection datums for
all historical variants. The current 3070 mm variant uses the manufacturer's
published centre-to-centre definition. Run from Blender with:
  blender -b --python make_all_ledgers.py
"""
from pathlib import Path
import sys
import bpy
ROOT = Path(__file__).parent
sys.path.insert(0, str(ROOT))
import make_scaffold_parts as parts

OUT = Path(__file__).parent / "models"
OUT.mkdir(parents=True, exist_ok=True)
# The ten catalogue variants and the current 3.07 m centre-to-centre product.
LEDGER_LENGTHS_MM = [650, 880, 920, 1070, 1150, 1570, 1830, 2130, 2440, 3050, 3070]


def main():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 0.001
    scene.render.engine = "BLENDER_EEVEE"
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "Medium High Contrast"
    scene.world.use_nodes = True
    scene.world.node_tree.nodes.get("Background").inputs["Color"].default_value = (0.68, 0.73, 0.78, 1)
    scene.world.node_tree.nodes.get("Background").inputs["Strength"].default_value = 0.5

    ledgers = []
    for i, length in enumerate(LEDGER_LENGTHS_MM):
        coll, root = parts.make_ledger(length, f"{length} mm")
        root.location = (0, -i * 210.0, 0)
        ledgers.append((length, coll, root))
        parts.export_stl(coll, root, OUT / f"Wellmade-Ringlock-Ledger-L{length:04d}mm.stl")

    # Preview scene with a clear front/side view of all lengths in one lineup.
    camera_data = bpy.data.cameras.new("All ledger variants camera")
    camera = bpy.data.objects.new("All ledger variants camera", camera_data)
    scene.collection.objects.link(camera)
    scene.camera = camera
    for name, loc, power, size in (
        ("Key light", (1500, -1800, 2500), 4500, 1500),
        ("Fill light", (2600, 900, 1200), 3000, 1800),
    ):
        data = bpy.data.lights.new(name, "AREA")
        data.energy = power
        data.size = size
        obj = bpy.data.objects.new(name, data)
        scene.collection.objects.link(obj)
        obj.location = loc
    scene.render.resolution_x = 2000
    scene.render.resolution_y = 1500
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    parts.set_camera(scene, camera, (1535, -1050, 120), (1535, -5200, 1900), 4300)
    scene.render.filepath = str(OUT / "Wellmade-all-ledger-lengths-preview.png")
    bpy.ops.render.render(write_still=True)

    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(
        filepath=str(OUT / "Wellmade-Ringlock-All-Ledgers.glb"),
        export_format="GLB", use_selection=True,
    )
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT / "Wellmade-Ringlock-All-Ledgers.blend"))


if __name__ == "__main__":
    main()
