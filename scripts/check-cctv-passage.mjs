import assert from 'node:assert/strict';
import {routeAt,TRANSITS,scenePresence} from '../src/spatial-route.js';
import {filmTimeAt} from '../src/film-rhythm.js';
const b=TRANSITS[2],h=.0001;
for(const t of [b.start,b.cut,b.end]){
 const a=routeAt(t-h),c=routeAt(t),d=routeAt(t+h);
 assert(c.position.clone().sub(a.position).divideScalar(h).distanceTo(d.position.clone().sub(c.position).divideScalar(h))<.15);
 assert(a.target.clone().sub(a.position).angleTo(d.target.clone().sub(d.position))<.001);
}
assert(filmTimeAt(b.end)-filmTimeAt(b.start)>2.8);
assert.equal(scenePresence(3,{transit:2},b.start+.1),0);
console.log('CCTV passage: continuous motion at handoffs/cut, delayed arrival and >2.8 s travel passed.');
