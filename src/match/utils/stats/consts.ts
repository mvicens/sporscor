import { Sport } from '../..';
import { Id } from './enums';
import type { LabelById } from './types';

export const LABEL_BY_ID: LabelById = {
	[Id.TotalPoints]: 'Total Points',
	[Id.TwoPointersAttempted]: 'Two-Pointers Attempted',
	[Id.TwoPointersMade]: 'Two-Pointers Made',
	[Id.ThreePointersAttempted]: 'Three-Pointers Attempted',
	[Id.ThreePointersMade]: 'Three-Pointers Made',
	[Id.FreeThrowsAttempted]: 'Free Throws Attempted',
	[Id.FreeThrowsMade]: 'Free Throws Made',
	[Id.MostConsecutivePointsWon]: 'Most Consecutive Points Won',
	[Id.Aces]: 'Aces',
	[Id.ServiceErrors]: sport => sport !== Sport.Tennis ? 'Service Errors' : 'Double Faults',
	[Id.BreakPoints]: 'Break Points',
	[Id.FirstServesIn]: '1st Serves In',
	[Id.SecondServesIn]: '2nd Serves In',
	[Id.FirstServePointsWon]: '1st Serve Points Won',
	[Id.SecondServePointsWon]: '2nd Serve Points Won',
	[Id.PointScoring]: 'Point-Scoring',
	[Id.SideOut]: 'Side-Out'
} as const;