import * as T from 'three';

// Original small street scenes. No external models, images or sound recordings.
export function createStreetLife(scene, reduced) {
  const root = new T.Group(); scene.add(root);
  let seed = 912;
  const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
  const range=(a,b)=>a+(b-a)*rand();
  const materials=new Map();
  function mat(color){if(!materials.has(color))materials.set(color,new T.MeshBasicMaterial({color}));return materials.get(color);}
  function mesh(parent,geo,color,x,y,z){const m=new T.Mesh(geo,mat(color));m.position.set(x,y,z);parent.add(m);return m;}
  function box(p,x,y,z,w,h,d,c){return mesh(p,new T.BoxGeometry(w,h,d),c,x,y,z);}
  function oval(p,x,y,z,rx,ry,rz,c){const m=mesh(p,new T.SphereGeometry(1,12,8),c,x,y,z);m.scale.set(rx,ry,rz);return m;}
  function rod(p,a,b,r,c){const av=new T.Vector3(...a),bv=new T.Vector3(...b),delta=bv.clone().sub(av);const m=mesh(p,new T.CylinderGeometry(r,r,delta.length(),8),c,...av.clone().add(bv).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return m;}
  function tube(p,pts,r,c){return mesh(p,new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(v=>new T.Vector3(...v))),16,r,5,false),c,0,0,0);}
  const gestures=[];
  function person(parent,x,z,rotation=0,customer=false){
    const p=new T.Group();p.position.set(x,0,z);p.rotation.y=rotation;parent.add(p);
    const coat=customer?'#414c51':'#53585a', skin='#a47a60';
    for(const side of [-1,1]){rod(p,[side*.11,.16,0],[side*.105,.77,0],.083,'#323333');oval(p,side*.11,.085,.065,.10,.075,.18,'#202225');}
    oval(p,0,1.03,0,.245,.37,.155,coat);
    rod(p,[0,1.29,0],[0,1.44,0],.072,skin);
    oval(p,0,1.55,.015,.135,.18,.127,skin);
    oval(p,0,1.68,0,.143,.075,.134,customer?'#383e42':'#d7cbb4');
    // Apron follows torso, ties and pockets make the worker readable at street scale.
    if(!customer){box(p,0,.95,.154,.34,.62,.018,'#b7a58a');box(p,0,.85,.17,.21,.14,.012,'#8f806c');for(const s of [-1,1])rod(p,[s*.12,1.34,.09],[s*.13,1.15,.16],.018,'#b7a58a');}
    rod(p,[-.21,1.25,0],[-.31,1.03,.18],.063,coat);rod(p,[-.31,1.03,.18],[-.21,1.04,.38],.048,skin);
    const arm=new T.Group();arm.position.set(.21,1.25,0);p.add(arm);
    rod(arm,[0,0,0],[.12,-.21,.15],.067,coat);rod(arm,[.12,-.21,.15],[.04,-.27,.43],.049,skin);
    oval(arm,.04,-.27,.43,.058,.045,.078,skin);
    if(!customer)rod(arm,[.04,-.27,.42],[.02,-.35,.66],.009,'#baaa85');
    gestures.push({arm,p,phase:rand()*6,customer});return p;
  }
  // Breakfast stall opens toward the flight path. Warm awning and stacked bamboo baskets.
  const stall=new T.Group();stall.position.set(-1.85,0,-12);stall.rotation.y=.3;root.add(stall);
  box(stall,0,.66,0,2.3,.12,.84,'#86775f');
  box(stall,0,.34,-.12,2.15,.58,.56,'#514c42');
  for(const x of [-1.02,1.02])for(const z of [-.33,.33])rod(stall,[x,.05,z],[x,.61,z],.038,'#7a7262');
  for(const x of [-1.18,1.18])rod(stall,[x,0,-.38],[x,2.43,-.38],.025,'#86775e');
  box(stall,0,2.43,.12,2.55,.065,1.42,'#9a563d');
  for(let i=0;i<13;i++)box(stall,-1.2+i*.2,2.36,.83,.12,.16,.025,i%2?'#9a563d':'#bd9d6e');
  // Physical placard uses system type, drawn locally without an image dependency.
  const board=document.createElement('canvas');board.width=512;board.height=192;
  const ctx=board.getContext('2d');ctx.fillStyle='#d4bd8c';ctx.fillRect(0,0,512,192);ctx.fillStyle='#593d2b';ctx.textAlign='center';ctx.font='bold 72px "PingFang SC", sans-serif';ctx.fillText('早点',256,92);ctx.font='27px "PingFang SC", sans-serif';ctx.fillText('包子 · 豆浆 · 油条',256,150);
  const texture=new T.CanvasTexture(board);texture.colorSpace=T.SRGBColorSpace;
  const sign=new T.Mesh(new T.PlaneGeometry(1.14,.43),new T.MeshBasicMaterial({map:texture,side:T.DoubleSide}));sign.position.set(.45,1.98,-.34);stall.add(sign);
  for(const x of [-.68,0]){
    for(let level=0;level<3;level++){
      mesh(stall,new T.CylinderGeometry(.26,.265,.105,24),'#b09662',x,.785+level*.11,.06);
      mesh(stall,new T.TorusGeometry(.26,.014,5,32),'#dbc08a',x,.833+level*.11,.06).rotation.x=Math.PI/2;
    }
    for(let j=0;j<6;j++){const a=j/6*Math.PI*2;const bx=x+Math.cos(a)*.15,bz=.06+Math.sin(a)*.15;oval(stall,bx,1.075,bz,.075,.063,.071,'#ead8ad');for(let k=0;k<5;k++){const a2=k/5*Math.PI*2;rod(stall,[bx,1.133,bz],[bx+Math.cos(a2)*.052,1.108,bz+Math.sin(a2)*.048],.003,'#b6a17e');}}
  }
  mesh(stall,new T.CylinderGeometry(.18,.16,.36,20),'#92928b',.71,.91,-.08);
  tube(stall,[[.83,.99,-.08],[1.04,1.1,-.08],[1.08,1.18,-.08]],.035,'#aaa695');
  box(stall,.62,.745,.26,.48,.035,.21,'#aa936f');
  for(let j=0;j<5;j++)for(const dz of [-.025,.025])rod(stall,[.46+j*.063,.80,.15+dz],[.49+j*.063,.80,.38+dz],.025,'#c2944d');
  person(stall,-.22,-.52,0);
  person(root,-.85,-10.4,-Math.PI/2,true);
  // An enamel stool and stacked crates sit outside the doorway.
  for(const z of [-14.1,-9.6]){box(root,-2.05,.35,z,.48,.08,.43,'#704834');for(const a of [-1,1])for(const b of [-1,1])rod(root,[-2.05+a*.16,.04,z+b*.15],[-2.05+a*.16,.33,z+b*.15],.024,'#716958');}
  box(root,-2.3,.2,-15.2,.63,.4,.48,'#725d3c');
  for(let j=0;j<4;j++)box(root,-2.3,.06+j*.1,-14.95,.63,.024,.015,'#ab8b5b');
  // Soft steam rises in small curling puffs, rather than bright opaque dots.
  const steamCount=440,steamPositions=new Float32Array(steamCount*3),steamSeeds=Array.from({length:steamCount},()=>({phase:rand(),angle:rand()*6.28,radius:rand(),source:rand()<.5?-.68:0}));
  const steamGeo=new T.BufferGeometry();steamGeo.setAttribute('position',new T.BufferAttribute(steamPositions,3));
  const steamMat=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{dpr:{value:Math.min(devicePixelRatio,1.75)}},vertexShader:`uniform float dpr;varying float fade;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);fade=(1.-smoothstep(1.25,2.6,position.y))*(1.-smoothstep(9.,25.,-mv.z));gl_PointSize=clamp(dpr*100./max(1.,-mv.z),2.,45.);gl_Position=projectionMatrix*mv;}`,fragmentShader:`varying float fade;void main(){float r=length(gl_PointCoord-.5)*2.;gl_FragColor=vec4(.88,.82,.69,exp(-r*r*4.)*.065*fade);}`});
  const steam=new T.Points(steamGeo,steamMat);steam.frustumCulled=false;stall.add(steam);
  // Small amber pool under the stall integrates solid props into the broken point street.
  const glowCanvas=document.createElement('canvas');glowCanvas.width=128;glowCanvas.height=128;const gc=glowCanvas.getContext('2d');const gradient=gc.createRadialGradient(64,64,0,64,64,64);gradient.addColorStop(0,'rgba(227,159,72,.22)');gradient.addColorStop(1,'rgba(227,159,72,0)');gc.fillStyle=gradient;gc.fillRect(0,0,128,128);
  const glow=new T.Mesh(new T.PlaneGeometry(4,4),new T.MeshBasicMaterial({map:new T.CanvasTexture(glowCanvas),transparent:true,depthWrite:false}));glow.rotation.x=-Math.PI/2;glow.position.set(-1.4,.045,-12);root.add(glow);
  oval(stall,-.72,2.23,.08,.065,.085,.065,'#ffdb99');
  // Ginkgo fans, each with a short petiole. Instancing keeps hundreds of leaves inexpensive.
  const leafShape=new T.Shape();leafShape.moveTo(0,0);leafShape.lineTo(-.09,.08);leafShape.quadraticCurveTo(-.13,.18,-.02,.17);leafShape.lineTo(0,.135);leafShape.lineTo(.02,.17);leafShape.quadraticCurveTo(.13,.18,.09,.08);leafShape.closePath();
  const leafGeo=new T.ShapeGeometry(leafShape),leafMat=new T.MeshBasicMaterial({color:'#b29347',side:T.DoubleSide});
  const leaves=new T.InstancedMesh(leafGeo,leafMat,300),dummy=new T.Object3D();root.add(leaves);leaves.frustumCulled=false;
  const leafData=Array.from({length:300},(_,i)=>({x:range(-2.5,2.5),z:range(-116,6),phase:rand()*6.28,y:range(.3,5.5),speed:range(.22,.53),scale:range(.6,1.7),fall:i<90}));
  for(let i=0;i<300;i++)leaves.setColorAt(i,new T.Color().setHSL(range(.075,.13),range(.4,.65),range(.3,.52)));
  const birds=[];
  for(let i=0;i<7;i++){
    const bird=new T.Group();root.add(bird);oval(bird,0,0,0,.09,.055,.21,'#aaa799');
    const wings=[];
    for(const side of [-1,1]){
      const wingShape=new T.Shape();wingShape.moveTo(0,0);wingShape.lineTo(side*.62,-.16);wingShape.quadraticCurveTo(side*.33,.12,side*.1,.13);wingShape.closePath();
      const wing=mesh(bird,new T.ShapeGeometry(wingShape),'#8a8d88',0,0,0);wing.material=new T.MeshBasicMaterial({color:'#8a8d88',side:T.DoubleSide});wing.rotation.x=Math.PI/2;wings.push({wing,side});
    }
    birds.push({bird,wings,phase:i*.68,z:-9-i*13});
  }
  return {update(time){
    const t=reduced?0:time;
    for(const g of gestures){g.arm.rotation.x=Math.sin(t*1.8+g.phase)*.19;g.arm.rotation.z=Math.cos(t*1.3+g.phase)*.11;g.p.rotation.z=Math.sin(t*.8+g.phase)*.013;}
    for(let i=0;i<steamCount;i++){const s=steamSeeds[i],age=(s.phase+t*.23)%1;steamPositions[i*3]=s.source+Math.sin(s.angle+age*5)*(.025+age*.22)+age*.16;steamPositions[i*3+1]=1.12+age*1.45;steamPositions[i*3+2]=.06+Math.cos(s.angle+age*4)*s.radius*(.03+age*.22);}
    steamGeo.attributes.position.needsUpdate=true;
    for(let i=0;i<leafData.length;i++){const l=leafData[i];if(l.fall){dummy.position.set(l.x+Math.sin(t*.65+l.phase)*.5,5.7-((5.7-l.y+t*l.speed)%5.7),l.z+Math.sin(t*.35+l.phase)*.65);dummy.rotation.set(t*.8+l.phase,t*.5+l.phase,Math.sin(t+l.phase));}else{dummy.position.set(l.x,.06,l.z);dummy.rotation.set(-Math.PI/2,0,l.phase);}dummy.scale.setScalar(l.scale);dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix);}
    leaves.instanceMatrix.needsUpdate=true;
    for(const {bird,wings,phase,z} of birds){bird.position.set(Math.sin(t*.55+phase)*5,4.5+Math.sin(t*.8+phase)*.35,z+Math.cos(t*.55+phase)*2);bird.rotation.y=Math.cos(t*.55+phase)>0?-Math.PI/2:Math.PI/2;for(const {wing,side}of wings)wing.rotation.y=side*Math.sin(t*8+phase)*.6;}
  }};
}
