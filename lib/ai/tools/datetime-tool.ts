/**
 * DATE & TIME TOOL
 * 
 * Provides current date and time information to AI agents
 * for reliable temporal context and time-based responses.
 */

export interface DateTimeInfo {
  currentDate: string;
  currentTime: string;
  currentDateTime: string;
  dayOfWeek: string;
  timezone: string;
  timestamp: number;
  iso8601: string;
}

/**
 * Get comprehensive current date and time information
 */
export function getCurrentDateTime(): DateTimeInfo {
  const now = new Date();
  
  // Format options for different components
  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/New_York' // Eastern time for consistency
  };
  
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/New_York'
  };
  
  const dayOfWeekOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    timeZone: 'America/New_York'
  };
  
  const currentDate = now.toLocaleDateString('en-US', dateOptions);
  const currentTime = now.toLocaleTimeString('en-US', timeOptions);
  const dayOfWeek = now.toLocaleDateString('en-US', dayOfWeekOptions);
  const currentDateTime = `${currentDate} at ${currentTime}`;
  
  return {
    currentDate,
    currentTime,
    currentDateTime,
    dayOfWeek,
    timezone: 'Eastern Time (ET)',
    timestamp: now.getTime(),
    iso8601: now.toISOString()
  };
}

/**
 * Format date/time information for AI context
 */
export function formatDateTimeForAI(): string {
  const dateTime = getCurrentDateTime();
  
  return `## CURRENT DATE & TIME:
- **Date**: ${dateTime.currentDate}
- **Time**: ${dateTime.currentTime} ${dateTime.timezone}
- **Day**: ${dateTime.dayOfWeek}
- **Full**: ${dateTime.currentDateTime}

*Note: All times are in Eastern Time (ET). Use this information to provide time-aware responses.*`;
}

/**
 * Get a concise date/time string for logging
 */
export function getDateTimeForLogging(): string {
  const dateTime = getCurrentDateTime();
  return `${dateTime.currentDate} ${dateTime.currentTime} ET`;
}

/**
 * Check if it's a specific time period (useful for context-aware responses)
 */
export function getTimeContext(): {
  isWeekend: boolean;
  isEvening: boolean;
  isMorning: boolean;
  isAfternoon: boolean;
  timeOfDay: 'early morning' | 'morning' | 'afternoon' | 'evening' | 'night';
} {
  const now = new Date();
  const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
  const day = easternTime.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = easternTime.getHours(); // 0-23
  
  const isWeekend = day === 0 || day === 6;
  const isMorning = hour >= 6 && hour < 12;
  const isAfternoon = hour >= 12 && hour < 17;
  const isEvening = hour >= 17 && hour < 21;
  
  let timeOfDay: 'early morning' | 'morning' | 'afternoon' | 'evening' | 'night';
  if (hour >= 4 && hour < 6) timeOfDay = 'early morning';
  else if (hour >= 6 && hour < 12) timeOfDay = 'morning';
  else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
  else if (hour >= 17 && hour < 21) timeOfDay = 'evening';
  else timeOfDay = 'night';
  
  return {
    isWeekend,
    isEvening,
    isMorning,
    isAfternoon,
    timeOfDay
  };
} 