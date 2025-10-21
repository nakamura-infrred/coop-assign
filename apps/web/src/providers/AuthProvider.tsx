import { onAuthStateChanged, type User } from 'firebase/auth'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { auth, signInWithGoogle, signOutFromFirebase } from '../lib/firebase'

type AuthContextValue = {
  user: User | null
  loading: boolean
  error?: string
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | undefined>()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (nextUser) => {
        setUser(nextUser)
        setLoading(false)
      },
      (err) => {
        console.error('Failed to observe auth state', err)
        setError('認証状態の取得に失敗しました')
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [])

  const signIn = useCallback(async () => {
    setError(undefined)
    try {
      await signInWithGoogle()
    } catch (err) {
      console.error('Failed to sign in', err)
      setError('ログインに失敗しました。時間をおいて再度お試しください。')
    }
  }, [])

  const signOut = useCallback(async () => {
    setError(undefined)
    try {
      await signOutFromFirebase()
    } catch (err) {
      console.error('Failed to sign out', err)
      setError('ログアウトに失敗しました。')
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      error,
      signIn,
      signOut,
    }),
    [error, loading, signIn, signOut, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (ctx === undefined) {
    throw new Error('useAuth は AuthProvider の内部でのみ利用できます')
  }
  return ctx
}
