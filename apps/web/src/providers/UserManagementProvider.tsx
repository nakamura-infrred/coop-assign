import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { UserProfile, UserRole } from '@coop-assign/domain'
import { useAuth } from './AuthProvider'
import { useStorage } from './StorageProvider'

type InviteInput = {
  email: string
  displayName?: string
  role?: UserRole
  note?: string
}

interface UserManagementContextValue {
  profiles: UserProfile[]
  currentProfile: UserProfile | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  updateRole: (userId: string, role: UserRole) => Promise<void>
  removeUser: (userId: string) => Promise<void>
  inviteUser: (input: InviteInput) => Promise<UserProfile | null>
}

const UserManagementContext = createContext<
  UserManagementContextValue | undefined
>(undefined)

export function UserManagementProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { adapter, tenantContext } = useStorage()

  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProfiles = useCallback(async () => {
    if (!adapter || !tenantContext) {
      return []
    }

    const list = await adapter.listUserProfiles(tenantContext)
    const needsUpgrade = list.filter((profile) => profile.role !== 'admin')
    if (needsUpgrade.length > 0) {
      await Promise.all(
        needsUpgrade.map((profile) =>
          adapter.upsertUserProfile(tenantContext, {
            id: profile.id,
            role: 'admin',
          }),
        ),
      )
      return adapter.listUserProfiles(tenantContext)
    }
    return list
  }, [adapter, tenantContext])

  useEffect(() => {
    if (!adapter || !tenantContext || !user) {
      setProfiles([])
      setCurrentProfile(null)
      setLoading(false)
      setError(null)
      return
    }

    let isCancelled = false
    setLoading(true)
    setError(null)

    ;(async () => {
      try {
        await adapter.upsertUserProfile(tenantContext, {
          id: user.uid,
          email: user.email ?? undefined,
          displayName: user.displayName ?? undefined,
          photoURL: user.photoURL ?? null,
          role: 'admin',
          status: 'active',
        })

        const list = await loadProfiles()
        if (isCancelled) return

        setProfiles(list)
        setCurrentProfile(list.find((profile) => profile.id === user.uid) ?? null)
        setLoading(false)
      } catch (err) {
        console.error('Failed to synchronise user profiles', err)
        if (isCancelled) return
        setError('ユーザー情報の取得に失敗しました。')
        setLoading(false)
      }
    })()

    return () => {
      isCancelled = true
    }
  }, [adapter, tenantContext, user])

  const refresh = useCallback(async () => {
    if (!adapter || !tenantContext || !user) {
      return
    }
    try {
      const list = await loadProfiles()
      setProfiles(list)
      setCurrentProfile(list.find((profile) => profile.id === user.uid) ?? null)
      setError(null)
    } catch (err) {
      console.error('Failed to refresh user profiles', err)
      setError('ユーザー情報の取得に失敗しました。')
      throw err
    }
  }, [adapter, tenantContext, user, loadProfiles])

  const updateRole = useCallback(
    async (userId: string, role: UserRole) => {
      if (!adapter || !tenantContext) {
        throw new Error('Firestore への接続が初期化されていません。')
      }
      if (currentProfile?.role !== 'admin') {
        throw new Error('権限がありません。')
      }
      try {
        await adapter.upsertUserProfile(tenantContext, { id: userId, role })
        await refresh()
      } catch (err) {
        console.error('Failed to update user role', err)
        throw new Error('権限の更新に失敗しました。')
      }
    },
    [adapter, tenantContext, currentProfile?.role, refresh],
  )

  const removeUser = useCallback(
    async (userId: string) => {
      if (!adapter || !tenantContext) {
        throw new Error('Firestore への接続が初期化されていません。')
      }
      if (currentProfile?.role !== 'admin') {
        throw new Error('権限がありません。')
      }
      if (user && user.uid === userId) {
        throw new Error('自分自身のアカウントは削除できません。')
      }
      try {
        await adapter.removeUserProfile(tenantContext, userId)
        await refresh()
      } catch (err) {
        console.error('Failed to remove user profile', err)
        throw new Error('ユーザーの削除に失敗しました。')
      }
    },
    [adapter, tenantContext, currentProfile?.role, refresh, user],
  )

  const inviteUser = useCallback(
    async (input: InviteInput) => {
      if (!adapter || !tenantContext) {
        throw new Error('Firestore への接続が初期化されていません。')
      }
      if (currentProfile?.role !== 'admin') {
        throw new Error('権限がありません。')
      }
      const email = input.email.trim()
      if (!email) {
        throw new Error('メールアドレスを入力してください。')
      }
      try {
        const created = await adapter.upsertUserProfile(tenantContext, {
          email,
          displayName: input.displayName?.trim() || undefined,
          role: input.role,
          note: input.note?.trim() || undefined,
          status: 'invited',
        })
        await refresh()
        return created
      } catch (err) {
        console.error('Failed to invite user', err)
        throw new Error('ユーザーの招待に失敗しました。')
      }
    },
    [adapter, tenantContext, currentProfile?.role, refresh],
  )

  const value = useMemo<UserManagementContextValue>(
    () => ({
      profiles,
      currentProfile,
      loading,
      error,
      refresh,
      updateRole,
      removeUser,
      inviteUser,
    }),
    [
      profiles,
      currentProfile,
      loading,
      error,
      refresh,
      updateRole,
      removeUser,
      inviteUser,
    ],
  )

  return (
    <UserManagementContext.Provider value={value}>
      {children}
    </UserManagementContext.Provider>
  )
}

export function useUserManagement() {
  const ctx = useContext(UserManagementContext)
  if (!ctx) {
    throw new Error('useUserManagement は UserManagementProvider 内で利用してください')
  }
  return ctx
}
