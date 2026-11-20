"""까치카페 썸네일 틀 2종 (PRJ-06). 사용: python3 make_thumbs.py <폰트폴더>"""
import sys, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
FD = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))
PH = os.path.join(HERE, "..", "my-photos")
OUT = os.path.join(HERE, "thumbs"); os.makedirs(OUT, exist_ok=True)
W, H = 1080, 1920
INK, PAPER, BLUE = (21, 24, 30), (246, 247, 249), (43, 89, 163)
f = lambda name, s: ImageFont.truetype(os.path.join(FD, name), s)
logo = Image.open(os.path.join(PH, "11_까치_로고.png")).convert("RGBA")

def cover(img, w, h):
    r = max(w / img.width, h / img.height)
    img = img.resize((round(img.width * r), round(img.height * r)), Image.LANCZOS)
    x, y = (img.width - w) // 2, (img.height - h) // 2
    return img.crop((x, y, x + w, y + h))

def lines(d, text, font, x, y, fill, gap=12, anchor="la"):
    for ln in text.split("\n"):
        d.text((x, y), ln, font=font, fill=fill, anchor=anchor)
        y += font.size + gap
    return y

def template_a(photo, series, title, out):
    """작가 노트: 위 사진, 아래 종이색 띠에 제목"""
    c = Image.new("RGB", (W, H), PAPER)
    c.paste(cover(Image.open(os.path.join(PH, photo)).convert("RGB"), W, 1300), (0, 0))
    d = ImageDraw.Draw(c)
    d.rectangle((0, 1300, W, H), fill=PAPER)
    d.rectangle((72, 1370, 72 + 8, 1430), fill=BLUE)
    d.text((100, 1372), series, font=f("NanumGothic-Bold.ttf", 44), fill=BLUE)
    lines(d, title, f("DoHyeon-Regular.ttf", 118), 72, 1470, INK, gap=14)
    lg = logo.resize((120, 120)); c.paste(lg, (W - 72 - 120, H - 72 - 120), lg)
    d.text((72, H - 120), "광명 까치카페 · 조각가가 내리는 커피", font=f("NanumGothic-Bold.ttf", 36), fill=(93, 102, 117))
    c.save(os.path.join(OUT, out), quality=92)

def template_b(photo, series, title, out):
    """까치 블랙: 사진 전체 + 아래로 어두워지는 그라데이션, 흰 굵은 제목"""
    c = cover(Image.open(os.path.join(PH, photo)).convert("RGB"), W, H)
    grad = Image.new("L", (1, H))
    for y in range(H):
        t = max(0, (y - H * 0.42) / (H * 0.58)); grad.putpixel((0, y), int(235 * min(1, t) ** 1.2))
    shade = Image.new("RGB", (W, H), INK)
    c = Image.composite(shade, c, grad.resize((W, H)))
    d = ImageDraw.Draw(c)
    lg = logo.resize((140, 140)); bg = Image.new("RGBA", (172, 172), (255, 255, 255, 235))
    c.paste(bg, (60, 60), bg); c.paste(lg, (76, 76), lg)
    sf = f("NanumGothic-Bold.ttf", 42); tw = d.textlength(series, font=sf)
    d.rounded_rectangle((72, 1340, 72 + tw + 48, 1340 + 74), radius=37, fill=BLUE)
    d.text((96, 1350), series, font=sf, fill=(255, 255, 255))
    lines(d, title, f("BlackHanSans-Regular.ttf", 128), 72, 1450, (255, 255, 255), gap=10)
    d.text((72, H - 110), "@kkachi_cafe", font=f("NanumGothic-Bold.ttf", 38), fill=(220, 226, 236))
    c.save(os.path.join(OUT, out), quality=92)

samples = [
    ("09_사장님_라떼아트.jpg", "사장님의 손 #3", "조각하던 손으로\n라떼를 그립니다"),
    ("05_진열장_스콘베이글.jpg", "까치카페 이야기", "13년째\n같은 자리"),
]
for i, (p, s, t) in enumerate(samples, 1):
    template_a(p, s, t, f"A_작가노트_{i}.jpg")
    template_b(p, s, t, f"B_까치블랙_{i}.jpg")
# 비교용 한 장
ims = [Image.open(os.path.join(OUT, n)) for n in ["A_작가노트_1.jpg", "B_까치블랙_1.jpg", "A_작가노트_2.jpg", "B_까치블랙_2.jpg"]]
sheet = Image.new("RGB", (W * 4 + 60 * 5, H + 120), PAPER)
for i, im in enumerate(ims): sheet.paste(im, (60 + i * (W + 60), 60))
sheet.resize((sheet.width // 3, sheet.height // 3), Image.LANCZOS).save(os.path.join(OUT, "비교_A_vs_B.jpg"), quality=90)
print("done", sorted(os.listdir(OUT)))
