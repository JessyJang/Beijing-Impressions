"""Keep the original 48-second journey and append only the seven-second winter cue."""
import wave
import numpy as np
SR=32000
def read(path):
    with wave.open(path,'rb') as w:
        assert w.getframerate()==SR and w.getnchannels()==2
        return np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').reshape(-1,2).astype(float)/32767
original=read('archive/beijing-flow-v24/audio/beijing-orbit.wav')
winter=read('archive/beijing-winter-breakfast-v25/audio/beijing-orbit.wav')[:7*SR].copy()
t=np.arange(len(winter))/SR
winter*= (np.minimum(1,t/.7)*np.minimum(1,(7-t)/1.1))[:,None]
score=np.concatenate([original,winter]);assert len(score)==55*SR and np.isfinite(score).all()
with wave.open('public/assets/beijing/audio/beijing-orbit.wav','wb') as w:
    w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((score*32767).astype('<i2').tobytes())
print('55-second score; original journey followed by winter, breakfast cue removed.')
