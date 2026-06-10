# EGX Pro - Real-Time Price Sync Worker

A standalone cron worker that fetches EGX stock prices from Yahoo Finance and updates the Supabase PostgreSQL database. Runs on 15-minute intervals during EGX trading hours (Sunday–Thursday, 10:00–14:30 Cairo time).

## Features

- **Yahoo Finance Integration**: Fetches live prices from `query1.finance.yahoo.com` using the `.CA` suffix for Cairo-listed stocks (e.g., `COMI.CA`, `EAST.CA`)
- **Hardcoded Fallback**: When Yahoo Finance is unavailable (rate-limited or no data for a ticker), falls back to the hardcoded financial data from `egx-financial-data.ts`
- **Market Hours Awareness**: Only syncs during EGX trading hours (Sun–Thu, 10:00–14:30 Cairo / Africa/Cairo, UTC+2)
- **15-Minute Intervals**: Runs every 15 minutes during trading hours; waits for next market open when closed
- **Database Updates**:
  - `Stock` table: Updates price, marketCap, PE ratio, PB ratio, EPS, bookValuePerShare, 52-week high/low, etc.
  - `PriceHistory` table: Inserts or updates daily OHLCV records
  - `FinancialData` table: Upserts annual financial data from hardcoded fallback
  - `DataRefreshLog` table: Logs every sync cycle with stats and errors
- **Retry Logic**: Exponential backoff retry for failed Yahoo Finance requests
- **Rate Limiting**: 250ms delay between Yahoo Finance API requests to avoid rate limiting
- **Two Modes**: One-shot command or continuous daemon

## Prerequisites

- [Bun](https://bun.sh/) runtime
- Supabase project with the EGX Pro schema (Stock, PriceHistory, FinancialData, DataRefreshLog tables)
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

## Installation

```bash
cd mini-services/price-sync
bun install
```

## Environment Variables

The sync worker reads from the same environment variables as the main Next.js app:

| Variable | Description | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (bypasses RLS) | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Fallback key if service role key is not set | No |

You can set these via:
- `.env` file in the project root (loaded automatically)
- Export them in your shell before running

## Usage

### One-Shot Sync

Run a single sync cycle and exit:

```bash
bun run sync
# or directly:
bun run sync.ts --once
```

Force a sync even when the market is closed:

```bash
bun run sync.ts --once --force
```

### Daemon Mode (Continuous)

Run as a background daemon that automatically syncs during trading hours:

```bash
bun run daemon
# or:
bun run dev
```

The daemon will:
1. Run an immediate sync if the market is open
2. Schedule subsequent syncs every 15 minutes during trading hours
3. Wait for the next market open when the market is closed
4. Auto-restart on file changes (via `bun --hot`)

### Cron Setup (Alternative)

If you prefer system cron instead of the built-in daemon:

```cron
# Run every 15 minutes during EGX trading hours (Sun-Thu)
# Note: System cron uses system timezone, adjust for Cairo (UTC+2)
*/15 8-12 * * 0-4 cd /path/to/egx-pro-valuation-platform/mini-services/price-sync && bun run sync.ts --once
```

> **Note**: System cron times are in the system's local timezone. EGX trading hours 10:00–14:30 Cairo (UTC+2) = 08:00–12:30 UTC.

## How It Works

### Sync Flow

```
For each stock in the Stock table:
  ┌─────────────────────────────────┐
  │ 1. Try Yahoo Finance API        │
  │    GET /v8/finance/chart/{SYMBOL}.CA │
  │    ┌──── Retry up to 2x ────┐   │
  │    │ with exponential backoff │   │
  │    └─────────────────────────┘   │
  └─────────────┬───────────────────┘
                │
       ┌────────┴────────┐
       │ Yahoo Success?  │
       └──┬──────────┬───┘
         Yes        No
          │          │
          ▼          ▼
  ┌────────────┐  ┌──────────────────┐
  │ Use Yahoo  │  │ 2. Use Hardcoded │
  │ price data │  │    Fallback Data │
  └──────┬─────┘  └────────┬─────────┘
         │                 │
         └────────┬────────┘
                  ▼
  ┌──────────────────────────────────┐
  │ 3. Update Stock table            │
  │    - price, PE, PB, EPS, etc.    │
  │    - lastPriceAt, lastSyncedAt   │
  └──────────────┬───────────────────┘
                 ▼
  ┌──────────────────────────────────┐
  │ 4. Upsert PriceHistory record    │
  │    - Today's OHLCV data          │
  └──────────────┬───────────────────┘
                 ▼
  ┌──────────────────────────────────┐
  │ 5. Upsert FinancialData record   │
  │    - Annual financials (fallback)│
  └──────────────┬───────────────────┘
                 ▼
  ┌──────────────────────────────────┐
  │ 6. Log to DataRefreshLog         │
  │    - scope, counts, errors       │
  └──────────────────────────────────┘
```

### Data Sources

| Source | Data Provided | Priority |
|---|---|---|
| Yahoo Finance | Live price, OHLCV, 52-week high/low | Primary |
| Hardcoded Fallback | Price, PE, PB, EPS, marketCap, all financial metrics | Secondary |

When Yahoo Finance succeeds, its price data takes priority. Financial metrics (PE, PB, EPS, etc.) are always populated from the hardcoded fallback since Yahoo rarely provides them for Egyptian stocks. When Yahoo fails entirely, the hardcoded fallback price is used.

### Market Hours

- **EGX Trading Days**: Sunday through Thursday
- **EGX Trading Hours**: 10:00 – 14:30 Cairo time (Africa/Cairo, UTC+2)
- **No DST**: Egypt has not observed DST since 2014

During non-trading hours, the daemon waits and automatically starts syncing at the next market open.

## Monitoring

Check sync status via the `DataRefreshLog` table:

```sql
SELECT * FROM "DataRefreshLog"
WHERE scope = 'price_sync'
ORDER BY "startedAt" DESC
LIMIT 10;
```

## Error Handling

- **Yahoo Finance failures**: Automatic retry with exponential backoff (2 attempts, 1s base delay)
- **Database errors**: Logged and skipped; sync continues with next stock
- **Network timeouts**: 12-second timeout per Yahoo Finance request
- **Rate limiting**: 250ms delay between consecutive Yahoo API calls

## Architecture

```
mini-services/price-sync/
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── sync.ts               # Main sync worker (this file)
└── README.md             # This documentation
```

The sync worker is intentionally standalone — it does not import from the main Next.js project. All stock data and financial metrics are self-contained within `sync.ts` to ensure the service can run independently.
