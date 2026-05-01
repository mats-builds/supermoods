import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Sign out via Supabase (called by legacy logout path; new code uses useAuth().signOut())
export async function DELETE() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.json({ success: true })
}
