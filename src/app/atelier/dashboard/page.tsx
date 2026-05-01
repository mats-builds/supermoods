'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  BarChart3, Users, Package, Download, ArrowLeft,
  LogOut, Monitor, Settings, Store,
} from 'lucide-react'
import OverviewTab from '@/components/dashboard/OverviewTab'
import LeadFeedTab from '@/components/dashboard/LeadFeedTab'
import CatalogTab from '@/components/dashboard/CatalogTab'
import ImportTab from '@/components/dashboard/ImportTab'
import SettingsTab from '@/components/dashboard/SettingsTab'

type Tab = 'overview' | 'leads' | 'catalog' | 'import' | 'settings'

const NAV: { id: Tab; label: string; Icon: typeof BarChart3 }[] = [
  { id: 'overview', label: 'Overview', Icon: BarChart3 },
  { id: 'leads',    label: 'Lead Feed', Icon: Users },
  { id: 'catalog',  label: 'Catalog',   Icon: Package },
  { id: 'import',   label: 'Bulk Import', Icon: Download },
  { id: 'settings', label: 'Settings',  Icon: Settings },
]

export default function AtelierDashboard() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('overview')
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    fetch('/api/atelier/stats')
      .then(r => { if (r.status === 401) router.replace('/atelier'); else setAuthed(true) })
      .catch(() => router.replace('/atelier'))
  }, [router])

  async function logout() {
    await fetch('/api/atelier/auth', { method: 'DELETE' })
    router.replace('/atelier')
  }

  if (authed === null) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <span className="text-[11px] uppercase tracking-display" style={{ color: 'var(--muted-foreground)' }}>Loading…</span>
      </div>
    )
  }

  const activeNav = NAV.find(n => n.id === tab)!

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--background)', color: 'var(--ink)' }}>

      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside
        className="sticky top-0 hidden h-screen w-60 flex-col border-r md:flex"
        style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
      >
        {/* Logo */}
        <div className="border-b px-5 py-5" style={{ borderColor: 'var(--border)' }}>
          <Link href="/" className="block transition-opacity hover:opacity-70">
            <p className="text-[10px] uppercase tracking-[0.32em]" style={{ color: 'var(--muted-foreground)' }}>Supermoods</p>
            <p className="font-serif text-3xl mt-0.5" style={{ color: 'var(--ink)' }}>Atelier</p>
          </Link>
        </div>

        {/* Quick actions */}
        <div className="border-b px-3 py-3 flex flex-col gap-1" style={{ borderColor: 'var(--border)' }}>
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-[var(--secondary)]"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <ArrowLeft size={14} /> Back to app
          </Link>
          <Link
            href="/kiosk"
            target="_blank"
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-[var(--secondary)]"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <Monitor size={14} /> Open kiosk
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {NAV.map(({ id, label, Icon }) => {
            const active = tab === id
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-left transition-all mb-0.5"
                style={{
                  background: active ? 'var(--ink)' : 'transparent',
                  color: active ? 'var(--primary-foreground)' : 'var(--ink)',
                }}
              >
                <Icon size={15} />
                <span>{label}</span>
              </button>
            )
          })}
        </nav>

        {/* Account block — bottom */}
        <div className="border-t px-3 py-4" style={{ borderColor: 'var(--border)' }}>
          <div
            className="mb-2 flex items-center gap-3 rounded-xl px-3 py-2.5"
            style={{ background: 'var(--secondary)' }}
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
              style={{ background: 'var(--ink)' }}
            >
              <Store size={14} style={{ color: 'var(--primary-foreground)' }} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: 'var(--ink)' }}>Store owner</p>
              <p className="text-[10px] uppercase tracking-[0.15em]" style={{ color: 'var(--muted-foreground)' }}>Atelier access</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-[var(--secondary)]"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ───────────────────────────────────────────────── */}
      <div
        className="md:hidden fixed top-0 inset-x-0 z-40 border-b"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="font-serif text-xl" style={{ color: 'var(--ink)' }}>Atelier</Link>
          <button
            onClick={() => setMobileMenuOpen(v => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium"
            style={{ background: 'var(--secondary)', color: 'var(--ink)' }}
          >
            {activeNav.label.slice(0, 2)}
          </button>
        </div>
        {/* Mobile nav dropdown */}
        {mobileMenuOpen && (
          <div className="border-t px-3 pb-3 pt-2 flex flex-wrap gap-1.5" style={{ borderColor: 'var(--border)' }}>
            {NAV.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => { setTab(id); setMobileMenuOpen(false) }}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors"
                style={tab === id
                  ? { background: 'var(--ink)', color: 'var(--primary-foreground)' }
                  : { background: 'var(--secondary)', color: 'var(--ink)' }
                }
              >
                <Icon size={12} /> {label}
              </button>
            ))}
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs"
              style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}
            >
              <LogOut size={12} /> Sign out
            </button>
          </div>
        )}
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="flex-1 px-5 py-8 pt-20 md:px-10 md:pt-10 overflow-auto">
        <div className="mx-auto max-w-7xl">
          {tab === 'overview'  && <OverviewTab />}
          {tab === 'leads'     && <LeadFeedTab />}
          {tab === 'catalog'   && <CatalogTab />}
          {tab === 'import'    && <ImportTab />}
          {tab === 'settings'  && <SettingsTab />}
        </div>
      </main>
    </div>
  )
}
