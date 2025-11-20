import AdmZip from "adm-zip"
import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core"
import { sql, eq } from "drizzle-orm"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Define temporary schemas for .jwpub database tables
const Document = sqliteTable("Document", {
  DocumentId: integer("DocumentId").primaryKey(),
  Title: text("Title").notNull(),
})

const DocumentMultimedia = sqliteTable("DocumentMultimedia", {
  DocumentId: integer("DocumentId").notNull(),
  MultimediaId: integer("MultimediaId").notNull(),
})

const Multimedia = sqliteTable("Multimedia", {
  MultimediaId: integer("MultimediaId").primaryKey(),
  MajorType: integer("MajorType").notNull(),
})

async function analyzeJwpub() {
  console.log("Starting .jwpub analysis...")

  const jwpubPath = path.join(__dirname, "..", "S-34_P.jwpub")
  if (!fs.existsSync(jwpubPath)) {
    console.error("❌ Error: S-34_P.jwpub file not found")
    console.error(`Expected location: ${jwpubPath}`)
    process.exit(1)
  }

  console.log(`Found .jwpub file: ${jwpubPath}`)

  const tempDir = path.join(__dirname, "temp")
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
  fs.mkdirSync(tempDir, { recursive: true })

  try {
    console.log("Extracting outer .jwpub archive...")
    const outerZip = new AdmZip(jwpubPath)
    outerZip.extractAllTo(tempDir, true)

    console.log("Extracting inner contents archive...")
    const contentsPath = path.join(tempDir, "contents")
    if (!fs.existsSync(contentsPath)) {
      throw new Error("contents file not found in .jwpub archive")
    }

    const innerZip = new AdmZip(contentsPath)
    innerZip.extractAllTo(tempDir, true)

    const dbPath = path.join(tempDir, "S-34_P.db")
    if (!fs.existsSync(dbPath)) {
      throw new Error("S-34_P.db not found in extracted contents")
    }

    console.log("Opening SQLite database with Drizzle ORM...")
    const client = createClient({ url: `file:${dbPath}` })
    const db = drizzle(client)

    console.log("Querying talk data...")
    const rows = await db
      .select({
        DocumentId: Document.DocumentId,
        Title: Document.Title,
        image_count: sql`CAST(COUNT(CASE WHEN ${Multimedia.MajorType} = 1 THEN 1 END) AS INTEGER)`,
        video_count: sql`CAST(COUNT(CASE WHEN ${Multimedia.MajorType} = 2 THEN 1 END) AS INTEGER)`,
      })
      .from(Document)
      .leftJoin(DocumentMultimedia, eq(Document.DocumentId, DocumentMultimedia.DocumentId))
      .leftJoin(Multimedia, eq(DocumentMultimedia.MultimediaId, Multimedia.MultimediaId))
      .groupBy(Document.DocumentId)
      .orderBy(Document.DocumentId)

    console.log(`Retrieved ${rows.length} documents from database`)

    console.log("Transforming data...")
    const talks = rows
      .map(row => {
        const match = row.Title.match(/^(\d+)\./)
        if (!match) {
          return null
        }

        const no = parseInt(match[1], 10)

        return {
          no,
          title: row.Title.replace(/^\d+\.\s*/, ""), // Remove "NUMBER. " prefix from title
          multimediaCount: row.image_count,
          videoCount: row.video_count,
          status: null,
        }
      })
      .filter(talk => talk !== null)
      .sort((a, b) => a.no - b.no)

    console.log("\n📊 Extraction Statistics:")
    console.log(`Total talks extracted: ${talks.length}`)
    console.log(`Talks with multimedia: ${talks.filter(t => t.multimediaCount > 0).length}`)
    console.log(`Talks with videos: ${talks.filter(t => t.videoCount > 0).length}`)

    if (talks.length !== 187) {
      console.warn(`⚠️  Warning: Expected 187 talks, but got ${talks.length}`)
    }

    const talkNumbers = talks.map(t => t.no)
    const uniqueNumbers = new Set(talkNumbers)
    if (talkNumbers.length !== uniqueNumbers.size) {
      console.error("❌ Error: Duplicate talk numbers found")
      process.exit(1)
    }

    console.log("\nSample talks with multimedia:")
    const sampleTalks = [42, 90, 132]
    for (const no of sampleTalks) {
      const talk = talks.find(t => t.no === no)
      if (talk) {
        console.log(`  #${talk.no}: ${talk.multimediaCount} photos, ${talk.videoCount} videos`)
      }
    }

    const outputDir = path.join(__dirname, "..", "server", "data")
    fs.mkdirSync(outputDir, { recursive: true })

    const outputPath = path.join(outputDir, "public-talks.json")
    fs.writeFileSync(outputPath, JSON.stringify(talks, null, 2), "utf-8")

    client.close()

    console.log(`\n✅ Successfully created ${outputPath}`)
    console.log(`📦 Generated file size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`)
  } catch (error) {
    console.error("❌ Error during analysis:", error.message)
    throw error
  } finally {
    if (fs.existsSync(tempDir)) {
      console.log("\nCleaning up temporary files...")
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  }
}

analyzeJwpub().catch(error => {
  console.error("Fatal error:", error)
  process.exit(1)
})
