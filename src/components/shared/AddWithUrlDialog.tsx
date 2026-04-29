'use client'

import { useState } from 'react'
import { Link2, Loader2, Check, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { userProductsStore } from '@/lib/user-products-store'
import type { Product, Category, Role } from '@/lib/types'

const VALID_CATEGORIES: Category[] = ['Seating', 'Tables', 'Lighting', 'Storage', 'Decor', 'Textiles', 'Art']
const VALID_ROLES: Role[] = ['floor', 'ground', 'surface', 'hanging', 'standing', 'wall', 'prop']

type Status = 'idle' | 'loading' | 'preview' | 'error'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
}

export default function AddWithUrlDialog({ open, onOpenChange }: Props) {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [draft, setDraft] = useState<Product | null>(null)
  const [activeImage, setActiveImage] = useState(0)

  function reset() {
    setUrl(''); setStatus('idle'); setError(''); setDraft(null); setActiveImage(0)
  }

  async function handleScrape(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return
    setStatus('loading'); setError('')
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Scrape failed')
      const cat = (data.category as Category) || 'Decor'
      const role = (data.role as Role) || 'ground'
      setDraft({
        id: crypto.randomUUID(),
        name: data.name,
        maker: data.maker || '—',
        price: data.price || '—',
        category: VALID_CATEGORIES.includes(cat) ? cat : 'Decor',
        role: VALID_ROLES.includes(role) ? role : 'ground',
        src: data.image_url || '',
        colors: ['linen', 'cream'],
        description: data.description,
        gallery: data.gallery,
        sourceUrl: data.sourceUrl || url.trim(),
      })
      setActiveImage(0)
      setStatus('preview')
    } catch (err: any) {
      setError(err.message || "Couldn't read that page. Try another URL.")
      setStatus('error')
    }
  }

  function handleConfirm() {
    if (!draft) return
    const p = draft.gallery?.[activeImage - 1]
      ? { ...draft, src: [draft.src, ...(draft.gallery ?? [])][activeImage] }
      : draft
    userProductsStore.add(p)
    reset()
    onOpenChange(false)
  }

  if (!open) return null

  const previewImages = draft ? [draft.src, ...(draft.gallery ?? [])].filter(Boolean) : []

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 backdrop-blur-sm" style={{ background: 'oklch(0.22 0.02 50 / 0.5)' }} onClick={() => { reset(); onOpenChange(false) }} />
      <div className="relative z-10 w-full max-w-lg rounded-3xl overflow-hidden" style={{ background: 'var(--card)' }}>
        {/* Header */}
        <div className="flex items-start justify-between border-b px-6 py-5" style={{ borderColor: 'var(--border)' }}>
          <div>
            <p className="text-[11px] uppercase tracking-display" style={{ color: 'var(--muted-foreground)' }}>Add with URL</p>
            <h2 className="mt-1 font-serif text-2xl" style={{ color: 'var(--ink)' }}>Paste a product link</h2>
            <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
              From any furniture site — we'll fetch the image and details.
            </p>
          </div>
          <button onClick={() => { reset(); onOpenChange(false) }} className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[var(--secondary)]" style={{ color: 'var(--muted-foreground)' }}>
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {(status === 'idle' || status === 'loading' || status === 'error') && (
            <form onSubmit={handleScrape} className="space-y-3">
              <label className="flex items-center gap-2 rounded-2xl border px-4 py-3 focus-within:border-[var(--ink)]" style={{ borderColor: 'var(--border)', background: 'var(--background)' }}>
                <Link2 size={16} style={{ color: 'var(--muted-foreground)' }} />
                <input
                  type="text"
                  inputMode="url"
                  autoComplete="off"
                  spellCheck={false}
                  required
                  autoFocus
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://brand.com/product"
                  className="flex-1 bg-transparent text-sm focus:outline-none"
                  style={{ color: 'var(--ink)' }}
                  disabled={status === 'loading'}
                />
              </label>
              <button
                type="submit"
                disabled={status === 'loading' || !url.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm transition-opacity disabled:opacity-50"
                style={{ background: 'var(--ink)', color: 'var(--primary-foreground)' }}
              >
                {status === 'loading' ? <><Loader2 size={16} className="animate-spin" /> Reading the page…</> : 'Fetch product'}
              </button>
              {error && <p className="rounded-xl px-3 py-2 text-xs" style={{ background: 'oklch(0.55 0.2 27 / 0.1)', color: 'oklch(0.55 0.2 27)' }}>{error}</p>}
            </form>
          )}

          {status === 'preview' && draft && (
            <div className="space-y-4">
              {/* Image */}
              <div className="relative overflow-hidden rounded-2xl" style={{ background: 'var(--secondary)' }}>
                {previewImages[activeImage]
                  ? <img src={previewImages[activeImage]} alt={draft.name} className="h-56 w-full object-contain p-4" />
                  : <div className="flex h-56 items-center justify-center text-sm" style={{ color: 'var(--muted-foreground)' }}>No image found</div>
                }
                {previewImages.length > 1 && (
                  <>
                    <button onClick={() => setActiveImage(i => Math.max(0, i - 1))} disabled={activeImage === 0} className="absolute left-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full disabled:opacity-30" style={{ background: 'var(--card)', color: 'var(--ink)' }}>
                      <ChevronLeft size={14} />
                    </button>
                    <button onClick={() => setActiveImage(i => Math.min(previewImages.length - 1, i + 1))} disabled={activeImage === previewImages.length - 1} className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full disabled:opacity-30" style={{ background: 'var(--card)', color: 'var(--ink)' }}>
                      <ChevronRight size={14} />
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                      {previewImages.map((_, i) => <div key={i} className="h-1.5 w-1.5 rounded-full transition-opacity" style={{ background: 'var(--ink)', opacity: i === activeImage ? 1 : 0.3 }} />)}
                    </div>
                  </>
                )}
              </div>

              {/* Editable fields */}
              <div className="space-y-3">
                <Field label="Category">
                  <select value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value as Category })} className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--ink)' }}>
                    {VALID_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Brand">
                  <input value={draft.maker} onChange={e => setDraft({ ...draft, maker: e.target.value })} className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--ink)' }} />
                </Field>
                <Field label="Name">
                  <input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} className="w-full rounded-xl border px-3 py-2 font-serif text-base focus:outline-none" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--ink)' }} />
                </Field>
                <Field label="Price">
                  <input value={draft.price} onChange={e => setDraft({ ...draft, price: e.target.value })} className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--rust)' }} />
                </Field>
              </div>

              <div className="flex gap-2">
                <button onClick={reset} className="flex flex-1 items-center justify-center gap-2 rounded-2xl border py-3 text-sm transition-colors hover:bg-[var(--secondary)]" style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}>
                  <X size={14} /> Try another
                </button>
                <button onClick={handleConfirm} className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm transition-transform hover:scale-[1.01]" style={{ background: 'var(--rust)', color: 'var(--primary-foreground)' }}>
                  <Check size={14} /> Add to catalog
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--muted-foreground)' }}>{label}</span>
      {children}
    </label>
  )
}
