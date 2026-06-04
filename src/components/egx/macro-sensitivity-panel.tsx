'use client'

import { BarChart3 } from 'lucide-react'

interface SensitivityRow {
  rateChangeBps: number
  waccImpact: number
  fairValueImpact: number
  newUpside: number
}

interface MacroSensitivityProps {
  currentWACC: number
  currentFairValue: number
  currentPrice: number
  currentUpside: number
  sensitivities: SensitivityRow[]
}

export default function MacroSensitivityPanel({ currentWACC, currentFairValue, currentPrice, currentUpside, sensitivities }: MacroSensitivityProps) {
  return (
    <div className="rounded-lg p-4" style={{ backgroundColor: '#111827', border: '1px solid #1e293b' }}>
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4 text-cyan-400" />
        <span className="text-sm font-semibold text-slate-200">CBE Rate Sensitivity</span>
      </div>
      
      <div className="text-xs text-slate-400 mb-3">
        Impact of CBE overnight rate changes on WACC, fair value, and upside for this stock
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-start py-1.5 text-slate-400 font-medium">Rate Change</th>
              <th className="text-start py-1.5 text-slate-400 font-medium">WACC</th>
              <th className="text-start py-1.5 text-slate-400 font-medium">Fair Value</th>
              <th className="text-start py-1.5 text-slate-400 font-medium">Upside</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-800">
              <td className="py-1.5 text-slate-300">Base</td>
              <td className="py-1.5 mono-num text-slate-200">{(currentWACC * 100).toFixed(1)}%</td>
              <td className="py-1.5 mono-num text-slate-200">{currentFairValue.toFixed(2)}</td>
              <td className={`py-1.5 mono-num ${currentUpside >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {currentUpside >= 0 ? '+' : ''}{currentUpside.toFixed(1)}%
              </td>
            </tr>
            {sensitivities.map((row, i) => (
              <tr key={i} className="border-b border-slate-800/50">
                <td className={`py-1.5 ${row.rateChangeBps > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {row.rateChangeBps > 0 ? '+' : ''}{row.rateChangeBps}bps
                </td>
                <td className="py-1.5 mono-num text-slate-300">{((currentWACC + row.waccImpact) * 100).toFixed(1)}%</td>
                <td className="py-1.5 mono-num text-slate-300">{(currentFairValue + row.fairValueImpact).toFixed(2)}</td>
                <td className={`py-1.5 mono-num ${row.newUpside >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {row.newUpside >= 0 ? '+' : ''}{row.newUpside.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
