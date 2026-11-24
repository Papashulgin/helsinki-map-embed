"""Editable visual study of Uusi ylioppilastalo, Mannerheimintie 5.

The building footprint and registered storeys come from Helsinki WFS. The
supplied photo guides the visible facade. Documented dome dimensions come from
the Helsinki City Museum's 2020 Kupolitorni memo.
"""
import bpy, json, math, os, hashlib
from mathutils import Vector, geometry

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public-static/assets/building-models/mannerheimintie-5")
os.makedirs(OUT, exist_ok=True)
source = json.load(open(os.path.join(OUT, "source-footprint.json"), encoding="utf-8"))
building = source["buildingSource"]
raw = building["footprintEPSG3879"]
cx = sum(p[0] for p in raw) / len(raw)
cy = sum(p[1] for p in raw) / len(raw)
ring = [(p[0] - cx, p[1] - cy) for p in raw]
if len(ring) > 2 and math.dist(ring[0], ring[-1]) < 0.01:
    ring.pop()


def rdp(points, eps):
    if len(points) <= 2:
        return points
    a, b = points[0], points[-1]
    dx, dy = b[0] - a[0], b[1] - a[1]
    den = dx * dx + dy * dy
    best_i, best_d = 0, -1
    for i, p in enumerate(points[1:-1], 1):
        t = max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / den)) if den else 0
        d = math.dist(p, (a[0] + t * dx, a[1] + t * dy))
        if d > best_d:
            best_i, best_d = i, d
    if best_d > eps:
        left, right = rdp(points[:best_i + 1], eps), rdp(points[best_i:], eps)
        return left[:-1] + right
    return [a, b]


anchor = max(range(len(ring)), key=lambda i: ring[i][0] + ring[i][1])
rot = ring[anchor:] + ring[:anchor]
split = max(range(1, len(rot)), key=lambda i: (rot[i][0] - rot[0][0]) ** 2 + (rot[i][1] - rot[0][1]) ** 2)
ring = rdp(rot[:split + 1], 0.25)[:-1] + rdp(rot[split:] + [rot[0]], 0.25)[:-1]
if sum(ring[i][0] * ring[(i + 1) % len(ring)][1] - ring[(i + 1) % len(ring)][0] * ring[i][1] for i in range(len(ring))) < 0:
    ring.reverse()

# The registered outline has a long street wing that runs diagonally in the
# local EPSG:3879 frame. Use its surveyed direction for roof ridges instead of
# treating map east/west as the building axis.
roof_axis_angle = math.radians(-27.0)
roof_u = (math.cos(roof_axis_angle), math.sin(roof_axis_angle))
roof_v = (-roof_u[1], roof_u[0])

def to_qr(x, y):
    return (x * roof_u[0] + y * roof_u[1], x * roof_v[0] + y * roof_v[1])

def from_qr(q, r):
    return (q * roof_u[0] + r * roof_v[0], q * roof_u[1] + r * roof_v[1])

roof_ring = [to_qr(x, y) for x, y in ring]

def roof_intervals_at_q(q):
    crossings = []
    for i, a in enumerate(roof_ring):
        b = roof_ring[(i + 1) % len(roof_ring)]
        if (a[0] <= q < b[0]) or (b[0] <= q < a[0]):
            t = (q - a[0]) / (b[0] - a[0])
            crossings.append(a[1] + (b[1] - a[1]) * t)
    crossings.sort()
    return [(crossings[i], crossings[i + 1]) for i in range(0, len(crossings) - 1, 2)]

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
for data_group in (bpy.data.meshes, bpy.data.materials, bpy.data.cameras, bpy.data.lights, bpy.data.curves):
    for item in list(data_group):
        if item.users == 0:
            data_group.remove(item)


def mat(name, color, rough=0.72, metal=0.0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    shader = m.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1)
    shader.inputs["Roughness"].default_value = rough
    shader.inputs["Metallic"].default_value = metal
    return m


stone = mat("Facade | warm pale stone", (0.75, 0.65, 0.53))
trim = mat("Cornices and columns | pale limestone", (0.89, 0.81, 0.69))
pink = mat("Cupola tower | muted pink granite", (0.57, 0.43, 0.35))
base = mat("Plinth and steps | grey granite", (0.39, 0.39, 0.36))
glass = mat("Windows | deep blue-grey glass", (0.12, 0.27, 0.34), 0.28, 0.05)
frame = mat("Window framing | dark bronze", (0.21, 0.19, 0.16), 0.42, 0.18)
copper = mat("Roof and dome | aged green copper", (0.20, 0.39, 0.32), 0.38, 0.46)
copper_hi = mat("Dome seams | copper highlights", (0.36, 0.54, 0.43), 0.34, 0.5)
roof_base = mat("Lower roof fields | aged green copper", (0.18, 0.34, 0.29), 0.48, 0.34)
bronze = mat("Sculptures and details | dark bronze", (0.22, 0.25, 0.23), 0.4, 0.42)
wood = mat("Entrance | dark stained wood", (0.20, 0.15, 0.11))
materials = [stone, trim, pink, base, glass, frame, copper, copper_hi, roof_base, bronze, wood]
batches = {m.name: ([], []) for m in materials}


