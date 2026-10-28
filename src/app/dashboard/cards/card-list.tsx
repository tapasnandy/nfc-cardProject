'use client'

import { useState } from 'react'
import { createCard, assignProfileToCard, toggleCardStatus, deleteCard } from '@/app/actions/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import Link from 'next/link'
import { CopyIcon, ExternalLinkIcon, TrashIcon, SmartphoneNfcIcon } from 'lucide-react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CardList({ initialCards, profiles, organizationId }: { initialCards: any[], profiles: any[], organizationId: string }) {
  const [isCreating, setIsCreating] = useState(false)
  const [loadingCardId, setLoadingCardId] = useState<string | null>(null)

  const handleCreate = async () => {
    setIsCreating(true)
    try {
      await createCard(organizationId)
      toast.success('Card created successfully!')
    } catch (error: unknown) {
      const err = error as Error
      toast.error(err.message || 'Failed to create card')
    } finally {
      setIsCreating(false)
    }
  }

  const handleAssign = async (cardId: string, profileId: string) => {
    setLoadingCardId(cardId)
    try {
      await assignProfileToCard(cardId, profileId === 'none' ? null : profileId)
      toast.success('Profile assigned!')
    } catch (error: unknown) {
      const err = error as Error
      toast.error(err.message || 'Failed to assign profile')
    } finally {
      setLoadingCardId(null)
    }
  }

  const handleToggleStatus = async (cardId: string, currentStatus: string) => {
    setLoadingCardId(cardId)
    try {
      await toggleCardStatus(cardId, currentStatus)
      toast.success('Status updated!')
    } catch (error: unknown) {
      const err = error as Error
      toast.error(err.message || 'Failed to update status')
    } finally {
      setLoadingCardId(null)
    }
  }

  const handleDelete = async (cardId: string) => {
    if (!confirm('Are you sure you want to delete this card? This action cannot be undone.')) return
    
    setLoadingCardId(cardId)
    try {
      await deleteCard(cardId)
      toast.success('Card deleted!')
    } catch (error: unknown) {
      const err = error as Error
      toast.error(err.message || 'Failed to delete card')
    } finally {
      setLoadingCardId(null)
    }
  }

  const copyLink = (shortCode: string) => {
    const url = `${window.location.origin}/c/${shortCode}`
    navigator.clipboard.writeText(url)
    toast.success('Link copied to clipboard')
  }

  return (
    <Card className="shadow-sm">
      <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-muted/40 rounded-t-xl">
        <div>
          <h2 className="font-semibold text-base sm:text-lg">Your Cards ({initialCards.length})</h2>
          <p className="text-xs text-muted-foreground">Manage NFC cards and assign profiles</p>
        </div>
        <Button onClick={handleCreate} disabled={isCreating} className="w-full sm:w-auto">
          {isCreating ? 'Creating...' : '+ Create New Card'}
        </Button>
      </div>

      <CardContent className="p-0">
        {initialCards.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
            <SmartphoneNfcIcon className="h-12 w-12 mb-4 text-muted-foreground/50" />
            <p className="font-medium text-foreground">You do not have any NFC cards yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Click &quot;Create New Card&quot; to generate your first virtual card.</p>
          </div>
        ) : (
          <>
            {/* Desktop / Tablet Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Short Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned Profile</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialCards.map((card) => (
                    <TableRow key={card.id}>
                      <TableCell className="font-medium font-mono text-sm">
                        {card.short_code}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={card.status === 'active' ? 'default' : 'secondary'} 
                          className="cursor-pointer select-none" 
                          onClick={() => handleToggleStatus(card.id, card.status)}
                          title="Click to toggle status"
                        >
                          {card.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select 
                          disabled={loadingCardId === card.id}
                          value={card.profile_id || 'none'}
                          onValueChange={(val) => handleAssign(card.id, val)}
                        >
                          <SelectTrigger className="w-[180px] h-8 text-xs">
                            <SelectValue placeholder="Select a profile" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">
                              <span className="text-muted-foreground italic">Unassigned</span>
                            </SelectItem>
                            {profiles.map((p) => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => copyLink(card.short_code)} title="Copy Public URL">
                            <CopyIcon className="h-4 w-4" />
                          </Button>
                          <Link href={`/c/${card.short_code}`} target="_blank" title="View Public Profile" className={buttonVariants({ variant: 'ghost', size: 'icon' })}>
                            <ExternalLinkIcon className="h-4 w-4" />
                          </Link>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(card.id)} title="Delete Card" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950">
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Touch-Optimized Cards List (< md) */}
            <div className="md:hidden divide-y divide-border">
              {initialCards.map((card) => (
                <div key={card.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase">Card:</span>
                      <span className="font-mono font-bold text-sm">{card.short_code}</span>
                    </div>
                    <Badge 
                      variant={card.status === 'active' ? 'default' : 'secondary'} 
                      className="cursor-pointer select-none text-xs" 
                      onClick={() => handleToggleStatus(card.id, card.status)}
                      title="Tap to toggle status"
                    >
                      {card.status}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Assigned Profile:</label>
                    <Select 
                      disabled={loadingCardId === card.id}
                      value={card.profile_id || 'none'}
                      onValueChange={(val) => handleAssign(card.id, val)}
                    >
                      <SelectTrigger className="w-full h-9 text-xs">
                        <SelectValue placeholder="Select a profile" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <span className="text-muted-foreground italic">Unassigned</span>
                        </SelectItem>
                        {profiles.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t text-xs">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => copyLink(card.short_code)}
                      className="text-xs h-8"
                    >
                      <CopyIcon className="h-3.5 w-3.5 mr-1.5" /> Copy Link
                    </Button>
                    <div className="flex gap-2">
                      <Link 
                        href={`/c/${card.short_code}`} 
                        target="_blank" 
                        className={buttonVariants({ variant: 'outline', size: 'sm', className: 'text-xs h-8' })}
                      >
                        <ExternalLinkIcon className="h-3.5 w-3.5 mr-1" /> View
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDelete(card.id)}
                        className="text-destructive hover:bg-destructive/10 text-xs h-8 px-2"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
