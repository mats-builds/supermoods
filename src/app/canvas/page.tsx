'use client'

import { useMemo, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Pencil, Check, RotateCcw, FileText,
  Sparkles, RefreshCw, Plus, Package, ImageIcon,
  Palette as PaletteIcon, X, Search, Upload, Loader2,
} from 'lucide-react'
import { catalog } from '@/lib/catalog'
import { curatedPalettes, generateAIPalette, scenes, colorMap, categories } from '@/lib/types'
import type { Palette, Scene, Category } from '@/lib/types'
import { useSelection, selectionStore } from '@/lib/selection-store'
import { useUserProducts } from '@/lib/user-products-store'
import { RoomScene } from '@/components/canvas/RoomScene'
import SideMenu from '@/components/shared/SideMenu'

type Panel = 'products' | 'scene' | 'palette'

// ─────────────────────────────────────────────
export default function MoodboardPage() {
  const router = useRouter()
  const {
    ids, paletteId, setPaletteId, sceneId, setSceneId,
    layout, setLayoutFor, resetLayoutFor, resetAllLayout,
  } = useSelection()
  const { products: userProducts } = useUserProducts()
  const [editMode, setEditMode] = useState(false)
  const [aiNonce, setAiNonce] = useState(0)
  const [panel, setPanel] = useState<Panel>('scene')
  const [productQuery, setProductQuery] = useState('')
  const [productCat, setProductCat] = useState<Category | 'All'>('All')

  // Custom uploaded scenes
  const [customScenes, setCustomScenes] = useState<Scene[]>([])
  const [uploadingScene, setUploadingScene] = useState(false)
  const [removingFurniture, setRemovingFurniture] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const allProducts = useMemo(() => {
    const seen = new Set<string>()
    return [...userProducts, ...catalog].filter(p => {
      if (seen.has(p.id)) return false; seen.add(p.id); return true
    })
  }, [userProducts])

  const items = useMemo(
    () => ids.map(id => allProducts.find(p => p.id === id)).filter(Boolean) as typeof catalog,
    [ids, allProducts],
  )

  const aiPalette = useMemo(() => generateAIPalette(ids, allProducts), [ids, allProducts, aiNonce])
  const allPalettes: Palette[] = useMemo(() => [aiPalette, ...curatedPalettes], [aiPalette])
  const activePalette = allPalettes.find(p => p.id === paletteId) ?? aiPalette
  const allScenes = useMemo(() => [...scenes, ...customScenes], [customScenes])
  const activeScene: Scene = allScenes.find(s => s.id === sceneId) ?? scenes[0]

  // Catalog filter for product picker
  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase()
    return allProducts.filter(p => {
      if (productCat !== 'All' && p.category !== productCat) return false
      if (q && !p.name.toLowerCase().includes(q) && !p.maker.toLowerCase().includes(q)) return false
      return true
    })
  }, [allProducts, productQuery, productCat])

  // Upload room image and optionally remove furniture
  async function handleRoomUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingScene(true)

    const dataUrl = await new Promise<string>(resolve => {
      const reader = new FileReader()
      reader.onload = ev => resolve(ev.target!.result as string)
      reader.readAsDataURL(file)
    })

    const id = `custom-${Date.now()}`
    const rawScene: Scene = { id, name: 'My Room', kind: 'image', src: dataUrl }
    setCustomScenes(prev => [rawScene, ...prev])
    setSceneId(id)
    setUploadingScene(false)
    e.target.value = ''

    // Now attempt AI furniture removal
    setRemovingFurniture(true)
    try {
      const res = await fetch('/api/remove-furniture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageDataUrl: dataUrl }),
      })
      const data = await res.json()
      const src = data.dataUrl ?? data.url
      if (src) {
        const cleanScene: Scene = { id: `${id}-clean`, name: 'My Room (empty)', kind: 'image', src }
        setCustomScenes(prev => [cleanScene, ...prev.filter(s => s.id !== id)])
        setSceneId(cleanScene.id)
      }
    } catch {
      // Keep raw upload as fallback
    } finally {
      setRemovingFurniture(false)
    }
  }

  if (items.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md text-center">
          <p className="text-[11px] uppercase tracking-display" style={{ color: 'var(--muted-foreground)' }}>Your board is empty</p>
          <h1 className="mt-3 font-serif text-5xl leading-[0.95]" style={{ color: 'var(--ink)' }}>
            Pick a few <em className="italic" style={{ color: 'var(--rust)' }}>pieces</em> first.
          </h1>
          <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
            Browse the catalog and tap + on anything you love.
          </p>
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
    <div className="flex h-[100dvh] flex-col overflow-hidden" style={{ background: 'var(--background)' }}>

      {/* ── Slim header ── */}
      <header
        className="flex flex-shrink-0 items-center justify-between border-b px-5 py-3"
        style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
      >
        <div className="flex items-center gap-3">
          <SideMenu />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] transition-opacity hover:opacity-60"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <ArrowLeft size={13} /> Catalog
          </Link>
        </div>

        <span className="font-serif text-xl" style={{ color: 'var(--ink)' }}>Supermoods</span>

        <div className="flex items-center gap-2">
          {editMode && (
            <button
              onClick={() => { if (window.confirm('Reset all positions?')) resetAllLayout() }}
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
            onClick={() => router.push('/present')}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[11px] uppercase tracking-[0.18em] transition-colors hover:opacity-90"
            style={{ background: 'var(--rust)', color: 'var(--primary-foreground)' }}
          >
            <FileText size={13} /> Finish
          </button>
        </div>
      </header>

      {/* ── Main: canvas + sidebar ── */}
      <div className="flex flex-1 min-h-0">

        {/* ── Left: moodboard canvas ── */}
        <div className="flex flex-1 flex-col min-w-0 p-5 gap-4">
          {/* RoomScene — constrained to available height */}
          <div className="flex-1 min-h-0 flex items-center">
            <div className="w-full h-full flex items-center justify-center">
              <div
                className="w-full"
                style={{ maxHeight: '100%', aspectRatio: '16/10' }}
              >
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
              </div>
            </div>
          </div>

          {/* Horizontal product chips */}
          <div className="flex-shrink-0 flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            <span className="flex-shrink-0 text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--muted-foreground)' }}>
              On board ·
            </span>
            {items.map(p => (
              <div
                key={p.id}
                className="flex-shrink-0 flex items-center gap-2 rounded-full border pl-1 pr-3 py-1"
                style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
              >
                <div className="h-7 w-7 overflow-hidden rounded-full" style={{ background: 'var(--secondary)' }}>
                  <img src={p.src} alt="" className="h-full w-full object-contain p-0.5" />
                </div>
                <span className="text-[11px]" style={{ color: 'var(--ink)' }}>{p.name}</span>
                <button
                  onClick={() => selectionStore.toggle(p.id)}
                  className="ml-1 flex h-4 w-4 items-center justify-center rounded-full transition-colors hover:bg-[var(--rust)] hover:text-white"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  <X size={10} />
                </button>
              </div>
            ))}
            <button
              onClick={() => setPanel('products')}
              className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] transition-colors hover:bg-[var(--ink)] hover:text-[var(--primary-foreground)] hover:border-[var(--ink)]"
              style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
            >
              <Plus size={11} /> Add piece
            </button>
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <aside
          className="flex w-72 flex-shrink-0 flex-col border-l"
          style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
        >
          {/* Tab bar */}
          <div className="flex border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
            {([
              { id: 'products', label: 'Products', Icon: Package },
              { id: 'scene', label: 'Scene', Icon: ImageIcon },
              { id: 'palette', label: 'Palette', Icon: PaletteIcon },
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

          {/* Tab content — scrollable */}
          <div className="flex-1 overflow-y-auto">

            {/* ── Products panel ── */}
            {panel === 'products' && (
              <div className="p-3 space-y-3">
                {/* Search */}
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
                {/* Category filter */}
                <div className="flex flex-wrap gap-1">
                  {(['All', ...categories] as const).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setProductCat(cat)}
                      className="rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.15em] transition-colors"
                      style={productCat === cat
                        ? { background: 'var(--ink)', color: 'var(--primary-foreground)' }
                        : { border: '1px solid var(--border)', color: 'var(--muted-foreground)' }
                      }
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Product grid */}
                <div className="grid grid-cols-2 gap-2">
                  {filteredProducts.map(p => {
                    const sel = ids.includes(p.id)
                    return (
                      <button
                        key={p.id}
                        onClick={() => selectionStore.toggle(p.id)}
                        className="group relative overflow-hidden rounded-2xl border text-left transition-all"
                        style={{
                          borderColor: sel ? 'var(--rust)' : 'var(--border)',
                          background: 'var(--background)',
                        }}
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

            {/* ── Scene panel ── */}
            {panel === 'scene' && (
              <div className="p-3 space-y-3">
                <p className="text-[10px] uppercase tracking-[0.24em]" style={{ color: 'var(--muted-foreground)' }}>Backdrop</p>

                {/* Upload your room */}
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadingScene || removingFurniture}
                  className="flex w-full items-center gap-2 rounded-2xl border border-dashed px-4 py-3 text-sm transition-colors hover:bg-[var(--secondary)] disabled:opacity-50"
                  style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
                >
                  {removingFurniture
                    ? <><Loader2 size={14} className="animate-spin" style={{ color: 'var(--rust)' }} /> Clearing furniture…</>
                    : uploadingScene
                    ? <><Loader2 size={14} className="animate-spin" /> Uploading…</>
                    : <><Upload size={14} /> Upload your room</>
                  }
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleRoomUpload}
                />
                {removingFurniture && (
                  <p className="text-[10px] leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                    AI is removing furniture from your photo. This takes ~20–40 seconds.
                  </p>
                )}

                {/* Scene grid */}
                <div className="grid grid-cols-2 gap-2">
                  {allScenes.map(s => {
                    const isActive = activeScene.id === s.id
                    return (
                      <button
                        key={s.id}
                        onClick={() => setSceneId(s.id)}
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

            {/* ── Palette panel ── */}
            {panel === 'palette' && (
              <div className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-[0.24em]" style={{ color: 'var(--muted-foreground)' }}>Color palette</p>
                  <button
                    onClick={() => { setPaletteId('ai'); setAiNonce(n => n + 1) }}
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[9px] uppercase tracking-[0.15em] transition-colors"
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
                      <button
                        key={p.id}
                        onClick={() => setPaletteId(p.id)}
                        className="flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition-all"
                        style={{ borderColor: isActive ? 'var(--ink)' : 'var(--border)', background: isActive ? 'var(--secondary)' : undefined }}
                      >
                        <div className="flex h-8 flex-1 overflow-hidden rounded-lg">
                          {p.colors.map((c, i) => (
                            <div key={i} className="flex-1" style={{ backgroundColor: colorMap[c] }} />
                          ))}
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
        </aside>
      </div>
    </div>
  )
}
