'use client'

import { Target, ShieldAlert, TrendingUp, ArrowUpDown } from 'lucide-react'
import { SignalLabel } from './legal-disclaimer'

interface TradePlan {
  horizonLabel: string
  entryZoneLow: number
  entryZoneHigh: number
  primaryTarget: number
  secondaryTarget: number
  stopLoss: number
  riskRewardRatio: number
  basisOfEntry: string
  basisOfTarget: string
}

export default function TradePlanCard({ plan }: { plan: TradePlan }) {
  return (
    <div className="rounded-lg p-3" style={{ backgroundColor: '#111827', border: '1px solid #1e293b' }}>
      <div className="text-xs font-semibold text-cyan-400 mb-2">{plan.horizonLabel}</div>
      
      <div className="space-y-1.5 text-[11px]">
        <div className="flex justify-between">
          <span className="text-slate-400 flex items-center gap-1">
            <Target className="w-3 h-3" /> Entry Zone
          </span>
          <span className="text-slate-200 mono-num">
            {plan.entryZoneLow.toFixed(2)} – {plan.entryZoneHigh.toFixed(2)} EGP
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Target 1
          </span>
          <span className="text-emerald-300 mono-num">{plan.primaryTarget.toFixed(2)} EGP</span>
        </div>
        <div className="flex justify-between">
          <span className="text-cyan-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Target 2
          </span>
          <span className="text-cyan-300 mono-num">{plan.secondaryTarget.toFixed(2)} EGP</span>
        </div>
        <div className="flex justify-between">
          <span className="text-red-400 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" /> Stop Loss
          </span>
          <span className="text-red-300 mono-num">{plan.stopLoss.toFixed(2)} EGP</span>
        </div>
        <div className="flex justify-between border-t border-slate-700 pt-1.5">
          <span className="text-slate-400 flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3" /> Risk:Reward
          </span>
          <span className={`mono-num font-semibold ${plan.riskRewardRatio >= 2 ? 'text-emerald-400' : plan.riskRewardRatio >= 1 ? 'text-amber-400' : 'text-red-400'}`}>
            1:{plan.riskRewardRatio.toFixed(1)}
          </span>
        </div>
      </div>
      
      <div className="mt-2 pt-1.5 border-t border-slate-800">
        <SignalLabel />
      </div>
    </div>
  )
}
