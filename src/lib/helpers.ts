// ============================================================
// EGX Pro - Helper Functions
// ============================================================

export function formatNumber(num: number): string {
  if (!num && num !== 0) return '-';
  if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toFixed(2);
}

export function formatPrice(num: number): string {
  if (!num) return '-';
  return 'EGP ' + num.toFixed(2);
}

export function formatMarketCap(num: number): string {
  if (!num) return '-';
  if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  return num.toLocaleString();
}

export function safeToFixed(val: number | undefined | null, digits: number = 2): string {
  if (val == null || !isFinite(val)) return '—';
  return val.toFixed(digits);
}

export function getVerdictLabel(verdict: string): string {
  switch (verdict) {
    case 'undervalued':
    case 'strong_buy':
    case 'buy':
      return 'Undervalued';
    case 'overvalued':
    case 'strong_sell':
    case 'sell':
      return 'Overvalued';
    case 'fair':
    case 'hold':
      return 'Fair Value';
    default:
      return verdict;
  }
}

export function getVerdictColor(verdict: string): string {
  switch (verdict) {
    case 'undervalued':
    case 'strong_buy':
    case 'buy':
      return 'text-emerald-500';
    case 'overvalued':
    case 'strong_sell':
    case 'sell':
      return 'text-red-500';
    default:
      return 'text-amber-500';
  }
}

export function getVerdictBg(verdict: string): string {
  switch (verdict) {
    case 'undervalued':
    case 'strong_buy':
    case 'buy':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    case 'overvalued':
    case 'strong_sell':
    case 'sell':
      return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
    default:
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
  }
}

export function getOverallVerdictLabel(verdict: string): string {
  switch (verdict) {
    case 'strong_buy': return 'Strong Buy';
    case 'buy': return 'Buy';
    case 'hold': return 'Hold';
    case 'sell': return 'Sell';
    case 'strong_sell': return 'Strong Sell';
    default: return '—';
  }
}

export const SECTOR_ICONS: Record<string, string> = {
  'Banking': '🏦',
  'Real Estate': '🏗️',
  'Financial Services': '💰',
  'Telecommunications': '📡',
  'Food & Beverages': '🍽️',
  'Food': '🍽️',
  'Construction & Engineering': '⚙️',
  'Construction': '⚙️',
  'Construction Materials': '🧱',
  'Energy': '⚡',
  'Chemicals & Fertilizers': '🧪',
  'Chemicals': '🧪',
  'Electrical Equipment': '🔌',
  'Tobacco': '🚬',
  'Technology': '💻',
  'Tourism': '✈️',
  'Healthcare & Pharma': '🏥',
  'Healthcare': '🏥',
  'Textiles & Retail': '👔',
  'Textiles': '👔',
  'Mining & Materials': '⛏️',
  'Mining': '⛏️',
  'Insurance': '🛡️',
  'Other & Investment': '📦',
  'Transport & Logistics': '🚛',
  'Transport': '🚛',
  'Media & Entertainment': '🎬',
  'Automotive': '🚗',
  'Paper & Packaging': '📄',
  'Industrial': '🏭',
  'Utilities': '💡',
  'Communication Services': '📞',
  'Consumer Discretionary': '🛍️',
  'Consumer Staples': '🛒',
};

export const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export const MODEL_DESCRIPTIONS: Record<string, string> = {
  'dcf': 'Discounted Cash Flow - Values a stock based on projected future cash flows discounted to present value',
  'ddm': 'Dividend Discount Model - Values a stock based on expected future dividends',
  'graham': 'Graham Number - Benjamin Graham\'s formula for intrinsic value: √(22.5 × EPS × BVPS)',
  'relative': 'Relative Valuation - Compares P/E and P/B ratios to sector averages',
  'residual_income': 'Residual Income Model - Values a stock based on economic profit above required return',
  'ev_ebitda': 'EV/EBITDA Multiple - Enterprise value relative to earnings before interest, taxes, depreciation',
  'nav': 'Net Asset Value - Values a stock based on its net assets per share',
  'epv': 'Earnings Power Value - Values a stock based on sustainable earning power',
};
