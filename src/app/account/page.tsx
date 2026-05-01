'use client'

import Link from 'next/link'
import { Mail, ArrowLeft } from 'lucide-react'

// The /account route is for shop owners only.
// Customers access their boards via the magic link sent to their email.
export default function AccountPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6" style={{ background: 'var(--background)' }}>
      <div className="max-w-sm text-center">
        <div
          className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: 'var(--secondary)' }}
        >
          <Mail size={22} style={{ color: 'var(--rust)' }} />
        </div>
        <p className="text-[11px] uppercase tracking-display" style={{ color: 'var(--muted-foreground)' }}>
          Your moodboard
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight" style={{ color: 'var(--ink)' }}>
          Check your <em className="italic font-light" style={{ color: 'var(--rust)' }}>email.</em>
        </h1>
        <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
          Your personal board link was sent to you after your visit to the store. Open that email and click <strong>"Open my moodboard"</strong> to continue where you left off.
        </p>
        <p className="mt-3 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Can't find it? Check your spam folder, or ask the store team to resend your link.
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <ArrowLeft size={14} /> Back to catalog
          </Link>
        </div>
      </div>
    </main>
  )
}
