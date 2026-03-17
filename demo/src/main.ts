import 'bootstrap/js/src/dropdown.js';
import bodyHtmlContent from './body.html?raw';
import { SPORTS } from './consts';
import { addChoice, buildDropdown, setHtmlContent, setTheme } from './utils';
import './style.css'; // In order to overwrite, located after

setTheme();
setHtmlContent('body', bodyHtmlContent, () => {
	buildDropdown('body', SPORTS.map(item => [item.name, () => { addChoice(item); }]));
});