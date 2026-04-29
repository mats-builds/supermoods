'use client'

import { useEffect, useState } from 'react'
import { X, Plus, Check, ExternalLink } from 'lucide-react'
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-10">
      {/* Very light frosted backdrop — catalog stays visible through it */}
      <div
        className="absolute inset-0"
        style={{ backdropFilter: 'blur(12px)', background: 'oklch(0.96 0.01 80 / 0.55)' }}
        onClick={onClose}
      />

      {/* Glassmorphic card */}
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
        {/* Image */}
        <div
          className="relative flex-shrink-0 w-full md:w-[45%]"
          style={{ background: 'oklch(0.95 0.012 80 / 0.6)', aspectRatio: '1/1' }}
        >
          <img
            src={allImages[imgIdx]}
            alt={product.name}
            className="h-full w-full object-contain p-8"
          />
          {allImages.length > 1 && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
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
        </div>

        {/* Info */}
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
