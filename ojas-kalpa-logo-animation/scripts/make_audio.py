"""Synthesise the music bed + sound effects for both intros, locked to src/timeline.json.

Everything is generated from scratch here (no samples), so the audio is 100% royalty free.
Palette (Ayurveda / Indian-classical feel, no voice):
  * tanpura-style drone in D (Sa-Pa)          * tabla-style groove (dayan "na/tin", bayan "ge")
  * airy whooshes for leaves and swirls        * glockenspiel arpeggio for the sun rays
  * singing bowl + sub boom + bell chord on the logo hit, glitter tail

Usage: python3 -I scripts/make_audio.py src/timeline.json public/audio
"""
import json
import os
import sys
import wave

import numpy as np
from scipy.signal import fftconvolve

SR = 48000
rng = np.random.default_rng(7)

D3, A2, D2 = 146.83, 110.0, 73.42
PENTA = [587.33, 659.26, 739.99, 880.0, 987.77, 1174.66]  # D major pentatonic, D5..D6


def tt(dur):
    return np.arange(int(dur * SR)) / SR


def env_ar(n, attack, release_rate):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(attack, 1e-4)) * np.exp(-t * release_rate)


class Mix:
    def __init__(self, dur):
        self.dry = np.zeros((int(dur * SR) + SR * 6, 2))
        self.send = np.zeros_like(self.dry)
        self.n = int(dur * SR)

    def add(self, sig, at, gain=1.0, pan=0.0, verb=0.25):
        if sig.ndim == 1:
            l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
            sig = np.stack([sig * l * 1.414, sig * r * 1.414], axis=1)
        i = int(round(at * SR))
        if i < 0:
            sig, i = sig[-i:], 0
        j = min(i + len(sig), len(self.dry))
        self.dry[i:j] += sig[: j - i] * gain
        self.send[i:j] += sig[: j - i] * gain * verb


# ---------------------------------------------------------------- instruments
def filtered_noise(dur, fc_from, fc_to, bw=0.5, seed=0):
    """Band-passed noise whose centre frequency glides log-wise (STFT shaping)."""
    frame, hop = 2048, 256
    n = int(dur * SR)
    noise = np.random.default_rng(seed).standard_normal(n + frame)
    win = np.hanning(frame)
    f = np.fft.rfftfreq(frame, 1 / SR) + 1
    out = np.zeros(n + frame)
    norm = np.zeros(n + frame)
    for s in range(0, n, hop):
        x = s / max(n, 1)
        fc = fc_from * (fc_to / fc_from) ** x
        g = np.exp(-0.5 * (np.log(f / fc) / bw) ** 2)
        spec = np.fft.rfft(noise[s : s + frame] * win) * g
        out[s : s + frame] += np.fft.irfft(spec) * win
        norm[s : s + frame] += win ** 2
    out = out[:n] / np.maximum(norm[:n], 1e-3)
    return out / (np.abs(out).max() + 1e-9)


def whoosh(dur=0.9, f0=400, f1=2600, seed=0):
    t = tt(dur)
    shape = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.6
    return filtered_noise(dur, f0, f1, 0.55, seed) * shape


def tail_fade(x, sec=0.04):
    n = min(len(x), int(sec * SR))
    x[-n:] *= np.linspace(1, 0, n)
    return x


def riser(dur, f0=250, f1=4000, seed=1):
    t = tt(dur)
    return tail_fade(filtered_noise(dur, f0, f1, 0.45, seed) * (t / dur) ** 2.2)


def tanpura(f, dur=4.0):
    """Plucked drone string: harmonic series with a slowly blooming 'jawari' buzz."""
    t = tt(dur)
    out = np.zeros_like(t)
    for k in range(1, 26):
        amp = k ** -0.85
        decay = 0.45 + 0.07 * k
        bloom = 1 + (1.6 if k > 5 else 0) * (1 - np.exp(-t * 1.2)) * np.exp(-t * 0.4)
        out += amp * bloom * np.exp(-t * decay) * np.sin(2 * np.pi * f * k * (1 + 0.0004 * k) * t + rng.random() * 6.28)
    out *= np.minimum(1, t / 0.01)
    return out / np.abs(out).max()


