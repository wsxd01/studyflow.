import React, {useCallback, useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import 'katex/dist/katex.min.css';
import Quiz from './Quiz';
import './style.css';

function App() {
 const [selection, setSelection] = useState(null);
 const [preview, setPreview] = useState('');
 const [error, setError] = useState('');
 const file = selection?.file;

 useEffect(() => {
  if (!file) return;
  const url = URL.createObjectURL(file);
  setPreview(url);
  return () => URL.revokeObjectURL(url);
 }, [file]);

 const selectPhoto = useCallback(next => {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(next.type) ||
      !next.size || next.size > 3 * 1024 * 1024) {
   setError('3MB 이하 JPG, PNG, WebP 필기 사진을 선택해 줘.');
   return;
  }
  setError('');
  setSelection(previous => ({file: next, id: (previous?.id ?? 0) + 1}));
 }, []);

 useEffect(() => {
  function pastePhoto(event) {
   const photo = Array.from(event.clipboardData?.files ?? []).find(item => item.type.startsWith('image/'));
   if (!photo) return;
   event.preventDefault();
   selectPhoto(photo);
  }
  window.addEventListener('paste', pastePhoto);
  return () => window.removeEventListener('paste', pastePhoto);
 }, [selectPhoto]);

 function selectFile(event) {
  const next = event.target.files?.[0];
  event.target.value = '';
  if (next) selectPhoto(next);
 }

 return <main>
  <header>
   <span>NoteForge AI</span>
   <h1>필기에서 변형 문제 만들기</h1>
   <p>수학 또는 과학 필기 사진을 올리고, 배운 개념을 새 문제에 적용해 봐.</p>
  </header>
  <section className="upload" aria-label="필기 사진">
   <div>
    <label htmlFor="note">필기 사진 선택</label>
    <input id="note" type="file" accept="image/jpeg,image/png,image/webp" onChange={selectFile}/>
    <p>파일 선택 또는 붙여넣기 · JPG, PNG, WebP / 최대 3MB</p>
    {error && <p role="alert">{error}</p>}
   </div>
   {file && preview && <img src={preview} alt="선택한 필기 사진"/>}
  </section>
  {file && <Quiz key={selection.id} file={file}/>}
 </main>;
}

createRoot(document.getElementById('root')).render(<App/>);
