import bpy, math, os, json
from mathutils import Vector, Matrix
from pathlib import Path

OUT = Path(os.environ.get('OUT_DIR','dist'))
OUT.mkdir(parents=True, exist_ok=True)
(OUT/'qa').mkdir(exist_ok=True)

# ---------- scene ----------
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
scene.render.engine='BLENDER_EEVEE_NEXT' if hasattr(scene,'eevee') or bpy.app.version >= (4,2,0) else 'BLENDER_EEVEE'
scene.render.resolution_x=1000; scene.render.resolution_y=1000; scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
if scene.world is None:
    scene.world=bpy.data.worlds.new('World')
scene.world.color=(0.035,0.045,0.055)

# ---------- materials ----------
def mat(name, color, metallic=0, rough=.55, alpha=1):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,alpha); m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value=(*color,1)
    bs.inputs['Roughness'].default_value=rough
    bs.inputs['Metallic'].default_value=metallic
    if alpha<1:
        bs.inputs['Alpha'].default_value=alpha
        if hasattr(m,'surface_render_method'):m.surface_render_method='DITHERED'
    return m
SKIN=mat('Peau neutre',(0.65,0.43,0.32),0,.62)
SKIN_LIGHT=mat('Peau claire',(0.78,0.56,0.43),0,.58)
SHORTS=mat('Short médical',(0.025,0.17,0.19),0,.48)
EYE=mat('Yeux',(0.035,0.045,0.05),0,.3)
MUSCLE_PRIMARY=mat('Muscle principal',(0.92,0.08,0.045),0,.35,.82)
MUSCLE_SECONDARY=mat('Muscle secondaire',(1.0,0.35,0.035),0,.42,.76)
MUSCLE_STABILIZER=mat('Muscle stabilisateur',(0.98,0.68,0.08),0,.48,.70)
FLOOR=mat('Sol',(0.08,0.11,0.13),0,.78)

# ---------- geometry ----------
def smooth(obj):
    if obj.type=='MESH':
        for p in obj.data.polygons:p.use_smooth=True
    return obj

def uv(name, loc, scale, material, seg=32, rings=20):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=rings, location=loc)
    o=bpy.context.object;o.name=name;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    smooth(o);o.data.materials.append(material);return o

def cube_round(name, loc, scale, material, bevel=.12):
    bpy.ops.mesh.primitive_cube_add(location=loc);o=bpy.context.object;o.name=name;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    mod=o.modifiers.new('Adouci','BEVEL');mod.width=bevel;mod.segments=4
    bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name);smooth(o);o.data.materials.append(material);return o

def capsule(name,a,b,r,material,taper=1.0):
    a=Vector(a);b=Vector(b);d=b-a;L=d.length;mid=(a+b)/2
    bpy.ops.mesh.primitive_cone_add(vertices=32, radius1=r*taper, radius2=r, depth=L, location=mid)
    o=bpy.context.object;o.name=name;o.rotation_mode='QUATERNION';o.rotation_quaternion=Vector((0,0,1)).rotation_difference(d.normalized())
    smooth(o);o.data.materials.append(material)
    s1=uv(name+'_head',a,(r*taper,r*taper,r*taper),material,24,14)
    s2=uv(name+'_tail',b,(r,r,r),material,24,14)
    return [o,s1,s2]

def parent_keep(obj, arm, bone):
    mw=obj.matrix_world.copy();obj.parent=arm;obj.parent_type='BONE';obj.parent_bone=bone;obj.matrix_world=mw

