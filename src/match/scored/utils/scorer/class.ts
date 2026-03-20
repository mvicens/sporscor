import { Callback, Index, MapIterable } from '../../../../types';
import { assertIsDefined, assertIsNumber, assertIsRecord, DeveloperError, DualMetric, isDefined, isNumber, ParticipantsManagerOfDualMetric, resolveValueOrProvider, verifyIsOddNumber, verifyIsPositiveInteger } from '../../../../utils';
import { SHOULD_CONTINUE, SHOULD_INTERRUPT } from './consts';
import { ScoreLevel } from './enums';
import { assertIsCount, assertIsCountHierarchy, isCountHierarchy } from './fns';
import { Config, Count, CountHierarchy, CountHierarchyChild, DefinitionByScoreLevel, IsHigherScoreLevelAffected, LoopCb, ScoreLevelDefinition } from './types';

export default class Scorer {
	constructor(config: Config) {
		validate();

		const
			scoreLevels: Array<ScoreLevel> = [],
			definitionByScoreLevel: MapIterable<ScoreLevel, ScoreLevelDefinition> = config.scoreLevelDefinitions.map(item => {
				if (isNumber(item)) {
					const
						totalOfSets = item,
						minToWinMatch = (totalOfSets + 1) / 2;
					item = {
						scoreLevel: ScoreLevel.Set,
						target: minToWinMatch,
						shouldWinByTwo: false
					};
				}

				scoreLevels.push(item.scoreLevel);

				return [item.scoreLevel, item];
			});

		this.#definitionByScoreLevel = new Map(definitionByScoreLevel);

		this.#participantsManagerOfDualMetric = config.participantsManagerOfDualMetric;

		this.#scoreLevels = scoreLevels;

		const mainCountHierarchy = this.#getBuiltCountHierarchyChildOf(ScoreLevel.Set);
		assertIsCountHierarchy(mainCountHierarchy);
		this.#mainCountHierarchy = mainCountHierarchy;

		this.#events = config.events;

		function validate() {
			const { scoreLevelDefinitions } = config;

			const totalOfSets = scoreLevelDefinitions.at(0);
			assertIsNumber(totalOfSets);
			verifyIsPositiveInteger(totalOfSets);
			verifyIsOddNumber(totalOfSets);

			const lastScoreLevelDefinition = scoreLevelDefinitions.at(-1);
			assertIsRecord(lastScoreLevelDefinition);
			if (lastScoreLevelDefinition.scoreLevel !== ScoreLevel.Point)
				throw new DeveloperError('Last score level definition must be point\'s');
		}
	}

	#definitionByScoreLevel: DefinitionByScoreLevel;

	#participantsManagerOfDualMetric: ParticipantsManagerOfDualMetric;
	#scoreLevels: Array<ScoreLevel>;
	#mainCountHierarchy: CountHierarchy;

	#events: Config['events'];

	#isWon(scoreLevel: ScoreLevel, getCount?: Callback<[Count], Count>) {
		const scoreLevelDefinition = this.#getScoreLevelDefinitionOf(scoreLevel);

		const
			lastCount = this.getLastCountOf(scoreLevel),
			count = isDefined(getCount)
				? getCount(lastCount)
				: lastCount;

		const target = resolveValueOrProvider(scoreLevelDefinition.target, this);
		if (count.isLessThan(target))
			return false;

