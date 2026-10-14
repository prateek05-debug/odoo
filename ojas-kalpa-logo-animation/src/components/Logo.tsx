import React from 'react';
import {Img, staticFile} from 'remotion';
import type {CSSProperties} from 'react';
import {clamp01, easeInOut, layer} from '../anim';
import {BASE, BASELINE, HEAD, LETTERS, ojasPos, springAt, squashAfter} from '../kinetic';
import {FULL, INTRO, type Variant} from '../timing';

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

/** Leaves burst open around the base when the ojas drop lands. */
const Leaf: React.FC<{name: string; t: number; at: number}> = ({name, t, at}) => {
	const L = layer(name);
	const left = name.includes('left');
	const s = springAt(t, at, {damping: 13, stiffness: 180, mass: 0.7});
	if (s <= 0) return null;
	return (
		<Layer
			name={name}
			style={{
				transformOrigin: `${BASE.x - L.x}px ${BASE.y + 10 - L.y}px`,
				transform: `rotate(${(1 - s) * (left ? 70 : -70)}deg) scale(${s})`,
			}}
		/>
	);
};

/** Sun rays pop out one after another, left to right, each on its own glockenspiel note. */
const Ray: React.FC<{index: number; t: number}> = ({index, t}) => {
	const name = `ray-${String(index).padStart(2, '0')}`;
	const L = layer(name);
	const at = INTRO.rayStart + index * INTRO.rayStep;
	const s = springAt(t, at, {damping: 9, stiffness: 210, mass: 0.6});
	if (s <= 0) return null;
	const ox = Math.min(Math.max(HEAD.x, L.x), L.x + L.w) - L.x;
	const oy = Math.min(Math.max(HEAD.y, L.y), L.y + L.h) - L.y;
	return <Layer name={name} style={{transformOrigin: `${ox}px ${oy}px`, transform: `scale(${s})`}} />;
};

/** A letter sprouts from the baseline the moment the spark touches down. */
const Letter: React.FC<{name: string; t: number; at: number}> = ({name, t, at}) => {
	const L = layer(`letter-${name}`);
	const s = springAt(t, at, {damping: 9, stiffness: 240, mass: 0.6});
	if (s <= 0) return null;
	return (
		<Layer
			name={`letter-${name}`}
			style={{
				transformOrigin: `${L.w / 2}px ${BASELINE - L.y}px`,
				transform: `scale(${0.75 + 0.25 * s}, ${s})`,
			}}
		/>
	);
};

export const Logo: React.FC<{t: number; variant: Variant}> = ({t, variant}) => {
	const {baseLand, headLand, leaves} = INTRO;

	// figure grows upward behind the rising drop
	const body = layer('figure-body');
	const dropY = ojasPos(t)?.y ?? (t > headLand ? HEAD.y - 40 : body.y + body.h + 10);
	const grow = t < baseLand ? 0 : clamp01((body.y + body.h - dropY + 12) / body.h);
	const swirl = easeOutCubic((t - baseLand) / 0.4);
	const headSq = squashAfter(t, headLand, 0.35);

	return (
		<>
			{swirl > 0 ? (
				<>
					<Layer name="swirl-left" style={reveal('to left', swirl, 0.15)} />
					<Layer name="swirl-right" style={reveal('to right', swirl, 0.15)} />
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
						transformOrigin: '50% 100%',
						transform: `scale(${1 + headSq}, ${1 - headSq})`,
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
	const bud = springAt(t, hit, {damping: 8, stiffness: 220, mass: 0.6});
	const whip = easeOutCubic((t - hit) / 0.38);
	const orn = easeOutCubic((t - hit - 0.1) / 0.4);
	const bL = layer('flourish-bud');
	const word = (at: number) => springAt(t, at, {damping: 10, stiffness: 200, mass: 0.6});
	const w1 = word(hit + 0.05);
	const w2 = word(hit + 0.1);
	return (
		<>
			{LETTERS.map((n, i) => (
				<Letter key={n} name={n} t={t} at={FULL.letterLands[i]} />
			))}
			{whip > 0 ? (
				<>
					<Layer name="flourish-left" style={reveal('to left', whip, 0.12)} />
					<Layer name="flourish-right" style={reveal('to right', whip, 0.12)} />
					<Layer name="ornament-left" style={reveal('to left', orn, 0.12)} />
					<Layer name="ornament-right" style={reveal('to right', orn, 0.12)} />
				</>
			) : null}
			{w1 > 0 ? (
				<Layer
					name="tagline-word1"
					style={{transformOrigin: '50% 100%', transform: `scale(${0.6 + 0.4 * w1}, ${w1})`}}
				/>
			) : null}
			{w2 > 0 ? (
				<Layer
					name="tagline-word2"
					style={{transformOrigin: '50% 100%', transform: `scale(${0.6 + 0.4 * w2}, ${w2})`}}
				/>
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
