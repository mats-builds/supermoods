import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const DEFAULTS = { link_duration_days: 14 }

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('store_settings')
    .select('key, value')
    .eq('store_id', user.id)

  const settings = { ...DEFAULTS }
  for (const row of data ?? []) {
    if (row.key === 'link_duration_days') {
      settings.link_duration_days = parseInt(row.value, 10) || DEFAULTS.link_duration_days
    }
  }
  return NextResponse.json(settings)
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { link_duration_days } = await req.json()
  if (typeof link_duration_days !== 'number' || link_duration_days < 1 || link_duration_days > 365) {
    return NextResponse.json({ error: 'link_duration_days must be 1–365' }, { status: 400 })
  }

  const { error } = await supabase
    .from('store_settings')
    .upsert({
      store_id: user.id,
      key: 'link_duration_days',
      value: String(link_duration_days),
      updated_at: new Date().toISOString(),
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, link_duration_days })
}
