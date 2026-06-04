'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileText,
  Sparkles,
  Clock,
  Languages,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';
import { formatPrice } from '@/app/page';
import LegalDisclaimer from './legal-disclaimer';

interface Report {
  id: string;
  title: string;
  titleAr: string;
  content: string;
  contentAr: string;
  rating: string;
  targetPrice: number;
  language: string;
  createdAt: string;
}

interface AIReportPanelProps {
  ticker: string;
}

function RatingBadge({ rating }: { rating: string }) {
  const config: Record<string, { bg: string; text: string; border: string }> = {
    'Strong Buy': {
      bg: 'rgba(16,185,129,0.2)',
      text: '#10b981',
      border: 'rgba(16,185,129,0.5)',
    },
    Buy: {
      bg: 'rgba(16,185,129,0.12)',
      text: '#34d399',
      border: 'rgba(16,185,129,0.3)',
    },
    Hold: {
      bg: 'rgba(245,158,11,0.12)',
      text: '#f59e0b',
      border: 'rgba(245,158,11,0.3)',
    },
    Sell: {
      bg: 'rgba(239,68,68,0.12)',
      text: '#f87171',
      border: 'rgba(239,68,68,0.3)',
    },
    'Strong Sell': {
      bg: 'rgba(239,68,68,0.2)',
      text: '#ef4444',
      border: 'rgba(239,68,68,0.5)',
    },
  };
  const c = config[rating] || config['Hold'];
  return (
    <span
      className='inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold border'
      style={{
        backgroundColor: c.bg,
        color: c.text,
        borderColor: c.border,
      }}
    >
      {rating}
    </span>
  );
}

