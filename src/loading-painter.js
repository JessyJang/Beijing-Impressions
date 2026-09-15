// Runs away from model-generation work so the splash remains animated while assets load.
export function paintLoading(canvas,data){
 const ctx=canvas.getContext('2d',{alpha:true});let {width:w,height:h,dpr,quiet}=data;
 let seed=2709;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 const air=Array.from({length:1100},()=>({x:rand(),y:rand(),r:rand(),v:rand(),phase:rand()*6.28}));
 const sprites=['#dbcfaf','#91b6b6','#cda077'].map(color=>{const c=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(40,40):document.createElement('canvas');c.width=c.height=40;const x=c.getContext('2d'),g=x.createRadialGradient(20,20,0,20,20,20);g.addColorStop(0,color);g.addColorStop(.08,color+'ed');g.addColorStop(.23,color+'24');g.addColorStop(1,color+'00');x.fillStyle=g;x.fillRect(0,0,40,40);return c;});
 function resize(size){w=size.width;h=size.height;dpr=size.dpr;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);}
 resize(data);
 const handleResize=e=>resize(e.detail);canvas.addEventListener?.('art-resize',handleResize);
 let start=performance.now(),frame,stopped=false,lastDraw=-100;
 function dot(x,y,size,alpha,color=0){ctx.globalAlpha=alpha;ctx.drawImage(sprites[color],x-size/2,y-size/2,size,size);}
 function draw(now){if(stopped)return;frame=requestAnimationFrame(draw);if(now-lastDraw<32)return;lastDraw=now;
  const t=quiet?1.5:(now-start)/1000;
  ctx.clearRect(0,0,w,h);ctx.globalCompositeOperation='lighter';
  for(const p of air){const x=((p.x*w+Math.sin(t*.13+p.phase)*34+t*(p.v-.5)*5)%w+w)%w,y=((p.y*h-t*(2+p.v*5)+Math.cos(t*.17+p.phase)*18)%h+h)%h;dot(x,y,2+p.r**4*7,.13+p.v*.45,p.r>.8?2:1);}
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
 }
 frame=requestAnimationFrame(draw);
 return Object.assign(()=>{stopped=true;cancelAnimationFrame(frame);canvas.removeEventListener?.('art-resize',handleResize);},{resize});
}
if(typeof document==='undefined'){
 let stop;
 self.onmessage=e=>{if(e.data.canvas)stop=paintLoading(e.data.canvas,e.data);else if(e.data.resize)stop?.resize(e.data.resize);};
}
