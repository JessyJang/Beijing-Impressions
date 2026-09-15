import assert from 'node:assert/strict';
import {FILM_DURATION,storyTimeAt,filmTimeAt} from '../src/film-rhythm.js';
import {routeAt,TRANSITS} from '../src/spatial-route.js';
assert.equal(FILM_DURATION,48);
assert.ok(Math.abs(storyTimeAt(48)-37.5)<1e-9);
let previous=routeAt(0),lastTime=0,minRate=Infinity,maxRate=0;
for(let t=.005;t<=48;t+=.005){
 const story=storyTimeAt(t),rate=(story-lastTime)/.005,state=routeAt(story);
 assert.ok(rate>0&&rate<3,'Monotone bounded playback');
 assert.ok(Math.abs(filmTimeAt(story)-t)<1e-7,'Time map round-trip');
 assert.ok(state.position.distanceTo(previous.position)<1.8,'Retiming must preserve spatial continuity');
 minRate=Math.min(minRate,rate);maxRate=Math.max(maxRate,rate);lastTime=story;previous=state;
}
assert.ok(maxRate/minRate>3,'Readable slow/fast contrast');
for(const bridge of TRANSITS){
 const t=filmTimeAt(bridge.cut),a=routeAt(storyTimeAt(t-.001)),b=routeAt(storyTimeAt(t+.001));
 assert.ok(a.position.distanceTo(b.position)<.7,'No cut teleport after retiming');
}
console.log(`48-second score clock passed; story speed ${minRate.toFixed(2)}–${maxRate.toFixed(2)}×; all forward bridges preserved.`);
// Bound angular speed and acceleration in real playback time, not only story time.
for(const b of TRANSITS.slice(0,2)){
 let previousVelocity,peakTurn=0,peakAcceleration=0;
 for(let t=filmTimeAt(b.start);t<filmTimeAt(b.end)-.02;t+=.01){
  const a=routeAt(storyTimeAt(t)),c=routeAt(storyTimeAt(t+.01));
  const velocity=c.position.clone().sub(a.position).divideScalar(.01);
  const turn=a.target.clone().sub(a.position).angleTo(c.target.clone().sub(c.position))/.01;
  peakTurn=Math.max(peakTurn,turn);if(previousVelocity)peakAcceleration=Math.max(peakAcceleration,velocity.clone().sub(previousVelocity).length()/.01);previousVelocity=velocity;
 }
 assert.ok(peakTurn<.6,'Avoid rapid pitch/yaw turns at playback speed');
 assert.ok(peakAcceleration<150,'Avoid the old bridge-blend acceleration kick');
 console.log(`Transfer ${b.index+1}: peak turn ${(peakTurn*180/Math.PI).toFixed(1)} deg/s, acceleration ${peakAcceleration.toFixed(1)} units/s².`);
}
