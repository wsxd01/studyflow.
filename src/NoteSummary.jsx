import React, {useEffect, useRef, useState} from 'react';
import {mathHtml} from './math';
import {equationSource} from './core';

function summarizeLocally(blocks) {
 const sections = [];
 let section = {heading: '핵심 문장과 수식', lines: []};
 for (const block of blocks) {
  const text = block.text.trim();
  if (!text) continue;
  if (block.type === 'heading') {
   if (section.lines.length) sections.push(section);
   section = {heading: text, lines: []};
   continue;
  }
  if (block.confidence === 'low' || text.includes('[확인 필요]')) continue;
  section.lines.push(block.type === 'equation' ? '$$' + equationSource(text) + '$$' : text);
 }
 if (section.lines.length) sections.push(section);
 return {
  overview: 'AI 요청 한도로 원문에서 핵심 문장과 수식을 모았어.',
  points: sections.slice(0, 6).map(({heading, lines}) => ({
   heading, detail: lines.slice(0, 3).join('\n'),
  })),
 };
}

export default function NoteSummary({note, blocks}) {
 const [summary, setSummary] = useState(null);
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState('');
 const request = useRef(null);

 useEffect(() => () => request.current?.abort(), []);

 async function organize() {
  if (request.current) return;
  const controller = new AbortController();
  request.current = controller;
  setBusy(true);
  setError('');
  try {
   const response = await fetch('/api/quiz', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({mode: 'summary', note}),
    signal: controller.signal,
   });
   const data = await response.json();
   if (response.status === 429) {
    const fallback = summarizeLocally(blocks);
    if (fallback.points.length) {
     setSummary(fallback);
     return;
    }
   }
   if (!response.ok) throw new Error(data.error);
   setSummary(data.summary);
  } catch (error) {
   if (!controller.signal.aborted) setError(error.message || '핵심 정리에 실패했어.');
  } finally {
   request.current = null;
   if (!controller.signal.aborted) setBusy(false);
  }
 }

 return <section className="note-summary" aria-label="필기 핵심 정리">
  {!summary && <button className="outline small" onClick={organize} disabled={busy}>
   {busy ? '핵심 정리 중…' : 'AI로 핵심 정리'}
  </button>}
  {error && <p role="alert">{error}</p>}
  {summary && <details open>
   <summary>핵심 정리</summary>
   <div className="mathpreview" dangerouslySetInnerHTML={{__html: mathHtml(summary.overview)}}/>
   <ul>{summary.points.map((point, index) => <li key={index}>
    <strong dangerouslySetInnerHTML={{__html: mathHtml(point.heading)}}/>
    <div className="mathpreview" dangerouslySetInnerHTML={{__html: mathHtml(point.detail)}}/>
   </li>)}</ul>
  </details>}
 </section>;
}
