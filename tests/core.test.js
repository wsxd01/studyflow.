import test from 'node:test';import assert from 'node:assert/strict';import{normalizeResult,statsFor,exportMarkdown,normalizeBox,filterBlocks,reviewBlocks,exportJSON,tokenizeMath,equationSource,pageSliceHeights,DEMO}from '../src/core.js';
test('normalizes valid demo',()=>{const r=normalizeResult(DEMO);assert.equal(r.blocks.length,5);assert.equal(statsFor(r).equations,2)});
test('invalid response rejected',()=>assert.throws(()=>normalizeResult(null)));
test('unknown types fallback',()=>assert.equal(normalizeResult({blocks:[{type:'weird',text:'hi'}]}).blocks[0].type,'paragraph'));
test('bounding boxes constrained',()=>assert.deepEqual(normalizeResult({blocks:[{bbox:[-10,30,200,9]}]}).blocks[0].bbox,[0,30,100,9]));
test('markdown exports equations',()=>assert.match(exportMarkdown(normalizeResult(DEMO)),/\$\$\nF = ma/));
test('confidence fallback',()=>assert.equal(normalizeResult({blocks:[{confidence:'unknown'}]}).blocks[0].confidence,'medium'));

test('bbox stays within image',()=>assert.deepEqual(normalizeBox([80,90,40,30]),[80,90,20,10]));
test('invalid bbox rejected',()=>assert.equal(normalizeBox([1,2,NaN,4]),null));
test('search finds equations',()=>assert.equal(filterBlocks(normalizeResult(DEMO),'F = ma').length,1));
test('review filter excludes high confidence',()=>assert.equal(filterBlocks(normalizeResult(DEMO),'',true).length,2));
test('review blocks keep original indices',()=>assert.deepEqual(reviewBlocks(normalizeResult(DEMO)).map(x=>x.index),[3,4]));
test('JSON export roundtrips',()=>assert.equal(JSON.parse(exportJSON(normalizeResult(DEMO))).blocks.length,5));

test('inline and display math tokenized',()=>{const t=tokenizeMath(String.raw`함수 $f^{-1}$ 와 \[x^2\]`);assert.equal(t.filter(x=>x.type==='math').length,2);assert.equal(t[1].value,'f^{-1}')});
test('no math stays literal',()=>assert.deepEqual(tokenizeMath('한글 문장'),[{type:'text',value:'한글 문장'}]));
test('long block split into page sized slices',()=>{const slices=pageSliceHeights(1000,7000);assert.ok(slices.length>1);assert.equal(slices.reduce((n,x)=>n+x.height,0),7000)});
test('invalid page dimensions are safe',()=>assert.deepEqual(pageSliceHeights(0,300),[]));
test('long notes are not truncated at 4000 characters',()=>assert.equal(normalizeResult({blocks:[{text:'가'.repeat(8000)}]}).blocks[0].text.length,8000));

test('equation delimiters are accepted without changing raw LaTeX', () => {
 const latex = String.raw`\frac{1}{2}`;
 for (const input of [latex, '$'+latex+'$', '$$'+latex+'$$', '\\('+latex+'\\)', '\\['+latex+'\\]']) {
  assert.equal(equationSource(input), latex);
 }
});
test('Markdown gives edited equations one set of display delimiters', () => {
 const note = normalizeResult({blocks: [{type: 'equation', text: String.raw`$$\sqrt{x}$$`}]});
 assert.match(exportMarkdown(note), /\n\$\$\n\\sqrt\{x\}\n\$\$\n$/);
});
