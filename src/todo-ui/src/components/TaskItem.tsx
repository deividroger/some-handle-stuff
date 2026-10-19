import type { Task } from '../api/tasks'
import { useTaskStore } from '../store/taskStore'

export function TaskItem({ task }: { task: Task }) {
  const complete = useTaskStore((s) => s.complete)
  const refresh = useTaskStore((s) => s.refresh)
  const remove = useTaskStore((s) => s.remove)

  return (
    <li className={task.done ? 'task done' : 'task'}>
      <span className="title">{task.title}</span>
      <span className="actions">
        {!task.done && <button onClick={() => void complete(task.id)}>Concluir</button>}
        <button className="secondary" onClick={() => void refresh(task.id)} title="Buscar por ID">
          Atualizar
        </button>
        <button className="danger" onClick={() => void remove(task.id)}>
          Excluir
        </button>
      </span>
    </li>
  )
}
