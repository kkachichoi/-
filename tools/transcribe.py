"""Korean speech-to-text with faster-whisper.

Usage:
    python3 tools/transcribe.py <video-or-audio-file> [--model large-v3]

Writes next to the input file:
    <name>.자막.md   - table of start/end time and text
    <name>.srt       - subtitle file
and prints the table.
"""

import argparse
import os
from pathlib import Path

# Download models over plain HTTPS; the Xet transfer host is not reachable here.
os.environ.setdefault("HF_HUB_DISABLE_XET", "1")

import subprocess  # noqa: E402

import numpy as np  # noqa: E402
from faster_whisper import WhisperModel  # noqa: E402


def load_audio(path: Path) -> np.ndarray:
    """Decode any video/audio file to 16 kHz mono float32 with the ffmpeg CLI."""
    out = subprocess.run(
        ["ffmpeg", "-nostdin", "-v", "error", "-i", str(path), "-vn", "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
        check=True,
        capture_output=True,
    ).stdout
    return np.frombuffer(out, np.float32)


def ts(sec: float, srt: bool = False) -> str:
    h, rem = divmod(sec, 3600)
    m, s = divmod(rem, 60)
    if srt:
        return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int((s % 1) * 1000):03d}"
    return f"{int(m):02d}:{s:05.2f}" if h < 1 else f"{int(h)}:{int(m):02d}:{s:05.2f}"


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("input")
    p.add_argument("--model", default="large-v3")
    args = p.parse_args()

    src = Path(args.input)
    # int8 keeps large-v3 fast enough on CPU without a GPU.
    model = WhisperModel(args.model, device="cpu", compute_type="int8")
    segments, info = model.transcribe(
        load_audio(src),
        language="ko",
        beam_size=5,
        vad_filter=True,  # skip silence so timestamps stay accurate
        vad_parameters={"min_silence_duration_ms": 400},
        condition_on_previous_text=False,  # avoids repeated-line hallucinations
        initial_prompt="다음은 한국어 음성입니다. 맞춤법과 띄어쓰기를 지켜 적습니다.",
    )

    rows = []
    srt = []
    for i, seg in enumerate(segments, 1):
        text = seg.text.strip()
        rows.append(f"| {ts(seg.start)} | {ts(seg.end)} | {text} |")
        srt.append(f"{i}\n{ts(seg.start, True)} --> {ts(seg.end, True)}\n{text}\n")

    table = "| 시작 | 끝 | 말한 내용 |\n|---|---|---|\n" + "\n".join(rows)
    base = src.with_suffix("")
    Path(f"{base}.자막.md").write_text(f"# {src.name} 받아쓰기\n\n{table}\n", encoding="utf-8")
    Path(f"{base}.srt").write_text("\n".join(srt), encoding="utf-8")
    print(f"길이 {info.duration:.1f}초, 언어 {info.language}")
    print(table)


if __name__ == "__main__":
    main()
