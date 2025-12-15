import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"
import isSameOrBefore from "dayjs/plugin/isSameOrBefore"
import customParseFormat from "dayjs/plugin/customParseFormat"
import "dayjs/locale/pl"

// Extend dayjs with plugins
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)
dayjs.extend(customParseFormat)

// Set Polish locale globally
dayjs.locale("pl")

// AGENT-NOTE: ALWAYS use unix timestamps (seconds) for API exchange and database storage. Never milliseconds.

export { dayjs }

/**
 * Convert CalendarDate to ISO string with time set to 12:00 UTC (noon)
 * This prevents timezone-related date shifts by using middle of the day
 *
 * @param date - CalendarDate object with year, month, day properties
 * @returns ISO 8601 string in UTC (e.g., "2025-01-15T12:00:00.000Z")
 */
export function calendarDateToISO(date: { year: number; month: number; day: number }): string {
  const dateString = `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`
  return dayjs.utc(dateString).hour(12).minute(0).second(0).millisecond(0).toISOString()
}

/**
 * Check if two dates are the same day (ignores time component)
 *
 * @param date1 - First date (Date object or ISO string)
 * @param date2 - Second date (Date object or ISO string)
 * @returns true if dates represent the same calendar day
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  return dayjs(date1).isSame(dayjs(date2), "day")
}

/**
 * Get today's date at midnight (start of day)
 *
 * @returns Date object representing start of current day
 */
export function getToday(): Date {
  return dayjs().startOf("day").toDate()
}

/**
 * Format date for Polish locale display
 *
 * @param date - Date to format (Date object, ISO string, or unix timestamp in seconds)
 * @returns Formatted string in Polish (e.g., "poniedziałek, 15 stycznia 2025")
 */
export function formatDatePL(date: Date | string | number): string {
  return dayjs(typeof date === "number" ? date * 1000 : date).format("dddd, D MMMM YYYY")
}

/**
 * Convert Date to unix timestamp (seconds since epoch)
 *
 * @param date - Date object to convert
 * @returns Unix timestamp in seconds
 */
export function dateToUnixTimestamp(date: Date): number {
  return dayjs(date).unix()
}

/**
 * Convert unix timestamp to Date object
 *
 * @param timestamp - Unix timestamp in seconds
 * @returns Date object
 */
export function unixTimestampToDate(timestamp: number): Date {
  return dayjs.unix(timestamp).toDate()
}
