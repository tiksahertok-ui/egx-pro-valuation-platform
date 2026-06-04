export type EGXSector =
  | 'Banking'
  | 'RealEstate'
  | 'Telecom'
  | 'FinancialServices'
  | 'Consumer'
  | 'Industrials'
  | 'Energy'
  | 'Default'

export interface ModelWeights {
  dcfFCFF: number
  dcfFCFE: number
  ddm: number
  residualIncome: number
  peRelative: number
  pbRelative: number
  evEbitda: number
  assetBased: number
}

// Weights must sum to 1.0 for each sector
export const SECTOR_WEIGHTS: Record<EGXSector, ModelWeights> = {
  Banking: {
    dcfFCFF: 0.0,   // FCFF inappropriate for banks
    dcfFCFE: 0.25,  // FCFE primary for banks
    ddm: 0.20,      // Banks are dividend payers
    residualIncome: 0.25, // RI/ROE-based classic bank valuation
    peRelative: 0.15,
    pbRelative: 0.15, // P/B critical for banks
    evEbitda: 0.0,   // Not meaningful for financial institutions
    assetBased: 0.0,
  },
  RealEstate: {
    dcfFCFF: 0.15,
    dcfFCFE: 0.10,
    ddm: 0.05,
    residualIncome: 0.10,
    peRelative: 0.10,
    pbRelative: 0.10,
    evEbitda: 0.10,
    assetBased: 0.30, // NAV is the primary methodology
  },
  Telecom: {
    dcfFCFF: 0.35,  // FCF primary for capital-intensive telecoms
    dcfFCFE: 0.10,
    ddm: 0.10,
    residualIncome: 0.10,
    peRelative: 0.10,
    pbRelative: 0.05,
    evEbitda: 0.20, // EV/EBITDA standard telecom multiple
    assetBased: 0.00,
  },
  Industrials: {
    dcfFCFF: 0.30,
    dcfFCFE: 0.10,
    ddm: 0.05,
    residualIncome: 0.10,
    peRelative: 0.15,
    pbRelative: 0.05,
    evEbitda: 0.25,
    assetBased: 0.00,
  },
  Consumer: {
    dcfFCFF: 0.25,
    dcfFCFE: 0.15,
    ddm: 0.10,
    residualIncome: 0.15,
    peRelative: 0.25,
    pbRelative: 0.05,
    evEbitda: 0.05,
    assetBased: 0.00,
  },
  Energy: {
    dcfFCFF: 0.35,
    dcfFCFE: 0.10,
    ddm: 0.05,
    residualIncome: 0.10,
    peRelative: 0.10,
    pbRelative: 0.05,
    evEbitda: 0.25,
    assetBased: 0.00,
  },
  FinancialServices: {
    dcfFCFF: 0.10,
    dcfFCFE: 0.25,
    ddm: 0.15,
    residualIncome: 0.25,
    peRelative: 0.15,
    pbRelative: 0.10,
    evEbitda: 0.00,
    assetBased: 0.00,
  },
  Default: {
    dcfFCFF: 0.20,
    dcfFCFE: 0.15,
    ddm: 0.10,
    residualIncome: 0.15,
    peRelative: 0.15,
    pbRelative: 0.10,
    evEbitda: 0.10,
    assetBased: 0.05,
  },
}

// Map EGX sector names to our sector weight categories
const SECTOR_MAP: Record<string, EGXSector> = {
  'Banking': 'Banking',
  'Real Estate': 'RealEstate',
  'Telecommunications': 'Telecom',
  'Financial Services': 'FinancialServices',
  'Food': 'Consumer',
  'Tobacco': 'Consumer',
  'Construction': 'Industrials',
  'Construction Materials': 'Industrials',
  'Electrical Equipment': 'Industrials',
  'Energy': 'Energy',
  'Chemicals': 'Industrials',
  'Technology': 'Consumer',
  'Tourism': 'Consumer',
}

export function getWeightsForSector(sector: string): ModelWeights {
  const mapped = SECTOR_MAP[sector] ?? 'Default'
  return SECTOR_WEIGHTS[mapped] ?? SECTOR_WEIGHTS.Default
}

export function modelWeightsToArray(weights: ModelWeights): number[] {
  return [
    weights.dcfFCFF,
    weights.dcfFCFE,
    weights.ddm,
    weights.residualIncome,
    weights.peRelative,
    weights.pbRelative,
    weights.evEbitda,
    weights.assetBased,
  ]
}
