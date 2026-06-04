'use client'

import React, { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Landmark,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { EGYPT_MARKET_PARAMS } from '@/lib/valuation/egyptMarketParams'

interface SensitivityPoint {
  rateChangeBps: number
  newRiskFreeRate: number
  newWACC: number
  waccChangeBps: number
  fairValueMultiplier: number
}

interface SensitivityData {
  ticker: string
  name: string
  currentPrice: number
  fairValue: number
  sensitivity: {
    baseWACC: number
    baseFairValue: number
    points: SensitivityPoint[]
    summary: {
      plus100bps: { waccImpact: number; fairValueImpact: number }
      minus100bps: { waccImpact: number; fairValueImpact: number }
      plus200bps: { waccImpact: number; fairValueImpact: number }
      minus200bps: { waccImpact: number; fairValueImpact: number }
      plus300bps: { waccImpact: number; fairValueImpact: number }
      minus300bps: { waccImpact: number; fairValueImpact: number }
    }
  }
}

interface MacroSensitivityProps {
  ticker: string
}

function SensitivityTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { label: string; fairValueImpact: number; waccImpact: number; newRate: number } }> }) {
  if (active && payload && payload.length) {
    const d = payload[0].payload
    return (
      <div className='rounded-lg border p-3 text-xs shadow-xl' style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}>
        <p className='font-semibold text-slate-200 mb-1'>{d.label}</p>
        <p className='text-slate-400'>New CBE Rate: {(d.newRate * 100).toFixed(2)}%</p>
        <p className={d.waccImpact <= 0 ? 'text-emerald-400' : 'text-red-400'}>
          WACC Impact: {d.waccImpact > 0 ? '+' : ''}{d.waccImpact.toFixed(1)} bps
        </p>
        <p className={d.fairValueImpact >= 0 ? 'text-emerald-400' : 'text-red-400'}>
          FV Impact: {d.fairValueImpact > 0 ? '+' : ''}{d.fairValueImpact.toFixed(2)}%
        </p>
      </div>
    )
  }
  return null
}

