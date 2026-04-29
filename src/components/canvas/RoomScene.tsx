'use client'

import { useMemo, useRef, useState, useEffect } from 'react'
import type { Product, Scene, Palette, LayoutMap, LayoutOverride } from '@/lib/types'
import { colorMap } from '@/lib/types'

const ROOM_W_CM = 320
const FRAME_AR = 16 / 10
const ROOM_FRAME_H_CM = ROOM_W_CM / FRAME_AR

function pctSize(dims: { w: number; h: number } | undefined, fallback: { w: number; h: number }, scale = 1) {
  const w = (dims?.w ?? fallback.w) * scale
  const h = (dims?.h ?? fallback.h) * scale
  return { widthPct: (w / ROOM_W_CM) * 100, heightPct: (h / ROOM_FRAME_H_CM) * 100 }
}

type DefaultPos = { xPct: number; yPct: number }

function defaultPosition(p: Product, idx: number, total: number): DefaultPos {
  const spread = (i: number, t: number, span = 40, center = 50) =>
    t === 1 ? center : center - span / 2 + (i * span) / Math.max(t - 1, 1)
  switch (p.role) {
    case 'wall': return { xPct: spread(idx, total, 40, 50), yPct: 18 }
    case 'hanging': return { xPct: spread(idx, total, 30, 50), yPct: 8 }
    case 'floor': return { xPct: 50, yPct: 78 }
    case 'ground': return { xPct: spread(idx, total, 44, 50), yPct: 70 }
    case 'standing': return { xPct: idx % 2 === 0 ? 12 : 88, yPct: 55 }
    case 'surface': return { xPct: idx % 2 === 0 ? 26 : 74, yPct: 75 }
    default: {
      const xs = [22, 38, 54, 70, 82], ys = [70, 74, 68, 76, 72]
      return { xPct: xs[idx % xs.length], yPct: ys[idx % ys.length] }
    }
  }
}

const ROLE_FALLBACK: Record<string, { w: number; h: number }> = {
  wall: { w: 70, h: 90 }, hanging: { w: 45, h: 60 }, floor: { w: 300, h: 200 },
  ground: { w: 200, h: 80 }, standing: { w: 40, h: 160 }, surface: { w: 60, h: 50 }, prop: { w: 25, h: 30 },
}

interface Props {
  items: Product[]
  palette: Palette
  scene: Scene
  onRemove?: (id: string) => void
  editMode?: boolean
  layout?: LayoutMap
  onLayoutChange?: (id: string, patch: Partial<LayoutOverride>) => void
  onResetItem?: (id: string) => void
}

