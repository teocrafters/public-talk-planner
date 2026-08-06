interface OutboundEmail {
  to: string
  subject: string
  html: string
  text: string
}

interface SendResult {
  success: boolean
  errors: Array<{ code: number; message: string }>
}

/**
 * Sends one message through the Cloudflare Email Service REST endpoint, which needs no Workers
 * binding. It throws on every rejection so the caller's queue decides what a failure costs.
 */
export async function sendEmail(message: OutboundEmail): Promise<void> {
  const { cloudflareAccountId, cloudflareEmailToken, emailFrom } = useRuntimeConfig()

  const response = await fetch(sendEndpoint(cloudflareAccountId), {
    method: "POST",
    headers: {
      authorization: `Bearer ${cloudflareEmailToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ from: emailFrom, ...message }),
  })

  if (!response.ok) {
    throw new Error(
      `Cloudflare Email Service returned ${response.status}: ${await response.text()}`
    )
  }

  const result: SendResult = await response.json()
  if (!result.success) {
    throw new Error(`Cloudflare Email Service rejected the message: ${describe(result.errors)}`)
  }
}

function sendEndpoint(accountId: string): string {
  return `https://api.cloudflare.com/client/v4/accounts/${accountId}/email/sending/send`
}

function describe(errors: SendResult["errors"]): string {
  return errors.map(error => `${error.code} ${error.message}`).join(", ")
}
