import React from 'react';
import {Img, staticFile} from 'remotion';
import type {CSSProperties} from 'react';
import {clamp01, easeInOut, layer} from '../anim';
import {HEAD, SEED, essencePos, springAt, squashAfter} from '../kinetic';
import {FULL, INTRO, rayTime, type Variant} from '../timing';

const Layer: React.FC<{name: string; style?: CSSProperties}> = ({name, style}) => {
	const L = layer(name);
	return (
		<div style={{position: 'absolute', left: L.x, top: L.y, width: L.w, height: L.h, ...style}}>
			<Img src={staticFile(`layers/${name}.png`)} style={{width: '100%', height: '100%', display: 'block'}} />
		</div>
	);
};

const easeOutCubic = (u: number) => 1 - (1 - clamp01(u)) ** 3;

/** Hard-edged-ish directional reveal (used for fast "whip" draws). */
const reveal = (dir: 'to right' | 'to left' | 'to top', p: number, feather = 0.06): CSSProperties => {
	if (p >= 1) return {};
	const edge = p * (1 + feather) * 100;
	const g = `linear-gradient(${dir}, #000 ${edge - feather * 100}%, transparent ${edge}%)`;
	return {maskImage: g, WebkitMaskImage: g};
};

/** Herbs unfold like a lotus around the seed; afterwards they keep a slow, living sway. */
const Leaf: React.FC<{name: string; t: number; at: number}> = ({name, t, at}) => {
	const L = layer(name);
	const left = name.includes('left');
	const s = springAt(t, at, {damping: 13, stiffness: 180, mass: 0.7});
	if (s <= 0) return null;
	const sway = Math.sin((t - at) * 2.4 + (left ? 0 : Math.PI)) * 0.8 * Math.min(1, (t - at) / 0.8);
	return (
		<Layer
			name={name}
			style={{
				transformOrigin: `${SEED.x - L.x}px ${SEED.y + 5 - L.y}px`,
				transform: `rotate(${(1 - s) * (left ? 70 : -70) + sway}deg) scale(${s})`,
			}}
		/>
	);
};

/** Sunrise: rays burst from the top ray outward in symmetric pairs. */
const Ray: React.FC<{index: number; t: number}> = ({index, t}) => {
	const name = `ray-${String(index).padStart(2, '0')}`;
	const L = layer(name);
	const s = springAt(t, rayTime(index), {damping: 9, stiffness: 210, mass: 0.6});
	if (s <= 0) return null;
	const ox = Math.min(Math.max(HEAD.x, L.x), L.x + L.w) - L.x;
	const oy = Math.min(Math.max(HEAD.y, L.y), L.y + L.h) - L.y;
	return <Layer name={name} style={{transformOrigin: `${ox}px ${oy}px`, transform: `scale(${s})`}} />;
};

/** OJAS (gold = light): each letter is struck by light - white-hot flash cooling to gold. */
const LightLetter: React.FC<{name: string; t: number; at: number}> = ({name, t, at}) => {
	if (t < at) return null;
	const s = springAt(t, at, {damping: 12, stiffness: 260, mass: 0.5});
	const heat = Math.exp(-(t - at) * 7);
	return (
		<Layer
			name={`letter-${name}`}
			style={{
				transform: `scale(${1.3 - 0.3 * s})`,
				opacity: clamp01((t - at) / 0.05),
				filter: heat > 0.02 ? `brightness(${1 + 1.6 * heat})` : undefined,
			}}
		/>
	);
};

/** KALPA (green = herbs): each letter sprouts from the ground and settles with a little sway. */
const SproutLetter: React.FC<{name: string; i: number; t: number; at: number}> = ({name, i, t, at}) => {
	const L = layer(`letter-${name}`);
	const s = springAt(t, at, {damping: 9, stiffness: 240, mass: 0.6});
	if (s <= 0) return null;
	return (
		<Layer
			name={`letter-${name}`}
			style={{
				transformOrigin: `${L.w / 2}px ${BASELINE - L.y}px`,
				transform: `rotate(${(1 - s) * (i % 2 ? 8 : -8)}deg) scale(${0.75 + 0.25 * s}, ${s})`,
			}}
		/>
	);
};

const BASELINE = 497;
const OJAS = ['O', 'J', 'A1', 'S'];
const KALPA = ['K', 'A2', 'L', 'P', 'A3'];

