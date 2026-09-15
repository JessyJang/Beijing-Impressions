import assert from 'node:assert/strict';
import { sequenceAt } from '../src/particle-timeline.js';
for(let t=0;t<=15;t+=.025){const s=sequenceAt(t);assert(s.scenes.some(x=>x.visible),`No scene at ${t}`);for(const p of s.scenes)assert(p.form>=0&&p.form<=1&&p.leave>=0&&p.leave<=1);}
assert.equal(sequenceAt(0).scenes[0].form,0,'Start as scattered particles');
assert.equal(sequenceAt(2.5).scenes[0].form,1,'First scene becomes recognizable');
for(const boundary of [5,10]){const s=sequenceAt(boundary);assert(s.scenes.filter(x=>x.visible).length>=2,'Scenes overlap in the transition stream');assert(s.tunnel>.99);}
assert.equal(sequenceAt(15).scenes[2].leave,0,'Hold final architecture intact');
assert.equal(sequenceAt(15).finished,true);
assert.equal(sequenceAt(-1).time,0);
assert.equal(sequenceAt(20).time,15);
console.log('Particle sequence: convergence, transition overlap, final hold and time bounds passed.');
