import * as T from 'three';
export const TOTAL=37.5;
export const PLACES=[
 {id:'tiantan',name:'天坛 · 祈年殿',season:'穿门 / 聚形',line:'微尘，渐渐成檐。',anchor:[0,0,0],color:'#b1bdb5',start:0},
 {id:'tianqiao',name:'天桥 · 四面钟',season:'仰望 / 汇光',line:'光尘汇入时间。',anchor:[80,0,-150],color:'#ceb98d',start:8.7},
 {id:'siheyuan',name:'胡同 · 四合院',season:'院落 / 檐影',line:'一方院落，安放日常。',anchor:[160,0,-300],color:'#c5aa85',start:15,warm:1},
 {id:'cctv',name:'中央电视台总部大楼',season:'都市 / 悬环',line:'在悬空的环中，遇见当代北京。',anchor:[240,0,-460],color:'#92cbdc',start:22.2,warm:0},
 {id:'chinazun',name:'中国尊 · 中信大厦',season:'天际 / 向上',line:'古老的器形，生长成新的天际。',anchor:[330,0,-620],color:'#c1d5e8',start:29.5,warm:.3},
];
const smooth=(a,b,t)=>{let q=T.MathUtils.clamp((t-a)/(b-a),0,1);return q*q*(3-2*q);};
// Integrating positive velocity pulses gives continuous speed without pauses at knots.
function pace(t,duration,base,pulses){
 const integral=x=>base*x+pulses.reduce((sum,[a,b,amount])=>{
  const q=T.MathUtils.clamp((x-a)/(b-a),0,1);
  return sum+amount*(b-a)*(q/2-Math.sin(q*Math.PI*2)/(4*Math.PI));
 },0);
 let x=T.MathUtils.clamp(t,0,duration);
 // Settle into the final composition with zero terminal velocity and acceleration.
 if(x>duration-1){const q=x-(duration-1);x=duration-1+q+4*q**3-7*q**4+3*q**5;}
 return integral(x)/integral(duration);
}
// Arc-length sampling prevents uneven control-point spacing from becoming speed jumps.
const first=new T.CatmullRomCurve3([[1,7,68],[0,7.5,55],[.2,8,43],[14,11,37],[34,20,29],[43,30,5],[32,34,-25]].map(p=>new T.Vector3(...p)),false,'centripetal');
const second=new T.CatmullRomCurve3([[68,3.8,-102],[73,5,-116],[85,8,-121],[106,16,-114],[123,24,-98]].map(p=>new T.Vector3(...p)),false,'centripetal');
first.arcLengthDivisions=1600;second.arcLengthDivisions=1200;
const additional=[
 [[1.8,2.6,47],[.7,2.5,31],[0,2.4,17],[0,2.4,10],[-1,5,5],[-8,20,8],[-23,38,27],[-28,45,38]],
 [[-26,12,65],[-15,13,44],[0,14,22],[0,14,0],[0,16,-35]],
 [[-42,20,98],[-32,31,90],[-7,47,83],[30,59,75],[64,63,60]],
].map(points=>{const c=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)),false,'centripetal');c.arcLengthDivisions=1200;return c;});
export function shotAt(time){
 const t=T.MathUtils.clamp(time,0,TOTAL),place=PLACES.findLastIndex(p=>t>=p.start);
 const u=place===0?pace(t,8.6,.45,[[1.3,3.8,1.7],[6.5,8.6,1.3]]):pace(t-8.7,6.3,.42,[[0,1.5,1.3],[3.9,6.3,1.25]]);
 let position=place===0?first.getPointAt(u):second.getPointAt(u);
 let target=place===0?new T.Vector3(-1+smooth(3.5,7,t)*3,10.5+smooth(3,8.6,t)*5.5,0):new T.Vector3(80,13+smooth(9.5,14.8,t)*5,-150);
 if(place>=2){const spec=PLACES[place],duration=(PLACES[place+1]?.start??TOTAL)-spec.start,q=(t-spec.start)/duration;
  const progress=place===2?pace(t-spec.start,6.1,.65,[[0,1.4,.5],[3,5.5,.9]]):pace(t-spec.start,duration,.65,[[0,1.5,.5],[duration-3,duration,1.0]]);
  position=additional[place-2].getPointAt(progress).add(new T.Vector3(...spec.anchor));
  const y=place===2?3.5:place===3?16+q*5:22+smooth(0,1,q)*17;
  target=new T.Vector3(spec.anchor[0],y,spec.anchor[2]-(place===3?smooth(.3,1,q)*68:0));
  if(place===2)target.set(spec.anchor[0],2.5+smooth(.58,1,q)*1.5,spec.anchor[2]-5+smooth(.55,.9,q)*5);
 }
 const nearest=PLACES.slice(1).reduce((best,p)=>Math.abs(p.start-t)<Math.abs(best-t)?p.start:best,8.7);
 const transitionTime=t-nearest+8.7;
 const transitionKind=PLACES.findIndex(p=>p.start===nearest)-1;
 const cutIn=[.34,.20,.40,.32][transitionKind],cutOut=[.4,.25,.5,.62][transitionKind];
 const coverage=smooth(nearest-cutIn,nearest-.08,t)*(1-smooth(nearest+.07,nearest+cutOut,t));
 const loopFade=Math.max(1-smooth(0,.7,t),smooth(TOTAL-1.2,TOTAL-.15,t));
 const blackout=Math.max(coverage,loopFade);
 const wipe=smooth(7.5,8.55,transitionTime)*(1-smooth(8.92,9.65,transitionTime));
 const finale=smooth(13.1,15,t);
 return{position,target,place,panorama:place===2?smooth(19.5,21.1,t):0,blackout,wipe,transitionKind,transitionTime,finale,bank:place===0?Math.sin(u*Math.PI)*-.025:Math.sin(u*Math.PI)*.03,flow:place===0?smooth(6.3,8.3,t):smooth(12,15,t),finished:t>=TOTAL};
}

