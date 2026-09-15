"""Prepend an original 14-second cold-to-warm cue to the preserved v24 score."""
from pathlib import Path
import wave
import numpy as np
SR=32000;DURATION=14
with wave.open('archive/beijing-flow-v24/audio/beijing-orbit.wav','rb') as w:
    assert w.getframerate()==SR and w.getnchannels()==2
    original=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').reshape(-1,2).astype(float)/32767
out=np.zeros((SR*DURATION,2));rng=np.random.default_rng(2509)
def add(sig,at,level=.1,pan=0):
    start=int(at*SR);n=min(len(sig),len(out)-start)
    if n>0:out[start:start+n]+=sig[:n,None]*np.array([np.sqrt((1-pan)/2),np.sqrt((1+pan)/2)])[None,:]*level
for at,notes,dur in [(0,[50,57,64,69],9),(6,[53,60,67,72],8)]:
    t=np.arange(int(dur*SR))/SR;env=np.sin(np.pi*np.minimum(1,t/1.8)/2)**2*np.minimum(1,(dur-t)/2.2)
    for j,n in enumerate(notes):
        f=440*2**((n-69)/12);sig=(np.sin(2*np.pi*f*t)+.24*np.sin(2*np.pi*f*1.002*t))*env
        add(sig,at,.07,(j-1.5)/3)
for at,n in [(1.5,81),(4.25,77),(7.6,74),(8.35,77),(10.6,81),(12,77)]:
    t=np.arange(int(2*SR))/SR;f=440*2**((n-69)/12);sig=(np.sin(2*np.pi*f*t)*np.exp(-t*2)+.25*np.sin(2*np.pi*f*2.003*t)*np.exp(-t*5))*(1-np.exp(-t*250));add(sig,at,.095,-.3 if n%2 else .3)
t=np.arange(3*SR)/SR;wind=np.convolve(rng.normal(size=len(t)),np.ones(55)/55,mode='same')*np.sin(np.pi*t/3)**2;add(wind,5.25,.15,-.4);add(wind,5.4,.12,.4)
dry=out.copy()
for delay,gain in [(.17,.17),(.41,.12),(.73,.08),(1.13,.05)]:
    n=int(delay*SR);out[n:]+=dry[:-n,::-1]*gain
fade=np.minimum(1,np.arange(len(out))/SR/1.2)*np.minimum(1,(len(out)-1-np.arange(len(out)))/SR/1.1)
out*=fade[:,None];out=np.tanh(out*1.65)
combined=np.concatenate([out,original]);assert np.isfinite(combined).all() and abs(combined).max()<1
with wave.open('public/assets/beijing/audio/beijing-orbit.wav','wb') as w:
    w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((combined*32767).astype('<i2').tobytes())
print('Score: 62 seconds, stereo; peak',abs(combined).max())
