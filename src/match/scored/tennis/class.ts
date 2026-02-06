import ScoredMatch, { ScoreLevel } from '..';
import { IS_PERCENTAGE_STAT_ID, IS_RATIO_STAT_ID, RestType, Sport, type MatchConfig } from '../..';
import { EMPTY_HTML } from '../../../consts';
import { Player } from '../../../participant';
import { assertIsDefined, DualMetric, getLightedElem, info, isDefined, isEvenNumber, isOddNumber, isUndefined } from '../../../utils';
import { StatId, type InterpolationDefinition } from '../../utils';
import { ADVANTAGE_SYMBOL, MIN_TO_WIN_GAME, MIN_TO_WIN_SET, MIN_TO_WIN_TIE_BREAK, POINTS_IN_GAME, SERVES_PER_POINT, TOTAL_GAMES_WHEN_TIE_BREAK_WON, TOTAL_OF_SETS } from './consts';
import { getTotalGames, isInTieBreak } from './fns';

import './css/index.css';

export default class TennisMatch extends ScoredMatch {
	constructor(playerOne: Player, playerTwo: Player, onChange: MatchConfig['onChange']) {
		super({
			sport: Sport.Tennis,
			participants: [playerOne, playerTwo],
			onChange,

			scoreLevelsConfig: [
				{
					scoreLevel: ScoreLevel.Point,
					target: scorer => !isInTieBreak(scorer) ? MIN_TO_WIN_GAME : MIN_TO_WIN_TIE_BREAK,
					withLead: true,
					transformer: (points, opponentPoints, scorer) => {
						if (isInTieBreak(scorer))
							return points;

						const score = POINTS_IN_GAME[points];
						if (isDefined(score))
							return score;

						if (points > opponentPoints)
							return ADVANTAGE_SYMBOL;

						const lastPointInGame = POINTS_IN_GAME.at(-1);
						assertIsDefined(lastPointInGame);
						return lastPointInGame;
					}
				},
				{
					scoreLevel: ScoreLevel.Game,
					target: MIN_TO_WIN_SET,
					withLead: scorer => getTotalGames(scorer) !== TOTAL_GAMES_WHEN_TIE_BREAK_WON
				},
				TOTAL_OF_SETS
			],
			serve: {
				qtyPerPoint: SERVES_PER_POINT,
				getServer: scorer => {
					// Games totals
					const
						previous = scorer.getBy(ScoreLevel.Set).detailedQty
							.map(item => item.getTotal())
							.reduce((accumulator, currentValue) => accumulator + currentValue, 0),
						current = getTotalGames(scorer);
					let absolute = previous + current;

					if (isInTieBreak(scorer))
						absolute += Math.ceil(scorer.getBy(ScoreLevel.Point).qty.getTotal() / 2);

					const isOpeningServer = isEvenNumber(absolute);
					return isOpeningServer;
				}
			},
			onNewByScoreLevel: {
				[ScoreLevel.Game]: (scorer, isSetNew) => {
					if (isSetNew)
						return;

					const
						totalGames = getTotalGames(scorer),
						shouldGoToRest = isOddNumber(totalGames);
					if (shouldGoToRest)
						this.goToRest(RestType.breakPerPhase);
				}
			},
			className: scorer => isInTieBreak(scorer) ? 'isInTieBreak' : null
		});

		this.stats.makeAvailable(
			StatId.ServiceErrors,
			StatId.PossibleBreakPoints, StatId.BreakPoints,
			StatId.TotalServicePoints, StatId.FirstServesIn, StatId.FirstServePointsWon,
			StatId.TotalSecondServes, StatId.SecondServesIn, StatId.SecondServePointsWon
		);
	}

	public getScoreboard() {
		const
			interpolationDefinition: InterpolationDefinition = [],
			{ scorer } = this;
		scorer.getBy(ScoreLevel.Set).detailedQty.forEach((qty, indexOfSet) => {
			if (qty.getTotal() === TOTAL_GAMES_WHEN_TIE_BREAK_WON) {
				const lastGamePoints = scorer.getNestedPoints(indexOfSet, -1);
				interpolationDefinition.push([
					['addingToGamesOfSet', indexOfSet],
					player => {
						if (isUndefined(player))
							return EMPTY_HTML;

						const
							value = lastGamePoints.getBy(player),
							opponentValue = lastGamePoints.getOpponentBy(player);
						return `<sup>${getLightedElem(value, opponentValue)}</sup>`;
					}
				]);
			}
		});
		return this.getDefinedScoreboard(interpolationDefinition);
	}

	public getStats = () => this.getDefinedStats([
		StatId.ServiceErrors,
		[StatId.BreakPoints, StatId.PossibleBreakPoints, IS_RATIO_STAT_ID],
		[StatId.FirstServesIn, StatId.TotalServicePoints, IS_PERCENTAGE_STAT_ID],
		[StatId.SecondServesIn, StatId.TotalSecondServes, IS_PERCENTAGE_STAT_ID],
		[StatId.FirstServePointsWon, StatId.FirstServesIn, IS_PERCENTAGE_STAT_ID],
		[StatId.SecondServePointsWon, StatId.SecondServesIn, IS_PERCENTAGE_STAT_ID]
	]);

	public getPanel = () => this.getUltimatePanel(this, [
		[
			['Start', 'start']
		],
		[
			['Grant opening serve to player 1', 'grantOpeningServeTo', true],
			['Grant opening serve to player 2', 'grantOpeningServeTo', false]
		],
		[
			['Play', 'play']
		],
		[
			['Log serve as let', 'logServeAsLet'],
			['Log serve as fault', 'logServeAsFault'],
			['Log serve as ace', 'logServeAsAce']
		],
		[
			['Log point as let', 'logPointAsLet']
		],
		[
			['Log point won by player 1', 'logPointWonBy', true],
			['Log point won by player 2', 'logPointWonBy', false]
		]
	]);

	public play() { super.play(); }

	public logServeAsLet() {
		this.verifyIsPlaying();
		info('Let serve');
	}

	private hasPossibleBreakPoint = false;
	public logPointWonBy(player: Player) {
		super.logPointWonBy(
			player,
			(server, receiver, isServerWinner) => {
				const isReceiverWinner = !isServerWinner;
				if (isReceiverWinner && this.hasPossibleBreakPoint)
					this.stats.increase(StatId.BreakPoints, receiver);
				this.hasPossibleBreakPoint = false;

				assertIsDefined(this.failedServes);
				const hasSecondServe = this.failedServes > 0;
				if (hasSecondServe)
					this.stats.increase(StatId.TotalSecondServes, server);

				const
					isFirstServeIn = this.failedServes === 0,
					isSecondServeIn = !isFirstServeIn &&
						this.failedServes !== SERVES_PER_POINT;

				if (isFirstServeIn)
					this.stats.increase(StatId.FirstServesIn, server);
				else if (isSecondServeIn)
					this.stats.increase(StatId.SecondServesIn, server);

				if (isServerWinner) {
					if (isFirstServeIn)
						this.stats.increase(StatId.FirstServePointsWon, server);
					else if (isSecondServeIn)
						this.stats.increase(StatId.SecondServePointsWon, server);
				}
			},
			() => {
				const receiver = this.getReceiver();

				DualMetric.setFocusedParticipant(receiver);
				if (this.scorer.isOnePointToWin()) {

					this.stats.increase(StatId.PossibleBreakPoints, receiver);
					this.hasPossibleBreakPoint = true;
				}
			}
		);
	}
}