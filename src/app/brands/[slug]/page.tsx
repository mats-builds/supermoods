'use client'

import { use, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Check, ArrowRight, ExternalLink } from 'lucide-react'
import { getBrand, brandProducts } from '@/lib/brands'
import { useSelection } from '@/lib/selection-store'
import SideMenu from '@/components/shared/SideMenu'
import ProductModal from '@/components/catalog/ProductModal'
import type { Product } from '@/lib/types'

export default function BrandPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const brand = getBrand(slug)
  const router = useRouter()
  const { has, toggle, count, clear } = useSelection()
  const [active, setActive] = useState<Product | null>(null)
  const [catFilter, setCatFilter] = useState<string>('All')

  if (!brand) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="font-serif text-2xl" style={{ color: 'var(--ink)' }}>Brand not found.</p>
        <Link href="/brands" className="text-sm underline" style={{ color: 'var(--muted-foreground)' }}>
          Back to Brand Catalogs
        </Link>
      </div>
    )
  }

  const products = brandProducts(brand)

  // Unique categories derived from this brand's products
  const productCats = useMemo(() => {
    const seen = new Set<string>()
    products.forEach(p => seen.add(p.category))
    return Array.from(seen)
  }, [products])

  // Breadcrumb category line e.g. "SEATING & TABLES & LIGHTING"
  const catBreadcrumb = productCats.join(' & ').toUpperCase()

  // Filtered product list
  const filteredProducts = useMemo(
    () => catFilter === 'All' ? products : products.filter(p => p.category === catFilter),
    [products, catFilter],
  )

  // External link: first product's sourceUrl if available
  const siteUrl = products[0]?.sourceUrl

  return (
    <main className="min-h-screen pb-32">
      {/* Header */}
      <header
        className="sticky top-0 z-30 border-b backdrop-blur-md"
        style={{ borderColor: 'var(--border)', background: 'color-mix(in oklch, var(--background) 85%, transparent)' }}
      >
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-6 py-5 md:px-10">
          <div className="flex items-center gap-3">
            <SideMenu />
            <Link
              href="/brands"
              className="hidden items-center gap-1.5 text-[11px] uppercase tracking-display transition-opacity hover:opacity-60 md:flex"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <ArrowLeft size={11} strokeWidth={2} /> Brand Catalogs
            </Link>
          </div>

          <Link href="/" className="font-serif text-2xl md:text-3xl" style={{ color: 'var(--ink)' }}>
            Supermoods
          </Link>

          <button
            onClick={() => count > 0 && router.push('/canvas')}
            className="relative flex h-10 items-center gap-2 rounded-full px-4 text-sm transition-transform hover:scale-[1.02]"
            style={{ background: 'var(--ink)', color: 'var(--primary-foreground)' }}
          >
            <span className="tabular-nums font-medium">{count}</span>
            <span className="text-[11px] uppercase tracking-[0.18em]">Board</span>
          </button>
        </div>
      </header>

      {/* ── Brand hero ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1500px] px-6 py-12 md:px-10 md:py-16">
        <div className="flex items-start gap-10">

          {/* Logo tile */}
          <div
            className="hidden md:flex aspect-square w-[220px] shrink-0 flex-col items-center justify-center rounded-2xl p-8"
            style={{ background: 'var(--secondary)' }}
          >
            <p
              className="font-serif text-center text-2xl leading-snug"
              style={{ color: 'var(--ink)' }}
            >
              {brand.name}
            </p>
            <div
              className="my-4 h-px w-10"
              style={{ background: 'var(--border)' }}
            />
            {brand.foundedYear && (
              <p
                className="text-[10px] uppercase tracking-[0.22em]"
                style={{ color: 'var(--muted-foreground)' }}
              >
                since {brand.foundedYear}
              </p>
            )}
          </div>

          {/* Brand info */}
          <div className="flex-1 pt-1">
            {/* Meta breadcrumb */}
            <p
              className="text-[10px] uppercase tracking-[0.22em]"
              style={{ color: 'var(--muted-foreground)' }}
            >
              {catBreadcrumb && `${catBreadcrumb} · `}{brand.origin.toUpperCase()}
            </p>

            {/* Brand name */}
            <h1
              className="mt-3 font-serif text-5xl leading-[0.95] md:text-7xl"
              style={{ color: 'var(--ink)' }}
            >
              {brand.name}
            </h1>

            {/* Description */}
            <p
              className="mt-5 max-w-xl text-sm leading-relaxed"
              style={{ color: 'var(--muted-foreground)' }}
            >
              {brand.description}
            </p>

            {/* Status + website */}
            <div className="mt-6 flex items-center gap-5">
              <span
                className="text-[10px] uppercase tracking-[0.22em]"
                style={{ color: 'var(--rust)' }}
              >
                In stock · Ready to compose
              </span>
              {siteUrl && (
                <a
                  href={siteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] transition-opacity hover:opacity-60"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  Visit website <ExternalLink size={10} />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Category filter bar ─────────────────────────────────────────── */}
      <section
        className="mx-auto max-w-[1500px] border-t px-6 md:px-10"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2 py-5">
          {/* All pill */}
          <button
            onClick={() => setCatFilter('All')}
            className="rounded-full px-5 py-2 text-[11px] uppercase tracking-[0.2em] transition-colors"
            style={catFilter === 'All'
              ? { background: 'var(--ink)', color: 'var(--primary-foreground)' }
              : { border: '1px solid var(--border)', color: 'var(--muted-foreground)' }
            }
          >
            All
          </button>

          {productCats.map(cat => (
            <button
              key={cat}
              onClick={() => setCatFilter(cat)}
              className="rounded-full px-5 py-2 text-[11px] uppercase tracking-[0.2em] transition-colors"
              style={catFilter === cat
                ? { background: 'var(--ink)', color: 'var(--primary-foreground)' }
                : { border: '1px solid var(--border)', color: 'var(--muted-foreground)' }
              }
            >
              {cat}
            </button>
          ))}

          <span
            className="ml-auto text-xs"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {filteredProducts.length} {filteredProducts.length === 1 ? 'piece' : 'pieces'}
          </span>
        </div>
      </section>

      {/* ── Product grid ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1500px] px-6 pb-10 pt-8 md:px-10">
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
          {filteredProducts.map(p => {
            const selected = has(p.id)
            return (
              <article key={p.id} className="group relative">
                <div
                  className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl"
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
                      className="absolute inset-0 h-full w-full object-contain p-6 transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); toggle(p.id) }}
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full transition-all"
                    style={selected
                      ? { background: 'var(--rust)', color: 'var(--primary-foreground)' }
                      : { background: 'var(--card)', color: 'var(--ink)', boxShadow: '0 0 0 1px var(--border)' }
                    }
                  >
                    {selected ? <Check size={16} strokeWidth={2.4} /> : <Plus size={16} />}
                  </button>
                </div>
                <button
                  onClick={() => setActive(p)}
                  className="mt-4 flex w-full items-start justify-between gap-3 text-left"
                >
                  <div>
                    <p
                      className="text-[10px] uppercase tracking-[0.2em]"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      {p.category} · {p.maker}
                    </p>
                    <h3
                      className="mt-1 font-serif text-xl leading-tight"
                      style={{ color: 'var(--ink)' }}
                    >
                      {p.name}
                    </h3>
                  </div>
                  {p.price && (
                    <p
                      className="shrink-0 font-serif text-base"
                      style={{ color: 'oklch(0.22 0.02 50 / 0.8)' }}
                    >
                      {p.price}
                    </p>
                  )}
                </button>
              </article>
            )
          })}
        </div>
      </section>

      {/* ── Sticky board footer ─────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-6">
        <div
          className={`pointer-events-auto mx-auto flex max-w-3xl items-center justify-between gap-4 rounded-full border px-3 py-3 pl-6 backdrop-blur-md transition-all duration-300 ${
            count === 0 ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'
          }`}
          style={{ background: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-soft-val)' }}
        >
          <div className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full font-serif text-sm tabular-nums"
              style={{ background: 'var(--ink)', color: 'var(--primary-foreground)' }}
            >
              {count}
            </span>
            <span className="text-sm" style={{ color: 'oklch(0.22 0.02 50 / 0.8)' }}>
              {count === 1 ? 'piece selected' : 'pieces selected'}
            </span>
            <button
              onClick={clear}
              className="text-[11px] uppercase tracking-[0.18em]"
              style={{ color: 'var(--muted-foreground)' }}
            >
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

      {/* Product modal */}
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
