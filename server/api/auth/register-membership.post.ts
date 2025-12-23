import { generateId } from "better-auth"
import { z } from "zod"
import { schema } from "hub:db"

const membershipRequestSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  congregationId: z.string().min(1, "Congregation ID is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
})

export default defineEventHandler(async (event): Promise<MembershipResponse> => {
  const body = await readBody(event)

  // Validate request body
  const validation = membershipRequestSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid request data: " + validation.error.issues[0]?.message,
    })
  }

  const { userId, congregationId, firstName, lastName } = validation.data

  try {

    // Create organization membership
    await db.insert(schema.member).values({
      id: generateId(),
      organizationId: congregationId,
      userId: userId,
      role: "publisher",
      createdAt: new Date(),
    })

    // Create publisher profile for the user
    await db.insert(schema.publishers).values({
      id: crypto.randomUUID(),
      userId: userId,
      firstName: firstName,
      lastName: lastName,
      isElder: false,
      isMinisterialServant: false,
      isRegularPioneer: false,
      canChairWeekendMeeting: false,
      conductsWatchtowerStudy: false,
      backupWatchtowerConductor: false,
      isReader: false,
      offersPublicPrayer: false,
      isCircuitOverseer: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return {
      success: true,
      message: "Membership and publisher profile created successfully",
    } satisfies MembershipResponse
  } catch (error) {
    console.error("Membership creation error:", error)
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create membership",
    })
  }
})
