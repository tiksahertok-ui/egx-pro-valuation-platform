'use client';

import { useMemo } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Shield, Target, Calculator, Activity, BarChart3, Info } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import {
  formatPrice, formatMarketCap, formatNumber, safeToFixed,
  getVerdictLabel, getVerdictColor, getVerdictBg,
  getOverallVerdictLabel, MODEL_DESCRIPTIONS,
} from '@/lib/helpers';
import type { StockDetail as StockDetailType } from '@/lib/types';

interface StockDetailPageProps {
  detail: StockDetailType;
  onBack: () => void;
}

export function StockDetailPage({ detail, onBack }: StockDetailPageProps) {
  const { stock, valuation, sectorAvg } = detail;
  const priceHistory = stock.priceHistory || [];

  const chartData = useMemo(() => {
    return priceHistory
      .slice(0, 365)
      .reverse()
      .map(p => ({
        date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        close: p.close,
        volume: p.volume,
        high: p.high,
        low: p.low,
      }));
  }, [priceHistory]);

  const volumeData = useMemo(() => {
    return priceHistory
      .slice(0, 180)
      .reverse()
      .map(p => ({
        date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        volume: p.volume,
      }));
  }, [priceHistory]);

  const latestFinancial = stock.financialData?.[0];
  const latestTech = stock.technicalIndicators?.[0];

  // Find Graham Number model specifically
  const grahamModel = valuation?.models?.find(m => m.model === 'graham');

  // Filter models to show only if confidence > 0.5
  const showFairValue = valuation && valuation.confidenceScore > 0.5;

  const macdHistValue = latestTech?.macdHist ?? latestTech?.macdHistogram;

  // Calculate 52-week range position
  const range52Position = stock.fiftyTwoWeekHigh > 0 && stock.fiftyTwoWeekLow > 0
    ? ((stock.price - stock.fiftyTwoWeekLow) / (stock.fiftyTwoWeekHigh - stock.fiftyTwoWeekLow)) * 100
    : 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0 mt-1" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{stock.name}</h1>
            <Badge variant="outline" className="font-mono text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
              {stock.ticker}
            </Badge>
            <Badge variant="outline" className="text-xs border-border/50">
              {stock.sector}
            </Badge>
          </div>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <span className="text-3xl font-bold font-mono">{stock.price > 0 ? formatPrice(stock.price) : '—'}</span>
            {stock.marketCap > 0 && (
              <span className="text-sm text-muted-foreground font-mono">
                Mkt Cap: {formatMarketCap(stock.marketCap)}
              </span>
            )}
          </div>
          {stock.description && (
            <p className="text-xs text-muted-foreground mt-2 max-w-2xl line-clamp-2">{stock.description}</p>
          )}
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <MetricCard label="P/E Ratio" value={stock.peRatio > 0 ? stock.peRatio.toFixed(1) : '—'} />
        <MetricCard label="P/B Ratio" value={stock.pbRatio > 0 ? stock.pbRatio.toFixed(2) : '—'} />
        <MetricCard label="EPS" value={stock.eps > 0 ? formatPrice(stock.eps) : '—'} />
        <MetricCard label="Book Value" value={stock.bookValuePerShare > 0 ? formatPrice(stock.bookValuePerShare) : '—'} />
        <MetricCard label="Div Yield" value={stock.dividendYield > 0 ? (stock.dividendYield * 100).toFixed(1) + '%' : '—'} />
        <MetricCard label="Beta" value={stock.beta > 0 ? stock.beta.toFixed(2) : '—'} />
      </div>

      {/* 52-Week Range */}
      {stock.fiftyTwoWeekHigh > 0 && stock.fiftyTwoWeekLow > 0 && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>52-Week Low: <span className="font-mono font-medium text-foreground">{formatPrice(stock.fiftyTwoWeekLow)}</span></span>
              <span>52-Week High: <span className="font-mono font-medium text-foreground">{formatPrice(stock.fiftyTwoWeekHigh)}</span></span>
            </div>
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="absolute h-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 rounded-full"
                style={{ width: '100%' }}
              />
              <div
                className="absolute h-full w-1 bg-foreground rounded-full -translate-x-1/2"
                style={{ left: `${Math.min(Math.max(range52Position, 2), 98)}%` }}
              />
            </div>
            <div className="text-center mt-1">
              <span className="text-[10px] text-muted-foreground font-mono">Current: {formatPrice(stock.price)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fair Value Section - CRITICAL */}
      {valuation && (
        <Card className="border-emerald-500/20 bg-emerald-500/5 backdrop-blur-sm">
          <CardHeader className="pb-3 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-500" />
                Fair Value Estimate
              </CardTitle>
              {valuation.confidenceScore > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">Confidence</span>
                  <Progress value={valuation.confidenceScore * 100} className="w-16 h-1.5" />
                  <span className="text-xs font-mono font-medium">
                    {(valuation.confidenceScore * 100).toFixed(0)}%
                  </span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {/* Graham Number - Prominent Display */}
            {grahamModel && (
              <div className="mb-4 p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Graham Number</span>
                  <Badge className={`text-[10px] border ${getVerdictBg(grahamModel.verdict)}`}>
                    {getVerdictLabel(grahamModel.verdict)}
                  </Badge>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {formatPrice(grahamModel.fairValue)}
                  </span>
                  <span className={`text-sm font-mono font-medium ${getVerdictColor(grahamModel.verdict)}`}>
                    {grahamModel.upsideDownside > 0 ? '+' : ''}{grahamModel.upsideDownside.toFixed(1)}%
                    {grahamModel.upsideDownside > 0 ? <TrendingUp className="w-3 h-3 inline ml-1" /> :
                     grahamModel.upsideDownside < 0 ? <TrendingDown className="w-3 h-3 inline ml-1" /> :
                     <Minus className="w-3 h-3 inline ml-1" />}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {MODEL_DESCRIPTIONS['graham']}
                </p>
                <div className="flex gap-4 mt-2 text-[10px] text-muted-foreground font-mono">
                  {Object.entries(grahamModel.assumptions).map(([k, v]) => (
                    <span key={k}>{k}: {typeof v === 'number' ? v.toFixed(2) : v}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Overall Verdict */}
            {showFairValue && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div className="p-3 rounded-lg border border-border/50 bg-card/80">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Average Fair Value</p>
                  <p className="text-lg font-bold font-mono">{formatPrice(valuation.averageFairValue)}</p>
                </div>
                <div className="p-3 rounded-lg border border-border/50 bg-card/80">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Median Fair Value</p>
                  <p className="text-lg font-bold font-mono">{formatPrice(valuation.medianFairValue)}</p>
                </div>
                <div className="p-3 rounded-lg border border-border/50 bg-card/80">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Overall Verdict</p>
                  <p className="text-lg font-bold">{getOverallVerdictLabel(valuation.overallVerdict)}</p>
                </div>
              </div>
            )}

            {/* All 8 Valuation Models */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="models" className="border-border/30">
                <AccordionTrigger className="text-xs font-medium h-9">
                  All Valuation Models ({valuation.models.length})
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {valuation.models.map(model => (
                      <div
                        key={model.model}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          model.model === 'graham' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-border/30 bg-card/50'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold">{model.modelName}</span>
                            {model.model === 'graham' && (
                              <Badge className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                                Key
                              </Badge>
                            )}
                            <Badge className={`text-[9px] border ${getVerdictBg(model.verdict)}`}>
                              {getVerdictLabel(model.verdict)}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{MODEL_DESCRIPTIONS[model.model]}</p>
                          <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground font-mono">
                            {Object.entries(model.assumptions).slice(0, 4).map(([k, v]) => (
                              <span key={k}>{k}: {typeof v === 'number' ? v.toFixed(2) : v}</span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <p className="text-sm font-bold font-mono">{formatPrice(model.fairValue)}</p>
                          <p className={`text-[10px] font-mono ${getVerdictColor(model.verdict)}`}>
                            {model.upsideDownside > 0 ? '+' : ''}{model.upsideDownside.toFixed(1)}%
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Conf: {(model.confidence * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Price Chart & Volume */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              Price History
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <ReferenceLine
                    y={stock.price}
                    stroke="hsl(var(--muted-foreground))"
                    strokeDasharray="5 5"
                    label={{ value: 'Current', position: 'insideTopRight', fontSize: 10 }}
                  />
                  {showFairValue && valuation && (
                    <ReferenceLine
                      y={valuation.averageFairValue}
                      stroke="#10b981"
                      strokeDasharray="3 3"
                      label={{ value: 'Fair Value', position: 'insideTopRight', fontSize: 10, fill: '#10b981' }}
                    />
                  )}
                  <Line type="monotone" dataKey="close" stroke="#10b981" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Info className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No price history available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              Volume
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {volumeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number) => [formatNumber(value), 'Volume']}
                  />
                  <Bar dataKey="volume" fill="#10b981" opacity={0.6} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Info className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No volume data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sector Comparison */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3 px-4 pt-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-500" />
            Sector Comparison ({stock.sector})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">P/E Ratio</p>
              <p className="text-sm font-bold font-mono">{stock.peRatio > 0 ? stock.peRatio.toFixed(1) : '—'}</p>
              <p className="text-[10px] text-muted-foreground">Sector avg: {sectorAvg.avgPE > 0 ? sectorAvg.avgPE.toFixed(1) : '—'}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">P/B Ratio</p>
              <p className="text-sm font-bold font-mono">{stock.pbRatio > 0 ? stock.pbRatio.toFixed(2) : '—'}</p>
              <p className="text-[10px] text-muted-foreground">Sector avg: {sectorAvg.avgPB > 0 ? sectorAvg.avgPB.toFixed(2) : '—'}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">ROE</p>
              <p className="text-sm font-bold font-mono">{latestFinancial?.roe ? (latestFinancial.roe * 100).toFixed(1) + '%' : '—'}</p>
              <p className="text-[10px] text-muted-foreground">Sector avg: {sectorAvg.avgROE > 0 ? (sectorAvg.avgROE * 100).toFixed(1) + '%' : '—'}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">EV/EBITDA</p>
              <p className="text-sm font-bold font-mono">{latestFinancial?.evToEbitda ? latestFinancial.evToEbitda.toFixed(1) : '—'}</p>
              <p className="text-[10px] text-muted-foreground">Sector avg: {sectorAvg.avgEVEbitda > 0 ? sectorAvg.avgEVEbitda.toFixed(1) : '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Indicators */}
      {latestTech && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3 px-4 pt-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              Technical Indicators
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <TechIndicator label="RSI (14)" value={latestTech.rsi14} format={(v) => v.toFixed(1)} warn={v => v > 70 || v < 30} />
              <TechIndicator label="MACD Line" value={latestTech.macdLine} format={(v) => v.toFixed(3)} />
              <TechIndicator label="MACD Signal" value={latestTech.macdSignal} format={(v) => v.toFixed(3)} />
              <TechIndicator label="MACD Histogram" value={macdHistValue} format={(v) => v.toFixed(3)} warn={v => false} />
              <TechIndicator label="SMA 20" value={latestTech.sma20} format={(v) => v.toFixed(2)} />
              <TechIndicator label="SMA 50" value={latestTech.sma50} format={(v) => v.toFixed(2)} />
              <TechIndicator label="SMA 200" value={latestTech.sma200} format={(v) => v.toFixed(2)} />
              <TechIndicator label="BB Upper" value={latestTech.bbUpper} format={(v) => v.toFixed(2)} />
              <TechIndicator label="BB Middle" value={latestTech.bbMiddle} format={(v) => v.toFixed(2)} />
              <TechIndicator label="BB Lower" value={latestTech.bbLower} format={(v) => v.toFixed(2)} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial Data Table */}
      {stock.financialData && stock.financialData.length > 0 && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3 px-4 pt-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-500" />
              Financial Data
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <ScrollArea className="max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/50">
                    <TableHead className="text-xs h-8 sticky top-0 bg-card">Year</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell sticky top-0 bg-card">Revenue</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell sticky top-0 bg-card">Net Income</TableHead>
                    <TableHead className="text-xs sticky top-0 bg-card">ROE</TableHead>
                    <TableHead className="text-xs sticky top-0 bg-card">ROA</TableHead>
                    <TableHead className="text-xs hidden md:table-cell sticky top-0 bg-card">D/E</TableHead>
                    <TableHead className="text-xs sticky top-0 bg-card">EPS</TableHead>
                    <TableHead className="text-xs hidden md:table-cell sticky top-0 bg-card">Gross Margin</TableHead>
                    <TableHead className="text-xs hidden lg:table-cell sticky top-0 bg-card">Op. Margin</TableHead>
                    <TableHead className="text-xs hidden lg:table-cell sticky top-0 bg-card">Profit Margin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stock.financialData.map(fd => (
                    <TableRow key={fd.year} className="border-border/30">
                      <TableCell className="font-mono text-xs font-medium">{fd.year}</TableCell>
                      <TableCell className="hidden sm:table-cell font-mono text-xs">{fd.revenue > 0 ? formatMarketCap(fd.revenue) : '—'}</TableCell>
                      <TableCell className="hidden sm:table-cell font-mono text-xs">{fd.netIncome > 0 ? formatMarketCap(fd.netIncome) : '—'}</TableCell>
                      <TableCell className="font-mono text-xs">{safeToFixed(fd.roe ? fd.roe * 100 : undefined, 1)}%</TableCell>
                      <TableCell className="font-mono text-xs">{safeToFixed(fd.roa ? fd.roa * 100 : undefined, 1)}%</TableCell>
                      <TableCell className="hidden md:table-cell font-mono text-xs">{safeToFixed(fd.debtToEquity, 2)}</TableCell>
                      <TableCell className="font-mono text-xs">{safeToFixed(fd.eps)}</TableCell>
                      <TableCell className="hidden md:table-cell font-mono text-xs">{safeToFixed(fd.grossMargin ? fd.grossMargin * 100 : undefined, 1)}%</TableCell>
                      <TableCell className="hidden lg:table-cell font-mono text-xs">{safeToFixed(fd.operatingMargin ? fd.operatingMargin * 100 : undefined, 1)}%</TableCell>
                      <TableCell className="hidden lg:table-cell font-mono text-xs">{safeToFixed(fd.profitMargin ? fd.profitMargin * 100 : undefined, 1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Company Info */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3 px-4 pt-4">
          <CardTitle className="text-sm font-semibold">Company Information</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <p className="text-muted-foreground">Industry</p>
              <p className="font-medium">{stock.industry || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Shares Outstanding</p>
              <p className="font-mono font-medium">{stock.sharesOutstanding > 0 ? formatNumber(stock.sharesOutstanding) : '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Avg Volume</p>
              <p className="font-mono font-medium">{stock.avgVolume > 0 ? formatNumber(stock.avgVolume) : '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Exchange</p>
              <p className="font-medium">EGX</p>
            </div>
            <div>
              <p className="text-muted-foreground">Currency</p>
              <p className="font-medium">EGP</p>
            </div>
            <div>
              <p className="text-muted-foreground">Last Updated</p>
              <p className="font-mono font-medium">{stock.lastPriceAt ? new Date(stock.lastPriceAt).toLocaleDateString() : '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper sub-components
function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardContent className="p-3">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm font-bold font-mono mt-0.5">{value}</p>
      </CardContent>
    </Card>
  );
}

function TechIndicator({
  label,
  value,
  format: fmt,
  warn,
}: {
  label: string;
  value: number | undefined;
  format: (v: number) => string;
  warn?: (v: number) => boolean;
}) {
  if (value == null || !isFinite(value)) return null;
  const isWarning = warn?.(value);
  return (
    <div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`text-xs font-mono font-medium ${isWarning ? 'text-amber-500' : ''}`}>
        {fmt(value)}
      </p>
    </div>
  );
}

// Loading skeleton for stock detail
export function StockDetailSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start gap-4">
        <Skeleton className="h-8 w-8 rounded" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-6 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
      </div>
      <Skeleton className="h-64 rounded-lg" />
      <Skeleton className="h-48 rounded-lg" />
    </div>
  );
}
