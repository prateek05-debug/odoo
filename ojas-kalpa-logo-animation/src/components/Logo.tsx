import React from 'react';
import {Img, spring, staticFile} from 'remotion';
import type {CSSProperties} from 'react';
import {LOGO, clamp01, easeInOut, layer, prog, wipe} from '../anim';
import type {Timing} from '../timing';

const Layer: React.FC<{name: string; style?: CSSProperties}> = ({name, style}) => {
	const L = layer(name);
	return (
		<div style={{position: 'absolute', left: L.x, top: L.y, width: L.w, height: L.h, ...style}}>
			<Img src={staticFile(`layers/${name}.png`)} style={{width: '100%', height: '100%', display: 'block'}} />
		</div>
	);
};

const BASE = LOGO.emblemBase;
const HEAD = LOGO.head;

/** Leaves unfold from the base of the emblem like a lotus opening. */
const Leaf: React.FC<{name: string; t: number; start: number}> = ({name, t, start}) => {
	const L = layer(name);
	const left = name.includes('left');
	const p = prog(t, start, 1.0);
	return (
		<Layer
			name={name}
			style={{
				transformOrigin: `${BASE.x - L.x}px ${BASE.y - 5 - L.y}px`,
				transform: `rotate(${(1 - p) * (left ? 42 : -42)}deg) scale(${0.3 + 0.7 * p})`,
				opacity: clamp01((t - start) / 0.3),
			}}
		/>
	);
};

/** Sun rays shoot outward from the figure's head, centre ray first. */
const Ray: React.FC<{index: number; t: number; T: Timing}> = ({index, t, T}) => {
	const name = `ray-${String(index).padStart(2, '0')}`;
	const L = layer(name);
	const start = T.rays + Math.abs(index - 5) * T.rayStep + 0.08;
	const p = prog(t, start, 0.6);
	// origin = point of the ray's box closest to the head, so it grows outward
	const ox = Math.min(Math.max(HEAD.x, L.x), L.x + L.w) - L.x;
	const oy = Math.min(Math.max(HEAD.y, L.y), L.y + L.h) - L.y;
	const cx = L.x + L.w / 2 - HEAD.x;
	const cy = L.y + L.h / 2 - HEAD.y;
	const len = Math.hypot(cx, cy);
	const push = (1 - p) * -40;
	return (
		<Layer
			name={name}
			style={{
				transformOrigin: `${ox}px ${oy}px`,
				transform: `translate(${(cx / len) * push}px, ${(cy / len) * push}px) scale(${p})`,
				opacity: clamp01((t - start) / 0.15),
			}}
		/>
	);
};

const LETTERS = ['O', 'J', 'A1', 'S', 'K', 'A2', 'L', 'P', 'A3'];
const WORD_CX = (596 + 1616) / 2;

/** Wordmark letters track in: they converge, rise and come into focus one by one. */
const Letter: React.FC<{name: string; i: number; t: number; T: Timing}> = ({name, i, t, T}) => {
	const L = layer(`letter-${name}`);
	const start = (T.letters ?? 0) + i * (T.letterStep ?? 0.07);
	const p = prog(t, start, 1.0);
	const dx = (L.x + L.w / 2 - WORD_CX) * 0.22 * (1 - p);
	return (
		<Layer
			name={`letter-${name}`}
			style={{
				transform: `translate(${dx}px, ${(1 - p) * 34}px)`,
				filter: p < 1 ? `blur(${(1 - p) * 14}px)` : undefined,
				opacity: clamp01((t - start) / 0.4),
			}}
		/>
	);
};

export const Logo: React.FC<{t: number; T: Timing; fps: number; frame: number; variant: 'full' | 'monogram'}> = ({
	t,
	T,
	fps,
	frame,
	variant,
}) => {
	const [l0, l1, l2] = T.leaves;
	const fig = prog(t, T.figure, 0.9);
	const headScale = spring({frame: frame - Math.round(T.head * fps), fps, config: {damping: 14, mass: 0.7}});
	const swirl = prog(t, T.swirls, 1.2, easeInOut);
	const full = variant === 'full';

	return (
		<>
			<div style={{position: 'absolute', inset: 0, ...wipe('to left', swirl)}}>
				<Layer name="swirl-left" />
			</div>
			<div style={{position: 'absolute', inset: 0, ...wipe('to right', swirl)}}>
				<Layer name="swirl-right" />
			</div>
			<Leaf name="leaf-left-outer" t={t} start={l2} />
			<Leaf name="leaf-right-outer" t={t} start={l2} />
			<Leaf name="leaf-left-upper" t={t} start={l1} />
			<Leaf name="leaf-right-upper" t={t} start={l1} />
			<Leaf name="leaf-left-lower" t={t} start={l0} />
			<Leaf name="leaf-right-lower" t={t} start={l0} />
			<Layer
				name="figure-body"
				style={{transform: `translateY(${(1 - fig) * 80}px)`, ...wipe('to top', fig, 0.25)}}
			/>
			<Layer
				name="figure-head"
				style={{transform: `scale(${headScale})`, opacity: clamp01(headScale * 3)}}
			/>
			{Array.from({length: 11}, (_, i) => (
				<Ray key={i} index={i} t={t} T={T} />
			))}
			{full ? <Lockup t={t} T={T} fps={fps} frame={frame} /> : null}
		</>
	);
};

const Lockup: React.FC<{t: number; T: Timing; fps: number; frame: number}> = ({t, T, fps, frame}) => {
	const tag = T.tagline ?? 0;
	const orn = prog(t, tag, 0.9, easeInOut);
	const w1 = prog(t, tag + 0.1, 0.7, easeInOut);
	const w2 = prog(t, tag + 0.35, 0.9, easeInOut);
	const fl = prog(t, T.flourish ?? 0, 1.0, easeInOut);
	const bud = spring({frame: frame - Math.round((T.hit - 0.1) * fps), fps, config: {damping: 13, mass: 0.6}});
	const bL = layer('flourish-bud');
	return (
		<>
			{LETTERS.map((n, i) => (
				<Letter key={n} name={n} i={i} t={t} T={T} />
			))}
			<Layer name="ornament-left" style={wipe('to left', orn)} />
			<Layer name="ornament-right" style={wipe('to right', orn)} />
			<Layer
				name="tagline-word1"
				style={{...wipe('to right', w1), transform: `translateY(${(1 - w1) * 10}px)`}}
			/>
			<Layer
				name="tagline-word2"
				style={{...wipe('to right', w2), transform: `translateY(${(1 - w2) * 10}px)`}}
			/>
			<Layer name="flourish-left" style={wipe('to left', fl)} />
			<Layer name="flourish-right" style={wipe('to right', fl)} />
			<Layer
				name="flourish-bud"
				style={{
					transformOrigin: `${bL.w / 2}px ${bL.h - 8}px`,
					transform: `scale(${bud})`,
					opacity: clamp01(bud * 3),
				}}
			/>
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
