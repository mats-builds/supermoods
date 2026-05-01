'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, Eye, EyeOff, Trash2, Plus, Pencil, Loader2 } from 'lucide-react'
import { categories, type Category } from '@/lib/types'
import CatalogEditModal from '@/components/dashboard/CatalogEditModal'
import type { Product } from '@/lib/types'

type StoreProduct = Product & { visible: boolean }

export default function CatalogTab() {
  const [products, setProducts] = useState<StoreProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState<Category | ''>('')
  const [editing, setEditing] = useState<StoreProduct | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  async function loadProducts() {
    setLoading(true)
    try {
      const res = await fetch('/api/store/products')
      if (res.ok) setProducts(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadProducts() }, [])

  async function toggleVisible(p: StoreProduct) {
    setProducts(ps => ps.map(x => x.id === p.id ? { ...x, visible: !x.visible } : x))
    await fetch('/api/store/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: p.id, visible: !p.visible }),
    })
  }

  async function remove(id: string) {
    if (!confirm('Remove this product?')) return
    setProducts(ps => ps.filter(p => p.id !== id))
    await fetch('/api/store/products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  }

  async function saveEdit(id: string, patch: Partial<Product>) {
    const res = await fetch('/api/store/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...patch }),
    })
    if (res.ok) {
      const updated = await res.json()
      setProducts(ps => ps.map(p => p.id === id ? { ...p, ...updated } : p))
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter(p => {
      if (cat && p.category !== cat) return false
      if (q && !p.name.toLowerCase().includes(q) && !p.maker.toLowerCase().includes(q)) return false
      return true
    })
  }, [products, query, cat])

  const hiddenCount = products.filter(p => !p.visible).length

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[10px] uppercase tracking-[0.32em]" style={{ color: 'var(--muted-foreground)' }}>Inventory</p>
        <h1 className="font-serif text-5xl mt-3" style={{ color: 'var(--ink)' }}>Product Catalog</h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Manage your store's private catalog. Toggle visibility · edit product info.{' '}
          {hiddenCount > 0 && <>{hiddenCount} hidden · </>}{products.length} total.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search items"
            className="w-full rounded-full border py-2 pl-9 pr-3 text-sm outline-none"
            style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--ink)' }}
          />
        </div>
        <select
          value={cat}
          onChange={e => setCat(e.target.value as Category | '')}
          className="rounded-full border px-4 py-2 text-sm outline-none"
          style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--ink)' }}
        >
          <option value="">All categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-transform hover:scale-[1.02]"
          style={{ background: 'var(--ink)', color: 'var(--primary-foreground)' }}
        >
          <Plus size={14} /> Add product
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={20} className="animate-spin" style={{ color: 'var(--muted-foreground)' }} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
            {filtered.map(p => (
              <article
                key={p.id}
                className="group overflow-hidden rounded-2xl border shadow-sm transition-all hover:shadow-md"
                style={{ borderColor: 'var(--border)', background: 'var(--card)', opacity: p.visible ? 1 : 0.55 }}
              >
                <div
                  className="relative aspect-square w-full"
                  style={{
                    background: 'var(--secondary)',
                    backgroundImage: `url(${p.src})`,
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                  }}
                >
                  <span
                    className="absolute left-3 top-3 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.18em]"
                    style={{
                      background: p.visible ? 'oklch(0.96 0.01 80 / 0.9)' : 'oklch(0.22 0.02 50 / 0.8)',
                      color: p.visible ? 'var(--ink)' : 'var(--primary-foreground)',
                    }}
                  >
                    {p.visible ? 'Visible' : 'Hidden'}
                  </span>
                </div>
                <div className="p-4">
                  <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--muted-foreground)' }}>{p.maker}</div>
                  <div className="mt-1 line-clamp-2 text-sm font-medium" style={{ color: 'var(--ink)' }}>{p.name}</div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-sm font-serif" style={{ color: 'var(--ink)' }}>{p.price}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditing(p)}
                        className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] transition-colors hover:bg-[var(--ink)] hover:text-[var(--primary-foreground)] hover:border-[var(--ink)]"
                        style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
                      >
                        <Pencil size={11} /> Edit
                      </button>
                      <button
                        onClick={() => toggleVisible(p)}
                        className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] transition-colors hover:bg-[var(--ink)] hover:text-[var(--primary-foreground)] hover:border-[var(--ink)]"
                        style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
                      >
                        {p.visible ? <EyeOff size={12} /> : <Eye size={12} />}
                        {p.visible ? 'Hide' : 'Show'}
                      </button>
                      <button
                        onClick={() => remove(p.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-full border transition-colors hover:bg-[var(--rust)] hover:text-[var(--primary-foreground)] hover:border-[var(--rust)]"
                        style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
                        title="Remove"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {filtered.length === 0 && !loading && (
            <div className="rounded-2xl border p-16 text-center text-sm" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
              {products.length === 0
                ? 'No products yet. Add your first product to get started.'
                : 'No products match these filters.'}
            </div>
          )}
        </>
      )}

      {addOpen && (
        <AddProductModal
          onAdd={async (p) => {
            const res = await fetch('/api/store/products', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(p),
            })
            if (res.ok) {
              const created = await res.json()
              setProducts(ps => [...ps, { ...created, visible: true }])
            }
            setAddOpen(false)
          }}
          onClose={() => setAddOpen(false)}
        />
      )}

      {editing && (
        <CatalogEditModal
          product={editing}
          onSave={patch => { saveEdit(editing.id, patch); setEditing(null) }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function AddProductModal({ onAdd, onClose }: {
  onAdd: (product: Omit<Product, 'id'>) => Promise<void>
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [maker, setMaker] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState<Category>('Seating')
  const [src, setSrc] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await onAdd({ name, maker, price, category, src, colors: [], role: 'ground' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{ background: 'oklch(0.22 0.02 50 / 0.5)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />
      <form
        onSubmit={submit}
        className="relative z-10 w-full max-w-lg rounded-3xl border p-8 space-y-4"
        style={{ background: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-soft-val)' }}
      >
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em]" style={{ color: 'var(--muted-foreground)' }}>New product</p>
          <h2 className="mt-1 font-serif text-2xl" style={{ color: 'var(--ink)' }}>Add to catalog</h2>
        </div>
        {[
          { label: 'Name', val: name, set: setName, type: 'text', required: true },
          { label: 'Brand / Maker', val: maker, set: setMaker, type: 'text', required: false },
          { label: 'Price (e.g. € 1,200)', val: price, set: setPrice, type: 'text', required: false },
          { label: 'Image URL', val: src, set: setSrc, type: 'url', required: true },
        ].map(({ label, val, set, type, required }) => (
          <div key={label}>
            <label className="block text-[10px] uppercase tracking-[0.22em] mb-1.5" style={{ color: 'var(--muted-foreground)' }}>{label}</label>
            <input
              type={type}
              required={required}
              value={val}
              onChange={e => set(e.target.value)}
              className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none"
              style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--ink)' }}
            />
          </div>
        ))}
        <div>
          <label className="block text-[10px] uppercase tracking-[0.22em] mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Category</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value as Category)}
            className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none"
            style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--ink)' }}
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border px-6 py-2.5 text-sm"
            style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium disabled:opacity-50"
            style={{ background: 'var(--ink)', color: 'var(--primary-foreground)' }}
          >
            {loading && <Loader2 size={13} className="animate-spin" />}
            Add product
          </button>
        </div>
      </form>
    </div>
  )
}
