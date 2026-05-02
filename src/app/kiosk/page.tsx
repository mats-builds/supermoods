'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Check, X, RotateCcw, ArrowRight } from 'lucide-react'
import { categories, type Category } from '@/lib/types'
import ProductModal from '@/components/catalog/ProductModal'
import type { Product } from '@/lib/types'

// Auto-reset after 3 minutes of inactivity
const IDLE_MS = 3 * 60 * 1000

export default function KioskPage() {
  const router = useRouter()
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [filter, setFilter] = useState<Category | 'All'>('All')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [active, setActive] = useState<Product | null>(null)
  const [exitOpen, setExitOpen] = useState(false)
  const [exitPass, setExitPass] = useState('')
  const [exitError, setExitError] = useState('')
  const [tapCount, setTapCount] = useState(0)

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.ok ? r.json() : [])
      .then(setAllProducts)
      .catch(() => setAllProducts([]))
  }, [])

  // Idle reset
  const reset = useCallback(() => {
    setFilter('All')
    setQuery('')
    setSelected(new Set())
    setActive(null)
  }, [])

  useEffect(() => {
    let timer = setTimeout(reset, IDLE_MS)
    const touch = () => { clearTimeout(timer); timer = setTimeout(reset, IDLE_MS) }
    window.addEventListener('touchstart', touch)
    window.addEventListener('mousemove', touch)
    window.addEventListener('click', touch)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('touchstart', touch)
      window.removeEventListener('mousemove', touch)
      window.removeEventListener('click', touch)
    }
  }, [reset])

  const items = useMemo(() => {
    return allProducts.filter(p => {
      const matchCat = filter === 'All' || p.category === filter
      const q = query.trim().toLowerCase()
      const matchQ = !q || p.name.toLowerCase().includes(q) || p.maker.toLowerCase().includes(q)
      return matchCat && matchQ
    })
  }, [allProducts, filter, query])

  function toggle(id: string) {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function startMoodboard() {
    // Push selected IDs into the shared selectionStore, then navigate
    import('@/lib/selection-store').then(({ selectionStore }) => {
      selectionStore.clear()
      Array.from(selected).forEach(id => selectionStore.toggle(id))
      router.push('/canvas')
    })
  }

  // Hidden exit: tap the logo 5 times
  function handleLogoTap() {
    const next = tapCount + 1
    setTapCount(next)
    if (next >= 5) { setExitOpen(true); setTapCount(0) }
    setTimeout(() => setTapCount(0), 2000)
  }

  async function handleExit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/atelier/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passphrase: exitPass }),
    })
    if (res.ok) {
      window.location.href = '/atelier/dashboard'
    } else {
      setExitError('Incorrect passphrase.')
    }
  }

  return (
    <div className="min-h-screen select-none" style={{ background: 'var(--background)', color: 'var(--ink)', userSelect: 'none' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-30 border-b backdrop-blur-md"
        style={{ borderColor: 'var(--border)', background: 'var(--card)/85' }}
      >
        <div className="flex items-center justify-between px-8 py-5">
          {/* Logo — 5-tap hidden exit trigger */}
          <button
            onClick={handleLogoTap}
            className="focus:outline-none"
            aria-label="Supermoods"
          >
            <span className="font-serif text-3xl" style={{ color: 'var(--ink)' }}>Supermoods</span>
          </button>

          {/* Search */}
          <div className="relative w-72">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search the collection…"
              className="w-full rounded-full border py-3 pl-11 pr-4 text-sm focus:outline-none"
              style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--ink)' }}
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2">
                <X size={14} style={{ color: 'var(--muted-foreground)' }} />
              </button>
            )}
          </div>

          {/* Reset */}
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm transition-colors hover:bg-[var(--secondary)]"
            style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
          >
            <RotateCcw size={14} /> New customer
          </button>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap items-center gap-2 border-t px-8 py-4" style={{ borderColor: 'var(--border)' }}>
          {(['All', ...categories] as const).map(cat => {
            const isActive = filter === cat
            return (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className="rounded-full px-5 py-2 text-[11px] uppercase tracking-[0.2em] transition-colors"
                style={isActive
                  ? { background: 'var(--ink)', color: 'var(--primary-foreground)' }
                  : { border: '1px solid var(--border)', color: 'var(--muted-foreground)' }
                }
              >
                {cat}
              </button>
            )
          })}
          <span className="ml-auto text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {items.length} {items.length === 1 ? 'piece' : 'pieces'}
          </span>
        </div>
      </header>

      {/* Grid */}
      <section className="mx-auto max-w-[1400px] px-8 py-10">
        <div className="grid grid-cols-3 gap-x-8 gap-y-14 lg:grid-cols-4">
          {items.map(p => {
            const sel = selected.has(p.id)
            return (
              <article key={p.id} className="group relative">
                <div
                  className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl"
                  style={{ background: 'var(--secondary)' }}
                >
                  <button
                    onClick={() => setActive(p)}
                    className="absolute inset-0 block focus:outline-none"
                  >
                    <img
                      src={p.src}
                      alt={p.name}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-contain p-8 transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); toggle(p.id) }}
                    className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full ring-1 transition-all"
                    style={sel
                      ? { background: 'var(--rust)', color: 'var(--primary-foreground)' }
                      : { background: 'var(--card)', color: 'var(--ink)' }
                    }
                  >
                    {sel ? <Check size={18} strokeWidth={2.4} /> : <Plus size={18} />}
                  </button>
                </div>
                <div className="mt-5">
                  <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--muted-foreground)' }}>
                    {p.category} · {p.maker}
                  </p>
                  <h3 className="mt-1.5 font-serif text-2xl leading-tight" style={{ color: 'var(--ink)' }}>
                    {p.name}
                  </h3>
                  <p className="mt-1 font-serif text-lg" style={{ color: 'oklch(0.22 0.02 50 / 0.7)' }}>
                    {p.price}
                  </p>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {/* Selection banner */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-6 pb-8">
        <div
          className={`pointer-events-auto mx-auto flex max-w-3xl items-center justify-between gap-4 rounded-full border px-4 py-4 pl-7 backdrop-blur-md transition-all duration-300 ${
            selected.size === 0 ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'
          }`}
          style={{ background: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-soft-val)' }}
        >
          <div className="flex items-center gap-4">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full font-serif text-base tabular-nums"
              style={{ background: 'var(--ink)', color: 'var(--primary-foreground)' }}
            >
              {selected.size}
            </span>
            <span className="text-sm" style={{ color: 'oklch(0.22 0.02 50 / 0.8)' }}>
              {selected.size === 1 ? 'piece selected' : 'pieces selected'}
            </span>
            <button
              onClick={() => setSelected(new Set())}
              className="text-[11px] uppercase tracking-[0.18em]"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Clear
            </button>
          </div>
          <button
            onClick={startMoodboard}
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-transform hover:scale-[1.02]"
            style={{ background: 'var(--rust)', color: 'var(--primary-foreground)' }}
          >
            Create moodboard <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Product modal */}
      {active && (
        <ProductModal
          product={active}
          selected={selected.has(active.id)}
          onToggle={() => toggle(active.id)}
          onClose={() => setActive(null)}
        />
      )}

      {/* Hidden exit overlay */}
      {exitOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6" style={{ background: 'oklch(0.22 0.02 50 / 0.7)' }}>
          <div className="w-full max-w-sm rounded-3xl p-8" style={{ background: 'var(--card)' }}>
            <p className="text-center font-serif text-2xl mb-6" style={{ color: 'var(--ink)' }}>Exit kiosk</p>
            <form onSubmit={handleExit} className="space-y-4">
              <input
                type="password"
                autoFocus
                value={exitPass}
                onChange={e => { setExitPass(e.target.value); setExitError('') }}
                placeholder="Enter owner passphrase"
                className="w-full rounded-xl border px-4 py-3 text-base focus:outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--ink)' }}
              />
              {exitError && <p className="text-xs" style={{ color: 'oklch(0.55 0.2 27)' }}>{exitError}</p>}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setExitOpen(false); setExitPass(''); setExitError('') }}
                  className="flex-1 rounded-full border py-3 text-sm"
                  style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-full py-3 text-sm"
                  style={{ background: 'var(--ink)', color: 'var(--primary-foreground)' }}
                >
                  Exit →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
