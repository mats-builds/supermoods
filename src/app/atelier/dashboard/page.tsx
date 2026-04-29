'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BarChart3, Users, Package, Download, ArrowLeft, Sparkles, LogOut } from 'lucide-react'
import OverviewTab from '@/components/dashboard/OverviewTab'
import LeadFeedTab from '@/components/dashboard/LeadFeedTab'
import CatalogTab from '@/components/dashboard/CatalogTab'
import ImportTab from '@/components/dashboard/ImportTab'

type Tab = 'overview' | 'leads' | 'catalog' | 'import'

const NAV: { id: Tab; label: string; Icon: typeof BarChart3 }[] = [
  { id: 'overview', label: 'Overview', Icon: BarChart3 },
  { id: 'leads', label: 'Lead Feed', Icon: Users },
  { id: 'catalog', label: 'Catalog', Icon: Package },
  { id: 'import', label: 'Bulk Import', Icon: Download },
]

export default function AtelierDashboard() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('overview')
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

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
      {/* Sidebar (desktop) */}
      <aside
        className="sticky top-0 hidden h-screen w-64 flex-col border-r p-6 md:flex"
        style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
      >
        <div className="mb-6">
          <p className="text-[10px] uppercase tracking-[0.32em]" style={{ color: 'var(--muted-foreground)' }}>Supermoods</p>
          <p className="font-serif text-3xl mt-1" style={{ color: 'var(--ink)' }}>Atelier</p>
        </div>

        <Link
          href="/"
          className="mb-6 flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all hover:shadow-sm"
          style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--ink)' }}
        >
          <ArrowLeft size={14} /> Back to app
        </Link>

        <nav className="flex flex-col gap-1">
          {NAV.map(({ id, label, Icon }) => {
            const active = tab === id
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-left transition-all"
                style={{
                  background: active ? 'var(--ink)' : 'transparent',
                  color: active ? 'var(--primary-foreground)' : 'var(--ink)',
                }}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            )
          })}
        </nav>

        <div className="mt-auto">
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-[var(--secondary)]"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <LogOut size={14} /> Sign out
          </button>
          <div className="mt-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.24em]" style={{ color: 'var(--muted-foreground)' }}>
            <Sparkles size={10} /> Store owner
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between border-b px-4 py-3 backdrop-blur-xl" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <p className="font-serif text-xl" style={{ color: 'var(--ink)' }}>Atelier</p>
        <div className="flex gap-1">
          <Link href="/" className="rounded-lg p-2" style={{ color: 'var(--muted-foreground)' }}>
            <ArrowLeft size={16} />
          </Link>
          {NAV.map(({ id, Icon }) => {
            const active = tab === id
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className="rounded-lg p-2"
                style={{
                  background: active ? 'var(--ink)' : 'transparent',
                  color: active ? 'var(--primary-foreground)' : 'var(--ink)',
                }}
              >
                <Icon size={16} />
              </button>
            )
          })}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 px-6 py-8 pt-20 md:px-12 md:pt-12">
        <div className="mx-auto max-w-7xl">
          {tab === 'overview' && <OverviewTab />}
          {tab === 'leads' && <LeadFeedTab />}
          {tab === 'catalog' && <CatalogTab />}
          {tab === 'import' && <ImportTab />}
        </div>
      </main>
    </div>
  )
}
