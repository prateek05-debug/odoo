# Ojas Kalpa — kinetic logo intros

These are kinetic logo animations in the spirit of Google's motion identity: dots bounce, orbit and merge on a beat grid, then turn into the logo. There are two versions, a **monogram** and the **full lockup**. Both have music and sound effects and no voice. Each sound starts on the same frame as the contact it belongs to.

| Deliverable | File (in `out/`) | Size / length |
|---|---|---|
| **Full logo intro** (emblem + wordmark + tagline) | `ojas-kalpa-full-intro-1080p.mp4` | 1920×1080, 60 fps, 7.5 s |
| **Monogram intro** (emblem), square | `ojas-kalpa-monogram-1080x1080.mp4` | 1080×1080, 60 fps, 4.75 s |
| Monogram, widescreen | `ojas-kalpa-monogram-1080p.mp4` | 1920×1080, 60 fps, 4.75 s |
| Monogram, vertical (Reels / Shorts) | `ojas-kalpa-monogram-vertical-1080x1920.mp4` | 1080×1920, 60 fps, 4.75 s |
| Full logo, transparent background | `ojas-kalpa-full-intro-alpha.webm` | VP9 + alpha |
| Monogram, transparent background | `ojas-kalpa-monogram-alpha.webm` | VP9 + alpha |

## 1. The idea: why this makes sense for Ayurveda

In Ayurveda, health is defined as a **balance of the three doshas**: Vata (air and space), Pitta (fire and water) and Kapha (earth and water). **Ojas** is the vital essence, described as the "sap" or essence of all the body's tissues. The animation tells that story in brand colours.

| Beat | What you see | What it means |
|---|---|---|
| 0.25 / 0.5 / 0.75 s | Three glossy dots drop in and bounce, one after another: saffron (Vata), gold (Pitta) and green (Kapha). | The three doshas. |
| 0.75–1.5 s | They orbit faster and faster and spiral into the centre. | The doshas coming into balance. |
| 1.5 s | They merge into one golden drop, with a ring burst and a glint. | Balance creates **Ojas**. |
| 2.0 s | The drop falls and splashes at the base. A ripple spreads, the gold swirls splash out, and the leaves burst open in three quick pops. | Ojas nourishes life. |
| 2.0–2.5 s | The drop shoots up and the figure grows behind it. The drop lands as the figure's head. | Vitality rises. |
| 2.5–3.0 s | 11 sun rays pop out left to right, one every 3 frames. The camera glides out. | Radiance. |
| **Monogram 3.25 s** | Final hit, one beat after the last ray: light sweep, glint and halo pulse. | |
| Full 3.0–5.25 s | An Ojas spark jumps out of the head and hops across the name. Every landing "plants" a letter, which grows up like a sprout (O-J-A-S … K-A-L-P-A). | Ojas creates *Kalpa*, rejuvenation. |
| **Full 5.5 s** | The last hop lands on the flourish bud. The bud blooms, the flourish whips out, *आरोग्य पुष्टिवर्धनम्* pops up, and a light sweep crosses the logo. | "Increasing health and nourishment." |

## 2. Kinetic rules used (research)

- **One shared set of snappy easing curves and arcs.** Google's 2015 identity had its dots travel along geometric arcs on a standard set of quick easing curves. That way motion looks spontaneous but stays consistent ([Motionographer interview](https://motionographer.com/2015/11/09/interview-motion-design-and-the-google-identity/), [Brand New commentary](https://www.brandknewmag.com/?p=7092)). Here every jump is a true ballistic arc, every pop is the same spring family, and every camera move uses the same S-curve.
- **Squash and stretch.** Balls stretch along their velocity and flatten on impact with a damped wobble. Short motion trails keep fast moves smooth.
- **Everything on the beat.** At 120 BPM, contacts land on 8th notes (0.25 s) or a 3-frame stagger (0.05 s). At 60 fps every event falls exactly on a frame.
- **Sound follows contact.** Every bounce, merge, splash, leaf pop, ray and letter has its own sound:
  - Doshas are tabla voices: Vata a high *na*, Pitta a bright *tin*, Kapha a bass *ge* plus a kick.
  - The orbit "whirl" pulses each time a dot passes.
  - The letters play a rising pentatonic marimba phrase.
  - The final hit is a sub boom, a singing bowl and a bell chord.
  - Whooshes and risers are built so they *end* on the impact rather than start on it.
- **Smoothness.** It renders at 60 fps. Motion uses only transforms and masks, with no per-frame blur, and every frame is a pure function of time, so it is deterministic.

