import {grainFlowGLSL} from './grain-flow.js';
import {attachSpatialField} from './particle-fields.js';
import {noiseGLSL} from './particle-noise.js';
import * as T from 'three';
import {PLACES} from './spatial-route.js';

export async function loadSpatialModels(onProgress){
 const models=[];
 for(const spec of PLACES){
  onProgress('正在组成立体的'+spec.name+'…',models.length/PLACES.length);
  const response=await fetch('/assets/beijing/models/'+spec.id+'.points');if(!response.ok)throw new Error('Model load failed: '+spec.id);
  const data=await response.arrayBuffer(),header=new DataView(data);if(header.getUint32(0,true)!==0x33504a42)throw new Error('Invalid point asset');
  const count=header.getUint32(4,true);const positions=new Float32Array(data,16,count*3),colors=new Uint8Array(data,16+count*12,count*3),normals=new Int8Array(data,16+count*15,count*3);
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(positions,3));geometry.setAttribute('color',new T.BufferAttribute(colors,3,true));geometry.setAttribute('normal',new T.BufferAttribute(normals,3,true));
  const seed=new Float32Array(count);let s=1719;for(let i=0;i<count;i++){s=(s*1664525+1013904223)>>>0;seed[i]=s/4294967296;}geometry.setAttribute('seed',new T.BufferAttribute(seed,1));geometry.computeBoundingBox();attachSpatialField(geometry,.42,1.1);
  const uniforms={presence:{value:1},variation:{value:0},mode:{value:PLACES.indexOf(spec)},pointScale:{value:[1,.78,.85,.68,.78][PLACES.indexOf(spec)]},warm:{value:spec.warm??(spec.start>0?1:0)},time:{value:0},local:{value:0},focal:{value:600},quiet:{value:0},last:{value:spec.id==='tiantan'||spec.id==='siheyuan'?0:1},lighting:{value:spec.id==='tianqiao'?1:.25}};
  const material=new T.ShaderMaterial({uniforms,vertexColors:true,alphaToCoverage:true,depthWrite:true,transparent:false,
   vertexShader:`uniform float presence;attribute float spatialField;attribute float seed;uniform float variation;uniform float mode;uniform float pointScale;uniform float local;uniform float time;uniform float focal;uniform float quiet;uniform float last;uniform float lighting;uniform float warm;varying vec3 tint;varying float visibility;varying float footprint;
   ${noiseGLSL}
   ${grainFlowGLSL}
   void main(){vec3 p=position;
   bool courtyard=mode>1.5&&mode<2.5;
   float field=spatialField;
   vec3 random=hashVector(vec3(seed*971.,seed*139.,seed*357.)+variation);
   float delay=random.x*.55;
   if(mode<.5)delay+=length(position.xz)*.012+field*.18;
   else if(mode<1.5)delay+=position.y*.025;
   if(mode>1.5&&mode<2.5)delay+=abs(position.x)*.038;
   if(mode>2.5&&mode<3.5)delay=random.x*.25+floor(position.y/3.)*.06;
   if(mode>3.5)delay+=position.y*.025;
   float gatherDuration=mode>2.5&&mode<3.5?mix(.95,1.65,random.z):courtyard?mix(1.5,2.4,random.z):mode>.5&&mode<1.5?mix(1.8,3.,random.z):mode>3.5?mix(2.5,3.7,random.z):mix(2.0,3.4,random.z);
   bool clockTower=mode>.5&&mode<1.5;
   if(!clockTower){float region=grainRegion(position);delay=.06+region*.65+random.x*.12;gatherDuration=mix(.85,2.7,region)+random.z*.25;}
   float templeGrain=fract(seed*311.39);
   if(mode<.5){
    // Early upper detail holds the silhouette while independent cohorts arrive.
    float upper=smoothstep(6.,12.,position.y);
    delay=.18+random.x*1.65+(1.-upper)*.30;
    gatherDuration=.75+random.z*1.10;
    if(templeGrain<.18&&position.y>8.){delay=.08+random.x*.22;gatherDuration=.65;}
   }
   float form=smoothstep(delay,delay+gatherDuration,local);
   if(quiet>.5)form=1.;float loose=1.-form;
   p=grainFlow(position,seed,form,local,mode);
   float wander=step(courtyard?.993:mode<1.5?.986:mode<3.5?.996:.990,random.y)*(1.-quiet);
   float motion=mode<1.5?.3:mode<2.5?.12:mode<3.5?.48:.22;
   p+=wander*vec3(sin(local*motion+random.x*20.)*2.4,cos(local*motion*.7+random.y*20.)*1.3,sin(local*motion*.8+random.z*20.)*2.4);
   vec4 view=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*view;
   float diameter=pointScale*mix(.031,.064,pow(random.y,4.))*mix(1.45,1.,smoothstep(1.8,3.3,position.y));
   diameter*=clockTower?mix(1.45,1.,form):mix(mix(.85,2.2,step(.84,random.z)),1.,form);float projected=focal*diameter/max(.1,-view.z);gl_PointSize=clamp(projected,.7,5.2);footprint=clamp(projected,0.,1.);
   float key=max(0.,dot(normalize(normal),normalize(vec3(-.65,.7,.28))));
   float light=(mode<.5?.52:.45)+.72*key;
   float luminance=dot(color,vec3(.2126,.7152,.0722));
   tint=max(vec3(0.),mix(vec3(luminance),color,1.24))*light;
   tint*=mix(vec3(.92,1.0,1.08),vec3(1.06,1.0,.91),warm);
   tint*=mix(.72,1.,smoothstep(.5,3.,position.y));
   vec3 viewNormal=normalize(normalMatrix*normal);float rim=pow(1.-abs(dot(viewNormal,normalize(-view.xyz))),2.8);
   float glint=pow(max(0.,dot(normalize(normal),normalize(vec3(-.7,.6,-.3)))),6.);
   tint+=mix(vec3(.055,.14,.22),vec3(.20,.13,.055),warm)*(rim*.24+glint*.35)*form;

   float depth=smoothstep(25.,105.,-view.z);tint=mix(tint,vec3(.055,.073,.085),depth*.18);
   float skirt=mix(1.-smoothstep(18.,34.,length(position.xz)),1.,smoothstep(2.5,6.,position.y));
   float coverageMask=mix(.48+.40*field,.96,smoothstep(3.,7.,position.y));
   if(!courtyard){
    float clustered=smoothstep(.22,.64,field);
    coverageMask=mix(.46,.99,clustered);
    if(mode<.5){gl_PointSize=clamp(projected*1.08,.7,5.2);coverageMask=mix(coverageMask,.90+.10*clustered,smoothstep(2.5,5.,position.y));tint*=1.08;}
    else if(mode<1.5){gl_PointSize=clamp(projected*1.35,.7,5.2);tint*=1.10;}
    else{gl_PointSize=clamp(projected*1.22,.7,4.8);coverageMask=mix(.66,1.,clustered);}
   }
   if(courtyard){coverageMask=mix(.3,1.,smoothstep(.23,.61,field));tint*=1.12;gl_PointSize=clamp(projected*1.45,.7,5.);}
   visibility=mix(clockTower?.42:mix(.08,.55,step(.84,random.z)),.98,form)*mix(.58,1.,smoothstep(1.8,4.,position.y))*skirt*coverageMask*mix(1.,.45,wander);
   if(mode<.5){
    float upper=smoothstep(3.,8.,position.y);
    tint*=mix(.48,1.14,upper);
    float arrival=templeGrain<.72?smoothstep(.18,.88,form):mix(.12,1.,form);
    visibility*=arrival*mix(.45,1.,upper);
   }
   if(courtyard&&abs(position.x)<1.65&&position.z>12.3&&position.z<15.4&&position.y>.25&&position.y<3.15)visibility=0.;
   visibility*=presence;visibility*=1.-smoothstep(90.,145.,-view.z);visibility*=smoothstep(.3,1.5,-view.z);

  }`,
   fragmentShader:`varying vec3 tint;varying float visibility;varying float footprint;void main(){float r=length(gl_PointCoord-.5)*2.;float edge=1.-smoothstep(.48,1.,r);float alpha=edge*visibility*max(.75,footprint);if(alpha<.025)discard;gl_FragColor=vec4(tint,alpha);}`});
  const cloud=new T.Points(geometry,material);cloud.userData.preserveDetail=spec.id==='tiantan';cloud.position.fromArray(spec.anchor);cloud.frustumCulled=false;cloud.add(createGatheringMotes(positions,colors,uniforms));models.push({cloud,uniforms,count,bounds:geometry.boundingBox,spec});
  onProgress(spec.name+'已就绪',models.length/PLACES.length);
 }
 return models;
}

