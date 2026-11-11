"""Synthesize an original, copyright-free soft background track (warm pad + sparse bell notes)."""
import json, wave
import numpy as np
from pathlib import Path

ROOT = Path(__file__).resolve().parent
tl = json.load(open(ROOT / "src" / "timeline.json"))
SR = 44100
LEN = tl["durationInFrames"] / tl["fps"] + 0.5
n = int(SR * LEN)
t = np.arange(n) / SR
rng = np.random.default_rng(7)

def hz(m): return 440.0 * 2 ** ((m - 69) / 12)

# chord progression (MIDI notes), 4 bars of 4s each, looped: Fmaj9 - Em7 - Dm9 - Cmaj7(add9)
chords = [[53, 60, 64, 67, 69], [52, 59, 62, 67, 71], [50, 57, 60, 64, 69], [48, 55, 59, 62, 64]]
BAR = 4.0
pad = np.zeros(n)
for b in range(int(LEN // BAR) + 1):
    c = chords[b % 4]
    s0 = b * BAR
    seg = (t >= s0 - 0.6) & (t < s0 + BAR + 1.2)
    tt = t[seg] - s0
    env = np.clip((tt + 0.6) / 1.4, 0, 1) * np.clip((BAR + 1.2 - tt) / 1.6, 0, 1)
    for m in c:
        f = hz(m)
        for det in (-0.12, 0.12):
            ph = rng.uniform(0, 2 * np.pi)
            w = np.sin(2 * np.pi * f * (1 + det / 100) * tt + ph)
            w += 0.18 * np.sin(2 * np.pi * 2 * f * tt + ph)
            pad[seg] += env * w / len(c)

# sparse bell melody notes from the chord tones, an octave up
bell = np.zeros(n)
for b in range(int(LEN // BAR) + 1):
    c = chords[b % 4]
    for k, off in enumerate((0.0, 1.5, 2.5)):
        if rng.random() < 0.35: continue
        s0 = b * BAR + off
        if s0 >= LEN - 1: continue
        m = c[rng.integers(2, len(c))] + 12
        f = hz(m)
        i0 = int(s0 * SR); i1 = min(n, i0 + int(3.0 * SR))
        tt = t[i0:i1] - s0
        env = np.exp(-tt * 1.6) * np.clip(tt / 0.01, 0, 1)
        bell[i0:i1] += env * (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * 2.01 * f * tt) * np.exp(-tt * 3))

# gentle low-pass for the pad (one-pole)
def lowpass(x, fc):
    a = np.exp(-2 * np.pi * fc / SR); y = np.empty_like(x); acc = 0.0
    for i in range(len(x)):
        acc = (1 - a) * x[i] + a * acc; y[i] = acc
    return y

mix = lowpass(pad, 1400) * 0.55 + bell * 0.22
# simple echo for space
d = int(0.32 * SR); echo = np.zeros_like(mix); echo[d:] = mix[:-d] * 0.28
mix = mix + echo
# fade in / out
mix *= np.clip(t / 2.0, 0, 1) * np.clip((LEN - t) / 3.0, 0, 1)
mix = mix / np.max(np.abs(mix)) * 0.9
stereo = np.stack([mix, np.roll(mix, int(0.012 * SR))], axis=1)
pcm = (stereo * 32767).astype(np.int16)
out = ROOT / "public" / "music.wav"
with wave.open(str(out), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print("wrote", out, f"{LEN:.1f}s")
