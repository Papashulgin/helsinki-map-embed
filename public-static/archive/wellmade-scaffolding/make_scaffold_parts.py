"""Build dimension-led Wellmade Ringlock component models in Blender.

Units are millimetres (Blender scene scale_length = 0.001). Dimensions taken
from the catalogue/drawings are parameterized; shapes without full CAD geometry
are explicitly illustrative. Run with: blender -b --python make_scaffold_parts.py
"""
from pathlib import Path
import bpy, bmesh, math
from mathutils import Vector

ROOT = Path(__file__).parent
OUT = ROOT / "models"
OUT.mkdir(parents=True, exist_ok=True)
SEG = 96

# Manufacturer/catalogue dimensions and selected variants.
LEDGER_L = 3070.0       # mm, centreline-to-centreline per current vendor page
LEDGER_OD, LEDGER_WALL = 48.3, 3.0
HEAD_L, HEAD_W, HEAD_H = 55.7, 70.5, 56.0  # envelope values read from supplied drawing
HEAD_BORE, HEAD_COLLAR_OD = 21.8, 33.2
WEDGE_THICK, WEDGE_WIDTH, WEDGE_HEIGHT = 6.5, 11.0, 45.0
STANDARD_L = 2000.0
STANDARD_OD, STANDARD_WALL = 48.3, 3.2
ROSETTE_D, ROSETTE_T, ROSETTE_PITCH = 123.0, 9.0, 500.0
ROSETTE_HOLE_COUNT = 8
JACK_L, JACK_OD, JACK_WALL = 760.0, 38.0, 4.0
JACK_PLATE, JACK_PLATE_T = 150.0, 6.0
JACK_NUT_Z, JACK_THREAD_PITCH = 660.0, 6.35

def mat(name, color, metallic=0.65, rough=0.32):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1)
    m.use_nodes=True; bs=m.node_tree.nodes.get("Principled BSDF")
    bs.inputs["Base Color"].default_value=(*color,1)
    bs.inputs["Metallic"].default_value=metallic; bs.inputs["Roughness"].default_value=rough
    return m

GALV=mat("Galvanized steel - visual",(0.56,0.63,0.68))
CAST=mat("Cast steel - visual",(0.38,0.45,0.50))
WEDGEMAT=mat("Wedge pin - visual",(0.78,0.56,0.23))
THREADMAT=mat("Threaded stem - visual",(0.47,0.55,0.60))

def link_new_objects(before, collection, parent=None):
    for obj in set(bpy.context.scene.objects)-before:
        for c in list(obj.users_collection): c.objects.unlink(obj)
        collection.objects.link(obj)
        if parent is not None:
            obj.parent=parent
            obj.matrix_parent_inverse=bpy.mathutils.Matrix.Identity(4) if hasattr(bpy,'mathutils') else __import__('mathutils').Matrix.Identity(4)

def new_collection(name, root_location=(0,0,0)):
    c=bpy.data.collections.new(name); bpy.context.scene.collection.children.link(c)
    e=bpy.data.objects.new(name+" root",None); c.objects.link(e); e.location=root_location
    return c,e

def box(name, location, dims, material, bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1,location=location)
    o=bpy.context.object; o.name=name; o.dimensions=dims
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(material)
    if bevel:
        mod=o.modifiers.new("Small casting edge rounds","BEVEL"); mod.width=bevel; mod.segments=2
        bpy.context.view_layer.objects.active=o; bpy.ops.object.modifier_apply(modifier=mod.name)
    return o

def mesh_obj(name, verts, faces, material):
    me=bpy.data.meshes.new(name+" mesh"); me.from_pydata(verts,[],faces); me.materials.append(material); me.update()
    bm=bmesh.new(); bm.from_mesh(me); bmesh.ops.recalc_face_normals(bm,faces=bm.faces); bm.to_mesh(me); bm.free()
    ob=bpy.data.objects.new(name,me); bpy.context.collection.objects.link(ob); return ob