export function createTravelDust(){
 const n=6500,p=new Float32Array(n*3);let seed=551;const r=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<n;i++){p[i*3]=(r()-.5)*120+35;p[i*3+1]=r()*32;p[i*3+2]=55-r()*240;}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(p,3));
 const uniforms={time:{value:0},focal:{value:600},flow:{value:0}};
 const mat=new T.ShaderMaterial({uniforms,transparent:true,depthWrite:false,vertexShader:`uniform float time;uniform float focal;uniform float flow;varying float alpha;void main(){vec3 p=position;
   p.y+=sin(time*.4+position.x)*.4;vec4 v=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*v;gl_PointSize=clamp(focal*(.025+flow*.055)/max(.2,-v.z),.7,6.);alpha=(.11+flow*.6)*(1.-smoothstep(20.,65.,-v.z))*smoothstep(.5,2.,-v.z);}`,fragmentShader:`varying float alpha;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;gl_FragColor=vec4(.68,.75,.78,alpha*(1.-smoothstep(.2,1.,r)));}`});
 const points=new T.Points(g,mat);points.frustumCulled=false;return{points,uniforms};
}

function createGatheringMotes(positions,colors,uniforms){
 const p=[],rgb=[],seeds=[];
 for(let i=0;i<positions.length/3;i+=101){if(positions[i*3+1]<2)continue;p.push(...positions.subarray(i*3,i*3+3));rgb.push(colors[i*3]/255,colors[i*3+1]/255,colors[i*3+2]/255);seeds.push((i*.618033988)%1);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(rgb,3));g.setAttribute('seed',new T.Float32BufferAttribute(seeds,1));
 const m=new T.ShaderMaterial({uniforms,vertexColors:true,transparent:true,depthWrite:false,
 vertexShader:`attribute float seed;uniform float presence;uniform float variation;uniform float mode;uniform float local;uniform float focal;uniform float quiet;uniform float last;varying float alpha;varying float shape;varying vec3 tint;
 ${noiseGLSL}
 void main(){shape=mode;vec3 r=hashVector(vec3(seed*871.,seed*297.,seed*517.)+variation);float age=fract(seed+max(0.,local)*(.035+r.z*.11+mode*.005));float gather=smoothstep(.05,.92,age);vec3 offset=(r-.5)*vec3(28.,16.,25.);
 if(last<.5){float a=(1.-gather)*2.;offset.xz=mat2(cos(a),-sin(a),sin(a),cos(a))*offset.xz;}else offset.y=-4.-r.y*16.;
 vec3 p=position+offset*(1.-gather);vec4 v=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*v;
 gl_PointSize=clamp(focal*(.035+pow(r.y,6.)*.23)/max(.3,-v.z),1.2,8.);
 alpha=presence*sin(age*3.14159)*(.18+r.z*.4)*smoothstep(.4,2.,-v.z)*(1.-quiet);tint=mix(color, last<.5?vec3(.55,.65,.69):vec3(.9,.69,.42),.4);
 }`,fragmentShader:`varying float alpha;varying float shape;varying vec3 tint;void main(){vec2 q=gl_PointCoord-.5;if(shape>3.5)q*=vec2(2.1,.6);else if(shape>2.5)q*=vec2(.65,1.7);else if(shape>1.5)q*=vec2(1.3,.8);float r=length(q)*2.;float a=alpha*exp(-r*r*3.)*(1.-smoothstep(.7,1.,r));if(a<.008)discard;gl_FragColor=vec4(tint,a);}`});
 const points=new T.Points(g,m);points.frustumCulled=false;return points;
}
