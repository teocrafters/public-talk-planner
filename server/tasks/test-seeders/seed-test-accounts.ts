import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { eq } from "drizzle-orm"
import { generateRandomString } from "better-auth/crypto"
import { organization, member, user } from "../../database/auth-schema"
import { serverAuth } from "../../utils/auth"

export default defineTask({
  meta: {
    name: "db:seed-test-accounts",
    description: "Seed test accounts for E2E testing",
  },
  async run() {
    console.log("Starting test accounts seeding...")

    try {
      const dataPath = join(process.cwd(), "tests", "fixtures", "test-accounts.json")
      const data = JSON.parse(await readFile(dataPath, "utf-8"))

      const db = useDrizzle()
      const auth = serverAuth()

      // Filter users based on environment
      const staging = isStaging()
      const usersToSeed = staging
        ? data.users.filter((u: { role: string }) => u.role === "admin")
        : data.users

      if (staging) {
        console.log(`ℹ️  Staging mode: Seeding ${usersToSeed.length} admin user(s) only`)
      }

      // Check if organization already exists
      const existingOrg = await db.query.organization.findFirst({
        where: eq(organization.slug, data.organization.slug),
      })

      let orgId: string

      if (existingOrg) {
        console.log(`Organization already exists: ${existingOrg.name}`)
        orgId = existingOrg.id
      } else {
        // Create organization directly in database
        console.log(`Creating organization: ${data.organization.name}`)
        orgId = generateRandomString(32, "a-z", "A-Z", "0-9")

        await db.insert(organization).values({
          id: orgId,
          name: data.organization.name,
          slug: data.organization.slug,
          createdAt: new Date(),
        })

        console.log(`✅ Organization created: ${data.organization.name} (${orgId})`)
      }

      // Create users with Better Auth sign-up API
      let createdCount = 0
      let skippedCount = 0

      for (const userData of usersToSeed) {
        const existing = await db.query.user.findFirst({
          where: eq(user.email, userData.email),
        })

        if (!existing) {
          console.log(`Creating user: ${userData.email}`)

          // Create user via Better Auth sign-up API
          const signUpResult = await auth.api.signUpEmail({
            body: {
              email: userData.email,
              password: userData.password,
              name: userData.name,
            },
          })

          if (!signUpResult || !signUpResult.user?.id) {
            throw new Error(`Failed to create user: ${userData.email}`)
          }

          const userId = signUpResult.user.id

          // Set email_verified to true
          await db.update(user).set({ emailVerified: true }).where(eq(user.id, userId))

          // Add member to organization directly in database
          const memberId = generateRandomString(32, "a-z", "A-Z", "0-9")

          await db.insert(member).values({
            id: memberId,
            organizationId: orgId,
            userId: userId,
            role: userData.role,
            createdAt: new Date(),
          })

          createdCount++
          console.log(`✅ User created with role ${userData.role}: ${userData.email}`)
        } else {
          skippedCount++
          console.log(`User already exists: ${userData.email}`)
        }
      }

      console.log(
        `✅ Seeded ${usersToSeed.length} test account(s) successfully (${createdCount} created, ${skippedCount} existing)`
      )
      return {
        result: "success",
        count: usersToSeed.length,
        created: createdCount,
        skipped: skippedCount,
      }
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        console.error("File not found: tests/fixtures/test-accounts.json")
        throw new Error("test-accounts.json not found")
      }

      console.error("Unexpected error during seeding:", error)
      if (error instanceof Error) {
        console.error("Error message:", error.message)
        console.error("Error stack:", error.stack)
      }
      throw error
    }
  },
})