		const
			shouldWinByTwo = resolveValueOrProvider(scoreLevelDefinition.shouldWinByTwo, this),
			result = !shouldWinByTwo || count.isDiffAtLeast(2);
		return result;
	}

	isAlmostWon = // One point to win
		() => this.#isWon(ScoreLevel.Point, count => {
			const result = count.clone();
			result.increase(); // Hypothetical
			return result;
		});

	#getScoreLevelDefinitionOf(value: ScoreLevel) {
		const result = this.#definitionByScoreLevel.get(value);
		assertIsDefined(result);
		return result;
	}

	#getNewCount = (): Count => new DualMetric(this.#participantsManagerOfDualMetric, 0);
	#getBuiltCountHierarchyChildOf(scoreLevel: ScoreLevel): CountHierarchyChild {
		const lowerScoreLevel = this.#getLowerTo(scoreLevel);
		if (isDefined(lowerScoreLevel))
			return {
				summarized: this.#getNewCount(),
				detailed: [this.#getBuiltCountHierarchyChildOf(lowerScoreLevel)]
			};
		return this.#getNewCount();
	}

	#getHigherTo(scoreLevel: ScoreLevel) {
		let result: undefined | ScoreLevel;
		this.#forEachScoreLevel(currentScoreLevel => {
			if (currentScoreLevel === scoreLevel)
				return SHOULD_INTERRUPT;

			result = currentScoreLevel;
			return SHOULD_CONTINUE;
		});
		assertIsDefined(result); // Fails if score level is set
		return result;
	}

	#getLowerTo(scoreLevel: ScoreLevel) {
		let
			result: undefined | ScoreLevel,
			isNext = false;
		this.#forEachScoreLevel(currentScoreLevel => {
			if (isNext) {
				result = currentScoreLevel;
				return SHOULD_INTERRUPT;
			}

			if (currentScoreLevel === scoreLevel)
				isNext = true;
			return SHOULD_CONTINUE;
		});
		return result;
	}

	#getLastCountHierarchyChildOf(scoreLevel: ScoreLevel): CountHierarchyChild {
		let result: CountHierarchyChild = this.#mainCountHierarchy;
		this.#forEachScoreLevel(currentScoreLevel => {
			if (currentScoreLevel === scoreLevel)
				return SHOULD_INTERRUPT;

			assertIsCountHierarchy(result);
			const newResult = result.detailed.at(-1);
			assertIsDefined(newResult);
			result = newResult;
			return SHOULD_CONTINUE;
		});
		return result;
	}

	getLastCountOf(scoreLevel: ScoreLevel) {
		const lastCountHierarchyChild = this.#getLastCountHierarchyChildOf(scoreLevel);
		if (isCountHierarchy(lastCountHierarchyChild)) {
			const lastCountHierarchy = lastCountHierarchyChild;
			return lastCountHierarchy.summarized;
		}
		return lastCountHierarchyChild;
	}

	getCountBy(...indexes: Array<Index>) {
		let result: CountHierarchyChild = this.#mainCountHierarchy;
		indexes.forEach(index => {
			assertIsCountHierarchy(result);
			const newResult = result.detailed.at(index);
			assertIsDefined(newResult);
			result = newResult;
		});
		assertIsCount(result);
		return result;
	}

	getConcludedDetailedCountsOf(scoreLevel: ScoreLevel) {
		const lastCountHierarchy = this.#getLastCountHierarchyChildOf(scoreLevel);
		assertIsCountHierarchy(lastCountHierarchy);
		const
			detailedCounts = lastCountHierarchy.detailed.map(countHierarchy => {
				assertIsCountHierarchy(countHierarchy);
				return countHierarchy.summarized;
			}),
			concludedTotal = lastCountHierarchy.summarized.getTotal();
		return detailedCounts.slice(0, concludedTotal);
	}

	getCountsTotalOf(scoreLevel: ScoreLevel) {
		const
			higherScoreLevel = this.#getHigherTo(scoreLevel),
			lastCountHierarchy = this.#getLastCountHierarchyChildOf(higherScoreLevel);
		assertIsCountHierarchy(lastCountHierarchy);
		return lastCountHierarchy.detailed
			.map(countHierarchy => {
				assertIsCountHierarchy(countHierarchy);
				return countHierarchy.summarized.getTotal();
			})
			.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
	}

	#increase(scoreLevel: ScoreLevel) {
		const
			lastCountHierarchyChild = this.#getLastCountHierarchyChildOf(scoreLevel),
			count = isCountHierarchy(lastCountHierarchyChild)
				? lastCountHierarchyChild.summarized
				: lastCountHierarchyChild;
		count.increase();
	}
	increase() { // Point
		this.#forEachScoreLevelDefinition(
			item => {
				const
					{ scoreLevel } = item,
					dispatchEvent = (isHigherScoreLevelAffected: IsHigherScoreLevelAffected) => {
						this.#events.onIncrease.forEach(eventHandlerByScoreLevel => {
							const eventHandler = eventHandlerByScoreLevel[scoreLevel];
							if (isDefined(eventHandler))
								eventHandler(this, isHigherScoreLevelAffected);
						});
					};

				this.#increase(scoreLevel);

				const isWon = this.#isWon(scoreLevel);
				if (!isWon) {
					dispatchEvent(false);

					const lowerScoreLevel = this.#getLowerTo(scoreLevel);
					if (isDefined(lowerScoreLevel)) {
						const lastCountHierarchyChild = this.#getLastCountHierarchyChildOf(scoreLevel);
						if (isCountHierarchy(lastCountHierarchyChild)) {
							const lastCountHierarchy = lastCountHierarchyChild;
							lastCountHierarchy.detailed.push(this.#getBuiltCountHierarchyChildOf(lowerScoreLevel));
						}
					}

					return SHOULD_INTERRUPT;
				}

				if (scoreLevel !== ScoreLevel.Set)
					dispatchEvent(true);
				else
					this.#events.onFinish(); // No event dispatching due to last loop
				return SHOULD_CONTINUE;
			},
			true // From point until set
		);
	}

	#forEach<T>(items: Array<T>, cb: LoopCb<T>) {
		for (const item of items) {
			const shouldInterrupt = cb(item);
			if (shouldInterrupt)
				break;
			// else
			// 	continue;
		}
	}

	#forEachScoreLevel(cb: LoopCb<ScoreLevel>, shouldReverse = false) {
		const scoreLevelDefinitions = Array.from(this.#definitionByScoreLevel.values());
		if (shouldReverse)
			scoreLevelDefinitions.reverse();
		this.#forEach(this.#scoreLevels, cb);
	}

	#forEachScoreLevelDefinition(cb: LoopCb<ScoreLevelDefinition>, shouldReverse = false) {
		const scoreLevelDefinitions = Array.from(this.#definitionByScoreLevel.values());
		if (shouldReverse)
			scoreLevelDefinitions.reverse();
		this.#forEach(scoreLevelDefinitions, cb);
	}

	forEachScoreLevelDefinition(cb: LoopCb<ScoreLevelDefinition>) { this.#forEachScoreLevelDefinition(cb); }
}