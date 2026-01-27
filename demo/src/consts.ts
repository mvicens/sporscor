import { BasketballMatch, TennisMatch, VolleyballMatch } from '../../src';

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