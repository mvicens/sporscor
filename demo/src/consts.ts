import { BasketballMatch, TennisMatch, VolleyballMatch } from './lib';

export const SPORTS = [
	{
		name: '🏀 Basketball',
		class: BasketballMatch
	},
	{
		name: '🎾 Tennis',
		class: TennisMatch
	},
	{
		name: '🏐 Volleyball',
		class: VolleyballMatch
	}
] as const;