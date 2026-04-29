'use client'

import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import LeadPanel from './LeadPanel'

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

export default function LeadFeedTab() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  useEffect(() => {
    fetch('/api/atelier/leads')
      .then(r => r.json())
      .then(data => setLeads(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-sm text-[#8A8680]">Loading leads…</p>

  return (
    <div className="relative flex gap-6">
      {/* Lead list */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs tracking-widest uppercase text-[#8A8680]">
            {leads.length} {leads.length === 1 ? 'lead' : 'leads'}
          </p>
        </div>

        {leads.length === 0 ? (
          <div className="border border-[#E8E4DF] p-12 text-center">
            <p className="text-sm text-[#8A8680]">No leads yet.</p>
            <p className="text-xs text-[#C8C0B8] mt-1">Leads appear here after customers send themselves a moodboard.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E8E4DF] border border-[#E8E4DF]">
            {leads.map(lead => (
              <button
                key={lead.id}
                onClick={() => setSelectedLead(lead.id === selectedLead?.id ? null : lead)}
                className={`w-full text-left flex items-center justify-between px-6 py-4 transition-colors ${
                  selectedLead?.id === lead.id ? 'bg-[#F0EDE8]' : 'hover:bg-[#F5F3F0]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-[#1A1916] flex items-center justify-center text-[#FAFAF8] text-xs font-medium flex-shrink-0">
                    {lead.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{lead.name}</span>
                      {lead.high_intent && (
                        <span className="px-2 py-0.5 bg-[#1A1916] text-[#FAFAF8] text-[10px] tracking-widest uppercase">
                          High intent
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[#8A8680]">{lead.email}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-medium">€{(lead.total_value || 0).toLocaleString()}</p>
                  <p className="text-xs text-[#8A8680]">
                    {format(parseISO(lead.created_at), 'd MMM yyyy')}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Slide-out panel */}
      {selectedLead && (
        <LeadPanel lead={selectedLead} onClose={() => setSelectedLead(null)} />
      )}
    </div>
  )
}