# ---------- armature ----------
rest={
'pelvis':((0,0,1.00),(0,0,1.18),None),'spine':((0,0,1.18),(0,0,1.42),'pelvis'),'chest':((0,0,1.42),(0,0,1.62),'spine'),'neck':((0,0,1.62),(0,0,1.76),'chest'),'head':((0,0,1.76),(0,0,1.98),'neck'),
'clavicle.L':((0,0,1.57),(.25,0,1.58),'chest'),'upper_arm.L':((.25,0,1.58),(.57,0,1.48),'clavicle.L'),'forearm.L':((.57,0,1.48),(.84,0,1.32),'upper_arm.L'),'hand.L':((.84,0,1.32),(1.00,-.015,1.25),'forearm.L'),
'clavicle.R':((0,0,1.57),(-.25,0,1.58),'chest'),'upper_arm.R':((-.25,0,1.58),(-.57,0,1.48),'clavicle.R'),'forearm.R':((-.57,0,1.48),(-.84,0,1.32),'upper_arm.R'),'hand.R':((-.84,0,1.32),(-1.00,-.015,1.25),'forearm.R'),
'thigh.L':((.14,0,1.02),(.15,0,.58),'pelvis'),'shin.L':((.15,0,.58),(.14,0,.14),'thigh.L'),'foot.L':((.14,0,.14),(.14,-.25,.08),'shin.L'),
'thigh.R':((-.14,0,1.02),(-.15,0,.58),'pelvis'),'shin.R':((-.15,0,.58),(-.14,0,.14),'thigh.R'),'foot.R':((-.14,0,.14),(-.14,-.25,.08),'shin.R')}
arm_data=bpy.data.armatures.new('KinesioRig');arm=bpy.data.objects.new('KinesioRig',arm_data);bpy.context.collection.objects.link(arm);bpy.context.view_layer.objects.active=arm;arm.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
for name,(h,t,parent) in rest.items():
    eb=arm_data.edit_bones.new(name);eb.head=h;eb.tail=t
    if parent:eb.parent=arm_data.edit_bones[parent]
bpy.ops.object.mode_set(mode='POSE')
for pb in arm.pose.bones:pb.rotation_mode='QUATERNION'
bpy.ops.object.mode_set(mode='OBJECT')

# ---------- body ----------
parts=[]
parts += [(uv('Thorax',(0,0,1.47),(.32,.20,.30),SKIN_LIGHT),'chest'),(uv('Abdomen',(0,.005,1.23),(.245,.17,.25),SKIN),'spine'),(uv('Bassin',(0,.005,1.01),(.29,.21,.21),SHORTS),'pelvis')]
parts += [(uv('Crâne',(0,0,1.91),(.16,.145,.20),SKIN_LIGHT),'head'),(uv('Mâchoire',(0,-.025,1.80),(.125,.115,.11),SKIN_LIGHT),'head'),(uv('Oreille.L',(.155,0,1.88),(.025,.018,.055),SKIN),'head'),(uv('Oreille.R',(-.155,0,1.88),(.025,.018,.055),SKIN),'head')]
parts += [(uv('Nez',(0,-.142,1.88),(.025,.035,.045),SKIN_LIGHT,20,12),'head'),(uv('Œil.L',(.055,-.137,1.93),(.018,.009,.012),EYE,16,10),'head'),(uv('Œil.R',(-.055,-.137,1.93),(.018,.009,.012),EYE,16,10),'head')]
for o in capsule('Cou',(0,0,1.62),(0,0,1.77),.085,SKIN,.92):parts.append((o,'neck'))
for side,s in [('L',1),('R',-1)]:
    shoulder=(.25*s,0,1.58);elbow=(.57*s,0,1.48);wrist=(.84*s,0,1.32);hand=(.98*s,-.015,1.25)
    parts.append((uv(f'Deltoïde.{side}',shoulder,(.125,.13,.135),SKIN_LIGHT),f'upper_arm.{side}'))
    for o in capsule(f'Bras.{side}',shoulder,elbow,.095,SKIN_LIGHT,.92):parts.append((o,f'upper_arm.{side}'))
    for o in capsule(f'Avant-bras.{side}',elbow,wrist,.075,SKIN,.86):parts.append((o,f'forearm.{side}'))
    parts.append((uv(f'Coude.{side}',elbow,(.08,.075,.08),SKIN),f'forearm.{side}'))
    parts.append((cube_round(f'Main.{side}',hand,(.09,.04,.055),SKIN,.035),f'hand.{side}'))