export const Logo: React.FC<{t: number; variant: Variant}> = ({t, variant}) => {
	const {burst, headLand, leaves, sunrise} = INTRO;

	// the figure grows upward behind the rising essence
	const body = layer('figure-body');
	const dropY = essencePos(t)?.y ?? (t > headLand ? HEAD.y - 40 : body.y + body.h + 10);
	const grow = t < INTRO.rise ? 0 : clamp01((body.y + body.h - dropY + 12) / body.h);
	// rasa: the nourishing flow spreads out from the seed
	const flow = easeOutCubic((t - burst) / 0.55);
	// the head lands, breathes in, and ignites into the sun
	const land = squashAfter(t, headLand, 0.3);
	const inhale = t < sunrise ? 0.14 * clamp01((t - (sunrise - 0.2)) / 0.2) ** 2 : 0;
	const ignite = t >= sunrise ? 0.14 * Math.exp(-(t - sunrise) * 10) * Math.cos((t - sunrise) * 28) : 0;
	const hs = 1 + inhale + ignite;

	return (
		<>
			{flow > 0 ? (
				<>
					<Layer name="swirl-left" style={reveal('to left', flow, 0.15)} />
					<Layer name="swirl-right" style={reveal('to right', flow, 0.15)} />
				</>
			) : null}
			<Leaf name="leaf-left-outer" t={t} at={leaves[2]} />
			<Leaf name="leaf-right-outer" t={t} at={leaves[2]} />
			<Leaf name="leaf-left-upper" t={t} at={leaves[1]} />
			<Leaf name="leaf-right-upper" t={t} at={leaves[1]} />
			<Leaf name="leaf-left-lower" t={t} at={leaves[0]} />
			<Leaf name="leaf-right-lower" t={t} at={leaves[0]} />
			{grow > 0 ? <Layer name="figure-body" style={reveal('to top', grow, 0.05)} /> : null}
			{t >= headLand ? (
				<Layer
					name="figure-head"
					style={{
						transformOrigin: '50% 50%',
						transform: `scale(${hs * (1 + land)}, ${hs * (1 - land)})`,
						filter: t >= sunrise && t < sunrise + 0.5 ? `brightness(${1 + 0.8 * Math.exp(-(t - sunrise) * 8)})` : undefined,
					}}
				/>
			) : null}
			{Array.from({length: 11}, (_, i) => (
				<Ray key={i} index={i} t={t} />
			))}
			{variant === 'full' ? <Lockup t={t} /> : null}
		</>
	);
};

const Lockup: React.FC<{t: number}> = ({t}) => {
	const hit = FULL.hit;
	const [tw1, tw2] = FULL.taglineWords;
	const w1 = easeOutCubic((t - tw1) / 0.32);
	const w2 = easeOutCubic((t - tw2) / 0.42);
	const sprig = easeOutCubic((t - FULL.sprigs) / 0.45);
	const flow = easeOutCubic((t - (hit - 0.25)) / 0.6);
	const bud = springAt(t, hit, {damping: 8, stiffness: 220, mass: 0.6});
	const bL = layer('flourish-bud');
	return (
		<>
			{OJAS.map((n, i) => (
				<LightLetter key={n} name={n} t={t} at={FULL.ojasLetters[i]} />
			))}
			{KALPA.map((n, i) => (
				<SproutLetter key={n} name={n} i={i} t={t} at={FULL.kalpaLetters[i]} />
			))}
			{w1 > 0 ? (
				<Layer name="tagline-word1" style={{...reveal('to right', w1, 0.2), transform: `translateY(${(1 - w1) * 8}px)`}} />
			) : null}
			{w2 > 0 ? (
				<Layer name="tagline-word2" style={{...reveal('to right', w2, 0.2), transform: `translateY(${(1 - w2) * 8}px)`}} />
			) : null}
			{sprig > 0 ? (
				<>
					<Layer name="ornament-left" style={reveal('to left', sprig, 0.12)} />
					<Layer name="ornament-right" style={reveal('to right', sprig, 0.12)} />
				</>
			) : null}
			{flow > 0 ? (
				<>
					<Layer name="flourish-left" style={reveal('to left', flow, 0.15)} />
					<Layer name="flourish-right" style={reveal('to right', flow, 0.15)} />
				</>
			) : null}
			{bud > 0 ? (
				<Layer
					name="flourish-bud"
					style={{transformOrigin: `${bL.w / 2}px ${bL.h - 8}px`, transform: `scale(${bud})`}}
				/>
			) : null}
		</>
	);
};

/** A diagonal specular light sweep, masked to the logo artwork. */
export const Shine: React.FC<{t: number; start: number; dur: number; master: string; strength?: number}> = ({
	t,
	start,
	dur,
	master,
	strength = 0.9,
}) => {
	const p = clamp01((t - start) / dur);
	if (p <= 0 || p >= 1) return null;
	const M = layer(master);
	const c = -25 + easeInOut(p) * 150;
	const src = `url(${staticFile(`layers/${master}.png`)})`;
	return (
		<div
			style={{
				position: 'absolute',
				left: M.x,
				top: M.y,
				width: M.w,
				height: M.h,
				maskImage: src,
				WebkitMaskImage: src,
				maskSize: '100% 100%',
				WebkitMaskSize: '100% 100%',
				mixBlendMode: 'screen',
				background: `linear-gradient(105deg, rgba(255,250,230,0) ${c - 14}%, rgba(255,248,220,${strength}) ${c}%, rgba(255,250,230,0) ${c + 14}%)`,
			}}
		/>
	);
};
