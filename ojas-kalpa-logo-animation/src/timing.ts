import timeline from './timeline.json';

export const FPS = timeline.fps;
export const BPM = timeline.bpm;

/** Emblem build shared by both versions. Seconds. */
export const INTRO = timeline.intro as {
	seed: number;
	burst: number;
	leaves: [number, number, number];
	rise: number;
	headLand: number;
	sunrise: number;
	rayStep: number;
};

export const MONO = timeline.monogram;
export const FULL = timeline.full;

export type Variant = 'full' | 'monogram';
export const ENDING = {
	monogram: {hit: MONO.hit, fadeOut: MONO.fadeOut, duration: MONO.duration},
	full: {hit: FULL.hit, fadeOut: FULL.fadeOut, duration: FULL.duration},
};

/** Sun rays burst from the top ray outward in symmetric pairs: ray-05, then 04+06, 03+07 ... */
export const rayTime = (index: number) => INTRO.sunrise + Math.abs(index - 5) * INTRO.rayStep;
