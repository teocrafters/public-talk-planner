import { isNull, eq } from "drizzle-orm"
import { schema } from "hub:db"

interface UnlinkedUser {
  id: string
  name: string
  email: string
}

export default defineEventHandler(async (event): Promise<UnlinkedUser[]> => {
  await requirePermission({ publishers: ["link_to_user"] })(event)


  // Get all users that are not linked to any publisher
  const unlinkedUsers = await db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      email: schema.user.email,
    })
    .from(schema.user)
    .leftJoin(schema.publishers, eq(schema.publishers.userId, schema.user.id))
    .where(isNull(schema.publishers.userId))
    .orderBy(schema.user.name)

  return unlinkedUsers
})
