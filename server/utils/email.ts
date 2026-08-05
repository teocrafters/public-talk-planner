import { Resend } from "resend"
import { consola } from "consola"

let _resend: Resend | undefined

function getResendClient() {
  if (_resend) {
    return _resend
  }

  _resend = new Resend(process.env.RESEND_API_KEY || "dummy-key-for-build")
  return _resend
}

export async function sendVerificationEmail(email: string, verificationUrl: string) {
  // Skip sending email in development and log activation link instead
  const isProduction = process.env.NODE_ENV === "production"
  const hasApiKey = !!process.env.RESEND_API_KEY

  if (!isProduction || !hasApiKey) {
    consola.info("📧 Email verification (Development Mode)")
    consola.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    consola.info(`👤 Email: ${email}`)
    consola.info(`🔗 Activation Link: ${verificationUrl}`)
    consola.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    // Return mock success response for development
    return { id: "dev-email-id" }
  }

  const resend = getResendClient()
  const { data, error } = await resend.emails.send({
    from: "noreply@your-domain.com",
    to: email,
    subject: "Potwierdź swój adres email - Planer Wystąpień",
    html: `
      <h2>Potwierdź swój adres email</h2>
      <p>Kliknij poniższy link, aby aktywować swoje konto:</p>
      <a href="${verificationUrl}">Aktywuj konto</a>
      <p>Link wygaśnie za 24 godziny.</p>
    `,
  })

  if (error) {
    logger.error("Failed to send verification email", { error })
    throw new Error("Failed to send verification email")
  }

  return data
}
