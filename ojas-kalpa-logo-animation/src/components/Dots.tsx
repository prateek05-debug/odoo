import React from 'react';
import {LOGO} from '../anim';
import {
	BASE,
	BASELINE,
	DOSHAS,
	doshaR,
	HEAD,
	OJAS_COLORS,
	OJAS_R,
	type P,
	SPARK_R,
	deform,
	doshaImpacts,
	doshaPos,
	ojasPos,
	sparkPos,
} from '../kinetic';
import {FULL, INTRO, type Variant} from '../timing';

type Colors = {base: string; light: string; dark: string};

const Gradient: React.FC<{id: string; c: Colors}> = ({id, c}) => (
	<radialGradient id={id} cx="0.36" cy="0.3" r="0.75">
		<stop offset="0" stopColor="#FFFFFF" />
		<stop offset="0.12" stopColor={c.light} />
		<stop offset="0.55" stopColor={c.base} />
		<stop offset="1" stopColor={c.dark} />
	</radialGradient>
);

/** One glossy ball with a short motion trail (smooths fast moves at 60 fps). */
const Ball: React.FC<{
	t: number;
	pos: (t: number) => P | null;
	r: number;
	fill: string;
	impacts: number[];
	impact: number;
	opacity?: number;
	floor?: number;
}> = ({t, pos, r, fill, impacts, impact, opacity = 1, floor}) => {
	const p = pos(t);
	if (!p) return null;
	const trail = [4, 3, 2, 1]
		.map((k) => ({k, q: pos(t - k / 200)}))
		.filter((g): g is {k: number; q: P} => g.q !== null);
	const d = deform(pos, t, impacts, impact, r);
	const h = floor === undefined ? 0 : Math.max(0, floor - (p.y + r));
	return (
		<g opacity={opacity}>
			{floor === undefined ? null : (
				<ellipse
					cx={p.x}
					cy={floor + 2}
					rx={r * (1.1 - Math.min(0.7, h / 300))}
					ry={r * 0.22 * (1.1 - Math.min(0.7, h / 300))}
					fill="rgba(110,70,10,0.22)"
					opacity={1 - Math.min(1, h / 260)}
				/>
			)}
			{trail.map(({k, q}) => (
				<circle key={k} cx={q.x} cy={q.y} r={r * (1 - k * 0.07)} fill={fill} opacity={0.16 - k * 0.03} />
			))}
			<ellipse
				cx={p.x}
				cy={p.y}
				rx={d.rx}
				ry={d.ry}
				fill={fill}
				transform={`rotate(${d.angle} ${p.x} ${p.y})`}
			/>
		</g>
	);
};

export const Dots: React.FC<{t: number; variant: Variant}> = ({t, variant}) => {
	const {merge, baseLand, headLand} = INTRO;
	// the drop melts into the figure's head over 3 frames
	const ojasOpacity = t > headLand ? Math.max(0, 1 - (t - headLand) / 0.05) : 1;
	return (
		<svg
			width={LOGO.width}
			height={LOGO.height}
			viewBox={`0 0 ${LOGO.width} ${LOGO.height}`}
			style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}
		>
			<defs>
				{DOSHAS.map((d) => (
					<Gradient key={d.name} id={`g-${d.name}`} c={d} />
				))}
				<Gradient id="g-ojas" c={OJAS_COLORS} />
				<radialGradient id="g-glow">
					<stop offset="0" stopColor="rgba(255,214,110,0.75)" />
					<stop offset="1" stopColor="rgba(255,214,110,0)" />
				</radialGradient>
			</defs>
			<MergeRing t={t} at={merge} c={HEAD} />
			<Ripple t={t} at={baseLand} c={BASE} />
			{DOSHAS.map((d, i) => (
				<Ball
					key={d.name}
					t={t}
					pos={(x) => doshaPos(i, x)}
					r={doshaR(i, t)}
					fill={`url(#g-${d.name})`}
					impacts={doshaImpacts(i)}
					impact={0.32}
				/>
			))}
			{ojasPos(t) ? (
				<circle cx={HEAD.x} cy={ojasPos(t)!.y} r={OJAS_R * 2.2} fill="url(#g-glow)" opacity={ojasOpacity * 0.8} />
			) : null}
			<Ball
				t={t}
				pos={ojasPos}
				r={OJAS_R}
				fill="url(#g-ojas)"
				impacts={[merge, baseLand, headLand]}
				impact={0.42}
				opacity={ojasOpacity}
			/>
			{variant === 'full' ? (
				<>
					{FULL.letterLands.map((at) => (
						<Ripple key={at} t={t} at={at} c={{x: sparkPos(at)?.x ?? 0, y: BASELINE}} small />
					))}
					<Ball
						t={t}
						pos={sparkPos}
						r={SPARK_R}
						fill="url(#g-ojas)"
						impacts={[...FULL.letterLands, FULL.hit]}
						impact={0.45}
						floor={t <= FULL.letterLands[FULL.letterLands.length - 1] + 0.02 ? BASELINE : undefined}
						opacity={t > FULL.hit ? Math.max(0, 1 - (t - FULL.hit) / 0.05) : 1}
					/>
				</>
			) : null}
		</svg>
	);
};

/** Bright ring that bursts out when the three doshas merge into ojas. */
const MergeRing: React.FC<{t: number; at: number; c: P}> = ({t, at, c}) => {
	const u = (t - at) / 0.45;
	if (u < 0 || u > 1) return null;
	const e = 1 - (1 - u) ** 3;
	return (
		<circle
			cx={c.x}
			cy={c.y}
			r={OJAS_R + e * 120}
			fill="none"
			stroke="#E9B23A"
			strokeWidth={8 * (1 - u) + 0.5}
			opacity={1 - u}
		/>
	);
};

/** Flat ripple on the ground where a drop lands. */
const Ripple: React.FC<{t: number; at: number; c: P; small?: boolean}> = ({t, at, c, small}) => {
	const dur = small ? 0.35 : 0.6;
	const u = (t - at) / dur;
	if (u < 0 || u > 1) return null;
	const e = 1 - (1 - u) ** 3;
	const w = small ? 60 : 270;
	return (
		<ellipse
			cx={c.x}
			cy={c.y}
			rx={10 + e * w}
			ry={3 + e * w * 0.2}
			fill="none"
			stroke="#D9A02A"
			strokeWidth={(small ? 3 : 6) * (1 - u) + 0.4}
			opacity={(1 - u) * 0.9}
		/>
	);
};
