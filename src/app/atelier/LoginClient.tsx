'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth'

type View = 'signin' | 'signup'

export default function AtelierLoginClient() {
  const [view, setView] = useState<View>('signin')
  const router = useRouter()
  const { signIn } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <p className="text-[10px] uppercase tracking-[0.32em]" style={{ color: 'var(--muted-foreground)' }}>Supermoods</p>
          <h1 className="font-serif text-5xl mt-3" style={{ color: 'var(--ink)' }}>Atelier</h1>
          <p className="mt-3 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {view === 'signin' ? 'Sign in to your store dashboard' : 'Create your store account'}
          </p>
        </div>

        {view === 'signin' ? (
          <SignInForm onSignIn={signIn} onSuccess={() => router.push('/atelier/dashboard')} onSwitch={() => setView('signup')} />
        ) : (
          <SignUpForm onSuccess={() => setView('signin')} onSwitch={() => setView('signin')} />
        )}
      </div>
    </div>
  )
}

function SignInForm({ onSignIn, onSuccess, onSwitch }: {
  onSignIn: (email: string, password: string) => Promise<void>
  onSuccess: () => void
  onSwitch: () => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await onSignIn(email, password)
      onSuccess()
    } catch (err: any) {
      setError(err.message ?? 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-3xl border p-8 space-y-4"
      style={{ background: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-soft-val)' }}
    >
      <div>
        <label className="block text-[10px] uppercase tracking-[0.24em]" style={{ color: 'var(--muted-foreground)' }}>Email</label>
        <input
          type="email" required autoFocus
          value={email} onChange={e => setEmail(e.target.value)}
          className="mt-2 w-full rounded-xl border bg-transparent px-4 py-3 text-base focus:outline-none"
          style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
        />
      </div>
      <div>
        <label className="block text-[10px] uppercase tracking-[0.24em]" style={{ color: 'var(--muted-foreground)' }}>Password</label>
        <input
          type="password" required
          value={password} onChange={e => setPassword(e.target.value)}
          className="mt-2 w-full rounded-xl border bg-transparent px-4 py-3 text-base focus:outline-none"
          style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
        />
      </div>
      {error && <p className="text-xs" style={{ color: 'oklch(0.55 0.2 27)' }}>{error}</p>}
      <button
        type="submit" disabled={loading}
        className="w-full rounded-full py-3 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ background: 'var(--ink)', color: 'var(--primary-foreground)' }}
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        {loading ? 'Signing in…' : 'Sign in →'}
      </button>
      <p className="text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
        New to Supermoods?{' '}
        <button type="button" onClick={onSwitch} className="underline" style={{ color: 'var(--ink)' }}>
          Create account
        </button>
      </p>
    </form>
  )
}

function SignUpForm({ onSuccess, onSwitch }: { onSuccess: () => void; onSwitch: () => void }) {
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
      <div
        className="rounded-3xl border p-8 text-center space-y-4"
        style={{ background: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-soft-val)' }}
      >
        <h2 className="font-serif text-3xl" style={{ color: 'var(--ink)' }}>Check your email</h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
          We've sent a confirmation link to <strong style={{ color: 'var(--ink)' }}>{email}</strong>.
          Click it to activate your account, then sign in here.
        </p>
        <button onClick={onSwitch} className="text-sm underline" style={{ color: 'var(--ink)' }}>
          Back to sign in
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-3xl border p-8 space-y-4"
      style={{ background: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-soft-val)' }}
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] uppercase tracking-[0.24em]" style={{ color: 'var(--muted-foreground)' }}>Your name</label>
          <input
            type="text" required autoFocus
            value={name} onChange={e => setName(e.target.value)}
            className="mt-2 w-full rounded-xl border bg-transparent px-4 py-3 text-base focus:outline-none"
            style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-[0.24em]" style={{ color: 'var(--muted-foreground)' }}>Store name</label>
          <input
            type="text" required
            value={storeName} onChange={e => setStoreName(e.target.value)}
            className="mt-2 w-full rounded-xl border bg-transparent px-4 py-3 text-base focus:outline-none"
            style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
          />
        </div>
      </div>
      <div>
        <label className="block text-[10px] uppercase tracking-[0.24em]" style={{ color: 'var(--muted-foreground)' }}>Website URL <span style={{ color: 'var(--muted-foreground)', fontWeight: 400 }}>(optional)</span></label>
        <input
          type="url"
          value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)}
          placeholder="https://yourstudio.com"
          className="mt-2 w-full rounded-xl border bg-transparent px-4 py-3 text-base focus:outline-none"
          style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
        />
      </div>
      <div>
        <label className="block text-[10px] uppercase tracking-[0.24em]" style={{ color: 'var(--muted-foreground)' }}>Email</label>
        <input
          type="email" required
          value={email} onChange={e => setEmail(e.target.value)}
          className="mt-2 w-full rounded-xl border bg-transparent px-4 py-3 text-base focus:outline-none"
          style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
        />
      </div>
      <div>
        <label className="block text-[10px] uppercase tracking-[0.24em]" style={{ color: 'var(--muted-foreground)' }}>Password <span style={{ color: 'var(--muted-foreground)', fontWeight: 400 }}>(min 8 chars)</span></label>
        <input
          type="password" required minLength={8}
          value={password} onChange={e => setPassword(e.target.value)}
          className="mt-2 w-full rounded-xl border bg-transparent px-4 py-3 text-base focus:outline-none"
          style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
        />
      </div>
      {error && <p className="text-xs" style={{ color: 'oklch(0.55 0.2 27)' }}>{error}</p>}
      <button
        type="submit" disabled={loading}
        className="w-full rounded-full py-3 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ background: 'var(--ink)', color: 'var(--primary-foreground)' }}
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        {loading ? 'Creating account…' : 'Create account →'}
      </button>
      <p className="text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
        Already have an account?{' '}
        <button type="button" onClick={onSwitch} className="underline" style={{ color: 'var(--ink)' }}>
          Sign in
        </button>
      </p>
    </form>
  )
}
