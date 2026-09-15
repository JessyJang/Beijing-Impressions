import {grainFlowGLSL} from './grain-flow.js';
import * as T from 'three';
export const WINTER_DURATION=7;
const smooth=(a,b,t)=>T.MathUtils.smootherstep(t,a,b);
const curve=points=>new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)),false,'centripetal');
const winterPath=curve([[44,10,193],[36,12,182],[28,15,173],[21,17,167]]);
export function winterAt(time){
 const t=T.MathUtils.clamp(time,0,WINTER_DURATION);
 return {local:t,position:winterPath.getPointAt(t/7),target:new T.Vector3(-1,16+smooth(0,7,t)*2,140),veil:Math.max(1-smooth(0,.75,t),smooth(6.1,7,t))};
}
export function createWinterFinale(){
 let seed=2593;const r=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
 const scene=new T.Scene();scene.background=new T.Color('#070e17');const camera=new T.PerspectiveCamera(52,1,.05,300);
 const root=new T.Group();root.position.z=140;scene.add(root);
 const clouds=[],uniformSets=[];
 function builder(parent,pointSize=.042){
  const p=[],c=[],n=[],seeds=[];const add=(x,y,z,color,normal=[0,1,0])=>{p.push(x,y,z);const f=.82+r()*.3;c.push(...color.map(v=>v*f));n.push(...normal);seeds.push(r());};
  function surface(count,fn){for(let i=0;i<count;i++)fn(r(),r(),add);}
  function box(x,y,z,w,h,d,color,density=70){
   for(let axis=0;axis<3;axis++)for(const side of [-1,1]){const dims=[w,h,d],a=(axis+1)%3,b=(axis+2)%3,count=Math.ceil(dims[a]*dims[b]*density);surface(count,(u,v)=>{const pos=[x,y,z],norm=[0,0,0];pos[axis]+=side*dims[axis]/2;pos[a]+=(u-.5)*dims[a];pos[b]+=(v-.5)*dims[b];norm[axis]=side;add(...pos,color,norm);});}
  }
  function line(a,b,rad,color,count=600){const axis=new T.Vector3(...b).sub(new T.Vector3(...a)).normalize(),u=new T.Vector3(0,1,0).cross(axis);if(u.length()<.1)u.set(1,0,0);u.normalize();const v=axis.clone().cross(u);surface(count,(t,q)=>{const angle=q*Math.PI*2,norm=u.clone().multiplyScalar(Math.cos(angle)).addScaledVector(v,Math.sin(angle));add(...a.map((x,k)=>x+(b[k]-x)*t+norm.getComponent(k)*rad),color,norm.toArray());});}
  function ellipsoid(x,y,z,rx,ry,rz,color,count=5000){surface(count,(u,v)=>{const h=u*2-1,a=v*6.283,s=Math.sqrt(1-h*h);add(x+rx*s*Math.cos(a),y+ry*h,z+rz*s*Math.sin(a),color,[s*Math.cos(a),h,s*Math.sin(a)]);});}
  function torus(x,y,z,major,minor,color,count=4500){surface(count,(u,v)=>{const a=u*6.283,b=v*6.283,rough=1+(r()-.5)*.12,rr=major+Math.cos(b)*minor*rough;add(x+Math.cos(a)*rr,y+Math.sin(b)*minor*rough,z+Math.sin(a)*rr,color,[Math.cos(a)*Math.cos(b),Math.sin(b),Math.sin(a)*Math.cos(b)]);});}
  function finish(){const g=new T.BufferGeometry();for(const [key,data,size] of [['position',p,3],['color',c,3],['normal',n,3],['seed',seeds,1]])g.setAttribute(key,new T.Float32BufferAttribute(data,size));g.computeBoundingSphere();const uniforms={focal:{value:650},time:{value:0},size:{value:pointSize},reveal:{value:1},presence:{value:1}};
   const m=new T.ShaderMaterial({uniforms,vertexColors:true,alphaToCoverage:true,vertexShader:`attribute float seed;uniform float focal;uniform float time;uniform float size;uniform float reveal;uniform float presence;varying vec3 tint;varying float alpha;
   ${grainFlowGLSL}
   void main(){vec3 p=position;float form=smoothstep(.08+grainRegion(position)*.48,1.,reveal);float born=smoothstep(0.,.16,reveal);p=grainFlow(position,seed,form,time,5.);vec4 v=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*v;gl_PointSize=clamp(focal*size*(.72+pow(seed,5.)*.8)*mix(mix(.85,2.2,step(.84,fract(seed*311.39))),1.,form)/max(.1,-v.z),.65,4.2);float light=.65+.50*max(0.,dot(normalize(normalMatrix*normal),normalize(vec3(-.4,.8,.6))));tint=color*light;alpha=presence*born*mix(mix(.08,.55,step(.84,fract(seed*311.39))),1.,form)*smoothstep(.08,.3,-v.z);}`,
   fragmentShader:`varying vec3 tint;varying float alpha;void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;gl_FragColor=vec4(tint,alpha*(1.-smoothstep(.5,1.,d)));}`});
   const cloud=new T.Points(g,m);cloud.frustumCulled=false;parent.add(cloud);clouds.push(cloud);uniformSets.push(uniforms);return cloud;
  }
  return{add,surface,box,line,ellipsoid,torus,finish};
 }
 const red=[.42,.095,.065],stone=[.31,.35,.37],snow=[.77,.83,.86],gold=[.63,.39,.12],wood=[.27,.085,.05],jade=[.12,.25,.23];
 const b=builder(root);
 // L-shaped palace wall and stone platform; the camera remains outside both arms.
 b.box(-32,4.5,0,80,9,12,red,60);b.box(0,4.5,-32,12,9,80,red,60);
 b.box(-32,.6,6.15,80,1.2,.4,stone);b.box(6.15,.6,-32,.4,1.2,80,stone);
 b.box(-32,9.08,0,80,.16,12,snow,35);b.box(0,9.08,-32,12,.16,80,snow,35);
 b.box(0,9.5,0,15,.7,15,[.53,.57,.59],65);
 for(let side=0;side<4;side++)for(let j=-7;j<=7;j+=1){const a=side*Math.PI/2,x=Math.cos(a)*j-Math.sin(a)*7.2,z=Math.sin(a)*j+Math.cos(a)*7.2;b.line([x,9.8,z],[x,10.5,z],.075,snow,180);}
 // Central 8.73m square with asymmetrical exterior/interior arms, following DPM's plan.
 b.box(0,12.1,0,8.73,4.7,8.73,wood,95);
 b.box(0,12.1,5.15,3.25,4.7,1.60,wood,110);b.box(5.15,12.1,0,1.60,4.7,3.25,wood,110);
 b.box(0,12.1,-6.3,3.25,4.7,3.98,wood,80);b.box(-6.3,12.1,0,3.98,4.7,3.25,wood,80);
 // Three bays with framed lower panels and diagonal upper lattice, not vertical bars.
 function facade(angle,depth,centers,width){
  const at=(x,y)=>[x*Math.cos(angle)-depth*Math.sin(angle),y,x*Math.sin(angle)+depth*Math.cos(angle)];
  const stroke=(x,y,xx,yy,rad=.026,color=gold)=>b.line(at(x,y),at(xx,yy),rad,color,100);
  for(const center of centers){
   const l=center-width/2,h=center+width/2;
   stroke(l,10.15,l,14.0,.075,red);stroke(h,10.15,h,14.0,.075,red);
   for(const y of [10.25,11.2,13.65,14.0])stroke(l,y,h,y,.045,wood);
   for(let panel=0;panel<3;panel++){
    const x=l+(panel+.5)*width/3,w=width/3-.1;
    stroke(x-w/2,10.35,x-w/2,13.6);stroke(x+w/2,10.35,x+w/2,13.6);
    stroke(x-w/2,10.55,x+w/2,10.55,.025,red);
    for(let k=0;k<7;k++){
     const y=11.3+k*.32;
     stroke(x-w/2,y,x+w/2,y+.28,.014,jade);
     stroke(x+w/2,y,x-w/2,y+.28,.014,jade);
    }
   }
  }
 }
 for(let side=0;side<4;side++){
  const angle=side*Math.PI/2;
  facade(angle,4.40,[-2.9,2.9],2.5);
  facade(angle,(side===0||side===3)?5.97:8.31,[0],3.0);
 }
 // Roof groups are sampled as their exposed envelope, not overlapping full skins.
 const roofs=[];
 function roof(cx,cy,cz,w,d,rise,angle=0){roofs.push({cx,cy,cz,w,d,rise,angle});}
 function roofHeight(q,x,z){
  const dx=x-q.cx,dz=z-q.cz,lx=dx*Math.cos(q.angle)+dz*Math.sin(q.angle),lz=-dx*Math.sin(q.angle)+dz*Math.cos(q.angle),hw=q.w/2,hd=q.d/2;
  if(Math.abs(lx)>hw+.00001||Math.abs(lz)>hd+.00001)return -Infinity;
  const g=hw*.55,side=q.rise*Math.pow(Math.max(0,1-Math.abs(lz)/hd),1.35);
  const hip=q.rise*.48*(1-Math.max(0,(Math.abs(lx)-g)/(hw-g)));
  return q.cy+(Math.abs(lx)>g?Math.min(side,hip):side)+.28*Math.pow(Math.abs(lx)/hw,8)*Math.pow(Math.abs(lz)/hd,6);
 }
 function exposed(q,x,y,z){return !roofs.some(o=>o!==q&&o.cy<y+.01&&roofHeight(o,x,z)>y+.035);}
 function roofStroke(q,a,end,radius,count){
  b.surface(count,(u,v)=>{
   const x=a[0]+(end[0]-a[0])*u,y=a[1]+(end[1]-a[1])*u,z=a[2]+(end[2]-a[2])*u;
   if(!exposed(q,x,y,z))return;
   const angle=v*Math.PI*2;
   b.add(x,y+Math.cos(angle)*radius,z+Math.sin(angle)*radius,gold);
  });
 }
 function emitRoofs(){for(const q of roofs){
  const world=(x,z)=>[q.cx+x*Math.cos(q.angle)-z*Math.sin(q.angle),q.cz+x*Math.sin(q.angle)+z*Math.cos(q.angle)];
  b.surface(Math.ceil(q.w*q.d*210),(u,v)=>{
   const lx=(u-.5)*q.w,lz=(v-.5)*q.d,[x,z]=world(lx,lz),y=roofHeight(q,x,z);if(!exposed(q,x,y,z))return;
   const e=.015,hx=roofHeight(q,x+e,z),hz=roofHeight(q,x,z+e);
   const n=new T.Vector3(Number.isFinite(hx)?(y-hx)/e:0,1,Number.isFinite(hz)?(y-hz)/e:0).normalize();
   const edge=1-Math.min(1,Math.abs(lz)/(q.d*.5));
   const sheltered=T.MathUtils.smoothstep(n.y,.68,.94);
   const drift=.045*Math.sin(x*.72+z*.35)+.035*Math.cos(z*1.1-x*.21);
   const snowAmount=T.MathUtils.smoothstep(sheltered*.62+(1-edge)*.16+drift,.25,.65);
   const tile=.88+.12*Math.cos(lx*29),col=gold.map((c,i)=>T.MathUtils.lerp(c*tile,snow[i],snowAmount*.88));
   b.add(x,y+snowAmount*.045,z,col,n.toArray());
  });
  // Triangular gable infill and ridge ornaments make the four upper gables readable.
  for(const side of [-1,1]){
   b.surface(1600,(u,v)=>{const lx=side*q.w*.275,lz=(u-.5)*q.d*.65,[x,z]=world(lx,lz),top=roofHeight(q,x,z),y=q.cy+q.rise*.48+v*Math.max(0,top-q.cy-q.rise*.48);if(exposed(q,x,y,z))b.add(x,y,z,wood,[side*Math.cos(q.angle),0,side*Math.sin(q.angle)]);});
   for(let i=0;i<30;i++){const x1=-q.w/2+q.w*i/30,x2=x1+q.w/30,[ax,az]=world(x1,side*q.d*.499),[bx,bz]=world(x2,side*q.d*.499),ay=roofHeight(q,ax,az),by=roofHeight(q,bx,bz);roofStroke(q,[ax,ay,az],[bx,by,bz],.065,90);}
  }
  const [ax,az]=world(-q.w*.275,0),[bx,bz]=world(q.w*.275,0);
  roofStroke(q,[ax,q.cy+q.rise+.09,az],[bx,q.cy+q.rise+.09,bz],.09,1100);
  for(const side of [-1,1]){const [x,z]=world(side*q.w*.275,0);if(exposed(q,x,q.cy+q.rise,z))b.ellipsoid(x,q.cy+q.rise+.3,z,.13,.36,.13,gold,500);}
 }}
 // Lower waist eaves; middle projecting gables; compact crossed upper xieshan roof.
 roof(0,14.2,0,12.4,12.4,1.85);
 roof(0,14.2,-4.8,5.5,10.1,1.85,Math.PI/2);roof(-4.8,14.2,0,10.1,5.5,1.85);
 roof(0,14.2,4.6,6.2,4.4,1.85,Math.PI/2);roof(4.6,14.2,0,6.2,4.4,1.85);
 b.box(0,16.4,0,7.7,2.4,7.7,wood,95);
 roof(0,17.0,0,11.6,6.2,2.55);roof(0,17.0,0,11.6,6.2,2.55,Math.PI/2);
 roof(0,17.0,4.2,6.8,4.8,2.55,Math.PI/2);roof(4.2,17.0,0,6.8,4.8,2.55);
 roof(0,17.0,-5.1,8.6,4.8,2.55,Math.PI/2);roof(-5.1,17.0,0,8.6,4.8,2.55);
 b.box(0,19.65,0,5.9,1.45,5.9,wood,95);
 roof(0,20.15,0,9.6,5.9,3.7);roof(0,20.15,0,9.6,5.9,3.7,Math.PI/2);
 b.ellipsoid(0,24.22,0,.24,.48,.24,gold,2000);
 // Small bracket blocks create shadowed separation beneath each eave.
 for(const [y,width] of [[13.9,8.7],[16.7,7.7],[19.85,5.9]])for(let side=0;side<4;side++)for(let j=-3;j<=3;j++){
  const a=side*Math.PI/2,x=j*width/7,z=width/2;
  b.box(x*Math.cos(a)-z*Math.sin(a),y,x*Math.sin(a)+z*Math.cos(a),.36,.26,.36,jade,150);
 }
 // Sparse dark moat ice, banks and bare branches establish depth at the wall's foot.
 b.surface(80000,(u,v)=>{const x=-50+u*130,z=9+v*90;b.add(x,-.4,z,[.09+u*.02,.16,.20]);});

 // Terraced stone foot and an irregular snow bank connect the wall to moat ice.
 for(let side=0;side<2;side++){
  const at=(u,v,y)=>side===0?[u,y,v]:[v,y,u];
  for(let tier=0;tier<3;tier++)b.surface(10000,(u,v)=>{
   const along=-70+u*78,across=6.05+tier*.52+v*.55,y=.92-tier*.36;
   b.add(...at(along,across,y),stone.map(c=>c*(.65+tier*.05)));
  });
  b.surface(22000,(u,v)=>{
   const along=-70+u*78,edge=8.0+.25*Math.sin(along*.35)+.12*Math.cos(along*.91),across=edge+v*1.7;
   const y=-.24+.16*(1-v),amount=(1-v)**3*.65;
   b.add(...at(along,across,y),stone.map((c,i)=>T.MathUtils.lerp(c*.38,snow[i],amount)));
  });
 }
 // Far roof fragments and irregular bare trees extend the scene behind the palace wall.
 for(const [x,z,w] of [[-24,-28,9],[-43,-35,11],[-17,-45,8]]){b.box(x,11,z,w,3,5,[.25,.12,.08],35);roof(x,12.6,z,w+2,7,1.8);}
 for(let i=0;i<13;i++){
  const x=-52+i*4.2,z=-18-r()*22,h=17+r()*7,lean=(r()-.5)*2;
  b.line([x,9,z],[x+lean,h,z],.10,[.25,.29,.28],1000);
  for(let j=0;j<6;j++){const y=12+j*(h-12)/7,side=j%2?1:-1,tip=[x+lean+side*(1.8+r()*2.5),y+2+r()*2,z+(r()-.5)*4];b.line([x+lean*.5,y,z],tip,.038,[.29,.32,.30],450);b.line(tip,[tip[0]+side*.9,tip[1]+1.2,tip[2]+1],.018,[.36,.38,.36],200);}
 }
 emitRoofs();
 b.finish();
 function weather(parent,count,steam){const pos=[],seed=[];for(let i=0;i<count;i++){pos.push(steam?(r()-.5)*.4:-30+r()*95,steam?r()*1.8:r()*38,steam?(r()-.5)*.4:-25+r()*95);seed.push(r());}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('seed',new T.Float32BufferAttribute(seed,1));const uniforms={time:{value:0},focal:{value:600},quiet:{value:0}};const material=new T.ShaderMaterial({uniforms,transparent:true,depthWrite:false,blending:steam?T.AdditiveBlending:T.NormalBlending,vertexShader:`attribute float seed;uniform float time;uniform float focal;uniform float quiet;varying float alpha;void main(){vec3 p=position;float t=time*(1.-quiet);${steam?`float h=mod(p.y+t*(.12+seed*.11),.95);p.y=h;p.x+=sin(h*5.+seed*21.+t*.5)*h*.10;p.z+=cos(h*4.+seed*17.)*h*.08;alpha=sin(h/.95*3.14159)*.075;`:`p.y=mod(p.y-t*(.7+seed*.8),38.);p.x+=sin(t*.3+seed*38.)*2.;p.z+=sin(t*.2+seed*27.);alpha=.25+seed*.5;`}vec4 v=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*v;gl_PointSize=clamp(focal*${steam?'.015':'.065'}*(.5+seed)/max(.1,-v.z),.6,${steam?'9.':'5.'});alpha*=smoothstep(.15,1.,-v.z);}`,fragmentShader:`varying float alpha;void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;gl_FragColor=vec4(${steam?'vec3(.70,.65,.51)':'vec3(.78,.87,.96)'},alpha*exp(-d*d*2.));}`});const cloud=new T.Points(g,material);cloud.frustumCulled=false;parent.add(cloud);return {cloud,uniforms};}
 const flakes=weather(root,8500,false);
 const birdPositions=[],birdIds=[],birdSeeds=[];
 for(let id=0;id<5;id++)for(let i=0;i<1600;i++){const u=r(),side=r()<.5?-1:1,wing=r()<.85;birdPositions.push(wing?side*u*.85:(r()-.5)*.12,(r()-.5)*.08,wing?-u*.25+(r()-.5)*.28*(1-u*.8):(r()-.5)*.62);birdIds.push(id);birdSeeds.push(r());}
 const birdGeometry=new T.BufferGeometry();birdGeometry.setAttribute('position',new T.Float32BufferAttribute(birdPositions,3));birdGeometry.setAttribute('bird',new T.Float32BufferAttribute(birdIds,1));birdGeometry.setAttribute('seed',new T.Float32BufferAttribute(birdSeeds,1));
 const birdUniforms={time:{value:0},focal:{value:600},quiet:{value:0}};
 const birdCloud=new T.Points(birdGeometry,new T.ShaderMaterial({uniforms:birdUniforms,transparent:true,depthWrite:false,vertexShader:`attribute float bird;attribute float seed;uniform float time;uniform float focal;uniform float quiet;varying float alpha;void main(){float t=mix(time,3.,quiet);vec3 p=position*(.7+fract(sin(bird*19.)*731.)*.45);float flap=sin(t*(4.+bird*.3)+bird*2.)*.45*(.4+.6*smoothstep(-.3,.5,sin(t*.8+bird)));p.y+=abs(p.x)*flap;p+=vec3(28.-t*(5.5+bird*.18)+bird*2.9,29.+sin(bird*7.)*2.+sin(t*.7+bird)*.25,-2.-bird*2.7);vec4 v=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*v;gl_PointSize=clamp(focal*.045/max(.1,-v.z),.65,3.);alpha=.65+seed*.25;}`,fragmentShader:`varying float alpha;void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;gl_FragColor=vec4(.48,.53,.55,alpha*(1.-smoothstep(.5,1.,d)));}`}));birdCloud.frustumCulled=false;root.add(birdCloud);
 const veil=new T.Mesh(new T.PlaneGeometry(2,2),new T.ShaderMaterial({uniforms:{amount:{value:1},warm:{value:0}},transparent:true,depthTest:false,depthWrite:false,vertexShader:'void main(){gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:'uniform float amount;uniform float warm;void main(){gl_FragColor=vec4(mix(vec3(.018,.03,.045),vec3(.055,.039,.025),warm),amount);}'}));veil.frustumCulled=false;veil.renderOrder=1000;scene.add(veil);
 const caption=document.createElement('aside');caption.className='prelude-caption';caption.innerHTML='<small></small><h1></h1><p></p>';document.body.appendChild(caption);let lastScene;
 return {root,clouds,setPresence(value){uniformSets.forEach(u=>u.presence.value=value);},update(t,quiet,focal){
  root.visible=true;
  uniformSets.forEach(u=>{u.focal.value=focal;u.time.value=t;u.reveal.value=quiet?1:smooth(.3,3.4,t);});
  flakes.uniforms.time.value=t;flakes.uniforms.focal.value=focal;flakes.uniforms.quiet.value=quiet?1:0;
  birdUniforms.time.value=t;birdUniforms.focal.value=focal;birdUniforms.quiet.value=quiet?1:0;
 },counts:clouds.map(c=>c.geometry.attributes.position.count),render(renderer,t,quiet,connected=false){
  const state=winterAt(t);root.visible=true;
  camera.aspect=innerWidth/innerHeight;camera.fov=camera.aspect<1?65:56;camera.updateProjectionMatrix();camera.position.copy(state.position);camera.lookAt(state.target);
  const focal=innerHeight*renderer.getPixelRatio()/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2)));
  uniformSets.forEach((u,i)=>{u.focal.value=focal;u.time.value=t;u.reveal.value=quiet||connected?1:smooth(0,1.25,state.local);});
  for(const item of [flakes]){item.uniforms.time.value=t;item.uniforms.focal.value=focal;item.uniforms.quiet.value=quiet?1:0;}
  birdUniforms.time.value=t;birdUniforms.focal.value=focal;birdUniforms.quiet.value=quiet?1:0;
  veil.material.uniforms.amount.value=connected?0:state.veil;veil.material.uniforms.warm.value=0;
  if(!lastScene){lastScene=true;caption.querySelector('small').textContent='FORBIDDEN CITY · CORNER TOWER';caption.querySelector('h1').textContent='角楼 · 初雪';caption.querySelector('p').textContent='雪落宫墙，飞鸟掠过城的轮廓。';}
  caption.hidden=false;caption.style.opacity=String(smooth(.8,1.6,state.local)*(1-smooth(5.3,6.1,state.local))*(1-state.veil));renderer.render(scene,camera);return 'corner-tower';
 },hide(){caption.hidden=true;}};
}
