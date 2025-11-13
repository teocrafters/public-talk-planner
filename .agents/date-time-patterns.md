# Date and Time Patterns

Comprehensive guidelines for date and time operations in the Public Talk Planner project using dayjs utility.

## Core Principles

- ALWAYS use dayjs from `~/app/utils/date.ts` (pre-configured with plugins)
- NEVER import dayjs directly from the package
- USE unix timestamps (seconds since epoch) for API communication
- USE UTC timezone for data storage and transmission
- USE Polish locale for user-facing date displays
- EXTEND `app/utils/date.ts` when additional plugins are needed

## Import Patterns

### Correct Import

```typescript
// ✅ Import pre-configured dayjs and utilities
import { dayjs, formatDatePL, dateToUnixTimestamp, unixTimestampToDate } from "~/app/utils/date"

// Use dayjs with plugins already configured
const now = dayjs()
const utcDate = dayjs.utc()
```

### Anti-Patterns

```typescript
// ❌ Wrong: Direct import bypasses plugin configuration
import dayjs from "dayjs"

// ❌ Wrong: Manual plugin setup duplicates configuration
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
dayjs.extend(utc)
```

## Unix Timestamp Patterns

### Why Unix Timestamps

- CONSISTENT across all timezones (UTC-based)
- EFFICIENT for storage (integer vs ISO string)
- SAFE from timezone conversion bugs
- COMPATIBLE with Drizzle ORM integer columns
- STANDARD for API data exchange

### Converting to Unix Timestamp

```typescript
import { dateToUnixTimestamp, dayjs } from "~/app/utils/date"

// ✅ From Date object
const date = new Date()
const timestamp = dateToUnixTimestamp(date) // Returns seconds

// ✅ From dayjs object
const timestamp = dayjs().unix() // Returns seconds

// ✅ From ISO string
const timestamp = dayjs("2025-01-15T12:00:00Z").unix()
```

### Converting from Unix Timestamp

```typescript
import { unixTimestampToDate, dayjs } from "~/app/utils/date"

// ✅ To Date object
const timestamp = 1736942400
const date = unixTimestampToDate(timestamp)

// ✅ To dayjs object for manipulation
const dayjsDate = dayjs.unix(timestamp)
const formatted = dayjsDate.format("YYYY-MM-DD")
```

## API Data Exchange Patterns

### Sending Data to API

```typescript
import { dateToUnixTimestamp, dayjs } from "~/app/utils/date"

// ✅ Send unix timestamp to API
const formData = {
	title: "Meeting",
	scheduledDate: dateToUnixTimestamp(selectedDate), // seconds
}

await $fetch("/api/meetings", {
	method: "POST",
	body: formData,
})
```

### Receiving Data from API

```typescript
import { unixTimestampToDate, formatDatePL } from "~/app/utils/date"

// ✅ Convert unix timestamp from API response
const { data: meetings } = await useFetch<Meeting[]>("/api/meetings")

// Use in template with formatDatePL
const displayDate = computed(() => {
	if (!meetings.value?.[0]) return ""
	return formatDatePL(meetings.value[0].scheduledDate) // Handles unix timestamp
})
```

## Date Formatting Patterns

### Polish Locale Formatting

```typescript
import { formatDatePL, dayjs } from "~/app/utils/date"

// ✅ Format for display (handles Date, ISO string, or unix timestamp)
const displayDate = formatDatePL(new Date()) // "poniedziałek, 15 stycznia 2025"
const displayDate = formatDatePL("2025-01-15T12:00:00Z") // Same output
const displayDate = formatDatePL(1736942400) // Same output (unix timestamp in seconds)

// ✅ Custom formatting with Polish locale
const customFormat = dayjs().format("DD MMMM YYYY") // "15 stycznia 2025"
const shortFormat = dayjs().format("DD.MM.YYYY") // "15.01.2025"
```

### UTC Formatting

```typescript
import { dayjs } from "~/app/utils/date"

// ✅ Work with UTC dates
const utcNow = dayjs.utc()
const utcDate = dayjs.utc("2025-01-15")

// Convert to specific timezone
const warsawTime = dayjs.utc().tz("Europe/Warsaw")
```

