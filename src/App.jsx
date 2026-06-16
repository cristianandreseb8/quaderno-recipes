import React, { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from './lib/supabase.js'
import { jsPDF } from 'jspdf'

const COLORS = {
  parchment: '#FAF7F0', navy: '#1F3A4D', amber: '#BC6C2C',
  warmGray: '#8B7355', lightParchment: '#F5F0E8', white: '#FFFFFF', border: '#D4C5A9',
}

const styles = {
  app: { fontFamily: 'Georgia, serif', background: COLORS.parchment, minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  header: { background: COLORS.navy, color: COLORS.white, padding: '0 24px', display: 'flex', alignItems: 'center', height: '56px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 8px rgba(31,58,77,0.3)' },
  headerTitle: { fontSize: '22px', fontWeight: 'bold', letterSpacing: '1px', color: COLORS.parchment, margin: 0 },
  headerSubtitle: { fontSize: '12px', color: COLORS.amber, marginLeft: '12px', letterSpacing: '2px', textTransform: 'uppercase' },
  body: { display: 'flex', flex: 1, minHeight: 0 },
  sidebar: { width: '288px', minWidth: '288px', background: COLORS.lightParchment, borderRight: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column', overflowY: 'auto' },
  main: { flex: 1, overflowY: 'auto', padding: '32px' },
  searchBox: { padding: '12px 16px', borderBottom: `1px solid ${COLORS.border}` },
  searchInput: { width: '100%', padding: '8px 12px', border: `1px solid ${COLORS.border}`, borderRadius: '6px', background: COLORS.white, fontFamily: 'Georgia, serif', fontSize: '14px', boxSizing: 'border-box', outline: 'none' },
  addBtn: { display: 'block', width: 'calc(100% - 24px)', margin: '12px', padding: '10px', background: COLORS.amber, color: COLORS.white, border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '14px', fontWeight: 'bold' },
  recipeItem: (selected) => ({ padding: '12px 16px', cursor: 'pointer', background: selected ? COLORS.amber + '22' : 'transparent', borderLeft: selected ? `3px solid ${COLORS.amber}` : '3px solid transparent', borderBottom: `1px solid ${COLORS.border}`, transition: 'all 0.15s' }),
  recipeItemTitle: { fontSize: '14px', fontWeight: 'bold', color: COLORS.navy, marginBottom: '2px' },
  recipeItemMeta: { fontSize: '12px', color: COLORS.warmGray },
  card: { background: COLORS.white, borderRadius: '10px', padding: '32px', boxShadow: '0 2px 12px rgba(31,58,77,0.08)', maxWidth: '720px', animation: 'fadeIn 0.3s ease' },
  h1: { color: COLORS.navy, fontFamily: 'Georgia, serif', fontSize: '28px', marginBottom: '8px' },
  h2: { color: COLORS.navy, fontFamily: 'Georgia, serif', fontSize: '20px', borderBottom: `2px solid ${COLORS.amber}`, paddingBottom: '6px', marginBottom: '16px', marginTop: '28px' },
  metaRow: { display: 'flex', gap: '24px', flexWrap: 'wrap', color: COLORS.warmGray, fontSize: '13px', marginBottom: '16px' },
  ingredientRow: { display: 'flex', gap: '12px', padding: '6px 0', borderBottom: `1px solid ${COLORS.parchment}`, alignItems: 'baseline' },
  qty: { fontFamily: 'monospace', fontSize: '13px', color: COLORS.amber, minWidth: '100px', flexShrink: 0 },
  ingName: { fontFamily: 'sans-serif', fontSize: '14px', color: COLORS.navy },
  stepRow: { display: 'flex', gap: '16px', marginBottom: '12px', alignItems: 'flex-start' },
  stepNum: { fontFamily: 'Georgia, serif', fontWeight: 'bold', color: COLORS.amber, fontSize: '18px', minWidth: '28px', lineHeight: 1.3 },
  stepText: { fontFamily: 'sans-serif', fontSize: '14px', color: '#333', lineHeight: 1.6 },
  notesBox: { background: COLORS.lightParchment, border: `1px solid ${COLORS.border}`, borderRadius: '8px', padding: '16px', fontFamily: 'sans-serif', fontSize: '14px', color: COLORS.warmGray, marginTop: '16px' },
  actionBar: { display: 'flex', gap: '10px', marginTop: '24px', flexWrap: 'wrap' },
  btn: (v) => ({ padding: '8px 18px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '13px', fontWeight: 'bold', ...(v === 'primary' ? { background: COLORS.amber, color: COLORS.white } : v === 'danger' ? { background: '#c0392b', color: COLORS.white } : { background: COLORS.navy, color: COLORS.white }) }),
  formGroup: { marginBottom: '16px' },
  label: { display: 'block', color: COLORS.navy, fontFamily: 'Georgia, serif', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' },
  input: { width: '100%', padding: '8px 12px', border: `1px solid ${COLORS.border}`, borderRadius: '6px', fontFamily: 'Georgia, serif', fontSize: '14px', boxSizing: 'border-box', outline: 'none', background: COLORS.white },
  textarea: { width: '100%', padding: '8px 12px', border: `1px solid ${COLORS.border}`, borderRadius: '6px', fontFamily: 'monospace', fontSize: '13px', boxSizing: 'border-box', outline: 'none', minHeight: '120px', resize: 'vertical', background: COLORS.white },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  uploadArea: { border: `2px dashed ${COLORS.border}`, borderRadius: '8px', padding: '24px', textAlign: 'center', cursor: 'pointer', background: COLORS.lightParchment, color: COLORS.warmGray, fontSize: '14px' },
  photoThumb: { width: '72px', height: '72px', objectFit: 'cover', borderRadius: '6px', border: `2px solid ${COLORS.border}` },
  emptyState: { textAlign: 'center', padding: '60px 32px', color: COLORS.warmGray },
}

const globalCSS = `
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
* { box-sizing: border-box; } body { margin: 0; }
textarea:focus, input:focus { border-color: #BC6C2C !important; box-shadow: 0 0 0 2px rgba(188,108,44,0.15); }
@media (max-width: 700px) { .app-body { flex-direction: column !important; } .sidebar { width: 100% !important; min-width: unset !important; max-height: 260px; } .main-content { padding: 16px !important; } }
`

function parseIngredient(line) {
  const parts = line.trim().split(/\s+/)
  if (parts.length <= 1) return { qty: '', name: line.trim() }
  const numRe = /^[\d.,\/]+$/
  let i = 0
  while (i < parts.length && numRe.test(parts[i])) i++
  if (i < parts.length && parts[i].length <= 4) i++
  return { qty: parts.slice(0, i).join(' ') || parts[0], name: parts.slice(i).join(' ') || line.trim() }
}

function exportPDF(recipe) {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
  const W = 210, H = 297
  doc.setFillColor(31, 58, 77); doc.rect(0, 0, W, 22, 'F')
  doc.setTextColor(250, 247, 240); doc.setFontSize(20); doc.setFont('helvetica', 'bold')
  doc.text('Quaderno', 14, 14); doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.text('Recipe Book', 50, 14)
  doc.setFillColor(188, 108, 44); doc.rect(0, 22, W, 2, 'F')
  let y = 32
  doc.setTextColor(31, 58, 77); doc.setFontSize(22); doc.setFont('helvetica', 'bold')
  doc.text(recipe.title || 'Untitled', 14, y); y += 8
  doc.setFillColor(188, 108, 44); doc.rect(14, y, W - 28, 0.8, 'F'); y += 6
  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(139, 115, 85)
  const meta = [recipe.category, recipe.time_estimate || recipe.time, recipe.servings ? `Serves ${recipe.servings}` : '', recipe.source].filter(Boolean).join('   |   ')
  doc.text(meta, 14, y); y += 10
  if (recipe.ingredients && recipe.ingredients.length) {
    doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(31, 58, 77)
    doc.text('INGREDIENTS', 14, y); y += 2
    doc.setFillColor(188, 108, 44); doc.rect(14, y, 40, 0.5, 'F'); y += 6
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
    recipe.ingredients.forEach(ing => {
      if (y > H - 30) { doc.addPage(); y = 20 }
      const p = typeof ing === 'string' ? parseIngredient(ing) : ing
      doc.setTextColor(188, 108, 44); doc.setFont('courier', 'normal'); doc.text((p.qty || '').padEnd(18), 14, y)
      doc.setTextColor(31, 58, 77); doc.setFont('helvetica', 'normal'); doc.text(p.name || String(ing), 55, y); y += 6
    })
  }
  if (recipe.steps && recipe.steps.length) {
    y += 4; if (y > H - 40) { doc.addPage(); y = 20 }
    doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(31, 58, 77)
    doc.text('METHOD', 14, y); y += 2
    doc.setFillColor(188, 108, 44); doc.rect(14, y, 28, 0.5, 'F'); y += 7
    recipe.steps.forEach((step, i) => {
      if (y > H - 30) { doc.addPage(); y = 20 }
      doc.setTextColor(188, 108, 44); doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.text(`${i + 1}.`, 14, y)
      doc.setTextColor(51, 51, 51); doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
      const lines = doc.splitTextToSize(step, W - 36); doc.text(lines, 22, y); y += lines.length * 5.5 + 3
    })
  }
  if (recipe.notes) {
    if (y > H - 40) { doc.addPage(); y = 20 }
    y += 4; doc.setFillColor(245, 240, 232); doc.roundedRect(14, y - 4, W - 28, 20, 3, 3, 'F')
    doc.setDrawColor(212, 197, 169); doc.roundedRect(14, y - 4, W - 28, 20, 3, 3, 'S')
    doc.setTextColor(139, 115, 85); doc.setFont('helvetica', 'italic'); doc.setFontSize(9); doc.text('Notes:', 18, y + 2)
    doc.setFont('helvetica', 'normal'); doc.text(doc.splitTextToSize(recipe.notes, W - 40), 18, y + 8); y += 22
  }
  const totalPages = doc.internal.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p); doc.setFillColor(31, 58, 77); doc.rect(0, H - 14, W, 14, 'F')
    doc.setTextColor(250, 247, 240); doc.setFontSize(8); doc.setFont('helvetica', 'normal')
    doc.text('Quaderno · Recipe Book', 14, H - 6)
    doc.text(new Date().toLocaleDateString(), W / 2, H - 6, { align: 'center' })
    doc.text(`${p} / ${totalPages}`, W - 14, H - 6, { align: 'right' })
  }
  doc.save(`${(recipe.title || 'recipe').replace(/\s+/g, '-').toLowerCase()}.pdf`)
}

function exportImage(recipe) {
  const DPR = 2, W = 1200
  const canvas = document.createElement('canvas')
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : []
  const steps = Array.isArray(recipe.steps) ? recipe.steps : []
  const estH = 200 + ingredients.length * 28 + steps.length * 50 + 120
  canvas.width = W * DPR; canvas.height = estH * DPR
  const ctx = canvas.getContext('2d'); ctx.scale(DPR, DPR)
  ctx.fillStyle = COLORS.parchment; ctx.fillRect(0, 0, W, estH)
  ctx.fillStyle = COLORS.navy; ctx.fillRect(0, 0, W, 60)
  ctx.fillStyle = COLORS.amber; ctx.fillRect(0, 60, W, 4)
  ctx.fillStyle = COLORS.parchment; ctx.font = 'bold 28px Georgia, serif'; ctx.fillText('Quaderno · Recipe Book', 40, 38)
  let y = 100
  ctx.fillStyle = COLORS.navy; ctx.font = 'bold 40px Georgia, serif'; ctx.fillText(recipe.title || 'Untitled', 40, y); y += 14
  ctx.fillStyle = COLORS.amber; ctx.fillRect(40, y, 600, 3); y += 20
  ctx.fillStyle = COLORS.warmGray; ctx.font = '18px sans-serif'
  ctx.fillText([recipe.category, recipe.time_estimate || recipe.time, recipe.servings ? `Serves ${recipe.servings}` : ''].filter(Boolean).join('  ·  '), 40, y); y += 36
  if (ingredients.length) {
    ctx.fillStyle = COLORS.navy; ctx.font = 'bold 22px Georgia, serif'; ctx.fillText('INGREDIENTS', 40, y); y += 8
    ctx.fillStyle = COLORS.amber; ctx.fillRect(40, y, 160, 2); y += 18
    ingredients.forEach(ing => {
      const p = typeof ing === 'string' ? parseIngredient(ing) : ing
      ctx.font = '16px monospace'; ctx.fillStyle = COLORS.amber; ctx.fillText((p.qty || '').padEnd(14), 40, y)
      ctx.font = '16px sans-serif'; ctx.fillStyle = COLORS.navy; ctx.fillText(p.name || String(ing), 220, y); y += 26
    })
  }
  if (steps.length) {
    y += 10; ctx.fillStyle = COLORS.navy; ctx.font = 'bold 22px Georgia, serif'; ctx.fillText('METHOD', 40, y); y += 8
    ctx.fillStyle = COLORS.amber; ctx.fillRect(40, y, 110, 2); y += 18
    steps.forEach((step, i) => {
      ctx.font = 'bold 18px Georgia, serif'; ctx.fillStyle = COLORS.amber; ctx.fillText(`${i + 1}.`, 40, y)
      ctx.font = '16px sans-serif'; ctx.fillStyle = '#333'
      const words = step.split(' '); let line = ''
      words.forEach(w => {
        const test = line ? line + ' ' + w : w
        if (ctx.measureText(test).width > W - 120) { ctx.fillText(line, 72, y); line = w; y += 24 } else line = test
      })
      if (line) { ctx.fillText(line, 72, y); y += 30 }
    })
  }
  if (recipe.notes) {
    y += 10; ctx.fillStyle = COLORS.lightParchment; ctx.strokeStyle = COLORS.border; ctx.lineWidth = 1
    ctx.beginPath(); ctx.roundRect(30, y - 8, W - 60, 60, 8); ctx.fill(); ctx.stroke()
    ctx.fillStyle = COLORS.warmGray; ctx.font = 'italic 15px Georgia, serif'; ctx.fillText('Notes: ' + recipe.notes, 46, y + 18); y += 70
  }
  ctx.fillStyle = COLORS.navy; ctx.fillRect(0, estH - 40, W, 40)
  ctx.fillStyle = COLORS.parchment; ctx.font = '15px Georgia, serif'; ctx.fillText('Quaderno · Recipe Book', 40, estH - 14)
  const url = canvas.toDataURL('image/png')
  const a = document.createElement('a'); a.href = url
  a.download = `${(recipe.title || 'recipe').replace(/\s+/g, '-').toLowerCase()}.png`; a.click()
}

const EMPTY = { title: '', category: '', time: '', servings: '', source: 'Manual', ingredients: '', steps: '', notes: '' }

function RecipeForm({ initial, onSave, onCancel, loading }) {
  const [form, setForm] = useState(initial || EMPTY)
  const [photos, setPhotos] = useState([])
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState('')
  const fileRef = useRef()
  useEffect(() => { if (initial) setForm(initial) }, [initial])
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const handleExtract = async () => {
    if (!photos.length) return
    setExtracting(true); setExtractError('')
    try {
      const images = await Promise.all(photos.map(f => new Promise((res, rej) => {
        const reader = new FileReader()
        reader.onload = e => { const [h, d] = e.target.result.split(','); res({ media_type: h.match(/:(.*?);/)[1], data: d }) }
        reader.onerror = rej; reader.readAsDataURL(f)
      })))
      const { data, error } = await supabase.functions.invoke('extract-recipe', { body: { images } })
      if (error) throw error; if (data.error) throw new Error(data.error)
      setForm({ title: data.title||'', category: data.category||'', time: data.time||'', servings: data.servings||'', source: 'Photo',
        ingredients: Array.isArray(data.ingredients) ? data.ingredients.join('\n') : '',
        steps: Array.isArray(data.steps) ? data.steps.join('\n') : '', notes: data.notes||'' })
    } catch (e) { setExtractError(e.message || 'Extraction failed') }
    setExtracting(false)
  }
  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({ ...form, ingredients: form.ingredients.split('\n').map(s => s.trim()).filter(Boolean),
      steps: form.steps.split('\n').map(s => s.trim()).filter(Boolean), time_estimate: form.time })
  }
  return (
    <div style={styles.card}>
      <h1 style={styles.h1}>{initial?.id ? 'Edit Recipe' : 'New Recipe'}</h1>
      <div style={{ marginBottom: '24px', padding: '16px', background: COLORS.lightParchment, borderRadius: '8px', border: `1px solid ${COLORS.border}` }}>
        <div style={{ fontWeight: 'bold', color: COLORS.navy, marginBottom: '8px', fontSize: '14px' }}>📷 Extract from Photo</div>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => setPhotos(Array.from(e.target.files).slice(0, 4))} />
        <div style={styles.uploadArea} onClick={() => fileRef.current.click()}>{photos.length ? `${photos.length} photo(s) selected` : 'Click to select 1–4 recipe photos'}</div>
        {photos.length > 0 && <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>{photos.map((f, i) => <img key={i} src={URL.createObjectURL(f)} style={styles.photoThumb} alt="" />)}</div>}
        {extractError && <div style={{ color: '#c0392b', fontSize: '13px', marginTop: '8px' }}>{extractError}</div>}
        <button type="button" style={{ ...styles.btn('primary'), marginTop: '10px', opacity: photos.length ? 1 : 0.5 }} onClick={handleExtract} disabled={!photos.length || extracting}>{extracting ? 'Extracting…' : '✨ Extract with Claude'}</button>
      </div>
      <form onSubmit={handleSubmit}>
        <div style={styles.formGroup}><label style={styles.label}>Title *</label><input style={styles.input} value={form.title} onChange={e => set('title', e.target.value)} required /></div>
        <div style={styles.row2}>
          <div style={styles.formGroup}><label style={styles.label}>Category</label><input style={styles.input} value={form.category} onChange={e => set('category', e.target.value)} placeholder="e.g. Bread, Pastry" /></div>
          <div style={styles.formGroup}><label style={styles.label}>Time</label><input style={styles.input} value={form.time} onChange={e => set('time', e.target.value)} placeholder="e.g. 1h 30m" /></div>
          <div style={styles.formGroup}><label style={styles.label}>Yield / Servings</label><input style={styles.input} value={form.servings} onChange={e => set('servings', e.target.value)} placeholder="e.g. 12 rolls" /></div>
          <div style={styles.formGroup}><label style={styles.label}>Source</label><input style={styles.input} value={form.source} onChange={e => set('source', e.target.value)} /></div>
        </div>
        <div style={styles.formGroup}><label style={styles.label}>Ingredients (one per line)</label><textarea style={styles.textarea} value={form.ingredients} onChange={e => set('ingredients', e.target.value)} rows={8} /></div>
        <div style={styles.formGroup}><label style={styles.label}>Steps (one per line)</label><textarea style={styles.textarea} value={form.steps} onChange={e => set('steps', e.target.value)} rows={8} /></div>
        <div style={styles.formGroup}><label style={styles.label}>Notes</label><textarea style={{ ...styles.textarea, minHeight: '60px' }} value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} /></div>
        <div style={styles.actionBar}>
          <button type="submit" style={styles.btn('primary')} disabled={loading}>{loading ? 'Saving…' : '💾 Save Recipe'}</button>
          <button type="button" style={styles.btn('secondary')} onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  )
}

function RecipeView({ recipe, onEdit, onDelete, onBack, isMobile }) {
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : []
  const steps = Array.isArray(recipe.steps) ? recipe.steps : []
  return (
    <div style={{ ...styles.card, animation: 'fadeIn 0.3s ease' }}>
      {isMobile && <button style={{ ...styles.btn('secondary'), marginBottom: '16px', fontSize: '12px' }} onClick={onBack}>← Back</button>}
      <h1 style={styles.h1}>{recipe.title}</h1>
      <div style={styles.metaRow}>
        {recipe.category && <span>📂 {recipe.category}</span>}
        {(recipe.time_estimate || recipe.time) && <span>⏱ {recipe.time_estimate || recipe.time}</span>}
        {recipe.servings && <span>🍽 {recipe.servings}</span>}
        {recipe.source && <span>📖 {recipe.source}</span>}
      </div>
      {ingredients.length > 0 && (<><h2 style={styles.h2}>Ingredients</h2>{ingredients.map((ing, i) => { const p = typeof ing === 'string' ? parseIngredient(ing) : ing; return (<div key={i} style={styles.ingredientRow}><span style={styles.qty}>{p.qty}</span><span style={styles.ingName}>{p.name || String(ing)}</span></div>) })}</>)}
      {steps.length > 0 && (<><h2 style={styles.h2}>Method</h2>{steps.map((step, i) => (<div key={i} style={styles.stepRow}><span style={styles.stepNum}>{i + 1}.</span><span style={styles.stepText}>{step}</span></div>))}</>)}
      {recipe.notes && <div style={styles.notesBox}><strong>Notes:</strong> {recipe.notes}</div>}
      <div style={styles.actionBar}>
        <button style={styles.btn('primary')} onClick={onEdit}>✏️ Edit</button>
        <button style={styles.btn('secondary')} onClick={() => exportPDF(recipe)}>↓ PDF</button>
        <button style={styles.btn('secondary')} onClick={() => exportImage(recipe)}>↓ Image</button>
        <button style={styles.btn('danger')} onClick={onDelete}>🗑 Delete</button>
      </div>
    </div>
  )
}

export default function App() {
  const [recipes, setRecipes] = useState([])
  const [selected, setSelected] = useState(null)
  const [view, setView] = useState('list')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [editData, setEditData] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 700)
  useEffect(() => { const h = () => setIsMobile(window.innerWidth <= 700); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h) }, [])
  const load = useCallback(async () => { const { data } = await supabase.from('recipes').select('*').order('created_at', { ascending: false }); if (data) setRecipes(data) }, [])
  useEffect(() => { load() }, [load])
  const filtered = recipes.filter(r => { const q = search.toLowerCase(); if (!q) return true; if ((r.title||'').toLowerCase().includes(q)) return true; return (Array.isArray(r.ingredients) ? r.ingredients.join(' ') : '').toLowerCase().includes(q) })
  const handleSave = async (form) => {
    setLoading(true)
    const p = { title: form.title, category: form.category, time_estimate: form.time || form.time_estimate, servings: form.servings, source: form.source, ingredients: form.ingredients, steps: form.steps, notes: form.notes }
    if (editData?.id) await supabase.from('recipes').update(p).eq('id', editData.id)
    else await supabase.from('recipes').insert([p])
    await load(); setLoading(false); setView('list'); setEditData(null)
  }
  const handleDelete = async () => {
    if (!selected || !window.confirm('Delete this recipe?')) return
    await supabase.from('recipes').delete().eq('id', selected.id)
    setSelected(null); setView('list'); await load()
  }
  const handleEdit = () => {
    setEditData({ ...selected, time: selected.time_estimate, ingredients: Array.isArray(selected.ingredients) ? selected.ingredients.join('\n') : '', steps: Array.isArray(selected.steps) ? selected.steps.join('\n') : '' })
    setView('form')
  }
  return (
    <>
      <style>{globalCSS}</style>
      <div style={styles.app}>
        <header style={styles.header}><h1 style={styles.headerTitle}>Quaderno</h1><span style={styles.headerSubtitle}>Recipe Book</span></header>
        <div style={{ ...styles.body, flexDirection: isMobile ? 'column' : 'row' }} className="app-body">
          {(!isMobile || view === 'list') && (
            <aside style={{ ...styles.sidebar, ...(isMobile ? { width: '100%', minWidth: 'unset', maxHeight: '260px' } : {}) }}>
              <div style={styles.searchBox}><input style={styles.searchInput} placeholder="Search recipes…" value={search} onChange={e => setSearch(e.target.value)} /></div>
              <button style={styles.addBtn} onClick={() => { setEditData(null); setView('form') }}>+ Add Recipe</button>
              {filtered.length === 0 && <div style={{ padding: '24px 16px', color: COLORS.warmGray, fontSize: '13px' }}>No recipes yet.</div>}
              {filtered.map(r => (<div key={r.id} style={styles.recipeItem(selected?.id === r.id)} onClick={() => { setSelected(r); setView('view') }}><div style={styles.recipeItemTitle}>{r.title}</div><div style={styles.recipeItemMeta}>{r.category}{r.time_estimate ? ` · ${r.time_estimate}` : ''}</div></div>))}
            </aside>
          )}
          <main style={styles.main} className="main-content">
            {view === 'form' && <RecipeForm initial={editData} onSave={handleSave} onCancel={() => { setView(selected ? 'view' : 'list'); setEditData(null) }} loading={loading} />}
            {view === 'view' && selected && <RecipeView recipe={selected} onEdit={handleEdit} onDelete={handleDelete} onBack={() => setView('list')} isMobile={isMobile} />}
            {view === 'list' && <div style={styles.emptyState}><div style={{ fontSize: '48px', marginBottom: '16px' }}>📖</div><div style={{ fontSize: '18px', color: COLORS.navy, fontWeight: 'bold', marginBottom: '8px' }}>Your recipe book awaits</div><div style={{ fontSize: '14px' }}>Select a recipe from the sidebar or add a new one.</div></div>}
          </main>
        </div>
      </div>
    </>
  )
}