def box(m, center, t, n, width, depth, z0, z1):
    vs, fs = batches[m.name]
    tx, ty = t
    nx, ny = n
    x, y = center
    for z in (z0, z1):
        for u, v in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
            vs.append((x + tx * u * width / 2 + nx * v * depth / 2,
                       y + ty * u * width / 2 + ny * v * depth / 2, z))
    k = len(vs) - 8
    fs.extend([(k,k+1,k+2,k+3),(k+4,k+7,k+6,k+5),(k,k+4,k+5,k+1),
               (k+1,k+5,k+6,k+2),(k+2,k+6,k+7,k+3),(k+3,k+7,k+4,k)])


def mesh(name, vertices, faces, material):
    data = bpy.data.meshes.new(name + " mesh")
    data.from_pydata(vertices, [], faces)
    data.materials.append(material)
    data.update()
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    return obj


def cylinder(name, material, location, radius, depth, vertices=40, radius2=None):
    if radius2 is None:
        bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location)
    else:
        bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=radius, radius2=radius2, depth=depth, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(material)
    return obj


def sphere(name, material, location, scale):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=10, radius=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(material)
    return obj


def beam(name, material, a, b, radius):
    start, end = Vector(a), Vector(b)
    delta = end - start
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=radius, depth=delta.length, location=(start + end) / 2)
    obj = bpy.context.object
    obj.name = name
    obj.rotation_euler = delta.to_track_quat("Z", "Y").to_euler()
    obj.data.materials.append(material)
    return obj


def tube(name, material, points, radius):
    curve = bpy.data.curves.new(name + " curve", "CURVE")
    curve.dimensions = "3D"
    curve.bevel_depth = radius
    curve.bevel_resolution = 2
    spline = curve.splines.new("POLY")
    spline.points.add(len(points) - 1)
    for p, co in zip(spline.points, points):
        p.co = (*co, 1)
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(material)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target="MESH")
    obj = bpy.context.object
    obj.select_set(False)
    return obj


levels = [0,3.2,6.2,9.25,12.3,15.35,18.4,21.5,24.8]
body_height = levels[-1]
n = len(ring)
sv = [(x,y,z) for z in (0,body_height) for x,y in ring]
sf = []
for i in range(n):
    j = (i + 1) % n
    sf.append((i,j,n+j,n+i))
for tri in geometry.tessellate_polygon([[Vector((x,y,0)) for x,y in ring]]):
    sf.append(tuple(tri))
building_objects = [mesh("Building envelope | Helsinki WFS footprint", sv, sf, stone)]
# Keep a low pitched copper roof below the two raised roof groups. This fills
# the complex WFS outline without the previous single, visibly flat roof sheet.
roof_q_min = min(q for q, _ in roof_ring)
roof_q_max = max(q for q, _ in roof_ring)
low_roof_sections = []
low_roof_eave = body_height + 0.035
low_roof_peak = body_height + 1.28
low_roof_steps = max(2, int((roof_q_max - roof_q_min) / 0.55))
for index in range(low_roof_steps + 1):
    q = roof_q_min + 0.03 + (roof_q_max - roof_q_min - 0.06) * index / low_roof_steps
    intervals = roof_intervals_at_q(q)
    if not intervals:
        continue
    r_min = min(a for a, _ in intervals)
    r_max = max(b for _, b in intervals)
    if r_max - r_min < 0.45:
        continue
    r_mid = (r_min + r_max) / 2
    low_roof_sections.append((q, r_min, r_mid, r_max))
low_roof_vertices = []
low_roof_faces = []
for q, r_min, r_mid, r_max in low_roof_sections:
    for r, z in ((r_min, low_roof_eave), (r_mid, low_roof_peak), (r_max, low_roof_eave)):
        x, y = from_qr(q, r)
        low_roof_vertices.append((x, y, z))
for section_index in range(len(low_roof_sections) - 1):
    a, b = section_index * 3, (section_index + 1) * 3
    low_roof_faces.extend(((a, b, b + 1, a + 1), (a + 1, b + 1, b + 2, a + 2)))
if low_roof_sections:
    for section_index in (0, len(low_roof_sections) - 1):
        offset = section_index * 3
        section = low_roof_sections[section_index]
        cap = [Vector((r, z, 0)) for r, z in ((section[1], low_roof_eave), (section[2], low_roof_peak), (section[3], low_roof_eave))]
        for tri in geometry.tessellate_polygon([cap]):
            low_roof_faces.append(tuple(offset + int(i) for i in tri))
