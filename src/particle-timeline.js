export const TOTAL=15, LENGTH=5;
export const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
export function smooth(a,b,v){const t=clamp((v-a)/(b-a));return t*t*(3-2*t);}
// Scene windows overlap while the shared particle stream crosses the camera.
export function sequenceAt(time){
 const t=clamp(time,0,TOTAL),shot=Math.min(2,Math.floor(t/LENGTH));
 const scenes=[0,1,2].map(i=>{
  const local=t-i*LENGTH;
  return{index:i,local,visible:local>=-.45&&local<=5.5,form:smooth(0,1.8,local),leave:i<2?smooth(3.45,5.45,local):0};
 });
 const cut=Math.max(1-Math.abs(t-5)/1.25,1-Math.abs(t-10)/1.25,0);
 return{time:t,shot,scenes,tunnel:smooth(0,1,cut),finished:t===TOTAL};
}
