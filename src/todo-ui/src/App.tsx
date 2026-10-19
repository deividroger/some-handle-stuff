import { useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { TaskForm } from './components/TaskForm'
import { TaskItem } from './components/TaskItem'
import { selectVisibleTasks, useTaskStore, type Filter } from './store/taskStore'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'open', label: 'Abertas' },
  { value: 'done', label: 'Concluídas' },
]

export default function App() {
  const visible = useTaskStore(useShallow(selectVisibleTasks))
  const loading = useTaskStore((s) => s.loading)
  const error = useTaskStore((s) => s.error)
  const online = useTaskStore((s) => s.online)
  const filter = useTaskStore((s) => s.filter)
  const setFilter = useTaskStore((s) => s.setFilter)
  const load = useTaskStore((s) => s.load)
  const checkHealth = useTaskStore((s) => s.checkHealth)

  useEffect(() => {
    void load()
    void checkHealth()
  }, [load, checkHealth])

  return (
    <main>
      <header>
        <h1>Tarefas</h1>
        <span className={`status ${online ? 'ok' : 'off'}`}>
          {online === null ? '...' : online ? 'API online' : 'API offline'}
        </span>
      </header>

      <TaskForm />

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <nav className="filters">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={filter === f.value ? 'active' : 'secondary'}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
        <button className="secondary" onClick={() => void load()}>
          Recarregar
        </button>
      </nav>

      {loading ? (
        <p>Carregando...</p>
      ) : visible.length === 0 ? (
        <p className="empty">Nenhuma tarefa.</p>
      ) : (
        <ul>
          {visible.map((t) => (
            <TaskItem key={t.id} task={t} />
          ))}
        </ul>
      )}
    </main>
  )
}