### Measured sync (rendered MP4s)

`scripts/check_sync.py` checks the rendered MP4s in two ways. The full output is in `out/sync-report.txt`.
- **Global offset:** the MP4 audio is cross-correlated against the sample-accurate source track. Result: **+0.00 ms** for both videos, so encoding added no drift.
- **Per contact:** the level jump between the 10 ms before and the 10 ms after each contact's frame.
  - Dosha landings, Ojas merge, head landing, letters and final hit: **+10 to +25 dB**, a crisp hit right on the frame.
  - Splash: about +4 dB, because it sits on top of the falling whistle.
  - The 11 ray chimes, 50 ms apart: +1 to +4 dB. They read as one quick glissando.

  The background (drone, swells, risers) ducks in the 60 ms before each impact, so the hits land with a clean edge.

## 3. Best public repos for motion graphics

| Repo | License | Best for |
|---|---|---|
| **[remotion-dev/remotion](https://github.com/remotion-dev/remotion)** (used here) | Free for individuals, non-profits and companies with ≤ 3 employees; paid company licence above that | React/CSS motion graphics. Frame-accurate, renders MP4/WebM/ProRes with audio and alpha. |
| [motion-canvas/motion-canvas](https://github.com/motion-canvas/motion-canvas) | MIT | The best fully open-source alternative, with an imperative timeline. |
| [redotvideo/revideo](https://github.com/redotvideo/revideo) | MIT | A Motion Canvas fork with a server-side rendering API. |
| [airbnb/lottie-web](https://github.com/airbnb/lottie-web) | MIT | Playing After Effects animations in websites and apps. |
| [greensock/GSAP](https://github.com/greensock/GSAP) | Free "no-charge" licence | Animating the logo on a web page. |
| [ManimCommunity/manim](https://github.com/ManimCommunity/manim) | MIT | Math and diagram animation; not a good fit for brand stings. |

## 4. How it is built

```
src/timeline.json            ⟵ single source of truth: every contact time (picture AND sound read it)
src/kinetic.ts               ballistic arcs, orbit spiral, squash & stretch, springs
src/components/Dots.tsx      the glossy dosha / ojas / spark balls, ripples, merge ring
src/components/Logo.tsx      logo layers reacting to the contacts (leaves, figure, rays, letters…)
src/components/Atmosphere.tsx  background, gold dust, halo, sunburst, glints
src/Intro.tsx, src/Root.tsx  camera (close-up -> glide out), formats
scripts/extract_layers.py    splits the flat logo into 37 transparent layers
scripts/make_audio.py        synthesises every sound from the same timeline (no samples, royalty free)
scripts/check_sync.py        measures audio-vs-picture offset in a rendered file
```

## 5. Re-rendering / editing

Prerequisites: Node 18 or newer, Python 3 with `numpy`, `pillow` and `scipy`, and ffmpeg.

```bash
npm install
npm run studio     # live preview + scrubbing
npm run audio      # regenerate sound after editing src/timeline.json
npm run render     # all formats -> out/
python3 -I scripts/check_sync.py src/timeline.json out/ojas-kalpa-full-intro-1080p.mp4 full
```

To re-time the animation, edit `src/timeline.json`, then run `npm run audio` and `npm run render`. Picture and sound move together.

### Sources
- Google motion identity: [Motionographer – Motion design and the Google identity](https://motionographer.com/2015/11/09/interview-motion-design-and-the-google-identity/), [designboom – new Google logo](https://www.designboom.com/design/new-google-logo-09-01-2015/), [Brand New commentary](https://www.brandknewmag.com/?p=7092), [moonb – logo animation examples](https://www.moonb.io/blog/logo-animation-examples)
- Ayurveda: [Tridosha in Ayurveda – an introduction](https://ayurvaid.com/blog/tridosha-in-ayurveda-an-introduction/), [Forest Essentials – Ojas](https://www.forestessentialsindia.com/blog/?p=6033), [University of Mauritius open course text](https://oermu.uom.ac.mu/bitstreams/b8879239-6fa9-40c1-bb3b-e22f5afa3902/download)
- Logo timing and easing: [brand-marketing animation principles](https://playbooks.com/skills/dylantarre/animation-principles/brand-marketing)
- Audio logo length: [Creative Bloq – audio logos](https://www.creativebloq.com/features/audio-logos)
- Tool comparison: [Remotion vs Motion Canvas vs Revideo](https://www.pkgpulse.com/guides/remotion-vs-motion-canvas-vs-revideo-programmatic-video-2026)