## Calendar Date Patterns

### Converting CalendarDate to ISO

```typescript
import { calendarDateToISO } from "~/app/utils/date"

// ✅ Convert CalendarDate object to ISO string (noon UTC)
const calendarDate = { year: 2025, month: 1, day: 15 }
const isoString = calendarDateToISO(calendarDate)
// Returns: "2025-01-15T12:00:00.000Z"

// Why noon UTC: Prevents timezone-related date shifts
```

### Date Comparison

```typescript
import { isSameDay, dayjs } from "~/app/utils/date"

// ✅ Compare dates ignoring time
const date1 = new Date("2025-01-15T08:00:00Z")
const date2 = new Date("2025-01-15T20:00:00Z")
const same = isSameDay(date1, date2) // true

// ✅ Other comparisons with dayjs plugins
const isBefore = dayjs(date1).isBefore(date2)
const isAfter = dayjs(date1).isAfter(date2)
const isSameOrAfter = dayjs(date1).isSameOrAfter(date2)
const isSameOrBefore = dayjs(date1).isSameOrBefore(date2)
```

### Getting Current Date

```typescript
import { getToday, dayjs } from "~/app/utils/date"

// ✅ Get start of current day
const today = getToday() // Date object at 00:00:00

// ✅ Get current timestamp
const nowUnix = dayjs().unix() // seconds
const nowISO = dayjs().toISOString()
```

## Component Usage Patterns

### Form Date Input

```vue
<script setup lang="ts">
import { calendarDateToISO, dayjs } from "~/app/utils/date"

const selectedDate = ref<{ year: number; month: number; day: number } | null>(null)

async function handleSubmit() {
	if (!selectedDate.value) return

	// Convert to ISO for storage
	const isoDate = calendarDateToISO(selectedDate.value)

	// Or convert to unix timestamp for API
	const timestamp = dayjs(isoDate).unix()

	await $fetch("/api/meetings", {
		method: "POST",
		body: {
			scheduledDate: timestamp, // Send as unix timestamp
		},
	})
}
</script>
```

### Displaying Dates

```vue
<script setup lang="ts">
import { formatDatePL, unixTimestampToDate } from "~/app/utils/date"
import type { Meeting } from "~/server/database/schema"

const { data: meetings } = await useFetch<Meeting[]>("/api/meetings")

// Format unix timestamp for display
const displayDates = computed(() => {
	return meetings.value?.map((meeting) => ({
		...meeting,
		formattedDate: formatDatePL(meeting.scheduledDate), // Handles unix timestamp
	}))
})
</script>

<template>
	<div v-for="meeting in displayDates" :key="meeting.id">
		{{ meeting.formattedDate }}
	</div>
</template>
```

### Date Range Operations

```vue
<script setup lang="ts">
import { dayjs, dateToUnixTimestamp } from "~/app/utils/date"

const startDate = ref<Date>(new Date())
const endDate = ref<Date>(new Date())

// Calculate range
const daysBetween = computed(() => {
	return dayjs(endDate.value).diff(dayjs(startDate.value), "day")
})

// Send range as unix timestamps
async function fetchInRange() {
	const { data } = await useFetch("/api/meetings/range", {
		query: {
			start: dateToUnixTimestamp(startDate.value),
			end: dateToUnixTimestamp(endDate.value),
		},
	})
}
</script>
```

## Database Patterns

### Drizzle Schema with Unix Timestamps

```typescript
// server/database/schema.ts
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core"

export const meetings = sqliteTable("meetings", {
	id: text("id").primaryKey(),
	title: text("title").notNull(),
	// Store as unix timestamp (integer, seconds)
	scheduledDate: integer("scheduled_date", { mode: "number" }).notNull(),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
})

// Use in queries
import { dayjs } from "~/app/utils/date"

const now = dayjs().unix()
await db.insert(meetings).values({
	id: crypto.randomUUID(),
	title: "Meeting",
	scheduledDate: now,
	createdAt: new Date(),
	updatedAt: new Date(),
})
```

### Querying by Date Range

