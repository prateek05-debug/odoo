import {Easing} from 'remotion';
import type {CSSProperties} from 'react';
import meta from '../public/layers/layers.json';

export type LayerInfo = {name: string; kind: string; x: number; y: number; w: number; h: number};

export const LOGO = meta as {
	width: number;
	height: number;
	head: {x: number; y: number};
	emblemBase: {x: number; y: number};
	layers: LayerInfo[];
};

export const layer = (name: string): LayerInfo => {
	const found = LOGO.layers.find((l) => l.name === name);
	if (!found) throw new Error(`Unknown layer ${name}`);
	return found;
};

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

// Premium, calm motion: long ease-out tails, no bouncing.
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

/** Eased 0..1 progress of an animation that starts at `start` seconds and lasts `dur`. */
export const prog = (t: number, start: number, dur: number, ease: (x: number) => number = easeOut) =>
	ease(clamp01((t - start) / dur));

/** Soft-edged wipe reveal. `dir` is the direction the reveal travels. */
export const wipe = (dir: 'to right' | 'to left' | 'to top' | 'to bottom', p: number, feather = 0.18): CSSProperties => {
	if (p >= 1) return {};
	const edge = p * (1 + feather) * 100;
	const g = `linear-gradient(${dir}, #000 ${edge - feather * 100}%, transparent ${edge}%)`;
	return {maskImage: g, WebkitMaskImage: g};
};