low_roof_obj = mesh("Roof | low pitched copper fill beneath raised wings", low_roof_vertices, low_roof_faces, roof_base)
for q in [roof_q_min + 1.0 + i * 2.1 for i in range(int((roof_q_max - roof_q_min - 2.0) / 2.1))]:
    intervals = roof_intervals_at_q(q)
    if not intervals:
        continue
    r_min = min(a for a, _ in intervals)
    r_max = max(b for _, b in intervals)
    r_mid = (r_min + r_max) / 2
    for (r1, z1), (r2, z2) in (((r_min, low_roof_eave), (r_mid, low_roof_peak)),
                              ((r_mid, low_roof_peak), (r_max, low_roof_eave))):
        x1, y1 = from_qr(q, r1)
        x2, y2 = from_qr(q, r2)
        tube("Low roof | standing seam", copper_hi,
             [(x1, y1, z1 + 0.025), (x2, y2, z2 + 0.025)], 0.022)

# Inferred bays, paired window frames and classical floor lines on the WFS edges.
main_face_edges = []
for i, a in enumerate(ring):
    b = ring[(i + 1) % n]
    dx, dy = b[0]-a[0], b[1]-a[1]
    length = math.hypot(dx,dy)
    if length < 4.7:
        continue
    t, normal = (dx/length,dy/length), (dy/length,-dx/length)
    mid = ((a[0]+b[0])/2,(a[1]+b[1])/2)
    count = max(1,int((length-1.1)/(3.0 if length>18 else 3.25)))
    step = (length-1.1)/count
    for bay in range(count):
        s = step*(bay+0.5)-length/2
        c = (mid[0]+t[0]*s,mid[1]+t[1]*s)
        width = min(1.55,max(1.0,step*0.68))
        box(glass,(c[0]+normal[0]*0.08,c[1]+normal[1]*0.08),t,normal,width-0.2,0.12,0.84,levels[1]-0.2)
        for side in (-1,1):
            jamb=(c[0]+t[0]*side*width/2,c[1]+t[1]*side*width/2)
            box(trim,jamb,t,normal,0.12,0.22,0.78,levels[1]-0.14)
        for level in range(1,8):
            lo,hi=levels[level],levels[level+1]
            w=min(1.34 if level<4 else 1.15,step*0.56)
            bottom=lo+(hi-lo)*0.13
            top=hi-(hi-lo)*0.16
            center=(c[0]+normal[0]*0.08,c[1]+normal[1]*0.08)
            box(glass,center,t,normal,w-0.16,0.11,bottom+0.07,top-0.07)
            for side in (-1,1):
                jamb=(c[0]+t[0]*side*w/2+normal[0]*0.06,c[1]+t[1]*side*w/2+normal[1]*0.06)
                box(trim,jamb,t,normal,0.1,0.22,bottom,top)
            box(trim,(c[0]+normal[0]*0.06,c[1]+normal[1]*0.06),t,normal,w+0.12,0.22,top-0.04,top+0.07)
            box(frame,center,t,normal,0.04,0.14,bottom,top)
            box(frame,center,normal,(-t[0],-t[1]),0.035,0.12,bottom+0.1,top-0.1)
        box(trim,(c[0]+normal[0]*0.08,c[1]+normal[1]*0.08),t,normal,0.16,0.22,0.9,13.0)
    for z, depth, thick in ((0.8,0.20,0.18),(3.2,0.20,0.16),(6.2,0.16,0.14),
                            (12.3,0.22,0.20),(21.5,0.18,0.16),(24.45,0.46,0.34)):
        box(trim,(mid[0]+normal[0]*depth/2,mid[1]+normal[1]*depth/2),t,normal,length,depth,z-thick/2,z+thick/2)
    if abs(t[0])>0.85 and mid[1]>25 and length>5:
        main_face_edges.append((length,a,b,t,normal,mid))

chosen = max(main_face_edges,key=lambda row:row[0]) if main_face_edges else None
front_y = chosen[5][1] if chosen else 33.7
front_t, front_n = (1.0,0.0),(0.0,1.0)
if chosen:
    front_t,front_n=chosen[3],chosen[4]
    if front_t[0]<0:
        front_t,front_n=(-front_t[0],-front_t[1]),(-front_n[0],-front_n[1])


def face_y(x):
    ys=[]
    for i,a in enumerate(ring):
        b=ring[(i+1)%n]
        dx,dy=b[0]-a[0],b[1]-a[1]
        if abs(dx)<5 or abs(dy/dx)>0.18:
            continue
        if min(a[0],b[0])-0.5<=x<=max(a[0],b[0])+0.5 and (a[1]+b[1])/2>24:
            ys.append(a[1]+dy*((x-a[0])/dx))
    return max(ys) if ys else front_y


def prism(name, points, y, depth, material):
    front=[(x,y,z) for x,z in points]
    back=[(x,y-depth,z) for x,z in points]
    faces=[tuple(range(len(front))),tuple(reversed(range(len(front),2*len(front))))]
    for i in range(len(front)):
        j=(i+1)%len(front)
        faces.append((i,j,len(front)+j,len(front)+i))
    return mesh(name,front+back,faces,material)


