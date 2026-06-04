'use client'

import { AlertTriangle } from 'lucide-react'

interface InsufficientDataBadgeProps {
  periods: number
  required: number
  indicator?: string
}

export default function InsufficientDataBadge({ periods, required, indicator }: InsufficientDataBadgeProps) {
  return (
    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-amber-900/30 text-amber-400 border border-amber-700/30">
      <AlertTriangle className="w-2.5 h-2.5" />
      <span>{periods}/{required} bars</span>
      {indicator && <span className="text-amber-500/70">({indicator})</span>}
    </div>
  )
}
