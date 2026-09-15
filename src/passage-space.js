import * as T from 'three';
import {WINTER_ENTRY_START,WINTER_ENTRY_END,WINTER_EXIT_START,WINTER_EXIT_END} from './winter-route.js';
// Sparse spatial markers beside the camera path, never a screen-space wipe.
export function createPassageSpace(scene,route){
 const phases=[[WINTER_ENTRY_START,WINTER_ENTRY_END],[WINTER_EXIT_START,WINTER_EXIT_END]],items=[];
 let aspectCache;
 function rebuild(aspect){
  for(const item of items){scene.remove(item.cloud);item.cloud.geometry.dispose();item.cloud.material.dispose();}items.length=0;
  let seed=337;const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
  for(const [start,end] of phases){
   const p=[],colors=[],sizes=[],samples=Array.from({length:130},(_,i)=>route.at(start+(end-start)*i/129,aspect).position);
   for(let i=0;i<18000;i++){
    const q=.12+random()*.76,index=Math.min(128,Math.floor(q*129)),position=samples[index].clone().lerp(samples[index+1],q*129-index);
    const forward=samples[index+1].clone().sub(samples[index]).normalize(),side=new T.Vector3().crossVectors(forward,new T.Vector3(0,1,0)).normalize();
    const branch=i<12500,k=Math.floor(q*12),sideSign=k%2?1:-1;
    const offset=branch?sideSign*(7+Math.sin(q*45)*1.6):((random()-.5)*36);
    const y=branch?(random()-.5)*22:(random()-.5)*30;
    const point=position.clone().addScaledVector(side,offset+ (branch?Math.sin(y*.5+k)*.45:0));point.y+=y;
    p.push(...point);const c=branch?[.22,.27,.29]:[.49,.57,.62];const shade=.5+random()*.5;colors.push(...c.map(v=>v*shade));sizes.push(branch?.035+random()*.025:.045+random()**5*.19);
   }
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setAttribute('size',new T.Float32BufferAttribute(sizes,1));
   const uniforms={amount:{value:0},focal:{value:600}};
   const m=new T.ShaderMaterial({uniforms,vertexColors:true,transparent:true,depthWrite:false,vertexShader:`attribute float size;uniform float amount;uniform float focal;varying vec3 tint;varying float alpha;void main(){vec4 v=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*v;gl_PointSize=clamp(focal*size/max(.2,-v.z),.5,14.);alpha=amount*smoothstep(.4,2.,-v.z)*(1.-smoothstep(35.,95.,-v.z));tint=color;}`,fragmentShader:`varying vec3 tint;varying float alpha;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;gl_FragColor=vec4(tint,alpha*(1.-smoothstep(.3,1.,r)));}`});
   const cloud=new T.Points(g,m);cloud.frustumCulled=false;scene.add(cloud);items.push({cloud,uniforms,start,end});
  }
 }
 return {update(time,aspect,focal,quiet){if(aspectCache!==aspect){aspectCache=aspect;rebuild(aspect);}for(const item of items){const q=(time-item.start)/(item.end-item.start);item.cloud.visible=q>0&&q<1&&!quiet;item.uniforms.amount.value=T.MathUtils.smootherstep(q,0,.22)*(1-T.MathUtils.smootherstep(q,.8,1));item.uniforms.focal.value=focal;}}};
}
