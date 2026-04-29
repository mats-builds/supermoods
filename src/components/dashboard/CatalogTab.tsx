'use client'

import { useMemo, useState } from 'react'
import { Search, Eye, EyeOff, Trash2, Plus } from 'lucide-react'
import { catalog } from '@/lib/catalog'
import { categories, type Category } from '@/lib/types'
import { useUserProducts } from '@/lib/user-products-store'
import AddWithUrlDialog from '@/components/shared/AddWithUrlDialog'

export default function CatalogTab() {
  const { products: userProducts, hiddenIds, toggleHidden, remove } = useUserProducts()
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState<Category | ''>('')
  const [addOpen, setAddOpen] = useState(false)

  const allProducts = useMemo(() => {
    const seen = new Set<string>()
    return [...userProducts, ...catalog].filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true })
  }, [userProducts])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allProducts.filter(p => {
      if (cat && p.category !== cat) return false
      if (q && !p.name.toLowerCase().includes(q) && !p.maker.toLowerCase().includes(q)) return false
      return true
    })
  }, [allProducts, query, cat])

  const hiddenCount = allProducts.filter(p => hiddenIds.has(p.id)).length
  const isUserAdded = (id: string) => userProducts.some(p => p.id === id)

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[10px] uppercase tracking-[0.32em]" style={{ color: 'var(--muted-foreground)' }}>Inventory</p>
        <h1 className="font-serif text-5xl mt-3" style={{ color: 'var(--ink)' }}>Product Catalog</h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Toggle visibility for items in or out of stock. {hiddenCount} hidden · {allProducts.length} total.
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
          <Plus size={14} /> Add with URL
        </button>
      </div>

      <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
        {filtered.map(p => {
          const hidden = hiddenIds.has(p.id)
          const userAdded = isUserAdded(p.id)
          return (
            <article
              key={p.id}
              className="group overflow-hidden rounded-2xl border shadow-sm transition-all hover:shadow-md"
              style={{ borderColor: 'var(--border)', background: 'var(--card)', opacity: hidden ? 0.55 : 1 }}
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
                    background: hidden ? 'oklch(0.22 0.02 50 / 0.8)' : 'oklch(0.96 0.01 80 / 0.9)',
                    color: hidden ? 'var(--primary-foreground)' : 'var(--ink)',
                  }}
                >
                  {hidden ? 'Out of stock' : 'In stock'}
                </span>
                {userAdded && (
                  <span className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.18em]" style={{ background: 'oklch(0.55 0.14 40 / 0.15)', color: 'var(--rust)' }}>
                    Added
                  </span>
                )}
              </div>
              <div className="p-4">
                <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--muted-foreground)' }}>{p.maker}</div>
                <div className="mt-1 line-clamp-2 text-sm font-medium" style={{ color: 'var(--ink)' }}>{p.name}</div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-sm font-serif" style={{ color: 'var(--ink)' }}>{p.price}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => toggleHidden(p.id)}
                      className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] transition-colors hover:bg-[var(--ink)] hover:text-[var(--primary-foreground)] hover:border-[var(--ink)]"
                      style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
                    >
                      {hidden ? <Eye size={12} /> : <EyeOff size={12} />}
                      {hidden ? 'Show' : 'Hide'}
                    </button>
                    {userAdded && (
                      <button
                        onClick={() => remove(p.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-full border transition-colors hover:bg-[var(--rust)] hover:text-[var(--primary-foreground)] hover:border-[var(--rust)]"
                        style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
                        title="Remove"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl border p-16 text-center text-sm" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
          No products match these filters.
        </div>
      )}

      <AddWithUrlDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  )
}
