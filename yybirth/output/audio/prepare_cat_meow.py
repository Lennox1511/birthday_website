from pathlib import Path
import urllib.request,json,hashlib
import numpy as np
import soundfile as sf
from scipy.signal import butter,sosfiltfilt,resample

ROOT = Path(__file__).resolve().parents[2]
SOURCE_URL = 'https://cdn.freesound.org/previews/412/412016_3652520-hq.mp3'
SOURCE = ROOT / 'output/audio/cat_purr_meow_skymary.mp3'
OUTPUT = ROOT / '素材/小黑猫出场喵喵.wav'
SOURCE.parent.mkdir(parents=True, exist_ok=True)
if not SOURCE.exists():
    SOURCE.write_bytes(urllib.request.urlopen(urllib.request.Request(SOURCE_URL, headers={'User-Agent':'Mozilla/5.0'})).read())
x,sr = sf.read(SOURCE, dtype='float64')
if x.ndim > 1:
    x=x.mean(axis=1)
x -= x.mean()
# Keep the recording's natural meows and purr; suppress handling rumble and codec hiss.
x=sosfiltfilt(butter(2, 100, 'highpass', fs=sr, output='sos'), x)
x=sosfiltfilt(butter(2, 6800, 'lowpass', fs=sr, output='sos'), x)
# Use the last clear meow, removing the low purr lead-in so it starts with the cat.
clip=x[int(1.95*sr):int(2.68*sr)].copy()
edge=int(.012*sr)
clip[:edge]*=np.sin(np.linspace(0,np.pi/2,edge))**2
clip[-edge:]*=np.cos(np.linspace(0,np.pi/2,edge))**2
second=resample(clip,int(len(clip)*1.025))*.88
x=np.concatenate([np.zeros(int(.025*sr)),clip,np.zeros(int(.22*sr)),second,np.zeros(int(.10*sr))])
rms=np.sqrt(np.mean(x*x))
# Conservative file-level level also protects platforms with system-only media volume.
gain=min(10**(-24/20)/max(rms,1e-9), 10**(-12/20)/max(np.max(np.abs(x)),1e-9))
x*=gain
fi=int(.025*sr); fo=int(.12*sr)
x[:fi]*=np.sin(np.linspace(0,np.pi/2,fi))**2
x[-fo:]*=np.cos(np.linspace(0,np.pi/2,fo))**2
sf.write(OUTPUT,x,sr,subtype='PCM_16')
y,_=sf.read(OUTPUT)
stats={'file':str(OUTPUT),'duration_seconds':len(y)/sr,'sample_rate':sr,'channels':1,'subtype':'PCM_16','bytes':OUTPUT.stat().st_size,'peak_dbfs':round(float(20*np.log10(max(np.abs(y)))),2),'rms_dbfs':round(float(20*np.log10(np.sqrt(np.mean(y*y)))),2),'clipped_samples':int(np.sum(np.abs(y)>=1)),'sha256':hashlib.sha256(OUTPUT.read_bytes()).hexdigest()}
print(json.dumps(stats,ensure_ascii=False,indent=2))
(ROOT/'output/audio/cat-meow-stats.json').write_text(json.dumps(stats,ensure_ascii=False,indent=2),encoding='utf-8')

