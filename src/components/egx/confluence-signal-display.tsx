'use client'

import { SignalLabel } from './legal-disclaimer'

interface ConfluentSignal {
  direction: 'BUY' | 'SELL' | 'NEUTRAL'
  strength: 1 | 2 | 3 | 4 | 5
  confluenceCount: number
  triggeringIndicators: string[]
  caveat?: string
}

export default function ConfluenceSignalDisplay({ signal }: { signal: ConfluentSignal }) {
  const directionColor = signal.direction === 'BUY' ? 'text-emerald-400' : signal.direction === 'SELL' ? 'text-red-400' : 'text-slate-400'
  const directionBg = signal.direction === 'BUY' ? 'bg-emerald-500/10 border-emerald-500/30' : signal.direction === 'SELL' ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-500/10 border-slate-500/30'
  
  return (
    <div className={`rounded-lg p-3 border ${directionBg}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-lg font-bold ${directionColor}`}>
          {signal.direction}
        </span>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((dot) => (
            <div
              key={dot}
              className={`w-2 h-2 rounded-full ${
                dot <= signal.strength ? directionColor.replace('text-', 'bg-') : 'bg-slate-700'
              }`}
            />
          ))}
          <span className="text-xs text-slate-400 ml-1">{signal.strength}/5</span>
        </div>
      </div>
      
      <div className="text-xs text-slate-400 mb-1">
        {signal.confluenceCount} indicator{signal.confluenceCount !== 1 ? 's' : ''} in agreement
      </div>
      
      {signal.triggeringIndicators.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {signal.triggeringIndicators.map((ind, i) => (
            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              {ind}
            </span>
          ))}
        </div>
      )}
      
      {signal.caveat && (
        <div className="text-[10px] text-amber-400 flex items-center gap-1 mt-1">
          <span>⚠</span> {signal.caveat}
        </div>
      )}
      
      <div className="mt-2 pt-1.5 border-t border-slate-700/50">
        <SignalLabel />
      </div>
    </div>
  )
}
