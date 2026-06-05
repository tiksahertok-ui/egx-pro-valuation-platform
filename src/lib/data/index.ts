/**
 * EGX Pro Valuation Platform - Data Module Index
 * Re-exports all data services for convenient access
 */

// Master stock list
export {
  EGX_STOCKS,
  EGX_STOCKS_MASTER,
  EGX_SECTORS,
  EGX_STOCK_COUNT,
  getStockByTicker,
  getStocksBySector,
  getAllSectors,
  getSectorNameAr,
} from './egx-stocks-master';
export type { EGXStockMaster } from './egx-stocks-master';

// Data fetching service
export {
  fetchStockPrice,
  batchFetchPrices,
  fetchFinancialData,
  refreshAllStockPrices,
  refreshFinancialData,
  refreshStalePrices,
  refreshAllFinancials,
  fetchStockPriceHistory,
  fetchAllPriceHistory,
  computeTechnicalIndicators,
  recomputeSectorStats,
  seedAllStocks,
  seedStocksFromMaster,
} from './egx-data-service';
export type {
  StockPrice,
  FinancialData,
  PriceHistoryPoint,
  RefreshResult,
  SeedResult,
} from './egx-data-service';

// Technical indicators
export {
  computeAllIndicators,
  computeAndStoreIndicators,
  computeAllStocksIndicators,
  computeSMA,
  computeEMA,
  computeRSI,
  computeMACD,
  computeBollingerBands,
  computeATR,
  computeADX,
  computeStochastic,
  computeWilliamsR,
  computeCCI,
  computeOBV,
} from './technical-computer';
export type { PriceBar, TechnicalIndicators as TechnicalIndicatorsData } from './technical-computer';
