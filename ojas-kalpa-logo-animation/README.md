# Ojas Kalpa — animated logo intros

Two animated versions of the Ojas Kalpa logo for video intros. Both have music and sound effects and no voice.

| Deliverable | File (in `out/`) | Size / length |
|---|---|---|
| **Full logo intro** (emblem + wordmark + tagline) | `ojas-kalpa-full-intro-1080p.mp4` | 1920×1080, 7.0 s |
| **Monogram intro** (emblem only), square | `ojas-kalpa-monogram-1080x1080.mp4` | 1080×1080, 4.5 s |
| Monogram, widescreen | `ojas-kalpa-monogram-1080p.mp4` | 1920×1080, 4.5 s |
| Monogram, vertical (Reels / Shorts) | `ojas-kalpa-monogram-vertical-1080x1920.mp4` | 1080×1920, 4.5 s |
| Full logo, **transparent background** | `ojas-kalpa-full-intro-alpha.webm` | VP9 + alpha, 7.0 s |
| Monogram, **transparent background** | `ojas-kalpa-monogram-alpha.webm` | VP9 + alpha, 4.5 s |

The MP4s are H.264 at 30 fps with 48 kHz stereo AAC (320 kbps) audio, mastered to about **−15 LUFS** with a −1 dBFS peak. That level suits YouTube, Instagram and similar platforms. The `.webm` alpha files can be laid over your own footage. If your editor needs ProRes 4444, see *Re-rendering* below.

---

## 1. Research: how the animation should be

These are the points the design follows. Sources are listed at the bottom.

**Length.** A logo sting should usually run 2–3 s for TV and 1–3 s for the hold, and sonic logos are about 2–3 s. So the monogram builds in about 2 s and holds for about 2 s. The full lockup has more to reveal and stays under 7 s, which is long enough to read the tagline but still short enough to skip.

**Phases.** Anticipation → main reveal → settle → hold.
- Anticipation: a seed of light and a riser.
- Main reveal: the emblem grows, then the wordmark appears.
- Settle: the "hit" with a light sweep.
- Hold: a slow push-in, then a soft dissolve.

**Easing.** Linear motion looks mechanical. Premium and wellness brands use slower, deliberate timing, so everything uses long ease-out curves (`cubic-bezier(0.16,1,0.3,1)`) and S-curves for wipes. Bounce and elastic easing are left out. Only the head and the flourish bud get a very small spring.

**Sequencing.** Elements settle at slightly different times, and the tagline arrives *after* the logo lands. That gives a natural, layered feel.

**Brand story.** The motion follows what the mark means. *Ojas* is vital energy and *Kalpa* means a rejuvenation formula. The story runs:
1. A seed of light.
2. The leaves unfold like a lotus.
3. The figure rises.
4. The sun radiates.
5. The name and *आरोग्य पुष्टिवर्धनम्* ("increasing health and nourishment") resolve.

**Background.** The logo is drawn for a white background, and its gold has white specular highlights. On dark backgrounds those highlights look like holes, and *KALPA* (green) loses contrast. So the intro uses a warm **ivory** background with gold dust and a soft sunburst. The alpha versions are there for when you need something else.

**Sound.** The sound follows the motion: whooshes for movement, chimes for light, and a sub "hit" plus a bell on the final lock-up. The palette is Indian-classical to match Ayurveda: a tanpura drone, a tabla-style groove, a glockenspiel and a singing bowl. Every sound is **synthesised from code** (`scripts/make_audio.py`), so there are no samples and no licensing issues.

## 2. Storyboard (seconds)

Timings live in `src/timeline.json`. Both the picture and the sound read from that file, so every effect lands on its frame. The tempo is 120 BPM, and the hit falls on a bar downbeat.

| Full | Monogram | Picture | Sound |
|---|---|---|---|
| 0.00 | 0.00 | Ivory light, gold dust appears | Tanpura drone (Sa–Pa), airy riser |
| 0.25 | 0.15 | Seed-of-light glint at the emblem base | Reverse shimmer → soft bell |
| 0.50 / 0.75 / 1.00 | 0.35 / 0.55 / 0.75 | Leaf pairs unfold from the base (lower → upper → outer) | L/R whoosh per pair |
| 0.75 | 0.55 | Gold swirls draw outward | Airy sweep |
| 1.00 | 0.75 | Figure grows upward | Rising tone + riser |
| 1.50 | 1.25 | Head lands, glint, halo appears | Kick + "ting" + soft boom |
| 1.58–1.9 | 1.33–1.6 | 11 sun rays shoot out from the centre ray outward; sunburst appears | Pentatonic glockenspiel run, spreading in stereo |
| 2.00 | — | *OJAS KALPA* tracks in letter by letter (converge + rise + focus) | Tabla groove starts; L→R glitter sweep |
| 2.90 | — | Light sweep across the wordmark | — |
| 3.00 | — | Ornaments extend; Devanagari tagline writes on left→right | Swish |
| 3.50 | — | Bottom flourish draws out from the centre | Shimmer sweep |
| 3.75 | 1.75 | — | Tabla roll ("tirakita") into the hit |
| **4.00** | **2.00** | **Hit:** bud blooms, light sweep over the whole logo, glints, halo pulse, camera kick | Sub boom + singing bowl + D-major bell chord + glitter tail |
| 4.0–6.4 | 2.0–3.9 | Hold with a slow push-in; groove relaxes | Bowl and drone ring out |
| 6.4–7.0 | 3.9–4.5 | Logo dissolves into warm light | Fade |

