export function normalizeBox(raw){
 if(!Array.isArray(raw)||raw.length!==4||raw.some(n=>!Number.isFinite(Number(n))))return null;
 let [x,y,w,h]=raw.map(Number);x=Math.max(0,Math.min(100,x));y=Math.max(0,Math.min(100,y));
 return [x,y,Math.max(0,Math.min(100-x,w)),Math.max(0,Math.min(100-y,h))];
}
export function reviewBlocks(result){return (result?.blocks||[]).map((block,index)=>({...block,index})).filter(b=>b.confidence!=='high'||b.text.includes('[확인 필요]'));}
export function filterBlocks(result,term,reviewOnly=false){const q=String(term||'').trim().toLowerCase();return (result?.blocks||[]).map((b,index)=>({...b,index})).filter(b=>(!reviewOnly||b.confidence!=='high'||b.text.includes('[확인 필요]'))&&(!q||b.text.toLowerCase().includes(q)||b.type.includes(q)));}
export function exportJSON(result){return JSON.stringify(result,null,2);}
export function normalizeResult(value){
  if(!value||typeof value!=='object')throw new Error('AI 응답이 올바른 객체가 아니야.');
  const blocks=Array.isArray(value.blocks)?value.blocks:[];
  const types=new Set(['heading','paragraph','equation','list','table','note']);
  return {title:String(value.title||'제목 없는 필기').slice(0,120),subject:String(value.subject||'과학').slice(0,40),summary:String(value.summary||'').slice(0,600),blocks:blocks.slice(0,80).map((b,i)=>({id:`block-${i}`,type:types.has(b.type)?b.type:'paragraph',text:String(b.text||'').slice(0,4000),confidence:['high','medium','low'].includes(b.confidence)?b.confidence:'medium',bbox:normalizeBox(b.bbox)})),warnings:Array.isArray(value.warnings)?value.warnings.map(String).slice(0,20):[]};
}
export function statsFor(result){const blocks=result?.blocks||[];return {total:blocks.length,equations:blocks.filter(b=>b.type==='equation').length,review:blocks.filter(b=>b.confidence!=='high').length};}
export function exportMarkdown(result){return `# ${result.title}\n\n${result.blocks.map(b=>b.type==='heading'?`## ${b.text}`:b.type==='equation'?`$$\n${b.text}\n$$`:b.type==='list'?`- ${b.text}`:b.text).join('\n\n')}\n`;}
export const DEMO={title:'뉴턴의 운동 법칙',subject:'물리학',summary:'힘과 가속도의 관계를 설명하는 필기',blocks:[{type:'heading',text:'뉴턴의 제2법칙',confidence:'high',bbox:[8,8,90,13]},{type:'paragraph',text:'물체의 가속도는 알짜힘에 비례하고 질량에 반비례한다.',confidence:'high',bbox:[8,26,87,13]},{type:'equation',text:'F = ma',confidence:'high',bbox:[24,45,49,12]},{type:'paragraph',text:'단위: 힘 N, 질량 kg, 가속도 m/s²',confidence:'medium',bbox:[8,66,84,12]},{type:'equation',text:'a = \\frac{F}{m}',confidence:'medium',bbox:[23,81,52,11]}],warnings:['예시 데이터는 실제 사진에서 추출한 결과가 아닙니다.']};
