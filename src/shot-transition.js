import * as T from 'three';
import {TRANSITS} from './spatial-route.js';
// These corridors live in the same world as the landmarks. The camera travels through them.
export function createShotTransition(scene,camera){
 let s=9825;const r=()=>((s=Math.imul(s,1664525)+1013904223>>>0)/4294967296);const items=[];
 const up=new T.Vector3(0,1,0);
 for(const bridge of TRANSITS){
  const positions=[],seeds=[],colors=[];
  for(let i=0;i<42000;i++){
   const q=.025+r()*.95,center=bridge.curve.getPoint(q),tangent=bridge.curve.getTangent(q).normalize();
   const right=new T.Vector3().crossVectors(tangent,up).normalize(),vertical=new T.Vector3().crossVectors(right,tangent).normalize();
   let x,y;const theta=r()*Math.PI*2,depth=8+r()*13;
   if(bridge.index===0){x=(r()<.5?-1:1)*(8+r()*4);y=(r()-.5)*23;}
   else if(bridge.index===1){const a=theta+q*9;x=Math.cos(a)*depth;y=Math.sin(a)*depth*.65;}
   else if(bridge.index===2){const side=i%4;x=side<2?(side?1:-1)*(8+r()*1.5):(r()-.5)*20;y=side>1?(side===2?1:-1)*(8+r()*1.5):(r()-.5)*20;}
   else{x=Math.cos(theta+q*4)*depth;y=Math.sin(theta+q*4)*depth;}
   const p=center.addScaledVector(right,x).addScaledVector(vertical,y);positions.push(p.x,p.y,p.z);seeds.push(r());
   const warm=bridge.index<2,tone=.55+r()*.45;colors.push(...(warm?[.42,.34,.22]:[.21,.38,.53]).map(c=>c*tone));
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('seed',new T.Float32BufferAttribute(seeds,1));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  const uniforms={amount:{value:0},focal:{value:600},time:{value:0},kind:{value:bridge.index}};
  const mat=new T.ShaderMaterial({uniforms,vertexColors:true,transparent:true,depthWrite:false,vertexShader:`attribute float seed;uniform float amount;uniform float focal;uniform float time;uniform float kind;varying vec3 tint;varying float alpha;varying float shape;
 void main(){vec3 p=position;p.y+=sin(time*.5+seed*30.)*.12;vec4 v=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*v;
 float size=.035+pow(seed,6.)*.22;gl_PointSize=clamp(focal*size/max(.2,-v.z),.6,12.);shape=kind;
 alpha=amount*(.14+seed*.32)*smoothstep(.25,1.3,-v.z)*(1.-smoothstep(35.,135.,-v.z));alpha*=smoothstep(.22,.65,length(gl_Position.xy/max(.1,gl_Position.w)));tint=color*(.7+.3*(1.-smoothstep(3.,50.,-v.z)));
 }`,fragmentShader:`varying vec3 tint;varying float alpha;varying float shape;void main(){vec2 q=gl_PointCoord-.5;if(shape<.5)q*=vec2(.8,1.4);else if(shape>1.5&&shape<2.5)q=vec2(q.x+q.y*.6,q.y*1.6);float d=length(q)*2.;float a=alpha*(1.-smoothstep(.35,1.,d));if(a<.01)discard;gl_FragColor=vec4(tint,a);}`});
  const cloud=new T.Points(g,mat);cloud.frustumCulled=false;cloud.renderOrder=1001;scene.add(cloud);items.push({cloud,uniforms,bridge});
 }
 // Fade only at the film opening/loop boundary, never between landmarks.
 const veil=new T.Mesh(new T.PlaneGeometry(2,2),new T.ShaderMaterial({uniforms:{amount:{value:0}},transparent:true,depthWrite:false,depthTest:false,
 vertexShader:`void main(){gl_Position=vec4(position.xy,0.,1.);}`,fragmentShader:`uniform float amount;void main(){gl_FragColor=vec4(.008,.014,.023,amount);}`}));veil.frustumCulled=false;veil.renderOrder=1000;camera.add(veil);
 const smooth=(a,b,x)=>{const q=T.MathUtils.clamp((x-a)/(b-a),0,1);return q*q*(3-2*q);};
 return{update(state,time,quiet,focal){
  for(const item of items){item.cloud.visible=state.transit===item.bridge.index&&!quiet;item.uniforms.amount.value=state.transitAmount;item.uniforms.time.value=quiet?0:time;item.uniforms.focal.value=focal;}
  const amount=time<1||time>36.2?state.blackout:0;veil.material.uniforms.amount.value=amount;veil.visible=amount>.001;
 }};
}
