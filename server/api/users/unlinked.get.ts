import { isNull, eq } from "drizzle-orm"
import { user, publishers } from "../../database/schema"

interface UnlinkedUser {
  id: string
  name: string
  email: string
}

export default defineEventHandler(async (event): Promise<UnlinkedUser[]> => {
  await requirePermission({ publishers: ["link_to_user"] })(event)

  const db = useDrizzle()

  // Get all users that are not linked to any publisher
  const unlinkedUsers = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
    })
    .from(user)
    .leftJoin(publishers, eq(publishers.userId, user.id))
    .where(isNull(publishers.userId))
    .orderBy(user.name)

  return unlinkedUsers
})
