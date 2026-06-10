'use client';

import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BarChart3, Sliders, RotateCcw } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import type { ComprehensiveValuation } from '@/lib/valuation-engine';
import { formatPrice } from '@/lib/helpers';

interface ScenarioAnalyzerProps {
  valuation: ComprehensiveValuation;
  currentPrice: number;
}

interface ScenarioState {
  waccShift: number;    // +/- 3% (as decimal, e.g. -0.03 to +0.03)
  growthShift: number;  // +/- 5% (as decimal)
  inflationShift: number; // +/- 5%
  terminalGrowthShift: number; // +/- 2%
}

const DEFAULT_SCENARIO: ScenarioState = {
  waccShift: 0,
  growthShift: 0,
  inflationShift: 0,
  terminalGrowthShift: 0,
};

/**
 * Recalculate approximate fair value under scenario adjustments.
 * Uses a perpetuity-based sensitivity model:
 * FV_scenario ≈ FV_base * (WACC_base - g_base) / (WACC_adj - g_adj)
 */
function recalcFairValue(
  baseValuation: ComprehensiveValuation,
  scenario: ScenarioState,
): { adjustedFV: number; modelImpacts: Array<{ name: string; base: number; adjusted: number; impact: number }> } {
  const baseWacc = 0.19; // Approximate base WACC
  const baseGrowth = 0.025; // Approximate base terminal growth

  const adjWacc = baseWacc + scenario.waccShift;
  const adjGrowth = Math.max(0, baseGrowth + scenario.terminalGrowthShift);

  if (adjWacc <= adjGrowth) return { adjustedFV: 0, modelImpacts: [] };

  const scaleFactor = (baseWacc - baseGrowth) / (adjWacc - adjGrowth);
  const adjustedFV = baseValuation.averageFairValue * scaleFactor;

  // Per-model impacts
  const modelImpacts = baseValuation.models.map(m => {
    const modelScale = m.model === 'dcf' || m.model === 'residual_income' || m.model === 'epv'
      ? scaleFactor
      : m.model === 'graham'
        ? 1 + scenario.growthShift * 2 // Graham is more growth-sensitive
        : 1 + scenario.inflationShift * 0.5; // Relative/ev_ebitda less sensitive
    const adjusted = m.fairValue * modelScale;
    return {
      name: m.modelName,
      base: m.fairValue,
      adjusted: Math.round(adjusted * 100) / 100,
      impact: ((adjusted - m.fairValue) / m.fairValue) * 100,
    };
  });

  return { adjustedFV: Math.round(adjustedFV * 100) / 100, modelImpacts };
}

export function ScenarioAnalyzer({ valuation, currentPrice }: ScenarioAnalyzerProps) {
  const [scenario, setScenario] = useState<ScenarioState>(() => {
    // Load from localStorage if available
    try {
      const saved = localStorage.getItem('egx-scenario-state');
      if (saved) return JSON.parse(saved) as ScenarioState;
    } catch { /* ignore */ }
    return DEFAULT_SCENARIO;
  });

  const { adjustedFV, modelImpacts } = useMemo(
    () => recalcFairValue(valuation, scenario),
    [valuation, scenario]
  );

  const updateScenario = useCallback((key: keyof ScenarioState, value: number) => {
    setScenario(prev => {
      const next = { ...prev, [key]: value };
      try { localStorage.setItem('egx-scenario-state', JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const resetScenario = useCallback(() => {
    setScenario(DEFAULT_SCENARIO);
    try { localStorage.removeItem('egx-scenario-state'); } catch { /* ignore */ }
  }, []);

  // Tornado chart data: sort by absolute impact
  const tornadoData = useMemo(() => {
    if (!modelImpacts.length) return [];
    return [...modelImpacts]
      .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
      .map(m => ({
        name: m.name.length > 15 ? m.name.substring(0, 15) + '...' : m.name,
        impact: Math.round(m.impact * 10) / 10,
        base: m.base,
        adjusted: m.adjusted,
      }));
  }, [modelImpacts]);

  const adjustedUpside = currentPrice > 0 && adjustedFV > 0
    ? ((adjustedFV - currentPrice) / currentPrice) * 100
    : 0;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3 px-4 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-500" />
            Scenario Analysis
          </CardTitle>
          <button
            onClick={resetScenario}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-5">
        {/* Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">WACC Adjustment</Label>
              <span className="text-xs font-mono text-muted-foreground">
                {scenario.waccShift >= 0 ? '+' : ''}{(scenario.waccShift * 100).toFixed(1)}%
              </span>
            </div>
            <Slider
              value={[scenario.waccShift * 100]}
              onValueChange={([v]) => updateScenario('waccShift', (v ?? 0) / 100)}
              min={-300}
              max={300}
              step={25}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>-3.0%</span><span>0%</span><span>+3.0%</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Growth Rate Adjustment</Label>
              <span className="text-xs font-mono text-muted-foreground">
                {scenario.growthShift >= 0 ? '+' : ''}{(scenario.growthShift * 100).toFixed(1)}%
              </span>
            </div>
            <Slider
              value={[scenario.growthShift * 100]}
              onValueChange={([v]) => updateScenario('growthShift', (v ?? 0) / 100)}
              min={-500}
              max={500}
              step={50}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>-5.0%</span><span>0%</span><span>+5.0%</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Inflation Adjustment</Label>
              <span className="text-xs font-mono text-muted-foreground">
                {scenario.inflationShift >= 0 ? '+' : ''}{(scenario.inflationShift * 100).toFixed(1)}%
              </span>
            </div>
            <Slider
              value={[scenario.inflationShift * 100]}
              onValueChange={([v]) => updateScenario('inflationShift', (v ?? 0) / 100)}
              min={-500}
              max={500}
              step={50}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>-5.0%</span><span>0%</span><span>+5.0%</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Terminal Growth Adjustment</Label>
              <span className="text-xs font-mono text-muted-foreground">
                {scenario.terminalGrowthShift >= 0 ? '+' : ''}{(scenario.terminalGrowthShift * 100).toFixed(1)}%
              </span>
            </div>
            <Slider
              value={[scenario.terminalGrowthShift * 100]}
              onValueChange={([v]) => updateScenario('terminalGrowthShift', (v ?? 0) / 100)}
              min={-200}
              max={200}
              step={25}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>-2.0%</span><span>0%</span><span>+2.0%</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Adjusted Fair Value */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/80">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Scenario Fair Value</p>
            <p className="text-xl font-bold font-mono">{adjustedFV > 0 ? formatPrice(adjustedFV) : 'N/A'}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Scenario Upside</p>
            <p className={`text-xl font-bold font-mono ${adjustedUpside > 10 ? 'text-emerald-500' : adjustedUpside < -10 ? 'text-red-500' : 'text-amber-500'}`}>
              {adjustedFV > 0 ? `${adjustedUpside > 0 ? '+' : ''}${adjustedUpside.toFixed(1)}%` : 'N/A'}
            </p>
          </div>
          <div className="text-right">
            <Badge variant="outline" className="text-xs">
              Base: {formatPrice(valuation.averageFairValue)}
            </Badge>
          </div>
        </div>

        {/* Tornado Chart */}
        {tornadoData.length > 0 && (
          <div>
            <h4 className="text-xs font-medium mb-2 flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              Impact by Model (Tornado)
            </h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={tornadoData} layout="vertical" margin={{ left: 80, right: 20, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" width={80} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '10px',
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Impact']}
                />
                <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                  {tornadoData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.impact >= 0 ? '#10b981' : '#ef4444'}
                      fillOpacity={0.7}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
