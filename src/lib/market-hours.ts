// EGX Market Hours Utility
// EGX operates Sunday-Thursday, 10:00 AM - 2:30 PM Cairo time (EET, UTC+2)

export interface MarketStatus {
  isOpen: boolean
  nextEvent: 'open' | 'close' | 'weekend'
  nextEventTime: Date
  currentSession: 'pre-open' | 'continuous' | 'closing-auction' | 'closed' | 'weekend'
  currentTimeCairo: string
}

// Cairo is UTC+2 (EET), UTC+3 during summer (EE(S)T - Egypt doesn't observe DST consistently)
const CAIRO_OFFSET = 2

function getNowCairo(): Date {
  const now = new Date()
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  return new Date(utc + CAIRO_OFFSET * 3600000)
}

export function getMarketStatus(): MarketStatus {
  const cairo = getNowCairo()
  const day = cairo.getDay() // 0=Sun, 5=Fri, 6=Sat
  const hours = cairo.getHours()
  const minutes = cairo.getMinutes()
  const timeInMinutes = hours * 60 + minutes

  const isWeekend = day === 5 || day === 6 // Friday or Saturday

  // EGX Sessions:
  // Pre-opening: 9:30 - 10:00
  // Continuous trading: 10:00 - 14:15
  // Closing auction: 14:15 - 14:30
  
  if (isWeekend) {
    // Next open is Sunday 10:00
    const daysUntilSunday = day === 5 ? 2 : 1
    const nextOpen = new Date(cairo)
    nextOpen.setDate(nextOpen.getDate() + daysUntilSunday)
    nextOpen.setHours(10, 0, 0, 0)
    return {
      isOpen: false,
      nextEvent: 'weekend',
      nextEventTime: nextOpen,
      currentSession: 'weekend',
      currentTimeCairo: formatTimeCairo(cairo),
    }
  }

  if (timeInMinutes < 570) { // Before 9:30
    const nextOpen = new Date(cairo)
    nextOpen.setHours(9, 30, 0, 0)
    return {
      isOpen: false,
      nextEvent: 'open',
      nextEventTime: nextOpen,
      currentSession: 'closed',
      currentTimeCairo: formatTimeCairo(cairo),
    }
  }

  if (timeInMinutes >= 570 && timeInMinutes < 600) { // 9:30 - 10:00
    const nextOpen = new Date(cairo)
    nextOpen.setHours(10, 0, 0, 0)
    return {
      isOpen: false,
      nextEvent: 'open',
      nextEventTime: nextOpen,
      currentSession: 'pre-open',
      currentTimeCairo: formatTimeCairo(cairo),
    }
  }

  if (timeInMinutes >= 600 && timeInMinutes < 855) { // 10:00 - 14:15
    const nextClose = new Date(cairo)
    nextClose.setHours(14, 15, 0, 0)
    return {
      isOpen: true,
      nextEvent: 'close',
      nextEventTime: nextClose,
      currentSession: 'continuous',
      currentTimeCairo: formatTimeCairo(cairo),
    }
  }

  if (timeInMinutes >= 855 && timeInMinutes < 870) { // 14:15 - 14:30
    const nextClose = new Date(cairo)
    nextClose.setHours(14, 30, 0, 0)
    return {
      isOpen: true,
      nextEvent: 'close',
      nextEventTime: nextClose,
      currentSession: 'closing-auction',
      currentTimeCairo: formatTimeCairo(cairo),
    }
  }

  // After 14:30 - market closed for the day
  let nextOpen: Date
  if (day === 4) { // Thursday - next open is Sunday
    nextOpen = new Date(cairo)
    nextOpen.setDate(nextOpen.getDate() + 3)
    nextOpen.setHours(10, 0, 0, 0)
  } else { // Sunday-Wednesday - next open is tomorrow
    nextOpen = new Date(cairo)
    nextOpen.setDate(nextOpen.getDate() + 1)
    nextOpen.setHours(10, 0, 0, 0)
  }

  return {
    isOpen: false,
    nextEvent: 'open',
    nextEventTime: nextOpen,
    currentSession: 'closed',
    currentTimeCairo: formatTimeCairo(cairo),
  }
}

function formatTimeCairo(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Africa/Cairo' })
}

// Check if a given date was a trading day on EGX
export function isEGXTradingDay(date: Date): boolean {
  const day = date.getDay()
  return day !== 5 && day !== 6 // Not Friday or Saturday
}
