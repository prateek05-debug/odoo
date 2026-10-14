import React from 'react';
import {AbsoluteFill, Html5Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {LOGO, clamp01, easeInOut, layer} from './anim';
import {Background, Flare, GoldDust, Halo, Sunburst} from './components/Atmosphere';
import {Dots} from './components/Dots';
import {Logo, Shine} from './components/Logo';
import {BASE, BUD, HEAD} from './kinetic';
import {ENDING, FPS, INTRO, type Variant} from './timing';

export type IntroProps = {
	variant: Variant;
	/** Drop the background (for alpha-channel renders to lay over footage). */
	transparent: boolean;
	/** Fraction of the frame width (or height, whichever binds first) the artwork fills. */
	fill: number;
};

/** Small damped camera bump on every big impact, so the frame "feels" the beat. */
const bump = (t: number, at: number, amt: number) => {
	const dt = t - at;
	return dt < 0 || dt > 0.5 ? 0 : amt * Math.exp(-dt * 9) * Math.sin(dt * 34);
};

export const Intro: React.FC<IntroProps> = ({variant, transparent, fill}) => {
	const frame = useCurrentFrame();
	const {width, height} = useVideoConfig();
	const t = frame / FPS;
	const E = ENDING[variant];
	const full = variant === 'full';

	const out = easeInOut(clamp01((t - E.fadeOut) / (E.duration - E.fadeOut)));

	// Camera: the opening plays big on the emblem, then glides out to the final framing.
	const fit = (name: string, f: number) => {
		const M = layer(name);
		return {s: Math.min((width * f) / M.w, (height * f) / M.h), x: M.x + M.w / 2, y: M.y + M.h / 2};
	};
	const A = full ? fit('master-emblem', 0.66) : fit('master-emblem', fill * 1.22);
	const B = fit(full ? 'master-full' : 'master-emblem', fill);
	const glide = easeInOut(clamp01((t - INTRO.headLand - 0.05) / 0.5));
	const settle = 0.03 * easeInOut(clamp01((t - E.hit) / (E.duration - E.hit)));
	const cam =
		1 + bump(t, INTRO.baseLand, 0.012) + bump(t, INTRO.headLand, 0.008) + bump(t, E.hit, 0.018) + settle;
	const s = (A.s + (B.s - A.s) * glide) * cam;
	const cx = A.x + (B.x - A.x) * glide;
	const cy = A.y + (B.y - A.y) * glide;
	const tx = width / 2 - cx * s;
	const ty = height / 2 - cy * s;

	const toScreen = (p: {x: number; y: number}) => ({x: tx + p.x * s, y: ty + p.y * s});
	const head = toScreen(HEAD);
	const base = toScreen(BASE);
	const bud = toScreen(BUD);

	return (
		<AbsoluteFill>
			{transparent ? null : <Background />}
			<AbsoluteFill style={{opacity: 1 - out}}>
				{transparent ? null : <Sunburst t={t} x={head.x} y={head.y} start={INTRO.rayStart} size={900 * s} />}
				<Halo t={t} x={head.x} y={head.y} start={INTRO.headLand} hit={E.hit} size={460 * s} />
				{transparent ? null : <GoldDust t={t} width={width} height={height} appear={0} />}
				<div
					style={{
						position: 'absolute',
						left: 0,
						top: 0,
						width: LOGO.width,
						height: LOGO.height,
						transformOrigin: '0 0',
						transform: `translate(${tx}px, ${ty}px) scale(${s})`,
					}}
				>
					<Logo t={t} variant={variant} />
					<Dots t={t} variant={variant} />
					<Shine t={t} start={E.hit + 0.05} dur={0.9} master={full ? 'master-full' : 'master-emblem'} />
				</div>
				<Flare t={t} x={head.x} y={head.y} start={INTRO.merge} size={260 * s} life={0.7} />
				<Flare t={t} x={base.x} y={base.y} start={INTRO.baseLand} size={200 * s} life={0.6} />
				<Flare t={t} x={head.x} y={head.y} start={INTRO.headLand} size={180 * s} life={0.6} />
				{full ? (
					<Flare t={t} x={bud.x} y={bud.y} start={E.hit} size={260 * s} life={0.9} />
				) : (
					<Flare t={t} x={head.x} y={head.y - 160 * s} start={E.hit} size={260 * s} life={0.9} />
				)}
			</AbsoluteFill>
			{transparent ? null : <AbsoluteFill style={{background: '#FFFDF7', opacity: out * 0.85}} />}
			<Html5Audio src={staticFile(`audio/${variant}.wav`)} />
		</AbsoluteFill>
	);
};
