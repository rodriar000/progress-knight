import bpy,math,os,sys
from pathlib import Path
from mathutils import Vector
from math import sin,cos,pi
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene
source=str(Path(__file__).resolve().parents[1] / 'art/actors/hero-source.webp')
image=bpy.data.images.load(source)
W,H=image.size
step=16
nx=W//step;ny=H//step
vertices=[];uvs=[];faces=[]
for iy in range(ny+1):
 for ix in range(nx+1):
  x=ix*step; y=iy*step
  vertices.append(((x-W/2)/400,0,(H-y-H/2)/400))
  uvs.append((x/W,1-y/H))
for iy in range(ny):
 for ix in range(nx):
  a=iy*(nx+1)+ix;faces.append((a,a+1,a+nx+2,a+nx+1))
mesh=bpy.data.meshes.new('Deformable illustration');mesh.from_pydata(vertices,[],faces);mesh.update()
obj=bpy.data.objects.new('Hero',mesh);scene.collection.objects.link(obj)
mesh.uv_layers.new(name='UVMap')
for poly in mesh.polygons:
 for loop_idx in poly.loop_indices:
  mesh.uv_layers.active.data[loop_idx].uv=uvs[mesh.loops[loop_idx].vertex_index]
mat=bpy.data.materials.new('Illustration');mat.use_nodes=True;mat.blend_method='CLIP';mat.alpha_threshold=.08
nodes=mat.node_tree.nodes;nodes.clear();tex=nodes.new('ShaderNodeTexImage');tex.image=image
em=nodes.new('ShaderNodeEmission');out=nodes.new('ShaderNodeOutputMaterial');transparent=nodes.new('ShaderNodeBsdfTransparent');mix=nodes.new('ShaderNodeMixShader')
links=mat.node_tree.links;links.new(tex.outputs['Color'],em.inputs['Color']);links.new(tex.outputs['Alpha'],mix.inputs[0]);links.new(transparent.outputs[0],mix.inputs[1]);links.new(em.outputs[0],mix.inputs[2]);links.new(mix.outputs[0],out.inputs['Surface'])
mesh.materials.append(mat)
scene.render.engine='CYCLES';scene.cycles.samples=1;scene.cycles.use_denoising=False;scene.view_layers[0].cycles.use_denoising=False
scene.render.resolution_x=520;scene.render.resolution_y=520;scene.render.resolution_percentage=100
scene.render.film_transparent=True;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
scene.view_settings.view_transform='Standard'
bpy.ops.object.camera_add(location=(0,-6,0));cam=bpy.context.object
cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=3.3;scene.camera=cam

def rotate(x,y,cx,cy,angle):
 dx=x-cx;dy=y-cy
 return cx+dx*cos(angle)-dy*sin(angle), cy+dx*sin(angle)+dy*cos(angle)

def move_point(x,y,t,mode):
 phase=2*pi*t
 if mode=='walk':
  b=sin(phase); torso=.013*sin(phase+pi/2); leg_a=.1*b
  left_angle=-.16*b; right_angle=.16*b
 elif mode=='work':
  b=sin(phase); torso=.02*b;leg_a=.01*b
  left_angle=-.15-.22*b;right_angle=.17+.22*b
 elif mode=='study':
  b=sin(phase);torso=.008*b;leg_a=.004*b
  left_angle=-.32-.035*b;right_angle=.32+.035*b
 elif mode=='train':
  b=sin(phase);torso=.02*b;leg_a=.025*b
  left_angle=-.07*b;right_angle=.2+.48*b
 elif mode=='magic':
  b=sin(phase);torso=.015*b;leg_a=.008*b
  left_angle=-.22-.06*b;right_angle=.32+.12*b
 else:
  b=sin(phase);torso=.008*b;leg_a=.005*b
  left_angle=-.04*b;right_angle=.04*b
 # Upright central body breathes and bobs, textured joint areas blend across 15px.
 def blend(a,b,k): return a*(1-k)+b*k
 # Arms at x<520 and x>770, endpoints follow shoulders continuously.
 if y>260 and y<665 and x<550:
  k=max(0,min(1,(550-x)/100))
  ax,ay=rotate(x,y,520,310,left_angle)
  if y>430:
   ex,ey=rotate(ax,ay,430,445,-.06*b)
   ax,ay=blend(ax,ex,min(1,(y-420)/50)),blend(ay,ey,min(1,(y-420)/50))
  x,y=blend(x,ax,k),blend(y,ay,k)
 elif y>260 and y<665 and x>770:
  k=max(0,min(1,(x-770)/100))
  ax,ay=rotate(x,y,760,310,right_angle)
  if y>430:
   ex,ey=rotate(ax,ay,860,445,.06*b)
   ax,ay=blend(ax,ex,min(1,(y-420)/50)),blend(ay,ey,min(1,(y-420)/50))
  x,y=blend(x,ax,k),blend(y,ay,k)
 # Blend between the two hip transformations through the transparent gap.
 if y>645:
  k=min(1,max(0,(y-640)/55))
  lx,ly=rotate(x,y,555,655,leg_a)
  rx,ry=rotate(x,y,705,655,-leg_a)
  r=max(0,min(1,(x-530)/200))
  r=r*r*(3-2*r)
  ax,ay=blend(lx,rx,r),blend(ly,ry,r)
  x,y=blend(x,ax,k),blend(y,ay,k)
 return x+torso*100,y+(abs(b)*7 if mode=='walk' else .7*b)

original=[((v.co.x*400)+W/2,H/2-v.co.z*400) for v in mesh.vertices]
mode=sys.argv[-1] if len(sys.argv)>1 and sys.argv[-1] in ('walk','work','study','train','magic','idle') else 'walk'
output=Path(sys.argv[-2]) if len(sys.argv)>2 and sys.argv[-1] in ('walk','work','study','train','magic','idle') else Path('/tmp') / f'progress-knight-{mode}'
output.mkdir(parents=True,exist_ok=True)
frames=24 if mode=='walk' else 48
for frame in range(frames):
 t=frame/frames
 for vertex,(x,y) in zip(mesh.vertices,original):
  nx,ny=move_point(x,y,t,mode)
  vertex.co.x=(nx-W/2)/400;vertex.co.z=(H/2-ny)/400
 mesh.update()
 scene.render.filepath=str(output / f'{frame:03d}.png')
 bpy.ops.render.render(write_still=True)
 print('FRAME',mode,frame,flush=True)
