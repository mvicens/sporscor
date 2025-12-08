import { Timer as EasyTimer } from 'easytimer.js';
import { EMPTY_HTML } from '../../../../consts';
import type { Callback, Html } from '../../../../types';
import { DeveloperError, ensureNumber, ensureString, isDefined, isPositiveNumber, isString, isUndefined, padStartNumber, verifyIsNonNegativeInteger, verifyIsNumberGreaterThan, verifyIsNumberLessThan, verifyIsPositiveInteger } from '../../../../utils';
import { SHOULD_UPDATE } from './consts';
import type { ExternalItem, Id, InternalItem } from './types';

export default class Timer {
	constructor(items: Array<ExternalItem>) {
		const internalItems: Array<InternalItem> = items.map(item => {
			const { initialTime } = item;
			verifyIsNonNegativeInteger(initialTime);

			const
				{ onFinish } = item,
				isCountdown = isDefined(onFinish);

			const
				{ decimaledTime } = item,
				hasDecimaledTime = isDefined(decimaledTime);
			if (hasDecimaledTime) {
				verifyIsPositiveInteger(decimaledTime);

				if (isCountdown)
					verifyIsNumberLessThan(decimaledTime, initialTime);
				else
					verifyIsNumberGreaterThan(decimaledTime, initialTime);
			}

			return {
				...item,
				value: new EasyTimer({
					precision: 'secondTenths',
					countdown: isCountdown
				}),
				time: SHOULD_UPDATE,
				shouldShowDecimal: false,
				isFinished: false
			};
		});
		this.#items = internalItems;

		this.#forEach((item) => {
			const
				{ onChange, value } = item,
				update = () => {
					item.time = SHOULD_UPDATE;
					onChange();
				};
			value.on('secondTenthsUpdated', () => {
				let { shouldShowDecimal } = item;
				if (!shouldShowDecimal) {
					const
						{ decimaledTime } = item,
						hasDecimaledTime = isDefined(decimaledTime);
					if (hasDecimaledTime) {
						const
							expectedSecondTenths = decimaledTime * 10,
							{ secondTenths: realSecondTenths } = value.getTotalTimeValues();
						shouldShowDecimal = expectedSecondTenths === realSecondTenths;
					}
				}
				if (shouldShowDecimal) {
					update();
					item.shouldShowDecimal = true; // After in order to avoid show decimal immediately when integer
				} else {
					const
						{ secondTenths } = value.getTimeValues(),
						isJustAtSecond = secondTenths === 0;
					if (isJustAtSecond)
						update();
				}
			});
			value.on('targetAchieved', () => {
				onChange();
				item.onFinish?.();
				item.isFinished = true;
			});
		});
	}

	#items: Array<InternalItem>;

	#wasReset = false;

	isRunning = false;

	#forEach(cb: Callback<[InternalItem]>, shouldRun?: boolean) {
		const shouldSwitch = isDefined(shouldRun);

		if (shouldSwitch) {
			const
				isExpectedlyRunning = !shouldRun,
				isReallyRunning = this.isRunning;
			if (isExpectedlyRunning !== isReallyRunning)
				throw new DeveloperError(isReallyRunning ? 'Timer is already running' : 'Timer is not running');
		}

		this.#items.forEach(cb);

		if (shouldSwitch)
			this.isRunning = shouldRun;
	}

	#getItem(id: Id) {
		const item = this.#items.find(({ id: searchedId }) => searchedId === id);
		if (isUndefined(item))
			throw new DeveloperError('ID not found');
		return item;
	}

	getTimeOf(id: Id) {
		const item = this.#getItem(id);

		let { time } = item;
		if (time !== SHOULD_UPDATE)
			return time;

		const
			{ value } = item,
			timeValues = value.getTimeValues();

		const
			{ hours } = value.getTotalTimeValues(),
			{ minutes, seconds } = timeValues;

		let decimaledSeconds = ensureString(seconds);
		const { shouldShowDecimal } = item;
		if (shouldShowDecimal) {
			const { secondTenths } = timeValues;
			decimaledSeconds = `${seconds}.${secondTenths}`;
		}

		let
			amounts = [
				{ symbol: 'H', value: ensureString(hours) },
				{ symbol: 'M', value: ensureString(minutes) },
				{ symbol: 'S', value: decimaledSeconds }
			],
			shouldInclude = false;
		amounts = amounts.filter(({ value }, i) => {
			if (shouldInclude)
				return true;

			const isLast = i === amounts.length - 1;
			if (isLast)
				return true;

			const numValue = ensureNumber(value);
			if (isPositiveNumber(numValue)) {
				shouldInclude = true;
				return true;
			}

			return false;
		});

		const content: Html = amounts
			.map(({ value }, i) => {
				const isFirst = i === 0;
				if (!isFirst) {
					const
						[integer, decimal] = value.split('.'),
						paddedInteger = padStartNumber(integer, 2);
					value = isDefined(decimal) ? `${paddedInteger}.${decimal}` : paddedInteger;
				}
				return value;
			})
			.join(':');

		let attr: Html = amounts
			.filter(({ value }) => {
				const numValue = ensureNumber(value);
				return isPositiveNumber(numValue);
			})
			.map(({ value, symbol }) => {
				value = value.replace('.0', '');
				return value + symbol;
			})
			.join('');
		if (attr === EMPTY_HTML)
			attr = '0S';
		attr = 'PT' + attr;

		time = `<time datetime="${attr}">${content}</time>`;
		item.time = time;
		return time;
	}

	reset(itemOrId: InternalItem | Id) {
		const
			isId = isString(itemOrId),
			item = isId
				? this.#getItem(itemOrId)
				: itemOrId;

		const { value, initialTime } = item;
		value.stop();
		value.start({ startValues: { seconds: initialTime } });
		if (!this.isRunning)
			value.pause();

		item.time = SHOULD_UPDATE;
		item.shouldShowDecimal = false;
		item.isFinished = false;

		item.onChange();
	}

	resetAll() {
		this.#forEach(item => { this.reset(item); });
		this.#wasReset = true;
	}

	runAll() {
		if (!this.#wasReset)
			this.resetAll();
		this.#forEach(
			({ value }) => { value.start(); },
			true
		);
	}

	pauseAll() {
		this.#forEach(
			({ value }) => { value.pause(); },
			false
		);
	}
}