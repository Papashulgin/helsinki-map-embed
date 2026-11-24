"""Generate illustrative Wellmade Ringlock ledger geometry in Blender.

All Blender coordinates are millimetres (scene unit scale 0.001).
Catalogue nominal connection lengths are parameterized; end heads are
visual approximations because the catalogue provides no dimensioned CAD.
"""
from pathlib import Path
import bpy
import math
from mathutils import Vector

OUT = Path(__file__).parent / "models"
OUT.mkdir(parents=True, exist_ok=True)
OD = 48.3
WALL = 3.0
RO = OD / 2
RI = RO - WALL
HEAD_LENGTH = 82.0
SEGMENTS = 64

def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)

def material(name, color, metallic=0.65, roughness=0.3):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1.0)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    return mat

STEEL = material("Hot dip galvanized steel - illustrative", (0.48, 0.56, 0.62))
HEAD = material("Ledger head - simplified", (0.38, 0.45, 0.50))
WEDGE = material("Wedge - simplified", (0.76, 0.53, 0.18), metallic=0.55)

def hollow_tube(name, x0, x1, ro=RO, ri=RI, mat=STEEL):
    verts, faces = [], []
    for x in (x0, x1):
        for radius in (ro, ri):
            for j in range(SEGMENTS):
                a = 2 * math.pi * j / SEGMENTS
                verts.append((x, radius * math.cos(a), radius * math.sin(a)))
    # ring indices: x0 outer, x0 inner, x1 outer, x1 inner
    for j in range(SEGMENTS):
        k = (j + 1) % SEGMENTS
        faces += [(j, k, 2*SEGMENTS+k, 2*SEGMENTS+j)]
        faces += [(SEGMENTS+j, 3*SEGMENTS+j, 3*SEGMENTS+k, SEGMENTS+k)]
        faces += [(j, SEGMENTS+j, SEGMENTS+k, k)]
        faces += [(2*SEGMENTS+j, 2*SEGMENTS+k, 3*SEGMENTS+k, 3*SEGMENTS+j)]
    mesh = bpy.data.meshes.new(name + " mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.materials.append(mat)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj

def cylinder_x(name, x0, x1, radius, mat):
    x0, x1 = min(x0, x1), max(x0, x1)
    mid = (x0+x1)/2
    bpy.ops.mesh.primitive_cylinder_add(vertices=SEGMENTS, radius=radius,
        depth=x1-x0, location=(mid, 0, 0), rotation=(0, math.pi/2, 0))
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    return obj

def cube(name, loc, scale, mat):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    return obj

def wedge_mesh(name, cx, cy, cz, direction, mat):
    # A tapered, non-functional representation of the ledger wedge.
    # direction=-1/+1 puts the head outside the two connection datums.
    x0, x1 = cx - 7, cx + 7
    y0, y1 = cy - 12, cy + 12
    z0, z1 = cz - 31, cz + 31
    verts = [(x0,y0,z0),(x0,y1,z0),(x0,y1,z1),(x0,y0,z1),
             (x1,y0,z0+direction*10),(x1,y1,z0+direction*10),
             (x1,y1,z1),(x1,y0,z1)]
    faces = [(0,1,2,3),(4,7,6,5),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)]
    mesh=bpy.data.meshes.new(name+" mesh"); mesh.from_pydata(verts,[],faces); mesh.materials.append(mat)
    obj=bpy.data.objects.new(name,mesh); bpy.context.collection.objects.link(obj)
    return obj

