'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Plus, Check, X, ArrowRight, Building2 } from 'lucide-react'
import { catalog } from '@/lib/catalog'
import { categories, type Category } from '@/lib/types'
import { useSelection } from '@/lib/selection-store'
import { useUserProducts } from '@/lib/user-products-store'
import ProductModal from '@/components/catalog/ProductModal'
import SideMenu from '@/components/shared/SideMenu'
import type { Product } from '@/lib/types'

export default function CatalogPage() {
  const router = useRouter()
  const { has, toggle, count, clear } = useSelection()
  const { products: userProducts, hiddenIds } = useUserProducts()
  const [filter, setFilter] = useState<Category | 'All'>('All')
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [active, setActive] = useState<Product | null>(null)

  const allProducts = useMemo(() => {
    const seen = new Set<string>()
    const merged = [...userProducts, ...catalog].filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true })
    return merged.filter(p => !hiddenIds.has(p.id))
  }, [userProducts, hiddenIds])

  const items = useMemo(() => {
    return allProducts.filter(p => {
      const matchCat = filter === 'All' || p.category === filter
      const q = query.trim().toLowerCase()
      const matchQ = !q || p.name.toLowerCase().includes(q) || p.maker.toLowerCase().includes(q)
      return matchCat && matchQ
    })
  }, [allProducts, filter, query])

  return (
    <main className="min-h-screen pb-32">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-[var(--background)]/85 backdrop-blur-md" style={{ borderColor: 'var(--border)' }}>
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-6 py-5 md:px-10">
          <div className="flex items-center gap-2">
            <SideMenu />
            <span className="hidden text-[11px] uppercase tracking-display md:block" style={{ color: 'var(--muted-foreground)' }}>Collection 2026</span>
          </div>
          <span className="font-serif text-2xl md:text-3xl" style={{ color: 'var(--ink)' }}>
            Supermoods
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(v => !v)}
              className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-[var(--secondary)]"
              style={{ color: 'var(--ink)' }}
            >
              <Search size={18} strokeWidth={1.6} />
            </button>
            <button
              onClick={() => count > 0 && router.push('/canvas')}
              className="relative flex h-10 items-center gap-2 rounded-full px-4 text-sm transition-transform hover:scale-[1.02]"
              style={{ background: 'var(--ink)', color: 'var(--primary-foreground)' }}
            >
              <span className="tabular-nums font-medium">{count}</span>
              <span className="text-[11px] uppercase tracking-[0.18em]">Board</span>
            </button>
          </div>
        </div>
        {searchOpen && (
          <div className="border-t px-6 py-3 md:px-10" style={{ borderColor: 'var(--border)' }}>
            <div className="mx-auto flex max-w-[1500px] items-center gap-3">
              <Search size={16} style={{ color: 'var(--muted-foreground)' }} />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search the catalog…"
                className="flex-1 bg-transparent py-1 font-serif text-xl focus:outline-none"
                style={{ color: 'var(--ink)' }}
              />
              {query && (
                <button onClick={() => setQuery('')}><X size={16} style={{ color: 'var(--muted-foreground)' }} /></button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-[1500px] px-6 pb-8 pt-12 md:px-10 md:pt-16">
        <p className="text-xs uppercase tracking-display" style={{ color: 'var(--muted-foreground)' }}>
          The catalog · 2026 collection
        </p>
        <div className="mt-3 flex items-end justify-between gap-6">
          <h1 className="font-serif text-5xl leading-[0.95] md:text-7xl" style={{ color: 'var(--ink)' }}>
            Choose your<br />
            <em className="font-light italic" style={{ color: 'var(--rust)' }}>pieces.</em>
          </h1>
          <p className="hidden max-w-sm text-sm leading-relaxed md:block" style={{ color: 'var(--muted-foreground)' }}>
            Tap the <span className="inline-flex h-5 w-5 translate-y-1 items-center justify-center rounded-full text-[var(--primary-foreground)]" style={{ background: 'var(--ink)' }}><Plus size={12} /></span> on
            anything you love. When you're ready, generate a moodboard tuned to your selection.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="mx-auto max-w-[1500px] px-6 md:px-10">
        <div className="flex flex-wrap items-center gap-2 border-b pb-5" style={{ borderColor: 'var(--border)' }}>
          {(['All', ...categories] as const).map(cat => {
            const isActive = filter === cat
            return (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className="rounded-full px-4 py-1.5 text-[11px] uppercase tracking-[0.2em] transition-colors"
                style={isActive
                  ? { background: 'var(--ink)', color: 'var(--primary-foreground)' }
                  : { border: '1px solid var(--border)', color: 'var(--muted-foreground)' }
                }
              >
                {cat}
              </button>
            )
          })}

          {/* Brand catalogs entry */}
          <Link
            href="/brands"
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[11px] uppercase tracking-[0.2em] transition-colors hover:opacity-80"
            style={{ background: 'var(--rust)', color: 'var(--primary-foreground)' }}
          >
            <Building2 size={11} strokeWidth={2} /> Brand catalogs
          </Link>

          <span className="ml-auto text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {items.length} {items.length === 1 ? 'piece' : 'pieces'}
          </span>
        </div>
      </section>

      {/* Grid */}
      <section className="mx-auto mt-10 max-w-[1500px] px-6 md:px-10">
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
          {items.map(p => {
            const selected = has(p.id)
            return (
              <article key={p.id} className="group relative">
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl" style={{ background: 'var(--secondary)' }}>
                  <button
                    onClick={() => setActive(p)}
                    className="absolute inset-0 block focus:outline-none"
                  >
                    <img
                      src={p.src}
                      alt={p.name}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-contain p-6 transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); toggle(p.id) }}
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full ring-1 transition-all"
                    style={selected
                      ? { background: 'var(--rust)', color: 'var(--primary-foreground)' }
                      : { background: 'var(--card)', color: 'var(--ink)' }
                    }
                  >
                    {selected ? <Check size={16} strokeWidth={2.4} /> : <Plus size={16} />}
                  </button>
                </div>
                <button onClick={() => setActive(p)} className="mt-4 flex w-full items-start justify-between gap-3 text-left">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--muted-foreground)' }}>
                      {p.category} · {p.maker}
                    </p>
                    <h3 className="mt-1 font-serif text-xl leading-tight" style={{ color: 'var(--ink)' }}>
                      {p.name}
                    </h3>
                  </div>
                  <p className="shrink-0 font-serif text-base" style={{ color: 'oklch(0.22 0.02 50 / 0.8)' }}>
                    {p.price}
                  </p>
                </button>
              </article>
            )
          })}
        </div>
      </section>

      {/* Sticky footer */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-6">
        <div
          className={`pointer-events-auto mx-auto flex max-w-3xl items-center justify-between gap-4 rounded-full border px-3 py-3 pl-6 backdrop-blur-md transition-all duration-300 ${
            count === 0 ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'
          }`}
          style={{ background: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-soft-val)' }}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full font-serif text-sm tabular-nums" style={{ background: 'var(--ink)', color: 'var(--primary-foreground)' }}>
              {count}
            </span>
            <span className="text-sm" style={{ color: 'oklch(0.22 0.02 50 / 0.8)' }}>
              {count === 1 ? 'piece selected' : 'pieces selected'}
            </span>
            <button onClick={clear} className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--muted-foreground)' }}>
              Clear
            </button>
          </div>
          <button
            onClick={() => router.push('/canvas')}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-transform hover:scale-[1.02]"
            style={{ background: 'var(--rust)', color: 'var(--primary-foreground)' }}
          >
            Create moodboard <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {active && (
        <ProductModal
          product={active}
          selected={has(active.id)}
          onToggle={() => toggle(active.id)}
          onClose={() => setActive(null)}
        />
      )}
    </main>
  )
}
