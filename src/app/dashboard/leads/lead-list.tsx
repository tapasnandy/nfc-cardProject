'use client'

import React, { useState, useTransition } from 'react'
import { updateLeadStatus, deleteLead } from '@/app/actions/lead'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  PhoneCallIcon,
  MessageCircleIcon,
  MailIcon,
  BuildingIcon,
  CalendarIcon,
  SearchIcon,
  DownloadIcon,
  Trash2Icon,
  CreditCardIcon,
  UserCheck2Icon,
  FilterIcon,
  Loader2Icon,
} from 'lucide-react'
import { toast } from 'sonner'

export interface LeadItem {
  id: string
  name: string
  phone?: string | null
  email?: string | null
  company?: string | null
  notes?: string | null
  source: 'visitor' | 'salesperson'
  status: 'new' | 'contacted' | 'qualified' | 'closed' | 'lost'
  created_at: string
  card_id?: string | null
  profile_id?: string | null
  cards?: { id: string; short_code: string } | null
  profiles?: { id: string; name: string; profile_photo?: string | null; job_title?: string | null } | null
}

interface LeadListProps {
  initialLeads: LeadItem[]
  cards: { id: string; short_code: string }[]
  profiles: { id: string; name: string }[]
}

const statusBadgeVariants: Record<string, { label: string; className: string }> = {
  new: { label: 'New Lead', className: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200' },
  contacted: { label: 'Contacted', className: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200' },
  qualified: { label: 'Qualified', className: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200' },
  closed: { label: 'Closed / Won', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200' },
  lost: { label: 'Lost', className: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200' },
}

export function LeadList({ initialLeads, cards, profiles }: LeadListProps) {
  const [leads, setLeads] = useState<LeadItem[]>(initialLeads)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [cardFilter, setCardFilter] = useState<string>('all')
  const [isPending, startTransition] = useTransition()
  const [actionLeadId, setActionLeadId] = useState<string | null>(null)

  // Filtered leads calculation
  const filteredLeads = leads.filter((lead) => {
    // Status filter
    if (statusFilter !== 'all' && lead.status !== statusFilter) {
      return false
    }

    // Card/Salesperson filter
    if (cardFilter !== 'all' && lead.card_id !== cardFilter && lead.profile_id !== cardFilter) {
      return false
    }

    // Search query filter (name, company, phone, email, notes)
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      const matchName = lead.name?.toLowerCase().includes(q)
      const matchCompany = lead.company?.toLowerCase().includes(q)
      const matchPhone = lead.phone?.toLowerCase().includes(q)
      const matchEmail = lead.email?.toLowerCase().includes(q)
      const matchNotes = lead.notes?.toLowerCase().includes(q)
      const matchSalesperson = lead.profiles?.name?.toLowerCase().includes(q)
      const matchCard = lead.cards?.short_code?.toLowerCase().includes(q)
      if (!matchName && !matchCompany && !matchPhone && !matchEmail && !matchNotes && !matchSalesperson && !matchCard) {
        return false
      }
    }

    return true
  })

  // Handle status change
  const handleStatusChange = (leadId: string, newStatus: LeadItem['status']) => {
    setActionLeadId(leadId)
    startTransition(async () => {
      try {
        const res = await updateLeadStatus(leadId, newStatus)
        if (!res.success) {
          toast.error(res.error || 'Failed to update status')
        } else {
          setLeads((prev) =>
            prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
          )
          toast.success(`Status updated to ${statusBadgeVariants[newStatus]?.label || newStatus}`)
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to update status'
        toast.error(errorMsg)
      } finally {
        setActionLeadId(null)
      }
    })
  }

  // Handle delete lead
  const handleDelete = (leadId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the enquiry from "${name}"?`)) {
      return
    }

    setActionLeadId(leadId)
    startTransition(async () => {
      try {
        const res = await deleteLead(leadId)
        if (!res.success) {
          toast.error(res.error || 'Failed to delete lead')
        } else {
          setLeads((prev) => prev.filter((l) => l.id !== leadId))
          toast.success('Lead enquiry removed')
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to delete lead'
        toast.error(errorMsg)
      } finally {
        setActionLeadId(null)
      }
    })
  }

  // CSV Export for CRM/Excel
  const exportToCsv = () => {
    if (filteredLeads.length === 0) {
      toast.info('No leads to export.')
      return
    }

    const headers = [
      'ID',
      'Name',
      'Company',
      'Phone',
      'Email',
      'Status',
      'Source',
      'Assigned Salesperson',
      'Card Unique ID',
      'Notes',
      'Created At',
    ]

    const escapeCsv = (val: string | null | undefined) => {
      if (!val) return '""'
      const str = String(val).replace(/"/g, '""')
      return `"${str}"`
    }

    const rows = filteredLeads.map((l) => [
      escapeCsv(l.id),
      escapeCsv(l.name),
      escapeCsv(l.company),
      escapeCsv(l.phone),
      escapeCsv(l.email),
      escapeCsv(l.status),
      escapeCsv(l.source),
      escapeCsv(l.profiles?.name || 'Unassigned'),
      escapeCsv(l.cards?.short_code || 'N/A'),
      escapeCsv(l.notes),
      escapeCsv(new Date(l.created_at).toLocaleString()),
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `leads_export_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Exported ${filteredLeads.length} leads to CSV`)
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="bg-card border rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, company, phone, email, notes, or card..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 rounded-xl"
            />
          </div>

          {/* Action: Export to CSV */}
          <Button
            variant="outline"
            onClick={exportToCsv}
            disabled={filteredLeads.length === 0}
            className="flex items-center gap-2 h-10 rounded-xl shrink-0 cursor-pointer"
          >
            <DownloadIcon className="w-4 h-4" />
            <span>Export CSV</span>
          </Button>
        </div>

        {/* Filter controls row */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-1">
            <FilterIcon className="w-3.5 h-3.5" />
            <span>Filter by:</span>
          </div>

          {/* Status Pills */}
          <div className="flex flex-wrap items-center gap-1">
            {['all', 'new', 'contacted', 'qualified', 'closed', 'lost'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  statusFilter === status
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {status === 'all'
                  ? 'All Statuses'
                  : statusBadgeVariants[status]?.label || status}
              </button>
            ))}
          </div>

          {/* Card / Salesperson filter dropdown */}
          {(cards.length > 0 || profiles.length > 0) && (
            <div className="ml-auto flex items-center gap-2">
              <select
                aria-label="Filter by Card or Salesperson"
                value={cardFilter}
                onChange={(e) => setCardFilter(e.target.value)}
                className="text-xs bg-muted/60 border rounded-lg px-2.5 py-1.5 font-medium text-foreground focus:outline-hidden"
              >
                <option value="all">All Cards &amp; Sales Reps</option>
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>
                    Card: {c.short_code}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Leads Count Summary */}
      <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
        <span>
          Showing {filteredLeads.length} of {leads.length} recorded leads
        </span>
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="text-blue-600 hover:underline cursor-pointer"
          >
            Clear search
          </button>
        )}
      </div>

      {/* Leads List / Cards */}
      {filteredLeads.length === 0 ? (
        <div className="bg-card border rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <UserCheck2Icon className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-foreground">No leads found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {leads.length === 0
                ? 'When clients or salespeople submit enquiries from NFC cards, they will appear here instantly.'
                : 'No leads match your selected filters. Try broadening your search or resetting the filter.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredLeads.map((lead) => {
            const badge = statusBadgeVariants[lead.status] || statusBadgeVariants.new
            const isRowBusy = isPending && actionLeadId === lead.id
            const cleanPhone = lead.phone ? lead.phone.replace(/[^0-9+]/g, '') : null
            const whatsappUrl = cleanPhone ? `https://wa.me/${cleanPhone.replace(/^\+/, '')}` : null
            const callUrl = cleanPhone ? `tel:${cleanPhone}` : null
            const mailUrl = lead.email ? `mailto:${lead.email}` : null

            return (
              <div
                key={lead.id}
                className="bg-card border rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all space-y-4"
              >
                {/* Top Row: Lead Identity + Status Dropdown */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-foreground">{lead.name}</h3>
                      <Badge variant="outline" className={`text-xs ${badge.className}`}>
                        {badge.label}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="text-[11px] font-normal text-muted-foreground"
                      >
                        {lead.source === 'salesperson' ? 'Sales Rep Entry' : 'Client Direct'}
                      </Badge>
                    </div>

                    {lead.company && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <BuildingIcon className="w-3.5 h-3.5" />
                        <span>{lead.company}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions: Status Dropdown & Delete */}
                  <div className="flex items-center gap-2">
                    <select
                      aria-label="Update lead status"
                      disabled={isRowBusy}
                      value={lead.status}
                      onChange={(e) =>
                        handleStatusChange(lead.id, e.target.value as LeadItem['status'])
                      }
                      className="text-xs bg-muted/70 hover:bg-muted border rounded-xl px-2.5 py-1.5 font-medium cursor-pointer focus:outline-hidden"
                    >
                      <option value="new">Mark as: New</option>
                      <option value="contacted">Mark as: Contacted</option>
                      <option value="qualified">Mark as: Qualified</option>
                      <option value="closed">Mark as: Closed / Won</option>
                      <option value="lost">Mark as: Lost</option>
                    </select>

                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isRowBusy}
                      onClick={() => handleDelete(lead.id, lead.name)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
                      title="Delete lead"
                    >
                      {isRowBusy ? (
                        <Loader2Icon className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2Icon className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Middle Row: 1-Tap Action Buttons (Call, WhatsApp, Email) */}
                <div className="flex flex-wrap items-center gap-2">
                  {callUrl && (
                    <a
                      href={callUrl}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900/60 transition-colors border border-blue-200/60"
                    >
                      <PhoneCallIcon className="w-3.5 h-3.5" />
                      <span>Call {lead.phone}</span>
                    </a>
                  )}

                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60 transition-colors border border-emerald-200/60"
                    >
                      <MessageCircleIcon className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  )}

                  {mailUrl && (
                    <a
                      href={mailUrl}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors border border-zinc-200/60"
                    >
                      <MailIcon className="w-3.5 h-3.5" />
                      <span>Email {lead.email}</span>
                    </a>
                  )}
                </div>

                {/* Notes / Discussion section */}
                {lead.notes && (
                  <div className="p-3 bg-muted/40 rounded-xl border border-muted/80 text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                    <span className="font-semibold text-foreground block mb-0.5">Discussion / Requirements:</span>
                    {lead.notes}
                  </div>
                )}

                {/* Footer: Attribution Info (Salesperson, Card ID, Timestamp) */}
                <div className="pt-2 border-t flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  {/* Attributed Sales Rep */}
                  <div className="flex items-center gap-2">
                    {lead.profiles ? (
                      <div className="flex items-center gap-1.5">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={lead.profiles.profile_photo || ''} />
                          <AvatarFallback className="text-[10px]">
                            {lead.profiles.name?.charAt(0) || 'S'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">
                          {lead.profiles.name}
                        </span>
                        {lead.profiles.job_title && (
                          <span className="text-[11px] text-muted-foreground hidden sm:inline">
                            ({lead.profiles.job_title})
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Direct / Unassigned Rep</span>
                    )}

                    {/* Card Unique ID */}
                    {lead.cards?.short_code && (
                      <div className="flex items-center gap-1 font-mono text-[11px] bg-muted px-2 py-0.5 rounded-md text-foreground">
                        <CreditCardIcon className="w-3 h-3 text-muted-foreground" />
                        <span>Card: {lead.cards.short_code}</span>
                      </div>
                    )}
                  </div>

                  {/* Submission Timestamp */}
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground ml-auto">
                    <CalendarIcon className="w-3 h-3" />
                    <span>{new Date(lead.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
