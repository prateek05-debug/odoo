import React from 'react';
import {LOGO} from '../anim';
import {ESSENCE_COLORS, ESSENCE_R, type P, SEED, deform, essencePos} from '../kinetic';
import {INTRO} from '../timing';

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/**
 * The seed of light under the emblem (from the artwork's own base glow) and the golden
 * essence that rises out of it to become the figure's head.
 */
export const Essence: React.FC<{t: number}> = ({t}) => {
	const {seed, burst, headLand, rise} = INTRO;
	return (
		<svg
			width={LOGO.width}
			height={LOGO.height}
			viewBox={`0 0 ${LOGO.width} ${LOGO.height}`}
			style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}
		>
			<defs>
				<radialGradient id="g-essence" cx="0.36" cy="0.3" r="0.75">
					<stop offset="0" stopColor="#FFFFFF" />
					<stop offset="0.12" stopColor={ESSENCE_COLORS.light} />
					<stop offset="0.55" stopColor={ESSENCE_COLORS.base} />
					<stop offset="1" stopColor={ESSENCE_COLORS.dark} />
				</radialGradient>
				<radialGradient id="g-seed">
					<stop offset="0" stopColor="#FFFFFF" />
					<stop offset="0.25" stopColor="rgba(255,226,140,0.95)" />
					<stop offset="1" stopColor="rgba(255,200,90,0)" />
				</radialGradient>
			</defs>
			<Seed t={t} at={seed} burst={burst} rise={rise} />
			<Ripple t={t} at={burst} c={SEED} w={300} />
			<Drop t={t} headLand={headLand} rise={rise} />
		</svg>
	);
};

/** Seed of light: gathers, breathes in, bursts on the beat, then glows again as the essence leaves. */
const Seed: React.FC<{t: number; at: number; burst: number; rise: number}> = ({t, at, burst, rise}) => {
	if (t < at) return null;
	const gather = 1 - (1 - clamp01((t - at) / (burst - 0.12 - at))) ** 3;
	const inhale = t < burst ? 1 - 0.35 * clamp01((t - (burst - 0.12)) / 0.12) ** 2 : 1;
	const flash = t >= burst ? 1 + 1.4 * Math.exp(-(t - burst) * 9) : 1;
	const after = t >= burst ? 0.35 + 0.65 * Math.exp(-(t - burst) * 4) : 1;
	const relight = t >= rise ? 0.8 * Math.exp(-(t - rise) * 5) : 0;
	const r = 46 * gather * inhale * flash;
	return <circle cx={SEED.x} cy={SEED.y} r={r} fill="url(#g-seed)" opacity={Math.min(1, after + relight)} />;
};

/** The rising golden drop, with velocity stretch and a soft glow; melts into the head on landing. */
const Drop: React.FC<{t: number; headLand: number; rise: number}> = ({t, headLand}) => {
	const p = essencePos(t);
	if (!p) return null;
	const fade = t > headLand ? Math.max(0, 1 - (t - headLand) / 0.05) : 1;
	const d = deform(essencePos, t, [headLand], 0.4, ESSENCE_R);
	const trail = [4, 3, 2, 1]
		.map((k) => ({k, q: essencePos(t - k / 200)}))
		.filter((g): g is {k: number; q: P} => g.q !== null);
	return (
		<g opacity={fade}>
			<circle cx={p.x} cy={p.y} r={ESSENCE_R * 2.4} fill="url(#g-seed)" opacity={0.55} />
			{trail.map(({k, q}) => (
				<circle key={k} cx={q.x} cy={q.y} r={ESSENCE_R * (1 - k * 0.07)} fill="url(#g-essence)" opacity={0.16 - k * 0.03} />
			))}
			<ellipse
				cx={p.x}
				cy={p.y}
				rx={d.rx}
				ry={d.ry}
				fill="url(#g-essence)"
				transform={`rotate(${d.angle} ${p.x} ${p.y})`}
			/>
		</g>
	);
};

/** Flat ripple on the ground: the nourishing flow spreading out. */
export const Ripple: React.FC<{t: number; at: number; c: P; w: number}> = ({t, at, c, w}) => {
	const u = (t - at) / 0.7;
	if (u < 0 || u > 1) return null;
	const e = 1 - (1 - u) ** 3;
	return (
		<ellipse
			cx={c.x}
			cy={c.y}
			rx={10 + e * w}
			ry={3 + e * w * 0.18}
			fill="none"
			stroke="#D9A02A"
			strokeWidth={6 * (1 - u) + 0.4}
			opacity={(1 - u) * 0.9}
		/>
	);
};
