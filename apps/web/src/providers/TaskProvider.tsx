/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
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
}

const TaskContext = createContext<TaskContextValue | undefined>(undefined)

export function TaskProvider({ children }: PropsWithChildren) {
  const { adapter, tenantContext } = useStorage()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
    () => ({ tasks: sortedTasks, loading, error }),
    [sortedTasks, loading, error],
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
