/**
 * Sector-Aware Composite Model Weights
 * Different valuation models are appropriate for different sectors.
 * Weights determine how much each model contributes to the composite fair value.
 */

export interface SectorWeightConfig {
  sector: string;
  weights: Record<string, number>; // model name -> weight (0-1, sum = 1)
  primaryModels: string[]; // models with highest weight for this sector
}

const SECTOR_WEIGHTS: SectorWeightConfig[] = [
  {
    sector: 'Banking',
    weights: { ddm: 0.35, residual_income: 0.35, relative: 0.30, dcf: 0, ev_ebitda: 0, graham: 0, nav: 0, epv: 0 },
    primaryModels: ['ddm', 'residual_income', 'relative'],
  },
  {
    sector: 'Financial Services',
    weights: { ddm: 0.35, residual_income: 0.35, relative: 0.30, dcf: 0, ev_ebitda: 0, graham: 0, nav: 0, epv: 0 },
    primaryModels: ['ddm', 'residual_income', 'relative'],
  },
  {
    sector: 'Real Estate',
    weights: { nav: 0.50, relative: 0.20, ev_ebitda: 0.30, dcf: 0, ddm: 0, graham: 0, residual_income: 0, epv: 0 },
    primaryModels: ['nav', 'ev_ebitda', 'relative'],
  },
  {
    sector: 'Construction & Engineering',
    weights: { nav: 0.50, relative: 0.20, ev_ebitda: 0.30, dcf: 0, ddm: 0, graham: 0, residual_income: 0, epv: 0 },
    primaryModels: ['nav', 'ev_ebitda', 'relative'],
  },
  {
    sector: 'Telecommunications',
    weights: { dcf: 0.35, ev_ebitda: 0.25, relative: 0.15, ddm: 0.15, residual_income: 0.10, graham: 0, nav: 0, epv: 0 },
    primaryModels: ['dcf', 'ev_ebitda', 'relative'],
  },
  {
    sector: 'Energy',
    weights: { dcf: 0.35, ev_ebitda: 0.25, relative: 0.15, ddm: 0.10, residual_income: 0.15, graham: 0, nav: 0, epv: 0 },
    primaryModels: ['dcf', 'ev_ebitda', 'relative'],
  },
  {
    sector: 'Food & Beverages',
    weights: { dcf: 0.35, ev_ebitda: 0.25, relative: 0.15, ddm: 0.10, residual_income: 0.15, graham: 0, nav: 0, epv: 0 },
    primaryModels: ['dcf', 'ev_ebitda', 'relative'],
  },
  {
    sector: 'Chemicals & Fertilizers',
    weights: { dcf: 0.35, ev_ebitda: 0.25, relative: 0.15, ddm: 0.10, residual_income: 0.15, graham: 0, nav: 0, epv: 0 },
    primaryModels: ['dcf', 'ev_ebitda', 'relative'],
  },
  {
    sector: 'Technology',
    weights: { dcf: 0.35, ev_ebitda: 0.25, relative: 0.15, ddm: 0.10, residual_income: 0.15, graham: 0, nav: 0, epv: 0 },
    primaryModels: ['dcf', 'ev_ebitda', 'relative'],
  },
  {
    sector: 'Tobacco',
    weights: { ddm: 0.40, dcf: 0.25, relative: 0.20, residual_income: 0.15, ev_ebitda: 0, graham: 0, nav: 0, epv: 0 },
    primaryModels: ['ddm', 'dcf', 'relative'],
  },
  {
    sector: 'Tourism',
    weights: { dcf: 0.35, ev_ebitda: 0.25, relative: 0.15, nav: 0.15, residual_income: 0.10, ddm: 0, graham: 0, epv: 0 },
    primaryModels: ['dcf', 'ev_ebitda', 'relative'],
  },
  {
    sector: 'Healthcare & Pharma',
    weights: { dcf: 0.35, ev_ebitda: 0.25, relative: 0.15, residual_income: 0.15, ddm: 0.10, graham: 0, nav: 0, epv: 0 },
    primaryModels: ['dcf', 'ev_ebitda', 'relative'],
  },
  {
    sector: 'Textiles & Retail',
    weights: { dcf: 0.30, ev_ebitda: 0.25, relative: 0.20, epv: 0.15, residual_income: 0.10, ddm: 0, graham: 0, nav: 0 },
    primaryModels: ['dcf', 'ev_ebitda', 'relative'],
  },
  {
    sector: 'Other & Investment',
    weights: { dcf: 0.30, ev_ebitda: 0.25, relative: 0.20, nav: 0.15, residual_income: 0.10, ddm: 0, graham: 0, epv: 0 },
    primaryModels: ['dcf', 'ev_ebitda', 'relative'],
  },
];

const DEFAULT_WEIGHTS: SectorWeightConfig = {
  sector: 'Default',
  weights: { dcf: 0.30, ev_ebitda: 0.20, relative: 0.20, graham: 0.15, residual_income: 0.10, nav: 0.05, ddm: 0, epv: 0 },
  primaryModels: ['dcf', 'ev_ebitda', 'relative'],
};

export function getSectorWeights(sector: string): SectorWeightConfig {
  const found = SECTOR_WEIGHTS.find(w =>
    w.sector.toLowerCase() === sector.toLowerCase() ||
    sector.toLowerCase().includes(w.sector.toLowerCase()) ||
    w.sector.toLowerCase().includes(sector.toLowerCase())
  );
  return found || DEFAULT_WEIGHTS;
}

export function isModelSectorAppropriate(model: string, sector: string): boolean {
  const config = getSectorWeights(sector);
  return config.primaryModels.includes(model);
}

export function getAllSectorWeightConfigs(): SectorWeightConfig[] {
  return [...SECTOR_WEIGHTS];
}
