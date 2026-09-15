import {BufferAttribute} from 'three';
// A coprime traversal spreads every prefix over the whole cloud, preserving all structures.
export function progressiveIndices(count){
 const gcd=(a,b)=>{while(b){const r=a%b;a=b;b=r;}return a;};
 let step=Math.max(1,Math.floor(count*.61803398875));while(gcd(step,count)!==1)step++;
 const indices=new Uint32Array(count);for(let i=0;i<count;i++)indices[i]=(i*step)%count;return indices;
}
// Fixed prefixes: another scene becoming visible never changes this cloud's density.
export function createPointBudget(clouds){
 const entries=clouds.map(cloud=>{
  const geometry=cloud.geometry,count=geometry.attributes.position.count;
  geometry.setIndex(new BufferAttribute(progressiveIndices(count),1));
  const drawn=cloud.userData.preserveDetail?count:Math.min(1000000,Math.ceil(count*.72));geometry.setDrawRange(0,drawn);
  return{cloud,drawn};
 });
 return{update(){return entries.reduce((sum,{cloud,drawn})=>{
  for(let node=cloud;node;node=node.parent)if(!node.visible)return sum;
  if((cloud.material?.uniforms?.presence?.value??1)<.001)return sum;
  return sum+drawn;
 },0);}};
}
