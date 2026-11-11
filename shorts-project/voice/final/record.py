import json,base64,urllib.request
lines=json.load(open('final/lines.json'))
VID="cgSgspJ2msm6clMCkdW9"
for i,t in enumerate(lines,1):
    req=urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VID}/with-timestamps?output_format=mp3_44100_128",method="POST",
      headers={"Content-Type":"application/json"},
      data=json.dumps({"text":t,"model_id":"eleven_v3","language_code":"ko"}).encode())
    try: d=json.load(urllib.request.urlopen(req,timeout=170))
    except urllib.error.HTTPError as e: print(i,e.code,e.read()[:300]); break
    open(f"final/s{i:02d}.mp3","wb").write(base64.b64decode(d["audio_base64"]))
    json.dump(d.get("normalized_alignment") or d.get("alignment"),open(f"final/s{i:02d}.align.json","w"),ensure_ascii=False)
    a=d.get("alignment") or {}
    print(i, round(a["character_end_times_seconds"][-1],2) if a else None)
