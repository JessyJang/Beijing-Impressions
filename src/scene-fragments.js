import {attachSpatialField} from './particle-fields.js';
import {noiseGLSL} from './particle-noise.js';
import * as T from 'three';
// An abstract courtyard fragment for the film's edit, not a surveyed Tiantan entrance.
export function createSceneFragments(){
 let state=7951;const rnd=()=>{state=(1664525*state+1013904223)>>>0;return state/4294967296;};
 const pos=[],col=[],norm=[],seeds=[];const root=new T.Group();
 function sample(geometry,matrix,count,base){
  const p=geometry.attributes.position,ids=geometry.index;const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),cross=new T.Vector3();let total=0;const faces=[];
  for(let i=0;i<(ids?ids.count:p.count);i+=3){const idx=[0,1,2].map(j=>ids?ids.getX(i+j):i+j);a.fromBufferAttribute(p,idx[0]).applyMatrix4(matrix);b.fromBufferAttribute(p,idx[1]).applyMatrix4(matrix);c.fromBufferAttribute(p,idx[2]).applyMatrix4(matrix);cross.crossVectors(b.clone().sub(a),c.clone().sub(a));const area=cross.length()/2;if(area<1e-6)continue;total+=area;faces.push({a:a.clone(),b:b.clone(),c:c.clone(),n:cross.clone().normalize(),end:total});}
  const color=new T.Color(base);
  for(let i=0;i<count;i++){const q=rnd()*total;let lo=0,hi=faces.length-1;while(lo<hi){const mid=(lo+hi)>>1;if(faces[mid].end<q)lo=mid+1;else hi=mid;}const f=faces[lo],u=Math.sqrt(rnd()),v=rnd();const x=f.a.clone().multiplyScalar(1-u).addScaledVector(f.b,u*(1-v)).addScaledVector(f.c,u*v);
   const edge=Math.abs(x.x)>13&&x.z>40;if(edge&&rnd()<.48)continue;
   const brickY=(x.y/.33)%1,brickX=((x.x+(Math.floor(x.y/.33)%2)*.49)/.98)%1;let shade=.74+rnd()*.36;const mortar=Math.abs(brickY)<.065||Math.abs(brickX)<.025;if(mortar)shade*=.5;
   shade*=.7+.3*Math.max(0,f.n.dot(new T.Vector3(-.4,.8,.5).normalize()));pos.push(x.x,x.y,x.z);col.push(color.r*shade,color.g*shade,color.b*shade);norm.push(f.n.x,f.n.y,f.n.z);seeds.push(rnd());
  }
 }
 const shape=new T.Shape();shape.moveTo(-21,0);shape.lineTo(21,0);shape.lineTo(21,21);shape.lineTo(-21,21);shape.closePath();const hole=new T.Path();hole.absarc(0,8.2,5.45,0,Math.PI*2,true);shape.holes.push(hole);
 const gate=new T.ExtrudeGeometry(shape,{depth:1.25,bevelEnabled:false,curveSegments:100});sample(gate,new T.Matrix4().makeTranslation(0,0,46),620000,'#868681');
 const ring=new T.TorusGeometry(5.46,.17,8,120);sample(ring,new T.Matrix4().makeTranslation(0,8.2,47.32),60000,'#aaa698');
 for(const side of [-1,1]){
  sample(new T.BoxGeometry(.8,17,29),new T.Matrix4().makeTranslation(side*12,8.5,62),240000,'#777c7b');
  sample(new T.BoxGeometry(1.1,1,30),new T.Matrix4().makeTranslation(side*12,17,62),15000,'#454e50');
 }
 sample(new T.BoxGeometry(17,.15,49),new T.Matrix4().makeTranslation(0,0,55),65000,'#9a9283');
 // Bare branch silhouettes supply very close lateral parallax without inventing a landmark.
 function branch(a,b,r,count){const delta=b.clone().sub(a),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.clone().normalize());const m=new T.Matrix4().compose(a.clone().add(b).multiplyScalar(.5),q,new T.Vector3(1,1,1));sample(new T.CylinderGeometry(r*.55,r,delta.length(),7),m,count,'#696761');}
 for(const side of [-1,1]){const base=new T.Vector3(side*8,0,59+side*3),top=new T.Vector3(side*7.7,19,58+side*3);branch(base,top,.45,15000);for(let j=0;j<7;j++){const a=base.clone().lerp(top,.38+j*.08),b=a.clone().add(new T.Vector3(-side*(2+rnd()*4),2+rnd()*4,rnd()*4-2));branch(a,b,.07,2500);}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setAttribute('normal',new T.Float32BufferAttribute(norm,3));g.setAttribute('seed',new T.Float32BufferAttribute(seeds,1));
 attachSpatialField(g,.32,.83);
 const uniforms={time:{value:0},focal:{value:500},quiet:{value:0}};
 const mat=new T.ShaderMaterial({uniforms,vertexColors:true,alphaToCoverage:true,vertexShader:`attribute float spatialField;attribute float seed;uniform float time;uniform float focal;uniform float quiet;varying vec3 tint;varying float alpha;${noiseGLSL}
void main(){vec3 p=position;float field=spatialField;float radius=length(vec2(p.x,p.y-8.2));float delay=abs(radius-5.46)*.075+field*.24;float appear=smoothstep(delay,delay+.55,time);if(quiet>.5)appear=1.;float peel=smoothstep(4.7,7.,time)*smoothstep(.52,.92,field)*(1.-quiet);vec3 scatter=(hashVector(vec3(seed*971.,seed*139.,seed*357.))-.5)*12.;p+=scatter*(1.-appear);vec4 v=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*v;gl_PointSize=clamp(focal*(.020+seed*.012)/max(.2,-v.z), .8,4.2);float rim=1.-smoothstep(.18,.45,abs(length(vec2(position.x,position.y-8.2))-5.46));float coverageMask=max(rim*.95,smoothstep(.30,.68,field));alpha=appear*coverageMask*(1.-smoothstep(6.5,8.1,time))*smoothstep(.2,1.,-v.z);tint=color*(.5+.5*field)*mix(.72,1.,rim)*.38;alpha*=.68;}`,fragmentShader:`varying vec3 tint;varying float alpha;${noiseGLSL}
void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.||alpha<.025)discard;gl_FragColor=vec4(tint,alpha*(1.-smoothstep(.5,1.,r)));
#include <colorspace_fragment>
}`});
 const cloud=new T.Points(g,mat);cloud.frustumCulled=false;root.add(cloud);
 return{root,uniforms,count:seeds.length};
}
