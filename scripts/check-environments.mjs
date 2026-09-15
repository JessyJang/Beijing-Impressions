import assert from 'node:assert/strict';
import {Scene,Vector3} from 'three';
import {createSceneEnvironments} from '../src/scene-environments.js';
import {PLACES,routeAt,TRANSITS,unstagePoint} from '../src/spatial-route.js';
const scene=new Scene(),env=await createSceneEnvironments(scene);
assert.deepEqual(env.items.map(x=>x.index),[0,1,3,4]);
for(const item of env.items){
 const g=item.root.geometry;
 assert(item.count>500000&&item.count<1500000,'Context has a bounded point budget');
 for(const a of Object.values(g.attributes)){
  assert.equal(a.count,item.count);
  for(let i=0;i<a.array.length;i+=73)assert(Number.isFinite(a.array[i]),'Finite geometry attributes');
 }
 const begin=PLACES[item.index].start,end=PLACES[item.index+1]?.start??37.5;
 const enter=TRANSITS.find(b=>b.index+1===item.index),leave=TRANSITS.find(b=>b.index===item.index);
 for(let t=enter?.start??begin;t<(leave?.end??end);t+=.025){
  const p=unstagePoint(item.index,routeAt(t).position).sub(new Vector3(...PLACES[item.index].anchor));
  for(const c of item.colliders){
   const inside=p.x>c.min[0]-.18&&p.x<c.max[0]+.18&&p.y>c.min[1]-.18&&p.y<c.max[1]+.18&&p.z>c.min[2]-.18&&p.z<c.max[2]+.18;
   assert(!inside,`${PLACES[item.index].id} camera clears context at ${t.toFixed(2)}`);
  }
 }
 env.update(item.index,begin+3,600,false,7);
 for(const other of env.items)assert.equal(other.root.visible,other===item,'Only current environment draws');
 console.log(`${PLACES[item.index].id}: ${item.count} points, ${item.stats.trees} trees, ${item.stats.buildings} context towers; collision checks passed`);
}
env.update(2,18,600,false,7);assert(env.items.every(item=>!item.root.visible),'Courtyard has its separate environment');
for(const item of env.items){item.root.geometry.dispose();item.root.material.dispose();}