export default function MacroSensitivityPanel({ ticker }: MacroSensitivityProps) {
  const [data, setData] = useState<SensitivityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSensitivity = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/sensitivity/${ticker}`)
        if (!res.ok) {
          throw new Error('Failed to fetch sensitivity data')
        }
        const json = await res.json()
        setData(json)
      } catch (err) {
        console.error('Failed to fetch sensitivity:', err)
        setError('Failed to load sensitivity data')
      } finally {
        setLoading(false)
      }
    }
    fetchSensitivity()
  }, [ticker])

  if (loading) {
    return (
      <div className='space-y-4'>
        <Skeleton className='h-40 bg-slate-800 rounded-xl' />
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          <Skeleton className='h-64 bg-slate-800 rounded-xl' />
          <Skeleton className='h-64 bg-slate-800 rounded-xl' />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div
        className='rounded-xl border p-8 text-center'
        style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}
      >
        <BarChart3 className='w-8 h-8 text-amber-400 mx-auto mb-2' />
        <p className='text-slate-400'>{error || 'No sensitivity data available'}</p>
      </div>
    )
  }

  const { sensitivity, currentPrice, fairValue } = data
  const currentCBERate = EGYPT_MARKET_PARAMS.riskFreeRate
  const upside = fairValue > 0 ? ((fairValue - currentPrice) / currentPrice) * 100 : 0

  // Prepare chart data
  const chartData = sensitivity.points
    .filter(p => p.rateChangeBps !== 0)
    .map(p => {
      const newFairValue = fairValue * p.fairValueMultiplier
      const newUpside = newFairValue > 0 ? ((newFairValue - currentPrice) / currentPrice) * 100 : 0
      const fvImpact = (p.fairValueMultiplier - 1) * 100
      return {
        label: `${p.rateChangeBps > 0 ? '+' : ''}${p.rateChangeBps} bps`,
        fairValueImpact: parseFloat(fvImpact.toFixed(2)),
        waccImpact: p.waccChangeBps,
        newRate: p.newRiskFreeRate,
        newFairValue: parseFloat(newFairValue.toFixed(2)),
        newUpside: parseFloat(newUpside.toFixed(1)),
      }
    })

  // Summary cards
  const summaryItems = [
    { label: '-300 bps', data: sensitivity.summary.minus300bps, icon: TrendingUp, type: 'cut' as const },
    { label: '-200 bps', data: sensitivity.summary.minus200bps, icon: TrendingUp, type: 'cut' as const },
    { label: '-100 bps', data: sensitivity.summary.minus100bps, icon: TrendingUp, type: 'cut' as const },
    { label: '+100 bps', data: sensitivity.summary.plus100bps, icon: TrendingDown, type: 'hike' as const },
    { label: '+200 bps', data: sensitivity.summary.plus200bps, icon: TrendingDown, type: 'hike' as const },
    { label: '+300 bps', data: sensitivity.summary.plus300bps, icon: TrendingDown, type: 'hike' as const },
  ]

  return (
    <div className='space-y-4'>
      {/* ─── Header Card ───────────────────────────────────── */}
      <Card style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}>
        <CardContent className='p-4'>
          <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 flex items-center justify-center rounded-lg bg-amber-500/10'>
                <Landmark className='w-5 h-5 text-amber-400' />
              </div>
              <div>
                <div className='flex items-center gap-2'>
                  <span className='text-sm font-semibold text-slate-200'>CBE Rate Sensitivity</span>
                  <Badge className='text-[9px] h-4 bg-amber-500/20 text-amber-400 border-amber-500/30'>
                    MACRO
                  </Badge>
                </div>
                <div className='text-xs text-slate-500 mt-0.5'>
                  Impact of CBE overnight rate changes on WACC and fair value
                </div>
              </div>
            </div>
            <div className='flex items-center gap-4'>
              <div className='text-center'>
                <div className='text-[10px] text-slate-500'>Current CBE Rate</div>
                <div className='mono-num text-lg font-bold text-amber-400'>
                  {(currentCBERate * 100).toFixed(2)}%
                </div>
              </div>
              <div className='text-center'>
                <div className='text-[10px] text-slate-500'>Base WACC</div>
                <div className='mono-num text-lg font-bold text-cyan-400'>
                  {(sensitivity.baseWACC * 100).toFixed(1)}%
                </div>
              </div>
              <div className='text-center'>
                <div className='text-[10px] text-slate-500'>Fair Value</div>
                <div className='mono-num text-lg font-bold text-white'>
                  EGP {fairValue.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Sensitivity Table + Chart ─────────────────────── */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        {/* Table */}
        <Card style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}>
          <CardHeader className='pb-2 pt-4 px-4'>
            <CardTitle className='text-sm font-semibold text-slate-300 flex items-center gap-2'>
              <BarChart3 className='w-4 h-4 text-cyan-400' />
              Sensitivity Table
            </CardTitle>
          </CardHeader>
          <CardContent className='px-4 pb-4'>
            <div className='overflow-x-auto'>
              <table className='w-full text-xs'>
                <thead>
                  <tr className='border-b' style={{ borderColor: '#1e293b' }}>
                    <th className='text-left py-2 px-2 text-slate-500 font-medium'>Rate Change</th>
                    <th className='text-right py-2 px-2 text-slate-500 font-medium'>New CBE Rate</th>
                    <th className='text-right py-2 px-2 text-slate-500 font-medium'>WACC Impact</th>
                    <th className='text-right py-2 px-2 text-slate-500 font-medium'>Fair Value Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Base row */}
                  <tr className='border-b' style={{ borderColor: '#1e293b30' }}>
                    <td className='py-2 px-2 text-slate-300 font-medium'>Base</td>
                    <td className='py-2 px-2 text-right mono-num text-slate-200'>
                      {(currentCBERate * 100).toFixed(2)}%
                    </td>
                    <td className='py-2 px-2 text-right mono-num text-slate-400'>—</td>
                    <td className='py-2 px-2 text-right mono-num text-slate-400'>—</td>
                  </tr>
                  {sensitivity.points.filter(p => p.rateChangeBps !== 0).map((point) => {
                    const fvImpact = (point.fairValueMultiplier - 1) * 100
                    const isHike = point.rateChangeBps > 0
                    return (
                      <tr key={point.rateChangeBps} className='border-b' style={{ borderColor: '#1e293b20' }}>
                        <td className='py-2 px-2'>
                          <span className={`inline-flex items-center gap-1 ${isHike ? 'text-red-400' : 'text-emerald-400'}`}>
                            {isHike ? (
                              <ArrowUpRight className='w-3 h-3' />
                            ) : (
                              <ArrowDownRight className='w-3 h-3' />
                            )}
                            {point.rateChangeBps > 0 ? '+' : ''}{point.rateChangeBps} bps
                          </span>
                        </td>
                        <td className='py-2 px-2 text-right mono-num text-slate-300'>
                          {(point.newRiskFreeRate * 100).toFixed(2)}%
                        </td>
                        <td className='py-2 px-2 text-right mono-num'>
                          <span className={point.waccChangeBps <= 0 ? 'text-emerald-400' : 'text-red-400'}>
                            {point.waccChangeBps > 0 ? '+' : ''}{point.waccChangeBps.toFixed(1)} bps
                          </span>
                        </td>
                        <td className='py-2 px-2 text-right mono-num'>
                          <span className={fvImpact >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                            {fvImpact > 0 ? '+' : ''}{fvImpact.toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}>
          <CardHeader className='pb-2 pt-4 px-4'>
            <CardTitle className='text-sm font-semibold text-slate-300 flex items-center gap-2'>
              <BarChart3 className='w-4 h-4 text-cyan-400' />
              Fair Value Sensitivity
            </CardTitle>
          </CardHeader>
          <CardContent className='px-4 pb-4'>
            <div className='h-64'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={chartData} margin={{ left: 5, right: 20, top: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray='3 3' stroke='#1e293b' />
                  <XAxis
                    dataKey='label'
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                  />
                  <YAxis
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}%`}
                  />
                  <Tooltip content={<SensitivityTooltip />} />
                  <ReferenceLine y={0} stroke='#475569' strokeDasharray='3 3' />
                  <Bar dataKey='fairValueImpact' radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.fairValueImpact >= 0 ? '#10b981' : '#ef4444'}
                        fillOpacity={0.7}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Summary Impact Cards ──────────────────────────── */}
      <Card style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}>
        <CardHeader className='pb-2 pt-4 px-4'>
          <CardTitle className='text-sm font-semibold text-slate-300 flex items-center gap-2'>
            <Landmark className='w-4 h-4 text-amber-400' />
            Rate Change Impact Summary
          </CardTitle>
        </CardHeader>
        <CardContent className='px-4 pb-4'>
          <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3'>
            {summaryItems.map((item) => {
              const Icon = item.icon
              const isCut = item.type === 'cut'
              const newFV = fairValue * (1 + item.data.fairValueImpact / 100)
              return (
                <div
                  key={item.label}
                  className='p-3 rounded-lg border transition-colors hover:border-cyan-500/30'
                  style={{
                    backgroundColor: isCut ? '#052e16' : '#2d0a0a',
                    borderColor: isCut ? '#065f46' : '#7f1d1d',
                  }}
                >
                  <div className='flex items-center gap-1 mb-2'>
                    <Icon className={`w-3 h-3 ${isCut ? 'text-emerald-400' : 'text-red-400'}`} />
                    <span className={`text-[10px] font-semibold ${isCut ? 'text-emerald-400' : 'text-red-400'}`}>
                      {item.label}
                    </span>
                  </div>
                  <div className='space-y-1'>
                    <div>
                      <div className='text-[9px] text-slate-500'>WACC</div>
                      <div className={`mono-num text-xs font-medium ${item.data.waccImpact <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {item.data.waccImpact > 0 ? '+' : ''}{item.data.waccImpact.toFixed(1)} bps
                      </div>
                    </div>
                    <div>
                      <div className='text-[9px] text-slate-500'>Fair Value</div>
                      <div className={`mono-num text-xs font-medium ${item.data.fairValueImpact >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {item.data.fairValueImpact > 0 ? '+' : ''}{item.data.fairValueImpact.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div className='text-[9px] text-slate-500'>New FV</div>
                      <div className='mono-num text-xs text-slate-300'>
                        EGP {newFV.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
