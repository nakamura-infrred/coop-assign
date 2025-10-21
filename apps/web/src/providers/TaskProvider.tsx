/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import type { Task } from '@coop-assign/domain'
import { useStorage } from './StorageProvider'
import {
  OPEN_AUGUST_2025_SEED_SOURCE,
  sampleTasksAugust2025,
  seededTaskIds,
} from '../data/sampleTasks'

interface TaskContextValue {
  tasks: Task[]
  loading: boolean
  error: string | null
  pending: boolean
  seedSampleTasks: () => Promise<void>
  clearSampleTasks: () => Promise<void>
}

const TaskContext = createContext<TaskContextValue | undefined>(undefined)

export function TaskProvider({ children }: PropsWithChildren) {
  const { adapter, tenantContext } = useStorage()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!adapter || !tenantContext) {
      setTasks([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    if (adapter.observeTasks) {
      const unsubscribe = adapter.observeTasks(tenantContext, {}, (items) => {
        setTasks(items)
        setLoading(false)
      })
      return () => unsubscribe()
    }

    adapter
      .listTasks(tenantContext, {})
      .then((items) => {
        setTasks(items)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load tasks', err)
        setError('タスクの読み込みに失敗しました。')
        setLoading(false)
      })
  }, [adapter, tenantContext])

  const seedSampleTasks = useCallback(async () => {
    if (!adapter || !tenantContext) return
    setPending(true)
    setError(null)
    try {
      await Promise.all(
        sampleTasksAugust2025.map((task) => {
          const baseMetadata = (task.metadata ?? {}) as Record<string, unknown>
          const existingSeedSource =
            typeof baseMetadata['seedSource'] === 'string'
              ? (baseMetadata['seedSource'] as string)
              : undefined

          const metadata: Record<string, unknown> = {
            ...baseMetadata,
            seeded: true,
            seedSource: existingSeedSource ?? OPEN_AUGUST_2025_SEED_SOURCE,
          }

          return adapter.upsertTask(tenantContext, {
            ...task,
            metadata,
          })
        }),
      )
    } catch (err) {
      console.error('Failed to seed tasks', err)
      setError('サンプルデータの登録に失敗しました。')
    } finally {
      setPending(false)
    }
  }, [adapter, tenantContext])

  const clearSampleTasks = useCallback(async () => {
    if (!adapter || !tenantContext) return
    setPending(true)
    setError(null)
    try {
      const seeded = tasks.filter(
        (task) =>
          task.metadata?.seeded === true ||
          task.metadata?.seedSource === OPEN_AUGUST_2025_SEED_SOURCE ||
          seededTaskIds.has(task.id),
      )
      await Promise.all(
        seeded.map((task) => adapter.removeTask(tenantContext, task.id)),
      )
    } catch (err) {
      console.error('Failed to remove tasks', err)
      setError('サンプルデータの削除に失敗しました。')
    } finally {
      setPending(false)
    }
  }, [adapter, tenantContext, tasks])

  const sortedTasks = useMemo(
    () =>
      [...tasks].sort((a, b) => {
        const aKey = `${a.date} ${a.startTime ?? ''}`
        const bKey = `${b.date} ${b.startTime ?? ''}`
        return aKey.localeCompare(bKey)
      }),
    [tasks],
  )

  const value = useMemo<TaskContextValue>(
    () => ({ tasks: sortedTasks, loading, error, pending, seedSampleTasks, clearSampleTasks }),
    [sortedTasks, loading, error, pending, seedSampleTasks, clearSampleTasks],
  )

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>
}

export function useTasks() {
  const ctx = useContext(TaskContext)
  if (!ctx) {
    throw new Error('useTasks は TaskProvider の内部で利用してください')
  }
  return ctx
}
