import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  let res = NextResponse.next()

  // Build a Supabase SSR client that can refresh the session cookie
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          res = NextResponse.next({ request: req })
          cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
        },
      },
    }
  )

  // Refresh session (keeps token alive between requests)
  const { data: { user } } = await supabase.auth.getUser()

  // ── Owner route protection ───────────────────────────────────────
  const ownerRoutes =
    pathname.startsWith('/atelier/dashboard') ||
    (pathname.startsWith('/api/atelier/') && pathname !== '/api/atelier/auth')

  if (ownerRoutes && !user) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/atelier', req.url))
  }

  // ── Customer guardrails ──────────────────────────────────────────
  const customerToken = req.cookies.get('customer_session')?.value
  if (customerToken) {
    const blocked = ['/atelier', '/present', '/kiosk', '/canvas', '/account']
    if (blocked.some(p => pathname === p || pathname.startsWith(p + '/'))) {
      return NextResponse.redirect(new URL(`/board/${customerToken}`, req.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    '/atelier/:path*',
    '/api/atelier/:path*',
    '/present',
    '/kiosk',
    '/canvas',
    '/account',
  ],
}
