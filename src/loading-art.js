// A free-floating particle loading background, with no illustration sequence.
export function startLoadingArt({quiet=matchMedia('(prefers-reduced-motion: reduce)').matches}={}){
 const canvas=document.getElementById('loading-particles');
 let worker,dispose=()=>{},stopped=false;
 const data={width:innerWidth,height:innerHeight,dpr:Math.min(devicePixelRatio,1.5),quiet};
 const resize=()=>{const size={width:innerWidth,height:innerHeight,dpr:Math.min(devicePixelRatio,1.5)};if(worker)worker.postMessage({resize:size});else canvas.dispatchEvent(new CustomEvent('art-resize',{detail:size}));};
 if(canvas.transferControlToOffscreen&&typeof Worker!=='undefined'){
  const offscreen=canvas.transferControlToOffscreen();worker=new Worker('/src/loading-painter.js',{type:'module'});worker.postMessage({canvas:offscreen,...data},[offscreen]);dispose=()=>worker.terminate();
 }else{
  import('./loading-painter.js').then(({paintLoading})=>{if(stopped)return;dispose=paintLoading(canvas,data);});
 }
 addEventListener('resize',resize);
 const observer=new MutationObserver(()=>{if(document.body.classList.contains('ready')&&!stopped){stopped=true;setTimeout(()=>{dispose();removeEventListener('resize',resize);observer.disconnect();},1100);}});observer.observe(document.body,{attributes:true,attributeFilter:['class']});
}

export function setLoadingProgress(value){
 const bar=document.getElementById('loading-progress');
 const percent=Math.max(Number(bar.getAttribute('aria-valuenow')),Math.min(100,Math.round(value*100)));
 bar.setAttribute('aria-valuenow',String(percent));bar.style.setProperty('--loaded',String(percent/100));
}
