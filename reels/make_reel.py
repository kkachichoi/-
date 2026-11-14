#!/usr/bin/env python3
"""까창 릴스 생성기: 장면 목록(JSON) → 하이퍼프레임즈 프로젝트(index.html).

사용법:
    python3 make_reel.py spec.json 프로젝트폴더

spec.json 예시:
{
  "bpm": 88,                       # 음악 빠르기. 장면 길이는 '마디'(4박) 단위
  "scenes": [
    {"bg": "kraft", "bars": 1, "tag": "작은 머리글",
     "lines": ["보통 줄", "*강조* 단어가 있는 줄", {"t": "작은 줄", "s": "small"}]},
    {"bg": "assets/sofa.jpg", "pos": "40% 50%", "zoom": "out", "bars": 2, "top": 1300,
     "lines": [{"t": "손글씨 줄", "s": "hand"}, {"count": 1000, "suffix": "명"}]}
  ]
}
- bg: "kraft"(크라프트지 배경) 또는 사진 경로
- 줄 스타일 s: big(기본) / small / hand / num(아주 큰 숫자)
- *단어* 는 강조색, count 는 0부터 숫자가 올라가는 애니메이션
"""
import html
import json
import re
import sys
from pathlib import Path

spec = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
out = Path(sys.argv[2])
bar = 4 * 60.0 / spec["bpm"]


def fmt_line(text):
    text = html.escape(text)
    return re.sub(r"\*(.+?)\*", r'<span class="hl">\1</span>', text)


sections, scene_js = [], []
t = 0.0
used_imgs = {}
for i, sc in enumerate(spec["scenes"], 1):
    dur = round(sc.get("bars", 1) * bar, 3)
    sid = f"s{i}"
    kraft = sc["bg"] == "kraft"
    parts = [f'<section id="{sid}" class="scene clip {"kraft" if kraft else "photo"}" '
             f'data-start="{round(t, 3)}" data-duration="{dur}" data-track-index="0">']
    if kraft:
        parts.append('<div class="paper"></div>')
    else:
        src = sc["bg"]
        # 같은 사진을 두 번 쓰면 별도 파일로 복사 (하이퍼프레임즈 중복 미디어 경고 방지)
        n = used_imgs.get(src, 0)
        used_imgs[src] = n + 1
        if n:
            p = Path(src)
            dup = f"{p.parent}/{p.stem}_{n}{p.suffix}"
            (out / dup).write_bytes((out / src).read_bytes())
            src = dup
        parts.append(f'<img data-layout-allow-overflow src="{src}" style="object-position: {sc.get("pos", "50% 50%")}" alt="" />')
        parts.append('<div class="shade"></div>')
    if sc.get("tag"):
        parts.append(f'<div class="tag">{fmt_line(sc["tag"])}</div>')
    top = sc.get("top", 900)
    parts.append(f'<div class="copy" style="top: {top}px">')
    for ln in sc.get("lines", []):
        if isinstance(ln, str):
            ln = {"t": ln}
        if "count" in ln:
            parts.append(f'<span class="line num"><span class="counter" data-to="{ln["count"]}">0</span>'
                         f'{html.escape(ln.get("suffix", ""))}</span>')
        else:
            parts.append(f'<span class="line {ln.get("s", "")}">{fmt_line(ln["t"])}</span>')
    parts.append("</div></section>")
    sections.append("\n".join(parts))
    scene_js.append(f'["#{sid}", {round(t, 3)}, {dur}, "{sc.get("zoom", "in" if i % 2 else "out")}"]')
    t += dur

total = round(t, 3)
page = (Path(__file__).parent / "reel_template.html").read_text(encoding="utf-8")
page = (page.replace("{{TOTAL}}", str(total))
            .replace("{{SECTIONS}}", "\n".join(sections))
            .replace("{{SCENES}}", ",\n        ".join(scene_js)))
(out / "index.html").write_text(page, encoding="utf-8")

# 폰트 서브셋에 쓸 글자 목록
chars = set()
for sc in spec["scenes"]:
    for ln in [sc.get("tag", "")] + sc.get("lines", []):
        if isinstance(ln, dict):
            chars |= set(ln.get("t", "") + ln.get("suffix", "") + "0123456789,")
        else:
            chars |= set(ln)
(out / "chars.txt").write_text("".join(sorted(chars)) + "@.abcdefghijklmnopqrstuvwxyz", encoding="utf-8")
print(f"완성: {out}/index.html ({total}초, 장면 {len(spec['scenes'])}개, 1마디 {bar:.3f}초)")
