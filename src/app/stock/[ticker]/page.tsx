'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { ChevronLeft, Triangle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import LegalDisclaimer from '@/components/egx/legal-disclaimer'

const StockDetailView = dynamic(() => import('@/components/egx/stock-detail-view'), {
  loading: () => (
    <div className="p-4 space-y-4">
      <Skeleton className="h-32 w-full bg-slate-800 rounded-xl" />
      <Skeleton className="h-10 w-full bg-slate-800 max-w-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-64 bg-slate-800 rounded-xl" />
        <Skeleton className="h-64 bg-slate-800 rounded-xl" />
      </div>
    </div>
  ),
  ssr: false,
})

export default function StockPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = use(params)
  const router = useRouter()

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0e17' }}>
      {/* Header */}
      <header className="flex items-center gap-4 px-4 h-12 border-b" style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
          <div className="w-7 h-7 flex items-center justify-center rounded bg-cyan-500/20">
            <Triangle className="w-4 h-4 text-cyan-400 fill-cyan-400" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white">
            EGX <span className="text-cyan-400">Pro</span>
          </span>
        </div>
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-400 transition-colors ms-4"
        >
          <ChevronLeft className="w-3 h-3" />
          Back to Market Overview
        </button>
      </header>

      {/* Legal Disclaimer */}
      <div className="px-4 pt-2">
        <LegalDisclaimer variant="inline" />
      </div>

      {/* Stock Detail */}
      <main className="p-4">
        <StockDetailView ticker={ticker} onBack={() => router.push('/')} />
      </main>

      {/* Footer Disclaimer */}
      <LegalDisclaimer variant="footer" />
    </div>
  )
}
