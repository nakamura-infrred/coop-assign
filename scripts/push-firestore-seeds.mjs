#!/usr/bin/env node
import { promises as fs } from 'fs'
import path from 'path'
import process from 'process'
import { fileURLToPath } from 'url'
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

const overwriteCollection = async (db, collectionName, docs) => {
  if (!Array.isArray(docs) || docs.length === 0) return

  const collectionRef = db
    .collection('tenants')
    .doc(TENANT_ID)
    .collection(collectionName)

  const existingDocs = await collectionRef.listDocuments()
  if (existingDocs.length > 0) {
    const deleteBatch = db.batch()
    existingDocs.forEach((doc) => deleteBatch.delete(doc))
    await deleteBatch.commit()
  }

  const batch = db.batch()

  docs.forEach((doc) => {
    if (!doc.id) {
      throw new Error(`Missing id for ${collectionName} entry: ${JSON.stringify(doc)}`)
    }
    const { id, ...rest } = doc
    const ref = collectionRef.doc(id)
    batch.set(
      ref,
      {
        ...rest,
        id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    )
  })

  await batch.commit()
}

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
    tasks.push(overwriteCollection(db, 'venues', venuesInput))
  }

  if (teamsInput) {
    tasks.push(overwriteCollection(db, 'teams', teamsInput))
  }

  await Promise.all(tasks)
  console.log('Firestore へのシード投入が完了しました。tenant:', TENANT_ID)
}

main().catch((error) => {
  console.error('Failed to push Firestore seeds:', error)
  process.exit(1)
})
