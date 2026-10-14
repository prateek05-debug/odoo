# Ojas Kalpa — logo intros

These are kinetic, beat-synced animations of the Ojas Kalpa logo, in the spirit of Google's motion identity. **Every movement comes from an element that is already in the logo**, and it moves the way that element's Ayurvedic meaning suggests. There are two versions, a **monogram** and the **full lockup**. Both have music and sound effects and no voice. Each sound starts on the same frame as the contact it belongs to.

| Deliverable | File (in `out/`) | Size / length |
|---|---|---|
| **Full logo intro** (emblem + wordmark + tagline) | `ojas-kalpa-full-intro-1080p.mp4` | 1920×1080, 60 fps, 7.0 s |
| **Monogram intro** (emblem), square | `ojas-kalpa-monogram-1080x1080.mp4` | 1080×1080, 60 fps, 4.25 s |
| Monogram, widescreen | `ojas-kalpa-monogram-1080p.mp4` | 1920×1080, 60 fps, 4.25 s |
| Monogram, vertical (Reels / Shorts) | `ojas-kalpa-monogram-vertical-1080x1920.mp4` | 1080×1920, 60 fps, 4.25 s |
| Full logo, transparent background | `ojas-kalpa-full-intro-alpha.webm` | VP9 + alpha |
| Monogram, transparent background | `ojas-kalpa-monogram-alpha.webm` | VP9 + alpha |

## 1. Reading the logo

| Element in the logo | Ayurvedic meaning |
|---|---|
| The glow point under the emblem | The seed of life, where everything begins |
| Gold flowing swirls at the base | **Rasa**, the nourishing flow that feeds everything above it |
| Six green leaves in a lotus shape | **Aushadhi**, the healing herbs, cradling the person. Green = **Kalpa**, the herbal formulation |
| Gold figure rising out of the leaves, arms raised | A healthy, joyful person growing out of nature |
| Gold sphere as the head, at the centre of the sun | **Ojas**, vital essence and inner radiance. The person *is* the sun |
| 11 sun rays | **Tejas / Agni**: energy and vitality, the rising sun of a new day |
| "OJAS" in gold, "KALPA" in green | Gold = light and essence; green = herbs and growth |
| *आरोग्य पुष्टिवर्धनम्* | "Health and ever-growing nourishment" (*pushtivardhanam*, as in the Mahamrityunjaya mantra) |
| Leaf sprigs, and the flourish with a 3-leaf bud | New growth: the sprout that renews |

## Storyboard: what moves, why, and what you hear

All times are in seconds, on a 120 BPM grid at 60 fps.

| Full | Mono | Picture (from the logo) | Meaning | Sound |
|---|---|---|---|---|
| 0–0.5 | 0–0.5 | The base glow gathers, breathes in… | Seed of life | Tanpura drone, breath-in shimmer |
| **0.5** | **0.5** | …and bursts. The gold swirls flow out to both sides. | Rasa nourishes | Water drop + flowing water L/R |
| 0.75 / 1.0 / 1.25 | same | Leaves unfold in three tiers like a lotus, then keep a slow living sway | Herbs grow from nourishment | Santoor plucks per tier (left + right leaf), tabla |
| 1.25–1.75 | same | A golden drop rises from the seed through the centre. The figure grows behind it, and the drop becomes the head. | Essence rises into the person = Ojas | Bansuri-like flute glide rising, soft ting on landing |
| **2.0** | **2.0** | The head breathes in and ignites. 11 rays burst out from the top ray in symmetric pairs, with a halo and sunburst. | Ojas → Tejas: inner radiance, sunrise | Temple bell + boom, one chime per ray (monogram adds a singing bowl: this is its hit) |
| 2.5–2.875 | — | **OJAS**: each gold letter is struck by light, flashing white-hot and cooling to gold, with a glint | Light / essence | Crystal bell per letter, climbing |
| 3.0–3.5 | — | **KALPA**: each green letter sprouts from the ground and sways into place | Herbs / growth | Santoor + tabla per letter |
| 3.75 / 4.0 | — | *आरोग्य* … *पुष्टिवर्धनम्* writes on, word by word | The blessing | Tabla *dha* + bell per word |
| 4.0–4.4 | — | Leaf sprigs grow out at the sides | New growth | Leaf pops |
| **4.5** | — | The flourish flows in and the centre bud blooms; a light sweep crosses the logo | Renewal, Arogya | Boom, singing bowl, temple bell, bell chord |
| → 7.0 | → 4.25 | Hold, then dissolve into warm light | | Bowl and drone ring out |

## 2. Kinetic rules used (research)

- **One shared set of snappy easing curves and arcs.** Google's 2015 identity had its dots travel along geometric arcs on a standard set of quick easing curves. That way motion looks spontaneous but stays consistent ([Motionographer interview](https://motionographer.com/2015/11/09/interview-motion-design-and-the-google-identity/), [Brand New commentary](https://www.brandknewmag.com/?p=7092)). Here every jump is a true ballistic arc, every pop is the same spring family, and every camera move uses the same S-curve.
- **Squash and stretch.** The rising drop stretches with its speed and squashes as it lands as the head. The head breathes in before it ignites.
- **Everything on the beat.** At 120 BPM, contacts land on 8th notes (0.25 s) or a 3-frame stagger (0.05 s). At 60 fps every event falls exactly on a frame.
- **Sound follows meaning and contact.** Each element has its own instrument, as listed in the storyboard. Swells and risers are built so they *end* on the impact rather than start on it, and the background ducks in the 60 ms before each impact.
- **Smoothness.** It renders at 60 fps. Motion uses only transforms and masks, with no per-frame blur, and every frame is a pure function of time, so it is deterministic.

### Measured sync (rendered MP4s)

`scripts/check_sync.py` checks the rendered MP4s; the full output is in `out/sync-report.txt`.
- **Global offset:** the MP4 audio is cross-correlated against the sample-accurate source track. Result: **+0.00 ms** for both videos.
- **Per element:** the level jump between the 10 ms before and the 10 ms after each element's frame is **+5 to +42 dB** for every one: seed burst, the three leaf tiers, head, sunrise, all 9 letters, both tagline words and the final hit. Each sound starts on its frame.

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
src/kinetic.ts               essence path, squash & stretch, springs
src/components/Essence.tsx   the seed of light, its ripple, and the rising golden essence
src/components/Logo.tsx      each logo element's motion (flow, leaves, figure, sunrise, light/sprout letters, blessing, bud)
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
- Ayurveda (Ojas as vital essence of the tissues): [Forest Essentials – Ojas](https://www.forestessentialsindia.com/blog/?p=6033), [Tridosha in Ayurveda – an introduction](https://ayurvaid.com/blog/tridosha-in-ayurveda-an-introduction/)
- Logo timing and easing: [brand-marketing animation principles](https://playbooks.com/skills/dylantarre/animation-principles/brand-marketing)
- Audio logo length: [Creative Bloq – audio logos](https://www.creativebloq.com/features/audio-logos)
- Tool comparison: [Remotion vs Motion Canvas vs Revideo](https://www.pkgpulse.com/guides/remotion-vs-motion-canvas-vs-revideo-programmatic-video-2026)
