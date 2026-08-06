import { eq } from "drizzle-orm"
import { organization } from "../../database/auth-schema"

export default defineTask({
  meta: {
    name: "db:seed-congregations",
    description: "Seed congregations (organizations)",
  },
  async run() {
    logger.info("Running congregations seed task...")

    const db = useDrizzle()

    const congregations = [
      // TODO: Add more congregations
      {
        id: crypto.randomUUID(),
        name: "Testowy Zbór",
        slug: "testowy-zbór",
        logo: null,
        metadata: null,
        createdAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        name: "Żychlin",
        slug: "zychlin",
        logo: null,
        metadata: null,
        createdAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        name: "Gostynin-Wschód",
        slug: "gostynin-wschod",
        logo: null,
        metadata: null,
        createdAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        name: "Gostynin-Zachód",
        slug: "gostynin-zachod",
        logo: null,
        metadata: null,
        createdAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        name: "Izbica Kujawska",
        slug: "izbica-kujawska",
        logo: null,
        metadata: null,
        createdAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        name: "Kłodawa",
        slug: "klodawa",
        logo: null,
        metadata: null,
        createdAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        name: "Kutno-Północ",
        slug: "kutno-polnoc",
        logo: null,
        metadata: null,
        createdAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        name: "Kutno-Południe",
        slug: "kutno-poludnie",
        logo: null,
        metadata: null,
        createdAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        name: "Lipno",
        slug: "lipno",
        logo: null,
        metadata: null,
        createdAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        name: "Parzeń",
        slug: "parzen",
        logo: null,
        metadata: null,
        createdAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        name: "Płock-Północ",
        slug: "plock-polnoc",
        logo: null,
        metadata: null,
        createdAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        name: "Płock-Południe",
        slug: "plock-poludnie",
        logo: null,
        metadata: null,
        createdAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        name: "Płock-Zachód",
        slug: "plock-zachod",
        logo: null,
        metadata: null,
        createdAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        name: "Radziejów",
        slug: "radziejow",
        logo: null,
        metadata: null,
        createdAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        name: "Sierpc",
        slug: "sierpc",
        logo: null,
        metadata: null,
        createdAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        name: "Szpetal Górny",
        slug: "szpetal-gorny",
        logo: null,
        metadata: null,
        createdAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        name: "Włocławek-Południe",
        slug: "wloclawek-poludnie",
        logo: null,
        metadata: null,
        createdAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        name: "Włocławek-Wschód",
        slug: "wloclawek-wschod",
        logo: null,
        metadata: null,
        createdAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        name: "Włocławek-Zazamcze",
        slug: "wloclawek-zazamcze",
        logo: null,
        metadata: null,
        createdAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        name: "Łęczyca",
        slug: "leczyca",
        logo: null,
        metadata: null,
        createdAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        name: "Łowicz",
        slug: "lowicz",
        logo: null,
        metadata: null,
        createdAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        name: "Głowno",
        slug: "glowno",
        logo: null,
        metadata: null,
        createdAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        name: "Sochaczew",
        slug: "sochaczew",
        logo: null,
        metadata: null,
        createdAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
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
        .then(rows => rows[0])

      if (!existing) {
        await db.insert(organization).values(congregation)
        logger.info(`Seeded congregation: ${congregation.name}`)
      } else {
        logger.info(`Congregation already exists: ${congregation.name}`)
      }
    }

    logger.info("Congregations seeded successfully")

    return { result: "success" }
  },
})
