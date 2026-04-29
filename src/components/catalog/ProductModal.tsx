'use client'

import { useEffect, useState, useCallback } from 'react'
import { X, Plus, Check, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Product } from '@/lib/types'

interface Props {
  product: Product
  selected: boolean
  onToggle: () => void
  onClose: () => void
}

export default function ProductModal({ product, selected, onToggle, onClose }: Props) {
  const [imgIdx, setImgIdx] = useState(0)
  const allImages = [product.src, ...(product.gallery ?? [])].filter(Boolean)

  const prev = useCallback(() => setImgIdx(i => Math.max(0, i - 1)), [])
  const next = useCallback(() => setImgIdx(i => Math.min(allImages.length - 1, i + 1)), [allImages.length])

  useEffect(() => { setImgIdx(0) }, [product.id])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, prev, next])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-12">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ backdropFilter: 'blur(16px)', background: 'oklch(0.96 0.01 80 / 0.6)' }}
        onClick={onClose}
      />

      {/* Card — wider and taller */}
      <div
        className="relative z-10 flex w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] md:flex-row"
        style={{
          backdropFilter: 'blur(24px) saturate(1.8)',
          background: 'oklch(1 0 0 / 0.78)',
          border: '1px solid oklch(1 0 0 / 0.65)',
          boxShadow: '0 12px 60px oklch(0.22 0.02 50 / 0.14), 0 2px 6px oklch(0.22 0.02 50 / 0.06)',
          maxHeight: '88vh',
        }}
      >
        {/* ── Left: image panel ── */}
        <div
          className="relative flex flex-shrink-0 flex-col w-full md:w-[52%]"
          style={{ background: 'oklch(0.96 0.01 80 / 0.5)' }}
        >
          {/* Main image — fixed square */}
          <div className="relative flex-1" style={{ minHeight: 0 }}>
            <div className="relative w-full" style={{ paddingBottom: '100%' }}>
              <div className="absolute inset-0 flex items-center justify-center p-12">
                {allImages[imgIdx] ? (
                  <img
                    key={allImages[imgIdx]}
                    src={allImages[imgIdx]}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain"
                    style={{ transition: 'opacity 0.15s ease' }}
                  />
                ) : (
                  <div className="text-sm" style={{ color: 'oklch(0.22 0.02 50 / 0.3)' }}>No image</div>
                )}
              </div>

              {/* Arrow buttons */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={prev}
                    disabled={imgIdx === 0}
                    className="absolute left-5 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full shadow-md transition-all disabled:opacity-20 hover:scale-105"
                    style={{ background: 'oklch(1 0 0 / 0.9)', color: 'oklch(0.22 0.02 50)' }}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={next}
                    disabled={imgIdx === allImages.length - 1}
                    className="absolute right-5 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full shadow-md transition-all disabled:opacity-20 hover:scale-105"
                    style={{ background: 'oklch(1 0 0 / 0.9)', color: 'oklch(0.22 0.02 50)' }}
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Thumbnail strip */}
          {allImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto px-6 pb-6 pt-2" style={{ scrollbarWidth: 'none' }}>
              {allImages.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className="flex-shrink-0 h-16 w-16 overflow-hidden rounded-2xl transition-all"
                  style={{
                    border: `2px solid ${i === imgIdx ? 'oklch(0.22 0.02 50)' : 'oklch(0.22 0.02 50 / 0.12)'}`,
                    background: 'oklch(0.98 0.006 80)',
                    opacity: i === imgIdx ? 1 : 0.65,
                  }}
                >
                  <img src={src} alt="" className="h-full w-full object-contain p-1.5" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: info panel ── */}
        <div className="flex flex-1 flex-col overflow-y-auto px-10 py-10">
          {/* Close + external link */}
          <div className="flex items-center justify-end gap-2 mb-8">
            {product.sourceUrl && (
              <a
                href={product.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[oklch(0.22_0.02_50_/_0.07)]"
                style={{ color: 'oklch(0.22 0.02 50 / 0.4)' }}
                title="View original"
              >
                <ExternalLink size={16} />
              </a>
            )}
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[oklch(0.22_0.02_50_/_0.07)]"
              style={{ color: 'oklch(0.22 0.02 50 / 0.45)' }}
            >
              <X size={17} />
            </button>
          </div>

          {/* Meta */}
          <p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: 'oklch(0.22 0.02 50 / 0.4)' }}>
            {product.category} · {product.maker}
          </p>

          {/* Name */}
          <h2 className="mt-4 font-serif text-4xl leading-[1.1]" style={{ color: 'oklch(0.18 0.02 50)' }}>
            {product.name}
          </h2>

          {/* Price */}
          <p className="mt-4 font-serif text-2xl" style={{ color: 'oklch(0.52 0.13 40)' }}>
            {product.price}
          </p>

          {/* Description */}
          {product.description && (
            <p className="mt-6 text-sm leading-relaxed" style={{ color: 'oklch(0.22 0.02 50 / 0.55)' }}>
              {product.description}
            </p>
          )}

          {/* Spec table */}
          {product.details && Object.keys(product.details).length > 0 && (
            <div className="mt-7 divide-y" style={{ borderColor: 'oklch(0.22 0.02 50 / 0.08)' }}>
              {Object.entries(product.details).map(([k, v]) => (
                <div key={k} className="flex justify-between py-2.5 text-sm">
                  <span style={{ color: 'oklch(0.22 0.02 50 / 0.4)' }}>{k}</span>
                  <span style={{ color: 'oklch(0.22 0.02 50)' }}>{v}</span>
                </div>
              ))}
            </div>
          )}

          {/* Dims */}
          {product.dims && (
            <p className="mt-5 text-[11px] uppercase tracking-[0.18em]" style={{ color: 'oklch(0.22 0.02 50 / 0.3)' }}>
              {product.dims.w} × {product.dims.h}{product.dims.d ? ` × ${product.dims.d}` : ''} cm
            </p>
          )}

          {/* Add to board — always pinned to the bottom */}
          <div className="mt-auto pt-10">
            <button
            onClick={() => { onToggle(); onClose() }}
            className="flex w-full items-center justify-center gap-2 rounded-full py-4 text-sm font-medium tracking-wide transition-transform hover:scale-[1.02]"
            style={selected
              ? { background: 'oklch(0.22 0.02 50 / 0.07)', color: 'oklch(0.22 0.02 50)' }
              : { background: 'oklch(0.52 0.13 40)', color: '#fff' }
            }
          >
            {selected
              ? <><Check size={16} /> Remove from board</>
              : <><Plus size={16} /> Add to board</>
            }
          </button>
          </div>
        </div>
      </div>
    </div>
  )
}
