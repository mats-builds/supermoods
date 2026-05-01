import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ── Atelier (owner) route protection ────────────────────────────
  // The login page (/atelier) is always accessible; everything under
  // /atelier/dashboard and all /api/atelier/* calls require the cookie.
  if (pathname.startsWith('/atelier/dashboard')) {
    if (req.cookies.get('atelier_auth')?.value !== 'true') {
      return NextResponse.redirect(new URL('/atelier', req.url))
    }
  }

  if (pathname.startsWith('/api/atelier/') && !pathname.endsWith('/api/atelier/auth')) {
    if (req.cookies.get('atelier_auth')?.value !== 'true') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  // ── Customer guardrails ──────────────────────────────────────────
  // A visitor with a customer_session cookie is a customer at home.
  // They should not be able to reach owner-only or in-store-only pages.
  const customerToken = req.cookies.get('customer_session')?.value
  if (customerToken) {
    const blocked = ['/atelier', '/present', '/kiosk', '/canvas', '/account']
    if (blocked.some(p => pathname === p || pathname.startsWith(p + '/'))) {
      // Redirect them to their board
      const dest = new URL(`/board/${customerToken}`, req.url)
      return NextResponse.redirect(dest)
    }
  }

  return NextResponse.next()
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
