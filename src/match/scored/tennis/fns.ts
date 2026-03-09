import { ScoreLevel, Scorer } from '..';
import { TOTAL_GAMES_WHEN_TIE_BREAK } from './consts';

export const getTotalGames = (scorer: Scorer) => scorer.getLastCountOf(ScoreLevel.Game).getTotal();

export const isInTieBreak = (scorer: Scorer) => getTotalGames(scorer) === TOTAL_GAMES_WHEN_TIE_BREAK;