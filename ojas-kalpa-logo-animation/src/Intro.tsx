import React from 'react';
import {AbsoluteFill, Html5Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {LOGO, clamp01, easeInOut, layer} from './anim';
import {Background, Flare, GoldDust, Halo, Sunburst} from './components/Atmosphere';
import {Logo, Shine} from './components/Logo';
import {FPS, TIMING} from './timing';

export type IntroProps = {
	variant: 'full' | 'monogram';
	/** Drop the background (for alpha-channel renders to lay over footage). */
	transparent: boolean;
	/** Fraction of the frame width (or height, whichever binds first) the artwork fills. */
	fill: number;
};

export const Intro: React.FC<IntroProps> = ({variant, transparent, fill}) => {
	const frame = useCurrentFrame();
	const {width, height} = useVideoConfig();
	const t = frame / FPS;
	const T = TIMING[variant];
	const full = variant === 'full';

	// the logo dissolves into warm light at the end (no muddy fade-to-black over ivory)
	const out = easeInOut(clamp01((t - T.fadeOut) / (T.duration - T.fadeOut)));

	// fit the artwork's bounding box into the frame
	const M = layer(full ? 'master-full' : 'master-emblem');
	const scale = Math.min((width * fill) / M.w, (height * fill) / M.h);
	// slow push-in across the whole intro plus a tiny kick on the hit
	const kick = t > T.hit ? 0.012 * Math.exp(-(t - T.hit) * 5) * Math.sin((t - T.hit) * 18) : 0;
	const cam = 1 + 0.04 * (t / T.duration) + kick + 0.03 * out;
	const s = scale * cam;
	const tx = width / 2 - (M.x + M.w / 2) * s;
	const ty = height / 2 - (M.y + M.h / 2) * s;

	const H = LOGO.head;

	const toScreen = (x: number, y: number) => ({x: tx + x * s, y: ty + y * s});
	const head = toScreen(H.x, H.y);
	const seed = toScreen(LOGO.emblemBase.x, LOGO.emblemBase.y);
	const bud = toScreen(1093, 640);

	return (
		<AbsoluteFill>
			{transparent ? null : <Background />}
			<AbsoluteFill style={{opacity: 1 - out, filter: out > 0 ? `blur(${out * 10}px)` : undefined}}>
				{transparent ? null : <Sunburst t={t} x={head.x} y={head.y} start={T.rays} size={900 * s} />}
				<Halo t={t} x={head.x} y={head.y} start={T.head} hit={T.hit} size={460 * s} />
				{transparent ? null : <GoldDust t={t} width={width} height={height} appear={T.seed} />}
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
					<Logo t={t} T={T} fps={FPS} frame={frame} variant={variant} />
					<Shine t={t} start={T.hit} dur={1.1} master={full ? 'master-full' : 'master-emblem'} />
					{full ? <Shine t={t} start={(T.letters ?? 0) + 0.9} dur={0.9} master="master-full" strength={0.5} /> : null}
				</div>
				<Flare t={t} x={seed.x} y={seed.y} start={T.seed} size={220 * s} life={1.0} />
				<Flare t={t} x={head.x} y={head.y} start={T.head} size={200 * s} />
				<Flare t={t} x={seed.x} y={seed.y} start={T.hit} size={260 * s} life={1.1} />
				{full ? <Flare t={t} x={bud.x} y={bud.y} start={T.hit} size={200 * s} life={1.0} /> : null}
				{full ? null : <Flare t={t} x={head.x} y={head.y - 150 * s} start={T.hit + 0.12} size={180 * s} />}
			</AbsoluteFill>
			{transparent ? null : <AbsoluteFill style={{background: '#FFFDF7', opacity: out * 0.85}} />}
			<Html5Audio src={staticFile(`audio/${variant}.wav`)} />
		</AbsoluteFill>
	);
};
