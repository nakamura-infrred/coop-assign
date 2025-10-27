/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react'
import type { Person, Team, Venue } from '@coop-assign/domain'
import type {
  PersonWriteInput,
  TeamWriteInput,
  VenueWriteInput,
} from '@coop-assign/adapters'
import { useStorage } from './StorageProvider'

interface MasterDataContextValue {
  teams: Team[]
  venues: Venue[]
  persons: Person[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  updateTeam: (input: TeamWriteInput) => Promise<Team>
  removeTeam: (teamId: Team['id']) => Promise<void>
  updateVenue: (input: VenueWriteInput) => Promise<Venue>
  updatePerson: (input: PersonWriteInput) => Promise<Person>
}

const MasterDataContext = createContext<MasterDataContextValue | undefined>(undefined)

export function MasterDataProvider({ children }: PropsWithChildren) {
  const { adapter, tenantContext } = useStorage()
  const [teams, setTeams] = useState<Team[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [persons, setPersons] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!adapter || !tenantContext) {
      setTeams([])
      setVenues([])
      setPersons([])
      return
    }

    let [teamList, venueList, personList] = await Promise.all([
      adapter.listTeams(tenantContext),
      adapter.listVenues(tenantContext),
      adapter.listPersons(tenantContext),
    ])

    const mismatchedTeams = teamList.filter((team) => {
      const expected =
        team.category === 'university'
          ? '大学'
          : team.category === 'corporate'
            ? '社会人'
            : team.primaryLabel ?? ''
      return expected !== (team.primaryLabel ?? '')
    })

    if (mismatchedTeams.length > 0) {
      await Promise.all(
        mismatchedTeams.map((team) =>
          adapter.upsertTeam(tenantContext, {
            id: team.id,
            primaryLabel:
              team.category === 'university'
                ? '大学'
                : team.category === 'corporate'
                  ? '社会人'
                  : team.primaryLabel ?? undefined,
          }),
        ),
      )
      teamList = teamList.map((team) => ({
        ...team,
        primaryLabel:
          team.category === 'university'
            ? '大学'
            : team.category === 'corporate'
              ? '社会人'
              : team.primaryLabel,
      }))
    }

    venueList = venueList.map((venue) => ({
      ...venue,
      regionLabel: venue.regionLabel && venue.regionLabel.trim().length > 0 ? venue.regionLabel : '東海',
    }))

    setTeams(teamList)
    setVenues(venueList)
    setPersons(personList)
  }, [adapter, tenantContext])

  useEffect(() => {
    if (!adapter || !tenantContext) {
      setTeams([])
      setVenues([])
      setPersons([])
      setLoading(false)
      return
    }

    let isCancelled = false
    setLoading(true)
    setError(null)

    refresh()
      .then(() => {
        if (isCancelled) return
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load master data', err)
        if (isCancelled) return
        setError('マスターデータの取得に失敗しました。')
        setLoading(false)
      })

    return () => {
      isCancelled = true
    }
  }, [adapter, tenantContext, refresh])

  const updateTeam = useCallback(
    async (input: TeamWriteInput) => {
      if (!adapter || !tenantContext) {
        throw new Error('Firestore への接続が初期化されていません。')
      }
      const existing = teams.find((team) => team.id === input.id)
      const category = input.category ?? existing?.category
      const normalizedPrimary =
        category === 'university'
          ? '大学'
          : category === 'corporate'
            ? '社会人'
            : input.primaryLabel ?? existing?.primaryLabel

      const updated = await adapter.upsertTeam(tenantContext, {
        ...input,
        primaryLabel: normalizedPrimary ?? undefined,
      })
      setTeams((prev) => {
        const exists = prev.some((team) => team.id === updated.id)
        const next = exists
          ? prev.map((team) => (team.id === updated.id ? updated : team))
          : [...prev, updated]
        return [...next].sort((a, b) => a.name.localeCompare(b.name, 'ja'))
      })
      return updated
    },
    [adapter, tenantContext, teams],
  )

  const removeTeam = useCallback(
    async (teamId: Team['id']) => {
      if (!adapter || !tenantContext) {
        throw new Error('Firestore への接続が初期化されていません。')
      }
      await adapter.removeTeam(tenantContext, teamId)
      setTeams((prev) => prev.filter((team) => team.id !== teamId))
    },
    [adapter, tenantContext],
  )

  const updateVenue = useCallback(
    async (input: VenueWriteInput) => {
      if (!adapter || !tenantContext) {
        throw new Error('Firestore への接続が初期化されていません。')
      }
      const updated = await adapter.upsertVenue(tenantContext, {
        ...input,
        regionLabel:
          input.regionLabel && input.regionLabel.trim().length > 0
            ? input.regionLabel
            : '東海',
      })
      setVenues((prev) => {
        const exists = prev.some((venue) => venue.id === updated.id)
        const next = exists
          ? prev.map((venue) => (venue.id === updated.id ? updated : venue))
          : [...prev, updated]
        return [...next].sort((a, b) => a.name.localeCompare(b.name, 'ja'))
      })
      return updated
    },
    [adapter, tenantContext],
  )

  const updatePerson = useCallback(
    async (input: PersonWriteInput) => {
      if (!adapter || !tenantContext) {
        throw new Error('Firestore への接続が初期化されていません。')
      }
      const updated = await adapter.upsertPerson(tenantContext, input)
      setPersons((prev) => {
        const exists = prev.some((person) => person.id === updated.id)
        const next = exists
          ? prev.map((person) => (person.id === updated.id ? updated : person))
          : [...prev, updated]
        return [...next].sort((a, b) =>
          (a.displayName ?? '').localeCompare(b.displayName ?? '', 'ja'),
        )
      })
      return updated
    },
    [adapter, tenantContext],
  )

  return (
    <MasterDataContext.Provider
      value={{
        teams,
        venues,
        persons,
        loading,
        error,
        refresh,
        updateTeam,
        removeTeam,
        updateVenue,
        updatePerson,
      }}
    >
      {children}
    </MasterDataContext.Provider>
  )
}

export function useMasterData() {
  const ctx = useContext(MasterDataContext)
  if (!ctx) {
    throw new Error('useMasterData は MasterDataProvider の内部で利用してください')
  }
  return ctx
}
