import { NextResponse } from 'next/server'
import { requireOwner, isUnauthorized } from '@/lib/supabase/auth-helpers'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const ctx = await requireOwner()
  if (isUnauthorized(ctx)) return ctx

  const service = createServiceClient()

  const { data: leads, error } = await service
    .from('leads')
    .select(`
      id, name, email, created_at,
      sessions!inner(id, magic_link_token),
      boards:sessions(boards(id, total_value, backdrop, palette, canvas_state))
    `)
    .eq('store_id', ctx.storeId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const enriched = (leads ?? []).map((lead: any) => {
    const board = lead.sessions?.boards?.[0] ?? null
    return {
      id: lead.id,
      name: lead.name,
      email: lead.email,
      created_at: lead.created_at,
      session_id: lead.sessions?.id,
      magic_link_token: lead.sessions?.magic_link_token,
      total_value: board?.total_value ?? 0,
      board_id: board?.id,
      high_intent: (board?.total_value ?? 0) > 5000,
    }
  })

  return NextResponse.json(enriched)
}
