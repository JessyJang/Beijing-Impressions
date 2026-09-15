import * as T from 'three';
import {createNebulaTexture} from './cosmic-backdrop.js';
import {scenePresence,PLACES,stageObject} from './spatial-route.js';

export function createCosmicLight(scene){
 const sky=new T.Group();scene.add(sky);
 const uniforms={time:{value:0},pixelRatio:{value:1}};
 const nebula=new T.Mesh(new T.SphereGeometry(245,40,24),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,depthTest:false,
 uniforms:{skyTexture:{value:createNebulaTexture()}},vertexShader:`varying vec2 coords;void main(){coords=uv;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}`,
 fragmentShader:`uniform sampler2D skyTexture;varying vec2 coords;void main(){gl_FragColor=vec4(texture2D(skyTexture,coords).rgb,1.);}`}));nebula.renderOrder=-1000;nebula.frustumCulled=false;sky.add(nebula);
 let randomState=429;const r=()=>{randomState=(randomState*1664525+1013904223)>>>0;return randomState/4294967296;};
 const p=[],seeds=[];
 for(let i=0;i<4800;i++){const y=r()*2-1,a=r()*Math.PI*2,s=Math.sqrt(1-y*y);p.push(Math.cos(a)*s*230,y*230,Math.sin(a)*s*230);seeds.push(r());}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('seed',new T.Float32BufferAttribute(seeds,1));
 const stars=new T.Points(g,new T.ShaderMaterial({uniforms,transparent:true,depthWrite:false,depthTest:true,blending:T.AdditiveBlending,
 vertexShader:`attribute float seed;uniform float time;uniform float pixelRatio;varying float strength;varying float bright;varying vec3 tint;
 void main(){vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;bright=step(.989,seed);gl_PointSize=(1.+pow(seed,5.)*2.+bright*12.)*pixelRatio;
 strength=(.25+seed*.65)*.86;tint=mix(vec3(.48,.68,1.),vec3(1.,.83,.59),seed);
 }`,fragmentShader:`varying float strength;varying float bright;varying vec3 tint;void main(){vec2 q=gl_PointCoord-.5;float rr=length(q)*2.;float core=exp(-rr*rr*mix(3.,32.,bright));float halo=exp(-rr*rr*4.)*.15*bright;
 float rays=bright*.12*(exp(-abs(q.x)*90.)+exp(-abs(q.y)*90.))*(1.-smoothstep(.15,.5,length(q)));
 float alpha=(core+halo+rays)*strength*(1.-smoothstep(.8,1.,rr));if(alpha<.005)discard;gl_FragColor=vec4(tint,alpha);}`}));stars.renderOrder=-999;stars.frustumCulled=false;sky.add(stars);
 const glows=[];
 for(const [index,spec] of PLACES.entries()){
  const root=new T.Group();root.position.fromArray(spec.anchor);stageObject(index,root);scene.add(root);
  for(const [x,y,z,size,warm] of [[-12,17,-15,48,0],[15,6,-10,30,1]]){
   const mat=new T.ShaderMaterial({uniforms:{warm:{value:warm},opacity:{value:index===0?.19:.15}},transparent:true,depthWrite:false,blending:T.AdditiveBlending,
    vertexShader:`varying vec2 coords;void main(){coords=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec2 coords;uniform float warm;uniform float opacity;void main(){float r=length(coords-.5)*2.;float a=exp(-r*r*5.)*(1.-smoothstep(.65,1.,r))*opacity;gl_FragColor=vec4(mix(vec3(.16,.52,.8),vec3(.8,.43,.18),warm),a);}`});
   const glow=new T.Mesh(new T.PlaneGeometry(size,size),mat);glow.position.set(x,y,z);root.add(glow);glows.push({glow,root,index,baseOpacity:index===0?.19:.15});
  }
 }
 return{sky,setPresence(amount){for(const item of glows)item.glow.material.uniforms.opacity.value*=amount;},update(camera,time,place,quiet,pixelRatio,state){sky.position.copy(camera.position);uniforms.time.value=quiet?0:time;uniforms.pixelRatio.value=pixelRatio;for(const item of glows){const presence=scenePresence(item.index,state,time);item.root.visible=presence>0;item.glow.material.uniforms.opacity.value=item.baseOpacity*presence;item.glow.quaternion.copy(item.root.quaternion).invert().multiply(camera.quaternion);}}};
}
