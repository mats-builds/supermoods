import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/session
// Validates a magic-link token and sets the customer_session cookie.
// Called on first visit to /board/[token] before the workspace loads.
export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()
    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

    // Look up session
    const { data: session, error } = await supabase
      .from('sessions')
      .select('id, store_id, expires_at')
      .eq('magic_link_token', token)
      .single()

    if (error || !session) {
      return NextResponse.json({ error: 'Invalid link' }, { status: 404 })
    }

    // Check expiry
    if (session.expires_at && new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ error: 'expired' }, { status: 410 })
    }

    // Record last access
    await supabase
      .from('sessions')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', session.id)

    // Calculate cookie maxAge: until expires_at, or 90 days fallback
    let maxAge = 60 * 60 * 24 * 90
    if (session.expires_at) {
      const ms = new Date(session.expires_at).getTime() - Date.now()
      maxAge = Math.max(0, Math.floor(ms / 1000))
    }

    // Set customer_session cookie — value is the token itself
    const cookieStore = await cookies()
    cookieStore.set('customer_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge,
      sameSite: 'lax',
      path: '/',
    })

    return NextResponse.json({ valid: true, storeId: session.store_id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE /api/session — clear the customer session cookie
export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete('customer_session')
  return NextResponse.json({ success: true })
}
