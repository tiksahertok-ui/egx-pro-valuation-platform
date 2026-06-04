'use client'

import { AlertTriangle, Clock, Wifi, WifiOff } from 'lucide-react'
import { getMarketStatus, type MarketStatus } from '@/lib/market-hours'
import { useState, useEffect } from 'react'

interface DataFreshnessProps {
  lastPriceAt: string | Date | null
  lastFinancialsAt: string | Date | null
}

function SessionBadge({ status }: { status: MarketStatus }) {
  const sessionLabels: Record<MarketStatus['currentSession'], string> = {
    'pre-open': 'Pre-Open',
    'continuous': 'Trading',
    'closing-auction': 'Closing Auction',
    'closed': 'Closed',
    'weekend': 'Weekend',
  }

  const sessionColors: Record<MarketStatus['currentSession'], string> = {
    'pre-open': 'text-amber-400',
    'continuous': 'text-emerald-400',
    'closing-auction': 'text-amber-400',
    'closed': 'text-slate-400',
    'weekend': 'text-slate-500',
  }

  return (
    <div className="flex items-center gap-1.5 text-xs">
      {status.isOpen ? (
        <Wifi className="w-3 h-3 text-emerald-400" />
      ) : (
        <WifiOff className="w-3 h-3 text-slate-500" />
      )}
      <span className={sessionColors[status.currentSession]}>
        EGX {sessionLabels[status.currentSession]}
      </span>
      <span className="text-slate-500">·</span>
      <span className="text-slate-400">{status.currentTimeCairo}</span>
    </div>
  )
}

export default function DataFreshnessIndicator({ lastPriceAt, lastFinancialsAt }: DataFreshnessProps) {
  const [marketStatus, setMarketStatus] = useState<MarketStatus>(() => getMarketStatus())

  useEffect(() => {
    // Update every 30 seconds
    const interval = setInterval(() => {
      setMarketStatus(getMarketStatus())
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const now = new Date()
  const priceStale = lastPriceAt ? (now.getTime() - new Date(lastPriceAt).getTime()) > 24 * 60 * 60 * 1000 : true
  const financialsStale = lastFinancialsAt ? (now.getTime() - new Date(lastFinancialsAt).getTime()) > 90 * 24 * 60 * 60 * 1000 : true

  return (
    <div className="flex items-center gap-3">
      {/* EGX Session Status */}
      {marketStatus && <SessionBadge status={marketStatus} />}

      {/* Stale data warnings */}
      {(priceStale || financialsStale) && (
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
      )}
    </div>
  )
}
