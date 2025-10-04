import { eq } from "drizzle-orm"
import { generateId } from "better-auth"
import { organization } from "../database/auth-schema"

export default defineTask({
  meta: {
    name: "db:seed",
    description: "Run database seed task",
  },
  async run() {
    console.log("Running DB seed task...")

    const db = useDrizzle()

    const congregations = [
      {
        id: generateId(),
        name: "Warszawa Nowy Świat",
        slug: "warszawa-nowy-swiat",
        logo: null,
        metadata: null,
        createdAt: new Date(),
      },
      {
        id: generateId(),
        name: "Żychlin",
        slug: "zychlin",
        logo: null,
        metadata: null,
        createdAt: new Date(),
      },
      {
        id: generateId(),
        name: "Toruń Chrobrego",
        slug: "torun-chrobrego",
        logo: null,
        metadata: null,
        createdAt: new Date(),
      },
    ]

    for (const congregation of congregations) {
      const existing = await db
        .select()
        .from(organization)
        .where(eq(organization.slug, congregation.slug!))
        .get()

      if (!existing) {
        await db.insert(organization).values(congregation)
        console.log(`Seeded congregation: ${congregation.name}`)
      } else {
        console.log(`Congregation already exists: ${congregation.name}`)
      }
    }

    console.log("Congregations seeded successfully")

    return { result: "success" }
  },
})
