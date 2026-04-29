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

  useEffect(() => {
    setImgIdx(0)
  }, [product.id])

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-10">
      {/* Frosted backdrop */}
      <div
        className="absolute inset-0"
        style={{ backdropFilter: 'blur(12px)', background: 'oklch(0.96 0.01 80 / 0.55)' }}
        onClick={onClose}
      />

      {/* Card */}
      <div
        className="relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl md:flex-row"
        style={{
          backdropFilter: 'blur(24px) saturate(1.8)',
          background: 'oklch(1 0 0 / 0.72)',
          border: '1px solid oklch(1 0 0 / 0.6)',
          boxShadow: '0 8px 40px oklch(0.22 0.02 50 / 0.12), 0 1px 4px oklch(0.22 0.02 50 / 0.06)',
          maxHeight: '86vh',
        }}
      >
        {/* Image panel — fixed square */}
        <div
          className="relative flex-shrink-0 w-full md:w-[45%]"
          style={{ background: 'oklch(0.95 0.012 80 / 0.6)' }}
        >
          {/* Fixed-ratio image box */}
          <div className="relative w-full" style={{ paddingBottom: '100%' }}>
            <div className="absolute inset-0 flex items-center justify-center p-8">
              {allImages[imgIdx] ? (
                <img
                  key={allImages[imgIdx]}
                  src={allImages[imgIdx]}
                  alt={product.name}
                  className="max-h-full max-w-full object-contain"
                  style={{ transition: 'opacity 0.18s' }}
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
                  className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full shadow-sm transition-all disabled:opacity-20 hover:scale-105"
                  style={{ background: 'oklch(1 0 0 / 0.85)', color: 'oklch(0.22 0.02 50)' }}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={next}
                  disabled={imgIdx === allImages.length - 1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full shadow-sm transition-all disabled:opacity-20 hover:scale-105"
                  style={{ background: 'oklch(1 0 0 / 0.85)', color: 'oklch(0.22 0.02 50)' }}
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}
          </div>

          {/* Dot indicators */}
          {allImages.length > 1 && (
            <div className="flex justify-center gap-1.5 pb-4">
              {allImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className="rounded-full transition-all"
                  style={{
                    height: '5px',
                    width: i === imgIdx ? '18px' : '5px',
                    background: i === imgIdx ? 'oklch(0.22 0.02 50 / 0.7)' : 'oklch(0.22 0.02 50 / 0.2)',
                  }}
                />
              ))}
            </div>
          )}

          {/* Thumbnail strip — shown when 3+ images */}
          {allImages.length >= 3 && (
            <div className="flex gap-2 overflow-x-auto px-4 pb-4 scrollbar-none">
              {allImages.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className="flex-shrink-0 h-14 w-14 overflow-hidden rounded-xl transition-all"
                  style={{
                    border: `2px solid ${i === imgIdx ? 'oklch(0.22 0.02 50)' : 'transparent'}`,
                    background: 'oklch(0.92 0.01 80)',
                  }}
                >
                  <img src={src} alt="" className="h-full w-full object-contain p-1" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info panel */}
        <div className="flex flex-1 flex-col overflow-y-auto p-7">
          {/* Top row — close + optional link */}
          <div className="flex items-center justify-end gap-1.5 self-end">
            {product.sourceUrl && (
              <a
                href={product.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={`View on ${(() => { try { return new URL(product.sourceUrl).hostname.replace(/^www\./, '') } catch { return 'website' } })()}`}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[oklch(0.22_0.02_50_/_0.08)]"
                style={{ color: 'oklch(0.22 0.02 50 / 0.45)' }}
              >
                <ExternalLink size={15} />
              </a>
            )}
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[oklch(0.22_0.02_50_/_0.08)]"
              style={{ color: 'oklch(0.22 0.02 50 / 0.5)' }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Name / price */}
          <div className="mt-3">
            <p className="text-[10px] uppercase tracking-[0.24em]" style={{ color: 'oklch(0.22 0.02 50 / 0.45)' }}>
              {product.category} · {product.maker}
            </p>
            <h2 className="mt-2 font-serif text-3xl leading-tight" style={{ color: 'oklch(0.18 0.02 50)' }}>
              {product.name}
            </h2>
            <p className="mt-2 font-serif text-xl" style={{ color: 'oklch(0.52 0.13 40)' }}>
              {product.price}
            </p>
          </div>

          {/* Description */}
          {product.description && (
            <p className="mt-5 text-sm leading-relaxed" style={{ color: 'oklch(0.22 0.02 50 / 0.6)' }}>
              {product.description}
            </p>
          )}

          {/* Spec table */}
          {product.details && Object.keys(product.details).length > 0 && (
            <div className="mt-5 divide-y" style={{ borderColor: 'oklch(0.22 0.02 50 / 0.08)' }}>
              {Object.entries(product.details).map(([k, v]) => (
                <div key={k} className="flex justify-between py-2 text-sm">
                  <span style={{ color: 'oklch(0.22 0.02 50 / 0.45)' }}>{k}</span>
                  <span style={{ color: 'oklch(0.22 0.02 50)' }}>{v}</span>
                </div>
              ))}
            </div>
          )}

          {/* Dims */}
          {product.dims && (
            <p className="mt-4 text-[11px] uppercase tracking-[0.18em]" style={{ color: 'oklch(0.22 0.02 50 / 0.35)' }}>
              {product.dims.w} × {product.dims.h}{product.dims.d ? ` × ${product.dims.d}` : ''} cm
            </p>
          )}

          {/* Add to board */}
          <button
            onClick={() => { onToggle(); onClose() }}
            className="mt-auto flex items-center justify-center gap-2 rounded-full py-3.5 text-sm font-medium transition-transform hover:scale-[1.02]"
            style={selected
              ? { background: 'oklch(0.22 0.02 50 / 0.07)', color: 'oklch(0.22 0.02 50)' }
              : { background: 'oklch(0.52 0.13 40)', color: '#fff' }
            }
          >
            {selected ? <><Check size={15} /> Remove from board</> : <><Plus size={15} /> Add to board</>}
          </button>
        </div>
      </div>
    </div>
  )
}
