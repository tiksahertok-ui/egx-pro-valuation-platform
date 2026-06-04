'use client';

import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Heart, Info } from 'lucide-react';

interface HealthFactor {
  name: string;
  nameAr: string;
  value: number;
  score: number;
  weight: number;
  interpretation: string;
  interpretationAr: string;
}

interface FinancialHealthResult {
  overallScore: number;
  rating: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Distressed';
  ratingAr: string;
  factors: HealthFactor[];
  methodology: string;
  methodologyAr: string;
}

interface HealthScorePanelProps {
  ticker: string;
}

const ratingColors: Record<string, string> = {
  Excellent: 'text-emerald-400',
  Good: 'text-cyan-400',
  Fair: 'text-amber-400',
  Poor: 'text-orange-400',
  Distressed: 'text-red-400',
};

const ratingBgColors: Record<string, string> = {
  Excellent: 'bg-emerald-500/10 border-emerald-500/30',
  Good: 'bg-cyan-500/10 border-cyan-500/30',
  Fair: 'bg-amber-500/10 border-amber-500/30',
  Poor: 'bg-orange-500/10 border-orange-500/30',
  Distressed: 'bg-red-500/10 border-red-500/30',
};

const scoreBarColors = (score: number): string => {
  if (score >= 75) return 'bg-emerald-500';
  if (score >= 55) return 'bg-cyan-500';
  if (score >= 40) return 'bg-amber-500';
  if (score >= 25) return 'bg-orange-500';
  return 'bg-red-500';
};

function CircularGauge({ score, rating }: { score: number; rating: string }) {
  const radius = 58;
  const stroke = 8;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const gaugeColor = score >= 75 ? '#10b981' : score >= 55 ? '#06b6d4' : score >= 40 ? '#f59e0b' : score >= 25 ? '#f97316' : '#ef4444';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg height={radius * 2} width={radius * 2} className="-rotate-90">
        <circle
          stroke="#1e293b"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={gaugeColor}
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`mono-num text-3xl font-bold ${ratingColors[rating]}`}>
          {score.toFixed(0)}
        </span>
        <span className="text-[10px] text-slate-500">/ 100</span>
      </div>
    </div>
  );
}

export default function HealthScorePanel({ ticker }: HealthScorePanelProps) {
  const [healthData, setHealthData] = useState<FinancialHealthResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [methodologyOpen, setMethodologyOpen] = useState(false);

  useEffect(() => {
    const fetchHealth = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/health/${ticker}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to fetch health score');
        }
        const data = await res.json();
        setHealthData(data.health);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchHealth();
  }, [ticker]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-28 w-28 rounded-full bg-slate-800" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32 bg-slate-800" />
            <Skeleton className="h-4 w-24 bg-slate-800" />
          </div>
        </div>
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full bg-slate-800 rounded-lg" />
        ))}
      </div>
    );
  }

  if (error || !healthData) {
    return (
      <div
        className="rounded-xl border p-6 text-center"
        style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}
      >
        <Heart className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p className="text-sm text-slate-400">
          {error || 'Financial health data unavailable'}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Insufficient financial data to compute health score
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ─── Overall Score ────────────────────────────────── */}
      <div
        className="rounded-xl border p-4"
        style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}
      >
        <div className="flex items-center gap-6">
          <CircularGauge score={healthData.overallScore} rating={healthData.rating} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Heart className={`w-5 h-5 ${ratingColors[healthData.rating]}`} />
              <h3 className="text-sm font-semibold text-slate-300">
                Financial Health
              </h3>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant="outline"
                className={`text-sm font-bold border ${ratingBgColors[healthData.rating]} ${ratingColors[healthData.rating]}`}
              >
                {healthData.rating}
              </Badge>
              <Badge
                variant="outline"
                className={`text-sm border ${ratingBgColors[healthData.rating]} ${ratingColors[healthData.rating]}`}
                dir="rtl"
              >
                {healthData.ratingAr}
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              Composite score based on {healthData.factors.length} weighted factors
            </p>
          </div>
        </div>
      </div>

      {/* ─── Factor Breakdown ─────────────────────────────── */}
      <div
        className="rounded-xl border p-4"
        style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}
      >
        <h3 className="text-sm font-semibold text-slate-300 mb-3">
          Factor Breakdown
        </h3>
        <div className="space-y-3 max-h-96 overflow-y-auto egx-scrollbar pr-1">
          {healthData.factors.map((factor) => (
            <div
              key={factor.name}
              className="rounded-lg p-3"
              style={{ backgroundColor: '#0f172a' }}
            >
              <div className="flex items-start justify-between mb-1.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-200 truncate">
                      {factor.name}
                    </span>
                    <span className="text-xs text-slate-500" dir="rtl">
                      {factor.nameAr}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant="outline"
                    className={`text-[10px] h-5 border ${ratingBgColors[factor.interpretation === 'Excellent' || factor.interpretation === 'Strong' || factor.interpretation === 'Comfortable' || factor.interpretation === 'Conservative' ? 'Excellent' : factor.interpretation === 'Good' || factor.interpretation === 'Healthy' || factor.interpretation === 'Adequate' || factor.interpretation === 'Positive' || factor.interpretation === 'Moderate' ? 'Good' : factor.interpretation === 'Fair' || factor.interpretation === 'Marginal' || factor.interpretation === 'Tight' || factor.interpretation === 'Thin' || factor.interpretation === 'Mildly Negative' ? 'Fair' : factor.interpretation === 'Poor' || factor.interpretation === 'Weak' || factor.interpretation === 'Low' || factor.interpretation === 'Elevated' ? 'Poor' : 'Distressed']}`}
                  >
                    {factor.interpretation}
                  </Badge>
                  <span className="text-[10px] text-slate-500">
                    W: {(factor.weight * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              {/* Score bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${scoreBarColors(factor.score)}`}
                    style={{ width: `${Math.max(factor.score, 2)}%` }}
                  />
                </div>
                <span className={`mono-num text-xs w-8 text-right ${factor.score >= 55 ? 'text-slate-200' : 'text-slate-400'}`}>
                  {factor.score}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="mono-num text-[10px] text-slate-500">
                  Value: {factor.value > 100 ? 'N/A' : factor.value.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-500" dir="rtl">
                  {factor.interpretationAr}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Methodology Disclosure ───────────────────────── */}
      <Collapsible open={methodologyOpen} onOpenChange={setMethodologyOpen}>
        <div
          className="rounded-xl border overflow-hidden"
          style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}
        >
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-4 hover:bg-slate-800/30 transition-colors">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-slate-300">
                  Methodology & Transparency
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                  methodologyOpen ? 'rotate-180' : ''
                }`}
              />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-3 border-t border-slate-700/50 pt-3">
              <div>
                <h4 className="text-xs font-semibold text-slate-400 mb-1">English</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {healthData.methodology}
                </p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-400 mb-1">العربية</h4>
                <p className="text-xs text-slate-400 leading-relaxed" dir="rtl">
                  {healthData.methodologyAr}
                </p>
              </div>
              <div className="rounded-lg p-3" style={{ backgroundColor: '#0f172a' }}>
                <h4 className="text-xs font-semibold text-slate-400 mb-2">
                  Weight Allocation
                </h4>
                <div className="grid grid-cols-2 gap-1.5">
                  {healthData.factors.map((f) => (
                    <div key={f.name} className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500 truncate">{f.name}</span>
                      <span className="mono-num text-slate-300">{(f.weight * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
}
