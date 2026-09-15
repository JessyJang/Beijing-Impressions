import assert from 'node:assert/strict';
import {Vector3} from 'three';
import {WINTER_DURATION,winterAt,createWinterFinale} from '../src/winter-finale.js';
assert.equal(WINTER_DURATION,7);
for(const [start,end] of [[0,7]])for(let t=start+.01;t<end;t+=.01){
 const a=winterAt(t-.01),b=winterAt(t);assert(a.position.distanceTo(b.position)<.12);assert(a.target.clone().sub(a.position).angleTo(b.target.clone().sub(b.position))<.01);
 {const p=b.position.clone().sub(new Vector3(0,0,140));assert(p.x>8&&p.z>8,'Camera remains outside the palace wall');}

}
assert.equal(winterAt(7).veil,1);
globalThis.document={createElement:()=>({}),body:{appendChild(){}}};
const piece=createWinterFinale();
assert.equal(piece.counts.length,1);assert(piece.counts[0]>350000&&piece.counts[0]<1400000);
for(const cloud of piece.clouds)for(const attribute of Object.values(cloud.geometry.attributes))for(let i=0;i<attribute.array.length;i+=113)assert(Number.isFinite(attribute.array[i]));
console.log('Winter finale path, concealed cuts and finite geometry passed:',piece.counts);
