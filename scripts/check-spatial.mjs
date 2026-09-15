import assert from 'node:assert/strict';
import {Vector3,PerspectiveCamera} from 'three';
import {readFileSync} from 'node:fs';
import {shotAt as routeAt,routeAt as composedRouteAt,TRANSITS,PLACES,TOTAL,framedPosition,stagedShotAt,stagePoint} from '../src/spatial-route.js';
let previous=routeAt(0).position;
for(let t=.01;t<=TOTAL;t+=.01){const p=routeAt(t).position;if(routeAt(t).place===routeAt(t-.01).place){assert(p.distanceTo(previous)>.000001||t>8.59,'Continuous travel inside each shot');assert(p.distanceTo(previous)<1.5,'No teleport inside a shot');}else assert(routeAt(t).blackout>.99,'Shot change must be concealed beneath the particle sweep');assert([...p].every(Number.isFinite));previous=p;}
assert(routeAt(TOTAL).position.distanceTo(routeAt(0).position)>200,'Forward travel is substantial');
assert.notDeepEqual(PLACES[0].anchor,PLACES[1].anchor);
for(const spec of PLACES){const b=readFileSync(`public/assets/beijing/models/${spec.id}.points`);assert.equal(b.toString('ascii',0,4),'BJP3');const n=b.readUInt32LE(4);assert.equal(b.length,16+n*18);let min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(let i=0;i<n;i+=97)for(let d=0;d<3;d++){const p=b.readFloatLE(16+i*12+d*4);assert(Number.isFinite(p));min[d]=Math.min(min[d],p);max[d]=Math.max(max[d],p);}for(let d=0;d<3;d++)assert(max[d]-min[d]>2,'Model occupies all three dimensions');}
assert(routeAt(2).position.z>47.25);assert(routeAt(3.6).position.z<46);for(let t=2;t<3.6;t+=.01){const p=routeAt(t).position;if(p.z<47.3&&p.z>46)assert(Math.hypot(p.x,p.y-8.2)<5.45-.6,'Camera fits through the real aperture');}assert(routeAt(TOTAL).finished);
const velocity=t=>routeAt(t+.01).position.distanceTo(routeAt(t).position)/.01;
assert(velocity(2.6)>velocity(4.5)*3,'Gate passage accelerates then slows for the architecture');
assert(velocity(13.8)>velocity(11)*3,'Clock shot holds, then accelerates upward');
assert(routeAt(8.7).wipe>.99,'Near-camera chips cover the edit');
for(const t of [0,4,11,18,26,34,TOTAL])assert.equal(routeAt(t).wipe,0,'Transition does not leak into other scenes');
for(const spec of PLACES.slice(1)){assert(routeAt(spec.start).blackout>.99);assert.equal(routeAt(spec.start).transitionKind,PLACES.indexOf(spec)-1);}
// Camera rotation should advance smoothly along each shot, not whip to a new target.
for(const [start,end] of PLACES.map((p,i)=>[p.start,(PLACES[i+1]?.start??TOTAL)-.01]))for(let t=start+.01;t<end;t+=.01){
 const a=routeAt(t-.01),b=routeAt(t),da=a.target.clone().sub(a.position).normalize(),db=b.target.clone().sub(b.position).normalize();
 assert(da.angleTo(db)<.022,'Aim changes by less than 1.3 degrees per 10ms');
}
assert(routeAt(8.5).position.y-routeAt(3).position.y>17,'Tiantan crane gains height');
assert(routeAt(14.9).position.distanceTo(routeAt(14.9).target)>routeAt(9).position.distanceTo(routeAt(9).target)+15,'Clock shot pulls away into context');
assert(routeAt(22).position.y-routeAt(15.1).position.y>15,'Courtyard crane rises after entering the passage');
for(let t=15;t<22.2;t+=.01){const p=routeAt(t).position.clone().sub(new Vector3(...PLACES[2].anchor));if(p.z>12.3&&p.z<15.4&&p.y<7.5){assert(Math.abs(p.x)<.8,'Courtyard camera clears entrance sides');assert(p.y>1&&p.y<2.8,'Courtyard camera clears lintel and floor');}if(p.z>18&&p.y<6)assert(Math.abs(p.x)<4.5,'Camera stays between hutong walls below the roofline');}
for(let t=22.2;t<29.5;t+=.02){const p=routeAt(t).position.clone().sub(new Vector3(...PLACES[3].anchor));if(p.z<8&&p.z>-10){assert(Math.abs(p.x)<2.5,'CCTV camera remains in the open central gap');assert(p.y<23,'CCTV camera remains below the cantilever');}}
assert(routeAt(TOTAL).blackout===1&&routeAt(0).blackout===1,'Loop seam is fully concealed');
assert(velocity(TOTAL-.001)<.002,'Crane settles gently at the end');
console.log('Spatial sequence: forward shots, traversable aperture, concealed particle cut, authored speed changes and full 3D data passed.');

