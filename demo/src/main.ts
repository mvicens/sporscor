import bodyHtmlContent from './body.html?raw';
import { buildSelection, buildSelector, setHtmlContent, setTheme } from './utils';
import './style.css'; // In order to overwrite, located after

setTheme();
setHtmlContent('body', bodyHtmlContent, () => {
	buildSelector(() => { buildSelection(); });
});