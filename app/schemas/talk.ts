import { z } from "zod"

export const createTalkSchema = (t: (key: string) => string) => {
  return z.object({
    no: z.string().min(1, t("validation.talkNumberRequired")).max(10, t("validation.talkNumberTooLong")),

    title: z
      .string()
      .min(3, t("validation.titleTooShort"))
      .max(500, t("validation.titleTooLong"))
      .transform(s => s.trim()),

    multimediaCount: z
      .number()
      .int(t("validation.mustBeInteger"))
      .min(0, t("validation.multimediaCountRange"))
      .max(50, t("validation.multimediaCountRange")),

    videoCount: z
      .number()
      .int(t("validation.mustBeInteger"))
      .min(0, t("validation.videoCountRange"))
      .max(20, t("validation.videoCountRange")),
  })
}

export const createTalkEditSchema = (t: (key: string) => string) => {
  return createTalkSchema(t).omit({ no: true })
}

export const updateTalkSchema = (t: (key: string) => string) => {
  return createTalkSchema(t).partial()
}

export const talkSchema = z.object({
  no: z.string().min(1, "validation.talkNumberRequired").max(10, "validation.talkNumberTooLong"),

  title: z
    .string()
    .min(3, "validation.titleTooShort")
    .max(500, "validation.titleTooLong")
    .transform(s => s.trim()),

  multimediaCount: z
    .number()
    .int("validation.mustBeInteger")
    .min(0, "validation.multimediaCountRange")
    .max(50, "validation.multimediaCountRange"),

  videoCount: z
    .number()
    .int("validation.mustBeInteger")
    .min(0, "validation.videoCountRange")
    .max(20, "validation.videoCountRange"),
})

export const talkEditSchema = talkSchema.omit({ no: true })

export const talkStatusSchema = (t: (key: string) => string) => {
  return z.object({
    status: z.enum(["circuit_overseer", "will_be_replaced"], {
      message: t("validation.statusInvalid")
    }).nullable(),
  })
}

export type TalkInput = z.infer<typeof talkSchema>
export type TalkEditInput = z.infer<typeof talkEditSchema>
export type TalkUpdateInput = z.infer<ReturnType<typeof updateTalkSchema>>
export type TalkStatusInput = z.infer<ReturnType<typeof talkStatusSchema>>
