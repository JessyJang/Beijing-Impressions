"""Original 48-second score. No recordings, samples or third-party melodies."""
from pathlib import Path
import json, subprocess, wave
import numpy as np
SR=32000
DURATION=48
rng=np.random.default_rng(1809)
mix=np.zeros((SR*DURATION,2),dtype=np.float64)
freq=lambda midi:440*2**((midi-69)/12)

def add(signal,at,pan=0,level=1):
    offset=int(at*SR)
    if offset<0:signal=signal[-offset:];offset=0
    length=min(len(signal),len(mix)-offset)
    if length<=0:return
    mix[offset:offset+length,0]+=signal[:length]*np.sqrt((1-pan)/2)*level
    mix[offset:offset+length,1]+=signal[:length]*np.sqrt((1+pan)/2)*level

def pad(at,notes,duration=11,level=.047):
    t=np.arange(int(duration*SR))/SR
    env=np.minimum(1,t/2.4)*np.minimum(1,(duration-t)/3.5)
    env=np.sin(np.maximum(0,env)*np.pi/2)**2
    for j,note in enumerate(notes):
        f=freq(note)
        sig=sum(np.sin(2*np.pi*f*(1+detune)*t+j*.7)*a for detune,a in [(-.0017,.38),(0,.4),(.0019,.22)])
        sig+=.12*np.sin(2*np.pi*f*2*t+.5*np.sin(t*.7))
        add(sig*env,at,(j/(len(notes)-1)-.5)*1.35,level)

def pluck(at,note,level=.09,pan=0):
    t=np.arange(int(3.8*SR))/SR;f=freq(note)
    sig=(np.sin(2*np.pi*f*t)*np.exp(-t*1.8)+.36*np.sin(2*np.pi*f*2.002*t)*np.exp(-t*4.5)+.12*np.sin(2*np.pi*f*3.997*t)*np.exp(-t*8))
    sig*=(1-np.exp(-t*220))*np.minimum(1,(3.8-t)/.2)
    add(sig,at,pan,level)
    add(sig,at+.375,-pan,level*.26);add(sig,at+.75,pan*.7,level*.13)

def bass(at,note,level=.08):
    t=np.arange(int(1.7*SR))/SR;f=freq(note)
    env=(1-np.exp(-t*28))*np.exp(-t*2.4)*np.minimum(1,(1.7-t)/.15)
    add((np.sin(2*np.pi*f*t)+.18*np.sin(4*np.pi*f*t))*env,at,0,level)

def pulse(at,level=.06):
    t=np.arange(int(.5*SR))/SR
    phase=2*np.pi*(44*t+38*.035*(1-np.exp(-t/.035)))
    add(np.sin(phase)*np.exp(-t*13)*(1-np.exp(-t*600)),at,0,level)

# D minor / suspended pentatonic colour; harmonic lift follows the architecture.
for at,notes,duration in [(0,[50,57,64,69],14),(10.5,[53,60,67,72],11),(18,[50,57,62,69],12),(27,[48,55,62,67],11),(34,[46,53,60,65],10),(40,[50,57,64,69],8)]:pad(at,notes,duration)
# Sparse opening, warmer street motif, spacious courtyard, faster metropolitan ostinato.
for at,note,lev,pan in [(2.25,74,.075,-.4),(4.5,69,.055,.3),(6.75,77,.075,.2),(9,81,.048,-.25),(13.5,74,.09,-.5),(14.25,77,.06,.4),(15.75,81,.07,-.2),(17.25,79,.055,.45),(20.25,74,.07,-.35),(23.25,69,.055,.25),(25.5,77,.06,-.15),(36.75,77,.07,-.4),(39,81,.065,.4),(42,86,.048,.1),(44.25,81,.035,-.2)]:pluck(at,note,lev,pan)
for i,note in enumerate([62,69,74,77,69,74,81,77,62,69,74,79,69,74,77,81]):pluck(28.5+i*.375,note,.045 if i%4 else .068,(-1 if i%2 else 1)*.4)
for at in np.arange(11.25,18,.75):pulse(at,.035 if int(at/.75)%2 else .055)
for at in np.arange(28.5,36,.75):pulse(at,.065)
for at,note in [(3,38),(9,38),(12,41),(15,41),(21,38),(27,36),(28.5,36),(30,36),(31.5,36),(33,36),(34.5,34),(36,34),(39,34),(42,38)]:bass(at,note,.075)
# Breath-like sweeps centred on actual transit times; noise is synthesised locally.
cues=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {filmTimeAt} from './src/film-rhythm.js'; console.log(JSON.stringify([8.7,15,22.2,29.5].map(filmTimeAt)))"]))
for j,cut in enumerate(cues):
    dur=2.8;t=np.arange(int(dur*SR))/SR
    white=rng.normal(0,1,len(t));kernel=np.ones(35+j*7)/(35+j*7)
    noise=np.convolve(white,kernel,mode='same')
    envelope=np.sin(np.pi*t/dur)**3
    sig=noise*envelope*(.65+.35*np.sin(t*8))
    add(sig,cut-1.7,-.65,.09);add(sig,cut-1.56,.65,.07)
    pluck(cut+.08,[81,77,86,81][j],.037,.25)
# Diffuse stereo reflections, then a soft peak ceiling. Keep headroom for headphones.
dry=mix.copy()
for delay,gain in [(.113,.17),(.197,.12),(.293,.11),(.431,.095),(.619,.075),(1.019,.05),(1.477,.035)]:
    n=int(delay*SR);mix[n:]+=dry[:-n,::-1]*gain
fade=np.minimum(1,np.arange(len(mix))/SR/1.8)*np.minimum(1,(len(mix)-1-np.arange(len(mix)))/SR/2.6)
mix*=fade[:,None]
mix=np.tanh(mix*1.8)
mix*=.76/max(np.max(np.abs(mix)),1e-9)
assert np.isfinite(mix).all()
path=Path('public/assets/beijing/audio/beijing-orbit.wav')
with wave.open(str(path),'wb') as w:
    w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((mix*32767).astype('<i2').tobytes())
print(json.dumps({'file':str(path),'duration':DURATION,'sampleRate':SR,'peak':float(abs(mix).max()),'rms':float(np.sqrt(np.mean(mix**2))),'transitionCues':cues}))
