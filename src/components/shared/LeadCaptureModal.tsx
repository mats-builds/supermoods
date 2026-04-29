'use client'

import { useState } from 'react'
import { X, ArrowRight, Check } from 'lucide-react'
import type { CanvasItem } from '@/lib/types'

interface Props {
  items: CanvasItem[]
  backdrop: string
  palette: string
  onClose: () => void
  onSuccess?: (name: string, email: string) => void
}

export default function LeadCaptureModal({ items, backdrop, palette, onClose, onSuccess }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (name.trim().length < 2) { setError('Please enter your name.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Please enter a valid email address.'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(), email: email.trim(), backdrop, palette,
          totalValue: items.reduce((s, it) => s + (it.product?.price ?? 0), 0),
          items: items.map(it => ({ product_id: it.product_id, position_x: it.x, position_y: it.y, scale: it.scaleX })),
          canvasState: { items: items.map(it => ({ id: it.id, product_id: it.product_id, x: it.x, y: it.y, width: it.width, height: it.height })) },
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      setDone(true)
      onSuccess?.(name.trim(), email.trim())
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 backdrop-blur-sm" style={{ background: 'oklch(0.22 0.02 50 / 0.5)' }} onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-3xl p-8" style={{ background: 'var(--card)' }}>
        <button onClick={onClose} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[var(--secondary)]" style={{ color: 'var(--muted-foreground)' }}>
          <X size={16} />
        </button>

        {!done ? (
          <>
            <p className="text-[11px] uppercase tracking-display" style={{ color: 'var(--muted-foreground)' }}>One last step</p>
            <h2 className="mt-2 font-serif text-2xl" style={{ color: 'var(--ink)' }}>Send this to me</h2>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
              We'll email you a private link so you can revisit your board from home — and share it with anyone.
            </p>
            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--muted-foreground)' }}>Your name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" required maxLength={80} className="w-full rounded-xl border bg-transparent px-4 py-3 text-sm focus:outline-none transition-colors" style={{ borderColor: 'var(--border)', color: 'var(--ink)' }} />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--muted-foreground)' }}>Email address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" required maxLength={160} className="w-full rounded-xl border bg-transparent px-4 py-3 text-sm focus:outline-none transition-colors" style={{ borderColor: 'var(--border)', color: 'var(--ink)' }} />
              </div>
              {error && <p className="text-xs" style={{ color: 'oklch(0.55 0.2 27)' }}>{error}</p>}
              <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-medium transition-transform hover:scale-[1.01] disabled:opacity-50" style={{ background: 'var(--rust)', color: 'var(--primary-foreground)' }}>
                {loading ? 'Sending…' : <> Send it to me <ArrowRight size={14} /></>}
              </button>
              <p className="text-[10px] leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                By continuing you agree to receive your moodboard by email. We'll never share your details.
              </p>
            </form>
          </>
        ) : (
          <div className="py-4 text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: 'var(--ink)' }}>
              <Check size={22} style={{ color: 'var(--primary-foreground)' }} />
            </div>
            <h2 className="font-serif text-2xl" style={{ color: 'var(--ink)' }}>It's on its way</h2>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
              We sent your private moodboard link to <strong style={{ color: 'var(--ink)' }}>{email}</strong>. Open it any time to revisit.
            </p>
            <button onClick={onClose} className="mt-6 rounded-full border px-6 py-2.5 text-sm transition-colors hover:bg-[var(--secondary)]" style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}>
              Back to canvas
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
