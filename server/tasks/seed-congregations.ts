import { eq } from "drizzle-orm"
import { generateId } from "better-auth"
import { organization } from "../database/auth-schema"

export default defineTask({
  meta: {
    name: "db:seed-congregations",
    description: "Seed congregations (organizations)",
  },
  async run() {
    console.log("Running congregations seed task...")

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
      {
        id: generateId(),
        name: "Gostynin-Wschód",
        slug: "gostynin-wschod",
        logo: null,
        metadata: null,
        createdAt: new Date(),
      },
      {
        id: generateId(),
        name: "Gostynin-Zachód",
        slug: "gostynin-zachod",
        logo: null,
        metadata: null,
        createdAt: new Date(),
      },
      {
        id: generateId(),
        name: "Izbica Kujawska",
        slug: "izbica-kujawska",
        logo: null,
        metadata: null,
        createdAt: new Date(),
      },
      {
        id: generateId(),
        name: "Kłodawa",
        slug: "klodawa",
        logo: null,
        metadata: null,
        createdAt: new Date(),
      },
      {
        id: generateId(),
        name: "Kutno-Południe",
        slug: "kutno-poludnie",
        logo: null,
        metadata: null,
        createdAt: new Date(),
      },
      {
        id: generateId(),
        name: "Lipno",
        slug: "lipno",
        logo: null,
        metadata: null,
        createdAt: new Date(),
      },
      {
        id: generateId(),
        name: "Parzeń",
        slug: "parzen",
        logo: null,
        metadata: null,
        createdAt: new Date(),
      },
      {
        id: generateId(),
        name: "Płock-Północ",
        slug: "plock-polnoc",
        logo: null,
        metadata: null,
        createdAt: new Date(),
      },
      {
        id: generateId(),
        name: "Płock-Południe",
        slug: "plock-poludnie",
        logo: null,
        metadata: null,
        createdAt: new Date(),
      },
      {
        id: generateId(),
        name: "Płock-Zachód",
        slug: "plock-zachod",
        logo: null,
        metadata: null,
        createdAt: new Date(),
      },
      {
        id: generateId(),
        name: "Radziejów",
        slug: "radziejow",
        logo: null,
        metadata: null,
        createdAt: new Date(),
      },
      {
        id: generateId(),
        name: "Sierpc",
        slug: "sierpc",
        logo: null,
        metadata: null,
        createdAt: new Date(),
      },
      {
        id: generateId(),
        name: "Szpetal Górny",
        slug: "szpetal-gorny",
        logo: null,
        metadata: null,
        createdAt: new Date(),
      },
      {
        id: generateId(),
        name: "Włocławek-Południe",
        slug: "wloclawek-poludnie",
        logo: null,
        metadata: null,
        createdAt: new Date(),
      },
      {
        id: generateId(),
        name: "Włocławek-Wschód",
        slug: "wloclawek-wschod",
        logo: null,
        metadata: null,
        createdAt: new Date(),
      },
      {
        id: generateId(),
        name: "Włocławek-Zazamcze",
        slug: "wloclawek-zazamcze",
        logo: null,
        metadata: null,
        createdAt: new Date(),
      },
      {
        id: generateId(),
        name: "Łęczyca",
        slug: "leczyca",
        logo: null,
        metadata: null,
        createdAt: new Date(),
      },
      {
        id: generateId(),
        name: "Łowicz",
        slug: "lowicz",
        logo: null,
        metadata: null,
        createdAt: new Date(),
      },
      {
        id: generateId(),
        name: "Głowno",
        slug: "glowno",
        logo: null,
        metadata: null,
        createdAt: new Date(),
      },
      {
        id: generateId(),
        name: "Sochaczew",
        slug: "sochaczew",
        logo: null,
        metadata: null,
        createdAt: new Date(),
      },
      {
        id: generateId(),
        name: "Ozorków",
        slug: "ozorkow",
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
