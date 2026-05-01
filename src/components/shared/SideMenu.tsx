'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { Menu, X, BookOpen, Sparkles, Building2, Settings } from 'lucide-react'

export default function SideMenu() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  function close() { setOpen(false) }

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
        className="fixed left-0 top-0 z-[210] flex h-full w-[300px] flex-col"
        style={{
          background: 'var(--background)',
          borderRight: '1px solid var(--border)',
          boxShadow: '4px 0 40px oklch(0.22 0.02 50 / 0.12)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-5" style={{ borderColor: 'var(--border)' }}>
          <Link href="/" onClick={close} className="font-serif text-2xl transition-opacity hover:opacity-70" style={{ color: 'var(--ink)' }}>
            Supermoods
          </Link>
          <button
            onClick={close}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[var(--secondary)]"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex flex-col px-2 py-4 flex-1">
          <NavLink href="/" icon={<BookOpen size={16} strokeWidth={1.6} />} onClick={close}>
            The catalog
          </NavLink>
          <NavLink href="/brands" icon={<Building2 size={16} strokeWidth={1.6} />} onClick={close}>
            Brand catalogs
          </NavLink>
          <NavLink href="/canvas" icon={<Sparkles size={16} strokeWidth={1.6} />} onClick={close}>
            Your moodboard
          </NavLink>
        </nav>

        {/* Footer — atelier link + year */}
        <div className="border-t px-2 py-4" style={{ borderColor: 'var(--border)' }}>
          <Link
            href="/atelier"
            onClick={close}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-colors hover:bg-[var(--secondary)]"
            style={{ color: 'var(--ink)' }}
          >
            <Settings size={15} strokeWidth={1.6} />
            <span>Atelier</span>
            <span
              className="ml-auto rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[0.18em]"
              style={{ background: 'oklch(0.55 0.14 40 / 0.1)', color: 'var(--rust)' }}
            >
              Owner
            </span>
          </Link>
          <p className="mt-3 px-4 text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--muted-foreground)' }}>
            Supermoods · 2026
          </p>
        </div>
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
    </>
  )
}

function NavLink({
  href,
  icon,
  children,
  onClick,
}: {
  href: string
  icon: React.ReactNode
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-colors hover:bg-[var(--secondary)]"
      style={{ color: 'var(--ink)' }}
    >
      {icon}
      {children}
    </Link>
  )
}
