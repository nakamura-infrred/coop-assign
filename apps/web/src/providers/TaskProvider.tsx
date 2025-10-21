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

interface TaskContextValue {
  tasks: Task[]
  loading: boolean
  error: string | null
  pending: boolean
  seedSampleTasks: () => Promise<void>
  clearSampleTasks: () => Promise<void>
}

const TaskContext = createContext<TaskContextValue | undefined>(undefined)

const ISO_DAY_MS = 24 * 60 * 60 * 1000

const addDays = (date: Date, days: number) => new Date(date.getTime() + ISO_DAY_MS * days)
const toIsoDate = (date: Date) => date.toISOString().slice(0, 10)

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
      const base = new Date()
      const sample = [
        {
          title: '交流戦 第1試合',
          venue: '中央体育館',
          startTime: '09:00',
          endTime: '10:30',
          required: 2,
          role: '主審',
          date: toIsoDate(base),
        },
        {
          title: '交流戦 第2試合',
          venue: '中央体育館',
          startTime: '11:00',
          endTime: '12:30',
          required: 2,
          role: '副審',
          date: toIsoDate(addDays(base, 1)),
        },
        {
          title: '研修会サポート',
          venue: '地域センター',
          startTime: '14:00',
          endTime: '16:00',
          required: 3,
          role: '運営補助',
          date: toIsoDate(addDays(base, 3)),
        },
      ]

      await Promise.all(
        sample.map((task) =>
          adapter.upsertTask(tenantContext, {
            ...task,
            metadata: { seeded: true },
          }),
        ),
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
      const seeded = tasks.filter((task) => task.metadata?.seeded)
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

  const value = useMemo<TaskContextValue>(
    () => ({ tasks, loading, error, pending, seedSampleTasks, clearSampleTasks }),
    [tasks, loading, error, pending, seedSampleTasks, clearSampleTasks],
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
