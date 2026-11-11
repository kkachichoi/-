import json,base64,urllib.request,subprocess,numpy as np
from faster_whisper import WhisperModel
m=WhisperModel('medium',device='cpu',compute_type='int8')
t=json.load(open('final/lines.json'))[3]
for k in range(4):
    req=urllib.request.Request("https://api.elevenlabs.io/v1/text-to-speech/cgSgspJ2msm6clMCkdW9/with-timestamps?output_format=mp3_44100_128",method="POST",
      headers={"Content-Type":"application/json"},data=json.dumps({"text":t,"model_id":"eleven_v3","language_code":"ko"}).encode())
    d=json.load(urllib.request.urlopen(req,timeout=170))
    open("final/tmp.mp3","wb").write(base64.b64decode(d["audio_base64"]))
    raw=subprocess.run(['ffmpeg','-v','error','-i','final/tmp.mp3','-f','f32le','-ac','1','-ar','16000','-'],capture_output=True).stdout
    txt=''.join(s.text for s in m.transcribe(np.frombuffer(raw,np.float32),language='ko')[0]).strip()
    print(k,txt)
    if txt.startswith('원두'):
        import shutil; shutil.move("final/tmp.mp3","final/s04.mp3")
        json.dump(d.get("normalized_alignment") or d.get("alignment"),open("final/s04.align.json","w"),ensure_ascii=False); print("replaced"); break
