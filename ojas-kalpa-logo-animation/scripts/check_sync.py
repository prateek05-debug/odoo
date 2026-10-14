"""Measure audio/picture sync in a rendered video.

1. Global offset: cross-correlates the video's decoded audio with the source WAV that
   make_audio.py placed sample-accurately from src/timeline.json. 0 ms = no drift from encoding.
2. Per event: loudness jump between the 10 ms before and the 10 ms after each
   choreographed contact's frame - a large jump means the hit starts on that frame.

Usage: python3 -I scripts/check_sync.py src/timeline.json out/video.mp4 full|monogram
"""
import json
import subprocess
import sys

import numpy as np

SR = 48000
cfg = json.load(open(sys.argv[1]))
video, variant = sys.argv[2], sys.argv[3]
I, E = cfg['intro'], cfg[variant]
fps = cfg['fps']


def decode(path):
    pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(pcm, '<i2').astype(np.float32) / 32768


vid = decode(video)
src = decode(f'public/audio/{variant}.wav')
n = min(len(vid), len(src))
spec = np.fft.rfft(vid[:n], 2 * n) * np.conj(np.fft.rfft(src[:n], 2 * n))
xc = np.fft.irfft(spec)
lags = np.concatenate([np.arange(0, n), np.arange(-n, 0)])
lag = lags[int(np.argmax(xc))]
print(f'global audio offset vs source: {lag / SR * 1000:+.2f} ms')

events = [('seed bursts', I['burst'])]
events += [(f'leaves tier {k + 1}', at) for k, at in enumerate(I['leaves'])]
events += [('head lands', I['headLand']), ('sunrise', I['sunrise'])]
if variant == 'full':
    events += [(f'OJAS letter {k + 1}', at) for k, at in enumerate(E['ojasLetters'])]
    events += [(f'KALPA letter {k + 1}', at) for k, at in enumerate(E['kalpaLetters'])]
    events += [(f'tagline word {k + 1}', at) for k, at in enumerate(E['taglineWords'])]
    events += [('bud blooms (hit)', E['hit'])]

hp = np.diff(vid, prepend=0)  # emphasise transients over drones
rms = lambda a, b: np.sqrt(np.mean(hp[int(a * SR):int(b * SR)] ** 2)) + 1e-9
for name, at in events:
    jump = 20 * np.log10(rms(at, at + 0.01) / rms(at - 0.01, at))
    print(f'{name:16s} frame {round(at * fps):3d} ({at:5.2f}s)  level jump {jump:+5.1f} dB')
print(f'(one frame at {fps} fps = {1000 / fps:.1f} ms)')
