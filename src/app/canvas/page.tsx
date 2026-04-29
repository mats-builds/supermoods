'use client'

import { useMemo, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Pencil, Check, RotateCcw, FileText,
  Sparkles, RefreshCw, Plus, Package, ImageIcon,
  Palette as PaletteIcon, X, Search, Upload, Loader2,
  Maximize2, Minimize2,
} from 'lucide-react'
import { catalog } from '@/lib/catalog'
import { allBrandProducts } from '@/lib/brands'
import { curatedPalettes, generateAIPalette, scenes, colorMap, categories } from '@/lib/types'
import type { Palette, Scene, Category } from '@/lib/types'
import { useSelection, selectionStore } from '@/lib/selection-store'
import { useUserProducts } from '@/lib/user-products-store'
import { RoomScene } from '@/components/canvas/RoomScene'
import SideMenu from '@/components/shared/SideMenu'

type Panel = 'products' | 'scene' | 'palette'

export default function MoodboardPage() {
  const router = useRouter()
  const {
    ids, paletteId, setPaletteId, sceneId, setSceneId,
    layout, setLayoutFor, resetLayoutFor, resetAllLayout,
  } = useSelection()
  const { products: userProducts } = useUserProducts()
  const [editMode, setEditMode] = useState(false)
  const [aiNonce, setAiNonce] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [panel, setPanel] = useState<Panel>('scene')
  const [productQuery, setProductQuery] = useState('')
  const [productCat, setProductCat] = useState<Category | 'All'>('All')
  const [customScenes, setCustomScenes] = useState<Scene[]>([])
  const [uploadingScene, setUploadingScene] = useState(false)
  const [removingFurniture, setRemovingFurniture] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const allProducts = useMemo(() => {
    const seen = new Set<string>()
    return [...userProducts, ...allBrandProducts, ...catalog].filter(p => {
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

  // Stable category order — never re-sort based on selection
  const ALL_CATS: (Category | 'All')[] = ['All', ...categories]

  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase()
    return allProducts.filter(p => {
      if (productCat !== 'All' && p.category !== productCat) return false
      if (q && !p.name.toLowerCase().includes(q) && !p.maker.toLowerCase().includes(q)) return false
      return true
    })
  }, [allProducts, productQuery, productCat])

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
    setCustomScenes(prev => [...prev, rawScene])
    setSceneId(id)
    setUploadingScene(false)
    e.target.value = ''

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
        setCustomScenes(prev => [...prev.filter(s => s.id !== id), cleanScene])
        setSceneId(cleanScene.id)
      }
    } catch { /* keep raw */ } finally {
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
          <p className="mt-4 text-sm" style={{ color: 'var(--muted-foreground)' }}>Browse the catalog and tap + on anything you love.</p>
          <div className="mt-8">
            <Link href="/" className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm" style={{ background: 'var(--ink)', color: 'var(--primary-foreground)' }}>
              <ArrowLeft size={16} /> Back to catalog
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // ── Shared sidebar content ──────────────────────────────────────
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

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">

        {/* Products */}
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
            {/* Category pills — single row, no wrap */}
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
                const sel = ids.includes(p.id)
                return (
                  <button
                    key={p.id}
                    onClick={() => selectionStore.toggle(p.id)}
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

        {/* Scene */}
        {panel === 'scene' && (
          <div className="p-3 space-y-3">
            <p className="text-[10px] uppercase tracking-[0.24em]" style={{ color: 'var(--muted-foreground)' }}>Backdrop</p>
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
            {removingFurniture && (
              <p className="text-[10px] leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                AI is removing furniture. This takes ~20–40 s.
              </p>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleRoomUpload} />
            <div className="grid grid-cols-2 gap-2">
              {allScenes.map(s => {
                const isActive = activeScene.id === s.id
                return (
                  <button key={s.id} onClick={() => setSceneId(s.id)}
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

        {/* Palette */}
        {panel === 'palette' && (
          <div className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.24em]" style={{ color: 'var(--muted-foreground)' }}>Palette</p>
              <button
                onClick={() => { setPaletteId('ai'); setAiNonce(n => n + 1) }}
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
                  <button key={p.id} onClick={() => setPaletteId(p.id)}
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

  // ── Shared header ───────────────────────────────────────────────
  const header = (
    <header
      className="flex flex-shrink-0 items-center justify-between border-b px-6 py-4"
      style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
    >
      <div className="flex items-center gap-3">
        <SideMenu />
        <Link href="/" className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] transition-opacity hover:opacity-60" style={{ color: 'var(--muted-foreground)' }}>
          <ArrowLeft size={13} /> Catalog
        </Link>
      </div>
      <span className="font-serif text-2xl" style={{ color: 'var(--ink)' }}>Supermoods</span>
      <div className="flex items-center gap-2">
        {editMode && (
          <button onClick={() => { if (window.confirm('Reset all positions?')) resetAllLayout() }}
            className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] hover:bg-[var(--secondary)]"
            style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
            <RotateCcw size={11} /> Reset
          </button>
        )}
        <button onClick={() => setEditMode(v => !v)}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[11px] uppercase tracking-[0.18em] transition-colors"
          style={editMode ? { background: 'var(--rust)', color: 'var(--primary-foreground)' } : { background: 'var(--ink)', color: 'var(--primary-foreground)' }}>
          {editMode ? <><Check size={13} /> Done</> : <><Pencil size={11} /> Edit</>}
        </button>
        <button onClick={() => setFullscreen(v => !v)}
          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] transition-colors hover:bg-[var(--secondary)]"
          style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
          title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
          {fullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        </button>
        <button onClick={() => router.push('/present')}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[11px] uppercase tracking-[0.18em] hover:opacity-90"
          style={{ background: 'var(--rust)', color: 'var(--primary-foreground)' }}>
          <FileText size={13} /> Finish
        </button>
      </div>
    </header>
  )

  // ── FULLSCREEN layout ───────────────────────────────────────────
  if (fullscreen) {
    return (
      <div className="flex h-[100dvh] flex-col overflow-hidden" style={{ background: 'var(--background)' }}>
        {header}
        <div className="flex flex-1 min-h-0">
          {/* Canvas */}
          <div className="flex flex-1 flex-col min-w-0 p-5 gap-3">
            <div className="flex-1 min-h-0 flex items-center justify-center">
              <div className="w-full" style={{ maxHeight: '100%', aspectRatio: '16/10' }}>
                <RoomScene items={items} palette={activePalette} scene={activeScene}
                  onRemove={id => selectionStore.toggle(id)} editMode={editMode}
                  layout={layout} onLayoutChange={setLayoutFor} onResetItem={resetLayoutFor} />
              </div>
            </div>
            {/* Horizontal product chips */}
            <div className="flex-shrink-0 flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              <span className="flex-shrink-0 text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--muted-foreground)' }}>On board ·</span>
              {items.map(p => (
                <div key={p.id} className="flex-shrink-0 flex items-center gap-2 rounded-full border pl-1 pr-3 py-1" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
                  <div className="h-7 w-7 overflow-hidden rounded-full" style={{ background: 'var(--secondary)' }}>
                    <img src={p.src} alt="" className="h-full w-full object-contain p-0.5" />
                  </div>
                  <span className="text-[11px]" style={{ color: 'var(--ink)' }}>{p.name}</span>
                  <button onClick={() => selectionStore.toggle(p.id)} className="ml-1 flex h-4 w-4 items-center justify-center rounded-full hover:bg-[var(--rust)] hover:text-white" style={{ color: 'var(--muted-foreground)' }}>
                    <X size={10} />
                  </button>
                </div>
              ))}
              <button onClick={() => setPanel('products')}
                className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] transition-colors hover:bg-[var(--ink)] hover:text-[var(--primary-foreground)] hover:border-[var(--ink)]"
                style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
                <Plus size={11} /> Add
              </button>
            </div>
          </div>
          {/* Sidebar */}
          <aside className="flex w-72 flex-shrink-0 flex-col border-l" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            {sidebar}
          </aside>
        </div>
      </div>
    )
  }

  // ── DEFAULT (scrolling) layout ──────────────────────────────────
  return (
    <main className="min-h-screen pb-20" style={{ background: 'var(--background)' }}>
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
          <div className="flex items-center gap-2">
            <span className="hidden text-[11px] uppercase tracking-[0.2em] md:block" style={{ color: 'var(--muted-foreground)' }}>
              {items.length} {items.length === 1 ? 'piece' : 'pieces'}
            </span>
            {editMode && (
              <button onClick={() => { if (window.confirm('Reset all positions and sizes?')) resetAllLayout() }}
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] hover:bg-[var(--secondary)]"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                <RotateCcw size={12} /> Reset all
              </button>
            )}
            <button onClick={() => setEditMode(v => !v)}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[11px] uppercase tracking-[0.18em] transition-transform hover:scale-[1.02]"
              style={editMode ? { background: 'var(--rust)', color: 'var(--primary-foreground)' } : { background: 'var(--ink)', color: 'var(--primary-foreground)' }}>
              {editMode ? <><Check size={14} /> Save</> : <><Pencil size={12} /> Edit</>}
            </button>
            <button onClick={() => setFullscreen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] transition-colors hover:bg-[var(--secondary)]"
              style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
              title="Fullscreen builder">
              <Maximize2 size={13} />
            </button>
          </div>
        </div>
      </header>

      {/* Title */}
      <section className="mx-auto max-w-[1500px] px-6 pb-6 pt-10 md:px-10 md:pt-14">
        <p className="text-xs uppercase tracking-display" style={{ color: 'var(--muted-foreground)' }}>Your concept</p>
        <h1 className="mt-3 font-serif text-5xl leading-[0.95] md:text-7xl" style={{ color: 'var(--ink)' }}>
          A room,<br /><em className="font-light italic" style={{ color: 'var(--rust)' }}>composed.</em>
        </h1>
        <p className="mt-3 text-[11px] uppercase tracking-display" style={{ color: 'var(--muted-foreground)' }}>
          {editMode ? 'Drag pieces to reposition · drag the corner handle to resize' : 'Click Edit to rearrange and resize pieces'}
        </p>
      </section>

      {/* Room scene */}
      <section className="mx-auto max-w-[1500px] px-6 md:px-10">
        <RoomScene items={items} palette={activePalette} scene={activeScene}
          onRemove={id => selectionStore.toggle(id)} editMode={editMode}
          layout={layout} onLayoutChange={setLayoutFor} onResetItem={resetLayoutFor} />
      </section>

      {/* Scene picker */}
      <section className="mx-auto mt-8 max-w-[1500px] px-6 md:px-10">
        <div className="rounded-3xl p-6 md:p-8" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-soft-val)' }}>
          <p className="text-[11px] uppercase tracking-display" style={{ color: 'var(--muted-foreground)' }}>Backdrop</p>
          <h2 className="mt-2 font-serif text-2xl" style={{ color: 'var(--ink)' }}>Place it on a palette, or in a real room.</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {/* Upload tile */}
            <button onClick={() => fileRef.current?.click()} disabled={uploadingScene || removingFurniture}
              className="flex flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-dashed transition-colors hover:bg-[var(--secondary)] disabled:opacity-50"
              style={{ borderColor: 'var(--border)', aspectRatio: 'auto', minHeight: '120px' }}>
              {removingFurniture
                ? <><Loader2 size={18} className="animate-spin" style={{ color: 'var(--rust)' }} /><span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Clearing furniture…</span></>
                : <><Upload size={18} style={{ color: 'var(--muted-foreground)' }} /><span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Upload your room</span></>
              }
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleRoomUpload} />

            {allScenes.map(s => {
              const isActive = activeScene.id === s.id
              return (
                <button key={s.id} onClick={() => setSceneId(s.id)}
                  className="group overflow-hidden rounded-2xl border text-left transition-all"
                  style={{ borderColor: isActive ? 'var(--ink)' : 'var(--border)', boxShadow: isActive ? 'var(--shadow-soft-val)' : undefined }}>
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
            <button onClick={() => { setPaletteId('ai'); setAiNonce(n => n + 1) }}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs uppercase tracking-[0.18em] transition-transform hover:scale-[1.02]"
              style={{ background: 'var(--ink)', color: 'var(--primary-foreground)' }}>
              <Sparkles size={14} />
              {activePalette.id === 'ai' ? 'Regenerate' : 'Let AI choose'}
              {activePalette.id === 'ai' && <RefreshCw size={12} />}
            </button>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-3 lg:grid-cols-6">
            {allPalettes.map(p => {
              const isActive = activePalette.id === p.id
              return (
                <button key={p.id} onClick={() => setPaletteId(p.id)}
                  className="rounded-2xl border p-3 text-left transition-all"
                  style={{ borderColor: isActive ? 'var(--ink)' : 'var(--border)', background: isActive ? 'var(--secondary)' : undefined, boxShadow: isActive ? 'var(--shadow-soft-val)' : undefined }}>
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
              <button onClick={() => selectionStore.toggle(p.id)}
                className="ml-2 flex h-8 w-8 items-center justify-center rounded-full border transition-colors hover:border-[var(--rust)] hover:text-[var(--rust)]"
                style={{ borderColor: 'var(--border)', color: 'oklch(0.22 0.02 50 / 0.6)' }}>
                <span className="text-lg leading-none rotate-45">+</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm hover:bg-[var(--secondary)]" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>
            <ArrowLeft size={16} /> Add more pieces
          </Link>
          <button onClick={() => router.push('/present')}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-transform hover:scale-[1.02]"
            style={{ background: 'var(--rust)', color: 'var(--primary-foreground)' }}>
            <FileText size={14} /> Finish
          </button>
        </div>
      </section>
    </main>
  )
}
