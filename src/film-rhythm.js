// A shared, monotone musical clock: every visual system keeps the same story time.
export const FILM_DURATION=48;
const STORY_DURATION=37.5, STEP=.0025;
const bell=(t,c,w)=>Math.exp(-.5*((t-c)/w)**2);
export function storyRate(t){
 return .88
  +.48*bell(t,8.65,1.05)+.38*bell(t,14.85,.95)
  +.10*bell(t,22.25,.95)+.95*bell(t,29.4,.7)
  -.40*bell(t,4.7,1.25)-.46*bell(t,20.45,.62)
  -.34*bell(t,33.8,1.6)+.22*bell(t,26.4,1.05);
}
const times=[0];
for(let i=1;i<=STORY_DURATION/STEP;i++)times.push(times[i-1]+STEP/storyRate((i-.5)*STEP));
const scale=FILM_DURATION/times.at(-1);
for(let i=0;i<times.length;i++)times[i]*=scale;
export function filmTimeAt(story){
 const p=Math.max(0,Math.min(STORY_DURATION,story))/STEP,i=Math.min(times.length-2,Math.floor(p));
 return times[i]+(times[i+1]-times[i])*(p-i);
}
export function storyTimeAt(film){
 const t=Math.max(0,Math.min(FILM_DURATION,film));let lo=0,hi=times.length-1;
 while(hi-lo>1){const mid=(lo+hi)>>1;if(times[mid]<=t)lo=mid;else hi=mid;}
 return (lo+(t-times[lo])/(times[hi]-times[lo]))*STEP;
}
