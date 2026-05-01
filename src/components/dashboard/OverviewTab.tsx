'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { format, parseISO } from 'date-fns'
import { TrendingUp, Users, Sparkles, Euro } from 'lucide-react'

interface Stats {
  moodboardsCreated: number
  totalLeads: number
  highIntentSessions: number
  potentialRevenue: number
  chartData: Array<{ date: string; inStore: number; atHome: number }>
}

export default function OverviewTab() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/atelier/stats')
      .then(r => r.json())
      .then(setStats)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-8">
        <Header />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-3xl" style={{ background: 'var(--secondary)' }} />
          ))}
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="space-y-8">
        <Header />
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Could not load analytics.</p>
      </div>
    )
  }

  const conversionRate = stats.moodboardsCreated > 0
    ? Math.round((stats.totalLeads / stats.moodboardsCreated) * 100)
    : 0

  const chartData = stats.chartData.map(d => ({
    ...d,
    label: format(parseISO(d.date), 'MMM d'),
  }))

  return (
    <div className="space-y-8">
      <Header />

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          icon={<Sparkles size={16} style={{ color: 'var(--rust)' }} />}
          label="Boards created"
          value={stats.moodboardsCreated}
          sub="All time, in store"
        />
        <KpiCard
          icon={<Users size={16} style={{ color: 'var(--rust)' }} />}
          label="Customers sent link"
          value={stats.totalLeads}
          sub={`${conversionRate}% of board sessions`}
        />
        <KpiCard
          icon={<TrendingUp size={16} style={{ color: 'var(--rust)' }} />}
          label="High-value boards"
          value={stats.highIntentSessions}
          sub="Board value above €5,000"
        />
        <KpiCard
          icon={<Euro size={16} style={{ color: 'var(--rust)' }} />}
          label="Pipeline value"
          value={`€${stats.potentialRevenue.toLocaleString('en-GB')}`}
          sub="Combined customer boards"
        />
      </div>

      {/* Activity chart */}
      <div className="rounded-3xl p-6 md:p-8" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-soft-val)' }}>
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-display" style={{ color: 'var(--muted-foreground)' }}>
              Activity — last 30 days
            </p>
            <h2 className="mt-1 font-serif text-2xl" style={{ color: 'var(--ink)' }}>In-store vs. at home</h2>
          </div>
          <div className="flex items-center gap-5 text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--muted-foreground)' }}>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-5" style={{ background: 'var(--ink)' }} />
              In store
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-5" style={{ background: 'var(--muted-foreground)', borderTop: '2px dashed var(--muted-foreground)' }} />
              At home
            </span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ left: -10, right: 10 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' } as any}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' } as any}
              interval={6}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' } as any}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                fontSize: 11,
                boxShadow: 'var(--shadow-soft-val)',
              }}
              labelStyle={{ color: 'var(--ink)', fontWeight: 500 }}
            />
            <Line
              type="monotone"
              dataKey="inStore"
              name="In store"
              stroke="oklch(0.22 0.02 50)"
              strokeWidth={1.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="atHome"
              name="At home"
              stroke="oklch(0.6 0.01 60)"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="4 3"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Guidance note */}
      <div
        className="rounded-3xl px-6 py-5 text-sm leading-relaxed"
        style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}
      >
        <strong style={{ color: 'var(--ink)' }}>How to read this: </strong>
        <em>In store</em> counts boards created during kiosk sessions. <em>At home</em> counts customers who sent the board to themselves. High-value boards are those exceeding €5,000 — these are your highest-priority follow-ups.
      </div>
    </div>
  )
}

function Header() {
  return (
    <header>
      <p className="text-[10px] uppercase tracking-[0.32em]" style={{ color: 'var(--muted-foreground)' }}>Dashboard</p>
      <h1 className="font-serif text-5xl mt-2" style={{ color: 'var(--ink)' }}>Overview</h1>
      <p className="mt-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
        Track how customers use your moodboard tool — from the first board in store to the link they open at home.
      </p>
    </header>
  )
}

function KpiCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub: string
}) {
  return (
    <div
      className="flex flex-col gap-3 rounded-3xl p-5"
      style={{ background: 'var(--card)', boxShadow: 'var(--shadow-soft-val)' }}
    >
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
      </div>
      <p className="font-serif text-4xl leading-none" style={{ color: 'var(--ink)' }}>{value}</p>
      <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>{sub}</p>
    </div>
  )
}
