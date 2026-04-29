import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  try {
    const { data: session, error: sessionErr } = await supabase
      .from('sessions')
      .select('id')
      .eq('magic_link_token', token)
      .single()

    if (sessionErr || !session) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
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
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