# The square-facing gable ends the inward wing; it is separate from the long
# Mannerheimintie elevation. Keep the outer details on the south-facing side.
gx0,gx1,gxc=-3.4,20.5,8.55
gz0,gztop=24.8,30.15
gy=-13.25
gable_t,gable_n=(1.0,0.0),(0.0,-1.0)
prism("Square elevation | broad cream gable",[(gx0,gz0),(gx1,gz0),(gxc,gztop)],gy,-0.65,stone)
box(trim,((gx0+gx1)/2,gy-0.08),gable_t,gable_n,gx1-gx0+0.4,0.28,gz0-0.15,gz0+0.22)
for x1,z1,x2,z2 in ((gx0,gz0+0.2,gxc,gztop),(gxc,gztop,gx1,gz0+0.2)):
    beam("Green copper gable edge",copper,(x1,gy-0.18,z1),(x2,gy-0.18,z2),0.18)
    beam("Pale stone gable moulding",trim,(x1,gy-0.23,z1-0.42),(x2,gy-0.23,z2-0.42),0.09)


def fanlight(xc,y,bottom,width,spring,radius):
    coords=[(xc-width/2,bottom),(xc+width/2,bottom),(xc+width/2,spring)]
    for i in range(1,25):
        angle=math.pi*i/24
        coords.append((xc+radius*math.cos(angle),spring+radius*math.sin(angle)))
    coords.append((xc-width/2,spring))
    faces=geometry.tessellate_polygon([[Vector((x,z,0)) for x,z in coords]])
    mesh("Gable | arched fanlight glass",[(x,y,z) for x,z in coords],[tuple(int(v) for v in face) for face in faces],glass)
    beam("Fanlight stone jamb",(trim),(xc-width/2,y-0.06,bottom),(xc-width/2,y-0.06,spring),0.14)
    beam("Fanlight stone jamb",trim,(xc+width/2,y-0.06,bottom),(xc+width/2,y-0.06,spring),0.14)
    arch=[(xc+radius*math.cos(math.pi*i/48),y-0.06,spring+radius*math.sin(math.pi*i/48)) for i in range(49)]
    tube("Fanlight semicircular arch",trim,arch,0.16)
    beam("Fanlight central mullion",frame,(xc,y-0.10,bottom),(xc,y-0.10,spring+radius),0.075)
    for angle in (math.pi/4,math.pi/2,3*math.pi/4):
        beam("Fanlight radial muntin",frame,(xc,y-0.10,spring),(xc+radius*math.cos(angle),y-0.10,spring+radius*math.sin(angle)),0.06)
    beam("Fanlight spring rail",frame,(xc-width/2,y-0.1,spring),(xc+width/2,y-0.1,spring),0.06)


fanlight(gxc,gy-0.34,25.8,8.0,26.6,4.0)

# Four tall grouped bay windows in the photographed gabled wing.
for x in (-1.5,4.5,10.5,16.5):
    y=gy-0.5
    for level in range(2,7):
        bottom,top=levels[level]+0.22,levels[level+1]-0.22
        w=1.85
        box(glass,(x,y),gable_t,gable_n,w,0.12,bottom,top)
        for dx in (-w/2,w/2):
            box(trim,(x+dx,y-0.07),gable_t,gable_n,0.14,0.18,bottom-0.1,top+0.12)
    box(glass,(x,y),gable_t,gable_n,1.55,0.12,19.8,24.0)

# Entrance doors, stepped granite approach and four simple sculptural figures.
entry_x=gxc
entry_y=gy-0.58
box(wood,(entry_x,entry_y),gable_t,gable_n,3.2,0.18,0.25,4.6)
box(frame,(entry_x,entry_y-0.12),gable_t,gable_n,3.45,0.20,0.18,4.8)
for i,(w,d,z0,z1,offset) in enumerate(((15,3.6,0,0.48,2.4),(13.5,2.6,0.48,0.96,1.3),(12,1.7,0.96,1.45,0.45))):
    y=entry_y-offset
    box(base,(entry_x,y),gable_t,gable_n,w,d,z0,z1)
    box(trim,(entry_x,y-d/2),gable_t,gable_n,w+0.18,0.18,z1-0.06,z1+0.08)
for i,x in enumerate((-1.0,5.5,12.0,18.0),1):
    y=gy-0.85
    box(base,(x,y),front_t,front_n,1.25,1.0,3.9,4.55)
    cylinder(f"Entrance statue {i} | body",bronze,(x,y,5.65),0.52,2.35,12,0.28)
    sphere(f"Entrance statue {i} | head",bronze,(x,y,7.03),(0.32,0.3,0.38))
    beam(f"Entrance statue {i} | arm",bronze,(x-0.3,y,6.5),(x-0.65,y,6.1),0.12)

