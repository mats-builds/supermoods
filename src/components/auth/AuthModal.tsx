'use client'

import { useState } from 'react'
import { X, ArrowRight, Eye, EyeOff, Check } from 'lucide-react'
import { useAuth } from '@/lib/auth'

type View = 'signin' | 'signup' | 'forgot' | 'check-email'

interface Props {
  onClose: () => void
  initialView?: View
}

export default function AuthModal({ onClose, initialView = 'signin' }: Props) {
  const { signIn, signUp, resetPassword } = useAuth()
  const [view, setView] = useState<View>(initialView)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function reset() { setError(''); setPassword('') }
  function go(v: View) { reset(); setView(v) }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setLoading(true); setError('')
    try {
      await signIn(email, password)
      onClose()
    } catch (err: any) {
      setError(err.message ?? 'Sign in failed. Please check your credentials.')
    } finally { setLoading(false) }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) { setError('Please fill in all fields.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true); setError('')
    try {
      await signUp(email, password)
      setView('check-email')
    } catch (err: any) {
      setError(err.message ?? 'Sign up failed. Please try again.')
    } finally { setLoading(false) }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (!email) { setError('Please enter your email.'); return }
    setLoading(true); setError('')
    try {
      await resetPassword(email)
      setView('check-email')
    } catch (err: any) {
      setError(err.message ?? 'Could not send reset email.')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: 'oklch(0.22 0.02 50 / 0.55)' }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-sm rounded-3xl p-8"
        style={{ background: 'var(--card)' }}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[var(--secondary)]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <X size={16} />
        </button>

        {/* ── Check email ─────────────────────────────────────── */}
        {view === 'check-email' && (
          <div className="py-4 text-center">
            <div
              className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: 'var(--ink)' }}
            >
              <Check size={22} style={{ color: 'var(--primary-foreground)' }} />
            </div>
            <h2 className="font-serif text-2xl" style={{ color: 'var(--ink)' }}>Check your inbox</h2>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
              We sent a link to <strong style={{ color: 'var(--ink)' }}>{email}</strong>. Click it to verify
              your account and you're all set.
            </p>
            <button
              onClick={onClose}
              className="mt-6 rounded-full border px-6 py-2.5 text-sm transition-colors hover:bg-[var(--secondary)]"
              style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
            >
              Close
            </button>
          </div>
        )}

        {/* ── Sign in ─────────────────────────────────────────── */}
        {view === 'signin' && (
          <>
            <p className="text-[11px] uppercase tracking-display" style={{ color: 'var(--muted-foreground)' }}>
              Welcome back
            </p>
            <h2 className="mt-2 font-serif text-2xl" style={{ color: 'var(--ink)' }}>Sign in</h2>

            <form onSubmit={handleSignIn} className="mt-6 space-y-4">
              <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
              <PasswordField label="Password" value={password} onChange={setPassword}
                show={showPw} onToggle={() => setShowPw(v => !v)} />

              {error && <p className="text-xs" style={{ color: 'oklch(0.55 0.2 27)' }}>{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-medium transition-transform hover:scale-[1.01] disabled:opacity-50"
                style={{ background: 'var(--ink)', color: 'var(--primary-foreground)' }}
              >
                {loading ? 'Signing in…' : <> Sign in <ArrowRight size={14} /> </>}
              </button>
            </form>

            <div className="mt-5 flex items-center justify-between text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
              <button onClick={() => go('forgot')} className="hover:underline">Forgot password?</button>
              <button onClick={() => go('signup')} className="hover:underline" style={{ color: 'var(--rust)' }}>
                Create account →
              </button>
            </div>
          </>
        )}

        {/* ── Sign up ─────────────────────────────────────────── */}
        {view === 'signup' && (
          <>
            <p className="text-[11px] uppercase tracking-display" style={{ color: 'var(--muted-foreground)' }}>
              New account
            </p>
            <h2 className="mt-2 font-serif text-2xl" style={{ color: 'var(--ink)' }}>Create account</h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Save your boards and pieces across devices.
            </p>

            <form onSubmit={handleSignUp} className="mt-6 space-y-4">
              <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
              <PasswordField label="Password" value={password} onChange={setPassword}
                show={showPw} onToggle={() => setShowPw(v => !v)}
                hint="At least 8 characters" />

              {error && <p className="text-xs" style={{ color: 'oklch(0.55 0.2 27)' }}>{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-medium transition-transform hover:scale-[1.01] disabled:opacity-50"
                style={{ background: 'var(--rust)', color: 'var(--primary-foreground)' }}
              >
                {loading ? 'Creating account…' : <> Create account <ArrowRight size={14} /> </>}
              </button>
            </form>

            <p className="mt-5 text-center text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
              Already have an account?{' '}
              <button onClick={() => go('signin')} className="hover:underline" style={{ color: 'var(--rust)' }}>
                Sign in →
              </button>
            </p>
          </>
        )}

        {/* ── Forgot password ─────────────────────────────────── */}
        {view === 'forgot' && (
          <>
            <p className="text-[11px] uppercase tracking-display" style={{ color: 'var(--muted-foreground)' }}>
              Reset password
            </p>
            <h2 className="mt-2 font-serif text-2xl" style={{ color: 'var(--ink)' }}>Forgot password?</h2>
            <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
              Enter your email and we'll send a reset link.
            </p>

            <form onSubmit={handleReset} className="mt-6 space-y-4">
              <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />

              {error && <p className="text-xs" style={{ color: 'oklch(0.55 0.2 27)' }}>{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-medium transition-transform hover:scale-[1.01] disabled:opacity-50"
                style={{ background: 'var(--ink)', color: 'var(--primary-foreground)' }}
              >
                {loading ? 'Sending…' : <> Send reset link <ArrowRight size={14} /> </>}
              </button>
            </form>

            <p className="mt-5 text-center text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
              <button onClick={() => go('signin')} className="hover:underline" style={{ color: 'var(--rust)' }}>
                ← Back to sign in
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────

function Field({ label, type, value, onChange, placeholder }: {
  label: string; type: string; value: string
  onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--muted-foreground)' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={type === 'email' ? 'email' : 'current-password'}
        className="w-full rounded-xl border bg-transparent px-4 py-3 text-sm focus:outline-none"
        style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
      />
    </div>
  )
}

function PasswordField({ label, value, onChange, show, onToggle, hint }: {
  label: string; value: string; onChange: (v: string) => void
  show: boolean; onToggle: () => void; hint?: string
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--muted-foreground)' }}>
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          className="w-full rounded-xl border bg-transparent py-3 pl-4 pr-11 text-sm focus:outline-none"
          style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--muted-foreground)' }}
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
      {hint && <p className="mt-1 text-[10px]" style={{ color: 'var(--muted-foreground)' }}>{hint}</p>}
    </div>
  )
}
