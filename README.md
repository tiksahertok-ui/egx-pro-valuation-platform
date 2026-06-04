# EGX Pro - Institutional-Grade Egyptian Stock Valuation Platform

A world-class, institutional-grade stock valuation platform for the Egyptian Exchange (EGX), featuring 8 valuation models, AI-powered analyst reports, technical analysis, sector comparison, and bilingual support (Arabic/English).

![EGX Pro](https://img.shields.io/badge/EGX-Pro-cyan?style=for-the-badge&logo=chart-line&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38B2AC?style=flat-square&logo=tailwind-css)

## Features

### Valuation Models (8 Models)
- **DCF FCFF** - Discounted Cash Flow (Free Cash Flow to Firm)
- **DCF FCFE** - Discounted Cash Flow (Free Cash Flow to Equity)
- **DDM** - Dividend Discount Model
- **Residual Income Model** - Economic value-added approach
- **P/E Relative Valuation** - Price-to-Earnings comparison
- **P/B Relative Valuation** - Price-to-Book comparison
- **EV/EBITDA** - Enterprise Value to EBITDA
- **Asset-Based Valuation** - Net Asset Value approach
- **Composite Weighted Model** - Confidence-weighted blend of all models

### Scenario Analysis
- Bear / Base / Bull case modeling for every stock
- Adjustable assumptions per model
- Upside/downside calculation vs. current market price

### Financial Metrics Engine
- **WACC** - Weighted Average Cost of Capital
- **CAPM Cost of Equity** - Risk-adjusted return model
- **Cost of Debt** - After-tax cost of borrowing
- **ROE / ROA / ROIC** - Profitability metrics
- **EPS Growth** - Earnings per share trajectory
- **Revenue CAGR** - Compound annual growth rate
- **Debt Ratios** - Leverage analysis (Debt/Equity, Debt/EBITDA)
- **Margin Analysis** - Gross, Operating, Net margins
- **Financial Health Score** - Composite score (0-100)

### Technical Analysis Engine
- RSI (14), MACD, Bollinger Bands
- SMA (20/50/200), EMA (12/26)
- ATR (14), ADX (14), Stochastic, Williams %R
- CCI (14), OBV
- Automated signal generation (Buy/Sell/Neutral)

### AI-Powered Analyst Reports
- LLM-generated research reports
- Bilingual: Arabic & English
- Automated risk assessment and recommendations

### Sector Comparison Engine
- Radar chart comparison vs. sector averages
- Peer ranking tables
- Sector-level statistics (P/E, P/B, ROE, etc.)

### Economic Impact Dashboard
- CBE interest rates, USD/EGP, Inflation, GDP Growth
- Reserves tracking

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript 5 |
| Styling | TailwindCSS 4, Shadcn UI |
| Charts | Recharts |
| Database | Prisma ORM + SQLite |
| AI | z-ai-web-dev-sdk (LLM) |
| State | Zustand, TanStack Query |

## Design Aesthetic

Inspired by professional financial terminals:
- **Bloomberg Terminal** - Dark theme, data-dense layouts
- **SimplyWallSt** - Snowflake visualizations, fair value gauges
- **TradingView** - Interactive charts, technical indicators

## Getting Started

### Prerequisites
- Node.js 18+
- Bun runtime

### Installation

```bash
# Install dependencies
bun install

# Set up database
bun run db:push

# Seed with EGX stock data (25 stocks, 5 years of financials)
bun run seed

# Start development server
bun run dev
```

### Environment Variables

Create a `.env` file:

```env
DATABASE_URL="file:./dev.db"
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Main dashboard + stock detail
│   ├── layout.tsx                  # App layout with dark theme
│   ├── globals.css                 # Bloomberg-style CSS
│   └── api/
│       ├── stocks/                 # Stock list & detail endpoints
│       ├── valuation/              # 8-model valuation engine
│       ├── metrics/                # Financial metrics calculator
│       ├── technical/              # Technical analysis engine
│       ├── report/                 # AI analyst report generation
│       ├── sectors/                # Sector comparison data
│       └── economic/               # Economic indicators
├── components/
│   ├── egx/
│   │   ├── dashboard-view.tsx      # Market overview dashboard
│   │   ├── stock-detail-view.tsx   # Individual stock analysis
│   │   ├── valuation-panel.tsx     # Fair value + scenarios
│   │   ├── metrics-panel.tsx       # Financial health metrics
│   │   ├── technical-panel.tsx     # Price charts + indicators
│   │   ├── ai-report-panel.tsx     # AI-generated reports
│   │   ├── sector-panel.tsx        # Sector comparison
│   │   └── economic-panel.tsx      # Economic indicators
│   └── ui/                         # Shadcn UI components
├── lib/
│   ├── valuation/                  # 8 valuation model engines
│   ├── metrics/                    # Financial metric calculators
│   ├── technical/                  # Technical analysis engine
│   └── db.ts                       # Database client
└── prisma/
    ├── schema.prisma               # Database schema (8 models)
    └── seed.ts                     # EGX stock data seeder
```

## EGX Stocks Included

25 major EGX-listed companies across 13 sectors:
- **Banking**: CIB, COMI, EGBE, AAIB
- **Real Estate**: TMGH, ORHD, MNHD
- **Telecom**: ETEL
- **Financial Services**: HRHO, EFIH
- **Consumer**: ISPH, SPMD
- **Industrials**: ECIP, AMER
- **Energy**: SUGI
- **And more...**

## License

MIT
