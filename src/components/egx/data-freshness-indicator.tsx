'use client'

import { AlertTriangle, Clock } from 'lucide-react'

interface DataFreshnessProps {
  lastPriceAt: string | Date | null
  lastFinancialsAt: string | Date | null
}

export default function DataFreshnessIndicator({ lastPriceAt, lastFinancialsAt }: DataFreshnessProps) {
  const now = new Date()
  const priceStale = lastPriceAt ? (now.getTime() - new Date(lastPriceAt).getTime()) > 24 * 60 * 60 * 1000 : true
  const financialsStale = lastFinancialsAt ? (now.getTime() - new Date(lastFinancialsAt).getTime()) > 90 * 24 * 60 * 60 * 1000 : true

  if (!priceStale && !financialsStale) return null

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-md text-xs" 
         style={{ backgroundColor: '#422006', border: '1px solid #854d0e' }}>
      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      <span className="text-amber-200">
        {priceStale && 'Price data may be stale'}
        {priceStale && financialsStale && ' · '}
        {financialsStale && 'Financial data outdated (>90 days)'}
      </span>
      {(lastPriceAt || lastFinancialsAt) && (
        <span className="text-amber-400/70 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Last update: {lastPriceAt ? new Date(lastPriceAt).toLocaleDateString() : 'Never'}
        </span>
      )}
    </div>
  )
}
