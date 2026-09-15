import {attachSpatialField} from './particle-fields.js';
import * as T from 'three';
import {noiseGLSL} from './particle-noise.js';
// Original, typological hutong staging. Not a reconstruction of a named street.
export function createCourtyardEnvironment(){
 let s=98231;const r=()=>((s=Math.imul(s,1664525)+1013904223>>>0)/4294967296);
 const p=[],c=[],seed=[],kind=[];
 function point(x,y,z,color,k=0){p.push(x,y,z);c.push(...color);seed.push(r());kind.push(k);}
 function surface(fn,count,base,type=0){
  for(let i=0;i<count;i++){
   const [x,y,z]=fn(r(),r());
   const patch=.65+.22*Math.sin(x*.44+z*.21)*Math.sin(y*.7-z*.18);
   // Disintegrating boundaries leave connected islands, rather than uniform thinning.
   const boundary=Math.max(Math.abs(x)/36,Math.max(0,z-38)/24);
   if(r()<Math.max(0,boundary-.62)*(.6+.4*Math.sin(z*.8+y)))continue;
   let shade=.82+r()*.3;
   if(type===0){const row=Math.floor(y/.26);if(y%.26<.016||((Math.abs(x)+Math.abs(z)+row*.26)%.52)<.018)shade*=.48;}
   if(type===1){if(Math.abs(x)%.24<.025)shade*=1.38;shade*=.8+.2*Math.cos(z*2.5);}
   if(type===2){if(Math.abs(x)%.9<.025||Math.abs(z)%1.4<.025)shade*=.48;}
   point(x,y,z,base.map(v=>v*shade*(.7+patch*.4)),type);
  }
 }
 const stone=[.29,.32,.34],tile=[.19,.23,.27],earth=[.34,.30,.24];
 surface((u,v)=>[(u-.5)*19,.13,(v-.5)*18],320000,earth,2);
 // The street narrows toward the actual opening in the courtyard's front house.
 surface((u,v)=>[(u-.5)*26,-.06,10+v*49],650000,earth,2);
 for(const side of [-1,1]){
  surface((u,v)=>[side*6, v*5.5,18+u*37],115000,stone);
  surface((u,v)=>[side*(6+u*13),5.5+2.1*Math.sin(v*Math.PI),18+v*34],85000,tile,1);
  surface((u,v)=>[side*(6+u*13),v*5.5,18],28000,stone);
  // Capstones, recessed brick panels and warm door frames give the passage scale.
  surface((u,v)=>[side*(5.85+u*.4),5.6,18+v*37],14000,[.39,.39,.35],1);
  for(const z of [28,42]){
   surface((u,v)=>[side*5.96,v*3.4,z+u*1.8],10000,[.19,.09,.045]);
   surface((u,v)=>[side*5.93,1.7+v*1.3,z+.22+u*1.35],9000,[.52,.30,.10]);
  }
  // Low roof silhouettes beyond the courtyard, at related scale and ground height.
  for(let j=0;j<3;j++)surface((u,v)=>[side*(18+j*7+u*7),3+Math.sin(v*Math.PI)*2.8,-18+v*16-j*7],17000,tile,1);
 }
 function branch(a,b,radius,n){const axis=new T.Vector3(...b).sub(new T.Vector3(...a)),u=new T.Vector3(0,0,1).cross(axis).normalize(),v=axis.clone().normalize().cross(u);surface((t,q)=>{const theta=q*Math.PI*2,rad=radius*(1-t*.7);return new T.Vector3(...a).addScaledVector(axis,t).addScaledVector(u,Math.cos(theta)*rad).addScaledVector(v,Math.sin(theta)*rad).toArray();},n,[.27,.24,.19],3);}
 for(const [x,z] of [[-4.7,32],[4.6,20],[-7,-3]]){
  branch([x,0,z],[x+.3,10,z-1],.25,10000);
  for(let j=0;j<8;j++){
   const a=[x+.2,4.5+j*.53+r()*.7,z-.6],b=[x+(r()-.5)*9,8+r()*5,z+(r()-.5)*8];branch(a,b,.06,2200);
   for(let k=0;k<900;k++){const angle=r()*6.28,ny=r()*2-1,volume=Math.cbrt(r()),rad=volume*Math.sqrt(1-ny*ny)*(1.8+.45*Math.sin(angle*3+j));if(volume>.72&&Math.sin(angle*5+ny*4+j)>.65)continue;point(b[0]+Math.cos(angle)*rad,b[1]+ny*volume*1.9,b[2]+Math.sin(angle)*rad*.8,[.42+r()*.2,.25+r()*.15,.065],4);}
  }
 }
 // Sparse larger leaf particles drift through the passage at real world depths.
 for(let i=0;i<700;i++)point((r()-.5)*11,r()*12,17+r()*36,[.68,.40,.10],5);
 const geometry=new T.BufferGeometry();for(const [name,data,size] of [['position',p,3],['color',c,3],['seed',seed,1],['kind',kind,1]])geometry.setAttribute(name,new T.Float32BufferAttribute(data,size));
 attachSpatialField(geometry,.32);
 const uniforms={presence:{value:1},local:{value:0},focal:{value:600},quiet:{value:0}};
 const material=new T.ShaderMaterial({uniforms,vertexColors:true,alphaToCoverage:true,vertexShader:`
 uniform float presence;attribute float spatialField;attribute float seed;attribute float kind;uniform float local;uniform float focal;uniform float quiet;varying vec3 tint;varying float alpha;varying float leaf;
 ${noiseGLSL}
 void main(){vec3 p=position;float field=spatialField;float delay=(55.-p.z)*.014+field*.3;float form=smoothstep(delay,delay+.9,local);if(quiet>.5)form=1.;
 vec3 random=hashVector(vec3(seed*713.,seed*231.,seed*91.));p+=(random-.5)*vec3(3.,2.,4.)*(1.-form);
 leaf=step(3.5,kind);if(kind>3.5&&quiet<.5){p.x+=sin(local*.65+seed*30.)*.25;p.z+=cos(local*.5+seed*20.)*.3;}
 if(kind>4.5&&quiet<.5){p.y=mod(position.y-local*(.25+seed*.5)+30.,12.);p.x+=sin(local*.7+seed*20.)*1.1;}
 vec4 view=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*view;
 float diameter=mix(.043,.08,pow(seed,4.));if(kind>3.5)diameter=.06+seed*.13;
 gl_PointSize=clamp(focal*diameter/max(.2,-view.z),.65,kind>3.5?13.:6.);
 float densityMask=smoothstep(.16,.6,field);alpha=presence*form*mix(.38,.98,densityMask)*smoothstep(.3,1.4,-view.z)*(1.-smoothstep(75.,140.,-view.z));
 tint=color*(.82+field*.46);tint=mix(tint,vec3(.09,.13,.17),smoothstep(20.,100.,-view.z)*.65);
 }`,fragmentShader:`varying vec3 tint;varying float alpha;varying float leaf;void main(){vec2 q=gl_PointCoord-.5;if(leaf>.5)q=vec2(q.x+q.y*.45,q.y*1.45);float d=length(q)*2.;if(d>1.)discard;gl_FragColor=vec4(tint,alpha*(1.-smoothstep(.55,1.,d)));}`});
 const root=new T.Points(geometry,material);root.position.set(160,0,-300);root.frustumCulled=false;
 return{root,uniforms,count:seed.length};
}
