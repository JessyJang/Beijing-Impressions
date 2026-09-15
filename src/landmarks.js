import * as T from 'three';
// Interpretive silhouettes checked against documented elevations; not survey reconstructions.
// Sources and the limits of the simplified roof geometry are recorded in docs/resources.md.
export function createLandmarks(material){
 let seed=725;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};const range=(a,b)=>a+(b-a)*rand();
 function builder(){const positions=[],colors=[],weights=[];const cache=new Map();
  const add=(x,y,z,color,shade=1)=>{if(!cache.has(color))cache.set(color,new T.Color(color));const c=cache.get(color),v=range(.72,1.13)*shade;positions.push(x,y,z);colors.push(c.r*v,c.g*v,c.b*v);weights.push(.8);};
  const line=(a,b,c,n=180)=>{for(let i=0;i<n;i++){const t=rand();add(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t,c);}};
  function block(x,y,z,w,h,d,c,n=14000){for(let i=0;i<n;i++){const f=i%6,a=range(-.5,.5),b=range(-.5,.5);add(x+(f<2?(f===0?-.5:.5):a)*w,y+(f>=2&&f<4?(f===2?-.5:.5):b)*h,z+(f>=4?(f===4?-.5:.5):f<2?a:b)*d,c);}}
  // Four-sided roof surface with a straight ridge and upturned corners; longitudinal tile rows.
  function roof(cx,y,cz,w,d,rise,c,edge,snow=false,rotation=0){
   function world(x,z){return[cx+x*Math.cos(rotation)-z*Math.sin(rotation),cz+x*Math.sin(rotation)+z*Math.cos(rotation)];}
   for(let i=0;i<58000;i++){const x=range(-w/2,w/2),z=range(-d/2,d/2);const hip=Math.max(Math.abs(z)/(d/2),Math.max(0,(Math.abs(x)-w*.29)/(w*.21)));const up=.26*Math.pow(Math.abs(x)/(w/2),9)*Math.pow(Math.abs(z)/(d/2),4);const py=y+rise*Math.pow(1-hip,1.65)+up;const [wx,wz]=world(x,z);const tile=Math.sin(x*44)*.015;
    add(wx,py+tile,wz,snow&&rand()<.65?'#d5dfe0':hip>.965?edge:c);
   }
   for(const side of [-1,1]){const a=world(-w*.29,0),b=world(w*.29,0);line([a[0],y+rise+.1,a[1]],[b[0],y+rise+.1,b[1]],edge,1200);const e=world(side*w*.29,0);line([e[0],y+rise,e[1]],[e[0]+side*.14,y+rise+.44,e[1]],edge,180);}
  }
  function lattice(x,y,z,w,h){block(x,y,z,w,h,.08,'#3f2925',2500);for(let j=0;j<9;j++)line([x-w/2+j*w/8,y-h/2,z+.05],[x-w/2+j*w/8,y+h/2,z+.05],'#ae6651',65);for(let j=0;j<8;j++)line([x-w/2,y-h/2+j*h/7,z+.05],[x+w/2,y-h/2+j*h/7,z+.05],'#8d5140',65);}
  function beam(y,z,w){block(0,y,z,w,.4,.15,'#477c70',5500);for(let j=0;j<Math.floor(w*3);j++){const x=-w/2+j/3;line([x-.1,y,z+.09],[x,y+.13,z+.09],'#c4a160',25);line([x,y+.13,z+.09],[x+.1,y,z+.09],'#c4a160',25);}}
  function finish(){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setAttribute('weight',new T.Float32BufferAttribute(weights,1));return new T.Points(g,material);}
  return{add,line,block,roof,lattice,beam,finish};
 }
 const drum=new T.Group(),d=builder();
 // Broad red lower storey, three arched openings, gallery, three distinct eave levels.
 for(let i=0;i<160000;i++){const x=range(-8,8),y=range(.4,5.6);let hole=false;for(const center of [-3.2,0,3.2]){const r=center===0?1.05:.76,h=center===0?2.1:1.8;const dx=x-center;if(Math.abs(dx)<r&&y<h+Math.sqrt(Math.max(0,r*r-dx*dx)))hole=true;}
  if(!hole)d.add(x,y,2.85,'#ad4b3b',.92);else if(rand()<.55)d.add(x,y,2.62,'#392829',.9);
 }
 d.block(-8,2.9,0,.2,5.4,5.7,'#914239',16000);d.block(8,2.9,0,.2,5.4,5.7,'#914239',16000);
 for(const center of [-3.2,0,3.2]){const r=center===0?1.05:.76,h=center===0?2.1:1.8;for(let j=0;j<1800;j++){const a=rand()*Math.PI;d.add(center+Math.cos(a)*r,h+Math.sin(a)*r,2.89,'#b69a81');}}
 d.beam(5.55,2.95,16);d.roof(0,5.9,0,18,7.2,1.2,'#858d83','#629678');
 d.block(0,7.8,-1.2,14,2.8,3.4,'#85392f',35000);
 for(let j=-3;j<=3;j++){d.block(j*2.1,7.95,2.0,.16,2.7,.17,'#af5140',1500);d.lattice(j*2.1,7.8,.57,1.3,1.65);}
 // Red balcony rail and repeated posts are prominent in the south elevation.
 d.block(0,6.9,2.2,15,.3,.2,'#b44b3d',6000);for(let j=0;j<95;j++)d.line([-7.5+j*.16,7.05,2.2],[-7.5+j*.16,7.5,2.2],'#b57057',35);d.line([-7.5,7.5,2.2],[7.5,7.5,2.2],'#c47b57',2200);
 d.beam(9.32,2.1,14.8);d.roof(0,9.65,0,16.6,6.2,.92,'#879082','#639474');
 d.block(0,10.9,0,13.4,.8,3.8,'#435f59',18000);d.beam(10.91,1.96,13.4);d.roof(0,11.4,0,15.2,5.8,1.4,'#8f9487','#6f9e7b');
 // Low courtyard wall and small entrance gate seen in the photograph, distinct from the tower.
 for(const side of [-1,1]){d.block(side*5.6,.62,5.0,8.3,1.24,.32,'#a64b3b',22000);d.roof(side*5.6,1.3,5,8.6,1,.28,'#8a9987','#77a887');}
 d.block(-1.2,.85,5,.4,1.7,.5,'#a54b3d',2200);d.block(1.2,.85,5,.4,1.7,.5,'#a54b3d',2200);d.block(0,1.88,5,2.8,.45,.5,'#a54b3d',3800);d.roof(0,2.15,5,3.2,1.2,.4,'#93a18e','#81a887');
 for(let i=0;i<55000;i++)d.add(range(-15,15),0,range(-3,18),'#777775',.5);
 drum.add(d.finish());
 const corner=new T.Group(),c=builder();
 // Grey outer city wall turns at a right angle. Red pavilion sits on top, not a red outer curtain wall.
 c.block(-11,2,-1,22,4,2,'#777371',85000);c.block(-1,2,-11,2,4,22,'#777371',85000);
 for(let j=0;j<25;j++){c.block(-j*.86,4.18,0,.52,.38,.55,'#b5bdbe',300);c.block(0,4.18,-j*.86,.55,.38,.52,'#b5bdbe',300);}
 c.block(-1,5.35,-1,4.8,2.35,4.8,'#a64435',30000);
 for(let j=0;j<5;j++){c.block(-3.15+j*1.08,5.35,1.44,.1,2.35,.12,'#d1a376',800);c.lattice(-2.75+j*.88,5.3,1.47,.56,1.55);c.block(1.44,5.35,-3.15+j*1.08,.12,2.35,.1,'#c79b71',800);}
 // Cross-plan projecting roofs and the central upper pavilion follow the documented composition.
 c.roof(-1,6.55,-1,7.5,5.3,.95,'#b99857','#d7b56c',true);
 c.roof(-1,6.58,-1,7.5,5.3,.95,'#b99857','#d7b56c',true,Math.PI/2);
 c.block(-1,7.65,-1,3.3,1.25,3.3,'#914d35',10000);
 c.roof(-1,8.05,-1,5.4,3.7,1.13,'#b99b64','#d7bc82',true);
 c.roof(-1,8.08,-1,5.4,3.7,1.13,'#b99b64','#d7bc82',true,Math.PI/2);
 c.block(-1,9.25,-1,1.8,.8,1.8,'#aa7744',6000);
 c.roof(-1,9.45,-1,3.8,3.1,1.1,'#c09d55','#ddbd7e',true);
 c.roof(-1,9.48,-1,3.8,3.1,1.1,'#c09d55','#ddbd7e',true,Math.PI/2);
 // The cross-plan tower has exposed triangular gables, unlike a simple stacked pagoda.
 for(const [base,half,offset,rise] of [[7.0,1.0,2.3,1.05],[8.7,.72,1.65,1.05],[10.05,.48,1.1,.72]]){
  for(let axis=0;axis<2;axis++)for(const side of [-1,1]){
   for(let i=0;i<4200;i++){const u=range(-half,half),v=range(0,rise);if(v>rise*(1-Math.abs(u)/half))continue;const x=axis===0?-1+u:-1+side*offset,z=axis===0?-1+side*offset:-1+u;c.add(x,base+v,z,'#a17b48');}
   const a=axis===0?[-1-half,base,-1+side*offset]:[-1+side*offset,base,-1-half];const b=axis===0?[-1,base+rise,-1+side*offset]:[-1+side*offset,base+rise,-1];const e=axis===0?[-1+half,base,-1+side*offset]:[-1+side*offset,base,-1+half];c.line(a,b,'#d2cbb3',450);c.line(b,e,'#d2cbb3',450);
  }
 }
 c.line([-1,10.6,-1],[-1,11.2,-1],'#e5c48d',400);
 // Moat is outside both wall faces, winter surface broken into pale blue points.
 for(let i=0;i<85000;i++){const x=range(-24,22),z=range(-24,23);if(x>1.1||z>1.1)c.add(x,-.3+Math.sin(x*.7+z)*.012,z,'#73898e',.42);}
 corner.add(c.finish());
 const snowPos=new Float32Array(2300*3),snowData=Array.from({length:2300},()=>[range(-20,24),range(0,18),range(-15,25),range(.55,1.2)]);
 const snowGeo=new T.BufferGeometry();snowGeo.setAttribute('position',new T.BufferAttribute(snowPos,3));
 const snow=new T.Points(snowGeo,new T.PointsMaterial({color:'#e0e8ec',size:.055,transparent:true,opacity:.72,depthWrite:false}));snow.frustumCulled=false;corner.add(snow);
 return{corner,drum,update(time,reduced,shot){if(shot!==1)return;const t=reduced?0:time;for(let i=0;i<snowData.length;i++){const [x,y,z,s]=snowData[i];snowPos[i*3]=x+Math.sin(t*.35+i)*.5;snowPos[i*3+1]=18-((18-y+t*s)%18);snowPos[i*3+2]=z+Math.sin(t*.2+i)*.4;}snowGeo.attributes.position.needsUpdate=true;}};
}
