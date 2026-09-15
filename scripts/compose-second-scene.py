"""Re-edit project-owned audio to match the inserted second scene and both overlaps."""
import json,subprocess,wave
import numpy as np
SR=32000
cfg=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {TEMPLE_END,WINTER_START,CLOCK_START,CLOCK_ARRIVAL,CLOCK_SOURCE,EDIT_DURATION} from './src/film-edit.js';console.log(JSON.stringify({TEMPLE_END,WINTER_START,CLOCK_START,CLOCK_ARRIVAL,CLOCK_SOURCE,EDIT_DURATION}))"]))
def read(path):
 with wave.open(path,'rb') as w:
  assert w.getframerate()==SR
  return np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').reshape(-1,2).astype(float)/32767
base=read('archive/beijing-flow-v24/audio/beijing-orbit.wav')
snow=read('archive/beijing-winter-breakfast-v25/audio/beijing-orbit.wav')[:7*SR]
out=np.zeros((round(cfg['EDIT_DURATION']*SR),2))
def add(samples,start,fadein=0,fadeout=0):
 start=round(start*SR);n=min(len(samples),len(out)-start);env=np.ones(n)
 if fadein:env*=np.clip(np.arange(n)/(fadein*SR),0,1)
 if fadeout:env*=np.clip((n-1-np.arange(n))/(fadeout*SR),0,1)
 out[start:start+n]+=samples[:n]*env[:,None]
add(base[:round(cfg['TEMPLE_END']*SR)],0,0,1.4)
def fit(samples,seconds):
 n=round(seconds*SR);positions=np.linspace(0,len(samples)-1,n)
 return np.column_stack([np.interp(positions,np.arange(len(samples)),samples[:,c]) for c in range(2)])
add(fit(snow,cfg['CLOCK_ARRIVAL']+1.4-cfg['WINTER_START']),cfg['WINTER_START'],1.4,1.4)
add(fit(base[round(cfg['CLOCK_SOURCE']*SR):],cfg['EDIT_DURATION']-cfg['CLOCK_ARRIVAL']),cfg['CLOCK_ARRIVAL'],1.4,0)
assert np.isfinite(out).all() and abs(out).max()<1
with wave.open('public/assets/beijing/audio/beijing-orbit.wav','wb') as w:
 w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((out*32767).astype('<i2').tobytes())
print(cfg)
