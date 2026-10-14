import React from 'react';
import {random} from 'remotion';
import {clamp01, easeOut, prog} from '../anim';

/** Warm ivory paper-light background with a soft vignette. */
export const Background: React.FC = () => (
	<>
		<div
			style={{
				position: 'absolute',
				inset: 0,
				background: 'radial-gradient(ellipse 75% 70% at 50% 46%, #FFFDF7 0%, #FBF4E3 48%, #EADBB8 100%)',
			}}
		/>
		<div
			style={{
				position: 'absolute',
				inset: 0,
				background: 'radial-gradient(ellipse 90% 85% at 50% 50%, rgba(0,0,0,0) 60%, rgba(90,60,10,0.16) 100%)',
			}}
		/>
	</>
);

/** Slow drifting gold dust. Deterministic, so every render is identical. */
export const GoldDust: React.FC<{t: number; width: number; height: number; count?: number; appear: number}> = ({
	t,
	width,
	height,
	count = 70,
	appear,
}) => {
	const fade = prog(t, appear, 1.5);
	return (
		<>
			{Array.from({length: count}, (_, i) => {
				const x0 = random(`x${i}`) * width;
				const y0 = random(`y${i}`) * height;
				const speed = 8 + random(`s${i}`) * 26;
				const size = 1.4 + random(`r${i}`) ** 2 * 4.2;
				const sway = Math.sin(t * (0.6 + random(`w${i}`)) + i) * 12;
				const twinkle = 0.45 + 0.55 * Math.sin(t * (1.5 + random(`f${i}`) * 3) + i * 1.7) ** 2;
				const y = (((y0 - t * speed) % height) + height) % height;
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: x0 + sway,
							top: y,
							width: size,
							height: size,
							borderRadius: '50%',
							background: 'radial-gradient(circle, #FFF3C4 0%, #E2A928 55%, rgba(226,169,40,0) 100%)',
							boxShadow: `0 0 ${size * 2.5}px rgba(232,180,60,0.7)`,
							opacity: fade * twinkle * (0.35 + random(`o${i}`) * 0.5),
						}}
					/>
				);
			})}
		</>
	);
};

/** Soft golden sun halo behind the figure's head, pulsing on the hit. */
export const Halo: React.FC<{t: number; x: number; y: number; start: number; hit: number; size: number}> = ({
	t,
	x,
	y,
	start,
	hit,
	size,
}) => {
	const on = prog(t, start, 1.2);
	const pulse = t > hit ? Math.exp(-(t - hit) * 2.2) : 0;
	const s = size * (0.6 + 0.4 * on + 0.25 * pulse);
	return (
		<div
			style={{
				position: 'absolute',
				left: x - s / 2,
				top: y - s / 2,
				width: s,
				height: s,
				borderRadius: '50%',
				background:
					'radial-gradient(circle, rgba(255,226,140,0.85) 0%, rgba(250,205,100,0.35) 30%, rgba(250,205,100,0) 70%)',
				opacity: on * (0.55 + 0.45 * pulse),
			}}
		/>
	);
};

/** Faint rotating sunburst behind the emblem. */
export const Sunburst: React.FC<{t: number; x: number; y: number; start: number; size: number}> = ({
	t,
	x,
	y,
	start,
	size,
}) => {
	const on = prog(t, start, 1.6);
	const mask = 'radial-gradient(circle, rgba(0,0,0,1) 10%, rgba(0,0,0,0) 68%)';
	return (
		<div
			style={{
				position: 'absolute',
				left: x - size / 2,
				top: y - size / 2,
				width: size,
				height: size,
				borderRadius: '50%',
				transform: `rotate(${t * 4}deg) scale(${0.7 + 0.3 * on})`,
				background:
					'repeating-conic-gradient(from 0deg, rgba(232,176,48,0.22) 0deg 3deg, rgba(232,176,48,0) 3deg 15deg)',
				maskImage: mask,
				WebkitMaskImage: mask,
				opacity: on * 0.55,
			}}
		/>
	);
};

/** Anamorphic glint: warm bloom with a long horizontal and a shorter vertical streak. */
export const Flare: React.FC<{t: number; x: number; y: number; start: number; size?: number; life?: number}> = ({
	t,
	x,
	y,
	start,
	size = 140,
	life = 0.8,
}) => {
	const p = (t - start) / life;
	if (p <= 0 || p >= 1) return null;
	const grow = easeOut(clamp01(p / 0.25));
	const fade = 1 - clamp01((p - 0.25) / 0.75) ** 1.4;
	const s = size * (0.3 + 0.7 * grow);
	const streak = (w: number, rot: number): React.CSSProperties => ({
		position: 'absolute',
		left: x - w / 2,
		top: y - 1.5,
		width: w,
		height: 3,
		borderRadius: 3,
		transform: `rotate(${rot}deg)`,
		background: 'linear-gradient(90deg, rgba(255,214,110,0) 0%, rgba(255,232,170,0.9) 40%, #FFFFFF 50%, rgba(255,232,170,0.9) 60%, rgba(255,214,110,0) 100%)',
		boxShadow: '0 0 8px rgba(240,180,50,0.6)',
	});
	return (
		<div style={{position: 'absolute', inset: 0, opacity: fade}}>
			<div
				style={{
					position: 'absolute',
					left: x - s / 2,
					top: y - s / 2,
					width: s,
					height: s,
					borderRadius: '50%',
					background:
						'radial-gradient(circle, #FFFFFF 0%, rgba(255,236,180,0.95) 12%, rgba(248,200,90,0.45) 32%, rgba(240,180,60,0) 66%)',
				}}
			/>
			<div style={streak(s * 2.4, p * 6)} />
			<div style={streak(s * 1.1, 90 + p * 6)} />
		</div>
	);
};
