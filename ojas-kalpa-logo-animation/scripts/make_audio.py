"""Synthesise the music bed + sound effects for both intros, locked to src/timeline.json.

Everything is generated from scratch here (no samples), so the audio is 100% royalty free.
Palette (Ayurveda / Indian-classical feel, no voice):
  * tanpura-style drone in D (Sa-Pa)          * tabla-style groove (dayan "na/tin", bayan "ge")
  * airy whooshes for leaves and swirls        * glockenspiel arpeggio for the sun rays
  * singing bowl + sub boom + bell chord on the logo hit, glitter tail
  * kinetic sync: every on-screen contact (dosha bounce, merge, splash, leaf pop, head,
    each ray, each letter) has its own sound starting on that exact timestamp

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
        self.bed = np.zeros_like(self.dry)  # drones, swells, risers, shakers: ducked before impacts
        self.send = np.zeros_like(self.dry)
        self.n = int(dur * SR)

    def add(self, sig, at, gain=1.0, pan=0.0, verb=0.25, bed=False):
        if sig.ndim == 1:
            l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
            sig = np.stack([sig * l * 1.414, sig * r * 1.414], axis=1)
        i = int(round(at * SR))
        if i < 0:
            sig, i = sig[-i:], 0
        j = min(i + len(sig), len(self.dry))
        (self.bed if bed else self.dry)[i:j] += sig[: j - i] * gain
        self.send[i:j] += sig[: j - i] * gain * verb

    def duck_envelope(self, impacts):
        """Pull the bed down in the 60 ms before each impact so the hit lands with a clear edge."""
        t = np.arange(len(self.dry)) / SR
        g = np.ones_like(t)
        for at, depth in impacts:
            pre = np.clip((t - (at - 0.06)) / 0.055, 0, 1)
            post = np.exp(-np.maximum(0, t - at) / 0.09)
            shape = np.where(t < at, pre, post)
            g = np.minimum(g, 1 - depth * shape)
        return g[:, None]


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


# ---------------------------------------------------------------- extra kinetic voices
def pop(f=520.0, dur=0.18):
    """Leaf 'pop': pitched blip that drops in pitch + a tiny click."""
    t = tt(dur)
    freq = f * (1 + 0.8 * np.exp(-t * 60))
    out = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t * 26)
    out[:120] += rng.standard_normal(120) * np.exp(-np.arange(120) / 25) * 0.25
    return out


def bloop(f0=380.0, f1=1300.0, dur=0.16):
    """Water-drop: fast upward sine sweep."""
    t = tt(dur)
    freq = f0 * (f1 / f0) ** np.clip(t / 0.05, 0, 1)
    return np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t * 30) * np.minimum(1, t / 0.002)


def glide(f0, f1, dur, curve):
    """Sine whistle whose pitch follows `curve(u)` (0..1) — matches an on-screen path."""
    t = tt(dur)
    u = np.clip(t / dur, 0, 1)
    freq = f0 * (f1 / f0) ** curve(u)
    env = np.minimum(1, t / 0.03) * np.minimum(1, (dur - t) / 0.02).clip(0)
    return np.sin(2 * np.pi * np.cumsum(freq) / SR) * env


def marimba(f, dur=0.9):
    t = tt(dur)
    out = np.sin(2 * np.pi * f * t) * np.exp(-t * 6) + 0.35 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 22)
    out += 0.15 * np.sin(2 * np.pi * f * 10 * t) * np.exp(-t * 60) if f * 10 < 0.45 * SR else 0
    return out * np.minimum(1, t / 0.0015)


def snap(dur=0.03, bright=6000):
    """Very short, bright click that gives an impact a sharp, frame-accurate edge."""
    t = tt(dur)
    return filtered_noise(dur, bright, bright, 0.6, seed=int(rng.integers(1e6))) * np.exp(-t * 220)


def mallet(f, dur=1.0):
    """Glockenspiel note with a hard mallet attack (clearly audible even in a busy mix)."""
    out = bell(f, dur, 1.2) * np.exp(-tt(dur) * 5)
    out[: int(0.03 * SR)] += snap(0.03, min(9000, f * 4)) * 0.6
    return out


def pre(sig, impact):
    """Return (sig, start) so that a swelling sound ENDS exactly on the impact."""
    return sig, impact - len(sig) / SR


# ---------------------------------------------------------------- arrangement
NOTE = lambda semis: 293.66 * 2 ** (semis / 12)  # relative to D4
PENTA_STEPS = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24]  # D major pentatonic, 2 octaves


def build(cfg, variant):
    I, E = cfg['intro'], cfg[variant]
    dur = E['duration']
    mix = Mix(dur)
    beat = 60 / cfg['bpm']

    # tanpura drone bed (quiet), one pluck per beat: Pa Sa Sa Sa(low)
    notes = [A2, D3, D3, D2]
    k, t = 0, 0.0
    while t < dur:
        mix.add(tanpura(notes[k % 4], 3.5), t, 0.07 * min(1, (t + 0.2) / 1.0), pan=-0.3 + 0.2 * (k % 4), verb=0.3, bed=True)
        t += beat
        k += 1

    # 1) three doshas drop in and bounce — each has its own tabla voice
    voices = [
        lambda g: tabla_na(587.33, 0.4, 9) * g,  # vata: light, high
        lambda g: tabla_na(440.0, 0.5, 6) * g,  # pitta: bright "tin"
        lambda g: tabla_ge(0.7) * g,  # kapha: earthy bass (+ kick below)
    ]
    pans = [0.0, -0.4, 0.4]
    for i, hops in enumerate(I['doshaHops']):
        sig, at = pre(whoosh(0.4, 2500, 600, seed=80 + i) * np.linspace(0.2, 1, int(0.4 * SR)), hops[0])
        mix.add(sig, at, 0.1, pan=pans[i], verb=0.2, bed=True)
        for n, h in enumerate(hops):
            g = 0.5 ** n
            mix.add(voices[i](1.0), h, 0.5 * g, pan=pans[i], verb=0.15)
            if i == 2:
                mix.add(kick(), h, 0.45 * g, verb=0.05)

    # 2) orbit: a whirl whose tremolo follows the dots passing (3 per turn), rising into the merge
    o0 = I['doshaHops'][2][-1]
    od = I['orbitEnd'] - o0
    tw = tt(od)
    u = tw / od
    phi = I['orbitTurns'] * 2 * np.pi * u ** 2
    whirl = filtered_noise(od, 500, 4500, 0.4, seed=90) * (0.35 + 0.65 * (0.5 + 0.5 * np.cos(3 * phi))) * u ** 1.5
    mix.add(whirl, o0, 0.22, verb=0.3, bed=True)
    mix.add(glide(NOTE(0), NOTE(12), od, lambda x: x ** 2) * u ** 2, o0, 0.05, verb=0.4, bed=True)
    rs = reverse_shimmer(0.7)
    mix.add(rs, I['merge'] - 0.02 - len(rs) / SR, 0.45, verb=0.4, bed=True)  # 'suck' stops just before

    # 3) merge into ojas: bell chord + kick + glitter
    m = I['merge']
    mix.add(kick(), m, 0.55, verb=0.1)
    mix.add(snap(0.03, 7000), m, 0.5, verb=0.2)
    for n, st in enumerate([12, 16, 19, 24]):
        mix.add(bell(NOTE(st), 2.2, 0.8), m + 0.004 * n, 0.12, pan=-0.3 + 0.2 * n, verb=0.6)
    mix.add(glitter(0.6, 10, seed=21), m, 0.3, verb=0.4)

    # 4) the drop falls (descending whistle ending on impact) and splashes at the base
    fd = I['baseLand'] - I['fallStart']
    mix.add(glide(NOTE(24), NOTE(7), fd, lambda x: x ** 2), I['fallStart'], 0.06, verb=0.3, bed=True)
    b = I['baseLand']
    mix.add(kick(), b, 0.75, verb=0.05)
    mix.add(snap(0.03, 4500), b, 0.55, verb=0.15)
    mix.add(tabla_ge(0.8), b, 0.45, verb=0.1)
    mix.add(tabla_na(293.66, 0.4, 8), b, 0.3, verb=0.15)
    mix.add(bloop(300, 900, 0.2), b, 0.35, verb=0.3)
    mix.add(boom(1.0) * np.exp(-tt(1.0) * 3), b, 0.35, verb=0.1)
    for n, lt in enumerate(I['leaves']):  # leaves burst: L/R pops on each stagger
        mix.add(pop(NOTE(12 + 4 * n)), lt, 0.3, pan=-0.6, verb=0.25)
        mix.add(pop(NOTE(12 + 4 * n) * 1.01), lt + 0.004, 0.3, pan=0.6, verb=0.25)
    mix.add(whoosh(0.4, 900, 4000, seed=91), b, 0.12, verb=0.3)

    # 5) drop rises with the figure (whistle up, decelerating like the drop) and lands as the head
    h = I['headLand']
    rd = h - b
    mix.add(glide(NOTE(7), NOTE(24), rd, lambda x: 1 - (1 - x) ** 2), b, 0.07, verb=0.4, bed=True)
    mix.add(riser(rd, 400, 5000, seed=92), b, 0.1, verb=0.2, bed=True)
    mix.add(kick(), h, 0.6, verb=0.05)
    mix.add(snap(0.03, 6000), h, 0.4, verb=0.15)
    mix.add(bell(NOTE(24), 1.2) * np.exp(-tt(1.2) * 2), h, 0.18, verb=0.4)

    # 6) eleven rays, one glockenspiel note each, sweeping left -> right
    for n in range(11):
        at = I['rayStart'] + n * I['rayStep']
        mix.add(mallet(NOTE(12 + PENTA_STEPS[n]), 0.9), at, 0.2, pan=-0.7 + 0.14 * n, verb=0.4)

    # light groove from the splash to the hit: kick on every beat, shaker on 16ths
    hit = E['hit']
    t = b
    while t < hit - 1e-6:
        mix.add(kick(), t, 0.35, verb=0.05)
        for q in range(4):
            mix.add(shaker(), t + q * beat / 4, 0.05 if q % 2 else 0.03, pan=0.4, verb=0.1, bed=True)
        t += beat

    # 7) full lockup: spark hops letter to letter, each landing = one melody note
    if variant == 'full':
        mix.add(bloop(500, 1600, 0.15), E['emit'], 0.3, pan=-0.5, verb=0.3)
        melody = [7, 9, 12, 14, 16, 14, 12, 16, 19]  # pentatonic phrase that climbs to resolve
        lands = E['letterLands']
        for n, at in enumerate(lands):
            pan = -0.5 + n * 0.12
            mix.add(marimba(NOTE(melody[n])), at, 0.28, pan=pan, verb=0.3)
            mix.add(tabla_na(NOTE(melody[n] + 12), 0.25, 14), at, 0.12, pan=pan, verb=0.2)
            mix.add(snap(0.025, 5000), at, 0.3, pan=pan, verb=0.1)
        last = lands[-1]
        mix.add(glide(NOTE(31), NOTE(12), hit - last, lambda x: x ** 1.5), last, 0.05, pan=0.2, verb=0.4, bed=True)
        sig, at = pre(riser(hit - last, 800, 7000, seed=93), hit - 0.02)
        mix.add(sig, at, 0.12, verb=0.3, bed=True)

    # 8) THE HIT: sub boom + singing bowl + D-major bell chord + glitter tail
    mix.add(boom(), hit, 0.9, verb=0.12)
    mix.add(kick(), hit, 0.6, verb=0.1)
    mix.add(snap(0.04, 5000), hit, 0.7, verb=0.3)
    mix.add(tabla_ge(0.9), hit, 0.35, verb=0.15)
    mix.add(singing_bowl(220.0, 6), hit, 0.3, verb=0.4)
    for n, st in enumerate([12, 16, 19, 24]):
        mix.add(bell(NOTE(st), 3.0, 0.8), hit + 0.006 * n, 0.12, pan=-0.45 + 0.3 * n, verb=0.7)
    crash = filtered_noise(2.5, 9000, 6000, 0.8, seed=70) * np.exp(-tt(2.5) * 2.2)
    mix.add(crash, hit, 0.07, verb=0.5)
    mix.add(glitter(1.6, 24, seed=12), hit + 0.03, 0.35, verb=0.5)

    # ---- master
    wet = np.stack([fftconvolve(mix.send[:, c], impulse_response()[:, c])[: len(mix.send)] for c in range(2)], axis=1)
    impacts = [(hops[0], 0.5) for hops in I['doshaHops']]
    impacts += [(I['merge'], 0.75), (I['baseLand'], 0.75), (I['headLand'], 0.6), (hit, 0.8)]
    if variant == 'full':
        impacts += [(at, 0.4) for at in E['letterLands']]
    duck = mix.duck_envelope(impacts)
    out = (mix.dry + (mix.bed + 0.5 * wet) * duck)[: mix.n]
    spec = np.fft.rfft(out, axis=0)
    f = np.fft.rfftfreq(len(out), 1 / SR)
    spec *= (1 / np.sqrt(1 + (28 / np.maximum(f, 1)) ** 8))[:, None]
    out = np.fft.irfft(spec, n=len(out), axis=0)
    out /= np.abs(out).max()
    out = np.tanh(out * 1.6) / np.tanh(1.6)
    fade_n = int((dur - E['fadeOut']) * SR)
    out[-fade_n:] *= np.linspace(1, 0, fade_n)[:, None] ** 1.5
    out *= 10 ** (-1 / 20) / np.abs(out).max()
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
        audio = build(cfg, name)
        write_wav(os.path.join(sys.argv[2], f'{name}.wav'), audio)
        print(name, f'{len(audio) / SR:.2f}s')
