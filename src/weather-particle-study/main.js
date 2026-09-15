import * as THREE from 'three';
import {stateAt,DURATION} from './timeline.js';
const renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setClearColor('#060b10');
document.querySelector('#viewport').appendChild(renderer.domElement);
const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.1,100);camera.position.z=15;
const texture=await new THREE.TextureLoader().loadAsync('./cloud-room.png');texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearFilter;
const W=16,H=9;
const plateMaterial=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false});
const plate=new THREE.Mesh(new THREE.PlaneGeometry(W,H),plateMaterial);plate.position.z=-.015;plate.renderOrder=0;scene.add(plate);
// This is a flat image sampled into GPU billboards. aHome is not inferred depth.
const columns=innerWidth<650?480:720,rows=Math.round(columns*9/16),count=columns*rows;
const homes=new Float32Array(count*3),uvs=new Float32Array(count*2),seeds=new Float32Array(count);
let seed=71;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
for(let y=0;y<rows;y++)for(let x=0;x<columns;x++){const i=y*columns+x;const u=(x+.5)/columns,v=(y+.5)/rows;homes.set([(u-.5)*W,(v-.5)*H,0],i*3);uvs.set([u,v],i*2);seeds[i]=random()}
const geometry=new THREE.InstancedBufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute([-.5,-.5,0,.5,-.5,0,.5,.5,0,-.5,.5,0],3));geometry.setIndex([0,1,2,0,2,3]);geometry.setAttribute('aHome',new THREE.InstancedBufferAttribute(homes,3));geometry.setAttribute('aUv',new THREE.InstancedBufferAttribute(uvs,2));geometry.setAttribute('aSeed',new THREE.InstancedBufferAttribute(seeds,1));geometry.instanceCount=count;
const uniforms={uMap:{value:texture},uTime:{value:0},uReveal:{value:0},uWarp:{value:0},uWave:{value:0},uFront:{value:1.3},uStrength:{value:1},uCell:{value:W/columns}};
const material=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,side:THREE.DoubleSide,
vertexShader:`attribute vec3 aHome;attribute vec2 aUv;attribute float aSeed;uniform float uTime,uReveal,uWarp,uWave,uFront,uStrength,uCell;varying vec2 vCorner,vUv;varying float vAlpha;
void main(){
 vUv=aUv;vCorner=position.xy;vec3 home=aHome;vec3 p=home;
 // A traveling field disrupts only a band of the original surface.
 float field=exp(-pow((aUv.x-uFront)*4.,2.))*uWave*uStrength;
 float n=sin(aSeed*234.7+uTime*1.7);
 p.z+=field*(.65+sin(home.y*2.4+home.x)*1.1);
 p.x+=field*sin(home.y*2.+uTime)*.48;p.y+=field*n*.16;
 // Converge toward the pictured doorway; individual samples retain their home.
 vec2 door=vec2(-3.0,.6);vec2 delta=home.xy-door;float r=length(delta);
 float influence=smoothstep(.3,5.,r)*uWarp*uStrength;
 float angle=influence*.15*sin(uTime*.6+r*.35);
 mat2 rot=mat2(cos(angle),-sin(angle),sin(angle),cos(angle));
 p.xy=door+rot*(p.xy-door)*(1.-influence*.12);
 p.z-=influence*(1.0+aSeed*4.5);
 p.xy+=vec2(sin(aSeed*197.),cos(aSeed*79.))*uReveal*.006;
 vec2 dir=normalize(delta+vec2(.001));vec2 tangent=vec2(-dir.y,dir.x);
 float lengthen=1.+influence*(10.+aSeed*42.);
 float size=uCell*mix(1.5,1.18,uReveal)*(0.72+aSeed*.5);
 vec2 offset=(dir*position.x*lengthen+tangent*position.y)*size;
 p.xy+=offset;
 gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
 vAlpha=mix(1.,.88,uWarp)*smoothstep(0.,.28,uReveal);
}`,
fragmentShader:`uniform sampler2D uMap;varying vec2 vCorner,vUv;varying float vAlpha;void main(){float edge=length(vCorner);if(edge>.5)discard;vec4 color=texture2D(uMap,vUv);gl_FragColor=vec4(color.rgb,vAlpha*(1.-smoothstep(.43,.5,edge)));
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});
const particles=new THREE.Mesh(geometry,material);particles.frustumCulled=false;particles.renderOrder=1;scene.add(particles);
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;let playing=!reduced,time=0,last=performance.now();
const timeline=document.querySelector('#timeline'),play=document.querySelector('#play');
function updatePlay(){play.textContent=playing?'暂停':'播放';play.setAttribute('aria-pressed',String(!playing))}updatePlay();
play.onclick=()=>{playing=!playing;updatePlay()};
document.querySelector('#restart').onclick=()=>{time=0;playing=true;updatePlay()};
timeline.addEventListener('input',()=>{time=Number(timeline.value);playing=false;updatePlay()});
document.querySelector('#strength').addEventListener('input',e=>uniforms.uStrength.value=Number(e.target.value));
addEventListener('keydown',e=>{if(e.code==='Space'&&!e.target.closest('button,input')){e.preventDefault();playing=!playing;updatePlay()}});
function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;const usableHeight=Math.max(.35,(innerHeight-220)/innerHeight);camera.position.z=Math.max(H/(2*Math.tan(THREE.MathUtils.degToRad(21))*usableHeight),W/(2*Math.tan(THREE.MathUtils.degToRad(21))*camera.aspect)*1.03);camera.updateProjectionMatrix()}
addEventListener('resize',resize);resize();document.querySelector('#error').hidden=true;document.querySelector('#count').textContent=count.toLocaleString()+' 个图像采样粒子';
function draw(){const state=stateAt(time);uniforms.uTime.value=time;uniforms.uReveal.value=state.reveal;uniforms.uWarp.value=state.warp;uniforms.uWave.value=state.wave;uniforms.uFront.value=state.front;plateMaterial.opacity=1-THREE.MathUtils.smoothstep(state.reveal,.03,.8);particles.visible=state.reveal>.001;timeline.value=String(time);document.querySelector('#time').textContent=time.toFixed(1).padStart(4,'0')+' / 26s';document.querySelector('#phase').textContent=state.phase;renderer.render(scene,camera)}
renderer.setAnimationLoop(now=>{const dt=Math.max(0,Math.min((now-last)/1000,.05));last=now;if(document.hidden)return;if(playing)time=(time+dt)%DURATION;draw()});
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();playing=false;updatePlay();const error=document.querySelector('#error');error.hidden=false;error.textContent='图形上下文中断，请刷新试片。'});
