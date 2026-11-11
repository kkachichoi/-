#!/usr/bin/env python3
"""저작권 걱정 없는 짧은 로파이 배경음악 생성기 (numpy만 사용).

컷 길이 = 2박자가 되도록 BPM을 맞추면 영상 컷과 킥 드럼이 정확히 맞는다.
    88 BPM → 2박자 = 1.3636초  (make_split_reel.sh -c 1.3636)

사용법: python3 make_lofi_music.py 출력.wav [길이초=12] [BPM=88]
코드 진행: Fmaj7 → Em7 → Dm7 → Cmaj7(엔딩에서 해결) → 반복
"""
import sys
import wave

import numpy as np

SR = 44100
out = sys.argv[1] if len(sys.argv) > 1 else "lofi.wav"
length = float(sys.argv[2]) if len(sys.argv) > 2 else 12.0
bpm = float(sys.argv[3]) if len(sys.argv) > 3 else 88.0
beat = 60.0 / bpm
n = int(SR * (length + 1.0))
mix = np.zeros(n)
rng = np.random.default_rng(7)


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def add(sig, t0, gain=1.0):
    i = int(t0 * SR)
    if i >= n:
        return
    sig = sig[: n - i]
    mix[i : i + len(sig)] += sig * gain


def epiano(midi, dur, decay=1.6):
    t = np.arange(int(SR * dur)) / SR
    f = hz(midi)
    tone = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) + 0.08 * np.sin(2 * np.pi * 3 * f * t)
    env = np.exp(-t * decay) * np.minimum(1, t / 0.008)
    trem = 1 + 0.08 * np.sin(2 * np.pi * 4.5 * t)
    return tone * env * trem


def bass(midi, dur):
    t = np.arange(int(SR * dur)) / SR
    f = hz(midi)
    return (np.sin(2 * np.pi * f * t) + 0.2 * np.sin(2 * np.pi * 2 * f * t)) * np.exp(-t * 2.2) * np.minimum(1, t / 0.01)


def kick():
    t = np.arange(int(SR * 0.35)) / SR
    freq = 50 + 70 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t * 9)


def noise_hit(dur, decay):
    t = np.arange(int(SR * dur)) / SR
    x = rng.standard_normal(len(t))
    x = x - np.convolve(x, np.ones(8) / 8, mode="same")  # 고역만 남기기
    return x * np.exp(-t * decay)


# 코드 (MIDI 노트), 마디당 4박
chords = [
    ([53, 57, 60, 64], 41),  # Fmaj7
    ([52, 55, 59, 62], 40),  # Em7
    ([50, 53, 57, 60], 38),  # Dm7
    ([48, 52, 55, 59], 36),  # Cmaj7
]
melody = {  # (마디, 박) : 노트  - 조용한 벨 멜로디
    (0, 2.5): 72, (1, 0.5): 71, (1, 2.5): 67, (2, 0.5): 69, (2, 2.0): 65, (2, 3.0): 64, (3, 0.0): 67,
}

bars = int(np.ceil(length / (4 * beat))) + 1
swing = beat * 0.08
for b in range(bars):
    notes, root = chords[b % len(chords)]
    t_bar = b * 4 * beat
    last = t_bar + 4 * beat > length - 0.5
    for nt in notes:  # 코드: 1박 + 2박 뒤 엇박 (마지막 마디는 길게 울리는 엔딩 코드)
        add(epiano(nt, 4.0, 0.45 if last else 1.6), t_bar, 0.11)
        if not last:
            add(epiano(nt, 1.5), t_bar + 1.5 * beat + swing, 0.06)
    add(bass(root, 1.6), t_bar, 0.32)
    if not last:
        add(bass(root + 7, 1.0), t_bar + 2 * beat, 0.22)
    for k in range(4):
        tb = t_bar + k * beat
        if tb > length - 0.3:
            break
        if k == 0 or (k == 2 and not last):
            add(kick(), tb, 0.55)
        else:
            add(noise_hit(0.25, 18), tb, 0.10)  # 스네어 대신 부드러운 브러시
        add(noise_hit(0.05, 80), tb + beat / 2 + swing, 0.05)  # 하이햇
    if last:  # 엔딩: 높은 음 하나로 마무리
        add(epiano(79, 3.0, 0.6), t_bar + 1.0 * beat, 0.07)
    for (mb, mbeat), nt in melody.items():
        if mb == b % len(chords):
            add(epiano(nt + 12, 1.2), t_bar + mbeat * beat + (swing if mbeat % 1 else 0), 0.06)

# 바이닐 잡음: 약한 노이즈 + 가끔 '틱'
mix += rng.standard_normal(n) * 0.004
ticks = rng.integers(0, n - 200, size=int(length * 6))
for i in ticks:
    mix[i : i + 30] += rng.standard_normal(30) * 0.05 * np.exp(-np.arange(30) / 6)

# 따뜻하게: 1차 로우패스 (컷오프 약 4.5kHz)
a = np.exp(-2 * np.pi * 4500 / SR)
y = np.empty_like(mix)
acc = 0.0
for i, x in enumerate(mix):
    acc = (1 - a) * x + a * acc
    y[i] = acc

y = y[: int(SR * length)]
fade = int(SR * 1.5)
y[-fade:] *= np.linspace(1, 0, fade) ** 2
y = np.tanh(y * 1.4)  # 살짝 테이프 새츄레이션
y = y / np.max(np.abs(y)) * 0.89

stereo = np.stack([y, np.roll(y, int(SR * 0.012))], axis=1)  # 약간의 스테레오 폭
pcm = (stereo * 32767).astype(np.int16)
with wave.open(out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print(f"완성: {out} ({length}초, {bpm} BPM, 2박자 = {2 * beat:.4f}초)")