// Preserve the whole compound in portrait without altering the ground-level passage.
export function framedPosition(state,aspect){const pull=aspect<1?(1/aspect-1)*.8*state.panorama:0;return state.position.clone().sub(state.target).multiplyScalar(1+pull).add(state.target);}

// Stage later spaces along the outgoing leftward sightline, not the old eastward grid.
const stageUp=new T.Vector3(0,1,0);
export const STAGES=[{angle:0,offset:new T.Vector3()}];
export function stagePoint(index,point){const stage=STAGES[index];return point.clone().applyAxisAngle(stageUp,stage.angle).add(stage.offset);}
export function unstagePoint(index,point){const stage=STAGES[index];return point.clone().sub(stage.offset).applyAxisAngle(stageUp,-stage.angle);}
export function stageObject(index,object){object.position.copy(stagePoint(index,object.position));object.quaternion.premultiply(new T.Quaternion().setFromAxisAngle(stageUp,STAGES[index].angle));}
export function stagedShotAt(time){const state=shotAt(time);state.position=stagePoint(state.place,state.position);state.target=stagePoint(state.place,state.target);return state;}
for(let i=1;i<PLACES.length;i++){
 if(i>3){STAGES.push({angle:STAGES[3].angle,offset:STAGES[3].offset.clone()});continue;}
 const cut=PLACES[i].start,a=stagedShotAt(cut-[2.2,1.8,1.0][i-1]),b=shotAt(cut+[1.2,1.3,1.5][i-1]);
 const da=a.target.clone().sub(a.position),db=b.target.clone().sub(b.position);
 const yaw=Math.atan2(-da.x,-da.z),angle=yaw+.55-Math.atan2(-db.x,-db.z);
 const destination=a.position.clone().add(new T.Vector3(-Math.sin(yaw+.28),0,-Math.cos(yaw+.28)).multiplyScalar(145));destination.y=b.position.y;
 STAGES.push({angle,offset:destination.sub(b.position.clone().applyAxisAngle(stageUp,angle))});
}

