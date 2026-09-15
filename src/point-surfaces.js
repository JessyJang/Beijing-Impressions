import * as T from 'three';
// Surface-area sampling preserves shape and animation hierarchy, with no solid body underneath.
export function pointify(root, material, density=1800) {
 const meshes=[];root.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh&&!o.material.transparent)meshes.push(o);});
 let seed=1719;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 for(const mesh of meshes){
  const g=mesh.geometry,index=g.index,pos=g.attributes.position,uv=g.attributes.uv;
  const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),edge=new T.Vector3(),cross=new T.Vector3();
  const p=[],colors=[],weights=[];let pixels=null;
  const img=mesh.material.map?.image;
  if(img?.getContext){const ctx=img.getContext('2d');pixels=ctx.getImageData(0,0,img.width,img.height);}
  const base=mesh.material.color??new T.Color('white');
  for(let i=0;i<(index?index.count:pos.count);i+=3){const ids=[0,1,2].map(j=>index?index.getX(i+j):i+j);a.fromBufferAttribute(pos,ids[0]);b.fromBufferAttribute(pos,ids[1]);c.fromBufferAttribute(pos,ids[2]);edge.subVectors(b,a);cross.subVectors(c,a).cross(edge);const area=cross.length()/2;
   const count=Math.min(18000,Math.ceil(area*density));
   for(let n=0;n<count;n++){const u=Math.sqrt(random()),v=random(),wa=1-u,wb=u*(1-v),wc=u*v;p.push(a.x*wa+b.x*wb+c.x*wc,a.y*wa+b.y*wb+c.y*wc,a.z*wa+b.z*wb+c.z*wc);const col=base.clone();
    if(pixels&&uv){const tx=uv.getX(ids[0])*wa+uv.getX(ids[1])*wb+uv.getX(ids[2])*wc,ty=uv.getY(ids[0])*wa+uv.getY(ids[1])*wb+uv.getY(ids[2])*wc;const offset=(Math.min(pixels.height-1,Math.floor((1-ty)*pixels.height))*pixels.width+Math.min(pixels.width-1,Math.floor(tx*pixels.width)))*4;col.setRGB(pixels.data[offset]/255,pixels.data[offset+1]/255,pixels.data[offset+2]/255,T.SRGBColorSpace);}
    col.multiplyScalar(.75+random()*.45);colors.push(col.r,col.g,col.b);weights.push(.8+random()*.3);
   }
  }
  const cloudGeo=new T.BufferGeometry();cloudGeo.setAttribute('position',new T.Float32BufferAttribute(p,3));cloudGeo.setAttribute('color',new T.Float32BufferAttribute(colors,3));cloudGeo.setAttribute('weight',new T.Float32BufferAttribute(weights,1));
  mesh.material=mesh.material.clone();mesh.material.visible=false;mesh.add(new T.Points(cloudGeo,material));
 }
}
