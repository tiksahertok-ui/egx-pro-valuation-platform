/**
 * EGX Market Hours Utility
 * EGX trading hours: Sunday-Thursday, 10:00-14:30 Cairo time (EET, UTC+2)
 */

const MARKET_OPEN_HOUR = 10;
const MARKET_OPEN_MINUTE = 0;
const MARKET_CLOSE_HOUR = 14;
const MARKET_CLOSE_MINUTE = 30;

// Cairo is UTC+2 (no DST observed in Egypt since 2014)
const CAIRO_OFFSET_HOURS = 2;

/** Get current date/time in Cairo timezone */
export function getCairoTime(date: Date = new Date()): Date {
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  return new Date(utc + CAIRO_OFFSET_HOURS * 3600000);
}

/** Get Cairo day of week (0=Sun, 1=Mon, ..., 4=Thu, 5=Fri, 6=Sat) */
export function getCairoDayOfWeek(date: Date = new Date()): number {
  return getCairoTime(date).getDay();
}

/** Check if the market is currently open */
export function isMarketOpen(date: Date = new Date()): boolean {
  const cairoTime = getCairoTime(date);
  const day = cairoTime.getDay();

  // EGX is closed on Friday (5) and Saturday (6)
  if (day === 5 || day === 6) return false;

  const hour = cairoTime.getHours();
  const minute = cairoTime.getMinutes();
  const timeInMinutes = hour * 60 + minute;
  const openInMinutes = MARKET_OPEN_HOUR * 60 + MARKET_OPEN_MINUTE;
  const closeInMinutes = MARKET_CLOSE_HOUR * 60 + MARKET_CLOSE_MINUTE;

  return timeInMinutes >= openInMinutes && timeInMinutes < closeInMinutes;
}

/** Check if today is a trading day (Sunday-Thursday in Cairo) */
export function isTradingDay(date: Date = new Date()): boolean {
  const day = getCairoDayOfWeek(date);
  return day !== 5 && day !== 6; // Not Friday or Saturday
}

/** Get the next market open time from now */
export function getNextMarketOpen(fromDate: Date = new Date()): Date {
  const cairoTime = getCairoTime(fromDate);
  let day = cairoTime.getDay();

  // If it's a trading day and before market open, return today's open
  if (day !== 5 && day !== 6) {
    const hour = cairoTime.getHours();
    const minute = cairoTime.getMinutes();
    if (hour < MARKET_OPEN_HOUR || (hour === MARKET_OPEN_HOUR && minute < MARKET_OPEN_MINUTE)) {
      const openTime = new Date(cairoTime);
      openTime.setHours(MARKET_OPEN_HOUR, MARKET_OPEN_MINUTE, 0, 0);
      return openTime;
    }
  }

  // Find the next trading day
  let daysToAdd = 1;
  if (day === 4) daysToAdd = 3; // Thursday -> Sunday
  else if (day === 5) daysToAdd = 2; // Friday -> Sunday

  const nextDay = new Date(cairoTime);
  nextDay.setDate(nextDay.getDate() + daysToAdd);
  nextDay.setHours(MARKET_OPEN_HOUR, MARKET_OPEN_MINUTE, 0, 0);
  return nextDay;
}

/** Get the last trading day's date */
export function getLastTradingDay(date: Date = new Date()): Date {
  const cairoTime = getCairoTime(date);
  const day = cairoTime.getDay();

  let daysToSubtract = 0;
  if (day === 0) daysToSubtract = 2; // Sunday -> Thursday
  else if (day === 5) daysToSubtract = 1; // Friday -> Thursday
  else if (day === 6) daysToSubtract = 2; // Saturday -> Thursday
  else daysToSubtract = 1; // Mon-Thu -> previous day

  const lastTrading = new Date(cairoTime);
  lastTrading.setDate(lastTrading.getDate() - daysToSubtract);
  lastTrading.setHours(MARKET_CLOSE_HOUR, MARKET_CLOSE_MINUTE, 0, 0);
  return lastTrading;
}

/** Time until market closes in milliseconds (0 if closed) */
export function timeUntilClose(date: Date = new Date()): number {
  if (!isMarketOpen(date)) return 0;
  const cairoTime = getCairoTime(date);
  const closeTime = new Date(cairoTime);
  closeTime.setHours(MARKET_CLOSE_HOUR, MARKET_CLOSE_MINUTE, 0, 0);
  return Math.max(0, closeTime.getTime() - cairoTime.getTime());
}

/** Price refresh interval: every 15 minutes during market hours */
export const PRICE_REFRESH_INTERVAL_MS = 15 * 60 * 1000;

/** Financials refresh interval: daily */
export const FINANCIALS_REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;

/** Check if prices need refresh based on lastPriceAt timestamp */
export function needsPriceRefresh(lastPriceAt: Date | null, now: Date = new Date()): boolean {
  if (!lastPriceAt) return true;
  const elapsed = now.getTime() - new Date(lastPriceAt).getTime();
  // During market hours, refresh every 15 min
  if (isMarketOpen(now)) {
    return elapsed >= PRICE_REFRESH_INTERVAL_MS;
  }
  // Outside market hours, refresh if data is from before today's session
  return elapsed >= PRICE_REFRESH_INTERVAL_MS * 4; // 1 hour
}

/** Check if financials need refresh based on lastFinancialsAt timestamp */
export function needsFinancialsRefresh(lastFinancialsAt: Date | null, now: Date = new Date()): boolean {
  if (!lastFinancialsAt) return true;
  const elapsed = now.getTime() - new Date(lastFinancialsAt).getTime();
  return elapsed >= FINANCIALS_REFRESH_INTERVAL_MS;
}
