import React from 'react';
import {AbsoluteFill, Html5Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {LOGO, clamp01, easeInOut, layer} from './anim';
import {Background, Flare, GoldDust, Halo, Sunburst} from './components/Atmosphere';
import {Essence} from './components/Essence';
import {Logo, Shine} from './components/Logo';
import {BUD, HEAD, SEED} from './kinetic';
import {ENDING, FPS, FULL, INTRO, type Variant} from './timing';

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
	const glide = easeInOut(clamp01((t - INTRO.sunrise - 0.1) / 0.45));
	const settle = 0.03 * easeInOut(clamp01((t - E.hit) / (E.duration - E.hit)));
	const cam =
		1 + bump(t, INTRO.burst, 0.01) + bump(t, INTRO.sunrise, 0.014) + (full ? bump(t, E.hit, 0.018) : 0) + settle;
	const s = (A.s + (B.s - A.s) * glide) * cam;
	const cx = A.x + (B.x - A.x) * glide;
	const cy = A.y + (B.y - A.y) * glide;
	const tx = width / 2 - cx * s;
	const ty = height / 2 - cy * s;

	const toScreen = (p: {x: number; y: number}) => ({x: tx + p.x * s, y: ty + p.y * s});
	const head = toScreen(HEAD);
	const seed = toScreen(SEED);
	const bud = toScreen(BUD);

	return (
		<AbsoluteFill>
			{transparent ? null : <Background />}
			<AbsoluteFill style={{opacity: 1 - out}}>
				{transparent ? null : <Sunburst t={t} x={head.x} y={head.y} start={INTRO.sunrise} size={900 * s} />}
				<Halo t={t} x={head.x} y={head.y} start={INTRO.sunrise - 0.1} hit={E.hit} size={460 * s} />
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
					<Essence t={t} />
					<Shine t={t} start={E.hit + (full ? 0.05 : 0.3)} dur={0.9} master={full ? 'master-full' : 'master-emblem'} />
				</div>
				<Flare t={t} x={seed.x} y={seed.y} start={INTRO.burst} size={240 * s} life={0.7} />
				<Flare t={t} x={head.x} y={head.y} start={INTRO.headLand} size={150 * s} life={0.5} />
				<Flare t={t} x={head.x} y={head.y} start={INTRO.sunrise} size={340 * s} life={0.9} />
				{full
					? FULL.ojasLetters.map((at, i) => {
							const L = layer(`letter-${['O', 'J', 'A1', 'S'][i]}`);
							const g = toScreen({x: L.x + L.w * 0.7, y: L.y + 12});
							return <Flare key={at} t={t} x={g.x} y={g.y} start={at} size={110 * s} life={0.45} />;
						})
					: null}
				{full ? <Flare t={t} x={bud.x} y={bud.y} start={E.hit} size={260 * s} life={0.9} /> : null}
			</AbsoluteFill>
			{transparent ? null : <AbsoluteFill style={{background: '#FFFDF7', opacity: out * 0.85}} />}
			<Html5Audio src={staticFile(`audio/${variant}.wav`)} />
		</AbsoluteFill>
	);
};
