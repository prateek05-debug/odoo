/**
 * Kinetic choreography as pure functions of time (seconds), in logo-space pixels.
 * Everything here is deterministic, so any frame can be rendered on its own.
 */
import {spring} from 'remotion';
import {LOGO, layer} from './anim';
import {FPS, FULL, INTRO} from './timing';

export type P = {x: number; y: number};

export const HEAD: P = LOGO.head;
export const BASE: P = {x: LOGO.head.x, y: 585};
export const DOT_R = 34; // dosha dots (they shrink to OJAS_R-ish as they merge)
export const OJAS_R = 28; // merged drop == size of the figure's head
export const SPARK_R = 18; // the spark that plants the letters
const ORBIT_R = 150;

/** The three doshas start on the points of a triangle around the head. */
export const DOSHAS = [
	{name: 'vata', base: '#C2681F', light: '#F8C88A', dark: '#6E3208', angle: -90},
	{name: 'pitta', base: '#D99A16', light: '#FFF0B0', dark: '#7A4A06', angle: 150},
	{name: 'kapha', base: '#3E7D1E', light: '#C2E58A', dark: '#163D08', angle: 30},
] as const;
export const OJAS_COLORS = {base: '#E2A51E', light: '#FFF7D6', dark: '#7A4A06'};

const rad = (d: number) => (d * Math.PI) / 180;
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** Ballistic hop: x linear in time, y a parabola with apex `h` above the straight line. */
const hop = (a: P, b: P, u: number, h: number): P => ({
	x: lerp(a.x, b.x, u),
	y: lerp(a.y, b.y, u) - h * 4 * u * (1 - u),
});

/** Spring-damped squash after an impact at `t0`: >0 = flattened. */
export const squashAfter = (t: number, t0: number, amount: number) => {
	const dt = t - t0;
	if (dt < 0 || dt > 0.6) return 0;
	return amount * Math.exp(-dt * 11) * Math.cos(dt * 30);
};

/** Remotion spring evaluated at time t (seconds) for an event at t0. */
export const springAt = (t: number, t0: number, cfg: {damping: number; stiffness: number; mass?: number}) =>
	t < t0 ? 0 : spring({frame: (t - t0) * FPS, fps: FPS, config: {mass: 1, ...cfg}});

// ------------------------------------------------------------------ doshas
const vertex = (i: number): P => ({
	x: HEAD.x + ORBIT_R * Math.cos(rad(DOSHAS[i].angle)),
	y: HEAD.y + ORBIT_R * Math.sin(rad(DOSHAS[i].angle)),
});

/** Position of dosha i, or null when it is not on screen. */
export const doshaPos = (i: number, t: number): P | null => {
	const hops = INTRO.doshaHops[i];
	const v = vertex(i);
	const fall = 0.42;
	if (t < hops[0] - fall) return null;
	if (t < hops[0]) {
		const u = (t - (hops[0] - fall)) / fall;
		return {x: v.x, y: v.y - 760 * (1 - u * u)};
	}
	for (let k = 0; k < hops.length - 1; k++) {
		if (t < hops[k + 1]) {
			const u = (t - hops[k]) / (hops[k + 1] - hops[k]);
			return hop(v, v, u, 110 * 0.5 ** k);
		}
	}
	const o0 = hops[hops.length - 1];
	if (t < o0) return v;
	if (t >= INTRO.orbitEnd) return null;
	// orbit: start from rest, accelerate, spiral into the centre = balance
	const u = (t - o0) / (INTRO.orbitEnd - o0);
	const phi = INTRO.orbitTurns * 2 * Math.PI * u * u;
	const r = ORBIT_R * (1 - u ** 2.4);
	const a = rad(DOSHAS[i].angle) + phi;
	return {x: HEAD.x + r * Math.cos(a), y: HEAD.y + r * Math.sin(a)};
};

/** Dosha radius: full size while bouncing, shrinking as the spiral closes. */
export const doshaR = (i: number, t: number) => {
	const o0 = INTRO.doshaHops[i][INTRO.doshaHops[i].length - 1];
	const u = clamp01((t - o0) / (INTRO.orbitEnd - o0));
	return DOT_R + (20 - DOT_R) * u * u;
};

/** Every moment a dosha touches down (for squash). */
export const doshaImpacts = (i: number) => INTRO.doshaHops[i];

// ------------------------------------------------------------------ ojas drop
export const ojasPos = (t: number): P | null => {
	const {merge, fallStart, baseLand, headLand} = INTRO;
	if (t < merge || t > headLand + 0.06) return null;
	if (t < fallStart) return HEAD;
	if (t < baseLand) {
		const u = (t - fallStart) / (baseLand - fallStart);
		return {x: HEAD.x, y: lerp(HEAD.y, BASE.y, u * u)}; // gravity
	}
	const u = clamp01((t - baseLand) / (headLand - baseLand));
	return {x: HEAD.x, y: lerp(BASE.y, HEAD.y, 1 - (1 - u) ** 2)}; // thrown up, apex at the head
};

// ------------------------------------------------------------------ spark across the wordmark
export const LETTERS = ['O', 'J', 'A1', 'S', 'K', 'A2', 'L', 'P', 'A3'];
export const BASELINE = 497;
export const BUD: P = {x: 1092, y: 646};

const letterSpot = (i: number): P => {
	const L = layer(`letter-${LETTERS[i]}`);
	return {x: L.x + L.w / 2, y: BASELINE - SPARK_R};
};

type Seg = {t0: number; t1: number; a: P; b: P; h: number};
const sparkSegments = (): Seg[] => {
	const lands = FULL.letterLands;
	const segs: Seg[] = [{t0: FULL.emit, t1: lands[0], a: HEAD, b: letterSpot(0), h: 150}];
	for (let i = 1; i < lands.length; i++) {
		segs.push({t0: lands[i - 1], t1: lands[i], a: letterSpot(i - 1), b: letterSpot(i), h: i === 4 ? 205 : 170});
	}
	segs.push({t0: lands[lands.length - 1], t1: FULL.hit, a: letterSpot(lands.length - 1), b: BUD, h: 230});
	return segs;
};
const SEGS = sparkSegments();

export const sparkPos = (t: number): P | null => {
	if (t < FULL.emit || t > FULL.hit + 0.05) return null;
	const s = SEGS.find((g) => t <= g.t1) ?? SEGS[SEGS.length - 1];
	return hop(s.a, s.b, clamp01((t - s.t0) / (s.t1 - s.t0)), s.h);
};

// ------------------------------------------------------------------ squash & stretch
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
		// flatten against the floor
		return {rx: r * (1 + sq), ry: r * (1 - sq * 0.9), angle: 0};
	}
	return {rx: r * stretch, ry: r / Math.sqrt(stretch), angle};
};
