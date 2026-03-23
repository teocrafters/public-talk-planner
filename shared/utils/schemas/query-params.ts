import { z } from "zod"

/**
 * Pagination query parameters schema
 */
export const paginationQuerySchema = () =>
  z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50),
  })

/**
 * Sort query parameters schema
 */
export const sortQuerySchema = () =>
  z.object({
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).default("asc"),
  })

/**
 * Date range query parameters schema (YYYY-MM-DD format)
 */
export const dateRangeQuerySchema = (t: (key: string) => string) =>
  z.object({
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, t("validation.invalidDateFormat"))
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, t("validation.invalidDateFormat"))
      .optional(),
  })

/**
 * Combined common query schema (pagination + sort + date range)
 */
export const commonQuerySchema = (t: (key: string) => string) =>
  paginationQuerySchema().merge(sortQuerySchema()).merge(dateRangeQuerySchema(t))

/**
 * UUID parameter schema for route params
 */
export const uuidParamsSchema = (t: (key: string) => string) =>
  z.object({
    id: z.string().uuid(t("validation.invalidUuid")),
  })

export type PaginationQuery = z.infer<ReturnType<typeof paginationQuerySchema>>
export type SortQuery = z.infer<ReturnType<typeof sortQuerySchema>>
export type DateRangeQuery = z.infer<ReturnType<typeof dateRangeQuerySchema>>
export type CommonQuery = z.infer<ReturnType<typeof commonQuerySchema>>
export type UuidParams = z.infer<ReturnType<typeof uuidParamsSchema>>
