#!/usr/bin/env node
import { promises as fs } from 'fs'
import path from 'path'
import process from 'process'
import slugify from 'slugify'
import { createHash } from 'crypto'

const SOURCE_FILE = path.resolve('data/seeds/team_place.json')
const OUTPUT_TEAMS = path.resolve('data/seeds/teams.json')
const OUTPUT_VENUES = path.resolve('data/seeds/venues.json')

const categoryMapping = [
  { match: ['大学'], value: 'university' },
  { match: ['高校'], value: 'highschool' },
  { match: ['企業', '社会人', '都市対抗'], value: 'corporate' },
  { match: ['クラブ', '社会人野球', 'クラブチーム'], value: 'club' },
  { match: ['独立'], value: 'independent' },
  { match: ['NPB', '二軍', '三軍', '四軍', 'ファーム'], value: 'npb' },
]

const venueTypeMapping = [
  { match: ['グラウンド', '大学グラウンド'], value: 'university' },
  { match: ['球場', 'スタジアム'], value: 'stadium' },
]

const slug = (value, fallback = 'unknown') => {
  if (!value || typeof value !== 'string') return fallback
  const basic = slugify(value, { lower: true, strict: true, trim: true })
  if (basic) return basic
  return createHash('sha1').update(value).digest('hex').slice(0, 16)
}

const resolveCategory = ({ primaryLabel, leagueLabel }) => {
  const labels = [primaryLabel, leagueLabel].filter(Boolean)
  for (const label of labels) {
    for (const rule of categoryMapping) {
      if (rule.match.some((token) => label.includes(token))) {
        return rule.value
      }
    }
  }
  return 'other'
}

const resolveVenueType = (label) => {
  for (const rule of venueTypeMapping) {
    if (rule.match.some((token) => label.includes(token))) {
      return rule.value
    }
  }
  return 'stadium'
}

const normalizeTeam = ({ name, primaryLabel, leagueLabel, regionLabel, parentLabels }) => {
  const category = resolveCategory({ primaryLabel, leagueLabel })
  return {
    id: slug(name),
    name,
    category,
    region: slug(regionLabel ?? 'unassigned'),
    regionLabel: regionLabel ?? null,
    league: leagueLabel ?? null,
    primaryLabel: primaryLabel ?? null,
    sourcePath: parentLabels.join(' > '),
    isActive: true,
  }
}

const normalizeVenue = ({ name, primaryLabel, regionLabel }) => ({
  id: slug(name),
  name,
  type: resolveVenueType(primaryLabel ?? name),
  region: slug(regionLabel ?? 'unassigned'),
  regionLabel: regionLabel ?? null,
  categoryLabel: primaryLabel ?? null,
  address: null,
  note: null,
  isActive: true,
})

const ensureArray = (value) => (Array.isArray(value) ? value : [])

const traverseTeamNode = (node, context, results) => {
  const parentLabels = [...context.parentLabels]
  if (node.minor) parentLabels.push(node.minor)

  if (node.regions) {
    ensureArray(node.regions).forEach((regionNode) => {
      traverseTeamRegion(regionNode, { ...context, parentLabels }, results)
    })
    return
  }

  if (node.groups) {
    ensureArray(node.groups).forEach((groupNode) => {
      traverseTeamNode(groupNode, { ...context, parentLabels }, results)
    })
    return
  }

  if (node.items) {
    ensureArray(node.items).forEach((name) => {
      results.push(
        normalizeTeam({
          name,
          primaryLabel: context.primaryLabel,
          leagueLabel: node.minor ?? context.leagueLabel,
          regionLabel: context.regionLabel,
          parentLabels,
        }),
      )
    })
  }
}

const traverseTeamRegion = (regionNode, context, results) => {
  const regionLabel = regionNode.region ?? context.regionLabel
  const next = {
    ...context,
    regionLabel,
  }

  if (regionNode.groups) {
    ensureArray(regionNode.groups).forEach((groupNode) => {
      traverseTeamNode(groupNode, next, results)
    })
    return
  }

  if (regionNode.items) {
    ensureArray(regionNode.items).forEach((name) => {
      results.push(
        normalizeTeam({
          name,
          primaryLabel: context.primaryLabel,
          leagueLabel: context.leagueLabel,
          regionLabel,
          parentLabels: [...context.parentLabels, regionLabel].filter(Boolean),
        }),
      )
    })
  }
}

