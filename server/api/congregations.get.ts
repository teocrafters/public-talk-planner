import { organization } from "../database/auth-schema"
import { defineEndpoint } from "../utils/define-endpoint"

export default defineEndpoint({
  auth: false,
  handler: async (_event): Promise<Congregation[]> => {
    const db = useDrizzle()

    const congregations = await db
      .select({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      })
      .from(organization)
      .orderBy(organization.name)

    return congregations satisfies Congregation[]
  },
})
