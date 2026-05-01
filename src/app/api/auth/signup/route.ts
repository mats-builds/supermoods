import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { email, password, name, store_name, website_url } = await req.json()

  if (!email || !password || !name || !store_name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = await createClient()

  // Sign up — Supabase sends confirmation email
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${req.nextUrl.origin}/api/auth/callback`,
      // Pass profile data as metadata so the DB trigger can create the store_profile
      data: { name, store_name, website_url: website_url || null },
    },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const userId = data.user?.id
  if (!userId) return NextResponse.json({ error: 'User creation failed' }, { status: 500 })

  // Insert store_profile — works because the user is now signed in (session returned by signUp)
  const { error: profileError } = await supabase
    .from('store_profiles')
    .insert({ id: userId, name, store_name, website_url: website_url || null })

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
