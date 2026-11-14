import katex from 'katex';
import {equationSource, tokenizeMath} from './core';

function escapeHtml(text) {
 return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderMath(value, displayMode, raw, output) {
 try {
  return katex.renderToString(value, {
   displayMode, output, throwOnError: true, trust: false, strict: 'ignore',
  });
 } catch {
  return escapeHtml(raw);
 }
}

export function equationHtml(text, output) {
 return renderMath(equationSource(text), true, text, output);
}

export function mathHtml(text, output, bareArrows = false) {
 return tokenizeMath(text).map(part => part.type === 'text'
  ? escapeHtml(bareArrows ? part.value.replace(/\\(?:rightarrow|to)(?![a-zA-Z])/g, '→') : part.value).replace(/\n/g, '<br>')
  : renderMath(part.value, part.display, part.raw, output)
 ).join('');
}
