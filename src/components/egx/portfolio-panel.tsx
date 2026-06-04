'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Briefcase,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Shield,
  DollarSign,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import LegalDisclaimer from './legal-disclaimer'

// ─── Types ───────────────────────────────────────────────
interface PortfolioSummary {
  id: number
  name: string
  userId: string
  holdingsCount: number
  totalValue: number
  totalCost: number
  totalGainLoss: number
  weightedFairValue: number
  weightedMarginOfSafety: number
  createdAt: string
  updatedAt: string
}

interface HoldingDetail {
  id: number
  stockId: string
  ticker: string
  name: string
  sector: string
  quantity: number
  costBasis: number
  currentPrice: number
  currentValue: number
  costBasisTotal: number
  gainLoss: number
  gainLossPct: number
  fairValue: number
  marginOfSafety: number
  weight: number
  upside: number
  confidence: number
  createdAt: string
}

interface PortfolioDetail {
  portfolio: {
    id: number
    name: string
    userId: string
    createdAt: string
    updatedAt: string
  }
  holdings: HoldingDetail[]
  aggregates: {
    totalValue: number
    totalCost: number
    totalGainLoss: number
    totalGainLossPct: number
    weightedFairValue: number
    weightedMarginOfSafety: number
    holdingsCount: number
  }
}

interface StockOption {
  id: string
  ticker: string
  name: string
  price: number
}

// ─── Format Helpers ──────────────────────────────────────
const fmtEGP = (n: number) => {
  if (Math.abs(n) >= 1e9) return `EGP ${(n / 1e9).toFixed(2)}B`
  if (Math.abs(n) >= 1e6) return `EGP ${(n / 1e6).toFixed(2)}M`
  if (Math.abs(n) >= 1e3) return `EGP ${(n / 1e3).toFixed(1)}K`
  return `EGP ${n.toFixed(2)}`
}

