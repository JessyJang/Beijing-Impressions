import assert from 'node:assert/strict';
import {EDIT_DURATION,WINTER_START,WINTER_END,TEMPLE_END,CLOCK_START,CLOCK_SOURCE,CLOCK_ARRIVAL,clockSourceAt,editAt} from '../src/film-edit.js';
assert(WINTER_START>0&&CLOCK_START>TEMPLE_END);
assert.equal(editAt(0).winter,false);assert.equal(editAt(TEMPLE_END+.01).weight,1);assert.equal(editAt(WINTER_END).winter,false);
assert(Math.abs(editAt(EDIT_DURATION).baseTime-48)<1e-9);
for(let t=0;t<EDIT_DURATION;t+=.005){const a=editAt(t),b=editAt(t+.005);assert(a.weight>=0&&a.weight<=1);assert(Math.abs(a.weight-b.weight)<.008);if(Math.abs(a.baseTime-b.baseTime)>.01)assert(a.weight>.999&&b.weight>.999,'Source camera changes only while fully covered by winter');}
assert.equal(editAt(CLOCK_ARRIVAL).baseTime,CLOCK_SOURCE);
assert(clockSourceAt(CLOCK_ARRIVAL+4)-CLOCK_SOURCE<2.3);
console.log(`Second-scene edit and overlaps passed: ${EDIT_DURATION.toFixed(3)} seconds.`);