const extractTeams = (root) => {
  const results = []
  ensureArray(root.groups).forEach((categoryGroup) => {
    const primaryLabel = categoryGroup.minor ?? '未分類'
    ensureArray(categoryGroup.regions).forEach((regionNode) => {
      traverseTeamRegion(
        regionNode,
        {
          primaryLabel,
          leagueLabel: null,
          regionLabel: regionNode.region ?? null,
          parentLabels: [root.major, primaryLabel].filter(Boolean),
        },
        results,
      )
    })

    ensureArray(categoryGroup.groups).forEach((groupNode) => {
      traverseTeamNode(
        groupNode,
        {
          primaryLabel,
          leagueLabel: groupNode.minor ?? null,
          regionLabel: null,
          parentLabels: [root.major, primaryLabel].filter(Boolean),
        },
        results,
      )
    })

    if (categoryGroup.items) {
      ensureArray(categoryGroup.items).forEach((name) => {
        results.push(
          normalizeTeam({
            name,
            primaryLabel,
            leagueLabel: null,
            regionLabel: null,
            parentLabels: [root.major, primaryLabel].filter(Boolean),
          }),
        )
      })
    }
  })

  return results
}

const traverseVenueGroup = (groupNode, context, results) => {
  const categoryLabel = groupNode.minor ?? context.categoryLabel

  if (groupNode.regions) {
    ensureArray(groupNode.regions).forEach((regionNode) => {
      const regionLabel = regionNode.region ?? context.regionLabel
      ensureArray(regionNode.items).forEach((name) => {
        results.push(
          normalizeVenue({
            name,
            primaryLabel: categoryLabel,
            regionLabel,
          }),
        )
      })
      ensureArray(regionNode.groups).forEach((nestedGroup) => {
        traverseVenueGroup(nestedGroup, { categoryLabel, regionLabel }, results)
      })
    })
    return
  }

  if (groupNode.items) {
    ensureArray(groupNode.items).forEach((name) => {
      results.push(
        normalizeVenue({
          name,
          primaryLabel: categoryLabel,
          regionLabel: context.regionLabel,
        }),
      )
    })
  }

  ensureArray(groupNode.groups).forEach((nestedGroup) => {
    traverseVenueGroup(nestedGroup, { categoryLabel, regionLabel: context.regionLabel }, results)
  })
}

const extractVenues = (root) => {
  const results = []
  ensureArray(root.groups).forEach((groupNode) => {
    traverseVenueGroup(groupNode, { categoryLabel: groupNode.minor ?? root.major, regionLabel: null }, results)
  })
  return results
}

const dedupeById = (items) => {
  const map = new Map()
  items.forEach((item) => {
    if (!map.has(item.id)) {
      map.set(item.id, item)
    }
  })
  return Array.from(map.values())
}

const main = async () => {
  const raw = await fs.readFile(SOURCE_FILE, 'utf8').catch((error) => {
    if (error.code === 'ENOENT') {
      console.error(`team_place.json が見つかりません: ${SOURCE_FILE}`)
      process.exit(1)
    }
    throw error
  })

  const parsed = JSON.parse(raw)
  const teamsRoot = parsed.find((item) => item.major && item.major.includes('チーム'))
  const placesRoot = parsed.find((item) => item.major && item.major.includes('場所'))

  if (!teamsRoot) {
    console.error('チーム情報が見つかりませんでした。JSON の構造を確認してください。')
    process.exit(1)
  }

  if (!placesRoot) {
    console.error('場所情報が見つかりませんでした。JSON の構造を確認してください。')
    process.exit(1)
  }

  const teams = dedupeById(extractTeams(teamsRoot))
  const venues = dedupeById(extractVenues(placesRoot))

  await fs.writeFile(OUTPUT_TEAMS, JSON.stringify(teams, null, 2))
  await fs.writeFile(OUTPUT_VENUES, JSON.stringify(venues, null, 2))

  console.log(`Generated teams (${teams.length}) -> ${OUTPUT_TEAMS}`)
  console.log(`Generated venues (${venues.length}) -> ${OUTPUT_VENUES}`)
}

main().catch((error) => {
  console.error('Failed to prepare seeds:', error)
  process.exit(1)
})
