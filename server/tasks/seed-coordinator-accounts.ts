import { eq } from "drizzle-orm"
import { generateRandomString } from "better-auth/crypto"
import { organization, member, user, verification } from "../database/auth-schema"
import { publishers } from "../database/schema"
import { serverAuth } from "../utils/auth"
import { generateId } from "better-auth"

const ZYCHLIN_SLUG = "zychlin"

const EMAIL_TO_PUBLISHER_MAP: Record<string, string> = {
  "mateusz.gostanski@gmail.com": "5128086d-7873-4423-8302-86bd80b91f3a",
  "zetbud.firma@gmail.com": "3b48ce50-b772-43ac-a731-c088fca1fb43",
}

const COORDINATOR_ACCOUNTS = [
  {
    email: "mateusz.gostanski@gmail.com",
    name: "Mateusz Gostański",
    role: "boe_coordinator",
  },
  {
    email: "zetbud.firma@gmail.com",
    name: "Zbigniew Dąbrowski",
    role: "public_talk_coordinator",
  },
] as const

export default defineTask({
  meta: {
    name: "db:seed-coordinator-accounts",
    description: "Seed coordinator accounts for Żychlin congregation",
  },
  async run() {
    console.log("Starting coordinator accounts seeding...")

    try {
      const db = useDrizzle()
      const auth = serverAuth()

      // Step 1: Find Żychlin congregation
      console.log(`Looking for Żychlin congregation (slug: ${ZYCHLIN_SLUG})...`)
      const zychlinCongregation = await db.query.organization.findFirst({
        where: eq(organization.slug, ZYCHLIN_SLUG),
      })

      if (!zychlinCongregation) {
        throw new Error(`Żychlin congregation not found (slug: ${ZYCHLIN_SLUG})`)
      }

      console.log(
        `✅ Found Żychlin congregation: ${zychlinCongregation.name} (${zychlinCongregation.id})`
      )

      // Step 2: Create coordinator accounts
      let createdCount = 0
      let skippedCount = 0
      const generatedCredentials: Array<{ email: string; password: string; role: string }> = []

      for (const accountData of COORDINATOR_ACCOUNTS) {
        // Check if user already exists
        const existing = await db.query.user.findFirst({
          where: eq(user.email, accountData.email),
        })

        if (existing) {
          skippedCount++
          console.log(`⏭️  User already exists: ${accountData.email}`)
          continue
        }

        console.log(`Creating coordinator account: ${accountData.email} (${accountData.role})`)

        // Generate secure 24-character password (mixed case + numbers)
        const password = generateRandomString(24, "a-z", "A-Z", "0-9")

        // Create user via Better Auth sign-up API
        const signUpResult = await auth.api.signUpEmail({
          body: {
            email: accountData.email,
            password: password,
            name: accountData.name,
          },
        })

        if (!signUpResult || !signUpResult.user?.id) {
          throw new Error(`Failed to create user: ${accountData.email}`)
        }

        const userId = signUpResult.user.id

        // Set email_verified to true
        await db.update(user).set({ emailVerified: true }).where(eq(user.id, userId))

        // Remove any verification tokens for this user
        await db.delete(verification).where(eq(verification.identifier, accountData.email))

        await db.insert(member).values({
          id: generateId(),
          organizationId: zychlinCongregation.id,
          userId: userId,
          role: accountData.role,
          createdAt: new Date(),
        })

        // Link user to publisher profile if mapping exists
        const publisherId = EMAIL_TO_PUBLISHER_MAP[accountData.email]
        if (publisherId) {
          const publisher = await db.query.publishers.findFirst({
            where: eq(publishers.id, publisherId),
          })

          if (publisher) {
            await db
              .update(publishers)
              .set({ userId: userId })
              .where(eq(publishers.id, publisherId))

            console.log(
              `✅ Linked to publisher profile: ${publisher.firstName} ${publisher.lastName}`
            )
          } else {
            console.warn(`⚠️  Publisher not found (id: ${publisherId})`)
          }
        }

        generatedCredentials.push({
          email: accountData.email,
          password: password,
          role: accountData.role,
        })

        createdCount++
        console.log(`✅ Created coordinator account: ${accountData.email} (${accountData.role})`)
      }

      // Step 3: Display generated credentials
      if (generatedCredentials.length > 0) {
        console.log("\n" + "=".repeat(80))
        console.log("⚠️  GENERATED CREDENTIALS - SAVE THESE SECURELY!")
        console.log("=".repeat(80))

        for (const cred of generatedCredentials) {
          console.log(`Email: ${cred.email}`)
          console.log(`Role: ${cred.role}`)
          console.log(`Password: ${cred.password}`)
          console.log("-".repeat(80))
        }

        console.log("=".repeat(80))
        console.log("⚠️  These passwords will NOT be displayed again!")
        console.log("=".repeat(80))
      }

      console.log(
        `\n✅ Coordinator accounts seeding completed (${createdCount} created, ${skippedCount} existing)`
      )

      return {
        result: "success",
        created: createdCount,
        skipped: skippedCount,
        credentials: generatedCredentials.map(c => ({
          email: c.email,
          role: c.role,
          // Don't include password in return value for security
        })),
      }
    } catch (error: unknown) {
      console.error("Error during coordinator accounts seeding:", error)

      if (error instanceof Error) {
        console.error("Error message:", error.message)
        console.error("Error stack:", error.stack)
      }

      throw error
    }
  },
})
