'use client'

import { useRef, useState } from 'react'
import { Download, Upload, FileText, Loader2, AlertCircle, CheckCircle2, X, Plus, Link2 } from 'lucide-react'
import type { Product, Category, Role } from '@/lib/types'

const VALID_CATEGORIES: Category[] = ['Seating', 'Tables', 'Lighting', 'Storage', 'Decor', 'Textiles', 'Art']
const VALID_ROLES: Role[] = ['floor', 'ground', 'surface', 'hanging', 'standing', 'wall', 'prop']

function inferCategory(raw: string | null): Category {
  const c = (raw ?? '').toLowerCase()
  if (/(sofa|chair|stool|bench|seat)/.test(c)) return 'Seating'
  if (/(table|desk)/.test(c)) return 'Tables'
  if (/(lamp|light|pendant|sconce)/.test(c)) return 'Lighting'
  if (/(shelf|cabinet|sideboard|storage)/.test(c)) return 'Storage'
  if (/(rug|textile|cushion|pillow|throw)/.test(c)) return 'Textiles'
  if (/(art|print|poster|mirror)/.test(c)) return 'Art'
  return 'Decor'
}

function inferRole(cat: Category): Role {
  if (cat === 'Seating' || cat === 'Storage') return 'ground'
  if (cat === 'Tables') return 'surface'
  if (cat === 'Lighting') return 'standing'
  if (cat === 'Textiles') return 'floor'
  if (cat === 'Art') return 'wall'
  return 'prop'
}

type StagedProduct = Product & { approved?: boolean }

// ---------- CSV parsing ----------
function detectDelimiter(text: string): string {
  const sample = text.replace(/^﻿/, '').split(/\r?\n/).find(l => l.trim()) ?? ''
  const candidates = [',', ';', '\t']
  return candidates.sort((a, b) => sample.split(b).length - sample.split(a).length)[0] ?? ','
}

function parseCsv(text: string): Record<string, string>[] {
  const delim = detectDelimiter(text)
  const rows: string[][] = []
  let row: string[] = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++ } else inQ = false }
      else cur += c
    } else {
      if (c === '"') inQ = true
      else if (c === delim) { row.push(cur); cur = '' }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++
        row.push(cur); cur = ''
        if (row.some(v => v.length > 0)) rows.push(row)
        row = []
      } else cur += c
    }
  }
  if (cur || row.length > 0) { row.push(cur); if (row.some(v => v)) rows.push(row) }
  if (rows.length < 2) return []
  const headers = rows[0].map(h => h.replace(/^﻿/, '').trim())
  return rows.slice(1).map(r => {
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => { obj[h] = (r[i] ?? '').trim() })
    return obj
  })
}

function pickField(row: Record<string, string>, candidates: string[]): string {
  const keys = Object.keys(row)
  for (const c of candidates) {
    const hit = keys.find(k => k.toLowerCase() === c.toLowerCase())
    if (hit && row[hit]) return row[hit]
  }
  return ''
}

