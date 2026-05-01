'use client'

import { useEffect, useState } from 'react'
import { Clock, Save, Check } from 'lucide-react'

export default function SettingsTab() {
  const [days, setDays] = useState<number>(14)
  const [original, setOriginal] = useState<number>(14)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/atelier/settings')
      .then(r => r.json())
      .then(d => {
        setDays(d.link_duration_days)
        setOriginal(d.link_duration_days)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    const res = await fetch('/api/atelier/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ link_duration_days: days }),
    })
    setSaving(false)
    if (res.ok) {
      setOriginal(days)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
  }

  const dirty = days !== original

  return (
    <div className="space-y-8 max-w-xl">
      <header>
        <p className="text-[10px] uppercase tracking-[0.32em]" style={{ color: 'var(--muted-foreground)' }}>Configuration</p>
        <h1 className="font-serif text-5xl mt-3" style={{ color: 'var(--ink)' }}>Settings</h1>
      </header>

      <div className="rounded-3xl p-6" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-soft-val)' }}>
        <div className="flex items-start gap-4">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            style={{ background: 'var(--secondary)' }}
          >
            <Clock size={18} style={{ color: 'var(--rust)' }} />
          </div>
          <div className="flex-1">
            <p className="font-medium" style={{ color: 'var(--ink)' }}>Customer link duration</p>
            <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
              How long a customer's moodboard link stays active after the visit. After this period the link expires and they can no longer access or edit their board.
            </p>

            <div className="mt-5 flex items-center gap-4">
              {loading ? (
                <div className="h-10 w-32 animate-pulse rounded-full" style={{ background: 'var(--secondary)' }} />
              ) : (
                <>
                  <div className="flex items-center gap-2 rounded-full border px-4 py-2" style={{ borderColor: 'var(--border)', background: 'var(--background)' }}>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={days}
                      onChange={e => setDays(Math.max(1, Math.min(365, parseInt(e.target.value) || 1)))}
                      className="w-14 bg-transparent text-center text-sm font-medium focus:outline-none tabular-nums"
                      style={{ color: 'var(--ink)' }}
                    />
                    <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>days</span>
                  </div>

                  {/* Presets */}
                  <div className="flex gap-2">
                    {[7, 14, 30].map(d => (
                      <button
                        key={d}
                        onClick={() => setDays(d)}
                        className="rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] transition-colors"
                        style={days === d
                          ? { background: 'var(--ink)', color: 'var(--primary-foreground)' }
                          : { border: '1px solid var(--border)', color: 'var(--muted-foreground)' }
                        }
                      >
                        {d}d
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <p className="mt-3 text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
              This applies to <strong>new</strong> sessions. Existing customer links keep their original expiry.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium transition-all disabled:opacity-40"
          style={{ background: 'var(--ink)', color: 'var(--primary-foreground)' }}
        >
          {saved ? <><Check size={14} /> Saved</> : <><Save size={14} /> {saving ? 'Saving…' : 'Save changes'}</>}
        </button>
        {dirty && !saving && (
          <button
            onClick={() => setDays(original)}
            className="text-sm"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}
