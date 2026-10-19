export interface Task {
  id: string
  title: string
  done: boolean
}

const BASE = '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!res.ok) {
    const message = (await res.text()).trim()
    throw new Error(message || `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const tasksApi = {
  list: () => request<Task[]>('/tasks'),
  get: (id: string) => request<Task>(`/tasks/${encodeURIComponent(id)}`),
  create: (title: string) =>
    request<Task>('/tasks', { method: 'POST', body: JSON.stringify({ title }) }),
  complete: (id: string) =>
    request<Task>(`/tasks/${encodeURIComponent(id)}/complete`, { method: 'POST' }),
  remove: (id: string) =>
    request<void>(`/tasks/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  health: async () => {
    const res = await fetch(`${BASE}/healthz`)
    return res.ok
  },
}
