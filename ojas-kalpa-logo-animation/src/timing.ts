import timeline from './timeline.json';

export const FPS = timeline.fps;
export const BPM = timeline.bpm;

/** Shared opening: doshas -> ojas -> leaves -> figure -> rays. Seconds. */
export const INTRO = timeline.intro as {
	doshaHops: number[][];
	orbitEnd: number;
	orbitTurns: number;
	merge: number;
	fallStart: number;
	baseLand: number;
	leaves: [number, number, number];
	headLand: number;
	rayStart: number;
	rayStep: number;
};

export const MONO = timeline.monogram;
export const FULL = timeline.full;

export type Variant = 'full' | 'monogram';
export const ENDING = {
	monogram: {hit: MONO.hit, fadeOut: MONO.fadeOut, duration: MONO.duration},
	full: {hit: FULL.hit, fadeOut: FULL.fadeOut, duration: FULL.duration},
};