# The City Museum documents the tower form and dimensions. Its placement is
# aligned to the rounded corner in Helsinki's registered footprint.
tx,ty=19.7,0.0
cylinder("Corner tower | projecting drum",pink,(tx,ty,22.35),5.5,4.9,56)
cylinder("Corner tower | lower cornice",trim,(tx,ty,24.82),5.85,0.42,56)
for i in range(10):
    angle=2*math.pi*i/10
    x,y=tx+5.53*math.cos(angle),ty+5.53*math.sin(angle)
    outward=(math.cos(angle),math.sin(angle))
    tangent=(-outward[1],outward[0])
    box(glass,(x+outward[0]*0.05,y+outward[1]*0.05),tangent,outward,0.58,0.12,21.0,23.9)

neck=4.3
col_bottom,col_top=24.95,29.12
neck_top=col_top+neck
cylinder("Cupola | drum behind columns",stone,(tx,ty,(col_bottom+col_top)/2),neck,col_top-col_bottom,56)
cylinder("Cupola | neck",pink,(tx,ty,(col_top+neck_top)/2),neck,neck,56)
cylinder("Cupola | lower green rim",copper,(tx,ty,col_top+0.16),neck+0.18,0.30,56)
for i in range(16):
    angle=2*math.pi*i/16
    x,y=tx+5.05*math.cos(angle),ty+5.05*math.sin(angle)
    cylinder(f"Cupola colonnade | column {i+1:02d}",trim,(x,y,(col_bottom+col_top)/2),0.28,col_top-col_bottom,16)
cylinder("Cupola colonnade | capital ring",trim,(tx,ty,col_top-0.05),5.38,0.38,56)
cylinder("Cupola colonnade | foot ring",trim,(tx,ty,col_bottom+0.1),5.38,0.25,56)
for i in range(8):
    angle=2*math.pi*i/8
    x,y=tx+neck*math.cos(angle),ty+neck*math.sin(angle)
    outward=(math.cos(angle),math.sin(angle))
    tangent=(-outward[1],outward[0])
    box(glass,(x+outward[0]*0.08,y+outward[1]*0.08),tangent,outward,0.82,0.14,col_top+1.45,col_top+2.95)

dome_base=neck_top
segments,rings=64,20
dv=[]
for j in range(rings+1):
    theta=(math.pi/2)*j/rings
    for i in range(segments):
        phi=2*math.pi*i/segments
        dv.append((tx+neck*math.sin(theta)*math.cos(phi),ty+neck*math.sin(theta)*math.sin(phi),dome_base+neck*math.cos(theta)))
df=[]
for j in range(rings):
    for i in range(segments):
        a=j*segments+i
        b=j*segments+(i+1)%segments
        df.append((a,(j+1)*segments+i,(j+1)*segments+(i+1)%segments,b))
building_objects.append(mesh("Cupola | documented 4.3 m hemisphere",dv,df,copper))
for i in range(20):
    phi=2*math.pi*i/20
    points=[]
    for j in range(25):
        theta=(math.pi/2)*j/24
        r=neck+0.045
        points.append((tx+r*math.sin(theta)*math.cos(phi),ty+r*math.sin(theta)*math.sin(phi),dome_base+r*math.cos(theta)))
    tube(f"Cupola copper seam {i+1:02d}",copper_hi,points,0.045)

lantern_h=neck*2/3
lantern_base=dome_base+neck
lr=1.48
cylinder("Lantern | glazed drum",glass,(tx,ty,lantern_base+lantern_h/2),lr,lantern_h,32)
cylinder("Lantern | lower copper ring",copper_hi,(tx,ty,lantern_base+0.08),1.72,0.22,40)
cylinder("Lantern | crown ring",trim,(tx,ty,lantern_base+lantern_h-0.08),1.72,0.25,40)
for i in range(12):
    angle=2*math.pi*i/12
    x,y=tx+1.49*math.cos(angle),ty+1.49*math.sin(angle)
    cylinder(f"Lantern | bronze mullion {i+1:02d}",bronze,(x,y,lantern_base+lantern_h/2),0.055,lantern_h-0.35,8)
cylinder("Lantern | copper cap",copper,(tx,ty,lantern_base+lantern_h+0.2),1.75,0.28,40,0.75)

# Roof runs parallel to the long street elevation. The WFS outline shows that
# this wing is diagonal to map east/west; build its gable in the building's
# fitted axis and taper it where the registered footprint narrows.
eave_z=body_height+0.10
ridge_z=body_height+4.85
main_u,main_n=roof_u,roof_v
west_q,west_r=min(roof_ring,key=lambda p:p[0])
tower_q,tower_r=to_qr(tx,ty)
main_q_start=west_q+0.06
main_q_end=min(roof_q_max-0.06,tower_q+1.0)
main_q_length=max(0.0,main_q_end-main_q_start)
section_count=max(2,int(main_q_length/0.55))
main_roof_depth=14.0