## 3. Best public repos for motion graphics

| Repo | License | Best for | Verdict |
|---|---|---|---|
| **[remotion-dev/remotion](https://github.com/remotion-dev/remotion)** | Free for individuals, non-profits and companies of **≤ 3 employees**; larger companies need a paid licence | Motion graphics in React/CSS, rendering MP4/WebM/ProRes **with audio**, batch rendering, alpha | ✅ **Used here.** It is the most complete toolchain for logo intros: frame-accurate, renders headless, and has a live editor (`npm run studio`). |
| [motion-canvas/motion-canvas](https://github.com/motion-canvas/motion-canvas) | MIT | Explainers and vector and code animations, with an imperative timeline | The best fully open-source alternative. |
| [redotvideo/revideo](https://github.com/redotvideo/revideo) | MIT | A Motion Canvas fork with server-side rendering API | Good for automated pipelines. |
| [ManimCommunity/manim](https://github.com/ManimCommunity/manim) | MIT | Math and diagram animation | Not a good fit for brand stings. |
| [airbnb/lottie-web](https://github.com/airbnb/lottie-web) | MIT | Playing After Effects animations (exported with Bodymovin) on web and apps | Use it if you want the logo animated *inside* a website or app. |
| [greensock/GSAP](https://github.com/greensock/GSAP) | Free "no-charge" licence, including commercial use | Timeline animation in the browser | Good for animating the logo on a web page. |

The licence information was checked against Remotion's `LICENSE.md` (v4.0.535). If Ojas Kalpa has more than 3 employees, either buy a Remotion company licence or port `src/` to Motion Canvas. The layer PNGs and audio work with any tool.

## 4. How it is built

```
assets/source-logo.webp      the original flat logo
scripts/extract_layers.py    splits it into 37 transparent layers + layers.json (positions)
scripts/make_audio.py        synthesises the music bed + SFX from src/timeline.json
src/timeline.json            ⟵ single source of truth for timing (edit this to re-time)
src/components/Logo.tsx      per-element animation (leaves, figure, rays, letters, tagline…)
src/components/Atmosphere.tsx  background, gold dust, halo, sunburst, glints
src/Intro.tsx, src/Root.tsx  framing / camera / compositions (formats)
out/                         rendered videos
```

`extract_layers.py` handles the flat logo in four steps:
1. It "un-mixes" the white background so every pixel gets a true colour and alpha.
2. It finds each shape: 11 rays, the head, the body, 6 leaves, 2 swirls, 9 letters, 2 tagline words, the ornaments and the flourish.
3. It hands every soft edge and glow pixel to its nearest shape.
4. It restores solid interiors, so the gold highlights stay opaque.

Composited back on white, the layers match the source to within 7/255 per pixel.

## 5. Re-rendering / editing

Prerequisites: Node 18 or newer, Python 3 with `numpy`, `pillow` and `scipy`, and ffmpeg.

```bash
npm install
npm run studio          # live preview + scrubbing in the browser
npm run audio           # after changing src/timeline.json
npm run render          # all formats -> out/
# single render, e.g. ProRes 4444 with alpha for Premiere / Final Cut / Resolve:
npx remotion render Full-16x9-Alpha out/full-alpha.mov --codec=prores --prores-profile=4444 --pixel-format=yuva444p10le --image-format=png
```

To swap the logo, replace `assets/source-logo.webp`, run `npm run layers`, and check the layer names in `public/layers/layers.json`. Shapes are named by where they sit, so a different logo will need `extract_layers.py` adjusted.

### Sources
- Logo animation timing and easing: [brand-marketing animation principles](https://playbooks.com/skills/dylantarre/animation-principles/brand-marketing), [500–800 ms emphasis motion](https://playbooks.com/skills/dylantarre/animation-principles/large-500-800ms), [motion design animation theory](https://cdn.jsdelivr.net/npm/claude-code-skills@0.5.0/data/skills/wiggle/references/animation_theory.md), [After Effects logo reveal techniques](https://mumble.maidsafe.net/blog/after-effects-logo-reveal-stunning-animations-1764805442)
- Audio logo length: [Creative Bloq – audio logos](https://www.creativebloq.com/features/audio-logos), [wearelisten – how audio logos build recognition](https://wearelisten.com/what-is-sonic-branding-pt-2), [Killer Spots – what is a sound logo](https://killerspots.com/blog/what-is-a-sound-logo)
- Tool comparison: [Remotion vs Motion Canvas](https://www.remotion.dev/docs/compare/motion-canvas), [Remotion vs Motion Canvas vs Revideo](https://www.pkgpulse.com/guides/remotion-vs-motion-canvas-vs-revideo-programmatic-video-2026), [Remotion vs Motion Canvas vs Manim](https://beginnersinai.org/remotion-vs-motion-canvas-vs-manim/)
