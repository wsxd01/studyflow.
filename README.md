# NoteForge AI 2.0 — 수학·과학 손글씨 디지털화

React + Vite + KaTeX + Vercel Serverless + Gemini Vision API.

## 개선점
- 원본 이미지 확대/축소, 추정 인식 영역 선택
- 변환된 필기 검색 및 검토 필요 항목 필터
- 블록별 검토 완료 표시 (현재 탭에서만 유지)
- LaTeX 수식 편집, Markdown/PDF/JSON 내보내기
- 이미지 좌표가 원본 경계를 넘지 않도록 검증
- API 실패 시 내부 오류 정보 노출 방지
- 예시 결과는 실제 이미지 인식과 명확히 구분

## 로컬 실행
```bash
npm install
npm run dev
npm test
npm run build
```

로컬 Vite 개발 서버만으로는 `/api/analyze` 서버리스 함수가 실행되지 않습니다. 실제 Gemini 호출은 Vercel 배포 후 테스트하세요.

## Vercel 배포
1. 압축을 풀고 GitHub 새 저장소에 **ZIP이 아닌 파일 전체**를 업로드합니다.
2. Vercel에서 Import → Vite → Root Directory `./` → Deploy.
3. Project Settings → Environment Variables → `GEMINI_API_KEY`를 서버 환경변수로 등록합니다.
4. Redeploy 후 개인 정보가 없는 수학·과학 필기 사진으로 테스트합니다.
5. `GEMINI_MODEL`은 선택사항이며 기본값은 `gemini-2.5-flash`입니다. 계정별 지원 모델과 요금·쿼터는 별도 확인이 필요합니다.

## 보안 및 한계
- API 키를 React 소스코드, GitHub, 채팅에 붙여넣지 마세요.
- 업로드된 이미지는 서버를 거쳐 Gemini로 전송됩니다. 개인 정보를 가린 사진만 사용하세요.
- 모델의 confidence는 실제 측정 정확도가 아닙니다. 수식은 원본과 반드시 대조하세요.
- 원본 좌표는 AI가 추정한 값입니다. 검토 완료 표시와 이미지는 새로고침 후 유지되지 않습니다.
- 학교 발표 전 실제 배포 주소에서 이미지 분석과 PDF 출력을 확인하세요.