```typescript
import { dayjs } from "~/app/utils/date"
import { and, gte, lte } from "drizzle-orm"

const startTimestamp = dayjs("2025-01-01").unix()
const endTimestamp = dayjs("2025-01-31").unix()

const results = await db
	.select()
	.from(meetings)
	.where(and(gte(meetings.scheduledDate, startTimestamp), lte(meetings.scheduledDate, endTimestamp)))
```

## Extending the Utility

### Adding New Plugins

```typescript
// app/utils/date.ts
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"
import isSameOrBefore from "dayjs/plugin/isSameOrBefore"
import weekOfYear from "dayjs/plugin/weekOfYear" // NEW PLUGIN
import "dayjs/locale/pl"

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)
dayjs.extend(weekOfYear) // EXTEND WITH NEW PLUGIN

dayjs.locale("pl")

export { dayjs }

// Add helper function if needed
export function getWeekNumber(date: Date | string): number {
	return dayjs(date).week()
}
```

## Anti-Patterns to Avoid

### Wrong Date Handling

```typescript
// ❌ Wrong: Using Date constructor with locale strings
const date = new Date("15/01/2025") // Unreliable parsing

// ❌ Wrong: Manual timezone manipulation
const date = new Date()
date.setHours(date.getHours() + 1) // Fragile timezone logic

// ❌ Wrong: String concatenation for dates
const dateString = `${year}-${month}-${day}` // No padding, wrong format

// ✅ Correct: Use dayjs for parsing and manipulation
import { dayjs } from "~/app/utils/date"
const date = dayjs("2025-01-15", "YYYY-MM-DD")
const tomorrow = dayjs().add(1, "day")
```

### Wrong Timestamp Handling

```typescript
// ❌ Wrong: Using milliseconds instead of seconds
const timestamp = Date.now() // Returns milliseconds
await $fetch("/api/meetings", {
	body: { scheduledDate: timestamp }, // Wrong unit!
})

// ❌ Wrong: Mixing timestamp units
const timestamp = dayjs().valueOf() // Returns milliseconds
const unixTimestamp = dayjs().unix() // Returns seconds
// Don't mix these units!

// ✅ Correct: Consistent unix timestamps (seconds)
import { dateToUnixTimestamp } from "~/app/utils/date"
const timestamp = dateToUnixTimestamp(new Date())
await $fetch("/api/meetings", {
	body: { scheduledDate: timestamp }, // Seconds
})
```

### Wrong Import Patterns

```typescript
// ❌ Wrong: Importing dayjs without configuration
import dayjs from "dayjs"
const formatted = dayjs().format("DD MMMM") // Wrong locale!

// ❌ Wrong: Duplicating plugin setup
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
dayjs.extend(utc) // Already done in app/utils/date.ts

// ✅ Correct: Use pre-configured instance
import { dayjs } from "~/app/utils/date"
const formatted = dayjs().format("DD MMMM") // Polish locale applied
```

## Testing Considerations

### Mock Current Time

```typescript
import { dayjs } from "~/app/utils/date"
import { vi } from "vitest"

// Mock current time for consistent tests
const mockDate = new Date("2025-01-15T12:00:00Z")
vi.setSystemTime(mockDate)

// All dayjs() calls will use mocked time
const now = dayjs() // Always 2025-01-15T12:00:00Z during test

// Clean up after test
vi.useRealTimers()
```

### Test Date Calculations

```typescript
import { isSameDay, dayjs } from "~/app/utils/date"
import { expect, test } from "vitest"

test("isSameDay compares dates correctly", () => {
	const date1 = new Date("2025-01-15T08:00:00Z")
	const date2 = new Date("2025-01-15T20:00:00Z")
	const date3 = new Date("2025-01-16T08:00:00Z")

	expect(isSameDay(date1, date2)).toBe(true)
	expect(isSameDay(date1, date3)).toBe(false)
})
```

## Reference Files

- Date utility implementation: `app/utils/date.ts`
- Database schema with timestamps: `server/database/schema.ts`
- i18n date formatting: `@.agents/i18n-patterns.md`
- Drizzle ORM patterns: `@AGENTS.md` (Database section)
- API validation: `@AGENTS.md` (Server-Side Patterns)
