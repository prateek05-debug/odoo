import React from 'react';
import {Composition} from 'remotion';
import {Intro, type IntroProps} from './Intro';
import {ENDING, FPS} from './timing';

const full = Math.round(ENDING.full.duration * FPS);
const mono = Math.round(ENDING.monogram.duration * FPS);

const comps: {id: string; w: number; h: number; frames: number; props: IntroProps}[] = [
	{id: 'Full-16x9', w: 1920, h: 1080, frames: full, props: {variant: 'full', transparent: false, fill: 0.8}},
	{id: 'Full-16x9-Alpha', w: 1920, h: 1080, frames: full, props: {variant: 'full', transparent: true, fill: 0.8}},
	{id: 'Monogram-1x1', w: 1080, h: 1080, frames: mono, props: {variant: 'monogram', transparent: false, fill: 0.6}},
	{id: 'Monogram-16x9', w: 1920, h: 1080, frames: mono, props: {variant: 'monogram', transparent: false, fill: 0.55}},
	{id: 'Monogram-9x16', w: 1080, h: 1920, frames: mono, props: {variant: 'monogram', transparent: false, fill: 0.62}},
	{id: 'Monogram-1x1-Alpha', w: 1080, h: 1080, frames: mono, props: {variant: 'monogram', transparent: true, fill: 0.6}},
];

export const RemotionRoot: React.FC = () => (
	<>
		{comps.map((c) => (
			<Composition
				key={c.id}
				id={c.id}
				component={Intro}
				durationInFrames={c.frames}
				fps={FPS}
				width={c.w}
				height={c.h}
				defaultProps={c.props}
			/>
		))}
	</>
);
