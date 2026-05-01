import { NextRequest, NextResponse } from 'next/server'
import { requireOwner, isUnauthorized } from '@/lib/supabase/auth-helpers'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const ctx = await requireOwner()
  if (isUnauthorized(ctx)) return ctx

  const service = createServiceClient()
  const { data, error } = await service
    .from('store_products')
    .select('*')
    .eq('store_id', ctx.storeId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const ctx = await requireOwner()
  if (isUnauthorized(ctx)) return ctx

  const body = await req.json()
  const service = createServiceClient()

  const { data, error } = await service
    .from('store_products')
    .insert({ ...body, store_id: ctx.storeId })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const ctx = await requireOwner()
  if (isUnauthorized(ctx)) return ctx

  const { id, ...updates } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const service = createServiceClient()
  const { data, error } = await service
    .from('store_products')
    .update(updates)
    .eq('id', id)
    .eq('store_id', ctx.storeId) // ownership check
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const ctx = await requireOwner()
  if (isUnauthorized(ctx)) return ctx

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const service = createServiceClient()
  const { error } = await service
    .from('store_products')
    .delete()
    .eq('id', id)
    .eq('store_id', ctx.storeId) // ownership check

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
