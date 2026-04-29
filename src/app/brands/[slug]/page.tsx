'use client'

import { use, useState } from 'react'
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

  return (
    <main className="min-h-screen pb-32">
      {/* Header */}
      <header
        className="sticky top-0 z-30 border-b backdrop-blur-md"
        style={{ borderColor: 'var(--border)', background: 'var(--background)/85' }}
      >
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-6 py-5 md:px-10">
          <div className="flex items-center gap-3">
            <SideMenu />
            <Link
              href="/brands"
              className="hidden items-center gap-1.5 text-[11px] uppercase tracking-display transition-opacity hover:opacity-70 md:flex"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <ArrowLeft size={12} strokeWidth={1.8} /> Brand Catalogs
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

      {/* Brand hero */}
      <section
        className="border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="mx-auto max-w-[1500px] px-6 py-16 md:px-10 md:py-20">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              {/* Accent line */}
              {brand.accentColor && (
                <div
                  className="mb-6 h-0.5 w-12 rounded-full"
                  style={{ background: brand.accentColor }}
                />
              )}
              <p
                className="text-xs uppercase tracking-display"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {brand.origin} · {brand.pieceCount} pieces
              </p>
              <h1
                className="mt-3 font-serif text-5xl leading-[0.95] md:text-7xl"
                style={{ color: 'var(--ink)' }}
              >
                {brand.name}
              </h1>
              <p
                className="mt-4 font-serif text-lg italic font-light md:text-xl"
                style={{ color: brand.accentColor ?? 'var(--rust)' }}
              >
                {brand.tagline}
              </p>
            </div>
            <p
              className="max-w-sm text-sm leading-relaxed md:text-right"
              style={{ color: 'var(--muted-foreground)' }}
            >
              {brand.description}
            </p>
          </div>
        </div>
      </section>

      {/* Product grid */}
      <section className="mx-auto mt-10 max-w-[1500px] px-6 md:px-10">
        <div className="mb-8 flex items-center justify-between border-b pb-5" style={{ borderColor: 'var(--border)' }}>
          <p
            className="text-[11px] uppercase tracking-display"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {products.length} {products.length === 1 ? 'piece' : 'pieces'}
          </p>
          {/* External link if it's a real brand with a sourceUrl */}
          {products[0]?.sourceUrl && (
            <a
              href={products[0].sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-display transition-opacity hover:opacity-70"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Visit website <ExternalLink size={11} />
            </a>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
          {products.map(p => {
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

      {/* Sticky board footer */}
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
