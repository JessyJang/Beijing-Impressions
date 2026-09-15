import * as T from 'three';
import {routeAt,PLACES,TOTAL} from './spatial-route.js';
// World-space depth markers remain in the scene as the crane turns past them.
export function createForegroundMotes(scene){
 const p=[],seed=[];let state=911;const r=()=>{state=(state*1664525+1013904223)>>>0;return state/4294967296;};
 for(let i=0;i<PLACES.length*160;i++){
  const index=Math.floor(i/160),spec=PLACES[index];const shot=routeAt(spec.start+r()*((PLACES[index+1]?.start??TOTAL)-spec.start-.1));
  const direction=shot.target.clone().sub(shot.position).normalize();
  const side=new T.Vector3().crossVectors(direction,new T.Vector3(0,1,0)).normalize();
  const point=shot.position.clone().addScaledVector(side,(i%2?1:-1)*(3+r()*13)).addScaledVector(direction,(r()-.5)*18);
  point.y+=(r()-.5)*22;p.push(...point.toArray());seed.push(r());
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('seed',new T.Float32BufferAttribute(seed,1));
 const uniforms={time:{value:0},focal:{value:500},warm:{value:0},quiet:{value:0},aspect:{value:1}};
 const m=new T.ShaderMaterial({uniforms,transparent:true,depthWrite:false,vertexShader:`attribute float seed;uniform float time;uniform float focal;uniform float quiet;uniform float aspect;varying float alpha;void main(){
 vec3 p=position;p.x+=sin(time*.18+seed*29.)*.3;p.y+=sin(time*.23+seed*43.)*.45;
 vec4 v=modelViewMatrix*vec4(p,1.);float depth=-v.z;
 gl_Position=projectionMatrix*v;gl_PointSize=clamp(focal*(.09+seed*.19)/max(.3,depth),2.,38.);
 alpha=smoothstep(.8,3.,depth)*(1.-smoothstep(15.,36.,depth))*(.1+seed*.15)*(1.-quiet);

 }`,fragmentShader:`uniform float warm;varying float alpha;void main(){float r=length(gl_PointCoord-.5)*2.;float a=exp(-r*r*4.)*(1.-smoothstep(.7,1.,r))*alpha;if(a<.002)discard;gl_FragColor=vec4(mix(vec3(.57,.72,.78),vec3(.92,.74,.47),warm),a);}`});
 const points=new T.Points(g,m);points.frustumCulled=false;scene.add(points);
 return{uniforms};
}