def hollow_tube_x(name,x0,x1,ro,wall,material,y=0,z=0):
    ri=ro-wall; verts=[]; faces=[]
    for x in (x0,x1):
        for r in (ro,ri):
            for j in range(SEG):
                a=2*math.pi*j/SEG; verts.append((x,y+r*math.cos(a),z+r*math.sin(a)))
    for j in range(SEG):
        k=(j+1)%SEG
        faces.extend([(j,k,2*SEG+k,2*SEG+j),(SEG+j,3*SEG+j,3*SEG+k,SEG+k),
                      (j,SEG+j,SEG+k,k),(2*SEG+j,2*SEG+k,3*SEG+k,3*SEG+j)])
    return mesh_obj(name,verts,faces,material)

def hollow_tube_z(name,z0,z1,ro,wall,material,x=0,y=0):
    ri=ro-wall; verts=[]; faces=[]
    for z in (z0,z1):
        for r in (ro,ri):
            for j in range(SEG):
                a=2*math.pi*j/SEG; verts.append((x+r*math.cos(a),y+r*math.sin(a),z))
    for j in range(SEG):
        k=(j+1)%SEG
        faces.extend([(j,2*SEG+j,2*SEG+k,k),(SEG+j,SEG+k,3*SEG+k,3*SEG+j),
                      (j,k,SEG+k,SEG+j),(2*SEG+j,3*SEG+j,3*SEG+k,2*SEG+k)])
    return mesh_obj(name,verts,faces,material)

def extruded_xz(name, profile, y0,y1, material):
    n=len(profile); verts=[(x,y0,z) for x,z in profile]+[(x,y1,z) for x,z in profile]
    faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]
    for i in range(n):
        j=(i+1)%n; faces.append((i,j,n+j,n+i))
    return mesh_obj(name,verts,faces,material)

def cut_cylinder_y(obj,x,y,z,radius,depth):
    bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=radius,depth=depth,
        location=(x,y,z),rotation=(math.pi/2,0,0))
    cutter=bpy.context.object; cutter.name="temporary bore cutter"
    mod=obj.modifiers.new("Drawing bore Ø21.8","BOOLEAN"); mod.operation="DIFFERENCE"; mod.object=cutter
    mod.solver="EXACT"; bpy.context.view_layer.objects.active=obj; bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter,do_unlink=True)

def head_piece(prefix, datum_x, direction, collection, root):
    before=set(bpy.context.scene.objects)
    # The silhouette fits the supplied head envelope; un-dimensioned casting
    # pockets and fillets are represented by this simplified twin-cheek body.
    prof=[(0,-HEAD_H/2),(HEAD_L-3,-HEAD_H/2),(HEAD_L,-2),(HEAD_L-8,HEAD_H/2),(0,HEAD_H/2)]
    for side,(y0,y1) in enumerate(((-HEAD_W/2,-23.25),(23.25,HEAD_W/2))):
        p=[(datum_x+direction*x,z) for x,z in prof]
        cheek=extruded_xz(prefix+f" cheek {side+1}",p,y0,y1,CAST)
        cut_cylinder_y(cheek,datum_x+direction*30,0,0,HEAD_BORE/2,HEAD_W+10)
    # A lower cast bridge ties the two cheeks around the ledger tube socket.
    box(prefix+" lower bridge",(datum_x+direction*43,0,-17),(22,46,12),CAST,1.5)
    # Collar rings show the Ø33.2 / Ø21.8 section detail; their axial extent
    # and blend into the casting remain image-interpreted rather than CAD-exact.
    for y in (-22.0,22.0):
        bpy.ops.mesh.primitive_torus_add(major_segments=48,minor_segments=12,
            major_radius=(HEAD_COLLAR_OD+HEAD_BORE)/4,minor_radius=(HEAD_COLLAR_OD-HEAD_BORE)/4,
            location=(datum_x+direction*30,y,0),rotation=(math.pi/2,0,0))
        o=bpy.context.object; o.name=prefix+" bore boss Ø33.2/Ø21.8"; o.data.materials.append(CAST)
    # Wedge plate follows the supplied 6.5 x 11 mm section callouts; 45 mm
    # is the drawn vertical extent. Its taper profile is simplified.
    wedge_profile=[(datum_x+direction*21,-WEDGE_HEIGHT/2),(datum_x+direction*27,-WEDGE_HEIGHT/2),
                   (datum_x+direction*29,WEDGE_HEIGHT/2),(datum_x+direction*22,WEDGE_HEIGHT/2)]
    wedge=extruded_xz(prefix+" wedge pin 6.5x11x45 approx",wedge_profile,-WEDGE_WIDTH/2,WEDGE_WIDTH/2,WEDGEMAT)
    link_new_objects(before,collection,root)

