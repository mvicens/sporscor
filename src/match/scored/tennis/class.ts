import ScoredMatch, { ScoreLevel } from '..';
import { IS_PERCENTAGE_STAT_ID, IS_RATIO_STAT_ID, RestType, Sport } from '../..';
import { EMPTY_HTML } from '../../../consts';
import { Player } from '../../../participant';
import { assertIsDefined, assertIsNumber, getLightedElem, info, isDefined, isEvenNumber, isOddNumber, isUndefined } from '../../../utils';
import { StatId, type InterpolationDefinition } from '../../utils';
import { ADVANTAGE_SYMBOL, MIN_TO_WIN_GAME, MIN_TO_WIN_SET, MIN_TO_WIN_TIE_BREAK, POINTS_IN_GAME, SERVES_PER_POINT, TOTAL_GAMES_WHEN_TIE_BREAK_WON, TOTAL_OF_SETS } from './consts';
import { getTotalGames, isInTieBreak } from './fns';

import './css/index.css';

/**
 * Represents a tennis match.
 */
export default class TennisMatch extends ScoredMatch {
	/**
	 * Creates a new tennis match.
	 *
	 * @param playerOne - The 1st player to participate.
	 * @param playerTwo - The 2nd player to participate.
	 * @param onChange - A callback called when the scoreboard and/or statistics change.
	 */
	constructor(playerOne: Player, playerTwo: Player, onChange: VoidFunction) {
		super({
			sport: Sport.Tennis,
			participants: [playerOne, playerTwo],
			onChange,

			scoreLevelDefinitions: [
				TOTAL_OF_SETS,
				{
					scoreLevel: ScoreLevel.Game,
					target: MIN_TO_WIN_SET,
					shouldWinByTwo: scorer => getTotalGames(scorer) !== TOTAL_GAMES_WHEN_TIE_BREAK_WON
				},
				{
					scoreLevel: ScoreLevel.Point,
					target: scorer => !isInTieBreak(scorer) ? MIN_TO_WIN_GAME : MIN_TO_WIN_TIE_BREAK,
					shouldWinByTwo: true,
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
				}
			],
			onIncrement: {
				[ScoreLevel.Game]: (scorer, isSetIncremented) => {
					if (isSetIncremented)
						return;

					const
						totalGames = getTotalGames(scorer),
						shouldGoToRest = isOddNumber(totalGames);
					if (shouldGoToRest)
						this.goToRest(RestType.breakPerPhase);
				}
			},

			serve: {
				qtyPerPoint: SERVES_PER_POINT,
				getServer: scorer => {
					let total = scorer.getCountsTotalOf(ScoreLevel.Game);
					if (isInTieBreak(scorer))
						total += Math.ceil(scorer.getLastCountOf(ScoreLevel.Point).getTotal() / 2);

					const isOpeningServer = isEvenNumber(total);
					return isOpeningServer;
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


	/**
	 * Gets a scoreboard to display points, games and other info.
	 *
	 * @return The HTML content.
	 */
	public getScoreboard(): string {
		const
			interpolationDefinition: InterpolationDefinition = [],
			{ scorer } = this;
		scorer.getConcludedDetailedCountsOf(ScoreLevel.Set).forEach((qty, indexOfSet) => {
			if (qty.getTotal() === TOTAL_GAMES_WHEN_TIE_BREAK_WON) {
				const lastGamePoints = scorer.getCountBy(indexOfSet, -1);
				interpolationDefinition.push([
					['addingToGamesOfSet', indexOfSet],
					player => {
						if (isUndefined(player))
							return EMPTY_HTML;

						const value = lastGamePoints.getBy(player);
						assertIsNumber(value);

						const opponentValue = lastGamePoints.getOpponentBy(player);
						assertIsNumber(opponentValue);

						return `<sup>${getLightedElem(value, opponentValue)}</sup>`;
					}
				]);
			}
		});
		return this.getDefinedScoreboard(interpolationDefinition);
	}

	/**
	 * Gets a statistics panel about players playing data.
	 *
	 * @return The HTML content.
	 */
	public getStats = (): string => this.getDefinedStats([
		StatId.ServiceErrors,
		[StatId.BreakPoints, StatId.PossibleBreakPoints, IS_RATIO_STAT_ID],
		[StatId.FirstServesIn, StatId.TotalServicePoints, IS_PERCENTAGE_STAT_ID],
		[StatId.SecondServesIn, StatId.TotalSecondServes, IS_PERCENTAGE_STAT_ID],
		[StatId.FirstServePointsWon, StatId.FirstServesIn, IS_PERCENTAGE_STAT_ID],
		[StatId.SecondServePointsWon, StatId.SecondServesIn, IS_PERCENTAGE_STAT_ID]
	]);

	/**
	 * Gets a control panel to interact by buttons (instead invoke the API methods).
	 *
	 * @return The HTML element.
	 */
	public getPanel = (): Element => this.getUltimatePanel(this, [
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

	/**
	 * Grants the opening serve to a player.
	 *
	 * @param player - The player.
	 */
	public override grantOpeningServeTo(player: Player): void { super.grantOpeningServeTo(player); }

	/**
	 * Starts the prepared match or (at break) the next game (and maybe set) to play.
	 */
	public override play(): void { super.play(); }

	/**
	 * Logs a serve as let.
	 */
	public logServeAsLet(): void {
		this.verifyIsPlaying();
		info('Let serve');
	}

	private hasPossibleBreakPoint = false;

	/**
	 * Logs a point won by a player.
	 *
	 * @param player - The player.
	 */
	public override logPointWonBy(player: Player): void {
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

				this.participantsManagerOfDualMetric.focus(receiver);
				if (this.scorer.isAlmostWon()) {

					this.stats.increase(StatId.PossibleBreakPoints, receiver);
					this.hasPossibleBreakPoint = true;
				}
			}
		);
	}
}