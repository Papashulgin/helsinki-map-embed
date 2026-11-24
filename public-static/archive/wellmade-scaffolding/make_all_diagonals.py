"""Generate all ten Wellmade Ringlock diagonal bay variants.

Brace tube centreline follows catalogue bay width and 2,000 mm rise. The
catalogue's listed brace lengths do not equal these chord lengths; all such
values are preserved in metadata and the model index. End fittings are simple
visual placeholders because no dimensioned brace-head drawing is supplied.
Run with: blender -b --python make_all_diagonals.py
"""
from pathlib import Path
import sys, math
import bpy
ROOT=Path(__file__).parent
sys.path.insert(0,str(ROOT))
import make_scaffold_parts as parts
OUT=ROOT/'models'; OUT.mkdir(parents=True,exist_ok=True)
RISE_MM=2000.0
# Item code, bay width, catalogue cut/brace length, catalogue mass.
VARIANTS=[
 ('WRB065',650,2070,7.34),('WRB088',880,2150,7.99),('WRB092',920,2170,8.31),
 ('WRB107',1070,2230,8.40),('WRB115',1150,2260,8.53),('WRB157',1570,2480,9.23),
 ('WRB183',1830,2640,9.72),('WRB213',2130,2850,10.31),('WRB244',2440,3070,11.02),
 ('WRB305',3050,3560,12.15)
]

def make_diagonal(code,bay,listed_length,y_offset):
    chord=math.hypot(bay,RISE_MM)
    angle=-math.atan2(RISE_MM,bay)
    c,root=parts.new_collection(f'{code} Ringlock diagonal bay {bay} x {int(RISE_MM)}')
    before=set(bpy.context.scene.objects)
    tube=parts.hollow_tube_x(f'{code} tube Ø48.3 x 2.5, geometric chord {chord:.1f}',0,chord,48.3/2,2.5,parts.GALV)
    tube.rotation_euler[1]=angle
    # Connector blocks mark the end-joint positions only; they are not a
    # dimensionally reconstructed brace head.
    a=parts.box(f'{code} end fitting A - indicative',(0,0,0),(70,70,54),parts.CAST,2)
    b=parts.box(f'{code} end fitting B - indicative',(bay,0,RISE_MM),(70,70,54),parts.CAST,2)
    a.rotation_euler[1]=angle; b.rotation_euler[1]=angle
    # Small wedge-like tabs visually indicate the two connection directions.
    wa=parts.box(f'{code} wedge tab A - indicative',(24,0,0),(42,12,8),parts.WEDGEMAT,1)
    wb=parts.box(f'{code} wedge tab B - indicative',(bay-24,0,RISE_MM),(42,12,8),parts.WEDGEMAT,1)
    wa.rotation_euler[1]=angle; wb.rotation_euler[1]=angle
    parts.link_new_objects(before,c,root)
    root.location=(0,y_offset,0)
    return c,root,chord

def main():
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
    scene=bpy.context.scene; scene.unit_settings.system='METRIC'; scene.unit_settings.scale_length=.001
    scene.render.engine='BLENDER_EEVEE'; scene.view_settings.view_transform='Standard'; scene.view_settings.look='Medium High Contrast'
    scene.world.use_nodes=True; scene.world.node_tree.nodes.get('Background').inputs['Color'].default_value=(.68,.73,.78,1)
    scene.world.node_tree.nodes.get('Background').inputs['Strength'].default_value=.5
    assemblies=[]
    for i,(code,bay,listed,mass) in enumerate(VARIANTS):
        c,r,chord=make_diagonal(code,bay,listed,-i*180.0)
        assemblies.append((code,bay,listed,mass,chord,c,r))
        parts.export_stl(c,r,OUT/f'Wellmade-Ringlock-Diagonal-{code}-Bay{bay:04d}mm.stl')
    cam_data=bpy.data.cameras.new('All diagonal variants camera'); cam=bpy.data.objects.new('All diagonal variants camera',cam_data)
    scene.collection.objects.link(cam); scene.camera=cam
    for name,loc,power,size in [('Key light',(1500,-1800,3000),5200,1800),('Fill light',(3500,500,1600),3200,2200)]:
        d=bpy.data.lights.new(name,'AREA'); d.energy=power; d.size=size; ob=bpy.data.objects.new(name,d); scene.collection.objects.link(ob); ob.location=loc
    scene.render.resolution_x=2000; scene.render.resolution_y=1500; scene.render.resolution_percentage=100; scene.render.image_settings.file_format='PNG'
    parts.set_camera(scene,cam,(1500,-810,1000),(1500,-5500,2500),4500)
    scene.render.filepath=str(OUT/'Wellmade-all-diagonal-lengths-preview.png'); bpy.ops.render.render(write_still=True)
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=str(OUT/'Wellmade-Ringlock-All-Diagonals.glb'),export_format='GLB',use_selection=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Wellmade-Ringlock-All-Diagonals.blend'))

if __name__=='__main__': main()
