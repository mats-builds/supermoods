'use client'

import { useState } from 'react'
import { Trash2, ExternalLink, Plus, Pencil, Check, X } from 'lucide-react'
import { useUserProducts } from '@/lib/user-products-store'
import AddWithUrlDialog from '@/components/shared/AddWithUrlDialog'
import { categories, type Category, type Role } from '@/lib/types'
import type { Product } from '@/lib/types'

const VALID_ROLES: Role[] = ['floor', 'ground', 'surface', 'hanging', 'standing', 'wall', 'prop']

export default function AdditionsTab() {
  const { products, remove, update } = useUserProducts()
  const [addOpen, setAddOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Partial<Product>>({})

  function startEdit(p: Product) {
    setEditingId(p.id)
    setDraft({ name: p.name, maker: p.maker, price: p.price, category: p.category, role: p.role })
  }

  function cancelEdit() {
    setEditingId(null)
    setDraft({})
  }

  function saveEdit(id: string) {
    update(id, draft)
    setEditingId(null)
    setDraft({})
  }

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em]" style={{ color: 'var(--muted-foreground)' }}>URL Imports</p>
          <h1 className="font-serif text-5xl mt-3" style={{ color: 'var(--ink)' }}>Additions</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Products added via URL from external furniture sites. {products.length} addition{products.length !== 1 ? 's' : ''}.
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm transition-transform hover:scale-[1.02]"
          style={{ background: 'var(--ink)', color: 'var(--primary-foreground)' }}
        >
          <Plus size={14} /> Add with URL
        </button>
      </header>

      {products.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed py-24 text-center"
          style={{ borderColor: 'var(--border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            No additions yet. Paste a product URL from any furniture site to get started.
          </p>
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm transition-transform hover:scale-[1.02]"
            style={{ background: 'var(--rust)', color: 'var(--primary-foreground)' }}
          >
            <Plus size={14} /> Add first product
          </button>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {products.map(p => {
            const editing = editingId === p.id
            return (
              <div key={p.id} className="flex gap-5 py-5">
                {/* Thumbnail */}
                <div
                  className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl"
                  style={{ background: 'var(--secondary)' }}
                >
                  {p.src
                    ? <img src={p.src} alt={p.name} className="h-full w-full object-contain p-2" />
                    : <div className="flex h-full items-center justify-center text-xs" style={{ color: 'var(--muted-foreground)' }}>No image</div>
                  }
                </div>

                {/* Info / edit form */}
                <div className="flex flex-1 flex-col gap-3">
                  {editing ? (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Name">
                          <input
                            value={draft.name ?? ''}
                            onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                            className="w-full rounded-xl border px-3 py-2 font-serif text-base focus:outline-none"
                            style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--ink)' }}
                          />
                        </Field>
                        <Field label="Brand">
                          <input
                            value={draft.maker ?? ''}
                            onChange={e => setDraft(d => ({ ...d, maker: e.target.value }))}
                            className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none"
                            style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--ink)' }}
                          />
                        </Field>
                        <Field label="Price">
                          <input
                            value={draft.price ?? ''}
                            onChange={e => setDraft(d => ({ ...d, price: e.target.value }))}
                            className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none"
                            style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--rust)' }}
                          />
                        </Field>
                        <Field label="Category">
                          <select
                            value={draft.category ?? 'Decor'}
                            onChange={e => setDraft(d => ({ ...d, category: e.target.value as Category }))}
                            className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none"
                            style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--ink)' }}
                          >
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </Field>
                        <Field label="Role (canvas position)">
                          <select
                            value={draft.role ?? 'ground'}
                            onChange={e => setDraft(d => ({ ...d, role: e.target.value as Role }))}
                            className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none"
                            style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--ink)' }}
                          >
                            {VALID_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </Field>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(p.id)}
                          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm"
                          style={{ background: 'var(--ink)', color: 'var(--primary-foreground)' }}
                        >
                          <Check size={13} /> Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm"
                          style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
                        >
                          <X size={13} /> Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--muted-foreground)' }}>
                          {p.category} · {p.maker}
                        </p>
                        <p className="mt-1 font-serif text-xl" style={{ color: 'var(--ink)' }}>{p.name}</p>
                        <p className="mt-1 text-sm font-medium" style={{ color: 'var(--rust)' }}>{p.price}</p>
                      </div>
                      {p.sourceUrl && (
                        <a
                          href={p.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] underline-offset-2 hover:underline"
                          style={{ color: 'var(--muted-foreground)' }}
                        >
                          <ExternalLink size={11} />
                          {(() => { try { return new URL(p.sourceUrl).hostname.replace('www.', '') } catch { return p.sourceUrl } })()}
                        </a>
                      )}
                    </>
                  )}
                </div>

                {/* Actions */}
                {!editing && (
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <button
                      onClick={() => startEdit(p)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border transition-colors hover:bg-[var(--secondary)]"
                      style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
                      title="Edit"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => remove(p.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border transition-colors hover:bg-[oklch(0.55_0.2_27/0.1)] hover:border-[oklch(0.55_0.2_27/0.4)]"
                      style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
                      title="Remove"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <AddWithUrlDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--muted-foreground)' }}>{label}</span>
      {children}
    </label>
  )
}
