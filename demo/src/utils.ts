import { SPORTS } from './consts';
import { Player, Team, TennisMatch } from './lib';
import sectionHtmlContent from './section.html?raw';

function getHtmlElement(selectors: string) {
	const result = document.querySelector<HTMLElement>(selectors);
	assertIsNonNullable(result);
	return result;
}

function toElement(htmlContent: string) {
	const
		domParser = new DOMParser(),
		document = domParser.parseFromString(htmlContent, 'text/html'),
		result = document.body.firstElementChild;
	assertIsNonNullable(result);
	return result;
}

export function setTheme() {
	const value = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	document.documentElement.setAttribute('data-bs-theme', value);
}

export function setHtmlContent(selectors: string, value: string | Element, onFinish?: VoidFunction) {
	if (typeof value === 'string')
		getHtmlElement(selectors).innerHTML = value;
	else
		getHtmlElement(selectors).append(value);

	onFinish?.();
}

export function buildDropdown(selectors: string, content: Array<[string, VoidFunction]>) {
	const elem = getHtmlElement(`${selectors} .dropdown-menu`);
	content.forEach(([label, onClick]) => {
		const childElem = toElement(`<li><a class="dropdown-item" href="">${label}</a></li>`);
		childElem.addEventListener('click', e => {
			e.preventDefault();
			onClick();
		});
		elem.appendChild(childElem);
	});
}

const
	getSelectors = (index: number, selectors: string) => `.card:nth-child(${index + 1}) ${selectors}`,
	isTennisMatch = (value: unknown): value is typeof TennisMatch => value === TennisMatch;
export function createMatch(sport: typeof SPORTS[number]) {
	const sectionElement = toElement(sectionHtmlContent);

	const titleElement = sectionElement.querySelector('.card-header');
	assertIsNonNullable(titleElement);
	titleElement.textContent = sport.label;

	const index = document.querySelectorAll('.card').length;

	getHtmlElement('main').appendChild(sectionElement);

	function loadScoreboard() { setHtmlContent(getSelectors(index, '.scoreboard'), instance.getScoreboard()); }
	function loadStats() { setHtmlContent(getSelectors(index, '.stats'), instance.getStats()); }
	function loadPanel() { setHtmlContent(getSelectors(index, '.panel'), instance.getPanel()); }

	const { class: Class } = sport;
	let instance: InstanceType<typeof Class>;
	function onChange() {
		loadScoreboard();
		loadStats();
	}
	if (isTennisMatch(Class)) {
		const
			playerOne = new Player('Player 1'),
			playerTwo = new Player('Player 2');
		instance = new Class(playerOne, playerTwo, onChange);
	} else {
		const
			teamOne = new Team('Team 1'),
			teamTwo = new Team('Team 2');
		instance = new Class(teamOne, teamTwo, onChange);
	}

	getHtmlElement(getSelectors(index, '.dropdown-toggle-split')).click();

	const
		mq = window.matchMedia('(min-width: 768px)'),
		relocateSidebar = () => {
			const
				isLessThanMediumBreakpoint = !mq.matches,
				selectors = isLessThanMediumBreakpoint
					? '.d-md-none .sidebar-container'
					: '.sidebar-container.d-none';
			getHtmlElement(getSelectors(index, selectors)).append(getHtmlElement(getSelectors(index, '.sidebar')));
		};
	mq.addEventListener('change', relocateSidebar);
	relocateSidebar();

	buildDropdown(getSelectors(index, '.sidebar'), [
		['Scoreboard', loadScoreboard],
		['Stats', loadStats],
		['Panel', loadPanel]
	]);

	loadPanel();
}

const isNonNullable = <T>(value: T): value is NonNullable<T> => value !== null && value !== undefined;
function assertIsNonNullable<T>(value: T): asserts value is NonNullable<T> {
	if (!isNonNullable(value))
		throw new Error(`Expected a non-nullable value, but received: ${value}`);
}