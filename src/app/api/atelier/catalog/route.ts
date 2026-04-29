import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function authed(req: NextRequest) {
  return req.cookies.get('atelier_auth')?.value === 'true'
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(req: NextRequest) {
  if (!authed(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, visible } = await req.json()
  const { error } = await supabase
    .from('products')
    .update({ visible })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
