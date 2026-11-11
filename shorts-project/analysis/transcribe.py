import json
from faster_whisper import WhisperModel
import soundfile as sf
aud,_=sf.read('analysis/audio.wav',dtype='float32')
m=WhisperModel('medium',device='cpu',compute_type='int8')
segs,info=m.transcribe(aud,language='ko',word_timestamps=True,vad_filter=True)
out=[]
for s in segs:
    out.append({"start":round(s.start,2),"end":round(s.end,2),"text":s.text.strip()})
    print(f"[{s.start:6.2f}-{s.end:6.2f}] {s.text.strip()}",flush=True)
json.dump(out,open('analysis/transcript.json','w'),ensure_ascii=False,indent=1)
