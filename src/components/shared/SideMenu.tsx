'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { Menu, X, BookOpen, Sparkles, Link2, Plus, Settings, Trash2, ArrowLeft, Building2, User, LogOut } from 'lucide-react'
import { useUserProducts } from '@/lib/user-products-store'
import { useAuth } from '@/lib/auth'
import AddWithUrlDialog from './AddWithUrlDialog'
import AuthModal from '@/components/auth/AuthModal'
import type { Product } from '@/lib/types'

export default function SideMenu() {
  const [open, setOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [view, setView] = useState<'menu' | 'all'>('menu')
  const [mounted, setMounted] = useState(false)
  const { products, remove } = useUserProducts()
  const { user, signOut } = useAuth()

  useEffect(() => { setMounted(true) }, [])

  function close() { setOpen(false); setView('menu') }

  const drawer = mounted ? createPortal(
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[200]"
        style={{ background: 'oklch(0.22 0.02 50 / 0.4)', backdropFilter: 'blur(4px)' }}
        onClick={close}
      />

      {/* Drawer */}
      <div
        className="fixed left-0 top-0 z-[210] flex h-full w-[320px] flex-col sm:w-[380px]"
        style={{
          background: 'var(--background)',
          borderRight: '1px solid var(--border)',
          overflowY: 'auto',
          overflowX: 'hidden',
          boxShadow: '4px 0 40px oklch(0.22 0.02 50 / 0.15)',
        }}
      >
        {view === 'all' ? (
          <AllAdditionsView products={products} onRemove={remove} onBack={() => setView('menu')} />
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between border-b px-6 py-5 shrink-0" style={{ borderColor: 'var(--border)' }}>
              <div>
                <p className="font-serif text-2xl" style={{ color: 'var(--ink)' }}>Supermoods</p>
                <p className="text-[11px] uppercase tracking-display mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Compose. Curate. Collect.</p>
              </div>
              <button onClick={close} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-[var(--secondary)]" style={{ color: 'var(--muted-foreground)' }}>
                <X size={16} />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex flex-col px-2 py-4 shrink-0">
              <NavLink href="/" icon={<BookOpen size={16} strokeWidth={1.6} />} onClick={close}>The catalog</NavLink>
              <NavLink href="/brands" icon={<Building2 size={16} strokeWidth={1.6} />} onClick={close}>Brand catalogs</NavLink>
              <NavLink href="/canvas" icon={<Sparkles size={16} strokeWidth={1.6} />} onClick={close}>Your moodboard</NavLink>

              <div className="mx-4 my-3 border-t" style={{ borderColor: 'var(--border)' }} />

              {/* Account */}
              {user ? (
                <div className="flex items-center gap-3 rounded-2xl px-4 py-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-medium" style={{ background: 'var(--ink)', color: 'var(--primary-foreground)' }}>
                    {(user.email ?? '?').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs" style={{ color: 'var(--ink)' }}>{user.email}</p>
                    <Link href="/account" onClick={close} className="text-[10px] hover:underline" style={{ color: 'var(--rust)' }}>My account →</Link>
                  </div>
                  <button onClick={() => { signOut(); close() }} title="Sign out" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-[var(--secondary)]" style={{ color: 'var(--muted-foreground)' }}>
                    <LogOut size={13} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { close(); setTimeout(() => setAuthOpen(true), 150) }}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-colors hover:bg-[var(--secondary)]"
                  style={{ color: 'var(--ink)' }}
                >
                  <User size={16} strokeWidth={1.6} />
                  <span>Sign in / Create account</span>
                </button>
              )}

              <Link
                href="/atelier"
                onClick={close}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-colors hover:bg-[var(--secondary)]"
                style={{ color: 'var(--ink)' }}
              >
                <Settings size={16} strokeWidth={1.6} />
                <span>Atelier</span>
                <span className="ml-auto rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[0.18em]" style={{ background: 'oklch(0.55 0.14 40 / 0.12)', color: 'var(--rust)' }}>Owner</span>
              </Link>

              <button
                onClick={() => { close(); setTimeout(() => setAddOpen(true), 200) }}
                className="mt-3 flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition-transform hover:scale-[1.01]"
                style={{ background: 'var(--ink)', color: 'var(--primary-foreground)' }}
              >
                <Link2 size={16} strokeWidth={1.6} />
                Add with URL
                <Plus size={14} className="ml-auto" />
              </button>
            </nav>

            {/* Your additions */}
            {products.length > 0 && (
              <div className="border-t px-6 py-5 shrink-0" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-baseline justify-between mb-3">
                  <p className="text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--muted-foreground)' }}>Your additions · {products.length}</p>
                  {products.length > 3 && (
                    <button onClick={() => setView('all')} className="text-[10px] uppercase tracking-[0.22em] hover:underline" style={{ color: 'var(--rust)' }}>See all</button>
                  )}
                </div>
                <ul className="space-y-2">
                  {products.slice(0, 3).map(p => (
                    <AdditionRow key={p.id} product={p} onRemove={remove} />
                  ))}
                </ul>
              </div>
            )}

            {/* Footer */}
            <div className="mt-auto px-6 py-6 shrink-0 border-t" style={{ borderColor: 'var(--border)' }}>
              <p className="text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--muted-foreground)' }}>Supermoods · 2026</p>
            </div>
          </>
        )}
      </div>
    </>,
    document.body
  ) : null

  return (
    <>
      <button
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-[var(--secondary)]"
        style={{ color: 'var(--ink)' }}
      >
        <Menu strokeWidth={1.4} size={22} />
      </button>

      {open && drawer}

      <AddWithUrlDialog open={addOpen} onOpenChange={setAddOpen} />
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </>
  )
}

function NavLink({ href, icon, children, onClick }: { href: string; icon: React.ReactNode; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-colors hover:bg-[var(--secondary)]" style={{ color: 'var(--ink)' }}>
      {icon}
      {children}
    </Link>
  )
}

function AdditionRow({ product, onRemove }: { product: Product; onRemove: (id: string) => void }) {
  return (
    <li className="group flex items-center gap-3 rounded-xl p-2" style={{ background: 'var(--secondary)' }}>
      <img src={product.src} alt={product.name} className="h-10 w-10 rounded-lg object-contain shrink-0" style={{ background: 'var(--card)' }} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs" style={{ color: 'var(--ink)' }}>{product.name}</p>
        <p className="truncate text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--muted-foreground)' }}>{product.maker}</p>
      </div>
      <button onClick={() => onRemove(product.id)} title="Remove" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[var(--rust)] hover:text-[var(--primary-foreground)]" style={{ background: 'var(--card)', color: 'var(--rust)' }}>
        <X size={12} />
      </button>
    </li>
  )
}

function AllAdditionsView({ products, onRemove, onBack }: { products: Product[]; onRemove: (id: string) => void; onBack: () => void }) {
  return (
    <>
      <div className="border-b px-6 py-5 shrink-0" style={{ borderColor: 'var(--border)' }}>
        <button onClick={onBack} className="mb-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.22em] hover:opacity-70" style={{ color: 'var(--muted-foreground)' }}>
          <ArrowLeft size={12} /> Back
        </button>
        <p className="font-serif text-2xl" style={{ color: 'var(--ink)' }}>Your additions</p>
        <p className="text-[11px] uppercase tracking-display mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{products.length} {products.length === 1 ? 'piece' : 'pieces'} added by you</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {products.length === 0
          ? <p className="px-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>Nothing here yet. Add a piece with a URL to start.</p>
          : (
            <ul className="space-y-2">
              {products.map(p => (
                <li key={p.id} className="flex items-center gap-3 rounded-2xl p-3" style={{ background: 'var(--secondary)' }}>
                  <img src={p.src} alt={p.name} className="h-14 w-14 rounded-lg object-contain shrink-0" style={{ background: 'var(--card)' }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm" style={{ color: 'var(--ink)' }}>{p.name}</p>
                    <p className="truncate text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--muted-foreground)' }}>{p.maker}</p>
                    {p.price && <p className="mt-0.5 text-xs" style={{ color: 'var(--rust)' }}>{p.price}</p>}
                  </div>
                  <button onClick={() => onRemove(p.id)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full hover:bg-[var(--rust)] hover:text-[var(--primary-foreground)]" style={{ background: 'var(--card)', color: 'var(--rust)' }}>
                    <Trash2 size={12} />
                  </button>
                </li>
              ))}
            </ul>
          )
        }
      </div>
    </>
  )
}
