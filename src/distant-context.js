import * as T from 'three';
import {PLACES} from './spatial-route.js';
// Fragmented architectural constellations, composed from the credited existing assets.
// This is an imagined spatial montage, not a reconstruction of Beijing's street layout.
export function createDistantContext(scene,models){
 const roots=[];
 const picks=models.map(model=>{const a=model.cloud.geometry.attributes.position,ids=[],height=model.bounds.max.y;for(let k=0;k<Math.min(240000,a.count);k++)if(a.getY(k)>height*.18)ids.push(k);return new T.BufferAttribute(new Uint32Array(ids),1);});
 const material=new T.ShaderMaterial({vertexColors:true,transparent:true,depthWrite:false,
 vertexShader:`varying vec3 tint;varying float alpha;void main(){vec4 v=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*v;gl_PointSize=1.;tint=mix(color*.5,vec3(.10,.16,.23),.62);alpha=.22*(1.-smoothstep(150.,320.,-v.z))*smoothstep(20.,55.,-v.z);}`,
 fragmentShader:`varying vec3 tint;varying float alpha;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;gl_FragColor=vec4(tint,alpha*(1.-r*.5));}`});
 for(let i=0;i<PLACES.length;i++){
  const root=new T.Group();root.position.fromArray(PLACES[i].anchor);scene.add(root);roots.push(root);
  for(let j=0;j<6;j++){
   const source=models[(i+j+2)%models.length].cloud.geometry,g=new T.BufferGeometry();g.setAttribute('position',source.attributes.position);g.setAttribute('color',source.attributes.color);g.setIndex(picks[(i+j+2)%models.length]);
   const points=new T.Points(g,material);const side=j%2?1:-1;
   points.position.set(side*(60+(j%3)*40),-9+j%3*3,-55-Math.floor(j/2)*40);points.scale.setScalar(.16+(j%3)*.1);points.rotation.y=j*.57;points.frustumCulled=false;root.add(points);
  }
  // Broken orbital dust traces extend the composition beyond the building.
  const p=[];let seed=3201+i;const r=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let j=0;j<7000;j++){const a=r()*Math.PI*2,rad=24+r()*70;p.push(Math.cos(a)*rad,-5+Math.sin(a*3)*2+(r()-.5)*.5,Math.sin(a)*rad*.6-30);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));root.add(new T.Points(g,new T.PointsMaterial({color:0x627a94,size:.055,transparent:true,opacity:.18,depthWrite:false})));
 }
 return{update(place){roots.forEach((root,i)=>root.visible=i===place);}};
}
