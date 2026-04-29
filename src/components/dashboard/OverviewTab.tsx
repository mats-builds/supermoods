'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format, parseISO } from 'date-fns'

interface Stats {
  moodboardsCreated: number
  totalLeads: number
  highIntentSessions: number
  potentialRevenue: number
  chartData: Array<{ date: string; inStore: number; atHome: number }>
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="border border-[#E8E4DF] p-6">
      <p className="text-xs tracking-widest uppercase text-[#8A8680] mb-3">{label}</p>
      <p className="text-3xl font-light tracking-tight">{value}</p>
      {sub && <p className="text-xs text-[#8A8680] mt-1">{sub}</p>}
    </div>
  )
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
    return <p className="text-sm text-[#8A8680]">Loading…</p>
  }

  if (!stats) {
    return <p className="text-sm text-red-500">Failed to load stats.</p>
  }

  const chartData = stats.chartData.map(d => ({
    ...d,
    dateLabel: format(parseISO(d.date), 'MMM d'),
  }))

  return (
    <div className="flex flex-col gap-10">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Moodboards created"
          value={stats.moodboardsCreated}
          sub="All time"
        />
        <StatCard
          label="Email leads"
          value={stats.totalLeads}
          sub="Captured in-store"
        />
        <StatCard
          label="High-intent sessions"
          value={stats.highIntentSessions}
          sub="Board value > €5,000"
        />
        <StatCard
          label="Potential revenue"
          value={`€${stats.potentialRevenue.toLocaleString()}`}
          sub="Combined board values"
        />
      </div>

      {/* Chart */}
      <div className="border border-[#E8E4DF] p-6">
        <p className="text-xs tracking-widest uppercase text-[#8A8680] mb-6">
          Activity — last 30 days
        </p>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData} margin={{ left: -10, right: 10 }}>
            <XAxis
              dataKey="dateLabel"
              tick={{ fontSize: 10, fill: '#8A8680' }}
              tickLine={false}
              axisLine={{ stroke: '#E8E4DF' }}
              interval={6}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#8A8680' }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: '#FAFAF8',
                border: '1px solid #E8E4DF',
                borderRadius: 0,
                fontSize: 11,
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}
            />
            <Line
              type="monotone"
              dataKey="inStore"
              name="In-store"
              stroke="#1A1916"
              strokeWidth={1.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="atHome"
              name="At home"
              stroke="#8A8680"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="4 2"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
