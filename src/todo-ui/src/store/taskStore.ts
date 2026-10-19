import { create } from 'zustand'
import { tasksApi, type Task } from '../api/tasks'

export type Filter = 'all' | 'open' | 'done'

interface TaskState {
  tasks: Task[]
  loading: boolean
  error: string | null
  online: boolean | null
  filter: Filter

  setFilter: (filter: Filter) => void
  load: () => Promise<void>
  checkHealth: () => Promise<void>
  create: (title: string) => Promise<void>
  complete: (id: string) => Promise<void>
  refresh: (id: string) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useTaskStore = create<TaskState>((set, get) => {
  // Runs an action clearing the previous error and storing any new one.
  const run = async (action: () => Promise<void>) => {
    set({ error: null })
    try {
      await action()
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Erro inesperado' })
    }
  }

  return {
    tasks: [],
    loading: true,
    error: null,
    online: null,
    filter: 'all',

    setFilter: (filter) => set({ filter }),

    load: async () => {
      await run(async () => set({ tasks: await tasksApi.list() }))
      set({ loading: false })
    },

    checkHealth: async () => {
      set({ online: await tasksApi.health().catch(() => false) })
    },

    create: (title) =>
      run(async () => {
        const task = await tasksApi.create(title)
        set({ tasks: [...get().tasks, task] })
      }),

    complete: (id) =>
      run(async () => {
        const updated = await tasksApi.complete(id)
        set({ tasks: get().tasks.map((t) => (t.id === id ? updated : t)) })
      }),

    refresh: (id) =>
      run(async () => {
        const fresh = await tasksApi.get(id)
        set({ tasks: get().tasks.map((t) => (t.id === id ? fresh : t)) })
      }),

    remove: (id) =>
      run(async () => {
        await tasksApi.remove(id)
        set({ tasks: get().tasks.filter((t) => t.id !== id) })
      }),
  }
})

export const selectVisibleTasks = (state: {
  tasks: Task[]
  filter: Filter
}): Task[] => {
  switch (state.filter) {
    case 'done':
      return state.tasks.filter((t) => t.done)
    case 'open':
      return state.tasks.filter((t) => !t.done)
    default:
      return state.tasks
  }
}
