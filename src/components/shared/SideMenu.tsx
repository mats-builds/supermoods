'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, X, BookOpen, Sparkles, Building2, Settings, LogOut, User, ChevronRight, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth'

type AuthView = 'idle' | 'signin' | 'signup'

export default function SideMenu() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [authView, setAuthView] = useState<AuthView>('idle')
  const router = useRouter()
  const { user, loading, signIn, signOut } = useAuth()

  useEffect(() => { setMounted(true) }, [])
  // Close auth panel when user state changes (login/logout)
  useEffect(() => { if (!loading) setAuthView('idle') }, [user, loading])

  function close() { setOpen(false); setAuthView('idle') }

  const drawer = mounted ? createPortal(
    <>
      <div
        className="fixed inset-0 z-[200]"
        style={{ background: 'oklch(0.22 0.02 50 / 0.4)', backdropFilter: 'blur(4px)' }}
        onClick={close}
      />
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
        <nav className="flex flex-col px-2 py-4 flex-1 overflow-y-auto">
          <NavLink href="/" icon={<BookOpen size={16} strokeWidth={1.6} />} onClick={close}>
            The catalog
          </NavLink>
          <NavLink href="/brands" icon={<Building2 size={16} strokeWidth={1.6} />} onClick={close}>
            Brand catalogs
          </NavLink>
          <NavLink href="/canvas" icon={<Sparkles size={16} strokeWidth={1.6} />} onClick={close}>
            Your moodboard
          </NavLink>

          {/* Auth panel — shown in body when not logged in or toggled */}
          {!loading && (
            authView !== 'idle' ? (
              <div className="mt-4 px-2">
                {authView === 'signin' && (
                  <SignInForm
                    onSuccess={close}
                    onSwitch={() => setAuthView('signup')}
                    onCancel={() => setAuthView('idle')}
                    signIn={signIn}
                  />
                )}
                {authView === 'signup' && (
                  <SignUpForm
                    onSuccess={close}
                    onSwitch={() => setAuthView('signin')}
                    onCancel={() => setAuthView('idle')}
                  />
                )}
              </div>
            ) : !user ? (
              <button
                onClick={() => setAuthView('signin')}
                className="mt-4 mx-2 flex items-center justify-between rounded-2xl px-4 py-3 text-sm transition-colors hover:bg-[var(--secondary)]"
                style={{ color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}
              >
                <span className="flex items-center gap-3">
                  <User size={16} strokeWidth={1.6} />
                  Sign in as store owner
                </span>
                <ChevronRight size={14} />
              </button>
            ) : null
          )}
        </nav>

        {/* Footer */}
        <div className="border-t px-2 py-4" style={{ borderColor: 'var(--border)' }}>
          {user ? (
            <>
              {/* Profile block */}
              <div
                className="mb-2 flex items-center gap-3 rounded-2xl px-4 py-3"
                style={{ background: 'var(--secondary)' }}
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] uppercase font-medium"
                  style={{ background: 'var(--ink)', color: 'var(--primary-foreground)' }}
                >
                  {user.email?.[0]?.toUpperCase() ?? 'S'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: 'var(--ink)' }}>{user.email}</p>
                  <p className="text-[10px] uppercase tracking-[0.15em]" style={{ color: 'var(--muted-foreground)' }}>Store owner</p>
                </div>
              </div>

              {/* Atelier link */}
              <Link
                href="/atelier/dashboard"
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
                  Dashboard
                </span>
              </Link>

              {/* Sign out */}
              <button
                onClick={async () => { await signOut(); close(); router.refresh() }}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-colors hover:bg-[var(--secondary)]"
                style={{ color: 'var(--muted-foreground)' }}
              >
                <LogOut size={15} strokeWidth={1.6} />
                Sign out
              </button>
            </>
          ) : (
            <p className="px-4 text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--muted-foreground)' }}>
              Supermoods · 2026
            </p>
          )}
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

