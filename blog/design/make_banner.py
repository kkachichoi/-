"""네이버 블로그 타이틀 배너 2안 (PRJ-19). 사용: python3 make_banner.py <폰트폴더>"""
import sys, os
from PIL import Image, ImageDraw, ImageFont
FD = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))
PH = os.path.join(HERE, "..", "..", "shorts-project", "my-photos")
OUT = os.path.join(HERE, "banner"); os.makedirs(OUT, exist_ok=True)
W, H = 966, 300
INK, PAPER, BLUE, MUTED = (21, 24, 30), (246, 247, 249), (43, 89, 163), (93, 102, 117)
f = lambda n, s: ImageFont.truetype(os.path.join(FD, n), s)
logo = Image.open(os.path.join(PH, "11_까치_로고.png")).convert("RGBA")
NAME1, NAME2 = "광명 하안동 까치카페", "조각가의 커피와 빵"

def cover(img, w, h, fy=0.5):
    r = max(w / img.width, h / img.height)
    img = img.resize((round(img.width * r), round(img.height * r)), Image.LANCZOS)
    x = (img.width - w) // 2; y = int((img.height - h) * fy)
    return img.crop((x, y, x + w, y + h))

def ph(n): return Image.open(os.path.join(PH, n)).convert("RGB")

# A: 왼쪽 종이색 이름판 + 오른쪽 사진 3칸
a = Image.new("RGB", (W, H), PAPER); d = ImageDraw.Draw(a)
lg = logo.resize((84, 84)); a.paste(lg, (40, 44), lg)
d.text((40, 146), NAME1, font=f("DoHyeon-Regular.ttf", 46), fill=INK)
d.rectangle((40, 206, 46, 236), fill=BLUE)
d.text((58, 206), NAME2, font=f("NanumGothic-Bold.ttf", 26), fill=BLUE)
d.text((40, 256), "13년째 같은 자리 · 매일 굽는 베이글과 스콘", font=f("NanumGothic-Bold.ttf", 17), fill=MUTED)
x0, cw, gap = 470, 160, 6
for i, (n, fy) in enumerate([("09_사장님_라떼아트.jpg", 0.55), ("05_진열장_스콘베이글.jpg", 0.62), ("10_코끼리_조각.jpg", 0.5)]):
    a.paste(cover(ph(n), cw, H, fy), (x0 + i * (cw + gap), 0))
a.save(os.path.join(OUT, "A_이름판_사진3칸.jpg"), quality=93)

# B: 카운터 사진 전체 + 왼쪽으로 어두워지는 그늘 + 흰 글씨
b = cover(ph("06_카운터_전경.jpg"), W, H, 0.45)
mask = Image.new("L", (W, 1))
for x in range(W): mask.putpixel((x, 0), int(225 * max(0, 1 - x / (W * 0.72)) ** 0.9))
b = Image.composite(Image.new("RGB", (W, H), INK), b, mask.resize((W, H)))
d = ImageDraw.Draw(b)
bg = Image.new("RGBA", (92, 92), (255, 255, 255, 235)); b.paste(bg, (40, 40), bg)
lg = logo.resize((76, 76)); b.paste(lg, (48, 48), lg)
d.text((40, 150), NAME1, font=f("BlackHanSans-Regular.ttf", 48), fill=(255, 255, 255))
d.text((42, 214), NAME2, font=f("NanumGothic-Bold.ttf", 26), fill=(206, 220, 244))
d.text((42, 256), "13년째 같은 자리 · 매일 굽는 베이글과 스콘", font=f("NanumGothic-Bold.ttf", 17), fill=(220, 226, 236))
b.save(os.path.join(OUT, "B_카운터_사진.jpg"), quality=93)

s = Image.new("RGB", (W + 80, H * 2 + 120), (255, 255, 255))
s.paste(a, (40, 40)); s.paste(b, (40, H + 80))
s.save(os.path.join(OUT, "비교_A_vs_B.jpg"), quality=90)
print(sorted(os.listdir(OUT)))
