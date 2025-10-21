/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react'
import type { Team, Venue } from '@coop-assign/domain'
import { useStorage } from './StorageProvider'

interface MasterDataContextValue {
  teams: Team[]
  venues: Venue[]
  loading: boolean
  error: string | null
}

const MasterDataContext = createContext<MasterDataContextValue | undefined>(undefined)

export function MasterDataProvider({ children }: PropsWithChildren) {
  const { adapter, tenantContext } = useStorage()
  const [teams, setTeams] = useState<Team[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!adapter || !tenantContext) {
      setTeams([])
      setVenues([])
      setLoading(false)
      return
    }

    let isCancelled = false
    setLoading(true)
    setError(null)

    Promise.all([adapter.listTeams(tenantContext), adapter.listVenues(tenantContext)])
      .then(([teamList, venueList]) => {
        if (isCancelled) return
        setTeams(teamList)
        setVenues(venueList)
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
  }, [adapter, tenantContext])

  return (
    <MasterDataContext.Provider value={{ teams, venues, loading, error }}>
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
