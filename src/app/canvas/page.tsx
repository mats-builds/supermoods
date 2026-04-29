'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Pencil, Check, RotateCcw, Maximize2, FileText, Sparkles, RefreshCw } from 'lucide-react'
import { catalog } from '@/lib/catalog'
import { curatedPalettes, generateAIPalette, scenes, colorMap } from '@/lib/types'
import type { Palette, Scene } from '@/lib/types'
import { useSelection, selectionStore } from '@/lib/selection-store'
import { RoomScene } from '@/components/canvas/RoomScene'
import SideMenu from '@/components/shared/SideMenu'

export default function MoodboardPage() {
  const router = useRouter()
  const { ids, paletteId, setPaletteId, sceneId, setSceneId, layout, setLayoutFor, resetLayoutFor, resetAllLayout } = useSelection()
  const [editMode, setEditMode] = useState(false)
  const [aiNonce, setAiNonce] = useState(0)

  const items = useMemo(() => ids.map(id => catalog.find(p => p.id === id)).filter(Boolean) as typeof catalog, [ids])

  const aiPalette = useMemo(() => generateAIPalette(ids, catalog), [ids, aiNonce])
  const allPalettes: Palette[] = useMemo(() => [aiPalette, ...curatedPalettes], [aiPalette, aiNonce])
  const activePalette: Palette = allPalettes.find(p => p.id === paletteId) ?? aiPalette
  const activeScene: Scene = scenes.find(s => s.id === sceneId) ?? scenes[0]

  if (items.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md text-center">
          <p className="text-[11px] uppercase tracking-display" style={{ color: 'var(--muted-foreground)' }}>Your board is empty</p>
          <h1 className="mt-3 font-serif text-5xl leading-[0.95]" style={{ color: 'var(--ink)' }}>
            Pick a few <em className="italic" style={{ color: 'var(--rust)' }}>pieces</em> first.
          </h1>
          <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>Browse the catalog and tap + on anything you love.</p>
          <div className="mt-8">
            <Link href="/" className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm" style={{ background: 'var(--ink)', color: 'var(--primary-foreground)' }}>
              <ArrowLeft size={16} /> Back to catalog
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b backdrop-blur-md" style={{ borderColor: 'var(--border)', background: 'var(--background)/85' }}>
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-6 py-5 md:px-10">
          <div className="flex items-center gap-2">
            <SideMenu />
            <Link href="/" className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] transition-colors hover:opacity-70" style={{ color: 'var(--muted-foreground)' }}>
              <ArrowLeft size={14} /> Catalog
            </Link>
          </div>
          <span className="font-serif text-2xl md:text-3xl" style={{ color: 'var(--ink)' }}>Supermoods</span>
          <span className="text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--muted-foreground)' }}>
            {items.length} {items.length === 1 ? 'piece' : 'pieces'}
          </span>
        </div>
      </header>

      {/* Title */}
      <section className="mx-auto max-w-[1500px] px-6 pb-6 pt-10 md:px-10 md:pt-14">
        <p className="text-xs uppercase tracking-display" style={{ color: 'var(--muted-foreground)' }}>Your concept</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-serif text-5xl leading-[0.95] md:text-7xl" style={{ color: 'var(--ink)' }}>
            A room,<br /><em className="font-light italic" style={{ color: 'var(--rust)' }}>composed.</em>
          </h1>
          <div className="flex items-center gap-2">
            {editMode && (
              <button
                onClick={() => { if (window.confirm('Reset all positions and sizes?')) resetAllLayout() }}
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] hover:bg-[var(--secondary)]"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
              >
                <RotateCcw size={12} /> Reset all
              </button>
            )}
            <button
              onClick={() => setEditMode(v => !v)}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[11px] uppercase tracking-[0.18em] transition-transform hover:scale-[1.02]"
              style={editMode
                ? { background: 'var(--rust)', color: 'var(--primary-foreground)' }
                : { background: 'var(--ink)', color: 'var(--primary-foreground)' }
              }
            >
              {editMode ? <><Check size={14} /> Save</> : <><Pencil size={12} /> Edit</>}
            </button>
          </div>
        </div>
        <p className="mt-3 text-[11px] uppercase tracking-display" style={{ color: 'var(--muted-foreground)' }}>
          {editMode ? 'Drag pieces to reposition · drag the corner handle to resize' : 'Click Edit to rearrange and resize pieces'}
        </p>
      </section>

      {/* Room scene */}
      <section className="mx-auto max-w-[1500px] px-6 md:px-10">
        <RoomScene
          items={items}
          palette={activePalette}
          scene={activeScene}
          onRemove={id => selectionStore.toggle(id)}
          editMode={editMode}
          layout={layout}
          onLayoutChange={setLayoutFor}
          onResetItem={resetLayoutFor}
        />
      </section>

      {/* Scene picker */}
      <section className="mx-auto mt-8 max-w-[1500px] px-6 md:px-10">
        <div className="rounded-3xl p-6 md:p-8" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-soft-val)' }}>
          <div>
            <p className="text-[11px] uppercase tracking-display" style={{ color: 'var(--muted-foreground)' }}>Backdrop</p>
            <h2 className="mt-2 font-serif text-2xl" style={{ color: 'var(--ink)' }}>Place it on a palette, or in a real room.</h2>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {scenes.map(s => {
              const isActive = activeScene.id === s.id
              return (
                <button key={s.id} onClick={() => setSceneId(s.id)} className="group overflow-hidden rounded-2xl border text-left transition-all" style={{ borderColor: isActive ? 'var(--ink)' : 'var(--border)', boxShadow: isActive ? 'var(--shadow-soft-val)' : undefined }}>
                  <div className="relative aspect-[16/10] w-full overflow-hidden" style={{ background: 'var(--secondary)' }}>
                    {s.kind === 'image' && s.src
                      ? <img src={s.src} alt={s.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      : <div className="h-full w-full" style={{ background: `linear-gradient(180deg, ${colorMap[activePalette.colors[1] ?? 'linen']} 0%, ${colorMap[activePalette.colors[0] ?? 'cream']} 60%, ${colorMap[activePalette.colors[3] ?? 'jute']} 100%)` }} />
                    }
                  </div>
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="font-serif text-base" style={{ color: 'var(--ink)' }}>{s.name}</span>
                    {isActive && <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--rust)' }}>Active</span>}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Palette picker */}
      <section className="mx-auto mt-8 max-w-[1500px] px-6 md:px-10">
        <div className="rounded-3xl p-6 md:p-8" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-soft-val)' }}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-display" style={{ color: 'var(--muted-foreground)' }}>Color palette</p>
              <h2 className="mt-2 font-serif text-2xl" style={{ color: 'var(--ink)' }}>Choose a palette, or let AI compose one.</h2>
            </div>
            <button
              onClick={() => { setPaletteId('ai'); setAiNonce(n => n + 1) }}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs uppercase tracking-[0.18em] transition-transform hover:scale-[1.02]"
              style={{ background: 'var(--ink)', color: 'var(--primary-foreground)' }}
            >
              <Sparkles size={14} />
              {activePalette.id === 'ai' ? 'Regenerate' : 'Let AI choose'}
              {activePalette.id === 'ai' && <RefreshCw size={12} />}
            </button>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-3 lg:grid-cols-6">
            {allPalettes.map(p => {
              const isActive = activePalette.id === p.id
              return (
                <button key={p.id} onClick={() => setPaletteId(p.id)} className="rounded-2xl border p-3 text-left transition-all" style={{ borderColor: isActive ? 'var(--ink)' : 'var(--border)', background: isActive ? 'var(--secondary)' : undefined, boxShadow: isActive ? 'var(--shadow-soft-val)' : undefined }}>
                  <div className="flex h-10 overflow-hidden rounded-md">
                    {p.colors.map((c, i) => <div key={i} className="flex-1" style={{ backgroundColor: colorMap[c] }} />)}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-serif text-base" style={{ color: 'var(--ink)' }}>{p.name}</span>
                    {p.id === 'ai' && <Sparkles size={12} style={{ color: 'var(--rust)' }} />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Item list */}
      <section className="mx-auto mt-12 max-w-[1500px] px-6 md:px-10">
        <p className="text-[11px] uppercase tracking-display" style={{ color: 'var(--muted-foreground)' }}>On this board</p>
        <ul className="mt-4 divide-y border-y" style={{ borderColor: 'var(--border)' }}>
          {items.map(p => (
            <li key={p.id} className="flex items-center gap-5 py-4">
              <div className="h-16 w-16 shrink-0 rounded-md" style={{ background: 'var(--secondary)' }}>
                <img src={p.src} alt="" className="h-full w-full object-contain p-1" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--muted-foreground)' }}>{p.category} · {p.maker}</p>
                <p className="font-serif text-lg" style={{ color: 'var(--ink)' }}>{p.name}</p>
              </div>
              <p className="font-serif text-base" style={{ color: 'oklch(0.22 0.02 50 / 0.8)' }}>{p.price}</p>
              <button
                onClick={() => selectionStore.toggle(p.id)}
                className="ml-2 flex h-8 w-8 items-center justify-center rounded-full border transition-colors hover:border-[var(--rust)] hover:text-[var(--rust)]"
                style={{ borderColor: 'var(--border)', color: 'oklch(0.22 0.02 50 / 0.6)' }}
              >
                <span className="text-lg leading-none rotate-45">+</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm hover:bg-[var(--secondary)]" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>
            <ArrowLeft size={16} /> Add more pieces
          </Link>
          <button
            onClick={() => router.push('/present')}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-transform hover:scale-[1.02]"
            style={{ background: 'var(--rust)', color: 'var(--primary-foreground)' }}
          >
            <FileText size={14} /> Finish
          </button>
        </div>
      </section>
    </main>
  )
}