for side,s in [('L',1),('R',-1)]:
    hip=(.14*s,0,1.02);knee=(.15*s,0,.58);ankle=(.14*s,0,.14);foot=(.14*s,-.18,.09)
    for o in capsule(f'Cuisse.{side}',hip,knee,.13,SKIN_LIGHT,.92):parts.append((o,f'thigh.{side}'))
    parts.append((uv(f'Genou.{side}',knee,(.095,.09,.09),SKIN),f'shin.{side}'))
    for o in capsule(f'Mollet.{side}',knee,ankle,.095,SKIN,.78):parts.append((o,f'shin.{side}'))
    parts.append((cube_round(f'Pied.{side}',foot,(.09,.18,.06),SKIN,.045),f'foot.{side}'))
for obj,bone in parts: parent_keep(obj,arm,bone)

# ---------- muscle overlays ----------
muscles=[]
def muscle(name,loc,scale,bone,level):
    m={3:MUSCLE_PRIMARY,2:MUSCLE_SECONDARY,1:MUSCLE_STABILIZER}[level]
    o=uv(name,loc,scale,m,24,14);o['muscle_level']=level;o['muscle_name']=name;parent_keep(o,arm,bone);muscles.append(o);return o
muscle('Deltoïde gauche',(.29,-.09,1.58),(.135,.06,.13),'upper_arm.L',3)
muscle('Pectoral gauche',(.15,-.18,1.50),(.16,.045,.15),'chest',2)
muscle('Triceps gauche',(.45,.075,1.48),(.06,.055,.18),'upper_arm.L',3)
muscle('Coiffe gauche',(.24,.09,1.58),(.10,.035,.10),'clavicle.L',2)
muscle('Dentelé gauche',(.22,-.15,1.34),(.075,.035,.16),'chest',2)
muscle('Trapèze inférieur',(0,.17,1.40),(.14,.035,.20),'chest',1)

# ---------- exercise poses ----------
def quadruped():
    return {'pelvis':(0,.42,.70),'spine':(0,.22,.73),'chest':(0,-.08,.71),'neck':(0,-.28,.73),'head':(0,-.43,.77),'lShoulder':(.27,-.10,.70),'rShoulder':(-.27,-.10,.70),'lElbow':(.31,-.12,.39),'rElbow':(-.31,-.12,.39),'lWrist':(.31,-.30,.08),'rWrist':(-.31,-.30,.08),'lHand':(.31,-.41,.06),'rHand':(-.31,-.41,.06),'lHip':(.15,.42,.68),'rHip':(-.15,.42,.68),'lKnee':(.18,.62,.10),'rKnee':(-.18,.62,.10),'lAnkle':(.18,.79,.08),'rAnkle':(-.18,.79,.08),'lToe':(.18,.93,.06),'rToe':(-.18,.93,.06)}
def copy(p):return {k:tuple(v) for k,v in p.items()}
q=quadruped();back=copy(q);low=copy(q);front=copy(q);up=copy(q)
for k in ['pelvis','spine','chest','neck','head','lShoulder','rShoulder','lHip','rHip']:
    x,y,z=back[k];back[k]=(x,y+.22,z)
