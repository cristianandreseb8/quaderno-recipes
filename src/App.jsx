import React, { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from './lib/supabase.js'
import jsPDF from 'jspdf'

const CSS = `
.Q{--paper:#FAF7F0;--ink:#221C18;--muted:#6E645C;--rule:#E6DECF;--navy:#1F3A4D;
  --amber:#BC6C2C;--warm:#FBEFE1;--green:#2D6A4F;
  --serif:Georgia,"Iowan Old Style",serif;
  --sans:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;
  --mono:ui-monospace,"SF Mono","Menlo",monospace;
  font-family:var(--sans);color:var(--ink);background:var(--paper);min-height:100vh;
  display:flex;flex-direction:column}
.Q *{box-sizing:border-box}
.Q-top{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:12px 20px;
  border-bottom:1px solid var(--rule);background:var(--paper);position:sticky;top:0;z-index:20}
.Q-brand{font-family:var(--serif);font-size:21px;color:var(--navy);white-space:nowrap}
.Q-brand small{font-family:var(--mono);font-size:9.5px;color:var(--muted);
  text-transform:uppercase;letter-spacing:.2em;margin-left:8px}
.Q-top-right{margin-left:auto;display:flex;gap:7px;align-items:center}
.btn{font-family:var(--sans);font-size:12px;font-weight:600;cursor:pointer;
  border:1.5px solid var(--navy);background:transparent;color:var(--navy);
  padding:6px 11px;border-radius:6px;transition:background .13s,color .13s;white-space:nowrap}
.btn:hover{background:var(--navy);color:var(--paper)}
.btn:focus-visible{outline:2px solid var(--amber);outline-offset:2px}
.btn:disabled{opacity:.4;cursor:default}
.btn.amber{border-color:var(--amber);color:var(--amber)}
.btn.amber:hover{background:var(--amber);color:#fff}
.btn.ghost{border-color:var(--rule);color:var(--muted)}
.btn.ghost:hover{background:#ede6d9;color:var(--ink)}
.btn.green{border-color:var(--green);color:var(--green)}
.btn.green:hover{background:var(--green);color:#fff}
.btn.danger{border-color:#9b2c2c;color:#9b2c2c}
.btn.danger:hover{background:#9b2c2c;color:#fff}
.btn.xs{font-size:10.5px;padding:4px 8px}
.Q-body{flex:1;display:grid;grid-template-columns:282px 1fr;min-height:0}
.Q-side{border-right:1px solid var(--rule);display:flex;flex-direction:column;min-height:0}
.Q-search{padding:10px 12px;border-bottom:1px solid var(--rule)}
.Q-search input{width:100%;border:1px solid var(--rule);background:#fff;
  border-radius:6px;padding:7px 10px;font-size:12.5px;font-family:var(--sans);color:var(--ink)}
.Q-search input:focus{outline:none;border-color:var(--navy)}
.Q-list{overflow:auto;flex:1}
.Q-list-item{width:100%;text-align:left;background:none;border:none;cursor:pointer;
  padding:10px 13px;border-bottom:1px solid var(--rule);display:block}
.Q-list-item:hover{background:#f3ede0}
.Q-list-item[aria-selected=true]{background:#fff;box-shadow:inset 3px 0 0 var(--amber)}
.Q-list-item h4{font-family:var(--serif);font-size:14.5px;font-weight:600;margin:0 0 2px}
.Q-list-item span{font-family:var(--mono);font-size:9.5px;color:var(--muted);
  text-transform:uppercase;letter-spacing:.1em}
.Q-msg{padding:20px 14px;color:var(--muted);font-size:12.5px;line-height:1.6}
.Q-main{overflow:auto}
.Q-pane{max-width:760px;margin:0 auto;padding:30px 38px 100px}
.Q-view{animation:vfade .25s ease both}
@keyframes vfade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.Q-view h1{font-family:var(--serif);font-size:28px;line-height:1.18;margin:0 0 10px}
.Q-meta{display:flex;flex-wrap:wrap;gap:16px;padding-bottom:14px;
  border-bottom:2px solid var(--ink);margin-bottom:16px}
.Q-meta-item dt{font-family:var(--mono);font-size:9px;text-transform:uppercase;
  letter-spacing:.14em;color:var(--muted);margin-bottom:2px}
.Q-meta-item dd{margin:0;font-size:13px;font-weight:600}
.Q-banner{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:7px;
  font-size:12px;margin-bottom:12px}
.Q-banner.scale{background:#EAF2EE;border:1px solid #a8d5bc;color:var(--green)}
.Q-banner.trans{background:#EEF1F5;border:1px solid #b8c8d8;color:var(--navy)}
.Q-banner button{margin-left:auto;font-size:11px;font-family:var(--mono);
  background:none;border:none;cursor:pointer;text-decoration:underline;color:inherit}
.Q-toolbar{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:18px;align-items:center}
.Q-toolbar .right{margin-left:auto;display:flex;gap:6px}
.Q-scale-panel{background:#fff;border:1px solid var(--rule);border-radius:9px;
  padding:14px 16px;margin-bottom:18px;display:flex;flex-direction:column;gap:10px}
.Q-scale-panel h4{font-family:var(--mono);font-size:10px;text-transform:uppercase;
  letter-spacing:.16em;color:var(--navy);margin:0 0 2px}
.Q-scale-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.Q-scale-row label{font-size:12.5px;color:var(--muted);white-space:nowrap}
.Q-scale-row input{border:1px solid var(--rule);border-radius:5px;padding:5px 8px;
  width:80px;font-size:13px;font-family:var(--mono);color:var(--ink)}
.Q-scale-row input:focus{outline:none;border-color:var(--navy)}
.Q-pct-bar{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:8px}
.Q-pct-bar label{font-family:var(--mono);font-size:9.5px;text-transform:uppercase;
  letter-spacing:.14em;color:var(--navy)}
.Q-pct-bar select{border:1px solid var(--rule);border-radius:5px;padding:4px 6px;
  font-size:11.5px;font-family:var(--mono);color:var(--ink);background:#fff}
.Q-sec-h{display:flex;align-items:center;gap:8px;margin:20px 0 8px;font-family:var(--mono);
  font-size:10px;text-transform:uppercase;letter-spacing:.18em;color:var(--navy)}
.Q-sec-h::before,.Q-sec-h::after{content:'';flex:1;height:1px;background:var(--rule)}
.Q-ings{list-style:none;padding:0;margin:0 0 4px}
.Q-ing-row{display:flex;align-items:baseline;gap:0;padding:6px 0;
  border-bottom:1px dotted var(--rule);cursor:pointer;border-radius:4px;
  transition:background .12s}
.Q-ing-row:hover{background:#f5efea}
.Q-ing-check{width:22px;min-width:22px;height:20px;display:flex;align-items:center;
  justify-content:center;font-size:11px;color:var(--muted)}
.Q-ing-row.checked{background:#FCEBD9}
.Q-ing-row.checked .Q-ing-check{color:var(--amber)}
.Q-ing-row.checked .Q-ing-qty,.Q-ing-row.checked .Q-ing-name{
  color:var(--amber);text-decoration:line-through;text-decoration-color:rgba(188,108,44,.4)}
.Q-ing-qty{font-family:var(--mono);font-size:12px;color:var(--muted);
  min-width:88px;text-align:right;white-space:nowrap;padding-right:10px}
.Q-ing-name{font-size:13.5px;flex:1}
.Q-pct-badge{font-family:var(--mono);font-size:10.5px;color:var(--muted);
  margin-left:8px;white-space:nowrap;min-width:48px;text-align:right}
.Q-pct-badge.base{color:var(--amber);font-weight:700}
.Q-subtotal{font-family:var(--mono);font-size:10px;color:var(--muted);
  text-align:right;padding:5px 0;letter-spacing:.04em;border-top:1px solid var(--rule)}
.Q-grand-total{font-family:var(--mono);font-size:11px;font-weight:700;color:var(--navy);
  text-align:right;padding:8px 0;border-top:2px solid var(--navy);margin-bottom:24px}
.Q-steps-label{font-family:var(--mono);font-size:10px;text-transform:uppercase;
  letter-spacing:.18em;color:var(--navy);margin:0 0 10px}
.Q-steps{list-style:none;padding:0;margin:0;counter-reset:s}
.Q-steps li{counter-increment:s;position:relative;padding:7px 12px 12px 42px;
  font-size:13.5px;line-height:1.6;border-radius:6px;transition:background .15s}
.Q-steps li::before{content:counter(s,decimal-leading-zero);position:absolute;
  left:0;top:8px;font-family:var(--mono);font-size:11px;color:var(--amber);
  font-weight:700;width:38px;text-align:right}
.Q-steps li.highlighted{background:#FCEBD9;border-left:3px solid var(--amber)}
.Q-steps li.highlighted::before{color:var(--navy)}
.Q-notes{margin-top:18px;padding:12px 14px;background:#fff;border:1px solid var(--rule);
  border-left:3.5px solid var(--amber);border-radius:7px;font-size:13px;
  line-height:1.55;color:var(--muted)}
.Q-view-foot{margin-top:26px;display:flex;gap:7px;flex-wrap:wrap}
.Q-hero{max-width:500px;margin:10vh auto 0;text-align:center;padding:20px}
.Q-hero .glyph{font-family:var(--serif);font-size:60px;color:var(--amber);line-height:1}
.Q-hero h2{font-family:var(--serif);font-size:22px;margin:14px 0 7px}
.Q-hero p{color:var(--muted);font-size:13px;line-height:1.65;margin:0 auto 20px;max-width:360px}
.Q-ed h2{font-family:var(--serif);font-size:22px;margin:0 0 20px}
.Q-field{margin-bottom:13px}
.Q-field label{display:block;font-family:var(--mono);font-size:9.5px;text-transform:uppercase;
  letter-spacing:.14em;color:var(--muted);margin-bottom:4px}
.Q-field input,.Q-field textarea{width:100%;border:1px solid var(--rule);background:#fff;
  border-radius:6px;padding:8px 10px;font-size:13px;font-family:var(--sans);
  color:var(--ink);resize:vertical}
.Q-field textarea.mono{font-family:var(--mono);font-size:12px;line-height:1.8}
.Q-field input:focus,.Q-field textarea:focus{outline:none;border-color:var(--navy)}
.Q-field .hint{font-size:10.5px;color:var(--muted);margin-top:4px;line-height:1.5}
.Q-grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.Q-ed-foot{display:flex;gap:7px;margin-top:20px;flex-wrap:wrap}
.Q-thumbs{display:flex;gap:7px;flex-wrap:wrap;margin:10px 0 4px}
.Q-thumb{position:relative;width:66px;height:66px;border-radius:5px;
  overflow:hidden;border:1px solid var(--rule)}
.Q-thumb img{width:100%;height:100%;object-fit:cover;display:block}
.Q-thumb button{position:absolute;top:2px;right:2px;width:17px;height:17px;border:none;
  border-radius:50%;background:rgba(0,0,0,.65);color:#fff;cursor:pointer;font-size:10px;
  line-height:1;padding:0}
.Q-err{color:#9b2c2c;font-size:11.5px;margin-top:7px;line-height:1.5}
.Q-back-btn{display:none}
@media(max-width:700px){
  .Q-body{grid-template-columns:1fr}
  .Q-side{display:flex}.Q-main{display:none}
  .Q[data-open="1"] .Q-side{display:none}
  .Q[data-open="1"] .Q-main{display:block}
  .Q-back-btn{display:inline-flex}
  .Q-pane{padding:18px 16px 80px}
  .Q-toolbar .right{margin-left:0}}
@media(prefers-reduced-motion:reduce){.Q-view{animation:none}}
`

/* ── Utilities ──────────────────────────────────────────────────── */
const uid = () => Math.random().toString(36).slice(2,9) + Date.now().toString(36)
function parseIng(text) {
  const t = String(text||'').trim()
  const m = t.match(/^([\d.,]+(?:\/[\d.,]+)?)\s*([a-zA-Z%]*)\s{1,}(.+)$/)
  if (!m) return { qty:null, unit:'', name:t }
  const qty = m[1].includes('/') ? m[1].split('/').reduce((a,b)=>parseFloat(a)/parseFloat(b))
    : parseFloat(m[1].replace(',','.'))
  return { qty, unit:m[2].toLowerCase(), name:m[3].trim() }
}
function toGrams(qty,unit) {
  if (!qty||isNaN(qty)) return 0
  const u=unit||''
  if(u==='kg') return qty*1000
  if(u==='l') return qty*1000
  if(u==='ml') return qty
  if(u==='%') return 0
  return qty
}
const FLOUR_WORDS=['flour','farina','harina','mehl','farine','semolina','semola','manitoba','grano']
function isFlour(name){ const n=(name||'').toLowerCase(); return FLOUR_WORDS.some(k=>n.includes(k)) }
function fmtQty(q){
  if(q>=100) return String(Math.round(q))
  if(q>=10) return (Math.round(q*10)/10).toFixed(1)
  return (Math.round(q*100)/100).toFixed(q<1?2:1)
}
function parseSections(ingredients) {
  const sections=[], ings=ingredients||[]
  let cur={name:null,items:[],rawIndices:[]}
  ings.forEach((ing,rawIdx)=>{
    if(/^##?\s+/.test(ing)){
      if(cur.items.length>0||cur.name!==null) sections.push(cur)
      cur={name:ing.replace(/^##?\s*/,'').trim(),items:[],rawIndices:[]}
    } else { cur.items.push(ing); cur.rawIndices.push(rawIdx) }
  })
  if(cur.items.length>0||cur.name!==null) sections.push(cur)
  if(!sections.length) return [{name:null,items:ings,rawIndices:ings.map((_,i)=>i)}]
  return sections
}
function calcPct(items,mode,customBase) {
  const parsed=items.map(ing=>{const p=parseIng(ing);return{...p,grams:toGrams(p.qty,p.unit)}})
  let baseG=0
  if(mode==='baker') baseG=parsed.filter(p=>isFlour(p.name)).reduce((s,p)=>s+p.grams,0)
  else if(mode==='mass') baseG=parsed.reduce((s,p)=>s+p.grams,0)
  else if(mode==='custom'&&customBase){
    const b=parsed.find(p=>p.name.toLowerCase().includes(customBase.toLowerCase()))
    baseG=b?b.grams:0
  }
  return parsed.map(p=>({...p,pct:baseG>0&&p.grams>0?(p.grams/baseG*100):null,
    isBase:mode==='custom'&&customBase&&p.name.toLowerCase().includes(customBase.toLowerCase())}))
}
function getTotalGrams(ingredients) {
  return (ingredients||[]).reduce((s,ing)=>{
    if(/^##?\s+/.test(ing)) return s
    const p=parseIng(ing); return s+toGrams(p.qty,p.unit)
  },0)
}
function scaleRecipe(recipe,factor) {
  return {...recipe, ingredients:(recipe.ingredients||[]).map(ing=>{
    if(/^##?\s+/.test(ing)) return ing
    const p=parseIng(ing); if(p.qty===null) return ing
    return ${fmtQty(p.qty*factor)}${p.unit?' '+p.unit:''}  ${p.name}
  })}
}
function findStepsForIng(ingName,steps) {
  const words=ingName.toLowerCase().split(/\s+/).filter(w=>w.length>3)
  if(!words.length) return new Set()
  const result=new Set()
  ;(steps||[]).forEach((step,i)=>{ const s=step.toLowerCase(); if(words.some(w=>s.includes(w))) result.add(i) })
  return result
}

/* ── Image compression ──────────────────────────────────────── */
function compressImage(file,maxW=1024) {
  return new Promise((res,rej)=>{
    const img=new Image(), url=URL.createObjectURL(file)
    img.onload=()=>{
      const scale=Math.min(1,maxW/img.width)
      const cv=document.createElement('canvas')
      cv.width=Math.round(img.width*scale); cv.height=Math.round(img.height*scale)
      cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height)
      URL.revokeObjectURL(url)
      cv.toBlob(blob=>{
        if(!blob){rej(new Error('Compression failed'));return}
        const reader=new FileReader()
        reader.onload=()=>res({media_type:'image/jpeg',data:reader.result.split(',')[1],url:cv.toDataURL('image/jpeg',.7)})
        reader.onerror=rej; reader.readAsDataURL(blob)
      },'image/jpeg',.7)
    }
    img.onerror=()=>{URL.revokeObjectURL(url);rej(new Error('Load failed'))}; img.src=url
  })
}

/* ── PDF Export (npm jsPDF) ─────────────────────────────────────── */
function exportPDF(recipe) {
  const doc=new jsPDF({unit:'mm',format:'a4'})
  const M=18,PW=210,CW=PW-M*2; let y=0
  function ck(n=12){if(y+n>279){doc.addPage();y=M}}
  doc.setFillColor(31,58,77);doc.rect(0,0,PW,4,'F');y=14
  doc.setFont('helvetica','bold');doc.setFontSize(22);doc.setTextColor(31,58,77)
  const tl=doc.splitTextToSize(recipe.title||'Recipe',CW);doc.text(tl,M,y);y+=tl.length*9
  doc.setDrawColor(188,108,44);doc.setLineWidth(1.5);doc.line(M,y,M+28,y);y+=7
  const meta=[recipe.category&&${recipe.category},recipe.time&&${recipe.time},
    recipe.servings&&${recipe.servings}].filter(Boolean)
  if(meta.length){doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(110,100,92);doc.text(meta.join('   ·   '),M,y);y+=9}
  const sections=parseSections(recipe.ingredients||[])
  const totalG=getTotalGrams(recipe.ingredients||[])
  y+=4;doc.setFont('helvetica','bold');doc.setFontSize(8);doc.setTextColor(31,58,77);doc.text('INGREDIENTS',M,y);y+=6
  sections.forEach(sec=>{
    if(sec.name){ck(12);y+=2;doc.setFont('helvetica','bolditalic');doc.setFontSize(9.5);doc.setTextColor(188,108,44);doc.text(sec.name,M,y);y+=6}
    sec.items.forEach(ing=>{
      ck(7);const mm=ing.match(/^([\d.,]+\s*[^\s]+)\s{2,}(.+)$/)||ing.match(/^([\d.,]+\s*[a-zA-Z%]+)\s+(.+)$/)
      doc.setFont('helvetica','normal');doc.setFontSize(10);doc.setTextColor(34,28,24)
      if(mm){doc.setFont('courier','normal');doc.text(mm[1].trim(),M,y);doc.setFont('helvetica','normal');const ls=doc.splitTextToSize(mm[2].trim(),CW-36);doc.text(ls,M+36,y);y+=ls.length*5+1}
      else{const ls=doc.splitTextToSize(`· ${ing}`,CW);doc.text(ls,M,y);y+=ls.length*5+1}
    })
    const secG=sec.items.reduce((s,i)=>{const p=parseIng(i);return s+toGrams(p.qty,p.unit)},0)
    if(sec.name&&secG>0){doc.setFont('courier','normal');doc.setFontSize(8.5);doc.setTextColor(110,100,92);doc.text(`Subtotal: ${secG.toFixed(0)} g`,PW-M,y,{align:'right'});y+=6}
  })
  if(totalG>0){doc.setFont('helvetica','bold');doc.setFontSize(9);doc.setTextColor(31,58,77);doc.text(`Total: ${totalG.toFixed(0)} g`,PW-M,y,{align:'right'});y+=8}
  if(recipe.steps?.length){
    ck(12);y+=3;doc.setFont('helvetica','bold');doc.setFontSize(8);doc.setTextColor(31,58,77);doc.text('METHOD',M,y);y+=6
    recipe.steps.forEach((step,i)=>{
      ck(10);const ls=doc.splitTextToSize(step,CW-14)
      doc.setFont('helvetica','bold');doc.setFontSize(10);doc.setTextColor(188,108,44);doc.text(String(i+1).padStart(2,'0')+'.',M,y)
      doc.setFont('helvetica','normal');doc.setTextColor(34,28,24);doc.text(ls,M+14,y);y+=ls.length*5.5+3
    })
  }
  if(recipe.notes){
    ck(18);y+=3;const nl=doc.splitTextToSize(recipe.notes,CW-9);const bh=nl.length*5.5+10
    doc.setFillColor(251,239,225);doc.setDrawColor(188,108,44);doc.setLineWidth(0.2);doc.rect(M,y,CW,bh,'FD')
    doc.setFillColor(188,108,44);doc.rect(M,y,2.5,bh,'F')
    doc.setFont('helvetica','italic');doc.setFontSize(9.5);doc.setTextColor(110,100,92);doc.text(nl,M+5,y+7);y+=bh
  }
  const total=doc.internal.getNumberOfPages()
  for(let p=1;p<=total;p++){
    doc.setPage(p);doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(180,170,160)
    doc.text('Quaderno · Recipe Book',M,292);doc.text(`${new Date().toLocaleDateString()}  ·  ${p}/${total}`,PW-M,292,{align:'right'})
    doc.setFillColor(31,58,77);doc.rect(0,294,PW,2,'F')
  }
  doc.save((recipe.title||'recipe').replace(/[^a-z0-9]+/gi,'-').toLowerCase()+'.pdf')
}

/* ── Image Export (Canvas API) ────────────────────────────────────── */
function exportImage(recipe) {
  const W=1200,M=68,CW=W-M*2,DPR=2,TMP_H=6000
  const cv=document.createElement('canvas');cv.width=W*DPR;cv.height=TMP_H*DPR
  const ctx=cv.getContext('2d');ctx.scale(DPR,DPR)
  ctx.fillStyle='#FAF7F0';ctx.fillRect(0,0,W,TMP_H);let y=0
  function gl(text,maxW){const words=String(text||'').split(' ');const lines=[];let line='';for(const w of words){const t=line?line+' '+w:w;if(ctx.measureText(t).width>maxW&&line){lines.push(line);line=w}else line=t};if(line)lines.push(line);return lines}
  function dt(text,x,yy,maxW,lh){const ls=gl(text,maxW);ls.forEach((l,i)=>ctx.fillText(l,x,yy+i*lh));return ls.length*lh}
  function rrect(x,yy,w,h,r){ctx.beginPath();ctx.moveTo(x+r,yy);ctx.arcTo(x+w,yy,x+w,yy+h,r);ctx.arcTo(x+w,yy+h,x,yy+h,r);ctx.arcTo(x,yy+h,x,yy,r);ctx.arcTo(x,yy,x+w,yy,r);ctx.closePath()}
  ctx.fillStyle='#1F3A4D';ctx.fillRect(0,0,W,10);y=62
  ctx.font='bold 44px Georgia,serif';ctx.fillStyle='#1F3A4D';y+=dt(recipe.title||'Recipe',M,y,CW,56)
  ctx.strokeStyle='#BC6C2C';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(M,y+5);ctx.lineTo(M+110,y+5);ctx.stroke();y+=22
  const metaParts=[recipe.category,recipe.time&&`⏱ ${recipe.time}`,recipe.servings&&`⚖ ${recipe.servings}`].filter(Boolean)
  if(metaParts.length){ctx.font='17px -apple-system,sans-serif';ctx.fillStyle='#6E645C';ctx.fillText(metaParts.join('   ·   '),M,y);y+=34}
  y+=10;ctx.strokeStyle='#E6DECF';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(M,y);ctx.lineTo(W-M,y);ctx.stroke();y+=28
  function secLabel(label,off){ctx.font='bold 11px ui-monospace,monospace';ctx.fillStyle='#1F3A4D';ctx.fillText(label,M,y);ctx.strokeStyle='#1F3A4D';ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(M+off,y-3);ctx.lineTo(W-M,y-3);ctx.stroke();y+=24}
  const sections=parseSections(recipe.ingredients||[])
  secLabel('INGREDIENTS',112)
  sections.forEach(sec=>{
    if(sec.name){ctx.font='bold italic 17px Georgia,serif';ctx.fillStyle='#BC6C2C';ctx.fillText(sec.name,M,y);y+=28}
    sec.items.forEach(ing=>{
      const mm=ing.match(/^([\d.,]+\s*[^\s]+)\s{2,}(.+)$/)||ing.match(/^([\d.,]+\s*[a-zA-Z%]+)\s+(.+)$/)
      if(mm){ctx.font='16px ui-monospace,monospace';ctx.fillStyle='#6E645C';ctx.fillText(mm[1].trim(),M,y);ctx.font='17px -apple-system,sans-serif';ctx.fillStyle='#221C18';y+=Math.max(26,dt(mm[2].trim(),M+186,y,CW-186,26))+3}
      else{ctx.font='17px -apple-system,sans-serif';ctx.fillStyle='#221C18';y+=dt(`· ${ing}`,M+10,y,CW-10,26)+3}
    })
    const sg=sec.items.reduce((s,i)=>{const p=parseIng(i);return s+toGrams(p.qty,p.unit)},0)
    if(sec.name&&sg>0){ctx.font='12px ui-monospace,monospace';ctx.fillStyle='#BC6C2C';ctx.textAlign='right';ctx.fillText(`Subtotal: ${sg.toFixed(0)} g`,W-M,y);ctx.textAlign='left';y+=18}
  })
  const tg=getTotalGrams(recipe.ingredients||[])
  if(tg>0){ctx.font='bold 13px ui-monospace,monospace';ctx.fillStyle='#1F3A4D';ctx.textAlign='right';ctx.fillText(`Total: ${tg.toFixed(0)} g`,W-M,y);ctx.textAlign='left';y+=26}
  if(recipe.steps?.length){
    secLabel('METHOD',76)
    recipe.steps.forEach((step,i)=>{ctx.font='bold 17px -apple-system,sans-serif';ctx.fillStyle='#BC6C2C';ctx.fillText(String(i+1).padStart(2,'0')+'.',M,y);ctx.font='17px -apple-system,sans-serif';ctx.fillStyle='#221C18';y+=Math.max(27,dt(step,M+46,y,CW-46,27))+7})
  }
  if(recipe.notes){ctx.font='italic 15px -apple-system,sans-serif';const nl=gl(recipe.notes,CW-44);const bh=nl.length*27+36;rrect(M,y,CW,bh,8);ctx.fillStyle='#FBEFE1';ctx.fill();ctx.fillStyle='#BC6C2C';ctx.fillRect(M,y,4,bh);ctx.fillStyle='#6E645C';nl.forEach((l,i)=>ctx.fillText(l,M+16,y+24+i*27));y+=bh+20}
  y+=12;ctx.strokeStyle='#E6DECF';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(M,y);ctx.lineTo(W-M,y);ctx.stroke();y+=20
  ctx.font='12px ui-monospace,monospace';ctx.fillStyle='#B0A89F';ctx.fillText('Quaderno · Recipe Book',M,y);ctx.textAlign='right';ctx.fillText(new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}),W-M,y);ctx.textAlign='left';y+=18;ctx.fillStyle='#1F3A4D';ctx.fillRect(0,y,W,10);y+=10
  const out=document.createElement('canvas');out.width=W*DPR;out.height=y*DPR;out.getContext('2d').drawImage(cv,0,0,W*DPR,y*DPR,0,0,W*DPR,y*DPR)
  const a=document.createElement('a');a.href=out.toDataURL('image/png');a.download=(recipe.title||'recipe').replace(/[^a-z0-9]+/gi,'-').toLowerCase()+'.png';document.body.appendChild(a);a.click();document.body.removeChild(a)
}

/* ── Supabase helpers ──────────────────────────────────────────────────── */
function toDb(r){return{id:r.id,title:r.title,category:r.category,time_estimate:r.time,servings:r.servings,notes:r.notes,source:r.source,ingredients:r.ingredients||[],steps:r.steps||[]}}
function fromDb(r){return{...r,time:r.time_estimate}}
async function dbLoad(){const{data,error}=await supabase.from('recipes').select('*').order('created_at',{ascending:false});if(error)throw error;return(data||[]).map(fromDb)}
async function dbInsert(r){const payload={...toDb(r)};delete payload.id;const{data,error}=await supabase.from('recipes').insert([payload]).select().single();if(error)throw error;return fromDb(data)}
async function dbUpdate(r){const{data,error}=await supabase.from('recipes').update(toDb(r)).eq('id',r.id).select().single();if(error)throw error;return fromDb(data)}
async function dbDelete(id){const{error}=await supabase.from('recipes').delete().eq('id',id);if(error)throw error}

/* ── Claude via Edge Function ──────────────────────────────────────────────── */
async function invoke(body){
  const{data,error}=await supabase.functions.invoke('extract-recipe',{body})
  if(error)throw new Error(error.message)
  if(data?.error)throw new Error(data.error)
  return data
}

async function extractWithClaude(images){return invoke({images})}
async function structureText(text){return invoke({type:'structure',text})}
async function translateRecipe(recipe,targetLang){
  // Try Edge Function first
  try{ return await invoke({type:'translate',recipe,targetLang}) }
  catch(e1){
    // Edge Function might not support translation yet — try direct approach
    const{data,error}=await supabase.functions.invoke('extract-recipe',{
      body:{type:'translate',recipe,targetLang}
    })
    if(error) throw new Error('Translation unavailable. Go to Supabase dashboard → Edge Functions → extract-recipe and redeploy the function. ('+error.message+')')
    if(data?.error) throw new Error(data.error)
    return data
  }
}

const LANGS=['English','Spanish','French','Italian','German','Portuguese','Japanese']

/* ── RecipeView ─────────────────────────────────────────────────────────────── */
function RecipeView({r,onEdit,onDelete}){
  const[checked,setChecked]=useState(new Set())
  const[highlightedSteps,setHighlightedSteps]=useState(new Set())
  const[showPct,setShowPct]=useState(false)
  const[pctMode,setPctMode]=useState('baker')
  const[pctBase,setPctBase]=useState('')
  const[showScale,setShowScale]=useState(false)
  const[scaleMode,setScaleMode]=useState('factor')
  const[scaleFactor,setScaleFactor]=useState('2')
  const[scalePieces,setScalePieces]=useState('')
  const[scaleGpp,setScaleGpp]=useState('')
  const[scaleTotal,setScaleTotal]=useState('')
  const[appliedScale,setAppliedScale]=useState(null)
  const[translating,setTranslating]=useState(false)
  const[translated,setTranslated]=useState(null)
  const[targetLang,setTargetLang]=useState('English')
  const[transErr,setTransErr]=useState('')
  const[exporting,setExporting]=useState(false)
  useEffect(()=>{setChecked(new Set());setHighlightedSteps(new Set());setAppliedScale(null);setTranslated(null);setShowScale(false)},[r.id])
  const displayR=translated||r
  const viewR=useMemo(()=>appliedScale?scaleRecipe(displayR,appliedScale.factor):displayR,[displayR,appliedScale])
  const sections=useMemo(()=>parseSections(viewR.ingredients||[]),[viewR])
  const totalGrams=useMemo(()=>getTotalGrams(viewR.ingredients||[]),[viewR])
  function handleIngToggle(rawIdx,ing){
    setChecked(prev=>{
      const next=new Set(prev)
      if(next.has(rawIdx)) next.delete(rawIdx); else next.add(rawIdx)
      const names=[];const ings=viewR.ingredients||[]
      next.forEach(idx=>{if(ings[idx]&&!/^##?\s+/.test(ings[idx]))names.push(parseIng(ings[idx]).name)})
      const steps=new Set();names.forEach(n=>findStepsForIng(n,viewR.steps||[]).forEach(i=>steps.add(i)))
      setHighlightedSteps(steps);return next
    })
  }
  function applyScale(){
    let factor=0,label=''
    if(scaleMode==='factor'){
      factor=parseFloat(scaleFactor)||0
      if(!factor||factor<=0)return
      label=`×${factor}`
    } else {
      const cur=getTotalGrams(r.ingredients||[])
      if(!cur){alert('This recipe has no gram-based quantities.\nUse "Multiply by \u00d7" mode instead.');return}
      let targetG=0
      if(scaleMode==='pieces'){
        const pc=parseFloat(scalePieces)||0,gpp=parseFloat(scaleGpp)||0
        if(!pc||!gpp)return
        targetG=pc*gpp;label=`${pc} pcs × ${gpp} g = ${targetG.toFixed(0)} g`
      } else {
        targetG=parseFloat(scaleTotal)||0
        if(!targetG)return
        label=`${targetG.toFixed(0)} g total`
      }
      factor=targetG/cur
    }
    setAppliedScale({factor,label});setShowScale(false);setChecked(new Set());setHighlightedSteps(new Set())
  }
  async function handleTranslate(){
    setTranslating(true);setTransErr('')
    try{setTranslated(await translateRecipe(r,targetLang))}
    catch(e){setTransErr('Translation failed: '+e.message)}
    finally{setTranslating(false)}
  }
  const pctBaseOptions=useMemo(()=>(viewR.ingredients||[]).filter(i=>!/^##?\s+/.test(i)).map(i=>parseIng(i).name).filter((n,i,a)=>n&&a.indexOf(n)===i),[viewR])
  return(
    <div className="Q-view">
      <h1>{viewR.title||'Untitled'}</h1>
      {appliedScale&&<div className="Q-banner scale">⚖ Scaled — {appliedScale.label}<button onClick={()=>{setAppliedScale(null);setChecked(new Set());setHighlightedSteps(new Set())}}>Reset</button></div>}
      {translated&&<div className="Q-banner trans">🌐 {targetLang} translation<button onClick={()=>setTranslated(null)}>View original</button></div>}
      <dl className="Q-meta">
        {viewR.category&&<div className="Q-meta-item"><dt>Category</dt><dd>{viewR.category}</dd></div>}
        {viewR.time&&<div className="Q-meta-item"><dt>Time</dt><dd>{viewR.time}</dd></div>}
        {viewR.servings&&<div className="Q-meta-item"><dt>Yield</dt><dd>{viewR.servings}</dd></div>}
        {viewR.source&&<div className="Q-meta-item"><dt>Source</dt><dd>{viewR.source}</dd></div>}
      </dl>
      <div className="Q-toolbar">
        {!appliedScale&&<button className=`btn xs ${showScale?'amber':'ghost'}` onClick={()=>setShowScale(!showScale)}>⚖ Scale</button>}
        <button className=`btn xs ${showPct?'amber':'ghost'}` onClick={()=>setShowPct(!showPct)}>% Baker's</button>
        <select style={{border:'1px solid var(--rule)',borderRadius:5,padding:'4px 7px',fontSize:12,fontFamily:'var(--mono)',background:'#fff',color:'var(--ink)'}} value={targetLang} onChange={e=>setTargetLang(e.target.value)}>
          {LANGS.map(l=><option key={l}>{l}</option>)}
        </select>
        <button className="btn xs green" onClick={handleTranslate} disabled={translating}>{translating?'Translating…':`🌐 ${targetLang}`}</button>
        {transErr&&<span style={{color:'#9b2c2c',fontSize:11}}>{transErr}</span>}
        <div className="right">
          <button className="btn amber xs" disabled={exporting} onClick={async()=>{setExporting(true);try{exportImage(viewR)}finally{setTimeout(()=>setExporting(false),800)}}}>&#8595; Image</button>
          <button className="btn amber xs" onClick={()=>exportPDF(viewR)}>&#8595; PDF</button>
        </div>
      </div>
      {showScale&&!appliedScale&&(
        <div className="Q-scale-panel">
          <div>
            <h4>Scale recipe</h4>
            <div style={{display:'flex',flexWrap:'wrap',gap:10,marginBottom:12}}>
              {[['factor','× Multiply (works for all)'],['pieces','Pieces × g/piece'],['total','Total weight']].map(([k,l])=>(
                <label key={k} style={{display:'flex',alignItems:'center',gap:5,fontSize:12.5,cursor:'pointer'}}>
                  <input type="radio" checked={scaleMode===k} onChange={()=>setScaleMode(k)}/>{l}
                </label>
              ))}
            </div>
            {scaleMode==='factor'&&(
              <div className="Q-scale-row">
                <label>Factor</label>
                <input type="number" value={scaleFactor} onChange={e=>setScaleFactor(e.target.value)} placeholder="2" min="0.01" step="0.1"/>
                <span style={{fontSize:11,color:'var(--muted)'}}>&#215; all quantities</span>
                {scaleFactor&&<span style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--navy)'}}>e.g. 2 = double, 0.5 = half</span>}
              </div>
            )}
            {scaleMode==='pieces'&&(
              <div className="Q-scale-row">
                <label>Pieces</label>
                <input type="number" value={scalePieces} onChange={e=>setScalePieces(e.target.value)} placeholder="6" min="1"/>
                <span style={{fontSize:11,color:'var(--muted)'}}>&#215;</span>
                <input type="number" value={scaleGpp} onChange={e=>setScaleGpp(e.target.value)} placeholder="1000" min="1"/>
                <label>g / piece</label>
                {scalePieces&&scaleGpp&&<span style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--navy)'}}>{(parseFloat(scalePieces)*parseFloat(scaleGpp)).toFixed(0)} g</span>}
              </div>
            )}
            {scaleMode==='total'&&(
              <div className="Q-scale-row">
                <label>Total grams</label>
                <input type="number" value={scaleTotal} onChange={e=>setScaleTotal(e.target.value)} placeholder="2000" min="1"/>
                <span style={{fontSize:11,color:'var(--muted)'}}>g · current: {getTotalGrams(r.ingredients||[]).toFixed(0)} g</span>
              </div>
            )}
          </div>
          <div style={{display:'flex',gap:7}}>
            <button className="btn amber xs" onClick={applyScale}>Apply</button>
            <button className="btn ghost xs" onClick={()=>setShowScale(false)}>Cancel</button>
          </div>
        </div>
      )}
      {showPct&&(
        <div className="Q-pct-bar">
          <label>% basis:</label>
          <select value={pctMode} onChange={e=>setPctMode(e.target.value)}>
            <option value="baker">Baker's % (flour=100%)</option>
            <option value="mass">Total mass %</option>
            <option value="custom">Custom base</option>
          </select>
          {pctMode==='custom'&&(
            <select value={pctBase} onChange={e=>setPctBase(e.target.value)}>
              <option value="">— select base —</option>
              {pctBaseOptions.map(n=><option key={n} value={n}>{n}</option>)}
            </select>
          )}
        </div>
      )}
      <div style={{fontFamily:'var(--mono)',fontSize:10,textTransform:'uppercase',letterSpacing:'.18em',color:'var(--navy)',marginBottom:8}}>
        Ingredients
        {checked.size>0&&<button style={{marginLeft:12,fontFamily:'var(--mono)',fontSize:9,background:'none',border:'none',cursor:'pointer',color:'var(--muted)',textDecoration:'underline'}} onClick={()=>{setChecked(new Set());setHighlightedSteps(new Set())}}>clear</button>}
      </div>
      {sections.map((sec,si)=>{
        const pctData=showPct?calcPct(sec.items,pctMode,pctBase):null
        const secG=sec.items.reduce((s,ing)=>{const p=parseIng(ing);return s+toGrams(p.qty,p.unit)},0)
        return(
          <div key={si}>
            {sec.name&&<div className="Q-sec-h"><span>{sec.name}</span></div>}
            <ul className="Q-ings">
              {sec.items.map((ing,ii)=>{
                const rawIdx=sec.rawIndices[ii],isChecked=checked.has(rawIdx)
                const mm=String(ing).match(/^([\d.,]+\s*[^\s]+)\s{2,}(.+)$/)||String(ing).match(/^([\d.,]+\s*[a-zA-Z%]+)\s+(.+)$/)
                const pct=pctData?pctData[ii]:null
                return(
                  <li key={ii} className=`Q-ing-row${isChecked?' checked':''}` onClick={()=>handleIngToggle(rawIdx,ing)}>
                    <span className="Q-ing-check">{isChecked?'\u2713':'\u25cb'}</span>
                    {mm?<><span className="Q-ing-qty">{mm[1].trim()}</span><span className="Q-ing-name">{mm[2].trim()}</span></>:<span className="Q-ing-name" style={{flex:1}}>{ing}</span>}
                    {pct&&pct.pct!==null&&<span className=`Q-pct-badge${pct.isBase?' base':''}`>{pct.pct.toFixed(1)}%</span>}
                  </li>
                )
              })}
            </ul>
            {sec.name&&secG>0&&<div className="Q-subtotal">{sec.name} subtotal: {secG.toFixed(0)} g</div>}
          </div>
        )
      })}
      {totalGrams>0&&<div className="Q-grand-total">Total dough: {totalGrams.toFixed(0)} g</div>}
      {viewR.steps?.length>0&&(
        <>
          <div className="Q-steps-label">Method{highlightedSteps.size>0&&<span style={{fontFamily:'var(--mono)',fontSize:9,color:'var(--amber)',marginLeft:10}}>{highlightedSteps.size} step{highlightedSteps.size>1?'s':''} highlighted</span>}</div>
          <ol className="Q-steps">{viewR.steps.map((step,i)=><li key={i} className={highlightedSteps.has(i)?'highlighted':''}>{step}</li>)}</ol>
        </>
      )}
      {viewR.notes&&<div className="Q-notes">{viewR.notes}</div>}
      <div className="Q-view-foot">
        <button className="btn" onClick={onEdit}>Edit</button>
        <button className="btn danger" onClick={onDelete}>Delete</button>
      </div>
    </div>
  )
}

/* ── RecipeEditor ────────────────────────────────────────────────────────────── */
function RecipeEditor({initial,onSave,onCancel}){
  const toForm=x=>!x?{}:{...x,ingredientsText:(x.ingredients||[]).join('\n'),stepsText:(x.steps||[]).join('\n')}
  const blank={title:'',category:'',time:'',servings:'',notes:'',source:'Manual',ingredientsText:'',stepsText:''}
  const[r,setR]=useState(()=>({...blank,...toForm(initial)}))
  const[tab,setTab]=useState('text')
  const[images,setImages]=useState([])
  const[rawText,setRawText]=useState('')
  const[scanning,setScanning]=useState(false)
  const[err,setErr]=useState('')
  const[dragOver,setDragOver]=useState(false)
  const set=k=>e=>setR(p=>({...p,[k]:e.target.value}))
  async function processFiles(files){
    setErr('')
    try{
      const imgs=Array.from(files).filter(f=>f.type.startsWith('image/'))
      if(!imgs.length){setErr('No image files found.');return}
      const compressed=await Promise.all(imgs.map(f=>compressImage(f)))
      setImages(p=>[...p,...compressed])
    }catch(e){setErr('Image error: '+e.message)}
  }
  function handleFileInput(e){processFiles(e.target.files);e.target.value=''}
  function handleDrop(e){e.preventDefault();setDragOver(false);processFiles(e.dataTransfer.files)}
  useEffect(()=>{
    const onPaste=async(e)=>{
      if(tab!=='photo')return
      const files=Array.from(e.clipboardData?.items||[]).filter(i=>i.type.startsWith('image/')).map(i=>i.getAsFile()).filter(Boolean)
      if(files.length){e.preventDefault();processFiles(files)}
    }
    document.addEventListener('paste',onPaste)
    return()=>document.removeEventListener('paste',onPaste)
  },[tab])
  async function applyExtracted(data,source){
    setR(p=>({...p,title:data.title||p.title,category:data.category||p.category,
      time:data.time||p.time,servings:data.servings||p.servings,notes:data.notes||p.notes,source,
      ingredientsText:(data.ingredients||[]).join('\n')||p.ingredientsText,
      stepsText:(data.steps||[]).join('\n')||p.stepsText}))
  }
  async function runFromPhotos(){
    if(!images.length){setErr('Add at least one photo first.');return}
    setScanning(true);setErr('')
    try{await applyExtracted(await extractWithClaude(images),'Photo')}
    catch(e){setErr('Could not read photos. ('+e.message+')')}
    finally{setScanning(false)}
  }
  async function runFromText(){
    if(!rawText.trim()){setErr('Paste or type the recipe first.');return}
    setScanning(true);setErr('')
    try{await applyExtracted(await structureText(rawText),'Text');setRawText('')}
    catch(e){setErr('Could not structure text. ('+e.message+')')}
    finally{setScanning(false)}
  }
  function save(){
    onSave({id:r.id||uid(),title:r.title.trim()||'Untitled',category:r.category.trim(),time:r.time.trim(),
      servings:r.servings.trim(),notes:r.notes.trim(),source:r.source||'Manual',
      ingredients:r.ingredientsText.split('\n').map(s=>s.trim()).filter(Boolean),
      steps:r.stepsText.split('\n').map(s=>s.trim()).filter(Boolean),
      createdAt:r.createdAt||Date.now()})
  }
  return(
    <div className="Q-ed">
      <h2>{r.id?'Edit recipe':'New recipe'}</h2>
      <div style={{border:'1.5px solid var(--rule)',borderRadius:10,marginBottom:20,overflow:'hidden'}}>
        <div style={{display:'flex',borderBottom:'1px solid var(--rule)',background:'#f5efe6'}}>
          {[['text','📋 Paste text'],['photo','📷 From photo']].map(([key,label])=>(
            <button key={key} onClick={()=>{setTab(key);setErr('')}}
              style={{flex:1,padding:'10px 8px',border:'none',cursor:'pointer',fontFamily:'var(--mono)',
                fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'.1em',
                background:tab===key?'#fff':'transparent',color:tab===key?'var(--navy)':'var(--muted)',
                borderBottom:tab===key?'2px solid var(--amber)':'2px solid transparent'}}>
              {label}
            </button>
          ))}
        </div>
        <div style={{padding:'14px 16px'}}>
          {tab==='text'&&(
            <>
              <p style={{fontSize:12,color:'var(--muted)',margin:'0 0 10px',lineHeight:1.5}}>
                Paste any recipe text — from a website, a message, a screenshot description, or just type it. <strong>Works on mobile.</strong>
              </p>
              <textarea value={rawText} onChange={e=>setRawText(e.target.value)} rows={7}
                placeholder={'Paste recipe text here…\n\nExamples:\n• Copy from a website\n• Type what you see in a book\n• Paste from WhatsApp / Notes'}
                style={{width:'100%',border:'1px solid var(--rule)',borderRadius:7,padding:'9px 11px',
                  fontSize:13,fontFamily:'var(--sans)',color:'var(--ink)',resize:'vertical',
                  background:'#fff',display:'block',marginBottom:10}}/>
              <button className="btn amber xs" onClick={runFromText} disabled={scanning||!rawText.trim()} style={{width:'100%',padding:'10px',fontSize:13}}>
                {scanning?'Structuring with Claude…':'Structure recipe with Claude →'}
              </button>
            </>
          )}
          {tab==='photo'&&(
            <>
              <p style={{fontSize:12,color:'var(--muted)',margin:'0 0 10px',lineHeight:1.5}}>
                Upload 1–6 photos of recipe pages. Auto-compressed. Claude reads all pages as one recipe.
              </p>
              <div onDrop={handleDrop} onDragOver={e=>{e.preventDefault();setDragOver(true)}} onDragLeave={()=>setDragOver(false)}
                style={{position:'relative',borderRadius:8,marginBottom:10,border:`2px dashed ${dragOver?'var(--navy)':'var(--amber)'}`,
                  background:dragOver?'#EAF2EE':'rgba(188,108,44,.05)',padding:'20px 12px',textAlign:'center',cursor:scanning?'default':'pointer'}}>
                <div style={{pointerEvents:'none'}}>
                  <div style={{fontSize:24,marginBottom:5}}>📷</div>
                  <div style={{fontSize:12.5,fontWeight:600,color:'var(--navy)'}}>Tap · drag & drop · paste ⌘V</div>
                  <div style={{fontSize:11,color:'var(--muted)',marginTop:3}}>Up to 6 images · auto-compressed</div>
                </div>
                <input type="file" accept="image/*" multiple disabled={scanning} onChange={handleFileInput}
                  style={{position:'absolute',inset:0,opacity:0,width:'100%',height:'100%',cursor:scanning?'default':'pointer'}}/>
              </div>
              {images.length>0&&(
                <>
                  <div className="Q-thumbs">
                    {images.map((im,i)=><div className="Q-thumb" key={i}><img src={im.url} alt=""/><button onClick={()=>setImages(p=>p.filter((_,j)=>j!==i))} disabled={scanning}>×</button></div>)}
                  </div>
                  <button className="btn amber xs" onClick={runFromPhotos} disabled={scanning} style={{marginTop:8,width:'100%',padding:'10px',fontSize:13}}>
                    {scanning?`Reading ${images.length} photo${images.length>1?'s':''}…`:`Extract ${images.length} photo${images.length>1?'s':''} with Claude →`}
                  </button>
                </>
              )}
            </>
          )}
          {err&&<div className="Q-err" style={{marginTop:8}}>{err}</div>}
        </div>
      </div>
      <div className="Q-field"><label>Title</label><input value={r.title} onChange={set('title')} placeholder="Panettone Classico"/></div>
      <div className="Q-grid2">
        <div className="Q-field"><label>Category</label><input value={r.category} onChange={set('category')} placeholder="Grandi Lievitati"/></div>
        <div className="Q-field"><label>Source</label><input value={r.source} onChange={set('source')}/></div>
      </div>
      <div className="Q-grid2">
        <div className="Q-field"><label>Time</label><input value={r.time} onChange={set('time')} placeholder="~36 h"/></div>
        <div className="Q-field"><label>Yield</label><input value={r.servings} onChange={set('servings')} placeholder="2 × 1 kg"/></div>
      </div>
      <div className="Q-field">
        <label>Ingredients — one per line</label>
        <textarea className="mono" rows={10} value={r.ingredientsText} onChange={set('ingredientsText')}
          placeholder={'## Primo Impasto\n500 g  bread flour W380\n175 g  water\n## Secondo Impasto\n100 g  butter\n…'}/>
        <div className="hint">Use <strong>## Section Name</strong> for multi-dough recipes. Two spaces between quantity and name. Baker's % and subtotals auto-calculated.</div>
      </div>
      <div className="Q-field"><label>Method — one step per line</label><textarea rows={8} value={r.stepsText} onChange={set('stepsText')} placeholder={'Refresh the levain 8 h before mixing…\nFirst dough: combine flour and water…'}/></div>
      <div className="Q-field"><label>Notes</label><textarea rows={3} value={r.notes} onChange={set('notes')} placeholder="Temperatures, adjustments, flour specs…"/></div>
      <div className="Q-ed-foot">
        <button className="btn" onClick={save}>Save recipe</button>
        <button className="btn ghost" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

/* ── App ──────────────────────────────────────────────────────────────────── */
export default function App(){
  const[recipes,setRecipes]=useState([])
  const[loading,setLoading]=useState(true)
  const[selId,setSelId]=useState(null)
  const[mode,setMode]=useState('view')
  const[q,setQ]=useState('')
  const[saveErr,setSaveErr]=useState('')
  useEffect(()=>{
    dbLoad().then(data=>{setRecipes(data);if(data[0])setSelId(data[0].id)})
      .catch(e=>setSaveErr('Load failed: '+e.message))
      .finally(()=>setLoading(false))
  },[])
  async function saveRecipe(rec){
    try{
      const saved=rec.id&&recipes.some(x=>x.id===rec.id)?await dbUpdate(rec):await dbInsert(rec)
      setRecipes(p=>{const ex=p.some(x=>x.id===saved.id);return ex?p.map(x=>x.id===saved.id?saved:x):[saved,...p]})
      setSelId(saved.id);setMode('view')
    }catch(e){setSaveErr('Save failed: '+e.message)}
  }
  async function deleteRecipe(id){
    if(!window.confirm('Delete this recipe?'))return
    try{await dbDelete(id);const next=recipes.filter(x=>x.id!==id);setRecipes(next);setSelId(next[0]?.id||null);setMode('view')}
    catch(e){setSaveErr('Delete failed: '+e.message)}
  }
  const sel=recipes.find(x=>x.id===selId)||null
  const filtered=recipes.filter(r=>{if(!q.trim())return true;return[r.title,r.category,...(r.ingredients||[])].join(' ').toLowerCase().includes(q.toLowerCase())})
  const isOpen=mode!=='view'||!!sel
  return(
    <div className="Q" data-open={isOpen?'1':'0'}>
      <style>{CSS}</style>
      <header className="Q-top">
        <div className="Q-brand">Quaderno <small>Recipe Book</small></div>
        <div className="Q-top-right">
          {saveErr&&<span style={{color:'#9b2c2c',fontSize:11,maxWidth:200,overflow:'hidden',textOverflow:'ellipsis'}}>{saveErr}</span>}
          <span style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--muted)'}}>{!loading&&`${recipes.length} recipe${recipes.length!==1?'s':''}`}</span>
          <button className="btn amber" onClick={()=>{setMode('new');setSelId(null)}}>＋ New</button>
        </div>
      </header>
      <div className="Q-body">
        <aside className="Q-side">
          <div className="Q-search"><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by name or ingredient…"/></div>
          <div className="Q-list">
            {loading&&<div className="Q-msg">Loading…</div>}
            {!loading&&!filtered.length&&<div className="Q-msg">{q?'No matches.':'No recipes yet.'}</div>}
            {filtered.map(r=>(
              <button key={r.id} className="Q-list-item" aria-selected={r.id===selId&&mode==='view'} onClick={()=>{setSelId(r.id);setMode('view')}}>
                <h4>{r.title}</h4>
                <span>{[r.category,r.source].filter(Boolean).join(' · ')||'—'}</span>
              </button>
            ))}
          </div>
        </aside>
        <main className="Q-main">
          <div className="Q-pane">
            <button className="btn ghost xs Q-back-btn" style={{marginBottom:16}} onClick={()=>{setMode('view');setSelId(null)}}>← All recipes</button>
            {mode==='new'&&<RecipeEditor onSave={saveRecipe} onCancel={()=>{setMode('view');setSelId(recipes[0]?.id||null)}}/>}
            {mode==='edit'&&sel&&<RecipeEditor initial={sel} onSave={saveRecipe} onCancel={()=>setMode('view')}/>}
            {mode==='view'&&sel&&<RecipeView key={sel.id} r={sel} onEdit={()=>setMode('edit')} onDelete={()=>deleteRecipe(sel.id)}/>}
            {mode==='view'&&!sel&&!loading&&(
              <div className="Q-hero">
                <div className="glyph">❦</div>
                <h2>Your recipe book</h2>
                <p>Save recipes manually, paste text for Claude to structure, or upload photos. Sections, baker's %, scaling and translation included.</p>
                <button className="btn amber" onClick={()=>setMode('new')}>Add first recipe</button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