def ledger(length_mm, code, y_offset=0):
    coll=bpy.data.collections.new(f"{code} - {length_mm/1000:.2f} m connection length")
    bpy.context.scene.collection.children.link(coll)
    before=set(bpy.context.scene.objects)
    x0=0.0; x1=float(length_mm)
    # Hollow tube barrel, terminating inside the simplified heads.
    hollow_tube(f"{code} hollow ledger tube OD48.3 wall3", HEAD_LENGTH, x1-HEAD_LENGTH)
    for side, x in (("A",x0),("B",x1)):
        sgn=1 if side=="A" else -1
        # Weld-on sleeve/collar is represented as a solid boss; exact shape is unavailable.
        cylinder_x(f"{code} head {side} collar", x+sgn*16, x+sgn*HEAD_LENGTH, 31.0, HEAD)
        # Head plate and vertical tapered wedge: illustrative, not a production fitting.
        cube(f"{code} head {side} plate", (x+sgn*13,0,0), (12,62,104), HEAD)
        cube(f"{code} head {side} lug", (x+sgn*4,0,0), (10,38,72), HEAD)
        wedge_mesh(f"{code} head {side} wedge", x+sgn*4,0,42,sgn,WEDGE)
    # Place catalog variants apart in the editable assembly.
    for obj in set(bpy.context.scene.objects)-before:
        obj.location.y += y_offset
        for c in list(obj.users_collection): c.objects.unlink(obj)
        coll.objects.link(obj)
    return coll

def export_variant(length_mm, code, filepath):
    coll=ledger(length_mm, code)
    bpy.ops.object.select_all(action="DESELECT")
    for obj in coll.objects: obj.select_set(True)
    bpy.context.view_layer.objects.active=next(iter(coll.objects))
    bpy.ops.preferences.addon_enable(module="io_mesh_stl")
    bpy.ops.export_mesh.stl(filepath=str(filepath), use_selection=True,
        global_scale=1.0, use_scene_unit=False, ascii=False)
    # Remove exported collection before building next file.
    for obj in list(coll.objects): bpy.data.objects.remove(obj, do_unlink=True)
    bpy.data.collections.remove(coll)

clear_scene()
scene=bpy.context.scene
scene.unit_settings.system="METRIC"
scene.unit_settings.scale_length=0.001  # one Blender unit represents 1 mm
scene.render.engine="BLENDER_EEVEE"
scene.render.resolution_x=1500; scene.render.resolution_y=800; scene.render.resolution_percentage=100
ledger(2440,"WRL244",0)
ledger(3050,"WRL305",-180)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(filepath=str(OUT/"Wellmade-ringlock-ledgers.glb"), export_format="GLB", use_selection=True)

# Render a review image and keep the camera/lights in the editable Blender scene.
camera_data=bpy.data.cameras.new("Ledger preview camera")
camera=bpy.data.objects.new("Ledger preview camera",camera_data)
scene.collection.objects.link(camera)
camera.location=(1250,-2050,1050)
target=Vector((1450,-90,0))
camera.rotation_euler=(target-Vector(camera.location)).to_track_quat("-Z","Y").to_euler()
camera_data.type="ORTHO"; camera_data.ortho_scale=3700; camera_data.clip_end=10000
scene.camera=camera
for name, location, energy, size in (
    ("Key light",(800,-1000,1400),1800,1100),
    ("Fill light",(2200,650,700),1100,1300),
):
    data=bpy.data.lights.new(name,type="AREA"); data.energy=energy; data.shape="DISK"; data.size=size
    obj=bpy.data.objects.new(name,data); scene.collection.objects.link(obj); obj.location=location
    obj.rotation_euler=(Vector((1450,-90,0))-Vector(location)).to_track_quat("-Z","Y").to_euler()
scene.world.use_nodes=True
scene.world.node_tree.nodes.get("Background").inputs["Color"].default_value=(0.82,0.86,0.9,1.0)
scene.world.node_tree.nodes.get("Background").inputs["Strength"].default_value=0.8
scene.render.image_settings.file_format="PNG"
scene.render.filepath=str(OUT/"Wellmade-ringlock-ledgers-preview.png")
bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/"Wellmade-ringlock-ledgers.blend"))

export_variant(2440,"WRL244",OUT/"Wellmade-WRL244-ledger.stl")
export_variant(3050,"WRL305",OUT/"Wellmade-WRL305-ledger.stl")
