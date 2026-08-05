export type LogFields = Record<string, unknown>

type LogLevel = "debug" | "info" | "warn" | "error"

/**
 * Structured server logger: one JSON object per line on stdout, so log shipping
 * can parse fields instead of scraping free-form text.
 */
export const logger = {
  debug: (message: string, fields?: LogFields): void => write("debug", message, fields),
  info: (message: string, fields?: LogFields): void => write("info", message, fields),
  warn: (message: string, fields?: LogFields): void => write("warn", message, fields),
  error: (message: string, fields?: LogFields): void => write("error", message, fields),
}

function write(level: LogLevel, message: string, fields?: LogFields): void {
  const record = {
    time: new Date().toISOString(),
    level,
    message,
    ...(fields ? serializeFields(fields) : {}),
  }

  // stderr is left unused: a single stream keeps records in the order they were emitted
  process.stdout.write(`${toLine(record)}\n`)
}

function serializeFields(fields: LogFields): LogFields {
  const serialized: LogFields = {}

  for (const [key, value] of Object.entries(fields)) {
    serialized[key] = value instanceof Error ? describeError(value) : value
  }

  return serialized
}

function describeError(error: Error): LogFields {
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
  }
}

function toLine(record: LogFields): string {
  try {
    return JSON.stringify(record)
  } catch {
    // a circular or throwing field must not take the request down with it
    return JSON.stringify({
      time: record.time,
      level: record.level,
      message: record.message,
      fieldsSerializationFailed: true,
    })
  }
}