def make_ledger(length=LEDGER_L, label=None):
    label = label or f"{length/1000:.3f} m"
    c,root=new_collection(f"Ringlock ledger {label} - nominal datum length")
    before=set(bpy.context.scene.objects)
    L=length; r=LEDGER_OD/2
    hollow_tube_x("Ledger tube Ø48.3 x 3.0",HEAD_L,L-HEAD_L,r,LEDGER_WALL,GALV)
    link_new_objects(before,c,root)
    head_piece("Ledger end A",0,+1,c,root)
    head_piece("Ledger end B",L,-1,c,root)
    return c,root

def annular_disk(name, outer_d, inner_d, thickness, material):
    ro,ri=outer_d/2,inner_d/2; z0,z1=-thickness/2,thickness/2
    verts=[]
    for z in (z0,z1):
        for r in (ro,ri):
            for j in range(SEG):
                a=2*math.pi*j/SEG; verts.append((r*math.cos(a),r*math.sin(a),z))
    faces=[]
    for j in range(SEG):
        k=(j+1)%SEG
        faces.extend([(j,k,2*SEG+k,2*SEG+j),(SEG+j,3*SEG+j,3*SEG+k,SEG+k),
                      (j,SEG+j,SEG+k,k),(2*SEG+j,2*SEG+k,3*SEG+k,3*SEG+j)])
    return mesh_obj(name,verts,faces,material)

def apply_rosette_slots(obj):
    # Eight radial openings indicate the eight connection directions. Slot
    # profiles are visual approximations because no opening size is dimensioned.
    for i in range(ROSETTE_HOLE_COUNT):
        a=2*math.pi*i/ROSETTE_HOLE_COUNT
        bpy.ops.mesh.primitive_cube_add(size=1,location=(43.0*math.cos(a),43.0*math.sin(a),0))
        cut=bpy.context.object; cut.name="temporary rosette slot"
        cut.dimensions=(22.0,9.0,ROSETTE_T+4)
        cut.rotation_euler[2]=a
        bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
        mod=obj.modifiers.new("Approximate rosette connection slot","BOOLEAN"); mod.operation="DIFFERENCE"; mod.object=cut; mod.solver="EXACT"
        bpy.context.view_layer.objects.active=obj; bpy.ops.object.modifier_apply(modifier=mod.name)
        bpy.data.objects.remove(cut,do_unlink=True)

def make_standard(length=STANDARD_L, label=None):
    label = label or f"{length/1000:.2f} m"
    c,root=new_collection(f"Ringlock standard {label}")
    before=set(bpy.context.scene.objects)
    hollow_tube_z("Standard tube Ø48.3 x 3.2",0,length,STANDARD_OD/2,STANDARD_WALL,GALV)
    link_new_objects(before,c,root)
    ring=annular_disk("Rosette Ø123 x 9 - 8 slots approx",ROSETTE_D,STANDARD_OD,ROSETTE_T,CAST)
    apply_rosette_slots(ring)
    # Catalog standards use a 500 mm rosette pitch, centred half a pitch from
    # each physical end. Slot details remain illustrative, not production CAD.
    for index,z in enumerate(range(250,int(length),int(ROSETTE_PITCH))):
        before=set(bpy.context.scene.objects)
        o=ring if index==0 else ring.copy()
        if index!=0:
            o.data=ring.data.copy(); bpy.context.collection.objects.link(o)
        o.name=f"Rosette centre z={int(z)} mm"; o.location.z=z
        if index!=0: link_new_objects(before,c,root)
        else:
            # The original ring already belongs to the scene collection; move it to this part.
            for old in list(o.users_collection): old.objects.unlink(o)
            c.objects.link(o); o.parent=root; o.matrix_parent_inverse=__import__('mathutils').Matrix.Identity(4)
    bpy.data.objects.remove(ring if ring.name in bpy.data.objects and ring.name=="Rosette Ø123 x 9 - 8 slots approx" else bpy.data.objects.get("__never__"),do_unlink=True) if False else None
    return c,root

