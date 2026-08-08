import type { Job } from "pg-boss"

export interface VerificationEmailPayload {
  email: string
  verificationUrl: string
}

const SUBJECT = "Potwierdź swój adres email - Planer Wystąpień"

/** Queues the message; the registration request must not wait on an external mail service. */
export async function sendVerificationEmail(email: string, verificationUrl: string): Promise<void> {
  const boss = await usePgBoss()
  const jobId = await boss.send(QUEUE_NAMES.SEND_VERIFICATION_EMAIL, { email, verificationUrl })

  if (!jobId) {
    logger.error("Verification email job was not enqueued", { email })
    throw new Error("Verification email was not enqueued")
  }
}

/**
 * Sends one queued verification email. It throws rather than reporting the failure itself, so a
 * transient rejection is retried by the queue instead of the registration losing the user.
 */
export async function handleVerificationEmail(job: Job<VerificationEmailPayload>): Promise<void> {
  const { email, verificationUrl } = job.data

  // no Cloudflare credentials exist outside production, and the logged link is what keeps
  // registration usable there
  if (!isProduction()) {
    logger.info("Verification email logged instead of sent", { email, verificationUrl })
    return
  }

  await sendEmail({
    to: email,
    subject: SUBJECT,
    html: verificationHtml(verificationUrl),
    text: verificationText(verificationUrl),
  })
}

function verificationHtml(verificationUrl: string): string {
  return `
    <h2>Potwierdź swój adres email</h2>
    <p>Kliknij poniższy link, aby aktywować swoje konto:</p>
    <a href="${verificationUrl}">Aktywuj konto</a>
    <p>Link wygaśnie za 24 godziny.</p>
  `
}

function verificationText(verificationUrl: string): string {
  return [
    "Potwierdź swój adres email",
    "Otwórz poniższy link, aby aktywować swoje konto:",
    verificationUrl,
    "Link wygaśnie za 24 godziny.",
  ].join("\n\n")
}
