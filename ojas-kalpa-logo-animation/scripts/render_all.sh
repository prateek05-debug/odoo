#!/usr/bin/env bash
# Render every deliverable into out/. Pass BROWSER=/path/to/chrome to use a local Chromium.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p out
B=()
if [[ -n "${BROWSER:-}" ]]; then B=(--browser-executable="$BROWSER"); fi

mp4() { npx remotion render "$1" "out/$2.mp4" --codec=h264 --crf=16 --audio-codec=aac --audio-bitrate=320k "${B[@]}"; }
alpha() { npx remotion render "$1" "out/$2.webm" --codec=vp9 --pixel-format=yuva420p --image-format=png --crf=18 "${B[@]}"; }

mp4 Full-16x9 ojas-kalpa-full-intro-1080p
mp4 Monogram-1x1 ojas-kalpa-monogram-1080x1080
mp4 Monogram-16x9 ojas-kalpa-monogram-1080p
mp4 Monogram-9x16 ojas-kalpa-monogram-vertical-1080x1920
alpha Full-16x9-Alpha ojas-kalpa-full-intro-alpha
alpha Monogram-1x1-Alpha ojas-kalpa-monogram-alpha
