'use client'

import { useState } from 'react'

export default function AtelierLoginClient() {
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/atelier/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passphrase: pass }),
      })
      if (res.ok) window.location.href = '/atelier/dashboard'
      else setError('Incorrect passphrase.')
    } catch {
      setError('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <p className="text-[10px] uppercase tracking-[0.32em]" style={{ color: 'var(--muted-foreground)' }}>Supermoods</p>
          <h1 className="font-serif text-5xl mt-3" style={{ color: 'var(--ink)' }}>Atelier</h1>
          <p className="mt-3 text-sm" style={{ color: 'var(--muted-foreground)' }}>Private owner dashboard · enter passphrase to continue</p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border p-8"
          style={{ background: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-soft-val)' }}
        >
          <label className="block text-[10px] uppercase tracking-[0.24em]" style={{ color: 'var(--muted-foreground)' }}>Passphrase</label>
          <input
            type="password"
            autoFocus
            value={pass}
            onChange={e => { setPass(e.target.value); setError('') }}
            className="mt-2 w-full rounded-xl border bg-transparent px-4 py-3 text-base focus:outline-none transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
          />
          {error && <p className="mt-2 text-xs" style={{ color: 'oklch(0.55 0.2 27)' }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-full py-3 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: 'var(--ink)', color: 'var(--primary-foreground)' }}
          >
            {loading ? 'Entering…' : 'Enter atelier →'}
          </button>
        </form>
      </div>
    </div>
  )
}
