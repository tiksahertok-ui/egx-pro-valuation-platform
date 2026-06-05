'use client';

import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ChevronDown, Heart, Info } from 'lucide-react';

/* ───────────────────── New public interfaces ─────────────────── */

export interface HealthScoreBreakdown {
  metric: string;
  label: string;
  labelAr: string;
  value: number;       // actual score awarded
  maxValue: number;    // maximum possible score
  weight: number;      // 0–1
  description: string;
  descriptionAr: string;
}

export interface HealthScorePanelProps {
  score: number;       // 0–100 overall composite score
  breakdown: HealthScoreBreakdown[];
}

/* ───────────── Backward-compat wrapper interface ─────────────── */

interface HealthScorePanelWithTickerProps {
  /** Pass a ticker to auto-fetch from /api/health – backward compat */
  ticker?: string;
  /** Or pass score + breakdown directly */
  score?: number;
  breakdown?: HealthScoreBreakdown[];
}

/* ───────────────────── Legacy API response shape ─────────────── */

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
  rating: string;
  ratingAr: string;
  factors: HealthFactor[];
  methodology: string;
  methodologyAr: string;
}

/* ───────────────────── Colour helpers ────────────────────────── */

const ratingFromScore = (s: number) =>
  s >= 80 ? 'Excellent' : s >= 65 ? 'Good' : s >= 45 ? 'Fair' : s >= 25 ? 'Poor' : 'Distressed';

const ratingArFromScore = (s: number) =>
  s >= 80 ? 'ممتاز' : s >= 65 ? 'جيد' : s >= 45 ? 'مقبول' : s >= 25 ? 'ضعيف' : 'حرج';

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

/** Progress-bar colour based on percentage achieved */
const barColor = (pct: number): string => {
  if (pct >= 0.75) return 'bg-emerald-500';
  if (pct >= 0.55) return 'bg-cyan-500';
  if (pct >= 0.40) return 'bg-amber-500';
  if (pct >= 0.25) return 'bg-orange-500';
  return 'bg-red-500';
};

const gaugeStroke = (score: number): string => {
  if (score >= 75) return '#10b981';
  if (score >= 55) return '#06b6d4';
  if (score >= 40) return '#f59e0b';
  if (score >= 25) return '#f97316';
  return '#ef4444';
};

/* ───────────── Convert legacy API result → new props ─────────── */

function transformHealthResult(result: FinancialHealthResult): {
  score: number;
  breakdown: HealthScoreBreakdown[];
} {
  const breakdown: HealthScoreBreakdown[] = result.factors.map((f) => ({
    metric: f.name.replace(/[^a-zA-Z]/g, '_').toLowerCase(),
    label: f.name,
    labelAr: f.nameAr,
    value: f.score,              // 0–100 score achieved
    maxValue: 100,               // max possible per factor
    weight: f.weight,
    description: f.interpretation,
    descriptionAr: f.interpretationAr,
  }));

  return { score: result.overallScore, breakdown };
}

/* ───────────────────── Circular gauge ────────────────────────── */

