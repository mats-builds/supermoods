'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import { catalog } from '@/lib/catalog'
import { scenes, curatedPalettes, generateAIPalette, colorMap } from '@/lib/types'
import type { Scene, Palette } from '@/lib/types'
import Link from 'next/link'
import { RoomScene } from '@/components/canvas/RoomScene'

interface BoardData {
  board: { canvas_state: { items: any[] }; backdrop: string; palette: string; total_value: number }
  lead: { name: string; email: string } | null
}

export default function BoardPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [data, setData] = useState<BoardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/board/${token}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d) })
      .catch(() => setError('Could not load your moodboard.'))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <span className="text-[11px] uppercase tracking-display" style={{ color: 'var(--muted-foreground)' }}>Loading your moodboard…</span>
    </div>
  )

  if (error || !data) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>This moodboard link is invalid or has expired.</p>
      <Link href="/" className="text-[11px] uppercase tracking-display underline underline-offset-4" style={{ color: 'var(--ink)' }}>
        Start a new board
      </Link>
    </div>
  )

  const activeScene: Scene = scenes.find(s => s.id === data.board.backdrop) ?? scenes[0]
  const allPalettes: Palette[] = [generateAIPalette([], catalog), ...curatedPalettes]
  const activePalette: Palette = allPalettes.find(p => p.id === data.board.palette) ?? allPalettes[0]

  const boardItems = data.board.canvas_state?.items ?? []
  const enrichedItems = boardItems
    .map((ci: any) => catalog.find(p => p.id === ci.product_id))
    .filter(Boolean) as typeof catalog

  const total = enrichedItems.reduce((s, p) => {
    const n = Number(String(p.price).replace(/[^0-9.]/g, ''))
    return s + (isFinite(n) ? n : 0)
  }, 0)

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <header className="border-b px-8 py-5 flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
        <span className="font-serif text-2xl" style={{ color: 'var(--ink)' }}>Supermoods</span>
        {data.lead && <span className="text-[11px] uppercase tracking-display" style={{ color: 'var(--muted-foreground)' }}>{data.lead.name}'s moodboard</span>}
      </header>

      <div className="max-w-4xl mx-auto px-6 lg:px-12 py-12 flex flex-col gap-14">
        {/* Concept board */}
        <section>
          <p className="text-[11px] uppercase tracking-display mb-6" style={{ color: 'var(--muted-foreground)' }}>Concept board</p>
          {enrichedItems.length > 0
            ? <RoomScene items={enrichedItems} palette={activePalette} scene={activeScene} />
            : <div className="aspect-[16/10] rounded-3xl" style={{ background: 'var(--secondary)' }} />
          }
        </section>

        {/* Product grid */}
        <section>
          <p className="text-[11px] uppercase tracking-display mb-6" style={{ color: 'var(--muted-foreground)' }}>
            Furniture selection · {enrichedItems.length} pieces
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {enrichedItems.map(p => (
              <div key={p.id} className="flex flex-col gap-2">
                <div className="aspect-[4/5] rounded-2xl overflow-hidden" style={{ background: 'var(--secondary)' }}>
                  <img src={p.src} alt={p.name} className="h-full w-full object-contain p-6" />
                </div>
                <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--muted-foreground)' }}>{p.maker}</p>
                <p className="font-serif text-lg" style={{ color: 'var(--ink)' }}>{p.name}</p>
                <p className="font-serif text-base" style={{ color: 'oklch(0.22 0.02 50 / 0.7)' }}>{p.price}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Shopping list */}
        <section>
          <p className="text-[11px] uppercase tracking-display mb-6" style={{ color: 'var(--muted-foreground)' }}>Shopping list</p>
          <table className="w-full">
            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {enrichedItems.map(p => (
                <tr key={p.id} className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <td className="py-4 font-serif text-lg" style={{ color: 'var(--ink)' }}>{p.name}</td>
                  <td className="py-4 hidden md:table-cell" style={{ color: 'var(--muted-foreground)' }}>{p.maker}</td>
                  <td className="py-4 text-right font-serif text-base" style={{ color: 'var(--ink)' }}>{p.price}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2" style={{ borderColor: 'var(--ink)' }}>
                <td className="pt-4 text-[11px] uppercase tracking-display" style={{ color: 'var(--muted-foreground)' }} colSpan={2}>Total</td>
                <td className="pt-4 font-serif text-xl text-right" style={{ color: 'var(--ink)' }}>
                  €{total.toLocaleString('en-GB')}
                </td>
              </tr>
            </tfoot>
          </table>
        </section>

        <div className="text-center border-t pt-12" style={{ borderColor: 'var(--border)' }}>
          <Link href="/" className="inline-flex items-center gap-2 rounded-full px-8 py-3 text-sm font-medium transition-transform hover:scale-[1.02]" style={{ background: 'var(--rust)', color: 'var(--primary-foreground)' }}>
            Start a new moodboard →
          </Link>
        </div>
      </div>
    </div>
  )
}
