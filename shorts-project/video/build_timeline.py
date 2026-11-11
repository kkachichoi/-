"""Build src/timeline.json: scene timing, shots and subtitles from the recorded narration."""
import json, re, shutil, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
VOICE = ROOT.parent / "voice" / "final"
PHOTOS = ROOT.parent / "my-photos"
PUBLIC = ROOT / "public"
FPS = 30
GAP = 0.45          # pause after each scene's line (seconds)
LEAD_IN = 0.25      # silence before the first word
LOGO = 4.0          # logo scene length
MAX_CHARS = 16      # longest subtitle line

PUBLIC.mkdir(exist_ok=True)
photo_names = {}
for p in sorted(PHOTOS.iterdir()):
    num = p.name[:2]
    dst = f"p{num}{p.suffix}"
    shutil.copy(p, PUBLIC / dst)
    photo_names[num] = dst

def dur(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                          "-of", "csv=p=0", str(path)], capture_output=True, text=True).stdout
    return float(out)

# Subtitle lines per scene, broken where the meaning breaks (like the original).
SUB_LINES = {
    1: ["안녕하세요", "까치카페 사장입니다"],
    2: ["저는 커피를 직접 볶고", "스콘과 베이글을 굽고 있어요"],
    3: ["손으로 만드는 한 잔", "한 접시에도", "작품 같은 정성을 담고 싶어서요"],
    4: ["원두는 매장에서 직접 볶아서", "향이 살아 있을 때", "내려 드리고요", "스콘과 베이글도", "매일 아침 반죽해서 구워요"],
    5: ["사실 저는", "일본 무사시노미술대학에서", "미술을 공부했어요"],
    6: ["흙을 빚고", "작품을 걸고", "전시를 준비하던 날들이었죠"],
    7: ["그런데 작품을 만드는 일과", "커피를 만드는 일이", "참 닮았더라고요", "재료를 고르고", "손으로 다듬고",
        "누군가의 앞에 내놓는 일이요", "미술대학 우수 졸업생이던 제가", "이제는 13년째 한곳에서", "커피를 내리고 있어요"],
    8: ["요즘은 아침마다 커피를 내리고", "빵이 구워지는 동안", "새 메뉴를 그려 보곤 해요"],
    9: ["까치카페를 찾아 주시는 분들 덕분에", "요즘 정말 행복해요", "앞으로도", "맛있는 커피와 빵으로 기다릴게요", "자주 들러 주세요!"],
}

def manual_chunks(i, align):
    chars = align["characters"]
    st, en = align["character_start_times_seconds"], align["character_end_times_seconds"]
    text = "".join(chars)
    out, pos = [], 0
    for line in SUB_LINES[i]:
        # find the line's first and last word in the spoken text, ignoring punctuation
        first, last = line.split()[0].rstrip("!"), line.split()[-1].rstrip("!")
        a = text.find(first, pos); assert a >= 0, (i, line)
        b = text.find(last, a + len(first) - len(last) if first == last else a); assert b >= 0, (i, line)
        b += len(last)
        out.append({"text": line, "start": st[a], "end": en[b - 1]})
        pos = b
    return text, out

def chunks(align):
    chars = align["characters"]
    st, en = align["character_start_times_seconds"], align["character_end_times_seconds"]
    text = "".join(chars)
    # clauses split after , . ! ?
    spans, s = [], 0
    for m in re.finditer(r"[,.!?]", text):
        spans.append((s, m.end())); s = m.end()
    if s < len(text): spans.append((s, len(text)))
    out = []
    for a, b in spans:
        clause = text[a:b]
        words = [(m.start() + a, m.end() + a) for m in re.finditer(r"\S+", clause)]
        if not words: continue
        # split into the fewest lines of <= MAX_CHARS, with line lengths as even as possible
        import itertools, math
        total_len = words[-1][1] - words[0][0]
        k = max(1, math.ceil(total_len / MAX_CHARS))
        best = None
        while best is None:
            for cuts in itertools.combinations(range(1, len(words)), k - 1):
                parts = [words[a:b] for a, b in zip((0,) + cuts, cuts + (len(words),))]
                lens = [p[-1][1] - p[0][0] for p in parts]
                if max(lens) > MAX_CHARS + 2: continue
                score = max(lens) - min(lens)
                if best is None or score < best[0]: best = (score, parts)
            if best is None:
                if k >= len(words): best = (0, [[w] for w in words])
                k += 1
        lines = best[1]
        for ln in lines:
            i0, i1 = ln[0][0], ln[-1][1]
            label = re.sub(r"[,.]+$", "", text[i0:i1]).strip()
            out.append({"text": label, "start": st[i0], "end": en[i1 - 1]})
    return text, out

