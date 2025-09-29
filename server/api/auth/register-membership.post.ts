import { generateId } from "better-auth"
import { z } from "zod"
import { member } from "../../database/auth-schema"
import type { MembershipResponse } from "../../../types/registration"

const membershipRequestSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  congregationId: z.string().min(1, 'Congregation ID is required')
})

export default defineEventHandler(async (event): Promise<MembershipResponse> => {
  const body = await readBody(event)
  
  // Validate request body
  const validation = membershipRequestSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request data: ' + validation.error.issues[0]?.message
    })
  }
  
  const { userId, congregationId } = validation.data

  try {
    const db = useDrizzle()

    // Create organization membership
    await db.insert(member).values({
      id: generateId(),
      organizationId: congregationId,
      userId: userId,
      role: 'publisher',
      createdAt: new Date(),
    })

    return {
      success: true,
      message: 'Membership created successfully'
    } satisfies MembershipResponse
  } catch (error) {
    console.error('Membership creation error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create membership'
    })
  }
})