def street_roof_section(q):
    intervals=roof_intervals_at_q(q)
    if not intervals:
        return None
    t=max(0.0,min(1.0,(q-west_q)/max(0.01,tower_q-west_q)))
    target_r=west_r+(tower_r-west_r)*t
    lo,hi=min(intervals,key=lambda span: 0 if span[0]<=target_r<=span[1] else min(abs(target_r-span[0]),abs(target_r-span[1])))
    depth=min(main_roof_depth,hi-lo)
    if depth<0.8:
        return None
    center=max(lo+depth/2,min(hi-depth/2,target_r))
    r_lo,r_hi=center-depth/2,center+depth/2
    def point(r,z):
        x,y=from_qr(q,r)
        return (x,y,z)
    return {"points":[point(r_lo,eave_z),point(center,ridge_z),point(r_hi,eave_z)],
            "center":center,"depth":depth,"rLo":r_lo,"rHi":r_hi}

roof_sections=[]
for index in range(section_count+1):
    q=main_q_start+main_q_length*index/section_count
    section=street_roof_section(q)
    if section:
        roof_sections.append(section["points"])
main_vertices=[v for section in roof_sections for v in section]
main_faces=[]
for si in range(len(roof_sections)-1):
    for j in range(2):
        a=si*3+j
        b=(si+1)*3+j
        main_faces.append((a,b,b+1,a+1))
for section_index in (0,len(roof_sections)-1):
    offset=section_index*3
    cap_points=[Vector((v[1],v[2],0)) for v in roof_sections[section_index]]
    for tri in geometry.tessellate_polygon([cap_points]):
        main_faces.append(tuple(offset+int(i) for i in tri))
building_objects.append(mesh("Roof | long Mannerheimintie wing | fitted gable",main_vertices,main_faces,copper))

# Subtle standing seams make the long copper slopes read as sheet roofing.
for q in [main_q_start+1.0+i*1.35 for i in range(int(max(0,main_q_length-2.0)/1.35))]:
    section=street_roof_section(q)
    if not section:
        continue
    for a,b in ((0,1),(1,2)):
        tube("Street roof | raised copper standing seam",copper_hi,
             [(section["points"][a][0],section["points"][a][1],section["points"][a][2]+0.025),
              (section["points"][b][0],section["points"][b][1],section["points"][b][2]+0.025)],0.026)

def dormer_roof(name, center, tangent, normal, width, depth, spring, peak):
    cx0,cy0=center
    v=[]
    for off in (-depth/2,depth/2):
        for uoff,z in ((-width/2,spring),(width/2,spring),(0,peak)):
            v.append((cx0+tangent[0]*uoff+normal[0]*off,
                      cy0+tangent[1]*uoff+normal[1]*off,z))
    f=[(0,1,2),(3,5,4),(0,3,4,1),(0,2,5,3),(1,4,5,2)]
    return mesh(name,v,f,copper)

# Repeating roof windows on the street-facing slope, placed from the Ylva
# aerial photograph rather than treated as measured fabrication geometry.
dormer_index=0
for q in [main_q_start+8.0+i*4.25 for i in range(14)]:
    section=street_roof_section(q)
    if not section or section["depth"]<5.5:
        continue
    run=section["depth"]/2
    d=min(2.35,run*0.66)
    r=section["center"]-d
    x,y=from_qr(q,r)
    z=eave_z+(ridge_z-eave_z)*d/run
    dormer_index+=1
    box(stone,(x,y),main_u,main_n,1.28,1.08,z-0.20,z+0.80)
    wx,wy=from_qr(q,r-0.54)
    box(glass,(wx,wy),main_u,main_n,0.60,0.08,z+0.02,z+0.66)
    dormer_roof(f"Street roof dormer {dormer_index:02d} | copper hood",(x,y),main_u,main_n,1.40,1.20,z+0.78,z+1.28)

# The inward wing has a perpendicular ridge and one broad gable end toward the
# square. It meets the street roof along the edge rather than crossing it.
wx0,wx1,wrx=-3.4,20.5,8.55
wy0,wy1=gy-0.02,7.0
wpeak=body_height+5.05
wv=[(wx0,wy0,eave_z),(wrx,wy0,wpeak),(wx1,wy0,eave_z),
    (wx0,wy1,eave_z),(wrx,wy1,wpeak),(wx1,wy1,eave_z)]
wf=[(0,3,4,1),(1,4,5,2),(0,1,2)]
building_objects.append(mesh("Roof | Ylioppilasaukio wing | perpendicular gable",wv,wf,copper))
for y in [wy0+1.0+i*1.35 for i in range(int((wy1-wy0-1.0)/1.35))]:
    tube("Square wing roof | raised copper standing seam",copper_hi,
         [(wx0,y,eave_z+0.025),(wrx,y,wpeak+0.025)],0.026)
    tube("Square wing roof | raised copper standing seam",copper_hi,
         [(wrx,y,wpeak+0.025),(wx1,y,eave_z+0.025)],0.026)

for m in materials:
    vertices,faces=batches[m.name]
    if vertices:
        building_objects.append(mesh(m.name,vertices,faces,m))

# Include all architectural objects created above, including individual
# columns, figures, and the gable mouldings, in downloadable geometry.
building_objects=list(bpy.context.scene.objects)

