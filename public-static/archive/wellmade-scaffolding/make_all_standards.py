"""Generate every Ringlock upright length listed in the Wellmade catalogue.

Rings repeat on 500 mm centres, half a pitch from both ends. Spigot geometry
is omitted because the supplied drawing set does not give fit dimensions.
Run with: blender -b --python make_all_standards.py
"""
from pathlib import Path
import sys
import bpy
ROOT = Path(__file__).parent
sys.path.insert(0, str(ROOT))
import make_scaffold_parts as parts

OUT = ROOT / "models"
OUT.mkdir(parents=True, exist_ok=True)
STANDARD_LENGTHS_MM = [500, 1000, 1500, 2000, 2500, 3000, 4000]


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

    standards = []
    for i, length in enumerate(STANDARD_LENGTHS_MM):
        coll, root = parts.make_standard(length, f"{length} mm")
        root.location = (i * 650.0, 0, 0)
        standards.append((length, coll, root))
        parts.export_stl(coll, root, OUT / f"Wellmade-Ringlock-Standard-L{length:04d}mm.stl")

    camera_data = bpy.data.cameras.new("All standard variants camera")
    camera = bpy.data.objects.new("All standard variants camera", camera_data)
    scene.collection.objects.link(camera)
    scene.camera = camera
    for name, loc, power, size in (
        ("Key light", (1800, -3200, 4600), 5000, 1800),
        ("Fill light", (4300, 500, 2600), 3200, 2200),
    ):
        data = bpy.data.lights.new(name, "AREA")
        data.energy = power
        data.size = size
        obj = bpy.data.objects.new(name, data)
        scene.collection.objects.link(obj)
        obj.location = loc
    scene.render.resolution_x = 1800
    scene.render.resolution_y = 1500
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    parts.set_camera(scene, camera, (1950, 0, 2000), (1950, -7800, 3400), 5700)
    scene.render.filepath = str(OUT / "Wellmade-all-standard-lengths-preview.png")
    bpy.ops.render.render(write_still=True)

    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(
        filepath=str(OUT / "Wellmade-Ringlock-All-Standards.glb"),
        export_format="GLB", use_selection=True,
    )
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT / "Wellmade-Ringlock-All-Standards.blend"))


if __name__ == "__main__":
    main()
