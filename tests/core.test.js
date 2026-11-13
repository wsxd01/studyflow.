import test from 'node:test';import assert from 'node:assert/strict';import{normalizeResult,statsFor,exportMarkdown,normalizeBox,filterBlocks,reviewBlocks,exportJSON,DEMO}from '../src/core.js';
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
