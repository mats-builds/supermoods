import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

function authed(req: NextRequest) {
  // Check cookie from the request headers
  const cookie = req.cookies.get('atelier_auth')
  return cookie?.value === 'true'
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  if (!authed(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [leadsRes, boardsRes, eventsRes] = await Promise.all([
      supabase.from('leads').select('id, created_at'),
      supabase.from('boards').select('id, total_value, created_at'),
      supabase.from('events').select('id, event_type, created_at, metadata'),
    ])

    const leads = leadsRes.data ?? []
    const boards = boardsRes.data ?? []

    const totalRevenuePotential = boards.reduce((s: number, b: any) => s + (b.total_value || 0), 0)

    // High intent: boards with total_value > 5000
    const highIntent = boards.filter((b: any) => b.total_value > 5000).length

    // Last 30 days chart data
    const now = new Date()
    const chartData = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now)
      d.setDate(d.getDate() - (29 - i))
      const dateStr = d.toISOString().split('T')[0]
      const inStore = boards.filter((b: any) => b.created_at?.startsWith(dateStr)).length
      const atHome = leads.filter((l: any) => l.created_at?.startsWith(dateStr)).length
      return { date: dateStr, inStore, atHome }
    })

    return NextResponse.json({
      moodboardsCreated: boards.length,
      totalLeads: leads.length,
      highIntentSessions: highIntent,
      potentialRevenue: totalRevenuePotential,
      chartData,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
