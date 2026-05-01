'use client'

import { useEffect, useState, useRef, useMemo, use } from 'react'
import Link from 'next/link'
import {
  Pencil, Check, RotateCcw, Package, ImageIcon,
  Palette as PaletteIcon, Search, X, Plus, Sparkles,
  RefreshCw, Maximize2, Minimize2, Clock,
} from 'lucide-react'
import { catalog } from '@/lib/catalog'
import { scenes, curatedPalettes, generateAIPalette, colorMap, categories } from '@/lib/types'
import type { Scene, Palette, LayoutMap, Category } from '@/lib/types'
import { RoomScene } from '@/components/canvas/RoomScene'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BoardData {
  board: {
    id: string
    canvas_state: { items: Array<{ product_id: string; scale?: number; position_x?: number; position_y?: number }> }
    backdrop: string
    palette: string
    total_value: number
  }
  lead: { name: string; email: string } | null
  expiresAt: string | null
}

type Panel = 'products' | 'scene' | 'palette'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysUntil(isoDate: string): number {
  return Math.ceil((new Date(isoDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function buildCanvasState(selectedIds: string[], layout: LayoutMap) {
  return {
    items: selectedIds.map(id => ({
      product_id: id,
      scale: layout[id]?.scale ?? 1,
      position_x: layout[id]?.xPct ?? 0,
      position_y: layout[id]?.yPct ?? 0,
    })),
  }
}

function calcTotal(ids: string[]): number {
  return ids.reduce((sum, id) => {
    const p = catalog.find(c => c.id === id)
    if (!p) return sum
    const n = Number(String(p.price).replace(/[^0-9.]/g, ''))
    return sum + (isFinite(n) ? n : 0)
  }, 0)
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CustomerWorkspace({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)

  // ── Load state ──
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expired, setExpired] = useState(false)
  const [lead, setLead] = useState<{ name: string; email: string } | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)

  // ── Board state (own React state, isolated from in-store selectionStore) ──
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [paletteId, setPaletteId] = useState('rust-walnut')
  const [sceneId, setSceneId] = useState('palette')
  const [layout, setLayout] = useState<LayoutMap>({})
  const [editMode, setEditMode] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [panel, setPanel] = useState<Panel>('products')
  const [productQuery, setProductQuery] = useState('')
  const [productCat, setProductCat] = useState<Category | 'All'>('All')
  const [aiNonce, setAiNonce] = useState(0)

  // ── Save state ──
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const initialised = useRef(false)

  // ── Derived ──
  const items = useMemo(
    () => selectedIds.map(id => catalog.find(p => p.id === id)).filter(Boolean) as typeof catalog,
    [selectedIds]
  )
  const aiPalette = useMemo(() => generateAIPalette(selectedIds, catalog), [selectedIds, aiNonce])
  const allPalettes: Palette[] = useMemo(() => [aiPalette, ...curatedPalettes], [aiPalette])
  const activePalette = allPalettes.find(p => p.id === paletteId) ?? aiPalette
  const activeScene: Scene = scenes.find(s => s.id === sceneId) ?? scenes[0]
  const ALL_CATS: (Category | 'All')[] = ['All', ...categories]
  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase()
    return catalog.filter(p => {
      if (productCat !== 'All' && p.category !== productCat) return false
      if (q && !p.name.toLowerCase().includes(q) && !p.maker.toLowerCase().includes(q)) return false
      return true
    })
  }, [productQuery, productCat])

  // ── Bootstrap: validate token + load board ──────────────────────
  useEffect(() => {
    async function init() {
      // 1. Validate token → sets customer_session cookie
      const sessionRes = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const sessionData = await sessionRes.json()

      if (!sessionRes.ok) {
        if (sessionData.error === 'expired') { setExpired(true) }
        else { setError(sessionData.error || 'Invalid link') }
        setLoading(false)
        return
      }

      // 2. Load board data
      const boardRes = await fetch(`/api/board/${token}`)
      const boardData: BoardData & { error?: string } = await boardRes.json()

      if (!boardRes.ok || boardData.error) {
        if (boardData.error === 'expired') { setExpired(true) }
        else { setError(boardData.error || 'Could not load board') }
        setLoading(false)
        return
      }

      // 3. Populate state from saved board
      const { board, lead: l, expiresAt: exp } = boardData
      setLead(l)
      setExpiresAt(exp)

      const ids = (board.canvas_state?.items ?? []).map((i: any) => i.product_id)
      setSelectedIds(ids)
      setPaletteId(board.palette || 'rust-walnut')
      setSceneId(board.backdrop || 'palette')

      const lm: LayoutMap = {}
      for (const item of board.canvas_state?.items ?? []) {
        lm[item.product_id] = {
          scale: item.scale,
          xPct: item.position_x,
          yPct: item.position_y,
        }
      }
      setLayout(lm)

      setLoading(false)
      initialised.current = true
    }

    init()
  }, [token])

  // ── Auto-save ────────────────────────────────────────────────────
  function scheduleSave(ids: string[], pal: string, scene: string, lm: LayoutMap) {
    if (!initialised.current) return
    setSaveStatus('unsaved')
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSaveStatus('saving')
      const canvasState = buildCanvasState(ids, lm)
      const total = calcTotal(ids)
      const res = await fetch(`/api/board/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canvas_state: canvasState, backdrop: scene, palette: pal, total_value: total }),
      })
      setSaveStatus(res.ok ? 'saved' : 'unsaved')
    }, 1500)
  }

  // ── State mutators that also schedule save ───────────────────────
  function toggleProduct(id: string) {
    setSelectedIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      scheduleSave(next, paletteId, sceneId, layout)
      return next
    })
  }

  function handleSetPaletteId(id: string) {
    setPaletteId(id)
    scheduleSave(selectedIds, id, sceneId, layout)
  }

  function handleSetSceneId(id: string) {
    setSceneId(id)
    scheduleSave(selectedIds, paletteId, id, layout)
  }

  function handleLayoutChange(id: string, override: Partial<LayoutMap[string]>) {
    setLayout(prev => {
      const next = { ...prev, [id]: { ...prev[id], ...override } }
      scheduleSave(selectedIds, paletteId, sceneId, next)
      return next
    })
  }

  function handleResetItem(id: string) {
    setLayout(prev => {
      const next = { ...prev }
      delete next[id]
      scheduleSave(selectedIds, paletteId, sceneId, next)
      return next
    })
  }

  function handleResetAll() {
    if (!window.confirm('Reset all positions and sizes?')) return
    setLayout({})
    scheduleSave(selectedIds, paletteId, sceneId, {})
  }

  // ── Loading / error states ───────────────────────────────────────
  if (loading) return (
    <div className="h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
      <span className="text-[11px] uppercase tracking-display" style={{ color: 'var(--muted-foreground)' }}>
        Loading your moodboard…
      </span>
    </div>
  )

  if (expired) return (
    <div className="h-screen flex flex-col items-center justify-center gap-5 px-6 text-center" style={{ background: 'var(--background)' }}>
      <Clock size={32} style={{ color: 'var(--muted-foreground)' }} />
      <div>
        <p className="font-serif text-2xl" style={{ color: 'var(--ink)' }}>This link has expired.</p>
        <p className="mt-2 text-sm max-w-sm" style={{ color: 'var(--muted-foreground)' }}>
          Your moodboard access period has ended. Visit the store to create a new board or ask the team to extend your link.
        </p>
      </div>
    </div>
  )

  if (error) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'var(--background)' }}>
      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>This moodboard link is invalid.</p>
    </div>
  )

  const total = calcTotal(selectedIds)
  const daysLeft = expiresAt ? daysUntil(expiresAt) : null

  // ─── Sidebar ───────────────────────────────────────────────────────────────

  const sidebar = (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
        {([
          { id: 'products', label: 'Products', Icon: Package },
          { id: 'scene',    label: 'Scene',    Icon: ImageIcon },
          { id: 'palette',  label: 'Palette',  Icon: PaletteIcon },
        ] as { id: Panel; label: string; Icon: typeof Package }[]).map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setPanel(id)}
            className="flex flex-1 flex-col items-center gap-1 py-3 text-[9px] uppercase tracking-[0.18em] transition-colors"
            style={{
              color: panel === id ? 'var(--ink)' : 'var(--muted-foreground)',
              borderBottom: panel === id ? '2px solid var(--ink)' : '2px solid transparent',
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Products panel */}
        {panel === 'products' && (
          <div className="p-3 space-y-3">
            <div className="relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
              <input
                value={productQuery}
                onChange={e => setProductQuery(e.target.value)}
                placeholder="Search…"
                className="w-full rounded-full border py-2 pl-8 pr-3 text-xs focus:outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--ink)' }}
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {ALL_CATS.map(cat => (
                <button
                  key={cat}
                  onClick={() => setProductCat(cat)}
                  className="flex-shrink-0 rounded-full px-3 py-1 text-[9px] uppercase tracking-[0.15em] transition-colors"
                  style={productCat === cat
                    ? { background: 'var(--ink)', color: 'var(--primary-foreground)' }
                    : { border: '1px solid var(--border)', color: 'var(--muted-foreground)' }
                  }
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {filteredProducts.map(p => {
                const sel = selectedIds.includes(p.id)
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleProduct(p.id)}
                    className="group relative overflow-hidden rounded-2xl border text-left transition-all"
                    style={{ borderColor: sel ? 'var(--rust)' : 'var(--border)', background: 'var(--background)' }}
                  >
                    <div className="aspect-square w-full p-2" style={{ background: 'var(--secondary)' }}>
                      <img src={p.src} alt={p.name} className="h-full w-full object-contain" />
                    </div>
                    <div className="p-2">
                      <p className="text-[9px] uppercase tracking-[0.15em] leading-tight" style={{ color: 'var(--muted-foreground)' }}>{p.maker}</p>
                      <p className="text-[11px] font-medium leading-tight mt-0.5 line-clamp-2" style={{ color: 'var(--ink)' }}>{p.name}</p>
                    </div>
                    {sel && (
                      <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full" style={{ background: 'var(--rust)' }}>
                        <Check size={10} color="white" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Scene panel */}
        {panel === 'scene' && (
          <div className="p-3 space-y-3">
            <p className="text-[10px] uppercase tracking-[0.24em]" style={{ color: 'var(--muted-foreground)' }}>Backdrop</p>
            <div className="grid grid-cols-2 gap-2">
              {scenes.map(s => {
                const isActive = activeScene.id === s.id
                return (
                  <button key={s.id} onClick={() => handleSetSceneId(s.id)}
                    className="group overflow-hidden rounded-2xl border text-left transition-all"
                    style={{ borderColor: isActive ? 'var(--ink)' : 'var(--border)' }}
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden" style={{ background: 'var(--secondary)' }}>
                      {s.kind === 'image' && s.src
                        ? <img src={s.src} alt={s.name} className="h-full w-full object-cover" />
                        : <div className="h-full w-full" style={{ background: `linear-gradient(180deg, ${colorMap[activePalette.colors[1] ?? 'linen']} 0%, ${colorMap[activePalette.colors[0] ?? 'cream']} 100%)` }} />
                      }
                    </div>
                    <div className="flex items-center justify-between px-2 py-1.5">
                      <span className="text-[10px]" style={{ color: 'var(--ink)' }}>{s.name}</span>
                      {isActive && <span className="text-[9px] uppercase tracking-[0.15em]" style={{ color: 'var(--rust)' }}>Active</span>}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Palette panel */}
        {panel === 'palette' && (
          <div className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.24em]" style={{ color: 'var(--muted-foreground)' }}>Palette</p>
              <button
                onClick={() => { handleSetPaletteId('ai'); setAiNonce(n => n + 1) }}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[9px] uppercase tracking-[0.15em]"
                style={{ background: 'var(--ink)', color: 'var(--primary-foreground)' }}
              >
                <Sparkles size={10} />
                {activePalette.id === 'ai' ? <><RefreshCw size={9} /> Re-gen</> : 'AI pick'}
              </button>
            </div>
            <div className="space-y-2">
              {allPalettes.map(p => {
                const isActive = activePalette.id === p.id
                return (
                  <button key={p.id} onClick={() => handleSetPaletteId(p.id)}
                    className="flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition-all"
                    style={{ borderColor: isActive ? 'var(--ink)' : 'var(--border)', background: isActive ? 'var(--secondary)' : undefined }}
                  >
                    <div className="flex h-8 flex-1 overflow-hidden rounded-lg">
                      {p.colors.map((c, i) => <div key={i} className="flex-1" style={{ backgroundColor: colorMap[c] }} />)}
                    </div>
                    <span className="text-[11px] font-serif" style={{ color: 'var(--ink)' }}>{p.name}</span>
                    {p.id === 'ai' && <Sparkles size={10} style={{ color: 'var(--rust)' }} />}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  // ─── Header ────────────────────────────────────────────────────────────────

  const header = (
    <header
      className="flex flex-shrink-0 items-center justify-between border-b px-5 py-3"
      style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="font-serif text-xl shrink-0" style={{ color: 'var(--ink)' }}>Supermoods</span>
        {lead && (
          <span className="hidden md:block text-[11px] uppercase tracking-display truncate" style={{ color: 'var(--muted-foreground)' }}>
            · {lead.name}'s board
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Save indicator */}
        <span className="hidden md:block text-[10px] uppercase tracking-[0.18em]" style={{
          color: saveStatus === 'saved' ? 'var(--muted-foreground)' : saveStatus === 'saving' ? 'var(--rust)' : 'var(--muted-foreground)',
        }}>
          {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'unsaved' ? 'Unsaved' : 'Saved'}
        </span>

        {editMode && (
          <button
            onClick={handleResetAll}
            className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] hover:bg-[var(--secondary)]"
            style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
          >
            <RotateCcw size={11} /> Reset
          </button>
        )}
        <button
          onClick={() => setEditMode(v => !v)}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[11px] uppercase tracking-[0.18em] transition-colors"
          style={editMode
            ? { background: 'var(--rust)', color: 'var(--primary-foreground)' }
            : { background: 'var(--ink)', color: 'var(--primary-foreground)' }
          }
        >
          {editMode ? <><Check size={13} /> Done</> : <><Pencil size={11} /> Edit</>}
        </button>
        <button
          onClick={() => setFullscreen(v => !v)}
          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] hover:bg-[var(--secondary)]"
          style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
        >
          {fullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        </button>
      </div>
    </header>
  )

  // ─── Fullscreen layout ─────────────────────────────────────────────────────

  if (fullscreen) {
    return (
      <div className="flex h-[100dvh] flex-col overflow-hidden" style={{ background: 'var(--background)' }}>
        {header}
        <div className="flex flex-1 min-h-0">
          <div className="flex flex-1 flex-col min-w-0 p-5 gap-3">
            <div className="flex-1 min-h-0 flex items-center justify-center">
              <div style={{ width: '80%', maxHeight: '100%', aspectRatio: '16/10' }}>
                <RoomScene
                  items={items}
                  palette={activePalette}
                  scene={activeScene}
                  onRemove={id => toggleProduct(id)}
                  editMode={editMode}
                  layout={layout}
                  onLayoutChange={handleLayoutChange}
                  onResetItem={handleResetItem}
                />
              </div>
            </div>
            {/* Product chips */}
            <div className="flex-shrink-0 flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              <span className="flex-shrink-0 text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--muted-foreground)' }}>On board ·</span>
              {items.map(p => (
                <div key={p.id} className="flex-shrink-0 flex items-center gap-2 rounded-full border pl-1 pr-3 py-1" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
                  <div className="h-7 w-7 overflow-hidden rounded-full" style={{ background: 'var(--secondary)' }}>
                    <img src={p.src} alt="" className="h-full w-full object-contain p-0.5" />
                  </div>
                  <span className="text-[11px]" style={{ color: 'var(--ink)' }}>{p.name}</span>
                  <button onClick={() => toggleProduct(p.id)} className="ml-1 flex h-4 w-4 items-center justify-center rounded-full hover:bg-[var(--rust)] hover:text-white" style={{ color: 'var(--muted-foreground)' }}>
                    <X size={10} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => { setFullscreen(false); setPanel('products') }}
                className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] hover:bg-[var(--ink)] hover:text-[var(--primary-foreground)] hover:border-[var(--ink)]"
                style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
              >
                <Plus size={11} /> Add
              </button>
            </div>
          </div>
          <aside className="flex w-72 flex-shrink-0 flex-col border-l" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            {sidebar}
          </aside>
        </div>
      </div>
    )
  }

  // ─── Default (scrolling) layout ────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {header}

      {/* Expiry notice */}
      {daysLeft !== null && daysLeft <= 7 && daysLeft > 0 && (
        <div className="border-b px-6 py-2.5 text-center text-[11px] uppercase tracking-display" style={{ borderColor: 'var(--border)', background: 'oklch(0.97 0.01 80)', color: 'var(--rust)' }}>
          <Clock size={10} className="inline mr-1.5" />
          Your board link expires in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
        </div>
      )}

      <div className="flex min-h-0" style={{ height: 'calc(100vh - 53px)' }}>
        {/* Canvas area */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1200px] px-6 py-8 md:px-10 space-y-8">

            {/* Greeting */}
            <div>
              <p className="text-xs uppercase tracking-display" style={{ color: 'var(--muted-foreground)' }}>Your concept board</p>
              {lead && (
                <h1 className="mt-2 font-serif text-4xl md:text-5xl leading-tight" style={{ color: 'var(--ink)' }}>
                  {lead.name}'s <em className="font-light italic" style={{ color: 'var(--rust)' }}>moodboard.</em>
                </h1>
              )}
              <p className="mt-2 text-[11px] uppercase tracking-display" style={{ color: 'var(--muted-foreground)' }}>
                {editMode ? 'Drag pieces to reposition · drag corner to resize' : 'Click Edit to rearrange pieces'}
              </p>
            </div>

            {/* Canvas */}
            {items.length > 0 ? (
              <RoomScene
                items={items}
                palette={activePalette}
                scene={activeScene}
                onRemove={id => toggleProduct(id)}
                editMode={editMode}
                layout={layout}
                onLayoutChange={handleLayoutChange}
                onResetItem={handleResetItem}
              />
            ) : (
              <div
                className="flex aspect-[16/10] items-center justify-center rounded-3xl"
                style={{ background: 'var(--secondary)' }}
              >
                <div className="text-center">
                  <p className="text-[11px] uppercase tracking-display" style={{ color: 'var(--muted-foreground)' }}>Your board is empty</p>
                  <p className="mt-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>Add pieces from the panel →</p>
                </div>
              </div>
            )}

            {/* Shopping list */}
            {items.length > 0 && (
              <section className="rounded-3xl p-6 md:p-8" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-soft-val)' }}>
                <p className="text-[11px] uppercase tracking-display mb-6" style={{ color: 'var(--muted-foreground)' }}>
                  Shopping list · {items.length} {items.length === 1 ? 'piece' : 'pieces'}
                </p>
                <table className="w-full">
                  <tbody>
                    {items.map(p => (
                      <tr key={p.id} className="border-b" style={{ borderColor: 'var(--border)' }}>
                        <td className="py-3 pr-4 w-12">
                          <div className="h-10 w-10 rounded-lg overflow-hidden" style={{ background: 'var(--secondary)' }}>
                            <img src={p.src} alt="" className="h-full w-full object-contain p-1" />
                          </div>
                        </td>
                        <td className="py-3">
                          <p className="font-serif text-base" style={{ color: 'var(--ink)' }}>{p.name}</p>
                          <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--muted-foreground)' }}>{p.maker}</p>
                        </td>
                        <td className="py-3 text-right font-serif text-base" style={{ color: 'var(--ink)' }}>{p.price}</td>
                        <td className="py-3 pl-4 w-8">
                          <button
                            onClick={() => toggleProduct(p.id)}
                            className="flex h-6 w-6 items-center justify-center rounded-full border transition-colors hover:border-[var(--rust)] hover:text-[var(--rust)]"
                            style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
                          >
                            <X size={11} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2" style={{ borderColor: 'var(--ink)' }}>
                      <td colSpan={2} className="pt-4 text-[11px] uppercase tracking-display" style={{ color: 'var(--muted-foreground)' }}>Total</td>
                      <td className="pt-4 text-right font-serif text-xl" style={{ color: 'var(--ink)' }} colSpan={2}>
                        €{total.toLocaleString('en-GB')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </section>
            )}

            {/* Footer note */}
            {expiresAt && (
              <p className="text-center text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                Board available until {new Date(expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
        </main>

        {/* Sidebar */}
        <aside
          className="hidden md:flex w-72 flex-shrink-0 flex-col border-l sticky top-0 h-screen"
          style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
        >
          {sidebar}
        </aside>
      </div>

      {/* Mobile: floating add button */}
      <div className="fixed bottom-6 right-6 md:hidden z-40">
        <button
          onClick={() => setPanel('products')}
          className="flex h-14 w-14 items-center justify-center rounded-full shadow-lg"
          style={{ background: 'var(--ink)', color: 'var(--primary-foreground)' }}
        >
          <Plus size={22} />
        </button>
      </div>
    </div>
  )
}
