import type { H3Event } from "h3"
import { createError } from "h3"
import { eq } from "drizzle-orm"
import { member, organization } from "../../database/schema"

interface OrganizationMembership {
  id: string
  organizationId: string
  userId: string
  role: string
  createdAt: Date
  organization?: {
    id: string
    name: string
    slug: string | null
  }
}

export default defineEventHandler(async (event: H3Event): Promise<OrganizationMembership[]> => {
  const session = await serverAuth().api.getSession({
    headers: event.headers,
  })

  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      message: "Authentication required",
    })
  }

  try {
    const db = useDrizzle()

    const memberships = await db
      .select({
        id: member.id,
        organizationId: member.organizationId,
        userId: member.userId,
        role: member.role,
        createdAt: member.createdAt,
        organizationName: organization.name,
        organizationSlug: organization.slug,
      })
      .from(member)
      .leftJoin(organization, eq(member.organizationId, organization.id))
      .where(eq(member.userId, session.user.id))

    return memberships.map(m => ({
      id: m.id,
      organizationId: m.organizationId,
      userId: m.userId,
      role: m.role,
      createdAt: m.createdAt,
      organization: m.organizationName
        ? {
            id: m.organizationId,
            name: m.organizationName,
            slug: m.organizationSlug,
          }
        : undefined,
    }))
  } catch (error) {
    console.error("Failed to fetch user memberships:", error)
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      message: "Failed to fetch user memberships",
    })
  }
})
