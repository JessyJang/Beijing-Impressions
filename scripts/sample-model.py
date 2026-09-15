"""Sample licensed glTF triangle surfaces into an unstructured colored point cloud.
No pixel-grid geometry: UVs are used only to look up the surface color.
"""
import argparse,io,json,struct
from pathlib import Path
import numpy as np
from PIL import Image
p=argparse.ArgumentParser();p.add_argument('input');p.add_argument('output');p.add_argument('--count',type=int,default=1200000);p.add_argument('--height',type=float,default=22);args=p.parse_args()
b=Path(args.input).read_bytes();n=struct.unpack_from('<I',b,12)[0];doc=json.loads(b[20:20+n]);binary=b[28+n:]
dtypes={5120:'i1',5121:'u1',5122:'<i2',5123:'<u2',5125:'<u4',5126:'<f4'};widths={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}
def accessor(i):
 a=doc['accessors'][i];v=doc['bufferViews'][a['bufferView']];dt=np.dtype(dtypes[a['componentType']]);w=widths[a['type']];offset=v.get('byteOffset',0)+a.get('byteOffset',0)
 x=np.ndarray((a['count'],w),dtype=dt,buffer=binary,offset=offset,strides=(v.get('byteStride',w*dt.itemsize),dt.itemsize)).copy()
 if a.get('normalized') and dt.kind in 'iu':x=x.astype(np.float32)/np.iinfo(dt).max
 return x
textures=[]
for im in doc.get('images',[]):
 v=doc['bufferViews'][im['bufferView']];data=binary[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']];textures.append(np.asarray(Image.open(io.BytesIO(data)).convert('RGB')))
meshes=[]
def visit(i,parent):
 node=doc['nodes'][i]
 if 'matrix' in node:m=np.array(node['matrix']).reshape(4,4).T
 else:
  m=np.eye(4);x,y,z,w=node.get('rotation',[0,0,0,1]);m[:3,:3]=np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]])@np.diag(node.get('scale',[1,1,1]));m[:3,3]=node.get('translation',[0,0,0])
 m=parent@m
 if 'mesh' in node:
  for prim in doc['meshes'][node['mesh']]['primitives']:
   attrs=prim['attributes'];pos=accessor(attrs['POSITION']);pos=(np.c_[pos,np.ones(len(pos))]@m.T)[:,:3];idx=accessor(prim['indices']).reshape(-1,3) if 'indices' in prim else np.arange(len(pos)).reshape(-1,3)
   uv=accessor(attrs['TEXCOORD_0']) if 'TEXCOORD_0' in attrs else np.zeros((len(pos),2));mat=doc['materials'][prim.get('material',0)];pbr=mat.get('pbrMetallicRoughness',{});tex=None
   if 'baseColorTexture' in pbr:tex=textures[doc['textures'][pbr['baseColorTexture']['index']]['source']]
   factor=np.array(pbr.get('baseColorFactor',[1,1,1,1])[:3]);meshes.append((pos,idx,uv,tex,factor))
 for child in node.get('children',[]):visit(child,m)
for root in doc['scenes'][doc.get('scene',0)]['nodes']:visit(root,np.eye(4))
allpos=np.concatenate([m[0] for m in meshes]);low=allpos.min(0);high=allpos.max(0);scale=args.height/(high[1]-low[1]);center=(low+high)/2;center[1]=low[1]
rng=np.random.default_rng(8317);prepared=[];total=0
for pos,idx,uv,tex,factor in meshes:
 pos=(pos-center)*scale;tri=pos[idx];cross=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]);area=np.linalg.norm(cross,axis=1)*.5;normal=cross/np.maximum(area[:,None]*2,1e-12)
 # Avoid spending the point budget on a large empty scan skirt.
 height=tri[:,:,1].mean(1);bias=np.where(height<args.height*.10,.20,1.0);weight=area*bias;cdf=np.cumsum(weight);total+=cdf[-1];prepared.append((tri,uv[idx],tex,factor,normal,cdf))
outputs=[]
for tri,uv,tex,factor,normal,cdf in prepared:
 count=round(args.count*cdf[-1]/total);ids=np.searchsorted(cdf,rng.random(count)*cdf[-1]);r=np.sqrt(rng.random(count));s=rng.random(count);w=np.stack([1-r,r*(1-s),r*s],axis=1)
 points=(tri[ids]*w[:,:,None]).sum(1);uvp=(uv[ids]*w[:,:,None]).sum(1)
 if tex is None:rgb=np.tile(factor*255,(count,1))
 else:
  h,wid,_=tex.shape;x=np.clip(uvp[:,0],0,1)*(wid-1);y=np.clip(uvp[:,1],0,1)*(h-1);x0=x.astype(int);y0=y.astype(int);fx=x-x0;fy=y-y0;x1=np.minimum(x0+1,wid-1);y1=np.minimum(y0+1,h-1)
  rgb=((tex[y0,x0]*(1-fx)[:,None]+tex[y0,x1]*fx[:,None])*(1-fy)[:,None]+(tex[y1,x0]*(1-fx)[:,None]+tex[y1,x1]*fx[:,None])*fy[:,None])*factor
 # Radius tracks local sampling density; positions remain on their actual triangles.
 outputs.append((points,rgb,normal[ids]))
pos=np.concatenate([o[0] for o in outputs]).astype('<f4');rgb=np.clip(np.concatenate([o[1] for o in outputs]),0,255).astype('u1');norm=np.clip(np.concatenate([o[2] for o in outputs])*127,-127,127).astype('i1');order=rng.permutation(len(pos));pos=pos[order];rgb=rgb[order];norm=norm[order]
out=Path(args.output);out.parent.mkdir(parents=True,exist_ok=True)
# 16-byte header, then float32 positions, uint8 sRGB colors, int8 normals.
with out.open('wb') as f:f.write(struct.pack('<4sIII',b'BJP3',len(pos),1,0));f.write(pos.tobytes());f.write(rgb.tobytes());f.write(norm.tobytes())
meta={'source':Path(args.input).name,'points':len(pos),'bounds':[pos.min(0).tolist(),pos.max(0).tolist()],'originalBounds':[low.tolist(),high.tolist()],'scale':scale,'bytes':out.stat().st_size,'triangles':sum(len(m[1]) for m in meshes)};out.with_suffix('.json').write_text(json.dumps(meta,indent=2));print(json.dumps(meta))
