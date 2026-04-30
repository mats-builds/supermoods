'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, LogOut, Sparkles, Package, Mail, Calendar, ExternalLink } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/client'
import { useSelection } from '@/lib/selection-store'
import AuthModal from '@/components/auth/AuthModal'
import SideMenu from '@/components/shared/SideMenu'

interface Lead {
  id: string
  name: string
  email: string
  created_at: string
}

interface Board {
  id: string
  product_ids: string[]
  updated_at: string
}

export default function AccountPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const { count } = useSelection()
  const [leads, setLeads] = useState<Lead[]>([])
  const [board, setBoard] = useState<Board | null>(null)
  const [dataLoading, setDataLoading] = useState(false)
  const [showAuth, setShowAuth] = useState(false)

  // Load account data when user is known
  useEffect(() => {
    if (!user) return
    setDataLoading(true)
    const supabase = createClient()

    Promise.all([
      supabase.from('leads').select('id, name, email, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('user_boards').select('id, product_ids, updated_at').eq('user_id', user.id).maybeSingle(),
    ]).then(([leadsRes, boardRes]) => {
      if (leadsRes.data) setLeads(leadsRes.data)
      if (boardRes.data) setBoard(boardRes.data)
      setDataLoading(false)
    })
  }, [user])

  async function handleSignOut() {
    await signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--ink)' }} />
      </main>
    )
  }

  // Not logged in — show prompt
  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <p className="text-[11px] uppercase tracking-display" style={{ color: 'var(--muted-foreground)' }}>Your account</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight" style={{ color: 'var(--ink)' }}>
            Sign in to save your<br />
            <em className="italic font-light" style={{ color: 'var(--rust)' }}>boards & pieces.</em>
          </h1>
          <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
            Create a free account to keep your selections across devices, revisit past moodboards, and track your inquiries.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={() => setShowAuth(true)}
              className="rounded-full py-3 text-sm font-medium"
              style={{ background: 'var(--ink)', color: 'var(--primary-foreground)' }}
            >
              Sign in or create account
            </button>
            <Link href="/" className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              ← Back to catalog
            </Link>
          </div>
        </div>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </main>
    )
  }

  const joinDate = new Date(user.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const initials = (user.email ?? '?').slice(0, 2).toUpperCase()

  return (
    <main className="min-h-screen pb-20" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header className="sticky top-0 z-30 border-b backdrop-blur-md" style={{ borderColor: 'var(--border)', background: 'color-mix(in oklch, var(--background) 85%, transparent)' }}>
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-5 md:px-10">
          <div className="flex items-center gap-3">
            <SideMenu />
            <Link href="/" className="hidden items-center gap-1.5 text-[11px] uppercase tracking-display transition-opacity hover:opacity-60 md:flex" style={{ color: 'var(--muted-foreground)' }}>
              <ArrowLeft size={11} /> Catalog
            </Link>
          </div>
          <Link href="/" className="font-serif text-2xl md:text-3xl" style={{ color: 'var(--ink)' }}>Supermoods</Link>
          <button
            onClick={() => count > 0 && router.push('/canvas')}
            className="flex h-10 items-center gap-2 rounded-full px-4 text-sm transition-transform hover:scale-[1.02]"
            style={{ background: 'var(--ink)', color: 'var(--primary-foreground)' }}
          >
            <span className="tabular-nums font-medium">{count}</span>
            <span className="text-[11px] uppercase tracking-[0.18em]">Board</span>
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-10">
        {/* Profile hero */}
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full font-serif text-2xl"
              style={{ background: 'var(--ink)', color: 'var(--primary-foreground)' }}
            >
              {initials}
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-display" style={{ color: 'var(--muted-foreground)' }}>Your account</p>
              <h1 className="mt-0.5 font-serif text-3xl" style={{ color: 'var(--ink)' }}>{user.email}</h1>
              <div className="mt-1 flex items-center gap-4 text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                <span className="flex items-center gap-1"><Calendar size={11} /> Member since {joinDate}</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="hidden items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors hover:bg-[var(--secondary)] md:flex"
            style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {/* Current board */}
          <div className="md:col-span-2 space-y-8">
            <section className="rounded-3xl p-6" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-soft-val)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} style={{ color: 'var(--rust)' }} />
                  <p className="text-[11px] uppercase tracking-display" style={{ color: 'var(--muted-foreground)' }}>Saved board</p>
                </div>
                <Link href="/canvas" className="text-[11px] uppercase tracking-display transition-opacity hover:opacity-60" style={{ color: 'var(--rust)' }}>
                  Open →
                </Link>
              </div>
              {board && board.product_ids.length > 0 ? (
                <div className="mt-4">
                  <p className="font-serif text-2xl" style={{ color: 'var(--ink)' }}>{board.product_ids.length} {board.product_ids.length === 1 ? 'piece' : 'pieces'} on your board</p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    Last updated {new Date(board.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </p>
                  <Link
                    href="/canvas"
                    className="mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-transform hover:scale-[1.02]"
                    style={{ background: 'var(--rust)', color: 'var(--primary-foreground)' }}
                  >
                    Continue building
                  </Link>
                </div>
              ) : (
                <div className="mt-4">
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No pieces saved yet. Browse the catalog and add anything you love.</p>
                  <Link href="/" className="mt-3 inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm hover:bg-[var(--secondary)]" style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}>
                    Browse catalog
                  </Link>
                </div>
              )}
            </section>

            {/* Lead history */}
            <section>
              <div className="flex items-center gap-2 mb-5">
                <Mail size={16} style={{ color: 'var(--rust)' }} />
                <p className="text-[11px] uppercase tracking-display" style={{ color: 'var(--muted-foreground)' }}>Moodboard requests</p>
              </div>
              {dataLoading ? (
                <div className="h-20 flex items-center justify-center">
                  <div className="h-5 w-5 animate-spin rounded-full border-2" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--ink)' }} />
                </div>
              ) : leads.length === 0 ? (
                <div className="rounded-3xl p-6 text-center" style={{ background: 'var(--card)' }}>
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    No requests yet. Finish a moodboard and send it to yourself to get started.
                  </p>
                  <Link href="/canvas" className="mt-3 inline-flex text-sm" style={{ color: 'var(--rust)' }}>
                    Go to moodboard →
                  </Link>
                </div>
              ) : (
                <ul className="divide-y rounded-3xl overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                  {leads.map(lead => (
                    <li key={lead.id} className="flex items-center justify-between gap-4 px-6 py-4">
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{lead.name}</p>
                        <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                          {new Date(lead.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <span className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.18em]" style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}>
                        Submitted
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Sidebar: stats + quick links */}
          <div className="space-y-4">
            <div className="rounded-3xl p-5" style={{ background: 'var(--card)' }}>
              <p className="text-[10px] uppercase tracking-display mb-4" style={{ color: 'var(--muted-foreground)' }}>Quick links</p>
              <nav className="space-y-1">
                {[
                  { href: '/', label: 'The catalog' },
                  { href: '/brands', label: 'Brand catalogs' },
                  { href: '/canvas', label: 'My moodboard' },
                ].map(({ href, label }) => (
                  <Link key={href} href={href} className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-[var(--secondary)]" style={{ color: 'var(--ink)' }}>
                    {label}
                    <ExternalLink size={12} style={{ color: 'var(--muted-foreground)' }} />
                  </Link>
                ))}
              </nav>
            </div>

            <div className="rounded-3xl p-5" style={{ background: 'var(--card)' }}>
              <p className="text-[10px] uppercase tracking-display mb-3" style={{ color: 'var(--muted-foreground)' }}>Account</p>
              <p className="text-xs break-all mb-3" style={{ color: 'var(--ink)' }}>{user.email}</p>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center justify-center gap-2 rounded-full border py-2.5 text-sm transition-colors hover:bg-[var(--secondary)]"
                style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
              >
                <LogOut size={14} /> Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
