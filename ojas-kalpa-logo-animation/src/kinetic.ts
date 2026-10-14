/**
 * Kinetic helpers as pure functions of time (seconds), in logo-space pixels.
 * Everything here is deterministic, so any frame can be rendered on its own.
 */
import {spring} from 'remotion';
import {LOGO} from './anim';
import {FPS, INTRO} from './timing';

export type P = {x: number; y: number};

export const HEAD: P = LOGO.head;
/** The glowing seed point under the emblem (it is in the original artwork). */
export const SEED: P = {x: LOGO.head.x, y: 590};
/** Centre of the three-leaf bud on the bottom flourish. */
export const BUD: P = {x: 1092, y: 646};
export const ESSENCE_R = 28; // the rising drop == size of the figure's head
export const ESSENCE_COLORS = {base: '#E2A51E', light: '#FFF7D6', dark: '#7A4A06'};

const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** Spring-damped squash after an impact at `t0`: >0 = flattened. */
export const squashAfter = (t: number, t0: number, amount: number) => {
	const dt = t - t0;
	if (dt < 0 || dt > 0.6) return 0;
	return amount * Math.exp(-dt * 11) * Math.cos(dt * 30);
};

/** Remotion spring evaluated at time t (seconds) for an event at t0. */
export const springAt = (t: number, t0: number, cfg: {damping: number; stiffness: number; mass?: number}) =>
	t < t0 ? 0 : spring({frame: (t - t0) * FPS, fps: FPS, config: {mass: 1, ...cfg}});

/**
 * The essence (rasa -> ojas) rises from the seed, up through the figure, and becomes its head.
 * Thrown-up motion: fast out of the leaves, slowing to rest exactly at the head.
 */
export const essencePos = (t: number): P | null => {
	const {rise, headLand} = INTRO;
	if (t < rise || t > headLand + 0.06) return null;
	const u = clamp01((t - rise) / (headLand - rise));
	return {x: HEAD.x, y: lerp(SEED.y, HEAD.y, 1 - (1 - u) ** 2)};
};

/** Velocity-aligned stretch plus impact squash -> ellipse radii + rotation. */
export const deform = (
	pos: (t: number) => P | null,
	t: number,
	impacts: number[],
	impactAmount: number,
	r: number,
) => {
	const p = pos(t);
	const q = pos(t - 1 / 240);
	let angle = 0;
	let stretch = 1;
	if (p && q) {
		const vx = (p.x - q.x) * 240;
		const vy = (p.y - q.y) * 240;
		const speed = Math.hypot(vx, vy);
		stretch = 1 + Math.min(0.55, speed / 2600);
		angle = (Math.atan2(vy, vx) * 180) / Math.PI;
	}
	const sq = impacts.reduce((acc, t0) => acc + squashAfter(t, t0, impactAmount), 0);
	if (Math.abs(sq) > 0.01 && stretch < 1.08) {
		return {rx: r * (1 + sq), ry: r * (1 - sq * 0.9), angle: 0};
	}
	return {rx: r * stretch, ry: r / Math.sqrt(stretch), angle};
};
