import bodyHtmlContent from './body.html?raw';
import { buildSelection, buildSelector, setHtmlContent, setTheme } from './utils';
import './style.css'; // To overwrite, after

setTheme();
setHtmlContent('body', bodyHtmlContent, () => {
	buildSelector(() => { buildSelection(); });
});