# Preview stage and cameras are not exported with GLB/OBJ.
scene=bpy.context.scene
scene.render.engine="BLENDER_EEVEE"
scene.eevee.taa_render_samples=48
scene.render.resolution_x=1600
scene.render.resolution_y=1280
scene.render.resolution_percentage=100
scene.render.image_settings.file_format="PNG"
scene.view_settings.view_transform="Standard"
scene.view_settings.look="Medium High Contrast"
scene.world.use_nodes=True
scene.world.node_tree.nodes["Background"].inputs["Color"].default_value=(0.83,0.86,0.82,1)
scene.world.node_tree.nodes["Background"].inputs["Strength"].default_value=0.8
stage_mat=mat("Preview stage only",(0.83,0.86,0.82))
bpy.ops.mesh.primitive_plane_add(size=180,location=(0,0,-0.18))
stage=bpy.context.object
stage.name="Preview stage | not exported"
stage.data.materials.append(stage_mat)
def aim(obj,target):
    obj.rotation_euler=(Vector(target)-obj.location).to_track_quat("-Z","Y").to_euler()
bpy.ops.object.light_add(type="AREA",location=(-7,70,76))
key=bpy.context.object
key.data.energy=7800
key.data.shape="DISK"
key.data.size=38
aim(key,(-7,16,18))
bpy.ops.object.light_add(type="AREA",location=(-62,8,42))
fill=bpy.context.object
fill.data.energy=3600
fill.data.size=32
aim(fill,(-5,15,19))
bpy.ops.object.camera_add(location=(-60,148,67))
camera=bpy.context.object
camera.data.type="ORTHO"
camera.data.ortho_scale=90
aim(camera,(-7,10,17))
scene.camera=camera
scene.render.filepath=os.path.join(OUT,"mannerheimintie-5-preview.png")
bpy.ops.render.render(write_still=True)

bpy.ops.object.select_all(action="DESELECT")
for obj in building_objects:
    obj.select_set(True)
bpy.context.view_layer.objects.active=building_objects[0]
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,"mannerheimintie-5.glb"),export_format="GLB",use_selection=True,export_apply=True)
bpy.ops.wm.obj_export(filepath=os.path.join(OUT,"mannerheimintie-5.obj"),export_selected_objects=True,export_materials=True,forward_axis="Y",up_axis="Z")
bpy.ops.object.select_all(action="DESELECT")
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,"mannerheimintie-5.blend"))

photo=os.path.join(OUT,"archive-previews","mansku5-photo.jpeg")
sources={"sourceFootprint":os.path.join(OUT,"source-footprint.json")}
if os.path.exists(photo):
    sources["userSuppliedCurrentPhoto"]=photo
