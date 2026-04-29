import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function authed(req: NextRequest) {
  return req.cookies.get('atelier_auth')?.value === 'true'
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
    const { data: leads, error } = await supabase
      .from('leads')
      .select(`
        id, name, email, created_at,
        sessions!inner(id, magic_link_token),
        boards:sessions(boards(id, total_value, backdrop, palette, canvas_state))
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Flatten and enrich
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
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
