export function createFilmAudio(){
 const audio=new Audio('/assets/beijing/audio/beijing-orbit.wav');
 audio.preload='auto';audio.loop=true;audio.volume=.72;
 const button=document.createElement('button');button.className='sound-toggle';
 button.innerHTML='<span class="sound-bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="sound-label">开启声音</span>';
 button.type='button';button.setAttribute('aria-label','开启背景音乐');button.setAttribute('aria-pressed','false');
 document.body.appendChild(button);
 let enabled=false,playTime=0,stopped=true,pending=false;
 const label=button.querySelector('.sound-label');
 function paint(){button.dataset.on=String(enabled);button.setAttribute('aria-pressed',String(enabled));button.setAttribute('aria-label',enabled?'关闭背景音乐':'开启背景音乐');label.textContent=enabled?'声音已开启':'开启声音';}
 async function start(){
  if(pending||!enabled||stopped)return;pending=true;
  try{audio.currentTime=playTime;audio.playbackRate=1;await audio.play();}
  catch{enabled=false;paint();label.textContent='点击重试声音';}
  finally{pending=false;}
 }
 button.addEventListener('click',()=>{enabled=!enabled;paint();if(enabled)start();else audio.pause();});
 audio.addEventListener('error',()=>{enabled=false;paint();label.textContent='音乐加载失败';});
 return{update(time,paused){
  playTime=time;stopped=paused||document.hidden;
  button.dataset.playing=String(enabled&&!stopped);
  if(stopped||!enabled){if(!audio.paused)audio.pause();return;}
  if(audio.paused)start();
  else {
   const drift=time-audio.currentTime;
   // Small clock differences are corrected gradually, without repeated audible seeks.
   if(Math.abs(drift)>.9){audio.currentTime=time;audio.playbackRate=1;}
   else audio.playbackRate=Math.abs(drift)<.035?1:Math.max(.97,Math.min(1.03,1+drift*.12));
  }
 },get state(){return {enabled,paused:audio.paused,time:audio.currentTime,ready:audio.readyState,duration:Number.isFinite(audio.duration)?audio.duration:0};}};
}
