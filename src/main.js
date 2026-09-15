import {createPassageSpace} from './passage-space.js';
import * as T from 'three';
import {EDIT_DURATION,WINTER_START,WINTER_END,CLOCK_ARRIVAL,editAt,editTimeAtBase} from './film-edit.js';
import {createWinterRoute,winterCityGate,WINTER_ENTRY_START,WINTER_ENTRY_END,WINTER_EXIT_END} from './winter-route.js';
import {createWinterFinale,WINTER_DURATION} from './winter-finale.js';
import {createPointBudget} from './point-budget.js';
import {setLoadingProgress} from './loading-art.js';
import {FILM_DURATION,filmTimeAt,storyTimeAt} from './film-rhythm.js';
import {createFilmAudio} from './film-audio.js';
import {createEditorialFrame} from './editorial-frame.js';
import {createCityLife} from './city-life.js';
import {createCosmicLight} from './cosmic-light.js';
import {createForegroundMotes} from './foreground-motes.js';
import {createShotTransition} from './shot-transition.js';
import {createSceneFragments} from './scene-fragments.js';
import {createCourtyardEnvironment} from './courtyard-environment.js';
import {createSceneEnvironments} from './scene-environments.js';
import {TOTAL,PLACES,routeAt,framedPosition,scenePresence,stageObject} from './spatial-route.js';
import {loadSpatialModels,createTravelDust} from './spatial-models.js';
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const world=document.getElementById('world'),status=document.getElementById('status');
const params=new URLSearchParams(location.search),seek=Number(params.get('t'));
const introSeek=Number(params.get('snow')),introReview=params.has('snow')&&Number.isFinite(introSeek);
const review=params.has('t')&&Number.isFinite(seek);
const FULL_DURATION=EDIT_DURATION;
let variation=params.has('seed')?Number(params.get('seed'))%100:Math.random()*100;
if(!Number.isFinite(variation))variation=1;
const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));renderer.setSize(innerWidth,innerHeight);renderer.setClearColor('#030506');world.appendChild(renderer.domElement);
const scene=new T.Scene(),camera=new T.PerspectiveCamera(56,innerWidth/innerHeight,.15,400);
setLoadingProgress(.04);
const models=await loadSpatialModels((text,progress)=>{status.textContent=text;setLoadingProgress(.04+progress*.6);});models.forEach((m,i)=>{stageObject(i,m.cloud);scene.add(m.cloud);});
const courtyard=createCourtyardEnvironment();stageObject(2,courtyard.root);scene.add(courtyard.root);setLoadingProgress(.7);
const environments=await createSceneEnvironments(scene,(text,progress)=>{status.textContent=text;setLoadingProgress(.7+progress*.24);});const dust=createTravelDust();scene.add(dust.points);
const fragments=createSceneFragments();scene.add(fragments.root);scene.add(camera);
status.textContent='正在铺开角楼初雪与周边风景…';
const winterFinale=createWinterFinale(),winterRoute=createWinterRoute();
const editorial=createEditorialFrame(),cityLife=createCityLife(scene);
const soundtrack=createFilmAudio();
const transition=createShotTransition(scene,camera),foreground=createForegroundMotes(scene),cosmos=createCosmicLight(scene);
const cityWorld=new T.Group();
for(const child of [...scene.children])if(child!==camera)cityWorld.add(child);
scene.add(cityWorld);scene.add(cosmos.sky);
const cityPresence=new Set();cityWorld.traverse(object=>{const u=object.material?.uniforms?.presence;if(u)cityPresence.add(u);});
const winterWorld=new T.Group();winterWorld.add(winterFinale.root);scene.add(winterWorld);
const passage=createPassageSpace(scene,winterRoute);
let playhead=review?T.MathUtils.clamp(seek,0,TOTAL):reduced?4.5:0,paused=reduced||review||introReview,last=performance.now();
let filmTime=introReview?WINTER_START+T.MathUtils.clamp(introSeek,0,WINTER_EXIT_END-WINTER_START+.49):review||reduced?editTimeAtBase(filmTimeAt(playhead)):0;
let frameCount=0,fpsSince=performance.now(),completedLoops=0;const visited=new Set();
addEventListener('keydown',async e=>{if(e.code==='Space'){if(e.target instanceof HTMLElement&&e.target.closest('button'))return;e.preventDefault();paused=!paused;}if(e.code==='KeyF'){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{}}});
function resize(){camera.aspect=innerWidth/innerHeight;camera.fov=camera.aspect<1?65:56;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);}addEventListener('resize',resize);resize();
document.addEventListener('visibilitychange',()=>{last=performance.now();soundtrack.update(filmTime,paused);});
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();paused=true;soundtrack.update(filmTime,true);document.body.classList.add('load-error');document.getElementById('loading-screen').removeAttribute('aria-hidden');status.hidden=false;status.textContent='画面连接中断，请刷新后重新观看。';});
const pointBudget=createPointBudget([...models.map(m=>m.cloud),courtyard.root,...environments.items.map(e=>e.root),...winterFinale.clouds]);
let revealed=false;setLoadingProgress(.96);world.dataset.version='beijing-corner-detail-v43';
renderer.setAnimationLoop(now=>{
 frameCount++;if(now-fpsSince>1200){world.dataset.fps=(frameCount*1000/(now-fpsSince)).toFixed(1);frameCount=0;fpsSince=now;}
 const dt=Math.max(0,(now-last)/1000);last=now;if(document.hidden)return;
 if(!paused){filmTime+=dt;if(filmTime>=FULL_DURATION){filmTime%=FULL_DURATION;variation=Math.random()*100;completedLoops++;}}
 const edit=editAt(filmTime),inWinter=edit.winter;
 playhead=storyTimeAt(Math.min(FILM_DURATION,edit.baseTime));soundtrack.update(filmTime,paused);
 world.dataset.filmTime=filmTime.toFixed(2);world.dataset.audio=JSON.stringify(soundtrack.state);
 const state=routeAt(playhead);camera.position.copy(framedPosition(state,camera.aspect));camera.lookAt(state.target);if(!reduced)camera.rotateZ(state.bank);
 cosmos.update(camera,playhead,state.place,reduced,renderer.getPixelRatio(),state);
 fragments.root.visible=state.place===0;fragments.uniforms.time.value=playhead;fragments.uniforms.quiet.value=reduced?1:0;
 const focal=innerHeight*renderer.getPixelRatio()/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2)));
 transition.update(state,playhead,reduced,focal);
 environments.update(state.place,playhead,focal,reduced,variation,state.transit);
 cityLife.update(state.place,playhead,focal,reduced,state);if(filmTime<WINTER_START||filmTime>=WINTER_EXIT_END)editorial.update(state.place,playhead-PLACES[state.place].start,Math.max(state.blackout,state.transitAmount,state.place===1?1-T.MathUtils.smootherstep(filmTime,CLOCK_ARRIVAL,CLOCK_ARRIVAL+.65):0),reduced);
 courtyard.root.visible=state.place===2||state.transit===1||state.transit===2;courtyard.uniforms.presence.value=scenePresence(2,state,playhead);courtyard.uniforms.local.value=playhead-15;courtyard.uniforms.focal.value=focal;courtyard.uniforms.quiet.value=reduced?1:0;
 fragments.uniforms.focal.value=focal;foreground.uniforms.time.value=playhead;foreground.uniforms.focal.value=focal;foreground.uniforms.aspect.value=camera.aspect;foreground.uniforms.warm.value=PLACES[state.place].warm??Math.min(1,state.place);foreground.uniforms.quiet.value=reduced?1:0;
 for(const m of models){m.uniforms.presence.value=scenePresence(PLACES.indexOf(m.spec),state,playhead);m.uniforms.time.value=playhead;const local=playhead-m.spec.start;const lead=m.spec.start>0?1.4*(1-T.MathUtils.smoothstep(local,0,3)):0;m.uniforms.local.value=local+lead;m.uniforms.focal.value=focal;m.uniforms.quiet.value=reduced?1:0;m.uniforms.variation.value=variation;const index=PLACES.indexOf(m.spec);m.cloud.visible=index===state.place||index===state.transit||state.transit>=0&&index===state.transit+1;}
 dust.uniforms.time.value=reduced?0:playhead;dust.uniforms.focal.value=focal;dust.uniforms.flow.value=reduced?0:state.flow;
 if(!inWinter)visited.add(PLACES[state.place].id);world.dataset.visited=[...visited].join(",");world.dataset.loops=String(completedLoops);
 world.dataset.points=String(models[state.place].count+(state.place===2?courtyard.count:environments.items.find(item=>item.index===state.place)?.count??0));

 world.dataset.time=playhead.toFixed(2);world.dataset.place=PLACES[state.place].id;
 const connected=winterRoute.at(filmTime,camera.aspect);
 cityWorld.matrix.copy(connected.cityMatrix);cityWorld.matrixAutoUpdate=false;
 winterWorld.matrix.copy(connected.winterMatrix);winterWorld.matrixAutoUpdate=false;
 // Original city can change its stage only while it is outside the active winter shot.
 cityWorld.visible=!inWinter||filmTime<WINTER_ENTRY_END+.3||edit.outgoing;
 winterWorld.visible=filmTime>=WINTER_ENTRY_START&&filmTime<WINTER_EXIT_END+.5;
 if(inWinter){
  editorial.update(5,edit.winterTime,0,reduced);
  world.dataset.place='corner-tower';visited.add('corner-tower');
 }
 if(winterWorld.visible){
  for(const uniform of cityPresence)uniform.value*=winterCityGate(filmTime);
  const winterLocal=filmTime-WINTER_START;
  winterFinale.update(Math.max(0,filmTime-(WINTER_ENTRY_END-3.9)),reduced,focal);
  winterFinale.setPresence(T.MathUtils.smootherstep(filmTime,WINTER_ENTRY_END-3.7,WINTER_ENTRY_END-.8)*(1-T.MathUtils.smootherstep(filmTime,WINTER_EXIT_END-.3,WINTER_EXIT_END+.5)));
  if(filmTime>=WINTER_END&&filmTime<WINTER_EXIT_END){
   editorial.update(5,winterLocal,0,reduced);
  }
 }
 winterFinale.hide();
 camera.position.copy(connected.position);camera.lookAt(connected.target);if(!reduced)camera.rotateZ(connected.bank||0);
 cosmos.sky.position.copy(camera.position);
 cosmos.setPresence(cityWorld.visible?(winterWorld.visible?winterCityGate(filmTime):1):0);
 passage.update(filmTime,camera.aspect,focal,reduced);
 world.dataset.drawnPoints=String(pointBudget.update());
 renderer.render(scene,camera);

 if(!revealed){revealed=true;setLoadingProgress(1);status.hidden=true;document.getElementById('loading-screen').setAttribute('aria-hidden','true');document.body.classList.add('ready');last=performance.now();}
});
