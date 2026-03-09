import { ScoreLevel, Scorer } from '..';
import { TIMEOUTS_PER_SET, TIMEOUTS_PER_TIE_BREAK, TOTAL_OF_SETS_WHEN_TIE_BREAK } from './consts';

export const isInTieBreak = (scorer: Scorer) => scorer.getLastCountOf(ScoreLevel.Set).getTotal() === TOTAL_OF_SETS_WHEN_TIE_BREAK;

export const getTimeoutsPerPhase = (scorer: Scorer) => !isInTieBreak(scorer) ? TIMEOUTS_PER_SET : TIMEOUTS_PER_TIE_BREAK;