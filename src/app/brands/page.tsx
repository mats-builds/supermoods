'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowLeft, Search, X } from 'lucide-react'
import { brands, brandProducts } from '@/lib/brands'
import { useSelection } from '@/lib/selection-store'
import SideMenu from '@/components/shared/SideMenu'

/** Returns true when the accent color is dark enough to need white text */
function needsWhiteText(accentColor?: string): boolean {
  if (!accentColor) return false
  const m = accentColor.match(/oklch\(\s*([\d.]+)/)
  if (!m) return false
  return parseFloat(m[1]) < 0.65
}

export default function BrandsPage() {
  const router = useRouter()
  const { count } = useSelection()
  const [query, setQuery] = useState('')

  // Pre-compute category label + country for each brand (stable, no deps)
  const brandMeta = useMemo(() => brands.map(brand => {
    const prods = brandProducts(brand)
    const cats = Array.from(new Set(prods.map(p => p.category)))
    const catLine = cats.slice(0, 2).join(' & ')
    const country = brand.origin.split('·')[1]?.trim() ?? brand.origin
    return { brand, catLine, country }
  }), [])

  // Search filter
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return brandMeta
    return brandMeta.filter(({ brand }) =>
      brand.name.toLowerCase().includes(q) ||
      brand.tagline.toLowerCase().includes(q) ||
      brand.origin.toLowerCase().includes(q)
    )
  }, [brandMeta, query])

  return (
    <main className="min-h-screen pb-32" style={{ background: 'var(--background)' }}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-30 border-b backdrop-blur-md"
        style={{ borderColor: 'var(--border)', background: 'color-mix(in oklch, var(--background) 85%, transparent)' }}
      >
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-6 py-5 md:px-10">
          <div className="flex items-center gap-2">
            <SideMenu />
            <Link
              href="/"
              className="hidden items-center gap-1.5 text-[11px] uppercase tracking-display transition-opacity hover:opacity-60 md:flex"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <ArrowLeft size={11} strokeWidth={2} /> Catalog
            </Link>
          </div>
          <Link href="/" className="font-serif text-2xl tracking-wide md:text-3xl transition-opacity hover:opacity-70" style={{ color: 'var(--ink)' }}>
            Supermoods
          </Link>
          <button
            onClick={() => count > 0 && router.push('/canvas')}
            className="flex h-10 items-center gap-2 rounded-full px-4 text-sm transition-transform hover:scale-[1.02]"
            style={{ background: 'var(--ink)', color: 'var(--primary-foreground)' }}
          >
            <span className="tabular-nums font-medium">{count}</span>
            <span className="text-[11px] uppercase tracking-[0.18em]">Board</span>
          </button>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1500px] px-6 pb-10 pt-14 md:px-10 md:pt-20">
        {/* Breadcrumb */}
        <p className="text-[10px] uppercase tracking-[0.24em]" style={{ color: 'var(--muted-foreground)' }}>
          For interior designers · Trade program
        </p>

        {/* Heading + description side-by-side */}
        <div className="mt-4 flex items-end justify-between gap-10">
          <h1 className="font-serif text-6xl leading-[0.95] md:text-8xl" style={{ color: 'var(--ink)' }}>
            Brand<br />
            <em className="font-light italic" style={{ color: 'var(--rust)' }}>catalogs.</em>
          </h1>
          <p className="hidden max-w-xs pb-2 text-sm leading-relaxed md:block" style={{ color: 'var(--muted-foreground)' }}>
            Partner brands with stock loaded into Supermoods. Pick a house, drop its pieces straight
            onto a moodboard — no scraping, no waiting, trade pricing where applicable.
          </p>
        </div>
      </section>

      {/* ── Search bar ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1500px] px-6 pb-8 md:px-10">
        <div className="relative max-w-sm">
          <Search
            size={14}
            className="absolute left-4 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--muted-foreground)' }}
          />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search brands…"
            className="w-full rounded-full border py-2.5 pl-10 pr-10 text-sm focus:outline-none"
            style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--ink)' }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              <X size={13} style={{ color: 'var(--muted-foreground)' }} />
            </button>
          )}
        </div>
        {query && (
          <p className="mt-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {filtered.length} {filtered.length === 1 ? 'brand' : 'brands'} found
          </p>
        )}
      </section>

      {/* ── Brand grid ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1500px] px-6 md:px-10">
        {filtered.length === 0 ? (
          <p className="py-16 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
            No brands match "{query}".
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map(({ brand, catLine, country }) => {
              const white = needsWhiteText(brand.accentColor)
              const tileText = white ? '#ffffff' : 'var(--ink)'
              const tileMuted = white ? 'rgba(255,255,255,0.6)' : 'var(--muted-foreground)'

              return (
                <Link key={brand.slug} href={`/brands/${brand.slug}`}>
                  <article className="group cursor-pointer">

                    {/* Tile */}
                    <div
                      className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl transition-transform duration-500 group-hover:scale-[1.02]"
                      style={{ background: brand.accentColor ?? 'var(--secondary)' }}
                    >
                      {/* Arrow button — top right */}
                      <div
                        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110"
                        style={{ background: white ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)', color: tileText }}
                      >
                        <ArrowRight size={15} strokeWidth={1.8} />
                      </div>

                      {/* Brand name — centered */}
                      <div className="absolute inset-0 flex items-center justify-center p-8">
                        <p
                          className="text-center font-serif text-3xl uppercase leading-tight tracking-widest md:text-4xl"
                          style={{ color: tileText }}
                        >
                          {brand.name}
                        </p>
                      </div>
                    </div>

                    {/* Meta below tile */}
                    <div className="mt-3">
                      <div className="flex items-baseline justify-between">
                        <p
                          className="text-[10px] uppercase tracking-[0.2em]"
                          style={{ color: 'var(--muted-foreground)' }}
                        >
                          {catLine}{catLine && ' · '}{country}
                        </p>
                        <p
                          className="text-[10px] uppercase tracking-[0.2em]"
                          style={{ color: 'var(--muted-foreground)' }}
                        >
                          {brand.pieceCount} pieces
                        </p>
                      </div>
                      <p
                        className="mt-1 font-serif text-lg leading-tight"
                        style={{ color: 'var(--ink)' }}
                      >
                        {brand.name}
                      </p>
                    </div>
                  </article>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* Board footer */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-6">
        <div
          className={`pointer-events-auto mx-auto flex max-w-3xl items-center justify-between gap-4 rounded-full border px-3 py-3 pl-6 backdrop-blur-md transition-all duration-300 ${
            count === 0 ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'
          }`}
          style={{ background: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-soft-val)' }}
        >
          <span className="text-sm" style={{ color: 'oklch(0.22 0.02 50 / 0.8)' }}>
            {count} {count === 1 ? 'piece' : 'pieces'} on your board
          </span>
          <button
            onClick={() => router.push('/canvas')}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-transform hover:scale-[1.02]"
            style={{ background: 'var(--rust)', color: 'var(--primary-foreground)' }}
          >
            Create moodboard <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </main>
  )
}
