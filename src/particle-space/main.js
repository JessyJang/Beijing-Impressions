import * as THREE from 'three';
import {makeWorld,canOccupy} from './world.js';
const $=s=>document.querySelector(s), mobile=innerWidth<650;
const renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setSize(innerWidth,innerHeight);$('#stage').append(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#263b48');
const camera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.08,100);camera.rotation.order='YXZ';
const data=makeWorld(mobile?.115:.075),geo=new THREE.BufferGeometry();
geo.setAttribute('position',new THREE.BufferAttribute(data.positions,3));geo.setAttribute('color',new THREE.BufferAttribute(data.colors,3));geo.setAttribute('kind',new THREE.BufferAttribute(data.kinds,1));geo.setAttribute('size',new THREE.BufferAttribute(data.sizes,1));
$('#count').textContent=`${data.kinds.length.toLocaleString()} 个空间粒子`;
const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:true,vertexColors:true,uniforms:{time:{value:0},pixelScale:{value:innerHeight*renderer.getPixelRatio()/(2*Math.tan(65*Math.PI/360))}},vertexShader:`
attribute float kind;attribute float size;uniform float time;uniform float pixelScale;varying vec3 tint;varying float k;varying float dist;
void main(){vec3 p=position;k=kind;tint=color;
 if(kind>2.5&&kind<3.5){p.x+=sin(time*.24+p.z*.65+p.y)*.20;p.y+=sin(time*.32+p.x*.8+p.z*.4)*.15;p.z+=sin(time*.18+p.y)*.15;}
 if(kind>1.5&&kind<2.5){p.x+=sin(time*1.1+p.z*.7+p.x)*p.y*.18;}
 if(kind>.5&&kind<1.5){p.y+=sin(p.x*1.8+p.z*.9+time*.65)*.025;float ca=pow(.5+.5*sin(p.x*3.+sin(p.z*2.+time*.4)*2.),12.);tint+=ca*.25;}
 if(kind>3.5){p.y+=sin(time*.5)*.22;}
 vec4 mv=modelViewMatrix*vec4(p,1.);dist=-mv.z;gl_Position=projectionMatrix*mv;
 float radius=kind>2.5&&kind<3.5?.075:.047;
 gl_PointSize=clamp(pixelScale*radius*size/max(.1,-mv.z),1.,kind>2.5?70.:24.);
}`,fragmentShader:`
varying vec3 tint;varying float k;varying float dist;
void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;float alpha=1.-smoothstep(.65,1.,d);if(k>2.5&&k<3.5)alpha=(1.-smoothstep(0.,1.,d))*.55;
 vec3 fog=vec3(.15,.23,.28);vec3 col=mix(tint,fog,1.-exp(-dist*.012));gl_FragColor=vec4(col,alpha);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`});
// Opaque architecture and translucent cloud use separate draws for valid depth ordering.
const solidIndices=[],cloudIndices=[];data.kinds.forEach((k,i)=>(k===3?cloudIndices:solidIndices).push(i));
geo.setIndex(solidIndices);scene.add(new THREE.Points(geo,mat));
const cloudGeo=geo.clone();cloudGeo.setIndex(cloudIndices);const cloudMat=mat.clone();cloudMat.depthWrite=false;cloudMat.uniforms=mat.uniforms;const cloud=new THREE.Points(cloudGeo,cloudMat);cloud.renderOrder=1;scene.add(cloud);
const route=new THREE.CatmullRomCurve3([new THREE.Vector3(2,2.9,3.8),new THREE.Vector3(2.4,3.1,-5),new THREE.Vector3(-1.1,3.25,-12),new THREE.Vector3(-2.7,3.1,-18),new THREE.Vector3(-2.7,3.1,-22),new THREE.Vector3(-3.1,2.7,-29),new THREE.Vector3(.2,2.8,-34.5),new THREE.Vector3(2.8,3,-38)],false,'centripetal');
let playing=!matchMedia('(prefers-reduced-motion: reduce)').matches,progress=0,yaw=0,pitch=0,drag=false,lastX=0,lastY=0,last=performance.now(),elapsed=0;
const keys=new Set();let baseYaw=0;
function setPose(){camera.position.copy(route.getPointAt(progress));const target=route.getPointAt(Math.min(1,progress+.015));if(progress<.985){const dir=target.sub(camera.position);baseYaw=Math.atan2(-dir.x,-dir.z);}camera.rotation.set(pitch,baseYaw+yaw,0);}
function sync(){ $('#play').textContent=playing?'暂停穿行':'继续穿行';$('#mode').textContent=playing?'自动穿行':'自由探索';$('#progress').value=progress;}
function move(dx,dy,dz){const p=camera.position;const delta=new THREE.Vector3(dx,0,dz).applyAxisAngle(new THREE.Vector3(0,1,0),camera.rotation.y);const n=p.clone().add(delta);n.y+=dy;if(canOccupy(n.x,n.y,n.z))p.copy(n);}
$('#play').onclick=()=>{playing=!playing;if(playing){ // Resume from the closest route point, avoiding a jump back to an unrelated chapter.
 let nearest=Infinity;for(let i=0;i<=1000;i++){const d=route.getPointAt(i/1000).distanceToSquared(camera.position);if(d<nearest){nearest=d;progress=i/1000;}}yaw=0;pitch=0;
}sync();};
$('#restart').onclick=()=>{progress=0;yaw=0;pitch=0;playing=true;setPose();sync();};
$('#progress').oninput=e=>{progress=Number(e.target.value);playing=false;yaw=0;pitch=0;setPose();sync();};
renderer.domElement.onpointerdown=e=>{drag=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId);};
renderer.domElement.onpointermove=e=>{if(!drag)return;yaw-=(e.clientX-lastX)*.004;pitch=THREE.MathUtils.clamp(pitch-(e.clientY-lastY)*.004,-1.35,1.35);lastX=e.clientX;lastY=e.clientY;camera.rotation.set(pitch,baseYaw+yaw,0);};
renderer.domElement.onpointerup=()=>drag=false;renderer.domElement.onpointercancel=()=>drag=false;
addEventListener('keydown',e=>{if(e.target.matches('input,button'))return;if(['w','a','s','d','q','e','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();keys.add(e.key);playing=false;sync();}if(e.code==='Space'){e.preventDefault();$('#play').click();}});
addEventListener('keyup',e=>keys.delete(e.key));addEventListener('blur',()=>{keys.clear();drag=false;});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);mat.uniforms.pixelScale.value=innerHeight*renderer.getPixelRatio()/(2*Math.tan(65*Math.PI/360));});
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();$('#error').hidden=false;$('#error').textContent='图形上下文已暂停，请刷新页面重新进入。';});
setPose();sync();
function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.05);last=now;if(document.hidden)return;elapsed+=dt;mat.uniforms.time.value=elapsed;
 if(playing){progress=Math.min(1,progress+dt/65);setPose();if(progress>=1){playing=false;sync();}$('#progress').value=progress;}
 const speed=dt*3.2;move(((keys.has('d')||keys.has('ArrowRight'))-(keys.has('a')||keys.has('ArrowLeft')))*speed,(keys.has('e')-keys.has('q'))*speed,((keys.has('s')||keys.has('ArrowDown'))-(keys.has('w')||keys.has('ArrowUp')))*speed);
 $('#place').textContent=camera.position.z< -21?'室内旷野':camera.position.z< -15?'云与门之间':'云的房间';renderer.render(scene,camera);
}requestAnimationFrame(frame);