const panorama=routeAt(21.3),lens=new PerspectiveCamera(56,1.22,.15,400);lens.position.copy(panorama.position);lens.lookAt(panorama.target);lens.updateMatrixWorld();
for(const x of [-15,15])for(const y of [0,7.5])for(const z of [-14,16]){const p=new Vector3(160+x,y,-300+z).project(lens);assert(Math.abs(p.x)<.91&&Math.abs(p.y)<.91,'Full courtyard fits the panorama with margins');}
console.log('Courtyard panorama includes the entire compound, including its entrance.');

const portrait=new PerspectiveCamera(65,.55,.15,400);portrait.position.copy(framedPosition(panorama,.55));portrait.lookAt(panorama.target);portrait.updateMatrixWorld();
for(const x of [-15,15])for(const y of [0,7.5])for(const z of [-14,16]){const p=new Vector3(160+x,y,-300+z).project(portrait);assert(Math.abs(p.x)<.91&&Math.abs(p.y)<.91,'Portrait panorama includes all courtyard corners');}

for(const bridge of TRANSITS)for(let t=bridge.start;t<bridge.end;t+=.005){const a=composedRouteAt(t),b=composedRouteAt(t+.005);assert(a.position.distanceTo(b.position)<1.5,'Continuous transit, including the scene boundary');assert(a.target.clone().sub(a.position).angleTo(b.target.clone().sub(b.position))<.011,'Transit aim remains smooth');}
for(const bridge of TRANSITS){const a=composedRouteAt(bridge.cut-.001),b=composedRouteAt(bridge.cut+.001);assert(a.position.distanceTo(b.position)<.5,'No camera teleport at the landmark switch');}
console.log('Four continuous world-space transit bridges passed.');
// Departures must inherit the shot's velocity/acceleration, not just meet its position.
for(const b of TRANSITS)for(const t of [b.start,b.end]){
 const h=.0005,at=f=>composedRouteAt(f).position,base=f=>stagedShotAt(f).position;
 const vel=f=>f(t+h).clone().sub(f(t-h)).multiplyScalar(1/(2*h));
 const acc=f=>f(t+h).clone().add(f(t-h)).addScaledVector(f(t),-2).multiplyScalar(1/(h*h));
 assert(vel(at).distanceTo(vel(base))<.05,'Departure inherits velocity');
 assert(acc(at).distanceTo(acc(base))<1,'Departure inherits acceleration');
}
for(const b of TRANSITS)assert(Math.abs(composedRouteAt(b.cut-.001).bank-composedRouteAt(b.cut+.001).bank)<.001,'No bank jump at the scene boundary');
console.log('Departure velocity, acceleration and camera roll handoffs passed.');
for(const bridge of TRANSITS)for(let q=.25;q<=.8;q+=.01){
 const t=bridge.start+(bridge.end-bridge.start)*q,s=composedRouteAt(t),velocity=composedRouteAt(t+.001).position.sub(composedRouteAt(t-.001).position).normalize();
 assert(s.target.clone().sub(s.position).normalize().dot(velocity)>.92,'Transit view follows forward travel, rather than looking back or sideways');
}
console.log('Sustained forward-facing transit framing passed.');
// The first two edits continue the outgoing left turn instead of reversing to chase the next landmark.
for(const b of TRANSITS.slice(0,2))for(let t=b.start;t<b.end-.001;t+=.005){
 const a=composedRouteAt(t),c=composedRouteAt(t+.001),da=a.target.sub(a.position),dc=c.target.sub(c.position);
 const yawA=Math.atan2(-da.x,-da.z),yawB=Math.atan2(-dc.x,-dc.z);
 const rate=Math.atan2(Math.sin(yawB-yawA),Math.cos(yawB-yawA))/.001;
 assert(rate>-.02,'No perceptible rightward reversal during the first two transfers');
 if(t<b.start+(b.end-b.start)*.92)assert(rate>0,'Departure and core keep turning left');
}
console.log('First two transfers preserve the outgoing left-turn direction.');

for(const [aspect,fov] of [[1.22,56],[.55,65]]){
 const s=composedRouteAt(21.3),camera=new PerspectiveCamera(fov,aspect,.15,400);camera.position.copy(framedPosition(s,aspect));camera.lookAt(s.target);camera.updateMatrixWorld();
 for(const x of [-15,15])for(const y of [0,7.5])for(const z of [-14,16]){const corner=stagePoint(2,new Vector3(160+x,y,-300+z)).project(camera);assert(Math.abs(corner.x)<.91&&Math.abs(corner.y)<.91,'Restaged courtyard panorama retains its complete framing');}
}
console.log('Restaged courtyard retains complete landscape and portrait framing.');
