"""무릎담요 쿠팡 파트너스 쇼츠: 장면 이미지 + 목소리 → mp4. 사용: python3 make_video.py <폰트폴더>"""
import sys, os, json, subprocess
from PIL import Image, ImageDraw, ImageFont, ImageFilter
FD = sys.argv[1]; HERE = os.path.dirname(os.path.abspath(__file__))
PH = os.path.join(HERE, "..", "..", "shorts-project", "my-photos")
W, H = 1080, 1920
f = lambda n, s: ImageFont.truetype(os.path.join(FD, n), s)
lines = json.load(open(os.path.join(HERE, "lines.json")))
subs = [
  "요즘 날씨가 추워지면서\n담요 챙기시는 분들 많으시죠?",
  "더 추워지기 전에\n담요를 미리 준비해 두세요",
  "보들보들 폴라폴리스 담요\n3장 한 세트가 꽤 싸게 나왔어요",
  "댓글에 '담요'라고 남기면\n링크 보내 드려요",
]
photos = ["07_카페_구석_인테리어.jpg", "06_카운터_전경.jpg", None, "09_사장님_라떼아트.jpg"]
logo = Image.open(os.path.join(PH, "11_까치_로고.png")).convert("RGBA")

def cover(img, w, h):
    r = max(w / img.width, h / img.height)
    img = img.resize((round(img.width * r), round(img.height * r)), Image.LANCZOS)
    x, y = (img.width - w) // 2, (img.height - h) // 2
    return img.crop((x, y, x + w, y + h))

def overlay(img, sub):
    d = ImageDraw.Draw(img, "RGBA")
    # 상단 광고 표시 (영상 내내)
    d.rectangle((0, 0, W, 150), fill=(0, 0, 0, 150))
    d.text((W // 2, 96), "광고 · 쿠팡 파트너스 활동으로 수수료를 받아요", font=f("NanumGothic-Bold.ttf", 38), fill="white", anchor="ms")
    # 아래 자막
    grad = Image.new("L", (1, 700))
    for y in range(700): grad.putpixel((0, y), int(200 * (y / 700) ** 1.4))
    img.paste(Image.new("RGB", (W, 700), (15, 15, 18)), (0, H - 700), grad.resize((W, 700)))
    d = ImageDraw.Draw(img)
    y = H - 420
    for ln in sub.split("\n"):
        d.text((W // 2, y), ln, font=f("BlackHanSans-Regular.ttf", 78), fill="white", anchor="ms", stroke_width=4, stroke_fill=(20, 20, 20))
        y += 108
    lg = logo.resize((110, 110)); bg = Image.new("RGBA", (130, 130), (255, 255, 255, 230))
    img.paste(bg, (W - 170, 190), bg); img.paste(lg, (W - 160, 200), lg)
    return img

def product_card():
    bg = cover(Image.open(os.path.join(PH, "07_카페_구석_인테리어.jpg")).convert("RGB"), W, H).filter(ImageFilter.GaussianBlur(26))
    d = ImageDraw.Draw(bg, "RGBA")
    d.rounded_rectangle((90, 520, W - 90, 1250), radius=48, fill=(250, 247, 242, 240))
    d.text((W // 2, 640), "🧣", font=f("NanumGothic-Bold.ttf", 10), fill=(0, 0, 0, 0), anchor="ms")
    d.text((W // 2, 700), "폴라폴리스", font=f("BlackHanSans-Regular.ttf", 110), fill=(43, 89, 163), anchor="ms")
    d.text((W // 2, 840), "무릎담요 3장 세트", font=f("BlackHanSans-Regular.ttf", 100), fill=(21, 24, 30), anchor="ms")
    d.line((260, 905, W - 260, 905), fill=(200, 196, 188), width=3)
    d.text((W // 2, 990), "보들보들 · 3장이라 집·차·사무실에", font=f("NanumGothic-Bold.ttf", 46), fill=(93, 102, 117), anchor="ms")
    d.text((W // 2, 1080), "아침과저녁 · 쿠팡", font=f("NanumGothic-Bold.ttf", 40), fill=(140, 146, 156), anchor="ms")
    d.text((W // 2, 1175), "가격은 링크에서 확인해 주세요", font=f("NanumGothic-Bold.ttf", 36), fill=(160, 120, 40), anchor="ms")
    return bg

seg = []
for i in range(4):
    img = product_card() if photos[i] is None else cover(Image.open(os.path.join(PH, photos[i])).convert("RGB"), W, H)
    img = overlay(img, subs[i]); fn = os.path.join(HERE, f"scene{i+1}.png"); img.save(fn)
    mp3 = os.path.join(HERE, f"s{i+1}.mp3")
    dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp3])) + 0.5
    out = os.path.join(HERE, f"seg{i+1}.mp4"); fr = int(dur * 30)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-loop", "1", "-i", fn, "-i", mp3,
        "-filter_complex", f"[0:v]scale=1188:2112,zoompan=z='min(zoom+0.0006,1.08)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={fr}:s=1080x1920:fps=30,format=yuv420p[v];[1:a]apad=pad_dur=0.5,atrim=0:{dur:.2f}[a]",
        "-map", "[v]", "-map", "[a]", "-t", f"{dur:.2f}", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-c:a", "aac", "-b:a", "160k", out], check=True)
    seg.append(out)
open(os.path.join(HERE, "list.txt"), "w").write("".join(f"file '{s}'\n" for s in seg))
final = os.path.join(HERE, "무릎담요_쇼츠_초안.mp4")
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", os.path.join(HERE, "list.txt"), "-c", "copy", final], check=True)
print("ok", final, subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", final]).decode().strip())
