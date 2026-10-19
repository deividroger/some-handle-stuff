import { useState, type FormEvent } from 'react'
import { useTaskStore } from '../store/taskStore'

export function TaskForm() {
  const onCreate = useTaskStore((s) => s.create)
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const value = title.trim()
    if (!value) return
    setBusy(true)
    try {
      await onCreate(value)
      setTitle('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="task-form" onSubmit={submit}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Nova tarefa..."
        aria-label="Título da tarefa"
        disabled={busy}
      />
      <button type="submit" disabled={busy || !title.trim()}>
        Adicionar
      </button>
    </form>
  )
}
