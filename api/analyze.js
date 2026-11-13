const MAX_IMAGE_BYTES=5*1024*1024;
const PROMPT=`너는 한국 고등학교 수학·과학 손글씨 필기 복원 엔진이다. 이미지에 실제로 보이는 정보만 추출해라. 내용을 추측해 보완하거나 새로운 설명을 창작하지 마라. 수식은 KaTeX 호환 LaTeX로 표현해라. 구조를 순서대로 보존해라. 읽기 어려운 곳은 [확인 필요]라고 표기하고 confidence를 low로 둬라. bbox는 이미지 전체를 0~100 좌표로 정규화한 [x,y,width,height]로 주고 위치를 모르면 null로 둬라. confidence는 high/medium/low 중 하나로, 확률이 아니라 주관적 검토 표시다. JSON 객체만 반환해라: {"title":"...","subject":"...","summary":"한 줄 설명","blocks":[{"type":"heading|paragraph|equation|list|table|note","text":"...","confidence":"high|medium|low","bbox":[0,0,100,10]}],"warnings":["..."]}. 표는 행마다 list나 paragraph로 풀어도 된다.`;
export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'POST만 지원해.'});
 if(!process.env.GEMINI_API_KEY)return res.status(503).json({error:'서버에 GEMINI_API_KEY가 등록되지 않았어. Vercel 환경변수를 확인해.'});
 try{
 const {image,mimeType}=req.body||{};
 if(!['image/jpeg','image/png','image/webp'].includes(mimeType)||typeof image!=='string'||!/^[A-Za-z0-9+/]+={0,2}$/.test(image))return res.status(400).json({error:'JPG, PNG, WebP 이미지만 지원해.'});
 if(image.length*0.75>MAX_IMAGE_BYTES)return res.status(413).json({error:'이미지는 5MB 이하로 올려줘.'});
 const model=process.env.GEMINI_MODEL||'gemini-2.5-flash';
 const upstream=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':process.env.GEMINI_API_KEY},body:JSON.stringify({contents:[{role:'user',parts:[{text:PROMPT},{inlineData:{mimeType,data:image}}]}],generationConfig:{responseMimeType:'application/json',temperature:0.1,maxOutputTokens:8192}}),signal:AbortSignal.timeout(55000)});
 const body=await upstream.json().catch(()=>({}));
 if(!upstream.ok)return res.status(upstream.status===429?429:502).json({error:upstream.status===429?'Gemini 요청 한도에 도달했어. 잠시 후 다시 시도해.':`Gemini 요청 실패 (${upstream.status}): ${String(body.error?.message||'설정과 모델을 확인해.').slice(0,180)}`});
 const content=body.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('');
 if(!content)return res.status(502).json({error:'Gemini에서 텍스트 응답을 받지 못했어.'});
 let parsed;try{parsed=JSON.parse(content)}catch{return res.status(502).json({error:'AI 응답을 JSON으로 해석하지 못했어. 다시 시도해.'})}
 return res.status(200).json({result:parsed,model});
 }catch(err){return res.status(err.name==='TimeoutError'?504:502).json({error:err.name==='TimeoutError'?'AI 응답 시간이 초과됐어. 잠시 후 다시 시도해.':'AI 연결 중 문제가 발생했어. 잠시 후 다시 시도해.'});}
}
