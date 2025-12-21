# Date and Time Patterns

Guidelines for date/time operations using dayjs utility with unix timestamps.

**For dayjs API documentation, use Context7 to query official docs.**

## Critical Project-Specific Rules

⚠️ **ALWAYS import from `~/app/utils/date.ts`** - NEVER import dayjs directly ⚠️ **USE unix
timestamps (seconds)** - For API communication and database storage ⚠️ **STORE as integer** -
Database columns use integer type for unix timestamps ⚠️ **USE Polish locale** - Pre-configured in
app/utils/date.ts

## Import Pattern (CRITICAL)

```typescript
// ✅ CORRECT: Import pre-configured dayjs
import { dayjs, formatDatePL, dateToUnixTimestamp, unixTimestampToDate } from "~/app/utils/date"

// ❌ WRONG: Direct import bypasses configuration
import dayjs from "dayjs"
```

**Why**: `app/utils/date.ts` pre-configures:

- UTC plugin
- Timezone plugin
- Polish locale
- isSameOrAfter/isSameOrBefore plugins

## Unix Timestamp Strategy

**Why unix timestamps**:

- Consistent across timezones (UTC-based)
- Efficient storage (integer vs ISO string)
- Safe from timezone conversion bugs
- Compatible with Drizzle ORM integer columns

### Converting to Unix Timestamp

```typescript
import { dateToUnixTimestamp, dayjs } from "~/app/utils/date"

// From Date object
const timestamp = dateToUnixTimestamp(new Date()) // Returns seconds

// From dayjs object
const timestamp = dayjs().unix() // Returns seconds

// From ISO string
const timestamp = dayjs("2025-01-15T12:00:00Z").unix()
```

### Converting from Unix Timestamp

```typescript
import { unixTimestampToDate, dayjs } from "~/app/utils/date"

// To Date object
const date = unixTimestampToDate(1736942400)

// To dayjs for manipulation
const dayjsDate = dayjs.unix(1736942400)
const formatted = dayjsDate.format("YYYY-MM-DD")
```

## API Data Exchange

### Sending to API

```typescript
import { dateToUnixTimestamp } from "~/app/utils/date"

const formData = {
  title: "Meeting",
  scheduledDate: dateToUnixTimestamp(selectedDate), // seconds
}

await $fetch("/api/meetings", {
  method: "POST",
  body: formData,
})
```

### Receiving from API

```typescript
import { formatDatePL } from "~/app/utils/date"

const { data: meetings } = await useFetch<Meeting[]>("/api/meetings")

// formatDatePL handles unix timestamps
const displayDate = computed(() => {
  if (!meetings.value?.[0]) return ""
  return formatDatePL(meetings.value[0].scheduledDate)
})
```

## Date Formatting

### Polish Locale Formatting

```typescript
import { formatDatePL, dayjs } from "~/app/utils/date"

// Handles Date, ISO string, or unix timestamp
const display = formatDatePL(new Date()) // "poniedziałek, 15 stycznia 2025"
const display = formatDatePL("2025-01-15T12:00:00Z") // Same output
const display = formatDatePL(1736942400) // Same output (unix timestamp)

// Custom formatting with Polish locale
const custom = dayjs().format("DD MMMM YYYY") // "15 stycznia 2025"
```

## CalendarDate Conversion

```typescript
import { calendarDateToISO } from "~/app/utils/date"

const calendarDate = { year: 2025, month: 1, day: 15 }
const isoString = calendarDateToISO(calendarDate)
// Returns: "2025-01-15T12:00:00.000Z" (noon UTC to prevent timezone shifts)
```

## Database Patterns

### Schema with Unix Timestamps

```typescript
// server/database/schema.ts
export const meetings = sqliteTable("meetings", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  // Unix timestamp as integer (seconds)
  scheduledDate: integer("scheduled_date", { mode: "number" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
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
  .where(
    and(gte(meetings.scheduledDate, startTimestamp), lte(meetings.scheduledDate, endTimestamp))
  )
```

## Utility Functions

Available from `~/app/utils/date.ts`:

- `dayjs` - Pre-configured dayjs instance
- `formatDatePL(date)` - Format for Polish display
- `dateToUnixTimestamp(date)` - Convert to seconds
- `unixTimestampToDate(timestamp)` - Convert to Date
- `calendarDateToISO(calendarDate)` - Convert CalendarDate to ISO
- `isSameDay(date1, date2)` - Compare dates ignoring time
- `getToday()` - Get start of current day

## Anti-Patterns

```typescript
// ❌ WRONG: Using milliseconds instead of seconds
const timestamp = Date.now() // Milliseconds!
const timestamp = dayjs().valueOf() // Milliseconds!

// ✅ CORRECT: Unix timestamp in seconds
const timestamp = dayjs().unix() // Seconds
const timestamp = dateToUnixTimestamp(new Date()) // Seconds

// ❌ WRONG: Direct dayjs import
import dayjs from "dayjs"

// ✅ CORRECT: Import from utils
import { dayjs } from "~/app/utils/date"

// ❌ WRONG: Manual plugin setup
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
dayjs.extend(utc)

// ✅ CORRECT: Use pre-configured instance
import { dayjs } from "~/app/utils/date"
```

## Context7 References

**For dayjs API documentation, query via Context7**:

- **dayjs API**: Parsing, formatting, manipulation
- **dayjs plugins**: UTC, timezone, isSameOrBefore, isSameOrAfter
- **Locale configuration**: Polish locale setup

**Query examples**:

- "dayjs format date in specific locale"
- "dayjs unix timestamp conversion"
- "dayjs compare dates"

## References

- Date utility: `app/utils/date.ts`
- Database patterns: `server/AGENTS.md`, `.agents/database-patterns.md`
- dayjs documentation: Use Context7
