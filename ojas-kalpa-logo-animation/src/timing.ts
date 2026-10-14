import timeline from './timeline.json';

/** Key moments in seconds. Shared with scripts/make_audio.py so sound and picture stay in sync. */
export type Timing = {
	duration: number;
	seed: number;
	leaves: [number, number, number];
	swirls: number;
	figure: number;
	head: number;
	rays: number;
	rayStep: number;
	letters?: number;
	letterStep?: number;
	tagline?: number;
	flourish?: number;
	hit: number;
	grooveStart: number;
	grooveEnd: number;
	fadeOut: number;
};

export const FPS = timeline.fps;
export const TIMING = {
	full: timeline.full as Timing,
	monogram: timeline.monogram as Timing,
};
