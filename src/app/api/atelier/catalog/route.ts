import { NextRequest, NextResponse } from 'next/server'
import { requireOwner, isUnauthorized } from '@/lib/supabase/auth-helpers'
import { createServiceClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest) {
  const ctx = await requireOwner()
  if (isUnauthorized(ctx)) return ctx

  const { id, visible } = await req.json()
  const service = createServiceClient()

  // Only allow toggling products that belong to this store
  const { error } = await service
    .from('store_products')
    .update({ visible })
    .eq('id', id)
    .eq('store_id', ctx.storeId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
