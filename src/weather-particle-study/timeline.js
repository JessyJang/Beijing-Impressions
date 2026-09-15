export const DURATION=26;
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
export function stateAt(t){
 const reveal=smooth(2.5,6,t)*(1-smooth(22,25.5,t));
 const warp=smooth(13.5,17,t)*(1-smooth(19,23.5,t));
 const wave=smooth(6,8,t)*(1-smooth(19,23,t));
 return {reveal,warp,wave,front:1.3-((t-6)/9)*2.6,phase:t<3?'清晰':t<7?'颗粒显露':t<14?'波动扫过':t<21?'向门内拉伸':'恢复'};
}