// Continuous world-space bridges replace the old camera teleport at each edit.
const forward=s=>s.target.clone().sub(s.position).normalize();
const orientation=d=>new T.Quaternion().setFromRotationMatrix(new T.Matrix4().lookAt(new T.Vector3(),d,new T.Vector3(0,1,0)));
function hermite5(a,b,va,vb,aa,ab,q){
 const c0=a,c1=va,c2=aa/2,d=b-c0-c1-c2,v=vb-c1-2*c2,acc=ab-2*c2;
 return c0+c1*q+c2*q*q+(10*d-4*v+acc/2)*q**3+(-15*d+7*v-acc)*q**4+(6*d-3*v+acc/2)*q**5;
}
const anglesAt=time=>{const s=stagedShotAt(time),d=s.target.sub(s.position).normalize();return [Math.atan2(-d.x,-d.z),Math.asin(d.y)];};
const angleDelta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
export const TRANSITS=PLACES.slice(1).map((place,index)=>{
 const start=place.start-[2.2,1.8,1.0,1.8][index],end=place.start+[1.2,1.3,1.5,1.3][index];
 const a=stagedShotAt(start),b=stagedShotAt(end),duration=end-start;
 const va=stagedShotAt(start+.0005).position.sub(stagedShotAt(start-.0005).position).multiplyScalar(duration/.001);
 const vb=stagedShotAt(end+.0005).position.sub(stagedShotAt(end-.0005).position).multiplyScalar(duration/.001);
 let curve=new T.CubicBezierCurve3(a.position,a.position.clone().addScaledVector(va,1/3),b.position.clone().addScaledVector(vb,-1/3),b.position);
 const h=.0005,acc=t=>stagedShotAt(t+h).position.add(stagedShotAt(t-h).position).addScaledVector(stagedShotAt(t).position,-2).multiplyScalar(duration*duration/(h*h));
 const aa=acc(start),ab=acc(end);
 if(index<3){curve=new T.Curve();curve.getPoint=(q,target=new T.Vector3())=>target.set(...['x','y','z'].map(k=>hermite5(a.position[k],b.position[k],va[k],vb[k],aa[k],ab[k],q)));}
 const startAngles=anglesAt(start),endAngles=anglesAt(end);
 const angular=startAngles.map((x,k)=>{const y=x+angleDelta(endAngles[k],x),derivative=t=>angleDelta(anglesAt(t+h)[k],anglesAt(t-h)[k])/(2*h)*duration;
 return [x,y,derivative(start),derivative(end),0,0];});
 return{index,start,end,cut:place.start,curve,angular,bankA:a.bank,bankB:b.bank,qa:orientation(forward(a)),qb:orientation(forward(b))};
});
function transitPosition(time,bridge){
 const state=stagedShotAt(time),q=T.MathUtils.clamp((time-bridge.start)/(bridge.end-bridge.start),0,1);
 const handoff=T.MathUtils.smootherstep(time,bridge.start,bridge.start+Math.min(.85,bridge.cut-bridge.start-.12))*(1-T.MathUtils.smootherstep(time,bridge.end-.7,bridge.end));
 return bridge.index<3?bridge.curve.getPoint(q):state.position.lerp(bridge.curve.getPoint(q),handoff);
}
export function routeAt(time){
 const state=stagedShotAt(time),bridge=TRANSITS.find(x=>time>=x.start&&time<=x.end);
 state.transit=-1;state.transitAmount=0;
 if(!bridge)return state;
 const q=(time-bridge.start)/(bridge.end-bridge.start);
 // A fifth-order blend preserves the live shot's velocity, acceleration and aim at both boundaries.
 const handoff=T.MathUtils.smootherstep(time,bridge.start,bridge.start+Math.min(.85,bridge.cut-bridge.start-.12))*(1-T.MathUtils.smootherstep(time,bridge.end-.7,bridge.end));
 const originalAim=orientation(forward(state));
 if(bridge.index<3)state.position.copy(bridge.curve.getPoint(q));else state.position.lerp(bridge.curve.getPoint(q),handoff);
 const direction=transitPosition(Math.min(bridge.end,time+.018),bridge).sub(transitPosition(Math.max(bridge.start,time-.018),bridge)).normalize();
 const aim=orientation(direction);
 const facing=T.MathUtils.smootherstep(q,0,.38)*(1-T.MathUtils.smootherstep(q,.70,1));
 originalAim.slerp(aim,facing);
 const sight=new T.Vector3(0,0,-1).applyQuaternion(originalAim);
 if(bridge.index<3){
  const [ya,yb,ma,mb]=bridge.angular[0];
  const yaw=(2*q**3-3*q*q+1)*ya+(q**3-2*q*q+q)*ma+(-2*q**3+3*q*q)*yb+(q**3-q*q)*mb;
  const pitch=hermite5(...bridge.angular[1],q);
  sight.set(-Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch));
 }
 state.target=state.position.clone().add(sight.multiplyScalar(35));
 state.transit=bridge.index;state.transitAmount=T.MathUtils.smootherstep(q,.09,.44)*(1-T.MathUtils.smootherstep(q,.78,1));
 state.panorama*=1-handoff;
 const bridgeBank=T.MathUtils.lerp(bridge.bankA,bridge.bankB,smooth(0,1,q));
 state.bank=bridge.index<3?bridgeBank:T.MathUtils.lerp(state.bank,bridgeBank,handoff);
 return state;
}
export function scenePresence(index,state,time){
 if(state.transit<0)return index===state.place?1:0;
 const b=TRANSITS[state.transit],q=(time-b.start)/(b.end-b.start);
 if(b.index===2){
  if(index===2)return 1-T.MathUtils.smootherstep(q,.18,.64);
  if(index===3)return T.MathUtils.smootherstep(q,.42,.88);
  return 0;
 }
 if(index===b.index)return 1-T.MathUtils.smootherstep(q,.48,.96);
 if(index===b.index+1)return T.MathUtils.smootherstep(q,.08,.42);
 return 0;
}
