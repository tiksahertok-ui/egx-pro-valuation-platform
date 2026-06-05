import { Skeleton } from '@/components/ui/skeleton'

export default function StockLoading() {
  return (
    <div className="min-h-screen p-4 space-y-4" style={{ backgroundColor: '#0a0e17' }}>
      <Skeleton className="h-12 w-64 bg-slate-800" />
      <Skeleton className="h-48 w-full bg-slate-800 rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-64 bg-slate-800 rounded-xl" />
        <Skeleton className="h-64 bg-slate-800 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-48 bg-slate-800 rounded-xl" />
        <Skeleton className="h-48 bg-slate-800 rounded-xl" />
        <Skeleton className="h-48 bg-slate-800 rounded-xl" />
      </div>
    </div>
  )
}