back['pelvis']=(0,back['pelvis'][1],.82);back['lHip']=(.15,back['lHip'][1],.80);back['rHip']=(-.15,back['rHip'][1],.80)
low.update({'head':(0,-.43,.13),'neck':(0,-.28,.22),'chest':(0,-.10,.26),'spine':(0,.17,.38),'pelvis':(0,.49,.54),'lShoulder':(.31,-.17,.25),'rShoulder':(-.31,-.17,.25),'lElbow':(.46,-.42,.14),'rElbow':(-.46,-.42,.14)})
front.update({'head':(0,-.92,.20),'neck':(0,-.70,.25),'chest':(0,-.47,.28),'spine':(0,-.12,.34),'pelvis':(0,.32,.48),'lShoulder':(.31,-.50,.28),'rShoulder':(-.31,-.50,.28),'lElbow':(.43,-.57,.16),'rElbow':(-.43,-.57,.16)})
up.update({'head':(0,-.93,.78),'neck':(0,-.72,.64),'chest':(0,-.47,.54),'spine':(0,-.10,.47),'pelvis':(0,.34,.49),'lShoulder':(.31,-.50,.55),'rShoulder':(-.31,-.50,.55),'lElbow':(.34,-.56,.34),'rElbow':(-.34,-.56,.34)})
bone_points={'pelvis':('pelvis','spine'),'spine':('spine','chest'),'chest':('chest','neck'),'neck':('neck','head'),'head':('neck','head'),'clavicle.L':('chest','lShoulder'),'upper_arm.L':('lShoulder','lElbow'),'forearm.L':('lElbow','lWrist'),'hand.L':('lWrist','lHand'),'clavicle.R':('chest','rShoulder'),'upper_arm.R':('rShoulder','rElbow'),'forearm.R':('rElbow','rWrist'),'hand.R':('rWrist','rHand'),'thigh.L':('lHip','lKnee'),'shin.L':('lKnee','lAnkle'),'foot.L':('lAnkle','lToe'),'thigh.R':('rHip','rKnee'),'shin.R':('rKnee','rAnkle'),'foot.R':('rAnkle','rToe')}
order=['pelvis','spine','chest','neck','head','clavicle.L','upper_arm.L','forearm.L','hand.L','clavicle.R','upper_arm.R','forearm.R','hand.R','thigh.L','shin.L','foot.L','thigh.R','shin.R','foot.R']
def apply_pose(pose,frame):
    bpy.context.view_layer.objects.active=arm
    for name in order:
        pb=arm.pose.bones[name];a=Vector(pose[bone_points[name][0]]);b=Vector(pose[bone_points[name][1]]);d=b-a
        if d.length<1e-5:continue
        qrot=Vector((0,1,0)).rotation_difference(d.normalized());pb.matrix=Matrix.Translation(a) @ qrot.to_matrix().to_4x4()
        pb.keyframe_insert('location',frame=frame);pb.keyframe_insert('rotation_quaternion',frame=frame);pb.keyframe_insert('scale',frame=frame)
act=bpy.data.actions.new('Pompe_plongeante');arm.animation_data_create();arm.animation_data.action=act
for f,p in [(1,back),(24,low),(48,front),(72,up),(96,q),(120,back)]:apply_pose(p,f)
scene.frame_start=1;scene.frame_end=120;scene.render.fps=24
for fc in act.fcurves:
    for kp in fc.keyframe_points:kp.interpolation='BEZIER'

# ---------- stage ----------
bpy.ops.mesh.primitive_plane_add(size=8,location=(0,0,0));floor=bpy.context.object;floor.name='Sol';floor.data.materials.append(FLOOR)
bpy.ops.object.light_add(type='AREA',location=(3,-4,5));key=bpy.context.object;key.data.energy=1000;key.data.shape='DISK';key.data.size=5
bpy.ops.object.light_add(type='AREA',location=(-3,-1,3));fill=bpy.context.object;fill.data.energy=650;fill.data.size=4
bpy.ops.object.light_add(type='AREA',location=(0,4,4));rim=bpy.context.object;rim.data.energy=800;rim.data.size=3
bpy.ops.object.camera_add(location=(3.3,-4.2,2.2));cam=bpy.context.object;scene.camera=cam
def track(obj,pt):obj.rotation_euler=(Vector(pt)-obj.location).to_track_quat('-Z','Y').to_euler()
track(cam,(0,0,.85));cam.data.lens=58

# ---------- evidence + export ----------
for frame,name in [(1,'dive-01-back'),(30,'dive-02-low'),(56,'dive-03-front'),(78,'dive-04-up')]:
    scene.frame_set(frame);scene.render.filepath=str(OUT/'qa'/f'{name}.png');bpy.ops.render.render(write_still=True)
scene.frame_set(1)
bpy.ops.export_scene.gltf(filepath=str(OUT/'kinesio-human.glb'),export_format='GLB',export_animations=True,export_skins=True,export_apply=False,export_yup=True)
meta={'blender':bpy.app.version_string,'actions':[a.name for a in bpy.data.actions],'objects':len(bpy.data.objects),'muscles':[o.name for o in muscles]}
(OUT/'model-report.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2))
