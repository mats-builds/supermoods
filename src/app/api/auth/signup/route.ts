import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { email, password, name, store_name, website_url } = await req.json()

  if (!email || !password || !name || !store_name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = await createClient()

  // Create the Supabase Auth user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${req.nextUrl.origin}/api/auth/callback`,
    },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const userId = data.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'User creation failed' }, { status: 500 })
  }

  // Insert store profile using service role (bypasses RLS during signup)
  const service = createServiceClient()
  const { error: profileError } = await service
    .from('store_profiles')
    .insert({ id: userId, name, store_name, website_url: website_url || null })

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
