import React, {useEffect, useRef, useState} from 'react';
import {mathHtml} from './math';

function QuizText({text}) {
 return <div className="mathpreview" dangerouslySetInnerHTML={{__html: mathHtml(text)}}/>;
}

export default function Quiz({note, blocked}) {
 const [questions, setQuestions] = useState(null);
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState('');
 const request = useRef(null);

 useEffect(() => () => request.current?.abort(), []);

 async function createQuiz() {
  if (request.current) return;
  const controller = new AbortController();
  request.current = controller;
  setBusy(true);
  setError('');
  try {
   const response = await fetch('/api/quiz', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({note}), signal: controller.signal,
   });
   const data = await response.json();
   if (!response.ok) throw new Error(data.error || '문제 생성에 실패했어.');
   setQuestions(data.questions);
  } catch (error) {
   if (!controller.signal.aborted) setError(error.message);
  } finally {
   request.current = null;
   if (!controller.signal.aborted) setBusy(false);
  }
 }

 return <section className="quiz panel" aria-label="필기 연습 문제">
  <div className="quiz-header">
   <h2>필기 연습 문제</h2>
   <button className="primary" disabled={busy || blocked} onClick={createQuiz}>
    {busy ? '문제 만들고 확인하는 중…' : questions ? '새 문제 만들기' : '이 필기로 문제 만들기'}
   </button>
  </div>
  {error && <p role="alert">{error}</p>}
  {questions && <ol>
   {questions.map((q, index) => <li key={q.question}>
    <h3>{['개념 확인', '계산·자료 해석', '응용'][index]}</h3>
    <QuizText text={q.question}/>
    <details>
     <summary>정답과 해설</summary>
     <p><strong>정답</strong></p>
     <QuizText text={q.answer}/>
     <QuizText text={q.explanation}/>
     <p><strong>관련 필기 개념</strong></p>
     <QuizText text={q.basis}/>
    </details>
   </li>)}
  </ol>}
 </section>;
}