def make_hex_nut(name, x,y,z):
    bpy.ops.mesh.primitive_cylinder_add(vertices=6,radius=30,depth=22,location=(x,y,z))
    obj=bpy.context.object; obj.name=name; obj.data.materials.append(CAST)
    bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=19.1,depth=30,location=(x,y,z))
    cutter=bpy.context.object; mod=obj.modifiers.new("Thread bore Ø38 approx","BOOLEAN"); mod.operation="DIFFERENCE"; mod.object=cutter; mod.solver="EXACT"
    bpy.context.view_layer.objects.active=obj; bpy.ops.object.modifier_apply(modifier=mod.name); bpy.data.objects.remove(cutter,do_unlink=True)
    return obj

def add_thread_helix(name,x,y,z0,z1,pitch,material):
    turns=(z1-z0)/pitch; count=int(turns*24)+1
    curve=bpy.data.curves.new(name,"CURVE"); curve.dimensions="3D"; curve.resolution_u=1
    curve.bevel_depth=1.0; curve.bevel_resolution=2
    spline=curve.splines.new("POLY"); spline.points.add(count-1)
    for i,p in enumerate(spline.points):
        f=i/(count-1); a=2*math.pi*turns*f
        p.co=(x+17.9*math.cos(a),y+17.9*math.sin(a),z0+(z1-z0)*f,1)
    ob=bpy.data.objects.new(name,curve); bpy.context.collection.objects.link(ob); ob.data.materials.append(material)
    bpy.context.view_layer.objects.active=ob; ob.select_set(True); bpy.ops.object.convert(target="MESH"); ob=bpy.context.object
    ob.name=name
    return ob

def make_jack():
    c,root=new_collection("Adjustable base jack 38x4 - 760 mm")
    before=set(bpy.context.scene.objects)
    box("Base plate 150x150x6",(0,0,JACK_PLATE_T/2),(JACK_PLATE,JACK_PLATE,JACK_PLATE_T),GALV,0.8)
    # Thread-root body is OD34; 6.35 mm pitch crests bring the model to Ø38.
    # This is an approximate representation of an OD38x4 threaded hollow stem.
    hollow_tube_z("Jack hollow stem thread root OD34 ID26",JACK_PLATE_T,JACK_L,17,4,THREADMAT)
    add_thread_helix("Jack thread 4 TPI pitch 6.35",0,0,24,JACK_L-8,JACK_THREAD_PITCH,WEDGEMAT)
    nut=make_hex_nut("Jack nut at 660 mm drawing datum",0,0,JACK_NUT_Z)
    # Opposed cast handles are dimensionally unlabelled in the drawing.
    box("Jack nut handle left",(-42,0,JACK_NUT_Z),(44,18,12),CAST,2)
    box("Jack nut handle right",(42,0,JACK_NUT_Z),(44,18,12),CAST,2)
    link_new_objects(before,c,root)
    return c,root

def set_camera(scene,camera,target,location,ortho):
    camera.location=location; camera.data.type="ORTHO"; camera.data.ortho_scale=ortho; camera.data.clip_end=10000
    camera.rotation_euler=(Vector(target)-Vector(location)).to_track_quat("-Z","Y").to_euler()

def export_stl(collection,root,filepath):
    old=root.location.copy(); root.location=(0,0,0)
    bpy.ops.object.select_all(action="DESELECT")
    for o in collection.objects:
        if o.type=="MESH": o.select_set(True)
    active=next(o for o in collection.objects if o.type=="MESH"); bpy.context.view_layer.objects.active=active
    bpy.ops.preferences.addon_enable(module="io_mesh_stl")
    bpy.ops.export_mesh.stl(filepath=str(filepath),use_selection=True,global_scale=1.0,use_scene_unit=False,ascii=False)
    root.location=old

