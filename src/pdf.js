import html2canvas from 'html2canvas';
import {jsPDF} from 'jspdf';
import {equationHtml, mathHtml} from './math';

const margin = 14;
const paperWidth = 182;
const paperHeight = 269;
const captureWidth = 760;
const scale = 1.5;
const pagePixels = Math.floor(captureWidth * paperHeight / paperWidth);

function createBlock(kind, text) {
 const block = document.createElement('div');
 block.className = 'pdf-block';
 Object.assign(block.style, {
  padding: '8px 18px', boxSizing: 'border-box', lineHeight: '1.65',
  fontSize: kind === 'title' ? '28px' : kind === 'heading' ? '21px' : '17px',
  fontWeight: ['title', 'heading'].includes(kind) ? 'bold' : 'normal',
  overflowWrap: 'anywhere',
 });
 block.innerHTML = kind === 'equation' ? equationHtml(text, 'html') : mathHtml(text, 'html');
 return block;
}

function fitMath(block) {
 for (const formula of block.querySelectorAll('.katex-display, .katex:not(.katex-display .katex)')) {
  const bounds = formula.getBoundingClientRect();
  const naturalWidth = Math.max(bounds.width, formula.scrollWidth);
  const height = bounds.height;
  if (!naturalWidth || !height) continue;
  const ratio = Math.min(1, (captureWidth - 38) / naturalWidth, (pagePixels - 22) / height);
  if (ratio >= 1) continue;
  // Font sizing affects layout, so the next line and PDF page use the scaled height.
  formula.style.fontSize = parseFloat(getComputedStyle(formula).fontSize) * ratio + 'px';
 }
}

function findPageBreak(block, start, maxHeight) {
 const limit = start + maxHeight;
 const box = block.getBoundingClientRect();
 const occupied = [];
 const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, {
  acceptNode(node) {
   return node.parentElement.closest('.katex')
    ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
  },
 });
 const range = document.createRange();
 for (let node = walker.nextNode(); node; node = walker.nextNode()) {
  range.selectNodeContents(node);
  occupied.push(...range.getClientRects());
 }
 for (const math of block.querySelectorAll('.katex-display, .katex:not(.katex-display .katex)')) {
  occupied.push(math.getBoundingClientRect());
 }
 let split = limit;
 const intervals = occupied.map(rect => ({
  top: Math.floor(rect.top - box.top) - 1,
  bottom: Math.ceil(rect.bottom - box.top) + 1,
 })).sort((a, b) => b.top - a.top);
 for (const {top, bottom} of intervals) {
  if (top < split && split < bottom) split = top;
 }
 return split > start ? split - start : 0;
}

export async function downloadPdf(result) {
 const host = document.createElement('div');
 Object.assign(host.style, {
  position: 'absolute', left: '-10000px', top: '0', width: captureWidth + 'px',
  background: 'white', color: '#202639', fontFamily: 'Arial, sans-serif',
 });
 const blocks = [
  createBlock('title', result.title),
  createBlock('subject', result.subject),
  ...result.blocks.map(block => createBlock(block.type, block.text)),
 ];
 host.append(...blocks);
 document.body.append(host);
 try {
  // Trigger layout before waiting for the math and text fonts in the export DOM.
  host.getBoundingClientRect();
  await document.fonts.ready;
  const pdf = new jsPDF({orientation: 'portrait', unit: 'mm', format: 'a4', compress: true});
  let used = 0;
  function nextPage() {
   pdf.addPage();
   used = 0;
  }

  for (const block of blocks) {
   fitMath(block);
   const height = Math.ceil(block.getBoundingClientRect().height);
   if (height <= pagePixels && height > pagePixels - used) nextPage();
   for (let start = 0; start < height;) {
    const room = pagePixels - used;
    const remaining = height - start;
    const split = remaining <= room ? remaining : findPageBreak(block, start, room);
    if (split === 0 && used > 0) {
     nextPage();
     continue;
    }
    const band = split || Math.min(remaining, room);
    const canvas = await html2canvas(block, {
     backgroundColor: '#ffffff', scale, logging: false, width: captureWidth,
     y: start, height: band, windowWidth: 1200,
    });
    pdf.addImage(canvas, 'PNG', margin, margin + used * paperWidth / captureWidth,
     paperWidth, band * paperWidth / captureWidth, undefined, 'FAST');
    start += band;
    used += band;
    if (start < height) nextPage();
   }
  }
  pdf.save('NoteForge_필기.pdf');
 } finally {
  host.remove();
 }
}