metadata={
 "title":"Uusi ylioppilastalo (ent. Osakuntatalo) · Mannerheimintie 5 · 3D-julkisivuluonnos",
 "created":"2026-11-03","address":source["address"],"buildingName":"Uusi ylioppilastalo (ent. Osakuntatalo)",
 "buildingIdentity":{"RATU":building["properties"]["ratu"],"VTJ-PRT":building["properties"]["vtj_prt"],"parcel":building["properties"]["c_kiinteistotunnus"]},
 "geometrySource":{"provider":building["service"],"featureId":building["featureId"],"retrievedAt":source["retrievedAt"],"crs":"EPSG:3879",
   "footprintAreaM2":building["metrics"]["areaM2"],"registeredFloors":building["properties"]["i_kerrlkm"],"sourceVertices":len(raw),"modelOutlineVertices":len(ring),
   "localOriginEPSG3879":[cx,cy],"exportCoordinates":"Local metres relative to listed EPSG:3879 origin; Z=0 is an assumed ground reference. GLB follows glTF Y-up convention."},
 "facadeReference":{"file":"archive-previews/mansku5-photo.jpeg","description":"User-supplied current photo of Uusi ylioppilastalo; visual reference for the depicted street facade.","licence":"User-supplied; no separate reuse licence statement provided."},
 "domeReference":{"title":"Uusi ylioppilastalo – Kupolitorni","publisher":"Helsingin kaupunginmuseo",
   "url":"https://www.hel.fi/static/liitteet/museo/Lausunnot%202020/HKM%20Uusi%20ylioppilastalo%20torni.pdf",
   "documentedDomeRadiusM":4.3,"documentedNeckHeightM":4.3,"documentedHemisphereRadiusM":4.3,"documentedLanternHeightM":round(lantern_h,3)},
 "siting":{"streetWing":"Mannerheimintien suuntainen pitkä rakennusosa",
   "squareWing":"tontin sisäosaan ja Ylioppilasaukion suuntaan jatkuva rakennusosa",
   "cupolaPlacement":"WFS-jalanjäljen pyöristetyn kulman yhteyteen, local EPSG:3879 metres",
   "referenceUrl":"https://www.finnisharchitecture.fi/projects/new-student-house",
   "method":"WFS-pohjamuoto yhdistetty virallisen arkkitehtuurikuvauksen siipijakoon; tornin tarkka keskipiste on tulkittu pyöristetystä kulmasta."},
 "roofReference":{"visualSource":"Ylvan kohdesivu ja sen ulkokuvat",
   "url":"https://ylva.fi/kohteet/uusi-ylioppilastalo/",
   "layoutSource":"Helsingin yliopiston arkkitehtuurikävely",
   "layoutUrl":"https://www.avoin.helsinki.fi/oppimateriaalit/taidehistoria/virtuaali/uusi_yo.shtml",
   "cityModelCrossCheck":{"title":"Helsinki 3D · rakennukset LoD2","url":"https://www.hel.fi/fi/paatoksenteko-ja-hallinto/tietoa-helsingista/kartat-ja-paikkatieto/helsinki-3d","status":"RATU 391:n ladattu kaupunkimallin kattogeometria kattoi vain osan pohjamuodosta, joten sitä ei käytetty koko katon korvaavana mallina."},
   "mainRidgeAxisDegreesFromLocalEast":-27.0,
   "description":"Pitkän Mannerheimintien siiven harjakatto dormereineen on käännetty seuraamaan rakennusrekisterin vinottaista pitkää akselia. Aukion puoleisella siivellä on erillinen päätykatto. Korotettujen kattojen alle tehty matala kattopinta sulkee muun rekisteripohjan yksinkertaistettuna, saumoitettuna kattokenttänä. Lappeiden liittymät, harjakorkeudet ja dormerien paikat ovat Ylvan ilmakuvista arvioituja, eivät koko katon mittapiirustuksesta.",
   "status":"photo-derived estimate; no full roof plan or measured roof pitch was located"},
 "height":{"mainBodyMetres":body_height,"overallTopMetres":round(lantern_base+lantern_h+0.34,3),"status":"estimated body; documented dome component dimensions",
   "method":"8 registered storeys × approx. 3.1 m. The City Museum documents the 4.3 m dome neck and hemisphere radius, and lantern height of 2/3 × 4.3 m. Tower base is estimated; its plan placement follows the rounded WFS footprint corner."},
 "historicalReferences":[
   {"title":"Mannerheimintie 1–5 / entinen Aleksanterinkatu 25 · rakennuspiirustus, 1885","record":"Yksa 167421508819700","url":"https://yksa.disec.fi/Yksa4/id/167421508819700?view=list&_displayStart=0&back=true&history=1&ref=results&_sort=4%2Cdesc&direction=next&sb_index=13#tab/basic","file":"006.tif","role":"osoitealueen arkistoviite; ei tulkittu nykyisen ylioppilastalon julkisivuksi"},
   {"title":"Stockmann / ABC City · käyttäjän toimittamat 1925 piirustukset","record":"Yksa 167421523809800","url":"https://yksa.disec.fi/Yksa4/id/167421523809800/?view=list&_displayStart=0&back=true&history=1&ref=results&_sort=4%2Cdesc#tab/overview","files":["stokka.jpg","stokkka.jpg"],"role":"erillinen arkistoviite; ei käytetty tämän rakennuksen tunnistukseen tai geometriaan"}],
 "scope":"Helsingin rakennusrekisterin pohjamuoto ja kerrosmäärä yhdistetty kahden siiven sijoitteluun, Ylvan nykykuvissa näkyvään kattomassaan, käyttäjän valokuvaan ja kaupunginmuseon dokumentoimiin kupolin päämittoihin.",
 "limitations":["Visuaalinen luonnos, ei varmennettu nykytilan as-built-, LOD3- tai BIM-malli.",
   "Katon harjakorkeudet, dormerien paikat ja kattokulmat ovat valokuvista arvioituja; koko katon mittapiirustusta ei löytynyt.",
   "Rungon korkeus, tornin korkeusperusta, ikkuna-aukot ja sisäänkäynnin mitoitus ovat arvioita; kupolin ilmoitetut päämitat ovat kaupunginmuseon raportista.",
   "Stockmann / ABC City -kuvia ei käytetty tämän rakennuksen tunnistukseen tai mallin geometriaan.",
   "Ei rakennesuunnitteluun, telineen mitoitukseen tai lupapiirustukseksi ilman mittauksia ja tarkistettuja lähtöpiirustuksia."],
 "files":{"editable":"mannerheimintie-5.blend","webModel":"mannerheimintie-5.glb","geometry":"mannerheimintie-5.obj",
   "preview":"mannerheimintie-5-preview.png","userPhoto":"archive-previews/mansku5-photo.jpeg"},
 "sourceChecksumsSHA256":{name:hashlib.sha256(open(path,"rb").read()).hexdigest() for name,path in sources.items() if os.path.exists(path)}
}
with open(os.path.join(OUT,"model-metadata.json"),"w",encoding="utf-8") as f:
    json.dump(metadata,f,ensure_ascii=False,indent=2)
print("MODEL_CREATED",OUT,"vertices",len(ring),"body",body_height,"total",metadata["height"]["overallTopMetres"])
