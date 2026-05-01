import { NextResponse } from 'next/server'
import { requireOwner, isUnauthorized } from '@/lib/supabase/auth-helpers'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const ctx = await requireOwner()
  if (isUnauthorized(ctx)) return ctx

  const service = createServiceClient()

  const [leadsRes, boardsRes] = await Promise.all([
    service.from('leads').select('id, created_at').eq('store_id', ctx.storeId),
    service.from('boards').select('id, total_value, created_at').eq('store_id', ctx.storeId),
  ])

  const leads = leadsRes.data ?? []
  const boards = boardsRes.data ?? []

  const totalRevenuePotential = boards.reduce((s: number, b: any) => s + (b.total_value || 0), 0)
  const highIntent = boards.filter((b: any) => b.total_value > 5000).length

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
}
