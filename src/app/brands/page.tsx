'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { brands, brandCoverImage } from '@/lib/brands'
import { useSelection } from '@/lib/selection-store'
import SideMenu from '@/components/shared/SideMenu'

export default function BrandsPage() {
  const router = useRouter()
  const { count } = useSelection()

  return (
    <main className="min-h-screen pb-32">
      {/* Header */}
      <header
        className="sticky top-0 z-30 border-b backdrop-blur-md"
        style={{ borderColor: 'var(--border)', background: 'var(--background)/85' }}
      >
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-6 py-5 md:px-10">
          <div className="flex items-center gap-2">
            <SideMenu />
            <span
              className="hidden text-[11px] uppercase tracking-display md:block"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Brand Catalogs
            </span>
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

      {/* Hero */}
      <section className="mx-auto max-w-[1500px] px-6 pb-10 pt-12 md:px-10 md:pt-16">
        <p className="text-xs uppercase tracking-display" style={{ color: 'var(--muted-foreground)' }}>
          Curated makers · 2026
        </p>
        <div className="mt-3 flex items-end justify-between gap-6">
          <h1 className="font-serif text-5xl leading-[0.95] md:text-7xl" style={{ color: 'var(--ink)' }}>
            Brand<br />
            <em className="font-light italic" style={{ color: 'var(--rust)' }}>catalogs.</em>
          </h1>
          <p
            className="hidden max-w-sm text-sm leading-relaxed md:block"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Explore curated collections from the makers we work with. Browse each brand's full range and
            add pieces directly to your moodboard.
          </p>
        </div>
      </section>

      {/* Brand grid */}
      <section className="mx-auto max-w-[1500px] px-6 md:px-10">
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
          {brands.map(brand => {
            const cover = brand.coverImage ?? brandCoverImage(brand)
            return (
              <Link key={brand.slug} href={`/brands/${brand.slug}`}>
                <article className="group cursor-pointer">
                  {/* Tile */}
                  <div
                    className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl transition-transform duration-500 group-hover:scale-[1.02]"
                    style={{ background: 'var(--secondary)' }}
                  >
                    {cover && (
                      <img
                        src={cover}
                        alt={brand.name}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-contain p-8 transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                    )}

                    {/* Origin badge */}
                    <div className="absolute left-3 top-3">
                      <span
                        className="rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.18em]"
                        style={{ background: 'var(--card)', color: 'var(--muted-foreground)' }}
                      >
                        {brand.origin}
                      </span>
                    </div>

                    {/* Piece count badge */}
                    <div className="absolute right-3 top-3">
                      <span
                        className="rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.18em]"
                        style={{ background: 'var(--card)', color: 'var(--muted-foreground)' }}
                      >
                        {brand.pieceCount}p
                      </span>
                    </div>

                    {/* Accent bottom stripe */}
                    {brand.accentColor && (
                      <div
                        className="absolute inset-x-0 bottom-0 h-1 opacity-60"
                        style={{ background: brand.accentColor }}
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="mt-4">
                    <p
                      className="text-[10px] uppercase tracking-[0.2em]"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      {brand.pieceCount} pieces · {brand.origin}
                    </p>
                    <h3
                      className="mt-1 font-serif text-xl leading-tight"
                      style={{ color: 'var(--ink)' }}
                    >
                      {brand.name}
                    </h3>
                    <p className="mt-0.5 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                      {brand.tagline}
                    </p>
                  </div>
                </article>
              </Link>
            )
          })}
        </div>
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
