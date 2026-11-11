#!/usr/bin/env bash
# 위아래 2분할 카페/음식 릴스 자동 편집 스크립트
#
# 사용법:
#   ./make_split_reel.sh [옵션] 위1 아래1 [위2 아래2 ...]
#
# 클립은 "파일" 또는 "파일@시작초" 형식 (예: toast.mp4@3.5 → 3.5초 지점부터 사용)
# 아래 자리에 FULL 을 쓰면 그 컷은 분할 없이 전체 화면 (예: slicer.mp4 FULL)
#
# 옵션:
#   -o 파일      출력 파일 (기본: reel.mp4)
#   -c 초        컷 길이, 음악 2박자 정도 (기본: 1.37)
#   -e 클립      마지막 전체 화면 엔딩 클립 (권장)
#   -E 초        엔딩 길이 (기본: 2.5)
#   -l 로고.png  엔딩에 올릴 로고 (배경 투명 PNG 권장)
#   -t 텍스트    로고 PNG가 없을 때 엔딩에 넣을 글자 (예: "Rika")
#   -s 텍스트    -t 아래 작은 서브 글자 (예: "by Paprika")
#   -f 폰트파일  -t/-s에 쓸 폰트 (.ttf/.otf, 손글씨체 권장)
#   -m 음악파일  배경 음악 (없으면 원본 클립 소리 대신 무음)
#   -g 모드      색보정: warm(기본) | none
set -euo pipefail

OUT=reel.mp4; CUT=1.37; END_CLIP=""; END_DUR=2.5
LOGO=""; TITLE=""; SUB=""; FONT=""; MUSIC=""; GRADE=warm
W=1080; H=1920; FPS=30; DIV=4          # 가운데 구분선 두께(px), 패널 높이가 짝수가 되도록 짝수 유지
PH=$(( (H - DIV) / 2 ))                 # 패널 하나 높이

while getopts "o:c:e:E:l:t:s:f:m:g:h" opt; do
  case $opt in
    o) OUT=$OPTARG;; c) CUT=$OPTARG;; e) END_CLIP=$OPTARG;; E) END_DUR=$OPTARG;;
    l) LOGO=$OPTARG;; t) TITLE=$OPTARG;; s) SUB=$OPTARG;; f) FONT=$OPTARG;;
    m) MUSIC=$OPTARG;; g) GRADE=$OPTARG;;
    h|*) sed -n '2,21p' "$0"; exit 0;;
  esac
done
shift $((OPTIND - 1))

if [ $# -lt 2 ] || [ $(( $# % 2 )) -ne 0 ]; then
  echo "클립은 (위, 아래) 쌍으로 짝수 개를 넣어주세요. 도움말: $0 -h" >&2; exit 1
fi

# 따뜻하고 살짝 빈티지한 필름 톤 + 약한 그레인
case $GRADE in
  warm) LOOK="eq=contrast=1.05:saturation=0.9:gamma=0.97,colorbalance=rs=0.04:gs=0.01:bs=-0.05:rh=0.03:bh=-0.03,curves=all='0/0.04 0.5/0.5 1/0.97',noise=alls=5:allf=t";;
  none) LOOK="null";;
  *) echo "알 수 없는 색보정 모드: $GRADE" >&2; exit 1;;
esac

TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
split_arg() { CLIP=${1%@*}; START=0; [[ $1 == *@* ]] && START=${1##*@}; [ -f "$CLIP" ] || { echo "파일 없음: $CLIP" >&2; exit 1; }; }

# 화면을 꽉 채우도록 확대 후 가운데 자르기
fill() { echo "scale=$1:$2:force_original_aspect_ratio=increase,crop=$1:$2,setsar=1,fps=$FPS"; }

n=0; LIST="$TMP/list.txt"; : > "$LIST"
while [ $# -gt 0 ]; do
  SEG="$TMP/seg_$n.mp4"
  split_arg "$1"; TOP=$CLIP; TS=$START
  if [ "$2" = FULL ]; then
    ffmpeg -v error -y -ss "$TS" -t "$CUT" -i "$TOP" -filter_complex \
      "[0:v]$(fill $W $H),$LOOK,trim=duration=$CUT,setpts=PTS-STARTPTS,format=yuv420p[v]" \
      -map "[v]" -an -c:v libx264 -preset medium -crf 18 "$SEG"
  else
    split_arg "$2"; BOT=$CLIP; BS=$START
    ffmpeg -v error -y -ss "$TS" -t "$CUT" -i "$TOP" -ss "$BS" -t "$CUT" -i "$BOT" -filter_complex \
      "[0:v]$(fill $W $PH)[a];[1:v]$(fill $W $PH)[b];\
       [a]pad=$W:$((PH + DIV)):0:0:color=0x111111[a2];[a2][b]vstack,$LOOK,trim=duration=$CUT,setpts=PTS-STARTPTS,format=yuv420p[v]" \
      -map "[v]" -an -c:v libx264 -preset medium -crf 18 "$SEG"
  fi
  shift 2
  echo "file '$SEG'" >> "$LIST"; n=$((n + 1))
done

if [ -n "$END_CLIP" ]; then
  split_arg "$END_CLIP"
  F="[0:v]$(fill $W $H),$LOOK"
  INPUTS=(-ss "$START" -t "$END_DUR" -i "$CLIP")
  if [ -n "$LOGO" ]; then
    INPUTS+=(-loop 1 -i "$LOGO")
    F="$F[bg];[1:v]scale=$((W * 45 / 100)):-1,format=rgba,fade=in:st=0.15:d=0.4:alpha=1[lg];[bg][lg]overlay=(W-w)/2:(H-h)/2-80:shortest=1"
  elif [ -n "$TITLE" ]; then
    FF=""; [ -n "$FONT" ] && FF="fontfile='$FONT':"
    F="$F,drawtext=${FF}text='$TITLE':fontsize=230:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2-120:shadowcolor=black@0.25:shadowy=4:alpha='min(1,max(0,(t-0.15)/0.4))'"
    [ -n "$SUB" ] && F="$F,drawtext=${FF}text='$SUB':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=(h/2)+50:alpha='min(1,max(0,(t-0.3)/0.4))'"
  fi
  ffmpeg -v error -y "${INPUTS[@]}" -filter_complex "$F,trim=duration=$END_DUR,setpts=PTS-STARTPTS,format=yuv420p[v]" \
    -map "[v]" -an -c:v libx264 -preset medium -crf 18 "$TMP/end.mp4"
  echo "file '$TMP/end.mp4'" >> "$LIST"
fi

ffmpeg -v error -y -f concat -safe 0 -i "$LIST" -c copy "$TMP/video.mp4"
TOTAL=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$TMP/video.mp4")

if [ -n "$MUSIC" ]; then
  FO=$(awk "BEGIN{print ($TOTAL > 1.2) ? $TOTAL - 1.2 : 0}")
  ffmpeg -v error -y -i "$TMP/video.mp4" -i "$MUSIC" -map 0:v -map 1:a -c:v copy \
    -af "afade=t=out:st=$FO:d=1.2" -c:a aac -b:a 192k -shortest "$OUT"
else
  ffmpeg -v error -y -i "$TMP/video.mp4" -f lavfi -i anullsrc=r=44100:cl=stereo -map 0:v -map 1:a \
    -c:v copy -c:a aac -shortest "$OUT"
fi

echo "완성: $OUT (${TOTAL}초, 컷 ${n}개 + 엔딩, 컷당 ${CUT}초)"
