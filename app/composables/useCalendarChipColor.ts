import type { DateValue } from "@internationalized/date"

type ChipColor = "red" | "blue" | "green" | "yellow" | "gray" | "purple"

/**
 * Composable for calendar chip color logic
 *
 * Provides functions to determine:
 * - Whether to show a chip on a calendar date
 * - What color the chip should be based on planning status and special dates
 */
export function useCalendarChipColor() {
  /**
   * Determines if a chip should be shown for a given date
   * Shows chips for all Sundays in the future (including today if it's Sunday)
   *
   * @param date - The calendar date value to check
   * @returns true if the date is a Sunday in the future
   */
  function shouldShowChip(date: DateValue): boolean {
    if (!("day" in date)) return false

    const dayjsDate = dayjs(date.toString())

    // Must be Sunday
    if (dayjsDate.day() !== 0) return false

    // Must be today or in future
    return dayjsDate.isSameOrAfter(dayjs(), "day")
  }

  /**
   * Determines the chip color based on planning status and special dates
   *
   * Color logic (priority order):
   * - purple: Exception date (circuit assembly, regional convention, memorial)
   * - blue: Circuit Overseer visit
   * - green: Planned date
   * - red: Unplanned and less than 4 weeks away
   * - yellow: Unplanned and 4+ weeks away
   *
   * @param date - The calendar date value to check
   * @param plannedDates - Array of unix timestamps (seconds) of planned dates
   * @param circuitOverseerDates - Optional array of unix timestamps (seconds) of CO visit dates
   * @param exceptionDates - Optional array of unix timestamps (seconds) of exception dates
   * @returns Color string for UChip component
   */
  function getChipColor(
    date: DateValue,
    plannedDates: number[],
    circuitOverseerDates: number[] = [],
    exceptionDates: number[] = []
  ): ChipColor {
    if (!("day" in date)) return "gray"

    const dayjsDate = dayjs(date.toString())
    const dateToCheck = dayjsDate.toDate()

    // Priority 1: Check if it's an exception date (highest priority)
    const isException = exceptionDates.some(timestamp => {
      const exceptionDate = dayjs.unix(timestamp).utc().toDate()
      return isSameDay(dateToCheck, exceptionDate)
    })
    if (isException) return "purple"

    // Priority 2: Check if it's a Circuit Overseer visit
    const isCircuitOverseer = circuitOverseerDates.some(timestamp => {
      const coDate = dayjs.unix(timestamp).utc().toDate()
      return isSameDay(dateToCheck, coDate)
    })
    if (isCircuitOverseer) return "blue"

    // Priority 3: Check if it's planned
    const isPlanned = plannedDates.some(timestamp => {
      const plannedDate = dayjs.unix(timestamp).utc().toDate()
      return isSameDay(dateToCheck, plannedDate)
    })
    if (isPlanned) return "green"

    // If not planned, check if within 4 weeks
    const fourWeeksFromNow = dayjs().add(4, "week")
    if (dayjsDate.isBefore(fourWeeksFromNow)) {
      return "red" // Less than 4 weeks - red
    }

    return "yellow" // More than 4 weeks - yellow
  }

  return {
    shouldShowChip,
    getChipColor,
  }
}