function CircularGauge({ score }: { score: number }) {
  const radius = 58;
  const stroke = 8;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const rating = ratingFromScore(score);

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
          stroke={gaugeStroke(score)}
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

/* ───────────────────── Metric row ────────────────────────────── */

function MetricRow({ item }: { item: HealthScoreBreakdown }) {
  const pct = item.maxValue > 0 ? item.value / item.maxValue : 0;
  const ratingKey =
    pct >= 0.75
      ? 'Excellent'
      : pct >= 0.55
        ? 'Good'
        : pct >= 0.40
          ? 'Fair'
          : pct >= 0.25
            ? 'Poor'
            : 'Distressed';

  return (
    <div className="rounded-lg p-3" style={{ backgroundColor: '#0f172a' }}>
      {/* Row 1 — label, Arabic label, badge, weight */}
      <div className="flex items-start justify-between mb-1.5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-200 truncate">
              {item.label}
            </span>
            <span className="text-xs text-slate-500" dir="rtl">
              {item.labelAr}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          <Badge
            variant="outline"
            className={`text-[10px] h-5 border ${ratingBgColors[ratingKey]} ${ratingColors[ratingKey]}`}
          >
            {ratingKey}
          </Badge>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="mono-num text-[10px] text-cyan-400 cursor-help">
                W: {(item.weight * 100).toFixed(0)}%
              </span>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="bg-slate-900 border-slate-700 text-xs text-slate-300"
            >
              Weight in composite score
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Row 2 — score / max + colour-coded progress bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2.5 rounded-full bg-slate-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${barColor(pct)}`}
            style={{ width: `${Math.max(pct * 100, 2)}%` }}
          />
        </div>
        <span className="mono-num text-xs text-slate-200 shrink-0 w-16 text-right">
          {item.value.toFixed(1)}{' '}
          <span className="text-slate-500">/ {item.maxValue.toFixed(0)}</span>
        </span>
      </div>

      {/* Row 3 — description */}
      <p className="text-[11px] text-slate-400 leading-relaxed mt-1.5">
        {item.description}
      </p>
      <p className="text-[11px] text-slate-500 leading-relaxed" dir="rtl">
        {item.descriptionAr}
      </p>
    </div>
  );
}

/* ───────────────────── Main component ────────────────────────── */

export default function HealthScorePanel(props: HealthScorePanelWithTickerProps) {
  const { ticker } = props;

  // State for the fetched-then-transformed path
  const [resolvedScore, setResolvedScore] = useState<number | null>(
    props.score ?? null
  );
  const [resolvedBreakdown, setResolvedBreakdown] = useState<
    HealthScoreBreakdown[] | null
  >(props.breakdown ?? null);
  const [loading, setLoading] = useState(!props.score && !!ticker);
  const [error, setError] = useState<string | null>(null);
  const [methodologyOpen, setMethodologyOpen] = useState(false);
  const [methodology, setMethodology] = useState<{
    en: string;
    ar: string;
  } | null>(null);

  useEffect(() => {
    if (props.score !== undefined && props.breakdown) {
      setResolvedScore(props.score);
      setResolvedBreakdown(props.breakdown);
      return;
    }
    if (!ticker) return;

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
        const health: FinancialHealthResult = data.health;
        const transformed = transformHealthResult(health);
        setResolvedScore(transformed.score);
        setResolvedBreakdown(transformed.breakdown);
        setMethodology({ en: health.methodology, ar: health.methodologyAr });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchHealth();
  }, [ticker, props.score, props.breakdown]);

  /* ─── Loading ────────────────────────────────────────────── */
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
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full bg-slate-800 rounded-lg" />
        ))}
      </div>
    );
  }

  /* ─── Error / No data ────────────────────────────────────── */
  if (error || resolvedScore === null || !resolvedBreakdown || resolvedBreakdown.length === 0) {
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

  const rating = ratingFromScore(resolvedScore);
  const ratingAr = ratingArFromScore(resolvedScore);

  /* ─── Render ─────────────────────────────────────────────── */
  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4">
        {/* ─── Overall Score ──────────────────────────────────── */}
        <div
          className="rounded-xl border p-4"
          style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}
        >
          <div className="flex items-center gap-6">
            <CircularGauge score={resolvedScore} />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Heart className={`w-5 h-5 ${ratingColors[rating]}`} />
                <h3 className="text-sm font-semibold text-slate-300">
                  Financial Health
                </h3>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant="outline"
                  className={`text-sm font-bold border ${ratingBgColors[rating]} ${ratingColors[rating]}`}
                >
                  {rating}
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-sm border ${ratingBgColors[rating]} ${ratingColors[rating]}`}
                  dir="rtl"
                >
                  {ratingAr}
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Composite score across {resolvedBreakdown.length} weighted metrics
              </p>
            </div>
          </div>
        </div>

        {/* ─── Transparent Scorecard Breakdown ─────────────────── */}
        <div
          className="rounded-xl border p-4"
          style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-300">
              Scorecard Breakdown
            </h3>
          </div>

          <div className="space-y-3 max-h-[28rem] overflow-y-auto egx-scrollbar pr-1">
            {resolvedBreakdown.map((item) => (
              <MetricRow key={item.metric} item={item} />
            ))}
          </div>
        </div>

        {/* ─── Weight Allocation Summary ───────────────────────── */}
        <div
          className="rounded-xl border p-4"
          style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}
        >
          <h4 className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            Weight Allocation
          </h4>
          {/* Stacked bar */}
          <div className="h-3 rounded-full bg-slate-800 overflow-hidden flex mb-2">
            {resolvedBreakdown.map((item) => {
              const pct = item.weight * 100;
              const bColor =
                pct >= 20
                  ? 'bg-cyan-500'
                  : pct >= 15
                    ? 'bg-emerald-500'
                    : 'bg-slate-500';
              return (
                <div
                  key={item.metric}
                  className={`h-full ${bColor} transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                  title={`${item.label}: ${pct.toFixed(0)}%`}
                />
              );
            })}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
            {resolvedBreakdown.map((item) => (
              <div
                key={item.metric}
                className="flex items-center justify-between text-[10px]"
              >
                <span className="text-slate-500 truncate">{item.label}</span>
                <span className="mono-num text-slate-300">
                  {(item.weight * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Methodology Disclosure (only when fetched via ticker) */}
        {methodology && (
          <div
            className="rounded-xl border overflow-hidden"
            style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}
          >
            <button
              type="button"
              className="w-full"
              onClick={() => setMethodologyOpen(!methodologyOpen)}
            >
              <div className="flex items-center justify-between p-4 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-medium text-slate-300">
                    Methodology &amp; Transparency
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    methodologyOpen ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>
            {methodologyOpen && (
              <div className="px-4 pb-4 space-y-3 border-t border-slate-700/50 pt-3">
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 mb-1">
                    English
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {methodology.en}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 mb-1">
                    العربية
                  </h4>
                  <p
                    className="text-xs text-slate-400 leading-relaxed"
                    dir="rtl"
                  >
                    {methodology.ar}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
