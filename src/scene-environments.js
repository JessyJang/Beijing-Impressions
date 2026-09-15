import {attachSpatialField} from './particle-fields.js';
import * as T from 'three';
import {noiseGLSL} from './particle-noise.js';
import {stageObject,scenePresence,PLACES} from './spatial-route.js';

// Authored spatial context at the landmark's scale, not a surveyed city model.
// Surface kinds: stone 0, roof 1, paving 2, bark 3, foliage 4,
// glass 5, light 6, steam 7, drifting leaf 8, moving light 9.
function builder(sceneIndex){
 let state=38147+sceneIndex*9103;const rnd=()=>((state=Math.imul(state,1664525)+1013904223>>>0)/4294967296);
 const pos=[],rgb=[],seeds=[],kinds=[],normals=[];
 const stats={surfaces:0,trees:0,buildings:0},colliders=[];
 function point(p,color,kind=0,n=[0,1,0]){pos.push(...p);rgb.push(...color);kinds.push(kind);seeds.push(rnd());normals.push(...n);}
 function surface(fn,count,color,kind=0){
  stats.surfaces++;
  for(let i=0;i<count;i++){
   const u=rnd(),v=rnd(),p=fn(u,v),a=fn(u+.0001,v),b=fn(u,v+.0001);
   const n=new T.Vector3(...a).sub(new T.Vector3(...p)).cross(new T.Vector3(...b).sub(new T.Vector3(...p))).normalize().toArray();
   let shade=.84+rnd()*.26;
   if(kind===0){const row=Math.floor(p[1]/.32);if(p[1]%.32<.022||(Math.abs(p[0])+Math.abs(p[2])+row*.3)%.6<.022)shade*=.46;}
   if(kind===1)shade*=.72+.28*Math.cos((p[0]+p[2])/.22*Math.PI)**2;
   if(kind===2){if(Math.abs(p[0])%1.6<.04||Math.abs(p[2])%2.4<.04)shade*=.45;}
   if(kind===3)shade*=.55+.45*Math.sin(u*70)**2;
   if(kind===5){
    const floor=Math.abs(p[1])%1.2<.07,mullion=(Math.abs(p[0])+Math.abs(p[2]))%1.1<.06;
    const lit=Math.sin(Math.floor(p[1]/1.2)*17+Math.floor((p[0]+p[2])/1.1)*71)>.71;
    if(lit&&!floor&&!mullion){point(p,[.48,.37,.22],kind,n);continue;}
    shade*=floor||mullion?1.6:.45+.4*Math.sin(u*10+v*7)**2;
   }
   point(p,color.map(x=>x*shade),kind,n);
  }
 }
 function quad(a,b,c,d,count,color,kind=0){surface((u,v)=>a.map((x,k)=>x+(b[k]-x)*u+(d[k]-x)*v+(x-b[k]+c[k]-d[k])*u*v),count,color,kind);}
 function box(x,y,z,w,h,d,count,color,kind=0){
  colliders.push({min:[x-w/2,y,z-d/2],max:[x+w/2,y+h,z+d/2]});
  const v=[[x-w/2,y,z-d/2],[x+w/2,y,z-d/2],[x+w/2,y+h,z-d/2],[x-w/2,y+h,z-d/2],[x-w/2,y,z+d/2],[x+w/2,y,z+d/2],[x+w/2,y+h,z+d/2],[x-w/2,y+h,z+d/2]];
  const faces=[[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[3,7,6,2]],areas=[w*h,w*h,d*h,d*h,w*d],total=areas.reduce((a,b)=>a+b);
  faces.forEach((ids,i)=>quad(...ids.map(k=>v[k]),Math.ceil(count*areas[i]/total),color,kind));
 }
 function branch(a,b,r,count){
  const axis=new T.Vector3(...b).sub(new T.Vector3(...a)),u=new T.Vector3(0,0,1).cross(axis).normalize(),v=axis.clone().normalize().cross(u);
  surface((t,q)=>{const angle=q*Math.PI*2,rad=r*(1-t*.64);return new T.Vector3(...a).addScaledVector(axis,t).addScaledVector(u,Math.cos(angle)*rad).addScaledVector(v,Math.sin(angle)*rad).toArray();},count,[.23,.22,.18],3);
 }
 function tree(x,z,height=17,evergreen=true){
  stats.trees++;const lean=(rnd()-.5)*2.8,phase=rnd()*6.28,spread=.8+rnd()*.65,branches=6+Math.floor(rnd()*4);
  branch([x,0,z],[x+lean,height,z-.3],height*(.021+rnd()*.012),6500);
  for(let i=0;i<branches;i++){
   const level=.28+rnd()*.56,angle=phase+i*2.39+(rnd()-.5),reach=(2+rnd()*4)*spread;
   const a=[x+lean*level,height*level,z],b=[x+lean+Math.cos(angle)*reach,a[1]+1+rnd()*4,z+Math.sin(angle)*reach];branch(a,b,.06+rnd()*.07,1450);
   const radius=(2.1+rnd()*1.6)*spread,stretch=.55+rnd()*.8;
   for(let j=0;j<2000;j++){
    const q=rnd()*6.283,ny=rnd()*2-1,rr=Math.cbrt(rnd()),lobe=.82+.18*Math.sin(q*3+phase);
    const rad=rr*Math.sqrt(1-ny*ny)*radius*lobe,y=ny*rr*radius*stretch;
    if(rr>.7&&Math.sin(q*5+ny*7+phase)>.7)continue;
    point([b[0]+Math.cos(q)*rad,b[1]+y,b[2]+Math.sin(q)*rad*.8],evergreen?[.10+rnd()*.06,.17+rnd()*.10,.12]:[.38+rnd()*.22,.23+rnd()*.16,.065],4);
   }
  }
 }
 function roof(x,z,w,d,y,count=22000){
  for(const side of [-1,1])surface((u,v)=>[x+(u-.5)*(w+1),y+2.4*(1-v)**1.6+.18*Math.pow(Math.abs(u*2-1),12),z+side*v*(d/2+.5)],count/2,[.22,.26,.28],1);
 }
 function tower(x,z,w,d,h,count=32000){
  stats.buildings++;const tier=stats.buildings%3,step=tier===0?.16:tier===1?.26:0;
  const shaft=h*(1-step),tint=tier===0?[.26,.34,.39]:tier===1?[.19,.31,.42]:[.27,.33,.35];
  box(x,0,z,w,shaft,d,Math.floor(count*.86),tint,5);
  if(step)box(x+w*.07,shaft,z-d*.07,w*.72,h-shaft,d*.76,Math.floor(count*.14),tint,5);
  else box(x,shaft-.1,z,w,.1,d,Math.floor(count*.14),tint,5);
  for(const sx of [-1,1])for(const sz of [-1,1])surface((u,v)=>[x+sx*w/2+(u-.5)*.10,v*shaft,z+sz*d/2],1300,[.31,.46,.57],6);
  for(let y=3;y<shaft;y+=2.7+tier*.7)for(const side of [-1,1])surface((u,v)=>[x+(u-.5)*w,y+v*.055,z+side*d/2],480,[.24,.37,.46],6);
  box(x,shaft,z,w+.2,.14,d+.2,1700,[.40,.55,.61],6);
 }
 function person(x,z,coat){
  // Dense point silhouettes stay subordinate to the architecture.
  surface((u,v)=>{const a=u*Math.PI*2;return[x+Math.cos(a)*.28,1.1+v*.9,z+Math.sin(a)*.2];},1500,coat,0);
  surface((u,v)=>{const a=u*Math.PI*2,y=v*2-1,f=Math.sqrt(1-y*y);return[x+Math.cos(a)*f*.2,2.2+y*.24,z+Math.sin(a)*f*.2];},900,[.48,.35,.25],0);
  for(const side of [-1,1])branch([x+side*.15,.07,z],[x+side*.12,1.2,z],.1,750);
 }
 return{point,surface,quad,box,tree,roof,tower,person,rnd,stats,finish(){
  const geometry=new T.BufferGeometry();for(const [name,data,size] of [['position',pos,3],['color',rgb,3],['seed',seeds,1],['kind',kinds,1],['normal',normals,3]])geometry.setAttribute(name,new T.Float32BufferAttribute(data,size));
  attachSpatialField(geometry,.19,.63);geometry.computeBoundingBox();return{geometry,count:seeds.length,stats,colliders};
 }};
}
function temple(){
 const b=builder(0);
 // The broad paved forecourt and wooded margins remain present after the opening gate.
 b.surface((u,v)=>[(u-.5)*106,-.12,(v-.5)*125],510000,[.34,.34,.30],2);
 for(const [x,z,h] of [[-30,34,20],[-39,6,23],[-35,-23,20],[-48,-45,23],[29,48,21],[40,35,19],[51,2,24],[43,-35,21]])b.tree(x,z,h,true);
 for(const side of [-1,1]){
  b.box(side*39,0,-45,38,4,1.1,26000,[.38,.12,.095]);b.roof(side*39,-45,38,1.2,4,11000);
  // Stone path margins guide the eye without enclosing the landmark in another ring.
  b.box(side*10,.1,49,.35,.4,24,9000,[.44,.45,.40]);
 }
 for(let i=0;i<1200;i++){const a=b.rnd()*Math.PI*2,rad=18+b.rnd()*38;b.point([Math.cos(a)*rad,1+b.rnd()*14,Math.sin(a)*rad],[.34,.45,.38],8);}
 return b.finish();
}
function clock(){
 const b=builder(1);
 b.surface((u,v)=>[(u-.5)*124,-.14,(v-.5)*146],560000,[.32,.29,.24],2);
 for(const side of [-1,1]){
  for(let j=0;j<3;j++){
   const x=side*(29+j%2*4),z=42-j*30;
   b.box(x,0,z,11,6.5,22,42000,[.27,.28,.27]);b.roof(x,z,12,23,6.5,26000);
   for(let k=0;k<4;k++){
    b.box(x-side*5.55,1,z-8+k*5,.1,3.7,3.6,2700,[.36,.20,.105]);
    b.box(x-side*5.64,2,z-8+k*5,.08,1.9,2.8,1700,[.57,.36,.15],6);
   }
  }
  b.tree(side*19,13,12,false);b.tree(side*23,-26,14,false);
  for(const z of [30,53,-8]){
   b.box(side*17,0,z,.16,7,.16,2600,[.32,.33,.28]);b.box(side*17,6.6,z,.55,.8,.55,1300,[.72,.51,.25],6);
  }
 }
 // A small breakfast cart with independently rising steam, all sampled points.
 b.box(-15,0,26,3.1,1.35,1.5,13000,[.29,.23,.17]);
 b.box(-15,1.4,26,3.4,.12,1.8,4500,[.54,.51,.41]);
 for(let j=0;j<3;j++)b.surface((u,v)=>{const a=u*Math.PI*2;return[-16+j*.9+Math.cos(a)*.34,1.55+v*.27,26+Math.sin(a)*.34];},1700,[.55,.44,.29],0);
 for(let i=0;i<2000;i++)b.point([-15+(b.rnd()-.5)*2,b.rnd()*3,26+(b.rnd()-.5)*1.1],[.52,.52,.47],7);
 b.person(-15,27.5,[.33,.27,.20]);b.person(-12.5,24.8,[.22,.32,.38]);b.person(15,8,[.42,.25,.18]);b.person(17,6,[.18,.23,.27]);
 for(let i=0;i<950;i++)b.point([(b.rnd()-.5)*36,b.rnd()*14,-25+b.rnd()*85],[.60,.37,.10],8);
 return b.finish();
}
function modern(index){
 const b=builder(index),isCCTV=index===3;
 // Roads and paving continue under the city. Building placement is a cinematic montage.
 b.surface((u,v)=>[(u-.5)*190,-.18,(v-.5)*205],510000,[.14,.21,.27],2);
 const blocks=isCCTV?[
  [-57,65,14,42,36], [32,49,16,25,29],[-42,15,16,20,23],[42,3,18,24,39],[-33,-42,13,19,31],[52,-46,16,22,25],[-62,-80,20,24,42],[61,-87,17,24,53],[-70,20,19,28,47],[76,-23,20,25,34]
 ]:[
  [-58,83,15,22,39],[-18,63,13,19,29],[30,78,14,23,31],[53,26,16,22,37],[-30,11,13,19,25],[-43,-35,15,22,34],[30,-38,15,23,27],[-69,-81,19,24,41],[62,-84,16,21,38],[-77,13,20,24,29],[83,-24,18,22,46]
 ];
 for(const [x,z,w,d,h] of blocks)b.tower(x,z,w,d,h,27000+(h>35?9000:0));
 for(const side of [-1,1]){
  b.box(side*24,0,10,.6,.55,155,8500,[.31,.40,.43]);
  for(let j=0;j<6;j++)b.box(side*(46+j*3),0,-110,2.5,8+j%3*3,2.5,2200,[.17,.24,.29]);
 }
 // Continuous lanes of moving light establish horizontal depth in CCTV and city life below Zun.
 for(let i=0;i<12000;i++){
  const lane=i%4,along=b.rnd()*180-90,x=(lane<2?-22:22)+(lane%2)*1.2;
  b.point([x,.28,along],lane<2?[.38,.65,.79]:[.80,.39,.17],9);
 }
 if(!isCCTV){
  // High fine vertical tracers occupy the air, separate from the solid architectural silhouette.
  for(let i=0;i<1200;i++)b.point([(b.rnd()-.5)*125,b.rnd()*95,(b.rnd()-.5)*155],[.34,.49,.70],8);
 }
 return b.finish();
}
const vertex=`uniform float presence;attribute float spatialField;attribute float seed;attribute float kind;uniform float local;uniform float focal;uniform float quiet;uniform float mode;uniform float variation;varying vec3 tint;varying float alpha;varying float style;
${noiseGLSL}
void main(){
 vec3 p=position;vec3 random=hashVector(vec3(seed*137.,seed*491.,seed*797.)+variation);
 float field=spatialField;style=kind;
 float delay=mode<.5?max(0.,46.-p.z)*.004:mode<1.5?abs(p.x)*.004:abs(p.z)*.003+p.y*.008;
 float form=smoothstep(delay,delay+.8+random.x*.35,local);if(quiet>.5)form=1.;
 vec3 offset=(random-.5)*vec3(3.,2.,3.);
 if(mode>2.5)offset=vec3((random.x-.5)*2.,-3.-random.y*5.,(random.z-.5)*4.);
 p+=offset*(1.-form);
 if(kind>3.5&&kind<4.5&&quiet<.5)p.x+=sin(local*.6+position.z*.3)*.11;
 if(kind>6.5&&kind<7.5){float age=fract(seed+local*.19*(1.-quiet));p.y=1.75+age*3.5;p.x+=sin(age*5.+seed*20.)*age*.7;p.z+=cos(seed*12.+age*4.)*age*.45;}
 if(kind>7.5&&kind<8.5&&quiet<.5){p.x+=sin(local*.43+seed*40.)*.7;p.y=mod(position.y-local*(.14+seed*.3)+120.,mode>3.5?95.:mode<.5?15.:14.);}
 if(kind>8.5){p.z=mod(position.z+90.+local*(mod(seed*100.,2.)<1.?7.:-9.)*(1.-quiet),180.)-90.;}
 vec4 view=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*view;
 float diameter=.045+pow(random.y,5.)*.065;
 if(kind>3.5&&kind<4.5)diameter=.07+random.y*.10;
 if(kind>4.5&&kind<5.5)diameter=.075+pow(random.y,4.)*.08;
 if(kind>6.5&&kind<7.5)diameter=.10+random.y*.23;
 if(kind>7.5&&kind<8.5)diameter=mode>3.5?.025+random.y*.08:.05+random.y*.12;
 if(kind>8.5)diameter=.045+random.y*.08;
 float projected=focal*diameter/max(.2,-view.z);gl_PointSize=clamp(projected,.6,kind>6.5?16.:5.8);
 float island=smoothstep(.18,.62,field);float radius=length(position.xz);
 float edge=1.-smoothstep(mode<1.5?63.:89.,mode<1.5?100.:140.,radius+field*12.);
 alpha=presence*form*mix(.44,1.,island)*edge*smoothstep(.35,1.3,-view.z)*(1.-smoothstep(110.,220.,-view.z));
 if(kind>6.5&&kind<7.5){float age=fract(seed+local*.19*(1.-quiet));alpha*=sin(age*3.14159)*.48;}
 float light=.48+.52*abs(dot(normal,normalize(vec3(-.65,.7,.28))));
 tint=color*light*(.78+field*.42);
 if(kind>5.5&&kind<6.5)tint*=1.35;
 if(kind>8.5)tint*=1.4;
 tint=mix(tint,vec3(.065,.10,.14),smoothstep(35.,180.,-view.z)*.65);
}`;
const fragment=`varying vec3 tint;varying float alpha;varying float style;void main(){vec2 q=gl_PointCoord-.5;
 if(style>3.5&&style<4.5)q=vec2(q.x+q.y*.35,q.y*1.3);
 if(style>7.5&&style<8.5)q*=vec2(.9,1.35);
 if(style>8.5)q*=vec2(1.8,.55);
 float d=length(q)*2.;float a=alpha*(1.-smoothstep(.48,1.,d));
 if(style>6.5&&style<7.5)a=alpha*exp(-d*d*3.)*(1.-smoothstep(.6,1.,d));
 if(a<.015)discard;gl_FragColor=vec4(tint,a);}`;
export async function createSceneEnvironments(scene,onProgress=()=>{}){
 const items=[];
 for(const [index,make] of [[0,temple],[1,clock],[3,()=>modern(3)],[4,()=>modern(4)]]){
  onProgress('正在铺开'+PLACES[index].name+'的空间…',items.length/4);
  await new Promise(resolve=>setTimeout(resolve,0));
  const data=make(),uniforms={presence:{value:1},local:{value:0},focal:{value:600},quiet:{value:0},mode:{value:index},variation:{value:0}};
  const material=new T.ShaderMaterial({uniforms,vertexColors:true,alphaToCoverage:true,vertexShader:vertex,fragmentShader:fragment});
  const root=new T.Points(data.geometry,material);root.position.fromArray(PLACES[index].anchor);root.frustumCulled=false;root.visible=false;stageObject(index,root);scene.add(root);items.push({index,root,uniforms,count:data.count,stats:data.stats,colliders:data.colliders});
  onProgress(PLACES[index].name+'的空间已就绪',items.length/4);
 }
 return{items,update(place,time,focal,quiet,variation,transit=-1){for(const item of items){item.root.visible=place===item.index||item.index===transit||item.index===transit+1&&transit>=0;item.uniforms.presence.value=scenePresence(item.index,{place,transit},time);item.uniforms.local.value=time-PLACES[item.index].start;item.uniforms.focal.value=focal;item.uniforms.quiet.value=quiet?1:0;item.uniforms.variation.value=variation;}}};
}
