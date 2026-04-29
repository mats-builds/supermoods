'use client'

import { useState, useCallback } from 'react'
import { X, Trash2, Star, Wand2, Loader2, Check } from 'lucide-react'
import { categories, type Category, type Role } from '@/lib/types'
import type { Product } from '@/lib/types'

const VALID_ROLES: Role[] = ['floor', 'ground', 'surface', 'hanging', 'standing', 'wall', 'prop']

interface Props {
  product: Product
  onSave: (patch: Partial<Product>) => void
  onClose: () => void
}

async function proxyImage(url: string): Promise<string> {
  if (url.startsWith('data:')) return url
  const res = await fetch('/api/proxy-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
  const { dataUrl, error } = await res.json()
  if (error) throw new Error(error)
  return dataUrl
}

async function stripWhiteBackground(imageUrl: string): Promise<string> {
  const dataUrl = await proxyImage(imageUrl)
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const { data } = imageData
      const w = canvas.width
      const h = canvas.height

      // Flood-fill from all four corners to find background
      const visited = new Uint8Array(w * h)
      const queue: number[] = []

      function enqueue(x: number, y: number) {
        if (x < 0 || y < 0 || x >= w || y >= h) return
        const idx = y * w + x
        if (visited[idx]) return
        const pi = idx * 4
        const r = data[pi], g = data[pi + 1], b = data[pi + 2]
        // Only flood through near-white or near-transparent pixels
        if (r >= 210 && g >= 210 && b >= 210) {
          visited[idx] = 1
          queue.push(idx)
        }
      }

      // Seed from all edges
      for (let x = 0; x < w; x++) { enqueue(x, 0); enqueue(x, h - 1) }
      for (let y = 0; y < h; y++) { enqueue(0, y); enqueue(w - 1, y) }

      // BFS
      let qi = 0
      while (qi < queue.length) {
        const idx = queue[qi++]
        const x = idx % w
        const y = Math.floor(idx / w)
        enqueue(x + 1, y); enqueue(x - 1, y)
        enqueue(x, y + 1); enqueue(x, y - 1)
      }

      // Make visited (background) pixels transparent
      for (let i = 0; i < w * h; i++) {
        if (visited[i]) {
          data[i * 4 + 3] = 0
        }
      }

      ctx.putImageData(imageData, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = dataUrl
  })
}