def main():
    bpy.ops.object.select_all(action="SELECT"); bpy.ops.object.delete(use_global=False)
    scene=bpy.context.scene; scene.unit_settings.system="METRIC"; scene.unit_settings.scale_length=0.001
    scene.render.engine="BLENDER_EEVEE"; scene.render.resolution_x=1500; scene.render.resolution_y=900; scene.render.resolution_percentage=100
    scene.view_settings.view_transform="Standard"; scene.view_settings.look="Medium High Contrast"
    ledger_c,ledger_root=make_ledger()
    standard_c,standard_root=make_standard(); standard_root.location=(0,-250,0)
    jack_c,jack_root=make_jack(); jack_root.location=(350,-520,0)
    # Set up neutral review lighting and a camera for the combined assembly.
    world=scene.world; world.use_nodes=True; world.node_tree.nodes.get("Background").inputs["Color"].default_value=(0.68,0.73,0.78,1)
    world.node_tree.nodes.get("Background").inputs["Strength"].default_value=0.5
    camdata=bpy.data.cameras.new("Parts preview camera"); cam=bpy.data.objects.new("Parts preview camera",camdata); scene.collection.objects.link(cam); scene.camera=cam
    lights=[]
    for name,loc,power,size in (("Key light",(1000,-1400,1800),3200,1100),("Fill light",(2500,700,1000),1900,1400)):
        d=bpy.data.lights.new(name,"AREA"); d.energy=power; d.size=size
        o=bpy.data.objects.new(name,d); scene.collection.objects.link(o); o.location=loc; lights.append(o)
    scene.render.image_settings.file_format="PNG"
    set_camera(scene,cam,(1450,-260,900),(1600,-3600,2300),4500)
    scene.render.filepath=str(OUT/"Wellmade-components-preview.png"); bpy.ops.render.render(write_still=True)
    # Separate part previews make the cast head, rosettes, and jack easier to inspect.
    for coll,root,filename,target,location,scale,width,height in (
        (ledger_c,ledger_root,"Wellmade-ledger-preview.png",(LEDGER_L/2,0,0),(LEDGER_L/2,-2300,250),3500,1500,650),
        (standard_c,standard_root,"Wellmade-standard-preview.png",(0,-250,1000),(1000,-2300,1000),2500,850,1600),
        (jack_c,jack_root,"Wellmade-jack-preview.png",(350,-520,380),(900,-2300,380),1200,850,1600),
    ):
        for coll2 in (ledger_c,standard_c,jack_c):
            for obj in coll2.objects: obj.hide_render=(coll2!=coll)
        set_camera(scene,cam,target,location,scale)
        scene.render.resolution_x=width; scene.render.resolution_y=height
        scene.render.filepath=str(OUT/filename); bpy.ops.render.render(write_still=True)
        if coll==ledger_c:
            set_camera(scene,cam,(35,0,0),(280,-480,260),260)
            scene.render.filepath=str(OUT/"Wellmade-ledger-head-preview.png")
            bpy.ops.render.render(write_still=True)
    for coll2 in (ledger_c,standard_c,jack_c):
        for obj in coll2.objects: obj.hide_render=False
    scene.render.resolution_x=1500; scene.render.resolution_y=900
    set_camera(scene,cam,(1450,-260,900),(1600,-3600,2300),4500)
    # Save the editable complete scene; model coordinates use millimetres.
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(filepath=str(OUT/"Wellmade-Ringlock-3-components.glb"),export_format="GLB",use_selection=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/"Wellmade-Ringlock-3-components.blend"))
    export_stl(ledger_c,ledger_root,OUT/"Wellmade-Ringlock-Ledger-WRL307-3070mm.stl")
    export_stl(standard_c,standard_root,OUT/"Wellmade-Ringlock-Standard-WRS200-2000mm.stl")
    export_stl(jack_c,jack_root,OUT/"Wellmade-Adjustable-Jack-760mm-38x4.stl")

if __name__=="__main__": main()
