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
  // Initialize as null to avoid SSR/client hydration mismatch
  // (server and client are in different timezones, causing time to differ)
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Using a callback to avoid synchronous setState in effect body
    const init = () => {
      setMounted(true)
      setMarketStatus(getMarketStatus())
    }
    init()
    // Update every 30 seconds
    const interval = setInterval(() => {
      setMarketStatus(getMarketStatus())
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const now = new Date()
  const priceAgeMs = lastPriceAt ? (now.getTime() - new Date(lastPriceAt).getTime()) : Infinity
  const financialsAgeMs = lastFinancialsAt ? (now.getTime() - new Date(lastFinancialsAt).getTime()) : Infinity
  
  // Data freshness classification
  const priceFreshness = priceAgeMs < 24 * 60 * 60 * 1000 ? 'live' : priceAgeMs < 5 * 24 * 60 * 60 * 1000 ? 'stale' : 'outdated'
  const financialsFreshness = financialsAgeMs < 90 * 24 * 60 * 60 * 1000 ? 'live' : 'outdated'
  const priceStale = priceFreshness !== 'live'
  const financialsStale = financialsFreshness === 'outdated'

  // Freshness color helper
  const freshnessColor = (f: 'live' | 'stale' | 'outdated') =>
    f === 'live' ? 'text-emerald-400' : f === 'stale' ? 'text-amber-400' : 'text-red-400'
  const freshnessBg = (f: 'live' | 'stale' | 'outdated') =>
    f === 'live' ? 'bg-emerald-500/10 border-emerald-500/30' : f === 'stale' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-red-500/10 border-red-500/30'
  const freshnessLabel = (f: 'live' | 'stale' | 'outdated') =>
    f === 'live' ? 'Live' : f === 'stale' ? 'Stale' : 'Outdated'

  if (!mounted) {
    return <div className="flex items-center gap-3" />
  }

  return (
    <div className="flex items-center gap-3">
      {/* EGX Session Status */}
      {marketStatus && <SessionBadge status={marketStatus} />}

      {/* Price freshness badge */}
      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] border ${freshnessBg(priceFreshness)}`}>
        <Wifi className={`w-2.5 h-2.5 ${freshnessColor(priceFreshness)}`} />
        <span className={freshnessColor(priceFreshness)}>Price: {freshnessLabel(priceFreshness)}</span>
      </div>

      {/* Financials freshness badge */}
      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] border ${freshnessBg(financialsFreshness === 'live' ? 'live' : 'outdated')}`}>
        <Clock className={`w-2.5 h-2.5 ${freshnessColor(financialsFreshness === 'live' ? 'live' : 'outdated')}`} />
        <span className={freshnessColor(financialsFreshness === 'live' ? 'live' : 'outdated')}>Financials: {freshnessLabel(financialsFreshness === 'live' ? 'live' : 'outdated')}</span>
      </div>

      {/* Detailed stale data warnings */}
      {(priceStale || financialsStale) && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md text-xs" 
             style={{ backgroundColor: '#422006', border: '1px solid #854d0e' }}>
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-amber-200">
            {priceStale && `Price data ${freshnessLabel(priceFreshness).toLowerCase()}`}
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
