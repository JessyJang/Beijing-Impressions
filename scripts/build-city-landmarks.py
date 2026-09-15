"""Original interpretive geometry. References and limitations: docs/resources.md.
No photograph is used as texture or depth. All samples occupy analytic 3D surfaces.
"""
import numpy as np, struct,json
from pathlib import Path
rng=np.random.default_rng(9301);parts=[]
def add(p,n,c):
 p=np.asarray(p);n=np.broadcast_to(n,p.shape).copy();c=np.broadcast_to(c,p.shape).astype(float).copy();c*=rng.uniform(.87,1.1,(len(p),1));parts.append((p,n,c))
def surface(fn,count,color):
 u=rng.random(count);v=rng.random(count);p=fn(u,v);e=.0001;n=np.cross(fn(u+e,v)-p,fn(u,v+e)-p);n/=np.maximum(np.linalg.norm(n,axis=1)[:,None],1e-9);c=color(u,v,p) if callable(color) else color;add(p,n,c)
def quad(a,b,c,d,count,color):
 a,b,c,d=map(np.array,[a,b,c,d]);surface(lambda u,v:a+(b-a)*u[:,None]+(d-a)*v[:,None]+(a-b+c-d)*(u*v)[:,None],count,color)
def box(center,size,count,color):
 x,y,z=center;w,h,d=np.array(size)/2;verts=np.array([[x-w,y-h,z-d],[x+w,y-h,z-d],[x+w,y+h,z-d],[x-w,y+h,z-d],[x-w,y-h,z+d],[x+w,y-h,z+d],[x+w,y+h,z+d],[x-w,y+h,z+d]])
 for ids in [[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[3,7,6,2],[0,1,5,4]]:quad(*verts[ids],count//6,color)
def finish(name,reference):
 global parts
 p=np.concatenate([x[0] for x in parts]);n=np.concatenate([x[1] for x in parts]);c=np.concatenate([x[2] for x in parts]);ix=rng.permutation(len(p));p=p[ix].astype('<f4');n=np.clip(n[ix]*127,-127,127).astype('i1');c=np.clip(c[ix],0,255).astype('u1');dest=Path('public/assets/beijing/models')/name
 dest.with_suffix('.points').write_bytes(struct.pack('<4sIII',b'BJP3',len(p),1,0)+p.tobytes()+c.tobytes()+n.tobytes());dest.with_suffix('.json').write_text(json.dumps({'points':len(p),'bounds':[p.min(0).tolist(),p.max(0).tolist()],'source':'Original interpretive procedural geometry','reference':reference},indent=2));print(name,len(p));parts=[]
def brick(u,v,p):
 row=np.floor(p[:,1]/.23);mortar=(np.mod(p[:,1],.23)<.018)|(np.mod(p[:,0]+row*.24,.48)<.018);col=np.tile([105.,110.,112.],(len(u),1));col[mortar]*=.5;return col
def house(cx,cz,width,depth,turn=False,height=4.2):
 def world(p):
  q=p.copy()
  if turn:q[:,[0,2]]=q[:,[2,0]];q[:,0]*=-1
  q[:,0]+=cx;q[:,2]+=cz;return q
 # Roof has many independent curved tile ribs and an upturned ridge end.
 for side in [-1,1]:
  def roof(u,v):
   x=(u-.5)*(width+1.4);z=side*v*(depth/2+.65);y=height+2.2*np.maximum(0,1-v)**1.7+.022*np.cos(x/.15*np.pi*2)+.25*(np.abs(x)/(width/2+.7))**12
   return world(np.c_[x,y,z])
  surface(roof,62000,lambda u,v,p:np.tile([92.,102.,116.],(len(u),1))*(.75+.25*np.cos(u[:,None]*(width+1.4)/.15*6.28)**2))
 for side in [-1,1]:
  def wall(u,v):return world(np.c_[(u-.5)*width,v*height,np.full(len(u),side*depth/2)])
  def facade(u,v,p):
   x=(u-.5)*width;y=v*height;bay=np.mod(x+width/2,2.4);window=(y>1.3)&(y<3.4)&(bay>.24)&(bay<2.14);frame=(np.mod(bay,.3)<.035)|(np.mod(y,.35)<.035);col=brick(u,v,p);col[window]=[48,59,66];col[window&frame]=[147,55,37];col[bay<.13]=[152,45,29];return col
  surface(wall,62000,facade)
 for side in [-1,1]:surface(lambda u,v:world(np.c_[np.full(len(u),side*width/2),v*height,(u-.5)*depth]),18000,brick)
 # Raised stone base, entrance steps; gable infill beneath the roof.
 for side in [-1,1]:surface(lambda u,v:world(np.c_[np.full(len(u),side*width/2),height+v*2.2*np.maximum(0,1-abs(u*2-1))**1.7,(u-.5)*depth]),13000,brick)
 for i in range(3):
  center=world(np.array([[0,.12+i*.12,depth/2+.8-i*.18]]))[0];size=[width,.24,.35] if not turn else [.35,.24,width];box(center,size,5000,[125,124,117])
# Typical enclosed courtyard, not a claimed address or replica of the reference model.
house(0,-11,21,5,height=5);house(-12,0,17,5,True);house(12,0,17,5,True);house(-7,11,10,4);house(7,11,10,4)
box([0,.05,0],[20,.1,19],65000,lambda u,v,p:np.tile([105.,104.,99.],(len(u),1))*np.where((np.mod(p[:,0],.8)<.025)|(np.mod(p[:,2],1.3)<.025),.5,1.)[:,None])
# Short central entrance volume; passage details are simplified.
house(0,13.8,4.2,2.4,height=3.8)
finish('siheyuan','Traditional Beijing courtyard typology; andertan visual reference, not copied mesh')
# CCTV: two inclined towers at different depths, connected by a cranked cantilever.
def glass(u,v,p):
 floor=np.mod(p[:,1],.45)<.026; mull=np.mod(u*20,1)<.075;diag=(np.mod(u*5+v*8,1)<.04)|(np.mod(u*5-v*8,1)<.04)
 c=np.tile([98.,132.,153.],(len(u),1));c*= (.72+.28*np.sin(u*28+v*13)**2)[:,None];c[floor|mull]=[145,164,174];c[diag]=[43,65,81];return c
def loft(low,high,w,d,count):
 low=np.array(low);high=np.array(high);corners=np.array([[-w/2,0,-d/2],[w/2,0,-d/2],[w/2,0,d/2],[-w/2,0,d/2]])
 for i in range(4):
  j=(i+1)%4;quad(low+corners[i],low+corners[j],high+corners[j],high+corners[i],count//4,glass)
 quad(*(high+corners),count//10,[133,156,164])
loft([-10,0,5],[-6.8,30,1.8],7,7,240000);loft([9.8,0,-7],[6.7,32,-9.8],7.5,7.5,250000)
# The bridge turns in plan; an open central void remains under its soffit.
def beam(a,b,w,h,count):
 a=np.array(a);b=np.array(b);direction=(b-a)/np.linalg.norm(b-a);side=np.cross(direction,[0,1,0]);side/=np.linalg.norm(side);up=np.cross(side,direction)
 corners=np.array([-side*w/2-up*h/2,side*w/2-up*h/2,side*w/2+up*h/2,-side*w/2+up*h/2])
 for i in range(4):j=(i+1)%4;quad(a+corners[i],b+corners[i],b+corners[j],a+corners[j],count//4,glass)
beam([-6.8,27,1.8],[6.7,29,1.8],7,6,140000);beam([6.7,29,1.8],[6.7,29,-9.8],7.5,6,130000)
box([0,.4,0],[28,.8,25],45000,glass)
finish('cctv','OMA CCTV Headquarters: leaning towers, cranked loop, diagonal exoskeleton; simplified external massing')
# CITIC: proportions from KPF, 78m base / 54m waist / 69m top / 528m height.
H=48
def zun(u,v):
 a=u*2*np.pi;f=np.where(v<.5,54+24*(1-2*v)**2,54+15*((v-.5)*2)**2);radius=f/528*H/2
 c=np.cos(a);s=np.sin(a);x=np.sign(c)*np.abs(c)**.32*radius;z=np.sign(s)*np.abs(s)**.32*radius
 return np.c_[x,v*H,z]
def zun_glass(u,v,p):
 ribs=np.mod(u*120,1)<.11;floor=np.mod(v*109,1)<.035;c=np.tile([88.,121.,149.],(len(u),1));c*= (.72+.28*np.cos(u*12)**2)[:,None];c[ribs]=[169,184,189];c[floor]=[52,75,94];c[v>.96]*=1.2;return c
surface(zun,760000,zun_glass)
surface(lambda u,v:zun(u,np.ones(len(u)))*np.c_[v,np.ones(len(u)),v],14000,[142,165,183])
box([0,.1,0],[9,.2,9],25000,[108,122,139]);finish('chinazun','KPF CITIC Tower official dimensions; interpretive rounded-square vase profile, simplified facade')
