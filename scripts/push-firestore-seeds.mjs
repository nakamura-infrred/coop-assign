#!/usr/bin/env node
import { promises as fs } from 'fs'
import path from 'path'
import process from 'process'
import { fileURLToPath } from 'url'
import slugify from 'slugify'
import admin from 'firebase-admin'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID
const TENANT_ID = process.env.SEED_TENANT_ID ?? 'default'
const SEEDS_DIR = path.resolve('data/seeds')
const VENUES_FILE = path.join(SEEDS_DIR, 'venues.json')
const TEAMS_FILE = path.join(SEEDS_DIR, 'teams.json')

const ensureProject = () => {
  if (!PROJECT_ID) {
    console.error('FIREBASE_PROJECT_ID 環境変数を設定してください。')
    process.exit(1)
  }
}

const slug = (value) =>
  slugify(value, {
    lower: true,
    strict: true,
    trim: true,
  })

const readJsonIfExists = async (filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf8')
    return JSON.parse(content)
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null
    }
    throw error
  }
}

const initAdmin = () => {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: PROJECT_ID,
  })
  return admin.firestore()
}

const upsertCollection = async (db, collectionName, docs) => {
  if (!Array.isArray(docs) || docs.length === 0) return

  const collectionRef = db
    .collection('tenants')
    .doc(TENANT_ID)
    .collection(collectionName)

  const batch = db.batch()

  docs.forEach((doc) => {
    const rawId = doc.id ?? doc.slug ?? doc.name
    if (!rawId) {
      throw new Error(`Missing id for ${collectionName} entry: ${JSON.stringify(doc)}`)
    }
    const docId = slug(String(rawId))
    const { id, slug: _slug, ...rest } = doc
    const ref = collectionRef.doc(docId)
    batch.set(
      ref,
      {
        ...rest,
        id: docId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    )
  })

  await batch.commit()
}

const normalizeVenue = (venue) => ({
  id: venue.id ?? slug(venue.name),
  name: venue.name,
  type: venue.type ?? 'university',
  region: venue.region ?? 'tokai',
  address: venue.address ?? null,
  note: venue.note ?? null,
})

const normalizeTeam = (team) => ({
  id: team.id ?? slug(team.name),
  name: team.name,
  category: team.category ?? 'university',
  region: team.region ?? 'tokai',
  league: team.league ?? null,
  shortName: team.shortName ?? null,
})

const main = async () => {
  ensureProject()

  const venuesInput = await readJsonIfExists(VENUES_FILE)
  const teamsInput = await readJsonIfExists(TEAMS_FILE)

  if (!venuesInput && !teamsInput) {
    console.error('data/seeds/ に venues.json または teams.json を配置してください。')
    process.exit(1)
  }

  const db = initAdmin()
  const tasks = []

  if (venuesInput) {
    tasks.push(upsertCollection(db, 'venues', venuesInput.map(normalizeVenue)))
  }

  if (teamsInput) {
    tasks.push(upsertCollection(db, 'teams', teamsInput.map(normalizeTeam)))
  }

  await Promise.all(tasks)
  console.log('Firestore へのシード投入が完了しました。tenant:', TENANT_ID)
}

main().catch((error) => {
  console.error('Failed to push Firestore seeds:', error)
  process.exit(1)
})