export function RoomScene({ items, palette, scene, onRemove, editMode = false, layout = {}, onLayoutChange, onResetItem }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => { if (!editMode) setSelectedId(null) }, [editMode])

  const placement = useMemo(() => {
    const counters: Record<string, number> = {}
    const totals: Record<string, number> = {}
    items.forEach(it => { totals[it.role] = (totals[it.role] ?? 0) + 1 })
    return items.map(it => {
      const idx = counters[it.role] ?? 0
      counters[it.role] = idx + 1
      return { item: it, idx, total: totals[it.role] }
    })
  }, [items])

  const bgStyle = scene.kind === 'palette' ? {
    background: `linear-gradient(180deg, ${colorMap[palette.colors[1] ?? 'linen']} 0%, ${colorMap[palette.colors[0] ?? 'cream']} 55%, ${colorMap[palette.colors[2] ?? 'travertine']} 100%)`,
  } : undefined

  const floorBand = scene.kind === 'palette'
    ? `linear-gradient(180deg, transparent 0%, transparent 62%, ${colorMap[palette.colors[3] ?? 'jute']}55 62%, ${colorMap[palette.colors[3] ?? 'jute']}88 100%)`
    : undefined

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-3xl ${editMode ? 'ring-2 ring-[var(--rust)]/60' : ''}`}
      style={{ aspectRatio: '16/10', ...bgStyle, boxShadow: 'var(--shadow-soft-val)' }}
      onPointerDown={e => { if (editMode && e.target === e.currentTarget) setSelectedId(null) }}
    >
      {scene.kind === 'image' && scene.src && (
        <img src={scene.src} alt={scene.name} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
      )}
      {floorBand && <div className="pointer-events-none absolute inset-0" style={{ background: floorBand }} />}
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(120% 80% at 50% 110%, oklch(0.22 0.02 50 / 0.28) 0%, transparent 55%)' }} />
      {editMode && (
        <div className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(to right, oklch(0.22 0.02 50 / 0.15) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.22 0.02 50 / 0.15) 1px, transparent 1px)', backgroundSize: '10% 10%' }} />
      )}

      {/* Palette dots */}
      <div className="absolute right-4 top-4 z-30 flex gap-1">
        {palette.colors.map((c, i) => (
          <div key={i} className="h-5 w-5 rounded-full ring-1 shadow-sm" style={{ backgroundColor: colorMap[c] }} />
        ))}
      </div>

      {/* Label */}
      <div className="absolute left-4 top-4 z-30 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] backdrop-blur" style={{ background: 'var(--card)/80', color: 'var(--ink)' }}>
        {scene.name} · {palette.name}
        {editMode && <span className="ml-2" style={{ color: 'var(--rust)' }}>· editing</span>}
      </div>

      {placement.map(({ item, idx, total }) => {
        const fallback = ROLE_FALLBACK[item.role] ?? { w: 60, h: 60 }
        const override = layout[item.id] ?? {}
        const def = defaultPosition(item, idx, total)
        const xPct = override.xPct ?? def.xPct
        const yPct = override.yPct ?? def.yPct
        const scale = override.scale ?? 1
        const { widthPct, heightPct } = pctSize(item.dims, fallback, scale)
        return (
          <Piece
            key={item.id}
            product={item}
            xPct={xPct} yPct={yPct}
            widthPct={widthPct} heightPct={heightPct}
            scale={scale}
            flipX={override.flipX ?? false}
            zOrder={override.z ?? 0}
            locked={override.locked ?? false}
            editMode={editMode}
            selected={selectedId === item.id}
            onSelect={() => setSelectedId(item.id)}
            containerRef={containerRef}
            onRemove={onRemove}
            onLayoutChange={onLayoutChange}
            onReset={onResetItem}
          />
        )
      })}
    </div>
  )
}

interface PieceProps {
  product: Product; xPct: number; yPct: number; widthPct: number; heightPct: number
  scale: number; flipX: boolean; zOrder: number; locked: boolean; editMode: boolean
  selected: boolean; onSelect: () => void; containerRef: React.RefObject<HTMLDivElement | null>
  onRemove?: (id: string) => void; onLayoutChange?: (id: string, patch: Partial<LayoutOverride>) => void
  onReset?: (id: string) => void
}

function Piece({ product, xPct, yPct, widthPct, heightPct, scale, flipX, zOrder, locked, editMode, selected, onSelect, containerRef, onRemove, onLayoutChange, onReset }: PieceProps) {
  const [dragging, setDragging] = useState(false)
  const [resizing, setResizing] = useState(false)
  const [localX, setLocalX] = useState(xPct)
  const [localY, setLocalY] = useState(yPct)
  const [localScale, setLocalScale] = useState(scale)

  useEffect(() => { if (!dragging) setLocalX(xPct) }, [xPct, dragging])
  useEffect(() => { if (!dragging) setLocalY(yPct) }, [yPct, dragging])
  useEffect(() => { if (!resizing) setLocalScale(scale) }, [scale, resizing])

  const startDrag = (e: React.PointerEvent) => {
    if (!editMode || !containerRef.current || locked) return
    if (!selected) { e.stopPropagation(); onSelect(); return }
    e.preventDefault(); e.stopPropagation()
    const rect = containerRef.current.getBoundingClientRect()
    const startX = e.clientX, startY = e.clientY, startXPct = localX, startYPct = localY
    setDragging(true)
    const move = (ev: PointerEvent) => {
      setLocalX(Math.max(0, Math.min(100, startXPct + ((ev.clientX - startX) / rect.width) * 100)))
      setLocalY(Math.max(0, Math.min(100, startYPct + ((ev.clientY - startY) / rect.height) * 100)))
    }
    const up = () => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up)
      setDragging(false)
      setLocalX(x => { setLocalY(y => { onLayoutChange?.(product.id, { xPct: x, yPct: y }); return y }); return x })
    }
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up)
  }

  const startResize = (e: React.PointerEvent) => {
    if (!editMode || !containerRef.current) return
    e.preventDefault(); e.stopPropagation()
    const rect = containerRef.current.getBoundingClientRect()
    const startX = e.clientX, startScale = localScale
    const baseWidthPx = (widthPct / 100) * rect.width / startScale
    setResizing(true)
    const move = (ev: PointerEvent) => {
      const next = Math.max(0.2, Math.min(4, (baseWidthPx * startScale + (ev.clientX - startX)) / baseWidthPx))
      setLocalScale(next)
    }
    const up = () => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up)
      setResizing(false)
      setLocalScale(s => { onLayoutChange?.(product.id, { scale: s }); return s })
    }
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up)
  }

  const liveWidth = (widthPct / scale) * localScale
  const liveHeight = (heightPct / scale) * localScale

  return (
    <div
      className={`group/piece absolute inline-flex items-end justify-center ${editMode ? (locked ? 'cursor-default' : selected ? 'cursor-move' : 'cursor-pointer') : ''}`}
      style={{
        left: `${localX}%`, top: `${localY}%`, height: `${liveHeight}%`, width: 'auto',
        transform: 'translate(-50%, -100%)',
        zIndex: dragging || resizing ? 1000 : locked ? 1 : selected ? 500 + zOrder : 10 + zOrder,
        touchAction: editMode && !locked ? 'none' : undefined,
      }}
      onPointerDown={editMode ? startDrag : undefined}
    >
      <img
        src={product.src} alt={product.name} loading="lazy" draggable={false}
        className={`h-full w-auto max-w-none object-contain object-bottom transition-transform duration-300 ${!editMode ? 'group-hover/piece:-translate-y-1 group-hover/piece:scale-[1.04]' : ''}`}
        style={{
          filter: 'drop-shadow(0 22px 22px oklch(0.22 0.02 50 / 0.35))',
          ...(flipX ? { transform: 'scaleX(-1)' } : {}),
        }}
      />

      {editMode && selected && <div className="pointer-events-none absolute inset-0 rounded-md ring-2 ring-[var(--rust)]" />}

      {/* Toolbar */}
      {editMode && selected && (
        <div className="absolute -top-9 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-md px-1 py-1 shadow ring-1 ring-[var(--border)] backdrop-blur" style={{ background: 'var(--card)' }} onPointerDown={e => e.stopPropagation()}>
          {[
            { label: '⇋', title: 'Flip', onClick: () => onLayoutChange?.(product.id, { flipX: !flipX }) },
            { label: '▲', title: 'Front', onClick: () => onLayoutChange?.(product.id, { z: (zOrder ?? 0) + 1 }) },
            { label: '▼', title: 'Back', onClick: () => onLayoutChange?.(product.id, { z: (zOrder ?? 0) - 1 }) },
            { label: '🔒', title: 'Lock', onClick: () => onLayoutChange?.(product.id, { locked: true }) },
          ].map(btn => (
            <button key={btn.label} onClick={e => { e.stopPropagation(); btn.onClick() }} title={btn.title} className="flex h-6 w-6 items-center justify-center rounded-sm text-[12px] hover:bg-[var(--secondary)]" style={{ color: 'var(--ink)' }}>
              {btn.label}
            </button>
          ))}
        </div>
      )}

      {editMode && locked && (
        <button onClick={e => { e.stopPropagation(); onLayoutChange?.(product.id, { locked: false }) }} onPointerDown={e => e.stopPropagation()} title="Unlock" className="absolute -right-2 -top-2 z-20 flex h-6 w-6 items-center justify-center rounded-full text-[11px] shadow ring-1" style={{ background: 'var(--ink)', color: 'var(--primary-foreground)' }}>
          🔒
        </button>
      )}

      {/* Resize handle */}
      {editMode && selected && (
        <button aria-label="Resize" onPointerDown={startResize} className="absolute -bottom-2 -right-2 z-10 flex h-5 w-5 cursor-se-resize items-center justify-center rounded-sm text-[10px] shadow ring-1" style={{ background: 'var(--rust)', color: 'var(--primary-foreground)' }}>⤡</button>
      )}
      {editMode && selected && onReset && (
        <button onClick={e => { e.stopPropagation(); onReset(product.id) }} className="absolute -bottom-2 -left-2 z-10 flex h-5 w-5 items-center justify-center rounded-sm text-[10px] shadow ring-1 ring-[var(--border)]" style={{ background: 'var(--card)', color: 'var(--ink)' }} title="Reset">↺</button>
      )}

      {onRemove && !editMode && (
        <button onClick={() => onRemove(product.id)} className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full text-[11px] opacity-0 ring-1 ring-[var(--border)] backdrop-blur transition-opacity group-hover/piece:opacity-100 hover:bg-[var(--rust)] hover:text-[var(--primary-foreground)]" style={{ background: 'var(--card)', color: 'var(--ink)' }}>×</button>
      )}
      {onRemove && editMode && selected && (
        <button onClick={e => { e.stopPropagation(); onRemove(product.id) }} className="absolute -right-2 -top-2 z-10 flex h-5 w-5 items-center justify-center rounded-sm text-[11px] shadow" style={{ background: 'var(--ink)', color: 'var(--primary-foreground)' }}>×</button>
      )}

      {/* Name tooltip */}
      <div className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] opacity-0 transition-opacity group-hover/piece:opacity-100" style={{ background: 'oklch(0.22 0.02 50 / 0.9)', color: 'var(--primary-foreground)' }}>
        {product.name}
        {editMode && <span className="ml-1"> · {Math.round(localScale * 100)}%</span>}
      </div>
    </div>
  )
}
