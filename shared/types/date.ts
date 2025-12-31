// Simplified branded type using template literal pattern
export type YYYYMMDD = `${number}-${number}-${number}` & {
  readonly __brand: "YYYYMMDD"
}

// Type guard
export function isYYYYMMDD(value: string): value is YYYYMMDD {
  return /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(value)
}

// Helper to create branded type (validates at runtime)
export function toYYYYMMDD(value: string): YYYYMMDD {
  if (!isYYYYMMDD(value)) {
    throw new Error(`Invalid YYYY-MM-DD format: ${value}`)
  }
  return value as YYYYMMDD
}
