/* eslint-disable react-refresh/only-export-components */
import { getFirestore } from 'firebase/firestore'
import {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
} from 'react'
import {
  FirestoreAdapter,
  type StorageAdapter,
} from '@coop-assign/adapters'
import type { TenantContext } from '@coop-assign/adapters'
import type { TenantId } from '@coop-assign/domain'
import { firebaseApp } from '../lib/firebase'
import { useAuth } from './AuthProvider'

type StorageContextValue =
  | {
      adapter: StorageAdapter
      tenantContext: TenantContext
    }
  | {
      adapter: null
      tenantContext: null
    }

const StorageContext = createContext<StorageContextValue>({
  adapter: null,
  tenantContext: null,
})

export function StorageProvider({ children }: PropsWithChildren) {
  const { user } = useAuth()

  const value = useMemo<StorageContextValue>(() => {
    if (!user) {
      return {
        adapter: null,
        tenantContext: null,
      }
    }

    const tenantId =
      ((import.meta.env.VITE_DEFAULT_TENANT_ID as string | undefined) ??
        user.uid ??
        null) as TenantId | null
    if (!tenantId) {
      return {
        adapter: null,
        tenantContext: null,
      }
    }

    const adapter = new FirestoreAdapter(getFirestore(firebaseApp))
    return {
      adapter,
      tenantContext: {
        tenantId,
        actorId: user.uid,
      },
    }
  }, [user])

  return (
    <StorageContext.Provider value={value}>{children}</StorageContext.Provider>
  )
}

export function useStorage() {
  const ctx = useContext(StorageContext)
  if (!ctx) {
    throw new Error('useStorage must be used within StorageProvider')
  }
  return ctx
}
