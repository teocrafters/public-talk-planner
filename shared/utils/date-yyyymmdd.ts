/* eslint-disable @typescript-eslint/unified-signatures */
import type { YYYYMMDD } from "#shared/types/date"
import { toYYYYMMDD } from "#shared/types/date"
import { dayjs } from "./date"

// Format various inputs to YYYY-MM-DD with function overloads
export function formatToYYYYMMDD(date: Date): YYYYMMDD
export function formatToYYYYMMDD(date: string): YYYYMMDD
export function formatToYYYYMMDD(date: number): YYYYMMDD
export function formatToYYYYMMDD(date: Date | string | number): YYYYMMDD {
  const formatted = dayjs(date).format("YYYY-MM-DD")
  return toYYYYMMDD(formatted)
}

/**
 * Check if date is Sunday
 *
 * @param date - YYYYMMDD string to check
 * @returns true if date is Sunday (day() === 0)
 */
export function isSunday(date: YYYYMMDD): boolean {
  return dayjs(date).day() === 0
}

/**
 * Compare two dates
 *
 * @param a - First date
 * @param b - Second date
 * @returns -1 if a < b, 0 if equal, 1 if a > b
 */
export function compareDates(a: YYYYMMDD, b: YYYYMMDD): -1 | 0 | 1 {
  const dateA = dayjs(a)
  const dateB = dayjs(b)

  if (dateA.isBefore(dateB, "day")) return -1
  if (dateA.isAfter(dateB, "day")) return 1
  return 0 // isSame
}

/**
 * Check if two dates are the same day
 * Uses dayjs().isSame() for reliable equality check
 *
 * @param a - First date
 * @param b - Second date
 * @returns true if dates represent the same day
 */
export function isSameDate(a: YYYYMMDD, b: YYYYMMDD): boolean {
  return dayjs(a).isSame(dayjs(b), "day")
}

/**
 * Check if date is in the past
 *
 * @param date - Date to check
 * @returns true if date is before today
 */
export function isPastDate(date: YYYYMMDD): boolean {
  return dayjs(date).isBefore(dayjs(), "day")
}

/**
 * Check if date is in the future
 *
 * @param date - Date to check
 * @returns true if date is after today
 */
export function isFutureDate(date: YYYYMMDD): boolean {
  return dayjs(date).isAfter(dayjs(), "day")
}

/**
 * Get today as YYYY-MM-DD
 *
 * @returns Today's date in YYYYMMDD format
 */
export function getTodayYYYYMMDD(): YYYYMMDD {
  return formatToYYYYMMDD(new Date())
}
