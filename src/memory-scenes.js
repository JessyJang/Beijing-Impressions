import * as T from 'three';
export const SHOTS=[
 {name:'胡同烟火',season:'秋 / 清晨',line:'一笼热气，叫醒一条胡同。',crop:[0,0,1024,505],color:'#cea563'},
 {name:'宫墙落雪',season:'冬 / 初雪',line:'雪落下来，北京就慢了。',crop:[0,521,1024,474],color:'#b5cbd4'},
 {name:'鼓楼街景',season:'城 / 黄昏',line:'日子从鼓楼底下经过。',crop:[0,1014,1024,522],color:'#d7ae76'},
];
const lut=Float32Array.from({length:256},(_,i)=>{let c=i/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;});
const smooth=T.MathUtils.smoothstep;
function oval(u,v,x,y,rx,ry){return Math.exp(-((((u-x)/rx)**2+((v-y)/ry)**2)*2));}
// Authored relief separates the stall, customer, wall and distant alley in depth.
// Original detail remains the color source; rear surfaces are not a measured scan.
function depth(u,v,shot){
 if(shot===0){const ground=1.5+4.2*smooth(v,.72,1);const wall=3.1-5.5*smooth(u,.28,.93);return ground*.22+wall+3.2*oval(u,v,.59,.66,.17,.46)+2.2*oval(u,v,.23,.65,.26,.43);}
 if(shot===1)return -2.2+7.3*(1-smooth(u,.34,.55))+.9*smooth(v,.83,1)+.8*oval(u,v,.77,.47,.22,.31);
 return -1.4+1.2*smooth(v,.82,1)+1.8*oval(u,v,.52,.48,.4,.5)+4.3*oval(u,v,.13,.68,.17,.36);
}
export async function loadMemoryScenes(renderer){
 const image=new Image();image.src='/assets/beijing/clean-storyboard.png';await image.decode();
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true});
 const shared={time:{value:0},pixel:{value:1},quiet:{value:0}},groups=[],counts=[],controls=[];
 let seed=333;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let shot=0;shot<3;shot++){
  const spec=SHOTS[shot];canvas.width=1024;canvas.height=spec.crop[3];
  // Crop relative to the approved atlas layout even when the clean plate resolution differs.
  const sx=image.width/1024,sy=image.height/1536;const [x,y,w,h]=spec.crop;
  ctx.drawImage(image,x*sx,y*sy,w*sx,h*sy,0,0,1024,h);
  const bytes=ctx.getImageData(0,0,1024,h).data;const positions=[],colors=[],seeds=[],assemble=[],masses=[];
  function add(u,v,z,r,g,b,grain,volume=0){
   const projection=(12-z)/12;
   positions.push((u-.5)*20*projection,(.5-v)*(20*h/1024)*projection,z-volume);
   const shade=volume>0?.75:1;colors.push(lut[r]*shade,lut[g]*shade,lut[b]*shade);seeds.push(grain,random(),random());
   // Structure appears in a travelling wave, with a small random stagger, rather than at once.
   assemble.push((shot===0?(1-v)*.40+u*.2:Math.abs(u-.5)*.5+(1-v)*.28)+random()*.18);
   masses.push(shot===0?(u<.42?0:u<.73?1:2):u<.43?0:1);
  }
  for(let py=0;py<h;py++)for(let px=0;px<1024;px++){
   const i=(py*1024+px)*4,r=bytes[i],g=bytes[i+1],b=bytes[i+2];if(Math.max(r,g,b)<13)continue;
   const u=(px+.5)/1024,v=(py+.5)/h,z=depth(u,v,shot),grain=random();
   const rim=Math.min(u,1-u,v,1-v);if(random()>smooth(rim,0,.065))continue;
   add(u,v,z,r,g,b,grain);
   // A thin volume behind sampled surfaces prevents every slant revealing an empty sheet.
   if(px%3===0&&py%3===0)add(u+.0004,v,z,r,g,b,grain,.18+random()*.45);
  }
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setAttribute('random',new T.Float32BufferAttribute(seeds,3));geo.setAttribute('delay',new T.Float32BufferAttribute(assemble,1));geo.setAttribute('mass',new T.Float32BufferAttribute(masses,1));
  const uniforms={...shared,local:{value:0},last:{value:shot===2?1:0},opacity:{value:1}};controls.push(uniforms);
  const mat=new T.ShaderMaterial({uniforms,vertexColors:true,transparent:true,depthWrite:true,vertexShader:`attribute vec3 random;attribute float delay;attribute float mass;uniform float local;uniform float time;uniform float quiet;uniform float pixel;uniform float last;varying vec3 tint;varying float alpha;
   mat2 rot(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
   void main(){float age=local;float formed=smoothstep(delay,delay+1.02,age);float away=(1.-last)*smoothstep(3.45+random.x*.28,5.30,age);if(quiet>.5){formed=1.;away=0.;}
   vec3 target=position;float angle=random.x*6.28318+time*.5;float radius=3.+random.y*14.;vec3 start=vec3(cos(angle)*radius,sin(angle)*radius*.65,-18.+random.z*35.);
   vec3 p=mix(start,target,formed);float gather=sin(formed*3.14159);p.xy+=gather*vec2(sin(random.z*25.+age*3.),cos(random.y*28.+age*3.))*(1.2+random.x);
   vec3 stream=target;
   stream.xy=rot(away*(2.4+.35*sin(target.z*.7)))*target.xy;
   stream.x+=sin(target.y*1.3+away*7.+target.z*.65)*away*2.3;
   stream.y+=cos(target.x*.85+away*6.)*away*1.7;
   stream.z+=away*(16.+sin(target.x*.45)*3.)+random.z*away*.5;
   p=mix(p,stream,away);
   // Subtle local movement remains after convergence; the whole subject can dissolve.
   p.y+=sin(time*.8+random.x*16.)*.013*(1.-quiet);
   vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
   float base=.016+random.x*.01;gl_PointSize=clamp(pixel*base/max(.25,-mv.z)*(1.+gather*.45+away*.3),.6,12.);
   tint=color;alpha=mix(step(.92,random.z)*.5,1.,formed)*smoothstep(-.4,.15,age)*smoothstep(.15,.65,-mv.z)*(1.-smoothstep(5.1,5.5,age)*(1.-last));
  }`,fragmentShader:`varying vec3 tint;varying float alpha;uniform float opacity;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>.96||alpha<.02)discard;gl_FragColor=vec4(tint,alpha*opacity*(1.-smoothstep(.60,.98,r)));
   #include <colorspace_fragment>
  }`});
  const group=new T.Group();const points=new T.Points(geo,mat);points.frustumCulled=false;group.add(points);group.visible=false;groups.push(group);counts.push(positions.length/3);
  await new Promise(resolve=>requestAnimationFrame(resolve));
 }
 return{groups,counts,controls,shared};
}
