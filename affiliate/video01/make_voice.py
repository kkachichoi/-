import json, base64, urllib.request
VID = "cgSgspJ2msm6clMCkdW9"  # 첫 쇼츠 때 고른 목소리
lines = [
  "요즘 날씨가 추워지면서, 담요 챙기시는 분들 많으시죠?",
  "카페에서는 더 추워지기 전에, 담요를 미리 준비해 두면 정말 좋아요.",
  "보들보들한 폴라폴리스 담요, 세 장 한 세트가 꽤 싸게 나왔더라고요.",
  "관심 있으신 분들은 댓글에 담요라고 남겨 주세요. 링크 보내 드릴게요.",
]
json.dump(lines, open("lines.json", "w"), ensure_ascii=False)
for i, t in enumerate(lines, 1):
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VID}/with-timestamps?output_format=mp3_44100_128",
        method="POST", headers={"Content-Type": "application/json", "xi-api-key": "dummy"},
        data=json.dumps({"text": t, "model_id": "eleven_v3", "language_code": "ko"}).encode())
    d = json.load(urllib.request.urlopen(req, timeout=170))
    open(f"s{i}.mp3", "wb").write(base64.b64decode(d["audio_base64"]))
    a = d.get("alignment") or {}
    print(i, round(a["character_end_times_seconds"][-1], 2) if a else "?")