export default function AIReportPanel({ ticker }: AIReportPanelProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showArabic, setShowArabic] = useState(false);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/report/${ticker}`);
        const data = await res.json();
        setReports(data.reports || []);
        if (data.reports?.length > 0) {
          setSelectedReport(data.reports[0]);
        }
      } catch (err) {
        console.error('Failed to fetch reports:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [ticker]);

  const generateReport = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/report/${ticker}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: 'en' }),
      });
      const data = await res.json();
      // Refresh reports
      const refreshRes = await fetch(`/api/report/${ticker}`);
      const refreshData = await refreshRes.json();
      setReports(refreshData.reports || []);
      if (data.id) {
        setSelectedReport({
          id: data.id,
          title: data.title,
          titleAr: data.titleAr,
          content: data.content,
          contentAr: data.contentAr,
          rating: data.rating,
          targetPrice: data.targetPrice,
          language: data.language,
          createdAt: data.createdAt,
        });
      }
    } catch (err) {
      console.error('Failed to generate report:', err);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className='space-y-4'>
        <Skeleton className='h-12 bg-slate-800 rounded-xl max-w-xs' />
        <Skeleton className='h-96 bg-slate-800 rounded-xl' />
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* ─── Generate Button ────────────────────────────── */}
      <div
        className='rounded-xl border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3'
        style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}
      >
        <div>
          <h3 className='text-sm font-semibold text-slate-300 flex items-center gap-2'>
            <Sparkles className='w-4 h-4 text-cyan-400' />
            AI Equity Research Analyst
          </h3>
          <p className='text-xs text-slate-500 mt-1'>
            Generate institutional-grade equity research using AI analysis of
            financial data, valuations, and market conditions.
          </p>
        </div>
        <Button
          onClick={generateReport}
          disabled={generating}
          className='bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-semibold shrink-0'
        >
          {generating ? (
            <>
              <div className='w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin mr-2' />
              Generating Report...
            </>
          ) : (
            <>
              <Sparkles className='w-4 h-4 mr-2' />
              Generate AI Report
            </>
          )}
        </Button>
      </div>

      {/* ─── Report Display ─────────────────────────────── */}
      {selectedReport ? (
        <Card style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}>
          <LegalDisclaimer variant='report' />
          <CardHeader className='pb-3 pt-4 px-4'>
            <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3'>
              <div>
                <CardTitle className='text-sm font-semibold text-slate-300 flex items-center gap-2'>
                  <FileText className='w-4 h-4 text-cyan-400' />
                  {selectedReport.title}
                </CardTitle>
                <div className='flex items-center gap-2 mt-1'>
                  <Clock className='w-3 h-3 text-slate-500' />
                  <span className='text-[10px] text-slate-500'>
                    {new Date(selectedReport.createdAt).toLocaleDateString(
                      'en-US',
                      {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      }
                    )}
                  </span>
                  <Badge
                    variant='outline'
                    className='text-[10px] h-4 bg-slate-800 border-slate-700 text-slate-400'
                  >
                    <Languages className='w-2.5 h-2.5 mr-1' />
                    EN/AR
                  </Badge>
                </div>
              </div>
              <div className='flex items-center gap-3'>
                <RatingBadge rating={selectedReport.rating} />
                {selectedReport.targetPrice > 0 && (
                  <div className='text-center'>
                    <div className='text-[10px] text-slate-500'>
                      Target Price
                    </div>
                    <div className='mono-num text-sm font-bold text-cyan-400'>
                      {formatPrice(selectedReport.targetPrice)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className='px-4 pb-4'>
            {/* Language Toggle */}
            <div className='flex items-center gap-2 mb-3'>
              <button
                onClick={() => setShowArabic(false)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  !showArabic
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setShowArabic(true)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  showArabic
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                العربية
              </button>
            </div>

            {/* Report Content */}
            <div
              className='rounded-lg p-4 max-h-[600px] overflow-y-auto egx-scrollbar'
              style={{ backgroundColor: '#0f172a' }}
            >
              <div
                className={`prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed ${
                  showArabic ? 'text-right' : 'text-left'
                }`}
                dir={showArabic ? 'rtl' : 'ltr'}
              >
                <div className='whitespace-pre-wrap text-xs leading-relaxed'>
                  {showArabic
                    ? selectedReport.contentAr || selectedReport.content
                    : selectedReport.content}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div
          className='rounded-xl border p-8 text-center'
          style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}
        >
          <AlertTriangle className='w-8 h-8 text-amber-400 mx-auto mb-3' />
          <h3 className='text-sm font-semibold text-slate-300 mb-1'>
            No Reports Available
          </h3>
          <p className='text-xs text-slate-500'>
            Click &quot;Generate AI Report&quot; to create a comprehensive
            equity research analysis.
          </p>
        </div>
      )}

      {/* ─── Report List ────────────────────────────────── */}
      {reports.length > 1 && (
        <Card style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}>
          <CardHeader className='pb-2 pt-4 px-4'>
            <CardTitle className='text-sm font-semibold text-slate-300'>
              Previous Reports ({reports.length})
            </CardTitle>
          </CardHeader>
          <CardContent className='px-4 pb-4'>
            <div className='space-y-2'>
              {reports.map((report) => (
                <div key={report.id}>
                  <button
                    className='w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors hover:bg-slate-800/60'
                    style={{
                      backgroundColor:
                        selectedReport?.id === report.id
                          ? '#0f172a'
                          : 'transparent',
                    }}
                    onClick={() => {
                      setSelectedReport(report);
                      setExpandedReport(
                        expandedReport === report.id
                          ? null
                          : report.id
                      );
                    }}
                  >
                    <div className='flex items-center gap-3'>
                      <RatingBadge rating={report.rating} />
                      <div className='text-left'>
                        <div className='text-xs text-slate-300'>
                          {report.title}
                        </div>
                        <div className='text-[10px] text-slate-500'>
                          {new Date(report.createdAt).toLocaleDateString(
                            'en-US',
                            {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            }
                          )}
                        </div>
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      {report.targetPrice > 0 && (
                        <span className='mono-num text-xs text-cyan-400'>
                          {formatPrice(report.targetPrice)}
                        </span>
                      )}
                      {expandedReport === report.id ? (
                        <ChevronUp className='w-3 h-3 text-slate-500' />
                      ) : (
                        <ChevronDown className='w-3 h-3 text-slate-500' />
                      )}
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