export default function CatalogEditModal({ product, onSave, onClose }: Props) {
  const [name, setName] = useState(product.name)
  const [maker, setMaker] = useState(product.maker)
  const [price, setPrice] = useState(product.price)
  const [category, setCategory] = useState<Category>(product.category)
  const [role, setRole] = useState<Role>(product.role)
  const [description, setDescription] = useState(product.description ?? '')

  const allImages = [product.src, ...(product.gallery ?? [])].filter(Boolean)
  const [images, setImages] = useState<string[]>(allImages)
  const [primaryIdx, setPrimaryIdx] = useState(0)
  const [removingBg, setRemovingBg] = useState<number | null>(null)
  const [bgDone, setBgDone] = useState<Set<number>>(new Set())

  const handleRemoveBg = useCallback(async (idx: number) => {
    setRemovingBg(idx)
    try {
      const result = await stripWhiteBackground(images[idx])
      setImages(imgs => imgs.map((img, i) => i === idx ? result : img))
      setBgDone(s => new Set(s).add(idx))
    } catch (e) {
      alert('Could not process this image. Try a different one.')
    } finally {
      setRemovingBg(null)
    }
  }, [images])

  const handleDeleteImage = useCallback((idx: number) => {
    setImages(imgs => imgs.filter((_, i) => i !== idx))
    setPrimaryIdx(p => idx === p ? 0 : idx < p ? p - 1 : p)
    setBgDone(s => { const n = new Set(s); n.delete(idx); return n })
  }, [])

  function handleSave() {
    const reordered = [images[primaryIdx], ...images.filter((_, i) => i !== primaryIdx)]
    onSave({
      name: name.trim() || product.name,
      maker: maker.trim() || product.maker,
      price: price.trim() || product.price,
      category,
      role,
      description: description.trim(),
      src: reordered[0] ?? product.src,
      gallery: reordered.slice(1),
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{ background: 'oklch(0.22 0.02 50 / 0.5)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />
      <div
        className="relative z-10 flex w-full max-w-3xl flex-col overflow-hidden rounded-3xl"
        style={{ background: 'var(--card)', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-7 py-5" style={{ borderColor: 'var(--border)' }}>
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em]" style={{ color: 'var(--muted-foreground)' }}>Edit product</p>
            <h2 className="mt-1 font-serif text-2xl" style={{ color: 'var(--ink)' }}>{product.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[var(--secondary)]"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-8 overflow-y-auto px-7 py-6">

          {/* Images */}
          <section>
            <p className="mb-3 text-[10px] uppercase tracking-[0.28em]" style={{ color: 'var(--muted-foreground)' }}>
              Images · {images.length} total · click star to set primary
            </p>
            {images.length === 0 ? (
              <div className="rounded-2xl border border-dashed py-10 text-center text-sm" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
                No images
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {images.map((src, i) => (
                  <div
                    key={i}
                    className="group relative overflow-hidden rounded-2xl"
                    style={{
                      background: 'var(--secondary)',
                      border: i === primaryIdx ? '2px solid var(--ink)' : '2px solid transparent',
                    }}
                  >
                    {/* Image */}
                    <div className="aspect-square w-full flex items-center justify-center p-3">
                      <img src={src} alt="" className="max-h-full max-w-full object-contain" />
                    </div>

                    {/* Overlay actions */}
                    <div className="absolute inset-0 flex flex-col items-end justify-between p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'oklch(0.22 0.02 50 / 0.05)' }}>
                      {/* Top-right: delete */}
                      <button
                        onClick={() => handleDeleteImage(i)}
                        className="flex h-7 w-7 items-center justify-center rounded-full shadow-sm"
                        style={{ background: 'oklch(0.55 0.2 27)', color: '#fff' }}
                        title="Delete image"
                      >
                        <Trash2 size={12} />
                      </button>

                      {/* Bottom row: star + remove BG */}
                      <div className="flex w-full items-center justify-between gap-1">
                        <button
                          onClick={() => handleRemoveBg(i)}
                          disabled={removingBg !== null}
                          className="flex flex-1 items-center justify-center gap-1 rounded-full py-1 text-[10px] font-medium shadow-sm transition-opacity disabled:opacity-50"
                          style={{ background: bgDone.has(i) ? 'oklch(0.55 0.14 145)' : 'var(--ink)', color: '#fff' }}
                          title="Remove background"
                        >
                          {removingBg === i
                            ? <Loader2 size={10} className="animate-spin" />
                            : bgDone.has(i)
                            ? <><Check size={10} /> Done</>
                            : <><Wand2 size={10} /> BG</>
                          }
                        </button>
                        <button
                          onClick={() => setPrimaryIdx(i)}
                          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full shadow-sm"
                          style={{
                            background: i === primaryIdx ? 'var(--rust)' : 'oklch(1 0 0 / 0.9)',
                            color: i === primaryIdx ? '#fff' : 'var(--ink)',
                          }}
                          title="Set as primary"
                        >
                          <Star size={12} fill={i === primaryIdx ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                    </div>

                    {/* Primary badge */}
                    {i === primaryIdx && (
                      <div className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[9px] uppercase tracking-wide"
                        style={{ background: 'var(--ink)', color: 'var(--primary-foreground)' }}>
                        Primary
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Text fields */}
          <section className="grid grid-cols-2 gap-4">
            <Field label="Name" className="col-span-2">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full rounded-xl border px-4 py-2.5 font-serif text-lg focus:outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--ink)' }}
              />
            </Field>
            <Field label="Brand">
              <input
                value={maker}
                onChange={e => setMaker(e.target.value)}
                className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--ink)' }}
              />
            </Field>
            <Field label="Price">
              <input
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--rust)' }}
              />
            </Field>
            <Field label="Category">
              <select
                value={category}
                onChange={e => setCategory(e.target.value as Category)}
                className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--ink)' }}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Canvas role">
              <select
                value={role}
                onChange={e => setRole(e.target.value as Role)}
                className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--ink)' }}
              >
                {VALID_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Description" className="col-span-2">
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none resize-none"
                style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--ink)' }}
              />
            </Field>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t px-7 py-5" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={onClose}
            className="rounded-full border px-6 py-2.5 text-sm transition-colors hover:bg-[var(--secondary)]"
            style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-full px-6 py-2.5 text-sm font-medium transition-transform hover:scale-[1.02]"
            style={{ background: 'var(--ink)', color: 'var(--primary-foreground)' }}
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--muted-foreground)' }}>
        {label}
      </span>
      {children}
    </label>
  )
}
