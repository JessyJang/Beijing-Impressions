// All surfaces have actual world coordinates; no image-facing scene planes.
export const PORTAL={xMin:-4.6,xMax:-.8,height:6.3,z:-20};
export function canOccupy(x,y,z){return x> -6.65&&x<6.65&&y>.65&&y<7.3&&z<5.5&&z> -41.5&&(Math.abs(z+20)>.45||(x>PORTAL.xMin+.25&&x<PORTAL.xMax-.25&&y<PORTAL.height-.25));}
export function makeWorld(step=.075){
 let seed=2419;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const p=[],c=[],kind=[],sizes=[];
 function add(x,y,z,r,g,b,k=0,s=1){p.push(x,y,z);c.push(r,g,b);kind.push(k);sizes.push(s);}
 function surface(axis,fixed,a0,a1,b0,b1,tone,skip=()=>false){for(let a=a0;a<a1;a+=step)for(let b=b0;b<b1;b+=step){let aa=a+(rnd()-.5)*step*.7,bb=b+(rnd()-.5)*step*.7;let [x,y,z]=axis===0?[fixed,aa,bb]:axis===1?[aa,fixed,bb]:[aa,bb,fixed];if(skip(x,y,z))continue;let n=.82+rnd()*.23;let seam=(Math.abs((z+60)%2.5)<.025||Math.abs(y%1.35)<.018)? .7:1;const light=.80+.2*Math.sin(z*.12+1);add(x,y,z,tone[0]*n*seam*light,tone[1]*n*seam*light,tone[2]*n*seam*light,0,.78+rnd()*.45);}}
 const stone=[.63,.71,.73],ice=[.46,.59,.64];
 for(const x of [-7,7]) surface(0,x,0,8,-43,6,x<0?stone:ice,(x,y,z)=>x>0&&y>3&&y<6.6&&((z> -13&&z< -8)||(z> -36&&z< -28)));
 surface(1,8,-7,7,-43,6,[.64,.71,.73]);
 surface(2,6,-7,7,0,8,stone);surface(2,-43,-7,7,0,8,ice);
 surface(2,-20,-7,7,0,8,stone,(x,y)=>x>PORTAL.xMin&&x<PORTAL.xMax&&y<PORTAL.height);
 // Deep portal jambs: visible reveals when viewed obliquely.
 for(const x of [PORTAL.xMin,PORTAL.xMax])surface(0,x,0,PORTAL.height,-20.4,-19.6,[.8,.83,.79]);
 surface(1,PORTAL.height,PORTAL.xMin,PORTAL.xMax,-20.4,-19.6,[.74,.79,.78]);
 // Repeated ceiling beams and wall pilasters give perspective and material scale.
 for(let z=2;z> -43;z-=5){surface(2,z,-7,7,7.65,8,[.78,.81,.78]);for(const x of [-6.82,6.82])surface(0,x,0,7.8,z-.10,z+.10,[.77,.8,.77]);}
 // Reflective shallow floor: caustic colors animate independently in shader.
 for(let x=-7;x<7;x+=step)for(let z=6;z> -43;z-=step){let v=.43+.13*Math.sin(x*1.4+z*.6)*Math.sin(z*1.9);add(x+(rnd()-.5)*step*.8,0,z+(rnd()-.5)*step*.8,v*.8,v,v*1.13,1,.95);}
 // Meadow stems form a genuine low volume, leaving a winding walking channel.
 for(let i=0;i<28000;i++){const x=(rnd()-.5)*13.8,z=-21-rnd()*21;const path=-2.7+Math.sin((z+20)*.19)*1.6;if(Math.abs(x-path)<.85)continue;const h=.15+rnd()*.75;for(let j=0;j<5;j++){const t=j/4;add(x+t*t*.15,t*h,z,.20+rnd()*.16,.34+rnd()*.18,.24+rnd()*.14,2,.75+rnd()*.5);}}
 // Cloud volume: overlapping ellipsoidal lobes; particles also occupy their interiors.
 const lobes=[[-.5,4,-10,2.6,1.5,2.7],[-2.1,3.8,-13,2.1,1.7,2.5],[-2.8,3.5,-16,1.7,1.5,2.5],[-2.7,3.2,-19,1.4,1.3,2.5],[-2.6,3.6,-22,1.7,1.3,2.4],[1.4,4.7,-10,2.2,1.5,1.8]];
 for(let i=0;i<58000;i++){const l=lobes[Math.floor(rnd()*lobes.length)];let x=rnd()*2-1,y=rnd()*2-1,z=rnd()*2-1;if(x*x+y*y+z*z>1){i--;continue;}let shade=.72+.20*(y*.5+.5)+rnd()*.06;add(l[0]+x*l[3],l[1]+y*l[4],l[2]+z*l[5],shade*.94,shade*.98,shade,3,.6+rnd()*1.6);}
 // A hovering weather sphere is visible beyond the door: a destination to approach.
 for(let i=0;i<10500;i++){const a=rnd()*Math.PI*2,v=rnd()*2-1,r=1.05+(rnd()-.5)*.1;const h=Math.sqrt(1-v*v);add(2.4+r*h*Math.cos(a),3.3+r*v,-34+r*h*Math.sin(a),.89,.68+rnd()*.12,.48+rnd()*.14,4,.7+rnd());}
 return {positions:new Float32Array(p),colors:new Float32Array(c),kinds:new Float32Array(kind),sizes:new Float32Array(sizes)};
}
