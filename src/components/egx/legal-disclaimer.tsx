'use client'

import { Shield } from 'lucide-react'

interface LegalDisclaimerProps {
  variant?: 'footer' | 'inline' | 'report'
  showBoth?: boolean
}

const DISCLAIMER_EN = "This platform is provided for informational and educational purposes only. It does not constitute investment advice, a solicitation to buy or sell securities, or a financial analysis licensed by the Egyptian Financial Regulatory Authority (FRA). All valuations are model-based estimates that depend on assumptions and may differ materially from actual market values. Past performance is not indicative of future results. Consult a licensed financial advisor before making any investment decision."

const DISCLAIMER_AR = "تُقدَّم هذه المنصة لأغراض إعلامية وتعليمية فقط. لا تُمثّل هذه المنصة نصيحة استثمارية أو عرضاً للشراء أو البيع أو تحليلاً مالياً مرخصاً من الهيئة العامة للرقابة المالية. جميع التقييمات تستند إلى نماذج رياضية تعتمد على افتراضات قد تختلف جوهرياً عن القيم السوقية الفعلية. الأداء السابق ليس مؤشراً موثوقاً على الأداء المستقبلي. يُرجى استشارة مستشار مالي مرخّص قبل اتخاذ أي قرار استثماري."

const SIGNAL_LABEL_EN = "Indicative only — not investment advice"
const SIGNAL_LABEL_AR = "إرشادي فقط — ليس نصيحة استثمارية"

export function SignalLabel() {
  return (
    <span className="text-amber-400 text-[10px] font-medium flex items-center gap-1">
      <Shield className="w-2.5 h-2.5" />
      {SIGNAL_LABEL_EN} | {SIGNAL_LABEL_AR}
    </span>
  )
}

export default function LegalDisclaimer({ variant = 'inline', showBoth = true }: LegalDisclaimerProps) {
  if (variant === 'footer') {
    return (
      <footer className="border-t px-4 py-3" style={{ backgroundColor: '#0a0e17', borderColor: '#1e293b' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start gap-2 mb-1">
            <Shield className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-400 leading-relaxed">{DISCLAIMER_EN}</p>
          </div>
          {showBoth && (
            <div className="flex items-start gap-2">
              <Shield className="w-3 h-3 text-amber-400 shrink-0 mt-0.5 opacity-0" />
              <p className="text-[10px] text-slate-400 leading-relaxed" dir="rtl">{DISCLAIMER_AR}</p>
            </div>
          )}
        </div>
      </footer>
    )
  }

  if (variant === 'report') {
    return (
      <div className="rounded-md p-3 mb-4" style={{ backgroundColor: '#1a1206', border: '1px solid #854d0e' }}>
        <div className="flex items-start gap-2 mb-2">
          <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-200 leading-relaxed">{DISCLAIMER_EN}</p>
        </div>
        {showBoth && (
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 opacity-0" />
            <p className="text-xs text-amber-200 leading-relaxed" dir="rtl">{DISCLAIMER_AR}</p>
          </div>
        )}
      </div>
    )
  }

  // Inline variant (for above valuation cards)
  return (
    <div className="flex items-start gap-1.5 py-1">
      <Shield className="w-3 h-3 text-amber-400/60 shrink-0 mt-0.5" />
      <p className="text-[9px] text-slate-500 leading-relaxed">{DISCLAIMER_EN}</p>
    </div>
  )
}
