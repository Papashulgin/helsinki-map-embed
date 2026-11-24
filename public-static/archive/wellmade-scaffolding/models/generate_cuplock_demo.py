"""Create an illustrative one-bay Cuplock scaffold assembly in Blender.

All dimensions are nominal modelling assumptions documented in cuplock-fi.md;
this is not a manufacturer-specific or structural design model.
Run: blender -b --python generate_cuplock_demo.py
"""
from pathlib import Path
import bpy, math
from mathutils import Vector

ROOT = Path(__file__).parent
OUT = ROOT
GALV = (0.58, 0.66, 0.70, 1)
CUP = (0.40, 0.49, 0.54, 1)
BOARD = (0.68, 0.42, 0.20, 1)
WEDGE = (0.78, 0.57, 0.22, 1)

def material(name, color, metallic=.72, rough=.3):
    m=bpy.data.materials.new(name); m.diffuse_color=color; m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF'); bs.inputs['Base Color'].default_value=color
    bs.inputs['Metallic'].default_value=metallic; bs.inputs['Roughness'].default_value=rough
    return m

M_GALV=material('Steel - illustrative galvanized finish', GALV)
M_CUP=material('Cuplock cups - cast steel visual', CUP)
M_BOARD=material('Deck boards - visual only', BOARD, .05, .58)
M_WEDGE=material('Ledger blade ends - visual', WEDGE)

def cylinder(name, radius, depth, location, mat, vertices=48, rotation=None, wall=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location, rotation=rotation or (0,0,0))
    o=bpy.context.object; o.name=name; o.data.materials.append(mat); return o

def box(name, location, dims, mat, bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location); o=bpy.context.object; o.name=name; o.dimensions=dims
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True); o.data.materials.append(mat)
    if bevel:
        b=o.modifiers.new('Soft illustrative edges','BEVEL'); b.width=bevel; b.segments=2
        bpy.context.view_layer.objects.active=o; bpy.ops.object.modifier_apply(modifier=b.name)
    return o

def tube_between(name, a, b, radius, mat, wall=None):
    a,b=Vector(a),Vector(b); delta=b-a; mid=(a+b)/2
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=radius, depth=delta.length, location=mid)
    o=bpy.context.object; o.name=name; o.rotation_euler=delta.to_track_quat('Z','Y').to_euler(); o.data.materials.append(mat)
    if wall:
        mod=o.modifiers.new('Hollow tube wall (approximate)','SOLIDIFY'); mod.thickness=-wall
    return o

def ring(name, x,y,z, r_outer, r_inner, height, mat, n=48):
    verts=[]
    for zz,rr in ((z-height/2,r_outer),(z-height/2,r_inner),(z+height/2,r_outer),(z+height/2,r_inner)):
        verts += [(x+rr*math.cos(2*math.pi*i/n),y+rr*math.sin(2*math.pi*i/n),zz) for i in range(n)]
    faces=[]
    for i in range(n):
        j=(i+1)%n
        faces.extend([(i,j,2*n+j,2*n+i),(n+i,3*n+i,3*n+j,n+j),(i,n+i,n+j,j),(2*n+i,2*n+j,3*n+j,3*n+i)])
    mesh=bpy.data.meshes.new(name+' mesh'); mesh.from_pydata(verts,[],faces); mesh.materials.append(mat); mesh.update()
    obj=bpy.data.objects.new(name,mesh); bpy.context.collection.objects.link(obj); return obj