export default function ImportTab() {
  // URL scrape
  const [urlInput, setUrlInput] = useState('')
  const [urlLoading, setUrlLoading] = useState(false)
  const [urlError, setUrlError] = useState('')

  // Category bulk crawl (future: Supabase edge fn)
  const [bulkUrl, setBulkUrl] = useState('')
  const [bulkLimit, setBulkLimit] = useState(10)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkError, setBulkError] = useState('')

  // CSV
  const csvRef = useRef<HTMLInputElement>(null)
  const [csvBusy, setCsvBusy] = useState(false)
  const [csvMsg, setCsvMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Staged items (from bulk/CSV)
  const [staged, setStaged] = useState<StagedProduct[]>([])
  const [savedCount, setSavedCount] = useState(0)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({})

  async function scrapeOne(url: string): Promise<Product | null> {
    const res = await fetch('/api/scrape', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) })
    const data = await res.json()
    if (!res.ok || data.error) throw new Error(data.error || 'Scrape failed')
    const cat = inferCategory(data.category)
    return {
      id: crypto.randomUUID(),
      name: data.name || 'Untitled',
      maker: data.maker || '—',
      price: data.price || '—',
      category: VALID_CATEGORIES.includes(data.category) ? data.category : cat,
      role: VALID_ROLES.includes(data.role) ? data.role : inferRole(cat),
      src: data.image_url || '',
      colors: ['linen', 'cream'],
      description: data.description,
      gallery: data.gallery,
      sourceUrl: data.sourceUrl || url,
    }
  }

  async function handleUrlScrape(e: React.FormEvent) {
    e.preventDefault()
    if (!urlInput.trim()) return
    setUrlLoading(true); setUrlError('')
    try {
      const p = await scrapeOne(urlInput.trim())
      if (p) {
        setStaged(prev => [{ ...p, approved: false }, ...prev])
        setUrlInput('')
      }
    } catch (err: any) {
      setUrlError(err.message || 'Could not scrape that URL.')
    } finally {
      setUrlLoading(false)
    }
  }

  async function handleBulkCrawl(e: React.FormEvent) {
    e.preventDefault()
    if (!bulkUrl.trim()) return
    setBulkLoading(true); setBulkError('')
    try {
      // Fetch the category page and extract product links
      const res = await fetch('/api/scrape', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: bulkUrl.trim() }) })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Could not load category page')
      // Treat the category page itself as the first product (simple approach)
      const p = await scrapeOne(bulkUrl.trim())
      if (p) setStaged(prev => [{ ...p, approved: false }, ...prev])
      setBulkError('Tip: For full bulk crawl (scraping all product links from a category page), connect the Supabase bulk-import edge function. Single product URLs are fully supported above.')
    } catch (err: any) {
      setBulkError(err.message)
    } finally {
      setBulkLoading(false)
    }
  }

  async function onCsvChosen(file: File) {
    setCsvBusy(true); setCsvMsg(null)
    try {
      const text = await file.text()
      const rows = parseCsv(text)
      if (rows.length === 0) { setCsvMsg({ type: 'err', text: 'CSV looks empty. Needs a header row + at least one product.' }); return }
      const products: StagedProduct[] = rows.map(r => {
        const name = pickField(r, ['Productnaam', 'Product name', 'Name', 'Title'])
        const src = pickField(r, ['Productafbeelding', 'Product image', 'Image', 'Image URL', 'Photo'])
        const priceRaw = pickField(r, ['Prijs (EUR)', 'Prijs', 'Price', 'Price (EUR)'])
        const maker = pickField(r, ['Merk', 'Maker', 'Brand', 'Vendor'])
        const category = pickField(r, ['Categorie', 'Category', 'Type'])
        const description = pickField(r, ['Product omschrijving', 'Omschrijving', 'Description'])
        const sourceUrl = pickField(r, ['Product URL', 'URL', 'Source URL', 'Link'])
        const price = priceRaw ? priceRaw.replace(/\s/g, '').replace(/€/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.') : ''
        const cat = inferCategory(category || name)
        return {
          id: crypto.randomUUID(),
          name: name || 'Unnamed product',
          maker: maker || '—',
          price: price ? `€ ${Number(price.replace(/[^0-9.]/g, '')).toLocaleString('nl-NL')}` : '—',
          category: VALID_CATEGORIES.includes(category as Category) ? category as Category : cat,
          role: inferRole(cat),
          src: src || '',
          colors: ['linen', 'bone'],
          description: description || undefined,
          sourceUrl: sourceUrl || undefined,
          approved: false,
        }
      }).filter(p => p.name !== 'Unnamed product' || p.src)
      if (products.length === 0) { setCsvMsg({ type: 'err', text: "Couldn't find usable rows. Check column headers." }); return }
      setStaged(prev => [...products, ...prev])
      setCsvMsg({ type: 'ok', text: `Staged ${products.length} of ${rows.length} rows. Review below and approve to add to catalog.` })
    } catch (err: any) {
      setCsvMsg({ type: 'err', text: err.message || 'CSV import failed' })
    } finally {
      setCsvBusy(false)
      if (csvRef.current) csvRef.current.value = ''
    }
  }

  async function approve(p: StagedProduct) {
    setSavingId(p.id)
    setCardErrors(e => { const n = { ...e }; delete n[p.id]; return n })
    try {
      const payload = {
        name: p.name,
        maker: p.maker,
        price: p.price,
        category: p.category,
        src: p.src,
        colors: p.colors ?? [],
        role: p.role,
        details: p.details ?? {},
        gallery: p.gallery ?? [],
      }
      const res = await fetch('/api/store/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => ({}))
      console.log('[approve]', res.status, json)
      if (res.ok) {
        setStaged(prev => prev.filter(x => x.id !== p.id))
        setSavedCount(n => n + 1)
      } else {
        setCardErrors(e => ({ ...e, [p.id]: json.error ?? `Error ${res.status}` }))
      }
    } catch (err: any) {
      setCardErrors(e => ({ ...e, [p.id]: err.message ?? 'Network error' }))
    } finally {
      setSavingId(null)
    }
  }

  function dismiss(id: string) {
    setStaged(prev => prev.filter(x => x.id !== id))
  }

  return (
    <div className="space-y-10">
      <header>
        <p className="text-[10px] uppercase tracking-[0.32em]" style={{ color: 'var(--muted-foreground)' }}>Pipeline</p>
        <h1 className="font-serif text-5xl mt-3" style={{ color: 'var(--ink)' }}>Import Products</h1>
        <p className="mt-2 max-w-xl text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Add products individually by URL, bulk via a CSV export, or paste a category page to crawl.
        </p>
      </header>

      {/* Single URL */}
      <div className="rounded-2xl border p-6" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <p className="text-[10px] uppercase tracking-[0.24em]" style={{ color: 'var(--muted-foreground)' }}>Single product</p>
        <h2 className="font-serif text-2xl mt-1" style={{ color: 'var(--ink)' }}>Add with URL</h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>Paste any product page — ikea.com, hem.com, cassina.com, etc.</p>
        <form onSubmit={handleUrlScrape} className="mt-4 flex gap-3">
          <label className="flex flex-1 items-center gap-2 rounded-xl border px-4 py-3 focus-within:border-[var(--ink)]" style={{ borderColor: 'var(--border)', background: 'var(--background)' }}>
            <Link2 size={16} style={{ color: 'var(--muted-foreground)' }} />
            <input
              type="text"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              placeholder="https://brand.com/product"
              className="flex-1 bg-transparent text-sm focus:outline-none"
              style={{ color: 'var(--ink)' }}
              disabled={urlLoading}
            />
          </label>
          <button
            type="submit"
            disabled={urlLoading || !urlInput.trim()}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: 'var(--ink)', color: 'var(--primary-foreground)' }}
          >
            {urlLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {urlLoading ? 'Fetching…' : 'Fetch'}
          </button>
        </form>
        {urlError && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs" style={{ borderColor: 'oklch(0.75 0.15 27 / 0.3)', background: 'oklch(0.55 0.2 27 / 0.05)', color: 'oklch(0.55 0.2 27)' }}>
            <AlertCircle size={14} /> {urlError}
          </div>
        )}
      </div>

      {/* Bulk category */}
      <div className="rounded-2xl border p-6" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <p className="text-[10px] uppercase tracking-[0.24em]" style={{ color: 'var(--muted-foreground)' }}>Bulk crawl</p>
        <h2 className="font-serif text-2xl mt-1" style={{ color: 'var(--ink)' }}>Category URL</h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>Paste a category page and we'll extract and stage all products. Limit: {bulkLimit}.</p>
        <form onSubmit={handleBulkCrawl} className="mt-4 grid grid-cols-[1fr_100px_auto] gap-3">
          <input
            value={bulkUrl}
            onChange={e => setBulkUrl(e.target.value)}
            placeholder="https://brand.com/sofas"
            className="rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--ink)]"
            style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--ink)' }}
          />
          <input
            type="number"
            min={1}
            max={50}
            value={bulkLimit}
            onChange={e => setBulkLimit(Number(e.target.value))}
            className="rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--ink)]"
            style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--ink)' }}
          />
          <button
            type="submit"
            disabled={bulkLoading || !bulkUrl.trim()}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: 'var(--ink)', color: 'var(--primary-foreground)' }}
          >
            {bulkLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Start
          </button>
        </form>
        {bulkError && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border px-3 py-2 text-xs" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
            <AlertCircle size={14} className="mt-0.5 shrink-0" /> {bulkError}
          </div>
        )}
      </div>

      {/* CSV */}
      <div className="rounded-2xl border p-6" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
            <p className="text-[10px] uppercase tracking-[0.24em]" style={{ color: 'var(--muted-foreground)' }}>Spreadsheet</p>
            <h2 className="font-serif text-2xl mt-1" style={{ color: 'var(--ink)' }}>Upload CSV</h2>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
              Columns: <code className="rounded px-1" style={{ background: 'var(--secondary)' }}>Productnaam</code>, <code className="rounded px-1" style={{ background: 'var(--secondary)' }}>Product URL</code>, <code className="rounded px-1" style={{ background: 'var(--secondary)' }}>Productafbeelding</code>, <code className="rounded px-1" style={{ background: 'var(--secondary)' }}>Prijs (EUR)</code>, <code className="rounded px-1" style={{ background: 'var(--secondary)' }}>Merk</code>. English equivalents (Name, URL, Image, Price, Brand) also work. Comma, semicolon or tab delimited.
            </p>
          </div>
          <div>
            <input ref={csvRef} type="file" accept=".csv,text/csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onCsvChosen(f) }} />
            <button
              onClick={() => csvRef.current?.click()}
              disabled={csvBusy}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--ink)', color: 'var(--primary-foreground)' }}
            >
              {csvBusy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {csvBusy ? 'Importing…' : 'Choose CSV file'}
            </button>
          </div>
        </div>
        {csvMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs" style={{
            borderColor: csvMsg.type === 'ok' ? 'oklch(0.7 0.13 145 / 0.3)' : 'oklch(0.75 0.15 27 / 0.3)',
            background: csvMsg.type === 'ok' ? 'oklch(0.72 0.04 145 / 0.08)' : 'oklch(0.55 0.2 27 / 0.05)',
            color: csvMsg.type === 'ok' ? 'oklch(0.45 0.13 145)' : 'oklch(0.55 0.2 27)',
          }}>
            {csvMsg.type === 'ok' ? <FileText size={14} /> : <AlertCircle size={14} />}
            {csvMsg.text}
          </div>
        )}
      </div>

      {/* Staged review */}
      {(staged.length > 0 || savedCount > 0) && (
        <section>
          <div className="mb-4 flex items-center justify-between text-[10px] uppercase tracking-[0.24em]" style={{ color: 'var(--muted-foreground)' }}>
            <span className="flex items-center gap-2"><CheckCircle2 size={10} /> Pending review · {staged.length}</span>
            {savedCount > 0 && <span style={{ color: 'oklch(0.45 0.13 145)' }}>{savedCount} saved to catalog</span>}
          </div>
          {staged.length === 0 && (
            <div className="rounded-2xl border p-10 text-center text-sm" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
              All caught up. Approved items live in your catalog.
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {staged.map(p => (
              <article key={p.id} className="overflow-hidden rounded-2xl border shadow-sm" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
                <div
                  className="aspect-square w-full"
                  style={{
                    background: 'var(--secondary)',
                    backgroundImage: p.src ? `url(${p.src})` : undefined,
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                  }}
                />
                <div className="p-4">
                  <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--muted-foreground)' }}>{p.maker}</div>
                  <div className="mt-1 line-clamp-2 text-sm font-medium" style={{ color: 'var(--ink)' }}>{p.name}</div>
                  <div className="mt-1 flex items-center justify-between text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    <span>{p.category}</span>
                    <span style={{ color: 'var(--rust)' }}>{p.price}</span>
                  </div>
                  {cardErrors[p.id] && (
                    <p className="mt-2 text-[10px] leading-snug" style={{ color: 'oklch(0.55 0.2 27)' }}>
                      {cardErrors[p.id]}
                    </p>
                  )}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => approve(p)}
                      disabled={savingId === p.id}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[10px] font-medium uppercase tracking-[0.14em] transition-opacity hover:opacity-90 disabled:opacity-60"
                      style={{ background: 'var(--ink)', color: 'var(--primary-foreground)' }}
                    >
                      {savingId === p.id ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
                      {savingId === p.id ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      onClick={() => dismiss(p.id)}
                      disabled={savingId === p.id}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-[10px] font-medium uppercase tracking-[0.14em] transition-colors hover:bg-[var(--secondary)] disabled:opacity-60"
                      style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
                    >
                      <X size={11} /> Dismiss
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