def bell(f, dur=2.5, bright=1.0):
    """Glockenspiel-like tuned bar."""
    t = tt(dur)
    parts = [(1, 1.0, 1.4), (2.76, 0.35 * bright, 3.5), (5.4, 0.18 * bright, 7), (8.93, 0.08 * bright, 12)]
    parts = [p for p in parts if f * p[0] < 0.45 * SR]  # no partials above Nyquist (aliasing)
    out = sum(a * np.exp(-t * d) * np.sin(2 * np.pi * f * r * t) for r, a, d in parts)
    out += 0.3 * np.exp(-t * 1.2) * np.sin(2 * np.pi * f * 0.5 * t)
    return out * np.minimum(1, t / 0.002)


def singing_bowl(f=220.0, dur=6.0):
    t = tt(dur)
    out = np.zeros_like(t)
    for r, a, d, beat in [(1, 1.0, 0.45, 0.9), (2.71, 0.55, 0.7, 1.7), (5.12, 0.25, 1.1, 2.6), (8.2, 0.1, 1.8, 3.3)]:
        for sign in (-1, 1):
            out += 0.5 * a * np.exp(-t * d) * np.sin(2 * np.pi * (f * r + sign * beat / 2) * t + rng.random())
    return out * np.minimum(1, t / 0.004)


def boom(dur=2.2):
    t = tt(dur)
    freq = 38 + 80 * np.exp(-t * 6)
    phase = 2 * np.pi * np.cumsum(freq) / SR
    body = np.sin(phase) * np.exp(-t * 1.7)
    thump = filtered_noise(0.5, 180, 60, 0.7, seed=9) * np.exp(-tt(0.5) * 9)
    body[: len(thump)] += 0.5 * thump
    return body


def kick(dur=0.5):
    t = tt(dur)
    freq = 46 + 110 * np.exp(-t * 28)
    out = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t * 7)
    click = rng.standard_normal(200) * np.exp(-np.arange(200) / 30) * 0.3
    out[:200] += click
    return out


def tabla_na(f=293.66, dur=0.45, ring=9.0):
    """Dayan stroke: near-harmonic membrane (thanks to the syahi) + rim click."""
    t = tt(dur)
    parts = [(1, 1.0, ring), (2, 0.55, ring * 1.4), (3, 0.35, ring * 1.9), (4, 0.2, ring * 2.5), (5, 0.12, ring * 3)]
    out = sum(a * np.exp(-t * d) * np.sin(2 * np.pi * f * r * (1 + 0.015 * np.exp(-t * 40)) * t) for r, a, d in parts)
    out[:300] += filtered_noise(300 / SR, 3000, 3000, 0.8, seed=int(rng.integers(1e6))) * np.exp(-np.arange(300) / 60) * 0.6
    return out * np.minimum(1, t / 0.001)


def tabla_ge(dur=0.8):
    """Bayan stroke with the characteristic upward pitch glide."""
    t = tt(dur)
    freq = 82 + 45 * (1 - np.exp(-t * 7))
    phase = 2 * np.pi * np.cumsum(freq) / SR
    out = (np.sin(phase) + 0.25 * np.sin(2 * phase)) * np.exp(-t * 3.2)
    return out * np.minimum(1, t / 0.002)


def shaker(dur=0.09):
    t = tt(dur)
    return filtered_noise(dur, 7000, 7000, 0.4, seed=int(rng.integers(1e6))) * np.exp(-t * 55)


