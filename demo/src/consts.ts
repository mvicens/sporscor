import { BasketballMatch, TennisMatch, VolleyballMatch } from './lib';

export const SPORTS = [
	{
		label: '🏀 Basketball',
		class: BasketballMatch
	},
	{
		label: '🎾 Tennis',
		class: TennisMatch
	},
	{
		label: '🏐 Volleyball',
		class: VolleyballMatch
	}
] as const;