'use client'

import { useEffect, useRef } from 'react'

interface TapAnalyticsTrackerProps {
  cardId?: string
}

/**
 * Fires an asynchronous background beacon to record a card tap event.
 * Uses navigator.sendBeacon (or keepalive fetch) so it NEVER delays or blocks page rendering.
 */
export function TapAnalyticsTracker({ cardId }: TapAnalyticsTrackerProps) {
  const hasTracked = useRef(false)

  useEffect(() => {
    if (!cardId || hasTracked.current) return
    hasTracked.current = true

    const payload = JSON.stringify({ cardId })

    try {
      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        const blob = new Blob([payload], { type: 'application/json' })
        const sent = navigator.sendBeacon('/api/analytics/tap', blob)
        if (sent) return
      }

      // Fallback to fetch with keepalive
      fetch('/api/analytics/tap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {
        // Silently catch - analytics failures must never disrupt user experience
      })
    } catch {
      // Ignored for resilience
    }
  }, [cardId])

  return null
}