const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`

// ─── Main Component ──────────────────────────────────────
export default function PortfolioPanel() {
  const [portfolios, setPortfolios] = useState<PortfolioSummary[]>([])
  const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showAddHoldingDialog, setShowAddHoldingDialog] = useState(false)
  const [newPortfolioName, setNewPortfolioName] = useState('')
  const [stocks, setStocks] = useState<StockOption[]>([])
  const [addForm, setAddForm] = useState({
    stockId: '',
    quantity: '',
    costBasis: '',
  })
  const [submitting, setSubmitting] = useState(false)

  // Fetch portfolios
  const fetchPortfolios = useCallback(async () => {
    try {
      const res = await fetch('/api/portfolio')
      const data = await res.json()
      setPortfolios(data.portfolios || [])
    } catch (err) {
      console.error('Failed to fetch portfolios:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch stocks for add holding dialog
  const fetchStocks = useCallback(async () => {
    try {
      const res = await fetch('/api/stocks')
      const data = await res.json()
      setStocks(
        (data.stocks || []).map((s: { id: string; ticker: string; name: string; price: number }) => ({
          id: s.id,
          ticker: s.ticker,
          name: s.name,
          price: s.price,
        }))
      )
    } catch (err) {
      console.error('Failed to fetch stocks:', err)
    }
  }, [])

  useEffect(() => {
    fetchPortfolios()
    fetchStocks()
  }, [fetchPortfolios, fetchStocks])

  // Select a portfolio to view details
  const selectPortfolio = useCallback(
    async (id: number) => {
      try {
        const res = await fetch(`/api/portfolio/${id}`)
        const data = await res.json()
        setSelectedPortfolio(data)
      } catch (err) {
        console.error('Failed to fetch portfolio detail:', err)
      }
    },
    []
  )

  // Create portfolio
  const createPortfolio = async () => {
    if (!newPortfolioName.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPortfolioName.trim() }),
      })
      if (res.ok) {
        setNewPortfolioName('')
        setShowCreateDialog(false)
        await fetchPortfolios()
      }
    } catch (err) {
      console.error('Failed to create portfolio:', err)
    } finally {
      setSubmitting(false)
    }
  }

  // Delete portfolio
  const deletePortfolio = async (id: number) => {
    try {
      const res = await fetch(`/api/portfolio/${id}`, { method: 'DELETE' })
      if (res.ok) {
        if (selectedPortfolio?.portfolio.id === id) {
          setSelectedPortfolio(null)
        }
        await fetchPortfolios()
      }
    } catch (err) {
      console.error('Failed to delete portfolio:', err)
    }
  }

  // Add holding
  const addHolding = async () => {
    if (!selectedPortfolio || !addForm.stockId || !addForm.quantity || !addForm.costBasis) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/portfolio/${selectedPortfolio.portfolio.id}/holdings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stockId: addForm.stockId,
          quantity: parseFloat(addForm.quantity),
          costBasis: parseFloat(addForm.costBasis),
        }),
      })
      if (res.ok) {
        setAddForm({ stockId: '', quantity: '', costBasis: '' })
        setShowAddHoldingDialog(false)
        await selectPortfolio(selectedPortfolio.portfolio.id)
        await fetchPortfolios()
      }
    } catch (err) {
      console.error('Failed to add holding:', err)
    } finally {
      setSubmitting(false)
    }
  }

  // Remove holding
  const removeHolding = async (holdingId: number) => {
    if (!selectedPortfolio) return
    try {
      const res = await fetch(`/api/portfolio/${selectedPortfolio.portfolio.id}/holdings`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holdingId }),
      })
      if (res.ok) {
        await selectPortfolio(selectedPortfolio.portfolio.id)
        await fetchPortfolios()
      }
    } catch (err) {
      console.error('Failed to remove holding:', err)
    }
  }

  const selectedStock = stocks.find((s) => s.id === addForm.stockId)

  // ─── Render ────────────────────────────────────────────
  if (loading) {
    return (
      <div className='p-4 space-y-4'>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className='h-24 bg-slate-800 rounded-lg' />
          ))}
        </div>
        <Skeleton className='h-64 bg-slate-800 rounded-lg' />
      </div>
    )
  }

  return (
    <div className='p-4 space-y-4'>
      {/* ─── Header ──────────────────────────────────────── */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Briefcase className='w-5 h-5 text-cyan-400' />
          <h2 className='text-lg font-semibold text-white'>Portfolio Tracker</h2>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          size='sm'
          className='bg-cyan-600 hover:bg-cyan-700 text-white h-8 text-xs'
        >
          <Plus className='w-3.5 h-3.5 mr-1' />
          New Portfolio
        </Button>
      </div>

      {/* ─── Portfolio Selector ──────────────────────────── */}
      {portfolios.length > 0 && (
        <div className='flex items-center gap-2 flex-wrap'>
          {portfolios.map((p) => (
            <button
              key={p.id}
              onClick={() => selectPortfolio(p.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors border ${
                selectedPortfolio?.portfolio.id === p.id
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400'
                  : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              <span className='font-medium'>{p.name}</span>
              <Badge
                variant='outline'
                className='text-[10px] h-4 bg-slate-800 border-slate-700 text-slate-400'
              >
                {p.holdingsCount}
              </Badge>
              <span className='mono-num text-slate-400'>{fmtEGP(p.totalValue)}</span>
            </button>
          ))}
        </div>
      )}

      {/* ─── Empty State ─────────────────────────────────── */}
      {portfolios.length === 0 && (
        <Card style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}>
          <CardContent className='p-8 text-center'>
            <Briefcase className='w-12 h-12 text-slate-600 mx-auto mb-3' />
            <h3 className='text-sm font-medium text-slate-300 mb-1'>No Portfolios Yet</h3>
            <p className='text-xs text-slate-500 mb-4'>
              Create your first portfolio to start tracking your EGX investments
            </p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              size='sm'
              className='bg-cyan-600 hover:bg-cyan-700 text-white h-8 text-xs'
            >
              <Plus className='w-3.5 h-3.5 mr-1' />
              Create Portfolio
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ─── Portfolio Detail ────────────────────────────── */}
      {selectedPortfolio && (
        <>
          {/* Aggregate Metrics */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
            <Card className='egx-card-glow' style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}>
              <CardContent className='p-3'>
                <div className='flex items-center gap-2 mb-1'>
                  <DollarSign className='w-4 h-4 text-cyan-400' />
                  <span className='text-xs text-slate-500'>Total Value</span>
                </div>
                <div className='mono-num text-lg font-bold text-white'>
                  {fmtEGP(selectedPortfolio.aggregates.totalValue)}
                </div>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}>
              <CardContent className='p-3'>
                <div className='flex items-center gap-2 mb-1'>
                  <PieChart className='w-4 h-4 text-slate-400' />
                  <span className='text-xs text-slate-500'>Total Cost</span>
                </div>
                <div className='mono-num text-lg font-bold text-slate-300'>
                  {fmtEGP(selectedPortfolio.aggregates.totalCost)}
                </div>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}>
              <CardContent className='p-3'>
                <div className='flex items-center gap-2 mb-1'>
                  {selectedPortfolio.aggregates.totalGainLoss >= 0 ? (
                    <TrendingUp className='w-4 h-4 text-emerald-400' />
                  ) : (
                    <TrendingDown className='w-4 h-4 text-red-400' />
                  )}
                  <span className='text-xs text-slate-500'>Gain/Loss</span>
                </div>
                <div
                  className={`mono-num text-lg font-bold ${
                    selectedPortfolio.aggregates.totalGainLoss >= 0
                      ? 'text-emerald-400'
                      : 'text-red-400'
                  }`}
                >
                  {fmtEGP(selectedPortfolio.aggregates.totalGainLoss)}
                </div>
                <div
                  className={`mono-num text-xs ${
                    selectedPortfolio.aggregates.totalGainLossPct >= 0
                      ? 'text-emerald-400'
                      : 'text-red-400'
                  }`}
                >
                  {fmtPct(selectedPortfolio.aggregates.totalGainLossPct)}
                </div>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}>
              <CardContent className='p-3'>
                <div className='flex items-center gap-2 mb-1'>
                  <Shield className='w-4 h-4 text-amber-400' />
                  <span className='text-xs text-slate-500'>Margin of Safety</span>
                </div>
                <div
                  className={`mono-num text-lg font-bold ${
                    selectedPortfolio.aggregates.weightedMarginOfSafety > 0
                      ? 'text-emerald-400'
                      : selectedPortfolio.aggregates.weightedMarginOfSafety > -0.2
                      ? 'text-amber-400'
                      : 'text-red-400'
                  }`}
                >
                  {fmtPct(selectedPortfolio.aggregates.weightedMarginOfSafety * 100)}
                </div>
                <div className='text-[10px] text-slate-500'>
                  Weighted FV: {fmtEGP(selectedPortfolio.aggregates.weightedFairValue)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Holdings Table */}
          <Card style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}>
            <CardHeader className='pb-2 pt-4 px-4'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-sm font-semibold text-slate-300 flex items-center gap-2'>
                  <Briefcase className='w-4 h-4 text-cyan-400' />
                  {selectedPortfolio.portfolio.name} — Holdings
                </CardTitle>
                <div className='flex items-center gap-2'>
                  <Button
                    onClick={() => setShowAddHoldingDialog(true)}
                    size='sm'
                    className='bg-cyan-600 hover:bg-cyan-700 text-white h-7 text-xs'
                  >
                    <Plus className='w-3 h-3 mr-1' />
                    Add Holding
                  </Button>
                  <Button
                    onClick={() => deletePortfolio(selectedPortfolio.portfolio.id)}
                    size='sm'
                    variant='outline'
                    className='h-7 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10'
                  >
                    <Trash2 className='w-3 h-3 mr-1' />
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className='px-4 pb-4'>
              {selectedPortfolio.holdings.length === 0 ? (
                <div className='text-center py-8'>
                  <PieChart className='w-10 h-10 text-slate-600 mx-auto mb-2' />
                  <p className='text-xs text-slate-500'>No holdings yet. Add your first stock position.</p>
                </div>
              ) : (
                <div className='overflow-x-auto'>
                  <table className='w-full text-xs'>
                    <thead>
                      <tr className='border-b' style={{ borderColor: '#1e293b' }}>
                        <th className='text-left py-2 px-2 text-slate-500 font-medium'>Ticker</th>
                        <th className='text-left py-2 px-2 text-slate-500 font-medium hidden sm:table-cell'>Name</th>
                        <th className='text-right py-2 px-2 text-slate-500 font-medium'>Qty</th>
                        <th className='text-right py-2 px-2 text-slate-500 font-medium'>Cost Basis</th>
                        <th className='text-right py-2 px-2 text-slate-500 font-medium'>Current</th>
                        <th className='text-right py-2 px-2 text-slate-500 font-medium'>Value</th>
                        <th className='text-right py-2 px-2 text-slate-500 font-medium'>Gain/Loss</th>
                        <th className='text-right py-2 px-2 text-slate-500 font-medium hidden md:table-cell'>Fair Value</th>
                        <th className='text-right py-2 px-2 text-slate-500 font-medium hidden md:table-cell'>MoS</th>
                        <th className='text-right py-2 px-2 text-slate-500 font-medium hidden lg:table-cell'>Weight</th>
                        <th className='text-right py-2 px-2 text-slate-500 font-medium w-10'></th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPortfolio.holdings.map((h) => (
                        <tr
                          key={h.id}
                          className='border-b transition-colors hover:bg-slate-800/40'
                          style={{ borderColor: '#1e293b40' }}
                        >
                          <td className='py-2 px-2'>
                            <span className='mono-num font-semibold text-cyan-400'>
                              {h.ticker}
                            </span>
                          </td>
                          <td className='py-2 px-2 text-slate-300 hidden sm:table-cell'>
                            {h.name}
                          </td>
                          <td className='py-2 px-2 text-right mono-num text-slate-200'>
                            {h.quantity.toLocaleString()}
                          </td>
                          <td className='py-2 px-2 text-right mono-num text-slate-400'>
                            {h.costBasis.toFixed(2)}
                          </td>
                          <td className='py-2 px-2 text-right mono-num text-slate-200'>
                            {h.currentPrice.toFixed(2)}
                          </td>
                          <td className='py-2 px-2 text-right mono-num text-slate-200'>
                            {fmtEGP(h.currentValue)}
                          </td>
                          <td className='py-2 px-2 text-right'>
                            <div className='flex items-center justify-end gap-1'>
                              {h.gainLoss >= 0 ? (
                                <ArrowUpRight className='w-3 h-3 text-emerald-400' />
                              ) : (
                                <ArrowDownRight className='w-3 h-3 text-red-400' />
                              )}
                              <span
                                className={`mono-num font-medium ${
                                  h.gainLoss >= 0 ? 'text-emerald-400' : 'text-red-400'
                                }`}
                              >
                                {fmtPct(h.gainLossPct)}
                              </span>
                            </div>
                            <div
                              className={`mono-num text-[10px] ${
                                h.gainLoss >= 0 ? 'text-emerald-400/70' : 'text-red-400/70'
                              }`}
                            >
                              {fmtEGP(h.gainLoss)}
                            </div>
                          </td>
                          <td className='py-2 px-2 text-right mono-num text-cyan-400 hidden md:table-cell'>
                            {h.fairValue.toFixed(2)}
                          </td>
                          <td className='py-2 px-2 text-right hidden md:table-cell'>
                            <span
                              className={`mono-num font-medium ${
                                h.marginOfSafety > 0.2
                                  ? 'text-emerald-400'
                                  : h.marginOfSafety > 0
                                  ? 'text-amber-400'
                                  : 'text-red-400'
                              }`}
                            >
                              {fmtPct(h.marginOfSafety * 100)}
                            </span>
                          </td>
                          <td className='py-2 px-2 text-right mono-num text-slate-400 hidden lg:table-cell'>
                            {h.weight.toFixed(1)}%
                          </td>
                          <td className='py-2 px-2 text-right'>
                            <button
                              onClick={() => removeHolding(h.id)}
                              className='text-slate-500 hover:text-red-400 transition-colors p-1'
                              title='Remove holding'
                            >
                              <Trash2 className='w-3 h-3' />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Legal Disclaimer */}
          <LegalDisclaimer variant='inline' />
        </>
      )}

      {/* ─── Create Portfolio Dialog ─────────────────────── */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className='sm:max-w-md' style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}>
          <DialogHeader>
            <DialogTitle className='text-white'>Create New Portfolio</DialogTitle>
            <DialogDescription className='text-slate-400'>
              Name your portfolio to start tracking your EGX investments.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-3 py-2'>
            <div>
              <Label className='text-slate-300 text-xs'>Portfolio Name</Label>
              <Input
                placeholder='e.g. Long-term Holdings'
                value={newPortfolioName}
                onChange={(e) => setNewPortfolioName(e.target.value)}
                className='bg-slate-800 border-slate-700 text-white mt-1'
                onKeyDown={(e) => {
                  if (e.key === 'Enter') createPortfolio()
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setShowCreateDialog(false)}
              className='border-slate-600 text-slate-300'
            >
              Cancel
            </Button>
            <Button
              onClick={createPortfolio}
              disabled={!newPortfolioName.trim() || submitting}
              className='bg-cyan-600 hover:bg-cyan-700 text-white'
            >
              {submitting ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Add Holding Dialog ──────────────────────────── */}
      <Dialog open={showAddHoldingDialog} onOpenChange={setShowAddHoldingDialog}>
        <DialogContent className='sm:max-w-md' style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}>
          <DialogHeader>
            <DialogTitle className='text-white'>Add Holding</DialogTitle>
            <DialogDescription className='text-slate-400'>
              Add a stock position to your portfolio.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-3 py-2'>
            <div>
              <Label className='text-slate-300 text-xs'>Stock</Label>
              <Select
                value={addForm.stockId}
                onValueChange={(value) =>
                  setAddForm((prev) => ({ ...prev, stockId: value }))
                }
              >
                <SelectTrigger className='bg-slate-800 border-slate-700 text-white mt-1 w-full'>
                  <SelectValue placeholder='Select a stock...' />
                </SelectTrigger>
                <SelectContent
                  className='bg-slate-800 border-slate-700 max-h-60'
                >
                  {stocks.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <span className='mono-num font-semibold text-cyan-400 mr-2'>
                        {s.ticker}
                      </span>
                      <span className='text-slate-300'>{s.name}</span>
                      <span className='text-slate-500 ml-2 mono-num'>
                        EGP {s.price.toFixed(2)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div>
                <Label className='text-slate-300 text-xs'>Quantity</Label>
                <Input
                  type='number'
                  placeholder='100'
                  value={addForm.quantity}
                  onChange={(e) =>
                    setAddForm((prev) => ({ ...prev, quantity: e.target.value }))
                  }
                  className='bg-slate-800 border-slate-700 text-white mt-1'
                  min='0'
                  step='1'
                />
              </div>
              <div>
                <Label className='text-slate-300 text-xs'>Cost Basis (EGP/share)</Label>
                <Input
                  type='number'
                  placeholder={selectedStock?.price.toFixed(2) || '0.00'}
                  value={addForm.costBasis}
                  onChange={(e) =>
                    setAddForm((prev) => ({ ...prev, costBasis: e.target.value }))
                  }
                  className='bg-slate-800 border-slate-700 text-white mt-1'
                  min='0'
                  step='0.01'
                />
              </div>
            </div>
            {selectedStock && addForm.quantity && (
              <div className='p-2 rounded-lg bg-slate-800/50 text-xs text-slate-400'>
                Total: {fmtEGP(parseFloat(addForm.quantity || '0') * selectedStock.price)} at current price
                {addForm.costBasis && (
                  <span className='ml-2'>
                    | Cost: {fmtEGP(parseFloat(addForm.quantity) * parseFloat(addForm.costBasis))}
                  </span>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setShowAddHoldingDialog(false)
                setAddForm({ stockId: '', quantity: '', costBasis: '' })
              }}
              className='border-slate-600 text-slate-300'
            >
              Cancel
            </Button>
            <Button
              onClick={addHolding}
              disabled={!addForm.stockId || !addForm.quantity || !addForm.costBasis || submitting}
              className='bg-cyan-600 hover:bg-cyan-700 text-white'
            >
              {submitting ? 'Adding...' : 'Add Holding'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
