import * as T from 'three';
import {scenePresence,PLACES,stageObject} from './spatial-route.js';
export function createCityLife(scene){
 let s=2781;const r=()=>((s=Math.imul(s,1664525)+1013904223>>>0)/4294967296);const items=[];
 function make(index,build){
  const p=[],c=[],kind=[],id=[],seed=[];const add=(x,y,z,col,k=0,b=0)=>{p.push(x,y,z);c.push(...col);kind.push(k);id.push(b);seed.push(r());};build(add);
  const g=new T.BufferGeometry();for(const [name,data,size] of [['position',p,3],['color',c,3],['kind',kind,1],['bird',id,1],['seed',seed,1]])g.setAttribute(name,new T.Float32BufferAttribute(data,size));
  const uniforms={presence:{value:1},local:{value:0},focal:{value:600},quiet:{value:0},place:{value:index}};
  const m=new T.ShaderMaterial({uniforms,vertexColors:true,alphaToCoverage:true,vertexShader:`uniform float presence;attribute float kind;attribute float bird;attribute float seed;uniform float local;uniform float focal;uniform float quiet;uniform float place;varying vec3 tint;varying float alpha;
 void main(){vec3 p=position;float t=local*(1.-quiet);
 if(kind>.5&&kind<1.5){float cycle=t*(3.6+fract(sin(bird*19.)*473.)*2.7)+bird*2.1;float flap=sin(cycle)*(.4+.6*smoothstep(-.4,.5,sin(t*.7+bird*1.8)));p*=.75+fract(sin(bird*31.)*971.)*.38;p.y+=abs(p.x)*flap*.65;p.z+=abs(p.x)*.12*flap;p+=vec3(-27.+t*(6.5+fract(sin(bird*13.)*713.))-bird*1.6+sin(bird*17.)*2.1,(place<.5?26.:12.)+sin(t*.8+bird)*.5+sin(bird*9.)*2.4,(place<.5?10.:-5.)+bird*1.9+cos(bird*11.)*2.8);}
 if(kind>1.5&&kind<2.5){p.x+=sin(t*.6)*1.2;p.z+=sin(t*.4)*.4;}
 if(kind>2.5&&kind<3.5){p.x+=sin(t*1.7+position.y*2.)*.25+sin(t*.6)*1.2;p.z+=sin(t*.4)*.4;}
 if(kind>3.5){float tension=clamp((position.y-2.3)/17.3,0.,1.);p.x+=sin(t*.6)*1.2*tension;p.z+=sin(t*.4)*.4*tension;}
 vec4 v=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*v;gl_PointSize=clamp(focal*(kind>.5&&kind<1.5?.04:.026+seed*.023)/max(.2,-v.z),.7,4.8);tint=color;alpha=smoothstep(.4,1.2,-v.z)*(1.-smoothstep(85.,150.,-v.z))*smoothstep(.2,1.1,local);if(quiet>.5)alpha=1.;alpha*=presence;
 }`,fragmentShader:`varying vec3 tint;varying float alpha;void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;gl_FragColor=vec4(tint,alpha*(1.-smoothstep(.5,1.,d)));}`});
  const root=new T.Points(g,m);root.position.fromArray(PLACES[index].anchor);root.frustumCulled=false;stageObject(index,root);scene.add(root);items.push({index,root,uniforms});
 }
 function birds(add){for(let b=0;b<6;b++)for(let j=0;j<1500;j++){
  const wing=r()<.88,side=r()<.5?-1:1,u=r();let x,y,z;
  if(wing){x=side*u*.9;y=.03;z=-u*.30+(r()-.5)*.34*(1-u*.85);}else{x=(r()-.5)*.15;y=(r()-.5)*.13;z=(r()-.5)*.62;}
  add(x,y,z,[.47,.51,.50],1,b);
 }}
 make(0,birds);
 make(2,add=>{
  birds(add);
  function line(a,b,color,count=700,width=.035){for(let i=0;i<count;i++){const t=r();add(...a.map((x,k)=>x+(b[k]-x)*t+(r()-.5)*width),color);}}
  // A leaning bicycle, made entirely of surface points.
  const ox=-5,oz=5;
  for(const x of [-.78,.78])for(let i=0;i<2500;i++){const a=r()*Math.PI*2;add(ox+x+Math.cos(a)*.48,.5+Math.sin(a)*.48,oz+(r()-.5)*.06,[.28,.32,.32]);}
  const vertices=[[-.78,.5],[0,.55],[-.35,1.2],[.4,1.18],[.78,.5]];
  for(const [a,b] of [[0,1],[1,2],[2,0],[2,3],[3,1],[3,4],[1,4]])line([ox+vertices[a][0],vertices[a][1],oz],[ox+vertices[b][0],vertices[b][1],oz],[.44,.22,.14]);
  line([ox-.5,1.27,oz],[ox-.15,1.27,oz],[.22,.23,.22]);line([ox+.4,1.18,oz],[ox+.28,1.55,oz],[.42,.44,.41]);line([ox+.28,1.55,oz-.16],[ox+.28,1.55,oz+.16],[.42,.44,.41]);
  // Stone table and stools give the courtyard a domestic scale.
  for(const [x,z,rad,h] of [[4,-1,1.15,.95],[6,-1,.43,.55],[2,-1,.43,.55],[4,-3,.43,.55],[4.15,1.1,.43,.55]])for(let i=0;i<6500;i++){
   const a=r()*6.283,top=r()<.6,radius=top?Math.sqrt(r())*rad:rad;add(x+Math.cos(a)*radius,top?h:r()*h,z+Math.sin(a)*radius,[.38,.36,.31]);
  }
 });
 make(1,add=>{
  // A small red kite above the street, with a moving tail and fine tether.
  for(let i=0;i<6000;i++){const y=r()*2-1,x=(r()*2-1)*(1-Math.abs(y))*.9;add(-13+x,21+y*1.35,-4+Math.abs(x)*.15,[.58,.21,.12],2);}
  for(let i=0;i<2000;i++){const t=r();add(-13+Math.sin(t*8)*.18,19.6-t*3.3,-4,[.56,.35,.20],3);}
  for(let i=0;i<2500;i++){const t=r();add(-13+t*2,19.6-t*17.3,-4+t*12,[.23,.27,.29],4);}
 });
 return{update(place,time,focal,quiet,state){for(const item of items){const presence=scenePresence(item.index,state,time);item.root.visible=presence>0;item.uniforms.presence.value=presence;item.uniforms.local.value=time-PLACES[item.index].start;item.uniforms.focal.value=focal;item.uniforms.quiet.value=quiet?1:0;}}};
}
