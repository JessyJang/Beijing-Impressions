import {FILM_DURATION,filmTimeAt} from './film-rhythm.js';
export const OVERLAP=1.4;
export const TEMPLE_END=filmTimeAt(6.5);
export const WINTER_START=TEMPLE_END-OVERLAP;
export const WINTER_END=WINTER_START+7;
export const CLOCK_START=WINTER_END-OVERLAP;
export const CLOCK_SOURCE=filmTimeAt(9.9);
export const CLOCK_ARRIVAL=WINTER_END+2.5;
const SETTLE=4,EXTRA=SETTLE*.44;
export const EDIT_DURATION=CLOCK_ARRIVAL+FILM_DURATION-CLOCK_SOURCE+EXTRA;
export function clockSourceAt(time){
 const x=time-CLOCK_ARRIVAL,q=Math.max(0,Math.min(1,x/SETTLE));
 // Integrate a smooth speed ramp: arrival starts slow, then returns to normal pace.
 const integral=q**6-3*q**5+2.5*q**4;
 return CLOCK_SOURCE+.12*x+.88*(SETTLE*integral+Math.max(0,x-SETTLE));
}
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*x*(x*(x*6-15)+10);};
export function editAt(time){
 const winter=time>=WINTER_START&&time<WINTER_END;
 const outgoing=time>=CLOCK_START;
 const weight=winter?smooth((time-WINTER_START)/OVERLAP)*(1-smooth((time-CLOCK_START)/OVERLAP)):0;
 return{winter,outgoing,weight,winterTime:Math.max(0,Math.min(7,time-WINTER_START)),baseTime:outgoing?clockSourceAt(time):Math.min(time,TEMPLE_END)};
}
export function editTimeAtBase(time){
 if(time<CLOCK_SOURCE)return Math.min(time,TEMPLE_END);
 let lo=CLOCK_ARRIVAL,hi=EDIT_DURATION;for(let i=0;i<45;i++){const mid=(lo+hi)/2;if(clockSourceAt(mid)<time)lo=mid;else hi=mid;}return (lo+hi)/2;
}
