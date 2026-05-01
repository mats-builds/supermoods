import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DEFAULTS = { link_duration_days: 14 }

export async function GET() {
  try {
    const { data } = await supabase
      .from('store_settings')
      .select('key, value')

    const settings = { ...DEFAULTS }
    for (const row of data ?? []) {
      if (row.key === 'link_duration_days') {
        settings.link_duration_days = parseInt(row.value, 10) || DEFAULTS.link_duration_days
      }
    }
    return NextResponse.json(settings)
  } catch {
    return NextResponse.json(DEFAULTS)
  }
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { link_duration_days } = body

  if (
    typeof link_duration_days !== 'number' ||
    link_duration_days < 1 ||
    link_duration_days > 365
  ) {
    return NextResponse.json({ error: 'link_duration_days must be 1–365' }, { status: 400 })
  }

  const { error } = await supabase
    .from('store_settings')
    .upsert({ key: 'link_duration_days', value: String(link_duration_days), updated_at: new Date().toISOString() })
    .eq('key', 'link_duration_days')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, link_duration_days })
}
