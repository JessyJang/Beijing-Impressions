import * as T from 'three';

export function createAtmosphere(){
 const root=new T.Group();let seed=199;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const time={value:0},pixel={value:1},quiet={value:0};
 const handles=[];
 function field(kind,count){
  const pos=[],seeds=[];for(let i=0;i<count;i++){pos.push((rnd()-.5)*28,(rnd()-.5)*18,rnd()*22-8);seeds.push(rnd(),rnd(),rnd());}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('random',new T.Float32BufferAttribute(seeds,3));
  const uniforms={time,pixel,quiet,opacity:{value:0},kind:{value:kind}};
  const mat=new T.ShaderMaterial({uniforms,transparent:true,depthWrite:false,depthTest:true,vertexShader:`attribute vec3 random;uniform float time;uniform float pixel;uniform float kind;uniform float quiet;varying float life;varying vec3 seed;varying float spin;void main(){float t=time*(1.-quiet);vec3 p=position;seed=random;life=1.;spin=t*(1.+random.x)+random.y*6.28;
   if(kind<.5){p.y=9.-mod(9.-p.y+t*(.65+random.x*1.05),18.);p.x+=sin(t*.55+random.y*30.)*(.4+random.z);}
   else if(kind<1.5){p.y=8.-mod(8.-p.y+t*(.38+random.x*.65),16.);p.x+=sin(t*.9+random.y*20.)*(1.1+random.z);p.z+=sin(t*.65+random.x*33.)*.9;}
   else if(kind<2.5){float age=fract(random.x+t*(.27+random.z*.12));float angle=random.y*6.28+age*5.;p=vec3(-2.55+sin(angle)*(.10+age*.65)+age*.4,-1.17+age*3.4,5.1+cos(angle)*(.08+age*.32));life=sin(age*3.14159)*(.8-age*.4);}
   else {float a=random.x*6.28+t*.32,r=2.5+random.y*13.;p=vec3(cos(a)*r,sin(a)*r*.65,14.-mod(random.z*45.+t*(9.+random.y*13.),45.));life=.35+random.y*.65;}
   vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;float size=kind<.5?.065:kind<1.5?.22:kind<2.5?.65:.09;gl_PointSize=clamp(pixel*size/max(.2,-mv.z),.8,kind>1.5&&kind<2.5?90.:23.);life*=smoothstep(.2,1.,-mv.z);}`,
   fragmentShader:`uniform float kind;uniform float opacity;varying float life;varying vec3 seed;varying float spin;void main(){vec2 uv=gl_PointCoord-.5;float alpha;vec3 color;
    if(kind>.5&&kind<1.5){float c=cos(spin),s=sin(spin);uv=mat2(c,-s,s,c)*uv;uv.x/=max(.18,abs(cos(spin*.72)));float radius=length(uv*vec2(1.,.86));float angle=atan(uv.x,uv.y+.32);alpha=(1.-smoothstep(.35,.44,radius))*step(-.23,uv.y)*step(abs(angle),1.05);color=mix(vec3(.43,.16,.025),vec3(.84,.58,.13),seed.x);}
    else {float r=length(uv)*2.;if(r>1.)discard;alpha=kind>1.5&&kind<2.5?exp(-r*r*5.)*.085:(1.-smoothstep(.25,1.,r))*.85;color=kind<.5?vec3(.84,.91,1.):kind<2.5?vec3(.9,.84,.74):mix(vec3(.68,.42,.17),vec3(.67,.85,.99),seed.z);}
    gl_FragColor=vec4(color,alpha*life*opacity);
   }`
  });const points=new T.Points(geo,mat);points.frustumCulled=false;root.add(points);handles.push({points,uniforms});return uniforms;
 }
 const snow=field(0,2700),leaves=field(1,140),steam=field(2,450),tunnel=field(3,2600);
 // Each bird is a compact point cloud; wing points move around the body in flight.
 const birdPositions=[],birdIds=[],birdWings=[];
 for(let b=0;b<7;b++)for(let j=0;j<240;j++){
  const wing=j<190,side=j%2?1:-1,reach=rnd();
  birdPositions.push(wing?side*reach*.34:(rnd()-.5)*.06,wing?-.03*reach:(rnd()-.5)*.055,wing?(rnd()-.5)*(.11-reach*.075): (rnd()-.5)*.19);
  birdIds.push(b);birdWings.push(wing?reach:0);
 }
 const birdGeo=new T.BufferGeometry();birdGeo.setAttribute('position',new T.Float32BufferAttribute(birdPositions,3));birdGeo.setAttribute('bird',new T.Float32BufferAttribute(birdIds,1));birdGeo.setAttribute('wing',new T.Float32BufferAttribute(birdWings,1));
 const birdUniforms={time,pixel,quiet,opacity:{value:0}};
 const birdMat=new T.ShaderMaterial({uniforms:birdUniforms,transparent:true,depthWrite:false,vertexShader:`attribute float bird;attribute float wing;uniform float time;uniform float quiet;uniform float pixel;void main(){float t=time*(1.-quiet);vec3 p=position;p.y+=wing*sin(t*9.+bird*1.7)*.25;p.z+=wing*cos(t*9.+bird*1.7)*.06;p+=vec3(-10.+mod(t*3.0+bird*1.65,24.),3.7+sin(bird*2.3)*.65+sin(t*.8+bird)*.25,-1.+bird*.23);vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(pixel*.025/max(.2,-mv.z),1.,3.);}`,fragmentShader:`uniform float opacity;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;gl_FragColor=vec4(.60,.56,.48,opacity*(1.-smoothstep(.55,1.,r)));}`});
 const birds=new T.Points(birdGeo,birdMat);birds.frustumCulled=false;root.add(birds);
 const rayPositions=[],raySeeds=[],tails=[];
 for(let i=0;i<2200;i++){const a=rnd()*Math.PI*2,r=2+rnd()*14,z=rnd()*42;const s=rnd();for(let j=0;j<2;j++){rayPositions.push(Math.cos(a)*r,Math.sin(a)*r*.7,z);raySeeds.push(s);tails.push(j);}}
 const raysGeo=new T.BufferGeometry();raysGeo.setAttribute('position',new T.Float32BufferAttribute(rayPositions,3));raysGeo.setAttribute('seed',new T.Float32BufferAttribute(raySeeds,1));raysGeo.setAttribute('tail',new T.Float32BufferAttribute(tails,1));
 const rayUniforms={time,opacity:{value:0}};
 const rayMat=new T.ShaderMaterial({uniforms:rayUniforms,transparent:true,depthWrite:false,vertexShader:`attribute float seed;attribute float tail;uniform float time;varying float fade;varying vec3 tint;void main(){vec3 p=position;p.z=14.-mod(p.z+time*(14.+seed*11.),42.)-tail*(.5+seed*1.3);vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;fade=(1.-tail*.8)*smoothstep(.5,2.,-mv.z);tint=mix(vec3(.6,.34,.12),vec3(.51,.72,.9),seed);}`,fragmentShader:`varying float fade;varying vec3 tint;uniform float opacity;void main(){gl_FragColor=vec4(tint,fade*opacity);}`});const rays=new T.LineSegments(raysGeo,rayMat);rays.frustumCulled=false;root.add(rays);
 return{root,update(t,shot,flow,form,isReduced,focal){time.value=t;rayUniforms.opacity.value=isReduced?0:flow*.65;rays.visible=rayUniforms.opacity.value>.001;pixel.value=focal;quiet.value=isReduced?1:0;snow.opacity.value=shot===1?form:0;leaves.opacity.value=shot===0?form:0;steam.opacity.value=shot===0?form:0;birdUniforms.opacity.value=shot===0?form:0;birds.visible=birdUniforms.opacity.value>.001;tunnel.opacity.value=isReduced?0:flow;for(const h of handles)h.points.visible=h.uniforms.opacity.value>.001;}};
}
