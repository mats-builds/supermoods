'use client'

import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { catalog } from '@/lib/catalog'

interface Lead {
  id: string
  name: string
  email: string
  created_at: string
  total_value: number
  high_intent: boolean
  magic_link_token: string
  session_id: string
  board_id: string
}

interface BoardDetail {
  board: any
  items: any[]
}

interface Props {
  lead: Lead
  onClose: () => void
}

export default function LeadPanel({ lead, onClose }: Props) {
  const [detail, setDetail] = useState<BoardDetail | null>(null)

  useEffect(() => {
    if (lead.magic_link_token) {
      fetch(`/api/board/${lead.magic_link_token}`)
        .then(r => r.json())
        .then(setDetail)
        .catch(() => {})
    }
  }, [lead.magic_link_token])

  const boardItems = detail?.board?.canvas_state?.items ?? []
  const enrichedItems = boardItems
    .map((ci: any) => ({ ...ci, product: catalog.find(p => p.id === ci.product_id) }))
    .filter((ci: any) => ci.product)

  return (
    <div className="w-80 flex-shrink-0 border self-start sticky top-24 rounded-2xl overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <span className="text-[11px] uppercase tracking-display" style={{ color: 'var(--muted-foreground)' }}>Details</span>
        <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-[var(--secondary)]" style={{ color: 'var(--muted-foreground)' }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div className="p-5 flex flex-col gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-serif text-lg" style={{ color: 'var(--ink)' }}>{lead.name}</h3>
            {lead.high_intent && (
              <span className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.18em]" style={{ background: 'var(--ink)', color: 'var(--primary-foreground)' }}>
                High intent
              </span>
            )}
          </div>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{lead.email}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            {format(parseISO(lead.created_at), "d MMM yyyy 'at' HH:mm")}
          </p>
        </div>

        <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)' }}>
          <p className="text-[11px] uppercase tracking-display mb-1" style={{ color: 'var(--muted-foreground)' }}>Total board value</p>
          <p className="font-serif text-2xl" style={{ color: 'var(--ink)' }}>€{(lead.total_value || 0).toLocaleString()}</p>
        </div>

        {enrichedItems.length > 0 && (
          <div>
            <p className="text-[11px] uppercase tracking-display mb-3" style={{ color: 'var(--muted-foreground)' }}>
              {enrichedItems.length} {enrichedItems.length === 1 ? 'piece' : 'pieces'} on board
            </p>
            <div className="flex flex-col gap-2">
              {enrichedItems.map((ci: any) => (
                <div key={ci.id} className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-md flex-shrink-0" style={{ background: 'var(--secondary)' }}>
                    <img src={ci.product.src} alt={ci.product.name} className="h-full w-full object-contain p-1" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: 'var(--ink)' }}>{ci.product.name}</p>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{ci.product.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-[11px] uppercase tracking-display mb-3" style={{ color: 'var(--muted-foreground)' }}>Timeline</p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 text-xs">
              <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--ink)' }} />
              <span style={{ color: 'var(--muted-foreground)' }}>{format(parseISO(lead.created_at), "d MMM 'at' HH:mm")}</span>
              <span style={{ color: 'var(--ink)' }}>Lead captured</span>
            </div>
            {lead.magic_link_token && (
              <div className="flex items-center gap-3 text-xs">
                <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--muted-foreground)' }} />
                <span style={{ color: 'var(--muted-foreground)' }}>{format(parseISO(lead.created_at), "d MMM 'at' HH:mm")}</span>
                <span style={{ color: 'var(--ink)' }}>Magic link sent</span>
              </div>
            )}
          </div>
        </div>

        {lead.magic_link_token && (
          <a
            href={`/board/${lead.magic_link_token}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] uppercase tracking-display text-center py-3 rounded-full border transition-colors hover:bg-[var(--secondary)]"
            style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
          >
            View their board →
          </a>
        )}
      </div>
    </div>
  )
}