def glitter(dur=1.5, count=26, seed=3):
    g = np.random.default_rng(seed)
    out = np.zeros((int(dur * SR) + SR // 4, 2))
    for _ in range(count):
        f = g.uniform(3200, 8800)
        b = bell(f, 0.2, bright=0.3) * g.uniform(0.15, 0.6) * np.exp(-tt(0.2) * 14)
        at = int(g.uniform(0, dur) ** 1.4 / dur ** 0.4 * SR)
        pan = g.uniform(-0.9, 0.9)
        out[at : at + len(b), 0] += b * np.cos((pan + 1) * np.pi / 4)
        out[at : at + len(b), 1] += b * np.sin((pan + 1) * np.pi / 4)
    return out


def reverse_shimmer(dur=1.2):
    s = sum(bell(f, dur, 0.7) for f in PENTA[::2])
    return tail_fade(s[::-1] * np.linspace(0, 1, len(s)) ** 2 / 3, 0.03)


def impulse_response(dur=2.4):
    t = tt(dur)
    ir = rng.standard_normal((len(t), 2)) * np.exp(-t * 3.0)[:, None]
    # darken the tail a little
    for c in range(2):
        ir[:, c] = np.convolve(ir[:, c], np.ones(6) / 6, mode='same')
    ir[:, 0] *= 1.0
    return ir / np.sqrt((ir ** 2).sum(axis=0))


# ---------------------------------------------------------------- arrangement
def groove(mix, T, bpm, full):
    six = 60 / bpm / 4
    hit = T['hit']
    kick_p = 'x.........x.....'
    ge_p = 'x..x..x....x....'
    na_p = '..x.x..x.x..x.x.'
    t0, t1 = T['grooveStart'], T['grooveEnd']
    n0 = int(np.ceil((t0 - hit) / six - 1e-6))
    n1 = int(np.floor((t1 - hit) / six))
    for n in range(n0, n1 + 1):
        at = hit + n * six
        step = n % 16
        after = max(0, at - hit)
        fade = np.exp(-after * 0.9)  # groove relaxes after the hit
        if n >= -4 and n < 0:  # tabla roll ("tirakita") into the hit
            mix.add(tabla_na(587.33 if n % 2 else 293.66, 0.3, 14), at, 0.18 + 0.06 * (n + 4), pan=0.25, verb=0.2)
            continue
        if kick_p[step] == 'x':
            mix.add(kick(), at, 0.55 * fade, verb=0.08)
        if ge_p[step] == 'x':
            mix.add(tabla_ge(), at, 0.42 * fade, pan=-0.15, verb=0.12)
        if na_p[step] == 'x':
            mix.add(tabla_na(293.66, 0.4, 10 if step % 4 else 6), at, 0.2 * fade, pan=0.2, verb=0.15)
        if step % 2:
            mix.add(shaker(), at, 0.06 * fade, pan=0.45, verb=0.1)


def build(T, bpm, full):
    mix = Mix(T['duration'])
    dur = T['duration']

    # tanpura drone cycle: Pa Sa Sa Sa(low), one pluck every 0.5 s
    notes = [A2, D3, D3, D2]
    k = 0
    t = 0.0
    while t < dur:
        mix.add(tanpura(notes[k % 4], 3.5), t, 0.11 * min(1, (t + 0.3) / 1.2), pan=-0.3 + 0.2 * (k % 4), verb=0.3)
        t += 0.5
        k += 1

    # opening: reverse shimmer into the seed of light, airy riser into the leaves
    rs = reverse_shimmer(1.0)
    mix.add(rs, T['seed'] + 0.15 - len(rs) / SR, 0.5, verb=0.4)
    mix.add(riser(T['leaves'][0] + 0.1, 300, 3500), 0, 0.12, verb=0.3)
    mix.add(bell(PENTA[0], 2.0, 0.5), T['seed'] + 0.15, 0.22, verb=0.6)

    # leaves unfold in pairs (left + right whoosh), swirls draw out
    for i, lt in enumerate(T['leaves']):
        mix.add(whoosh(0.8, 350 + 150 * i, 2200 + 400 * i, seed=20 + i), lt, 0.25, pan=-0.6, verb=0.3)
        mix.add(whoosh(0.8, 360 + 150 * i, 2300 + 400 * i, seed=30 + i), lt + 0.03, 0.25, pan=0.6, verb=0.3)
    mix.add(whoosh(1.3, 1500, 6000, seed=40), T['swirls'], 0.13, pan=0, verb=0.5)

    # figure grows: rising tone + riser; head lands with a ting, kick and soft boom
    rise = T['head'] - T['figure']
    tr = tt(rise + 0.2)
    gl = 293.66 * 2 ** ((7 / 12) * np.clip(tr / rise, 0, 1))
    tone = np.sin(2 * np.pi * np.cumsum(gl) / SR) * np.minimum(1, tr / rise) ** 2 * np.exp(-np.maximum(0, tr - rise) * 20)
    mix.add(tone, T['figure'], 0.08, verb=0.5)
    mix.add(riser(rise, 400, 5000, seed=5), T['figure'], 0.14, verb=0.3)
    mix.add(kick(), T['head'], 0.6, verb=0.1)
    mix.add(bell(1174.66, 2.5), T['head'], 0.3, verb=0.5)
    mix.add(boom(1.2) * np.exp(-tt(1.2) * 2), T['head'], 0.25, verb=0.1)

    # sun rays: pentatonic glockenspiel run, spreading outward in the stereo field
    for s in range(6):
        at = T['rays'] + 0.08 + s * T['rayStep'] * 1.5
        mix.add(bell(PENTA[s], 2.2), at, 0.17, pan=(-1) ** s * 0.12 * s, verb=0.55)

    # wordmark / tagline / flourish (full lockup only)
    if full:
        letters_dur = 8 * T['letterStep'] + 1.0
        sweep = filtered_noise(letters_dur, 1200, 7000, 0.5, seed=50)
        sweep *= np.sin(np.pi * tt(letters_dur) / letters_dur) ** 2
        st = np.stack([sweep * np.linspace(1.2, 0.2, len(sweep)), sweep * np.linspace(0.2, 1.2, len(sweep))], axis=1)
        mix.add(st, T['letters'], 0.12, verb=0.3)
        mix.add(glitter(letters_dur, 14, seed=11), T['letters'], 0.35, verb=0.4)
        mix.add(whoosh(0.9, 700, 3000, seed=60), T['tagline'], 0.16, pan=-0.3, verb=0.3)
        mix.add(whoosh(1.0, 900, 4200, seed=61), T['flourish'], 0.15, pan=0.3, verb=0.4)

    # THE HIT: sub boom + singing bowl + D major bell chord + glitter tail
    hit = T['hit']
    mix.add(boom(), hit, 0.9, verb=0.12)
    mix.add(kick(), hit, 0.6, verb=0.1)
    mix.add(singing_bowl(220.0, 6), hit, 0.33, verb=0.4)
    for i, f in enumerate([587.33, 739.99, 880.0, 1174.66]):
        mix.add(bell(f, 3.0, 0.8), hit + 0.012 * i, 0.12, pan=-0.45 + 0.3 * i, verb=0.7)
    crash = filtered_noise(2.5, 9000, 6000, 0.8, seed=70) * np.exp(-tt(2.5) * 2.2)
    mix.add(crash, hit, 0.07, verb=0.5)
    mix.add(glitter(2.0, 30, seed=12), hit + 0.05, 0.4, verb=0.5)

    groove(mix, T, bpm, full)

    # ---- master
    wet = np.stack([fftconvolve(mix.send[:, c], impulse_response()[:, c])[: len(mix.send)] for c in range(2)], axis=1)
    out = (mix.dry + 0.55 * wet)[: mix.n]
    # high-pass at ~28 Hz to tidy the sub, then a gentle soft clip
    spec = np.fft.rfft(out, axis=0)
    f = np.fft.rfftfreq(len(out), 1 / SR)
    spec *= (1 / np.sqrt(1 + (28 / np.maximum(f, 1)) ** 8))[:, None]
    out = np.fft.irfft(spec, n=len(out), axis=0)
    out /= np.abs(out).max()
    out = np.tanh(out * 1.6) / np.tanh(1.6)
    fade_n = int((dur - T['fadeOut']) * SR)
    out[-fade_n:] *= np.linspace(1, 0, fade_n)[:, None] ** 1.5
    out[: int(0.01 * SR)] *= np.linspace(0, 1, int(0.01 * SR))[:, None]
    out *= 10 ** (-1 / 20) / np.abs(out).max()  # peak at -1 dBFS
    return out


def write_wav(path, x):
    pcm = (np.clip(x, -1, 1) * 32767).astype('<i2')
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


if __name__ == '__main__':
    cfg = json.load(open(sys.argv[1]))
    os.makedirs(sys.argv[2], exist_ok=True)
    for name in ('full', 'monogram'):
        audio = build(cfg[name], cfg['bpm'], name == 'full')
        write_wav(os.path.join(sys.argv[2], f'{name}.wav'), audio)
        print(name, f'{len(audio) / SR:.2f}s')
