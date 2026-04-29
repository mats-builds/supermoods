'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Printer, Send, X, Check } from 'lucide-react'
import { catalog } from '@/lib/catalog'
import { curatedPalettes, generateAIPalette, scenes, colorMap } from '@/lib/types'
import type { Palette, Scene } from '@/lib/types'
import { useSelection } from '@/lib/selection-store'
import { RoomScene } from '@/components/canvas/RoomScene'
import LeadCaptureModal from '@/components/shared/LeadCaptureModal'

const LEAD_KEY = 'supermoods.lead'
type StoredLead = { name: string; email: string }
function getStoredLead(): StoredLead | null {
  if (typeof window === 'undefined') return null
  try { return JSON.parse(localStorage.getItem(LEAD_KEY) ?? 'null') } catch { return null }
}

export default function PresentPage() {
  const { ids, paletteId, sceneId, layout } = useSelection()
  const [hidden, setHidden] = useState<Record<string, boolean>>({})
  const [leadOpen, setLeadOpen] = useState(false)
  const [sentTo, setSentTo] = useState<StoredLead | null>(null)

  const items = useMemo(() => ids.map(id => catalog.find(p => p.id === id)).filter(Boolean) as typeof catalog, [ids])
  const aiPalette = useMemo(() => generateAIPalette(ids, catalog), [ids])
  const allPalettes: Palette[] = useMemo(() => [aiPalette, ...curatedPalettes], [aiPalette])
  const activePalette: Palette = allPalettes.find(p => p.id === paletteId) ?? aiPalette
  const activeScene: Scene = scenes.find(s => s.id === sceneId) ?? scenes[0]

  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })

  const handleSend = () => {
    const existing = getStoredLead()
    if (existing) { setSentTo(existing); return }
    setLeadOpen(true)
  }

  if (items.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <h1 className="font-serif text-4xl" style={{ color: 'var(--ink)' }}>Nothing to present yet.</h1>
          <p className="mt-3 text-sm" style={{ color: 'var(--muted-foreground)' }}>Add a few pieces to your moodboard first.</p>
          <Link href="/canvas" className="mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm" style={{ background: 'var(--ink)', color: 'var(--primary-foreground)' }}>
            <ArrowLeft size={16} /> Back to moodboard
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen py-10 print:py-0" style={{ background: 'oklch(0.78 0.02 85)' }}>
      {/* Toolbar */}
      <div className="mx-auto mb-8 flex max-w-[900px] items-center justify-between px-6 print:hidden">
        <Link href="/canvas" className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] uppercase tracking-[0.2em] hover:bg-[var(--secondary)]" style={{ background: 'var(--card)', borderColor: 'oklch(0.22 0.02 50 / 0.2)', color: 'var(--ink)' }}>
          <ArrowLeft size={14} /> Back to editor
        </Link>
        <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: 'oklch(0.22 0.02 50 / 0.7)' }}>Your presentation</p>
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] uppercase tracking-[0.2em] hover:bg-[var(--secondary)]" style={{ background: 'var(--card)', borderColor: 'oklch(0.22 0.02 50 / 0.2)', color: 'var(--ink)' }}>
          <Printer size={14} /> Print / PDF
        </button>
        <button onClick={handleSend} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs uppercase tracking-[0.18em] transition-transform hover:scale-[1.02]" style={{ background: 'var(--rust)', color: 'var(--primary-foreground)' }}>
          {sentTo ? <><Check size={14} /> Sent to {sentTo.name.split(' ')[0]}</> : <><Send size={14} /> Send this to me</>}
        </button>
      </div>

      <div className="mx-auto flex max-w-[900px] flex-col items-center gap-8 px-6 print:max-w-none print:gap-0 print:px-0">
        {/* Page 01 — Furniture Selection */}
        <PrintPage id="furniture" hidden={hidden.furniture} onToggle={id => setHidden(h => ({ ...h, [id]: !h[id] }))}>
          <PageHeader left="Page 01" center="Furniture Selection" date={today} />
          <div className="mt-6 grid grid-cols-4 gap-x-4 gap-y-6">
            {items.map(p => (
              <div key={p.id} className="flex flex-col items-center text-center">
                <div className="flex h-24 w-full items-end justify-center">
                  <img src={p.src} alt={p.name} className="max-h-24 max-w-full object-contain" crossOrigin="anonymous" />
                </div>
                <p className="mt-3 text-[10px] font-medium tracking-wide" style={{ color: 'var(--ink)' }}>{p.name}</p>
                <p className="mt-0.5 text-[8px] italic" style={{ color: 'var(--muted-foreground)' }}>{p.maker}</p>
              </div>
            ))}
          </div>
          <PageFooter />
        </PrintPage>

        {/* Page 02 — Concept Board */}
        <PrintPage id="concept" hidden={hidden.concept} onToggle={id => setHidden(h => ({ ...h, [id]: !h[id] }))}>
          <PageHeader left="Page 02" center="Concept Board" date={today} />
          <div className="mt-5 flex flex-col gap-5">
            <div>
              <p className="mb-2 text-[9px] uppercase tracking-[0.2em]" style={{ color: 'var(--muted-foreground)' }}>Your composition</p>
              <div className="overflow-hidden rounded-md">
                <RoomScene items={items} palette={activePalette} scene={activeScene} layout={layout} />
              </div>
            </div>
            <div>
              <p className="mb-2 text-[9px] uppercase tracking-[0.2em]" style={{ color: 'var(--muted-foreground)' }}>Key pieces</p>
              <div className="grid grid-cols-6 gap-2 rounded-md p-3" style={{ background: 'oklch(0.93 0.012 85)' }}>
                {items.slice(0, 6).map(p => (
                  <div key={p.id} className="flex aspect-square items-center justify-center rounded-sm p-2" style={{ background: 'var(--card)' }}>
                    <img src={p.src} alt={p.name} className="max-h-full max-w-full object-contain" crossOrigin="anonymous" />
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-md p-3" style={{ background: 'oklch(0.93 0.012 85)' }}>
              <p className="mb-2 text-[9px] uppercase tracking-[0.2em]" style={{ color: 'var(--muted-foreground)' }}>Palette · {activePalette.name}</p>
              <div className="flex gap-3">
                {activePalette.colors.map((c, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="h-10 w-10 rounded-full shadow-sm ring-1" style={{ backgroundColor: colorMap[c] }} />
                    <span className="mt-1 text-[7px] uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>{c}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <PageFooter />
        </PrintPage>

        {/* Page 03 — Shopping List */}
        <PrintPage id="shopping" hidden={hidden.shopping} onToggle={id => setHidden(h => ({ ...h, [id]: !h[id] }))}>
          <PageHeader left="Page 03" center="Shopping List" date={today} />
          <table className="mt-6 w-full border-collapse text-[10px]">
            <thead>
              <tr className="border-b text-[9px] uppercase tracking-[0.15em]" style={{ borderColor: 'oklch(0.22 0.02 50 / 0.3)', color: 'var(--ink)' }}>
                <th className="w-16 py-2 text-left font-medium">Image</th>
                <th className="py-2 text-left font-medium">Item</th>
                <th className="py-2 text-left font-medium">Maker</th>
                <th className="py-2 text-right font-medium">Price</th>
              </tr>
            </thead>
            <tbody>
              {items.map(p => (
                <tr key={p.id} className="border-b" style={{ borderColor: 'oklch(0.22 0.02 50 / 0.1)' }}>
                  <td className="py-2">
                    <div className="flex h-10 w-12 items-center justify-center">
                      <img src={p.src} alt="" className="max-h-10 max-w-full object-contain" crossOrigin="anonymous" />
                    </div>
                  </td>
                  <td className="py-2 pr-2 font-serif text-[12px]" style={{ color: 'var(--ink)' }}>{p.name}</td>
                  <td className="py-2 pr-2" style={{ color: 'var(--muted-foreground)' }}>{p.maker}</td>
                  <td className="py-2 text-right font-medium" style={{ color: 'var(--ink)' }}>{p.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3 border-t pt-3" style={{ borderColor: 'oklch(0.22 0.02 50 / 0.3)' }}>
            <p className="text-[9px] italic" style={{ color: 'var(--muted-foreground)' }}>{items.length} items · prepared {today}</p>
            <p className="flex items-baseline gap-2 text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--ink)' }}>
              <span>Total</span>
              <span className="text-[18px] font-medium tracking-normal">
                €{items.reduce((sum, p) => {
                  const n = Number(String(p.price).replace(/[^0-9.]/g, ''))
                  return sum + (isFinite(n) ? n : 0)
                }, 0).toLocaleString('en-GB', { minimumFractionDigits: 0 })}
              </span>
            </p>
          </div>
          <PageFooter />
        </PrintPage>
      </div>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 12mm; }
          *, *::before, *::after { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      {leadOpen && (
        <LeadCaptureModal
          items={items.map(p => ({ id: p.id, product_id: p.id, product: { ...p, price: Number(String(p.price).replace(/[^0-9.]/g, '')) || 0, images: [p.src], visible: true }, x: 0, y: 0, width: 200, height: 200, scaleX: 1, scaleY: 1 }))}
          backdrop={activeScene.id}
          palette={activePalette.id}
          onClose={() => setLeadOpen(false)}
          onSuccess={(name, email) => {
            localStorage.setItem(LEAD_KEY, JSON.stringify({ name, email }))
            setSentTo({ name, email })
            setLeadOpen(false)
          }}
        />
      )}
    </main>
  )
}

function PrintPage({ children, id, hidden, onToggle }: { children: React.ReactNode; id: string; hidden?: boolean; onToggle: (id: string) => void }) {
  if (hidden) {
    return (
      <div className="flex w-full items-center justify-between rounded-md border border-dashed px-4 py-3 print:hidden" style={{ borderColor: 'oklch(0.22 0.02 50 / 0.3)', background: 'oklch(0.93 0.012 85 / 0.5)' }}>
        <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--muted-foreground)' }}>Page hidden</span>
        <button onClick={() => onToggle(id)} className="text-[10px] uppercase tracking-[0.2em] underline-offset-2 hover:underline" style={{ color: 'var(--ink)' }}>Restore</button>
      </div>
    )
  }
  return (
    <section className="group/page relative flex w-full flex-col p-6 shadow-[var(--shadow-soft-val)] print:break-after-page print:shadow-none" style={{ aspectRatio: '1 / 1.414', background: 'oklch(0.95 0.012 85)' }}>
      <button onClick={() => onToggle(id)} className="absolute right-3 top-3 z-20 flex h-7 w-7 items-center justify-center rounded-full shadow-sm ring-1 opacity-0 transition-opacity hover:bg-[var(--rust)] hover:text-[var(--primary-foreground)] group-hover/page:opacity-100 print:hidden" style={{ background: 'var(--card)', color: 'var(--ink)' }}>
        <X size={14} />
      </button>
      {children}
    </section>
  )
}

function PageHeader({ left, center, date }: { left: string; center: string; date: string }) {
  return (
    <div className="flex items-baseline justify-between border-b pb-3" style={{ borderColor: 'oklch(0.22 0.02 50 / 0.15)' }}>
      <span className="text-[9px] uppercase tracking-[0.25em]" style={{ color: 'var(--muted-foreground)' }}>{left}</span>
      <h2 className="text-[11px] font-medium uppercase tracking-[0.3em]" style={{ color: 'var(--ink)' }}>{center}</h2>
      <span className="text-[9px] uppercase tracking-[0.25em]" style={{ color: 'var(--muted-foreground)' }}>{date}</span>
    </div>
  )
}

function PageFooter() {
  return (
    <div className="absolute inset-x-6 bottom-4 border-t pt-2 text-center text-[9px] uppercase tracking-[0.25em]" style={{ borderColor: 'oklch(0.22 0.02 50 / 0.15)', color: 'var(--muted-foreground)' }}>
      Supermoods · Project Presentation
    </div>
  )
}
