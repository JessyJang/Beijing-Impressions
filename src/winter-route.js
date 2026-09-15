import * as T from 'three';
import {routeAt,framedPosition} from './spatial-route.js';
import {storyTimeAt} from './film-rhythm.js';
import {WINTER_START,WINTER_END,CLOCK_START,CLOCK_SOURCE,OVERLAP,editAt,clockSourceAt,CLOCK_ARRIVAL} from './film-edit.js';
import {winterAt} from './winter-finale.js';
export const WINTER_ENTRY_START=WINTER_START-1.5;
export const WINTER_ENTRY_END=WINTER_START+3.0;
export const WINTER_EXIT_START=WINTER_START+4.6;
export const WINTER_EXIT_END=CLOCK_ARRIVAL;
export function winterCityGate(time){
 return time<CLOCK_START?1-T.MathUtils.smootherstep(time,WINTER_ENTRY_START+.35,WINTER_ENTRY_START+1.5):T.MathUtils.smootherstep(time,WINTER_EXIT_END-1.8,WINTER_EXIT_END-.2);
}
const h=.001;
const transform=(s,m)=>({...s,position:s.position.clone().applyMatrix4(m),target:s.target.clone().applyMatrix4(m)});
const yaw=v=>Math.atan2(v.x,v.z);
const direction=s=>s.target.clone().sub(s.position).normalize();
const delta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const angles=s=>{const d=direction(s);return [Math.atan2(-d.x,-d.z),Math.asin(d.y),s.bank||0];};
const velocity=(fn,t)=>fn(t+h).position.sub(fn(t-h).position).multiplyScalar(1/(2*h));
function rigid(fn,t,destination,heading){
 const angle=yaw(heading)-yaw(direction(fn(t)));
 const rotation=new T.Matrix4().makeRotationY(angle);
 const offset=destination.clone().sub(fn(t).position.clone().applyMatrix4(rotation));
 rotation.setPosition(offset);return rotation;
}
function bridge(fnA,a,fnB,b,time){
 const duration=b-a,q=T.MathUtils.clamp((time-a)/duration,0,1),sa=fnA(a),sb=fnB(b);
 const va=velocity(fnA,a).multiplyScalar(duration),vb=velocity(fnB,b).multiplyScalar(duration);
 const acc=(fn,t)=>fn(t+h).position.add(fn(t-h).position).addScaledVector(fn(t).position,-2).multiplyScalar(duration*duration/(h*h));
 const aa=acc(fnA,a),ab=acc(fnB,b);
 const hermite=(x,y,v,w,j,k)=>{const c=j/2,d=y-x-v-c,e=w-v-2*c,f=k-2*c;return x+v*q+c*q*q+(10*d-4*e+f/2)*q**3+(-15*d+7*e-f)*q**4+(6*d-3*e+f/2)*q**5;};
 const p=new T.Vector3(...['x','y','z'].map(k=>hermite(sa.position[k],sb.position[k],va[k],vb[k],aa[k],ab[k])));
 const ra=angles(sa),rb=angles(sb),r=ra.map((x,k)=>{const derivative=(fn,t)=>delta(angles(fn(t+h))[k],angles(fn(t-h))[k])*duration/(2*h);return hermite(x,x+delta(rb[k],x),derivative(fnA,a),derivative(fnB,b),0,0);});
 const d=new T.Vector3(-Math.sin(r[0])*Math.cos(r[1]),Math.sin(r[1]),-Math.cos(r[0])*Math.cos(r[1]));
 return{position:p,target:p.clone().addScaledVector(d,40),bank:r[2]};
}
export function createWinterRoute(){
 let cachedAspect,mWinter,mCity;
 const source=(t,aspect)=>{const s=routeAt(storyTimeAt(t));return {...s,position:framedPosition(s,aspect)};};
 return{at(time,aspect=1){
  const incoming=t=>source(t,aspect),local=t=>winterAt(t-WINTER_START);
  if(cachedAspect!==aspect){
   cachedAspect=aspect;
   const departure=incoming(WINTER_ENTRY_START),heading=direction(departure);
   // Continue the existing lateral crane motion before settling on the palace wall.
   const destination=departure.position.clone().addScaledVector(velocity(incoming,WINTER_ENTRY_START).normalize(),35).addScaledVector(heading,125);
   // Keep both ground planes level; descend gradually with the longer crane move.
   destination.y=local(WINTER_ENTRY_END).position.y;
   mWinter=rigid(local,WINTER_ENTRY_END,destination,heading);
   const winter=t=>transform(local(t),mWinter),end=WINTER_EXIT_START;
   const forward=direction(winter(end));
   const city=t=>source(clockSourceAt(t),aspect);
   // Pass along the outside of the palace wall instead of lifting into the next stage.
   const displacement=new T.Vector3(-145,4,-45).transformDirection(mWinter).multiplyScalar(Math.hypot(145,4,45));
   mCity=rigid(city,WINTER_EXIT_END,winter(end).position.clone().add(displacement),forward);
  }
  const winter=t=>transform(local(t),mWinter),city=t=>transform(source(clockSourceAt(t),aspect),mCity);
  let camera;
  if(time<WINTER_ENTRY_START)camera=incoming(time);
  else if(time<WINTER_ENTRY_END)camera=bridge(incoming,WINTER_ENTRY_START,winter,WINTER_ENTRY_END,time);
  else if(time<WINTER_EXIT_START)camera=winter(time);
  else if(time<WINTER_EXIT_END)camera=bridge(winter,WINTER_EXIT_START,city,WINTER_EXIT_END,time);
  else camera=city(time);
  return{...camera,winterMatrix:mWinter,cityMatrix:editAt(time).outgoing?mCity:new T.Matrix4()};
 }};
}
