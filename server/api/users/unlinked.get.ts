import { isNull, eq } from "drizzle-orm"
import { user, publishers } from "../../database/schema"
import { defineEndpoint } from "../../utils/define-endpoint"

interface UnlinkedUser {
  id: string
  name: string
  email: string
}

export default defineEndpoint({
  permissions: { publishers: ["link_to_user"] },
  handler: async (): Promise<UnlinkedUser[]> => {
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
  },
})
