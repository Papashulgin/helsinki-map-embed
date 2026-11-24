"""Build illustrative stair units from the Wellmade catalogue entries.

Catalogued overall bay run/rise/widths are used where present. The source does
not state tread count, Cuplock flight width, tread plate dimensions or stringer
profiles. This model uses 12 equal steps and a provisional 600 mm Cuplock width;
all such choices are recorded in metadata and the stair index. Run with Blender:
  blender -b --python make_stairs.py
"""
from pathlib import Path
import sys, math
import bpy
ROOT=Path(__file__).parent
sys.path.insert(0,str(ROOT))
import make_scaffold_parts as parts
OUT=ROOT/'models'; OUT.mkdir(parents=True,exist_ok=True)
TREAD_COUNT=12
# code, family, horizontal run, vertical rise, width, catalogue mass, width is estimated?
VARIANTS=[
 ('WCSW1','Cuplock stairway',2140,2000,600,110.16,True),
 ('WCSW2','Cuplock stairway',2440,2000,600,120.96,True),
 ('WCSW3','Cuplock stairway',2500,2000,600,120.96,True),
 ('WSKSC600','Kwikstage staircase',2500,2000,600,53.0,False),
 ('WSKSC900','Kwikstage staircase',2500,2000,900,57.0,False),
]

def make_stair(code,family,run,rise,width,mass,width_estimated,offset_x):
    coll,root=parts.new_collection(f'{code} {family} {run}x{rise}x{width} mm')
    before=set(bpy.context.scene.objects)
    chord=math.hypot(run,rise); angle=-math.atan2(rise,run)
    stringer_y=width/2-35
    for side,y in [('left',-stringer_y),('right',stringer_y)]:
        beam=parts.box(f'{code} {side} inclined stringer - illustrative',
            (run/2,y,rise/2),(chord,70,85),parts.CAST,2.0)
        beam.rotation_euler[1]=angle
    tread_depth=run/TREAD_COUNT
    step_rise=rise/TREAD_COUNT
    for i in range(TREAD_COUNT):
        x=(i+0.5)*tread_depth
        z=(i+0.5)*step_rise
        tread=parts.box(f'{code} tread {i+1:02d} of {TREAD_COUNT} - illustrative',
            (x,0,z),(tread_depth-4,width-70,28),parts.GALV,1.5)
    parts.link_new_objects(before,coll,root)
    root.location=(offset_x,0,0)
    return coll,root,tread_depth,step_rise,chord

def main():
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
    scene=bpy.context.scene; scene.unit_settings.system='METRIC'; scene.unit_settings.scale_length=.001
    scene.render.engine='BLENDER_EEVEE'; scene.view_settings.view_transform='Standard'; scene.view_settings.look='Medium High Contrast'
    scene.world.use_nodes=True; scene.world.node_tree.nodes.get('Background').inputs['Color'].default_value=(.68,.73,.78,1)
    scene.world.node_tree.nodes.get('Background').inputs['Strength'].default_value=.5
    items=[]
    for i,(code,family,run,rise,width,mass,width_estimated) in enumerate(VARIANTS):
        # Models are laid out side by side in the collection; STL export resets
        # each root so individual exports start at the origin.
        xoff=i*3300.0
        coll,root,going,step_rise,chord=make_stair(code,family,run,rise,width,mass,width_estimated,xoff)
        items.append((code,coll,root))
        parts.export_stl(coll,root,OUT/f'Wellmade-{code}-Stair-3D.stl')
    camera_data=bpy.data.cameras.new('All stair variants camera'); camera=bpy.data.objects.new('All stair variants camera',camera_data)
    scene.collection.objects.link(camera); scene.camera=camera
    for name,loc,power,size in [('Key light',(8000,-8000,7000),7000,3000),('Fill light',(9000,5000,3000),4200,3500)]:
        d=bpy.data.lights.new(name,'AREA'); d.energy=power; d.size=size; ob=bpy.data.objects.new(name,d); scene.collection.objects.link(ob); ob.location=loc
    scene.render.resolution_x=2400; scene.render.resolution_y=1400; scene.render.resolution_percentage=100; scene.render.image_settings.file_format='PNG'
    parts.set_camera(scene,camera,(8000,0,1000),(8000,-6500,5200),16800)
    scene.render.filepath=str(OUT/'Wellmade-all-stair-rises-preview.png'); bpy.ops.render.render(write_still=True)
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=str(OUT/'Wellmade-All-Scaffold-Stair-Variants.glb'),export_format='GLB',use_selection=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Wellmade-All-Scaffold-Stair-Variants.blend'))

if __name__=='__main__':main()
