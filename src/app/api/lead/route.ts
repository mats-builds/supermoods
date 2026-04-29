import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, items, canvasState, backdrop, palette, totalValue } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email required' }, { status: 400 })
    }

    // Create session with magic link token
    const token = crypto.randomBytes(32).toString('hex')
    const { data: session, error: sessionErr } = await supabase
      .from('sessions')
      .insert({ magic_link_token: token, store_id: 'default' })
      .select()
      .single()

    if (sessionErr) throw sessionErr

    // Create board
    const { data: board, error: boardErr } = await supabase
      .from('boards')
      .insert({
        session_id: session.id,
        canvas_state: canvasState,
        backdrop,
        palette,
        total_value: totalValue,
      })
      .select()
      .single()

    if (boardErr) throw boardErr

    // Create board items
    if (items?.length > 0) {
      await supabase.from('board_items').insert(
        items.map((it: any) => ({
          board_id: board.id,
          product_id: it.product_id,
          scale: it.scale || 1,
          position_x: it.position_x || 0,
          position_y: it.position_y || 0,
        }))
      )
    }

    // Create lead
    const { error: leadErr } = await supabase
      .from('leads')
      .insert({ session_id: session.id, name, email })

    if (leadErr) throw leadErr

    // Log event
    await supabase.from('events').insert({
      session_id: session.id,
      event_type: 'lead_captured',
      metadata: { name, email, total_value: totalValue, item_count: items?.length },
    })

    // Send email
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const magicLink = `${siteUrl}/board/${token}`

    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 'your_resend_api_key') {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'Supermoods <noreply@supermoods.store>',
        to: email,
        subject: `${name}, your moodboard is ready`,
        html: buildEmailHtml(name, magicLink, totalValue, items?.length),
      })
    }

    return NextResponse.json({ success: true, token, magicLink })
  } catch (err: any) {
    console.error('Lead API error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

function buildEmailHtml(name: string, link: string, total: number, count: number): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAFAF8;font-family:'Helvetica Neue',Arial,sans-serif;color:#1A1916">
  <div style="max-width:560px;margin:60px auto;padding:0 24px">
    <p style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#8A8680;margin:0 0 40px">Supermoods</p>
    <h1 style="font-size:28px;font-weight:400;letter-spacing:-0.5px;margin:0 0 16px">Your moodboard is ready, ${name}.</h1>
    <p style="font-size:15px;color:#4A4742;line-height:1.7;margin:0 0 8px">
      You composed a board with ${count} ${count === 1 ? 'piece' : 'pieces'} — a total of <strong>€${total.toLocaleString()}</strong>.
    </p>
    <p style="font-size:15px;color:#4A4742;line-height:1.7;margin:0 0 40px">
      Your private link lets you revisit, refine, and share it from anywhere.
    </p>
    <a href="${link}" style="display:inline-block;background:#1A1916;color:#FAFAF8;text-decoration:none;padding:16px 40px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase">
      Open my moodboard →
    </a>
    <p style="font-size:11px;color:#8A8680;margin:48px 0 0;line-height:1.6">
      If you didn't create this moodboard, you can safely ignore this email.
    </p>
  </div>
</body>
</html>`
}
