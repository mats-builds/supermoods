import { NextRequest, NextResponse } from 'next/server'
import { requireOwner, isUnauthorized } from '@/lib/supabase/auth-helpers'
import { createServiceClient } from '@/lib/supabase/server'

const DEFAULTS = { link_duration_days: 14 }

export async function GET() {
  const ctx = await requireOwner()
  if (isUnauthorized(ctx)) return ctx

  const service = createServiceClient()
  const { data } = await service
    .from('store_settings')
    .select('key, value')
    .eq('store_id', ctx.storeId)

  const settings = { ...DEFAULTS }
  for (const row of data ?? []) {
    if (row.key === 'link_duration_days') {
      settings.link_duration_days = parseInt(row.value, 10) || DEFAULTS.link_duration_days
    }
  }
  return NextResponse.json(settings)
}

export async function PATCH(req: NextRequest) {
  const ctx = await requireOwner()
  if (isUnauthorized(ctx)) return ctx

  const { link_duration_days } = await req.json()
  if (typeof link_duration_days !== 'number' || link_duration_days < 1 || link_duration_days > 365) {
    return NextResponse.json({ error: 'link_duration_days must be 1–365' }, { status: 400 })
  }

  const service = createServiceClient()
  const { error } = await service
    .from('store_settings')
    .upsert({
      store_id: ctx.storeId,
      key: 'link_duration_days',
      value: String(link_duration_days),
      updated_at: new Date().toISOString(),
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, link_duration_days })
}
