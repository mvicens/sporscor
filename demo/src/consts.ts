import { BasketballMatch, TennisMatch, VolleyballMatch } from './lib';

export const SPORTS = [
	{
		name: 'Basketball',
		class: BasketballMatch,
		symbol: '🏀'
	},
	{
		name: 'Tennis',
		class: TennisMatch,
		symbol: '🎾'
	},
	{
		name: 'Volleyball',
		class: VolleyballMatch,
		symbol: '🏐'
	}
] as const;