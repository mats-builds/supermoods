import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'

export type OwnerContext = {
  user: User
  storeId: string
}

/**
 * Validates the Supabase session from the request cookies.
 * Returns { user, storeId } on success, or a 401 NextResponse to return early.
 */
export async function requireOwner(): Promise<OwnerContext | NextResponse> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return { user, storeId: user.id }
}

/** Type guard — returns true when the result is an error response */
export function isUnauthorized(result: OwnerContext | NextResponse): result is NextResponse {
  return result instanceof NextResponse
}