function NavLink({ href, icon, children, onClick }: {
  href: string; icon: React.ReactNode; children: React.ReactNode; onClick: () => void
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

function SignInForm({ onSuccess, onSwitch, onCancel, signIn }: {
  onSuccess: () => void
  onSwitch: () => void
  onCancel: () => void
  signIn: (email: string, password: string) => Promise<void>
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await signIn(email, password)
      router.push('/atelier/dashboard')
      onSuccess()
    } catch (err: any) {
      setError(err.message ?? 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border p-4 space-y-3" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.24em]" style={{ color: 'var(--muted-foreground)' }}>Sign in</p>
        <button type="button" onClick={onCancel} style={{ color: 'var(--muted-foreground)' }}>
          <X size={14} />
        </button>
      </div>
      <input
        autoFocus type="email" required placeholder="Email"
        value={email} onChange={e => setEmail(e.target.value)}
        className="w-full rounded-xl border bg-transparent px-3 py-2 text-sm focus:outline-none"
        style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
      />
      <input
        type="password" required placeholder="Password"
        value={password} onChange={e => setPassword(e.target.value)}
        className="w-full rounded-xl border bg-transparent px-3 py-2 text-sm focus:outline-none"
        style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
      />
      {error && <p className="text-xs" style={{ color: 'oklch(0.55 0.2 27)' }}>{error}</p>}
      <button
        type="submit" disabled={loading}
        className="w-full rounded-full py-2 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ background: 'var(--ink)', color: 'var(--primary-foreground)' }}
      >
        {loading && <Loader2 size={13} className="animate-spin" />}
        {loading ? 'Signing in…' : 'Sign in →'}
      </button>
      <p className="text-center text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
        New here?{' '}
        <button type="button" onClick={onSwitch} className="underline" style={{ color: 'var(--ink)' }}>
          Create account
        </button>
      </p>
    </form>
  )
}

function SignUpForm({ onSuccess, onSwitch, onCancel }: {
  onSuccess: () => void
  onSwitch: () => void
  onCancel: () => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [storeName, setStoreName] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, store_name: storeName, website_url: websiteUrl }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Sign up failed')
      setDone(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border p-4 text-center space-y-3" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <p className="text-sm font-serif text-2xl" style={{ color: 'var(--ink)' }}>Check your email</p>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
          We've sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then sign in.
        </p>
        <button onClick={onSwitch} className="text-sm underline" style={{ color: 'var(--ink)' }}>
          Back to sign in
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border p-4 space-y-3" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.24em]" style={{ color: 'var(--muted-foreground)' }}>Create account</p>
        <button type="button" onClick={onCancel} style={{ color: 'var(--muted-foreground)' }}>
          <X size={14} />
        </button>
      </div>
      <input
        autoFocus type="text" required placeholder="Your name"
        value={name} onChange={e => setName(e.target.value)}
        className="w-full rounded-xl border bg-transparent px-3 py-2 text-sm focus:outline-none"
        style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
      />
      <input
        type="text" required placeholder="Store / studio name"
        value={storeName} onChange={e => setStoreName(e.target.value)}
        className="w-full rounded-xl border bg-transparent px-3 py-2 text-sm focus:outline-none"
        style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
      />
      <input
        type="url" placeholder="Website URL (optional)"
        value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)}
        className="w-full rounded-xl border bg-transparent px-3 py-2 text-sm focus:outline-none"
        style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
      />
      <input
        type="email" required placeholder="Email"
        value={email} onChange={e => setEmail(e.target.value)}
        className="w-full rounded-xl border bg-transparent px-3 py-2 text-sm focus:outline-none"
        style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
      />
      <input
        type="password" required placeholder="Password" minLength={8}
        value={password} onChange={e => setPassword(e.target.value)}
        className="w-full rounded-xl border bg-transparent px-3 py-2 text-sm focus:outline-none"
        style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
      />
      {error && <p className="text-xs" style={{ color: 'oklch(0.55 0.2 27)' }}>{error}</p>}
      <button
        type="submit" disabled={loading}
        className="w-full rounded-full py-2 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ background: 'var(--ink)', color: 'var(--primary-foreground)' }}
      >
        {loading && <Loader2 size={13} className="animate-spin" />}
        {loading ? 'Creating…' : 'Create account →'}
      </button>
      <p className="text-center text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
        Already have one?{' '}
        <button type="button" onClick={onSwitch} className="underline" style={{ color: 'var(--ink)' }}>
          Sign in
        </button>
      </p>
    </form>
  )
}
