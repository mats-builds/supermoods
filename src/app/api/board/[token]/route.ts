import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Verify the customer_session cookie matches the token in the URL
function verifyCustomerSession(req: NextRequest, token: string): boolean {
  return req.cookies.get('customer_session')?.value === token
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  try {
    const { data: session, error: sessionErr } = await supabase
      .from('sessions')
      .select('id, expires_at')
      .eq('magic_link_token', token)
      .single()

    if (sessionErr || !session) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    // Check expiry
    if (session.expires_at && new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ error: 'expired' }, { status: 410 })
    }

    const [boardRes, leadRes] = await Promise.all([
      supabase.from('boards').select('*').eq('session_id', session.id).single(),
      supabase.from('leads').select('name,email').eq('session_id', session.id).single(),
    ])

    if (boardRes.error) return NextResponse.json({ error: 'Board not found' }, { status: 404 })

    const { data: boardItems } = await supabase
      .from('board_items')
      .select('*')
      .eq('board_id', boardRes.data.id)

    return NextResponse.json({
      board: boardRes.data,
      lead: leadRes.data,
      items: boardItems ?? [],
      expiresAt: session.expires_at,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PATCH /api/board/[token] — customer saves changes to their board
// Requires matching customer_session cookie
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  if (!verifyCustomerSession(req, token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { canvas_state, backdrop, palette, total_value } = body

    // Look up session and board
    const { data: session, error: sessionErr } = await supabase
      .from('sessions')
      .select('id, expires_at')
      .eq('magic_link_token', token)
      .single()

    if (sessionErr || !session) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    if (session.expires_at && new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ error: 'expired' }, { status: 410 })
    }

    const { data: board, error: boardErr } = await supabase
      .from('boards')
      .select('id')
      .eq('session_id', session.id)
      .single()

    if (boardErr || !board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    // Update board
    const { error: updateErr } = await supabase
      .from('boards')
      .update({
        canvas_state,
        backdrop,
        palette,
        total_value,
        updated_at: new Date().toISOString(),
      })
      .eq('id', board.id)

    if (updateErr) throw updateErr

    // Log event
    await supabase.from('events').insert({
      session_id: session.id,
      event_type: 'board_updated',
      metadata: { total_value, item_count: canvas_state?.items?.length ?? 0 },
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