def main():
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
    scene=bpy.context.scene; scene.unit_settings.system='METRIC'; scene.unit_settings.scale_length=.001
    # One illustrative 1800 x 1200 mm bay; standard centrelines are the bay grid.
    X=1800.0; Y=1200.0; Z=2000.0; R=24.15
    posts=[(x,y) for x in (0,X) for y in (0,Y)]
    # Uprights, fixed lower cups, captive sliding upper cups and simple spigots.
    for i,(x,y) in enumerate(posts,1):
        cylinder(f'Standard {i}: Ø48.3 x 3.2, L2000',R,Z,(x,y,Z/2),M_GALV,wall=3.2)
        for level in (500,1000,1500):
            ring(f'S{i} fixed lower cup @ {level}',x,y,level-20,42,25.2,22,M_CUP)
            ring(f'S{i} sliding upper cup @ {level}',x,y,level+17,40,25.2,18,M_CUP)
        cylinder(f'S{i} joint pin',18,75,(x,y,Z+37.5),M_CUP,32)
    # Ledgers around the perimeter at 0.5 m cup spacing. End blade plates sit in the lower cups.
    for level in (500,1000,1500):
        for y in (0,Y):
            tube_between(f'Longitudinal ledger 1800 @ {level}',(R,y,level),(X-R,y,level),R,M_GALV,3.2)
            for x in (0,X):
                box(f'Ledger blade end x/y @ {level}',(x+(35 if x==0 else -35),y,level),(70,8,48),M_WEDGE,2)
        for x in (0,X):
            tube_between(f'Transverse ledger 1200 @ {level}',(x,R,level),(x,Y-R,level),R,M_GALV,3.2)
            for y in (0,Y):
                box(f'Transverse blade end x/y @ {level}',(x,y+(35 if y==0 else -35),level),(8,70,48),M_WEDGE,2)
    # One X-brace on each long side, shown on the lower bay face.
    for y in (0,Y):
        tube_between('Diagonal brace long face A',(R,y,500),(X-R,y,1500),16,M_GALV,2.5)
        tube_between('Diagonal brace long face B',(R,y,1500),(X-R,y,500),16,M_GALV,2.5)
    # Deck is a visual surface, not a load-rated component specification.
    for i in range(6):
        box(f'Illustrative deck board {i+1}',(X/2,100+i*200,1540),(X-120,185,45),M_BOARD,3)
    # camera, lighting, ground plane
    box('Ground reference',(X/2,Y/2,-35),(X+700,Y+700,40),material('Ground',(.84,.87,.89,1),.0,.9))
    camdata=bpy.data.cameras.new('Cuplock assembly camera'); cam=bpy.data.objects.new('Cuplock assembly camera',camdata); scene.collection.objects.link(cam); scene.camera=cam
    cam.location=(3500,-3900,2850); target=Vector((X/2,Y/2,1050)); cam.rotation_euler=(target-Vector(cam.location)).to_track_quat('-Z','Y').to_euler(); cam.data.type='ORTHO'; cam.data.ortho_scale=4100; cam.data.clip_end=15000
    scene.world.use_nodes=True; scene.world.node_tree.nodes.get('Background').inputs['Color'].default_value=(.75,.79,.83,1)
    for name,loc,power,size in [('Key',(1000,-2600,4000),4200,2600),('Fill',(3300,2200,2700),2600,2200)]:
        d=bpy.data.lights.new(name,'AREA'); d.energy=power; d.size=size; o=bpy.data.objects.new(name,d); scene.collection.objects.link(o); o.location=loc; o.rotation_euler=(target-Vector(loc)).to_track_quat('-Z','Y').to_euler()
    scene.render.engine='BLENDER_EEVEE'; scene.render.resolution_x=1500; scene.render.resolution_y=1100; scene.render.resolution_percentage=100
    scene.view_settings.view_transform='Standard'; scene.view_settings.look='Medium High Contrast'; scene.render.image_settings.file_format='PNG'
    scene.render.filepath=str(OUT/'Cuplock-one-bay-preview.png')
    bpy.ops.render.render(write_still=True)
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=str(OUT/'Cuplock-one-bay-1800x1200x2000.glb'),export_format='GLB',use_selection=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Cuplock-one-bay-1800x1200x2000.blend'))
    bpy.ops.preferences.addon_enable(module='io_mesh_stl')
    bpy.ops.export_mesh.stl(filepath=str(OUT/'Cuplock-one-bay-1800x1200x2000.stl'),use_selection=True,global_scale=1.0,use_scene_unit=False,ascii=False)

if __name__=='__main__': main()