# Shots per scene. "at": start time as fraction of the scene, or "@text" to start
# when that text is spoken. focus x/y are percents of the photo, zoom is crop scale.
SHOTS = {
    1: [dict(p="09", x=48, y=40, z=1.15)],
    2: [dict(p="06", x=28, y=38, z=2.6), dict(p="05", x=30, y=52, z=2.8), dict(p="05", x=45, y=63, z=2.8),
        dict(p="08", x=62, y=55, z=1.7), dict(p="05", x=74, y=63, z=3.0), dict(p="06", x=50, y=33, z=2.4),
        dict(p="05", x=80, y=38, z=2.4), dict(p="08", x=35, y=45, z=1.5)],
    3: [dict(p="09", x=38, y=57, z=2.1), dict(p="05", x=50, y=40, z=1.05, at="@한 접시")],
    4: [dict(p="06", x=50, y=50, z=1.0), dict(p="05", x=48, y=63, z=1.9, at="@스콘과"),
        dict(collage=["05:32:52:2.6", "05:47:63:2.6", "09:52:58:2.2"], at="@매일")],
    5: [dict(p="01", x=45, y=45, z=1.0)],
    6: [dict(p="03", x=22, y=50, z=1.0), dict(p="10", x=50, y=55, z=1.0, at="@작품을"),
        dict(p="02", x=50, y=50, z=1.0, at="@전시를"), dict(p="04", x=40, y=45, z=1.0, at="@날들")],
    7: [dict(p="03", x=22, y=48, z=1.6), dict(p="09", x=40, y=58, z=2.0, at="@재료를"),
        dict(p="01", x=45, y=45, z=1.1, at="@미술대학"), dict(p="06", x=50, y=50, z=1.0, at="@이제는"),
        dict(p="07", x=50, y=45, z=1.0, at="@한곳에서")],
    8: [dict(p="06", x=14, y=40, z=2.0), dict(p="07", x=45, y=35, z=1.4, at="@빵이")],
    9: [dict(p="09", x=46, y=33, z=1.5), dict(p="08", x=50, y=50, z=1.0, at="@앞으로도")],
}

t = LEAD_IN
scenes, subs, audio = [], [], []
for i in range(1, 10):
    mp3 = VOICE / f"s{i:02d}.mp3"
    shutil.copy(mp3, PUBLIC / f"s{i:02d}.mp3")
    d = dur(mp3)
    align = json.load(open(VOICE / f"s{i:02d}.align.json"))
    text, cs = manual_chunks(i, align)
    start = t if i > 1 else 0.0
    end = t + d + GAP
    audio.append({"src": f"s{i:02d}.mp3", "from": round(t * FPS)})
    for c in cs:
        subs.append({"text": c["text"], "from": t + c["start"], "to": t + c["end"]})
    # resolve shot start times
    shots = []
    n = len(SHOTS[i])
    for k, sh in enumerate(SHOTS[i]):
        at = sh.pop("at", None)
        if at is None:
            s0 = start + (end - start) * k / n
        else:
            idx = text.find(at[1:])
            assert idx >= 0, (i, at)
            s0 = t + align["character_start_times_seconds"][idx] - 0.1
        shots.append({**sh, "from": s0})
    for k, sh in enumerate(shots):
        sh["to"] = shots[k + 1]["from"] if k + 1 < len(shots) else end
    scenes.append({"scene": i, "from": start, "to": end, "shots": shots})
    t = end

# logo scene
scenes.append({"scene": 10, "from": t, "to": t + LOGO, "shots": [{"logo": True, "from": t, "to": t + LOGO}]})
total = t + LOGO

# subtitles: hold each until the next one starts (max 0.6s extra), never overlap
for k, s in enumerate(subs):
    nxt = subs[k + 1]["from"] if k + 1 < len(subs) else s["to"] + 0.6
    s["to"] = min(max(s["to"] + 0.25, s["to"]), nxt)

def fr(x): return round(x * FPS)
out = {
    "fps": FPS, "durationInFrames": fr(total), "photos": photo_names, "audio": audio,
    "scenes": [{**sc, "from": fr(sc["from"]), "to": fr(sc["to"]),
                "shots": [{**sh, "from": fr(sh["from"]), "to": fr(sh["to"])} for sh in sc["shots"]]}
               for sc in scenes],
    "subs": [{"text": s["text"], "from": fr(s["from"]), "to": fr(s["to"])} for s in subs],
}
(ROOT / "src").mkdir(exist_ok=True)
json.dump(out, open(ROOT / "src" / "timeline.json", "w"), ensure_ascii=False, indent=1)
print(f"total {total:.1f}s, {len(subs)} subtitles")
for sc in scenes:
    print(sc["scene"], f'{sc["from"]:.2f}-{sc["to"]:.2f}', len(sc["shots"]), "shots")
for s in subs: print(f'{s["from"]:6.2f}-{s["to"]:6.2f} {s["text"]}')
