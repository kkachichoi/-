#!/usr/bin/env bash
# 사용법: ./build_reel.sh spec.json 프로젝트이름
# spec.json 의 장면대로 하이퍼프레임즈 릴스를 만들고 점검 → 장면 미리보기 → MP4 렌더까지 한다.
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
SPEC=$(realpath "$1"); NAME=$2
PROJ=$HERE/$NAME
FONTS=$HERE/fonts-src          # 원본 폰트 (NotoSansKR.ttf, Gaegu-Bold.ttf)
PHOTOS=$HERE/photos            # 사진 원본 모음 (가로 1350 정도로 줄여 둔 것)
HF="npx -y hyperframes@0.9.33"

rm -rf "$PROJ"
(cd "$HERE" && HYPERFRAMES_SKIP_SKILLS=1 $HF init "$NAME" --example blank --resolution portrait --non-interactive --skip-skills >/dev/null 2>&1)
mkdir -p "$PROJ/assets" "$PROJ/fonts"
cp "$PHOTOS"/*.jpg "$PROJ/assets/"

BPM=$(python3 -I -c "import json,sys;print(json.load(open(sys.argv[1]))['bpm'])" "$SPEC")
python3 -I "$HERE/make_reel.py" "$SPEC" "$PROJ"
TOTAL=$(grep -oE 'data-composition-id="main" data-start="0" data-duration="[0-9.]+' "$PROJ/index.html" | grep -oE '[0-9.]+$')
python3 -I /home/user/-/make_lofi_music.py "$PROJ/assets/music.wav" "$TOTAL" "$BPM" >/dev/null

"$HERE/venv/bin/pyftsubset" "$FONTS/NotoSansKR.ttf" --text-file="$PROJ/chars.txt" --output-file="$PROJ/fonts/NotoSansKR-sub.ttf" --layout-features='*'
"$HERE/venv/bin/pyftsubset" "$FONTS/Gaegu-Bold.ttf" --text-file="$PROJ/chars.txt" --output-file="$PROJ/fonts/Gaegu-sub.ttf"

cd "$PROJ"
$HF check 2>&1 | grep -E 'Check (passed|failed)|error\(s\)|StaticGuard' | tail -4
# 장면마다 중간 지점 스냅샷 → 한 장으로
ATS=$(python3 -I - "$SPEC" <<'EOF'
import json,sys
s=json.load(open(sys.argv[1])); bar=240/s['bpm']; t=0; out=[]
for sc in s['scenes']:
    d=sc.get('bars',1)*bar; out.append(f"{t+d*0.8:.2f}"); t+=d
print(",".join(out))
EOF
)
SNAP=$($HF snapshot --at "$ATS" 2>&1 | grep -oE '/\S+/snapshots/[^/ ]+' | head -1)
ffmpeg -v error -y -pattern_type glob -i "$SNAP/frame-*.png" -vf "scale=270:-2,tile=$(echo "$ATS" | tr ',' '\n' | wc -l)x1" -frames:v 1 "$PROJ/sheet.jpg"
echo "미리보기: $PROJ/sheet.jpg"
if [ "${SKIP_RENDER:-0}" != 1 ]; then
  $HF render 2>&1 | grep -E 'Render complete' | tail -1
  echo "영상: $(ls -t "$PROJ"/renders/*.mp4 | head -1)"
fi
