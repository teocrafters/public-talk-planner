import { z } from "zod"

export const createRegistrationFormSchema = (t: (key: string) => string) => {
  return z
    .object({
      firstName: z
        .string()
        .min(1, t("auth.validation.firstNameRequired"))
        .max(50, t("auth.validation.firstNameTooLong")),

      lastName: z
        .string()
        .min(1, t("auth.validation.lastNameRequired"))
        .max(50, t("auth.validation.lastNameTooLong")),

      email: z
        .string()
        .min(1, t("auth.validation.emailRequired"))
        .email(t("auth.validation.emailInvalid")),

      password: z
        .string()
        .min(8, t("auth.validation.passwordTooShort"))
        .max(128, t("auth.validation.passwordTooLong")),

      confirmPassword: z.string().min(1, t("auth.validation.confirmPasswordRequired")),

      congregationId: z.string().min(1, t("auth.validation.congregationRequired")),
    })
    .refine(data => data.password === data.confirmPassword, {
      message: t("auth.validation.passwordMismatch"),
      path: ["confirmPassword"],
    })
}

export type RegistrationFormSchema = z.infer<ReturnType<typeof createRegistrationFormSchema>>
