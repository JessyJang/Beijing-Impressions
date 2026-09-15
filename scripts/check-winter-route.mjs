import assert from 'node:assert/strict';
import {createWinterRoute,winterCityGate,WINTER_ENTRY_START,WINTER_ENTRY_END,WINTER_EXIT_START,WINTER_EXIT_END} from '../src/winter-route.js';
import {WINTER_START,WINTER_END,CLOCK_START,OVERLAP} from '../src/film-edit.js';
const route=createWinterRoute(),h=.0001;
for(const aspect of [16/9,697/814,390/844]){
 for(const t of [WINTER_ENTRY_START,WINTER_ENTRY_END,WINTER_EXIT_START,WINTER_EXIT_END]){
  const a=route.at(t-h,aspect),b=route.at(t,aspect),c=route.at(t+h,aspect);
  const va=b.position.clone().sub(a.position).divideScalar(h),vb=c.position.clone().sub(b.position).divideScalar(h);
  assert(va.distanceTo(vb)<.02,'Position velocity is continuous at edit boundary');
  const d=s=>s.target.clone().sub(s.position).normalize();
  assert(d(a).angleTo(d(c))<.001,'No camera orientation jump');
 }
 let maxTurn=0;
 for(let t=WINTER_ENTRY_START+.01;t<WINTER_EXIT_END;t+=.01){const a=route.at(t-.01,aspect),b=route.at(t,aspect);
  assert([...b.position,...b.target].every(Number.isFinite));
  maxTurn=Math.max(maxTurn,a.target.clone().sub(a.position).angleTo(b.target.clone().sub(b.position))*180/Math.PI/.01);
 }
 assert(maxTurn<35,`Excessive turn speed: ${maxTurn}`);
 console.log(`Aspect ${aspect.toFixed(3)}: continuous boundary position/velocity/orientation; peak turn ${maxTurn.toFixed(1)} deg/s.`);
}
for(let local=WINTER_ENTRY_START-WINTER_START;local<WINTER_EXIT_END-WINTER_START;local+=.01){
 const s=route.at(WINTER_START+local),p=s.position.clone().applyMatrix4(s.winterMatrix.clone().invert());p.z-=140;
 if(Math.abs(p.x)<13&&Math.abs(p.z)<13)assert(p.y>28,'Departure clears the roof envelope');
}
console.log('Winter roof-envelope clearance passed.');

assert.equal(winterCityGate(WINTER_ENTRY_START),1,'Temple remains visible when winter is first enabled');
assert(winterCityGate(WINTER_ENTRY_START+.2)>.99,'No accidental outgoing fade during early entrance');
for(let t=WINTER_ENTRY_START;t<WINTER_EXIT_END;t+=.005){assert(Math.abs(winterCityGate(t+.005)-winterCityGate(t))<.01,'City visibility cannot jump');}
console.log('Entrance/exit presence regression passed.');
for(const [start,end] of [[WINTER_ENTRY_START,WINTER_ENTRY_END],[WINTER_EXIT_START,WINTER_EXIT_END]]){
 const a=route.at(start),b=route.at(end);assert(a.position.distanceTo(b.position)>100,'Journey needs real spatial separation');
 const t=(start+end)/2,s=route.at(t),next=route.at(t+.01),v=next.position.clone().sub(s.position).normalize();
 assert(v.dot(s.target.clone().sub(s.position).normalize())>.45,'Mid-passage camera should look along its travel');
}
console.log('Travel distance and forward-view checks passed.');
