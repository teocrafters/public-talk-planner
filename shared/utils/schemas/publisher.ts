import { z } from "zod"

export const createPublisherSchema = (t: (key: string) => string) => {
  return z.object({
    firstName: z
      .string()
      .min(1, t("validation.firstNameRequired"))
      .max(100, t("validation.firstNameTooLong"))
      .transform(s => s.trim()),

    lastName: z
      .string()
      .min(1, t("validation.lastNameRequired"))
      .max(100, t("validation.lastNameTooLong"))
      .transform(s => s.trim()),

    userId: z.string().uuid().optional().nullable(),

    isElder: z.boolean().optional().default(false),
    isMinisterialServant: z.boolean().optional().default(false),
    isRegularPioneer: z.boolean().optional().default(false),
    canChairWeekendMeeting: z.boolean().optional().default(false),
    conductsWatchtowerStudy: z.boolean().optional().default(false),
    backupWatchtowerConductor: z.boolean().optional().default(false),
    isReader: z.boolean().optional().default(false),
    offersPublicPrayer: z.boolean().optional().default(false),
    deliversPublicTalks: z.boolean().optional().default(false),
    isCircuitOverseer: z.boolean().optional().default(false),
  })
}

export const updatePublisherSchema = (t: (key: string) => string) => {
  return createPublisherSchema(t).partial()
}

export const linkUserSchema = (_t: (key: string) => string) => {
  return z.object({
    userId: z.string().uuid().nullable(),
  })
}

export type PublisherInput = z.infer<ReturnType<typeof createPublisherSchema>>
export type PublisherUpdateInput = z.infer<ReturnType<typeof updatePublisherSchema>>
export type LinkUserInput = z.infer<ReturnType<typeof linkUserSchema>>
