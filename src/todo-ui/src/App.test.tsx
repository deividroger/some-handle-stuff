import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { tasksApi, type Task } from './api/tasks'
import App from './App'
import { useTaskStore } from './store/taskStore'

vi.mock('./api/tasks', () => ({
  tasksApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    complete: vi.fn(),
    remove: vi.fn(),
    health: vi.fn(),
  },
}))

const api = vi.mocked(tasksApi)
const initial = useTaskStore.getState()

beforeEach(() => {
  vi.resetAllMocks()
  useTaskStore.setState({ ...initial, tasks: [], loading: true, error: null, online: null, filter: 'all' })
  api.health.mockResolvedValue(true)
  api.list.mockResolvedValue([])
})

const seed: Task[] = [
  { id: '1', title: 'Aberta', done: false },
  { id: '2', title: 'Feita', done: true },
]

describe('App', () => {
  it('shows tasks and API status after loading', async () => {
    api.list.mockResolvedValue(seed)
    render(<App />)

    expect(await screen.findByText('Aberta')).toBeInTheDocument()
    expect(screen.getByText('Feita')).toBeInTheDocument()
    expect(await screen.findByText('API online')).toBeInTheDocument()
  })

  it('shows offline status', async () => {
    api.health.mockResolvedValue(false)
    render(<App />)

    expect(await screen.findByText('API offline')).toBeInTheDocument()
  })

  it('shows the empty state', async () => {
    render(<App />)
    expect(await screen.findByText('Nenhuma tarefa.')).toBeInTheDocument()
  })

  it('shows an error when loading fails', async () => {
    api.list.mockRejectedValue(new Error('falhou'))
    render(<App />)

    expect(await screen.findByRole('alert')).toHaveTextContent('falhou')
  })

  it('creates a task through the form', async () => {
    api.create.mockResolvedValue({ id: '3', title: 'Nova', done: false })
    render(<App />)
    await screen.findByText('Nenhuma tarefa.')

    await userEvent.type(screen.getByLabelText('Título da tarefa'), 'Nova')
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar' }))

    expect(api.create).toHaveBeenCalledWith('Nova')
    expect(await screen.findByText('Nova')).toBeInTheDocument()
    expect(screen.getByLabelText('Título da tarefa')).toHaveValue('')
  })

  it('disables the add button for blank titles', async () => {
    render(<App />)
    await screen.findByText('Nenhuma tarefa.')

    await userEvent.type(screen.getByLabelText('Título da tarefa'), '   ')
    expect(screen.getByRole('button', { name: 'Adicionar' })).toBeDisabled()
  })

  it('completes a task', async () => {
    api.list.mockResolvedValue([seed[0]])
    api.complete.mockResolvedValue({ ...seed[0], done: true })
    render(<App />)

    await userEvent.click(await screen.findByRole('button', { name: 'Concluir' }))

    await waitFor(() => expect(screen.queryByRole('button', { name: 'Concluir' })).not.toBeInTheDocument())
    expect(api.complete).toHaveBeenCalledWith('1')
  })

  it('refreshes a task by id', async () => {
    api.list.mockResolvedValue([seed[0]])
    api.get.mockResolvedValue({ ...seed[0], title: 'Atualizada' })
    render(<App />)

    await userEvent.click(await screen.findByRole('button', { name: 'Atualizar' }))

    expect(await screen.findByText('Atualizada')).toBeInTheDocument()
  })

  it('deletes a task', async () => {
    api.list.mockResolvedValue([seed[0]])
    api.remove.mockResolvedValue(undefined)
    render(<App />)

    await userEvent.click(await screen.findByRole('button', { name: 'Excluir' }))

    await waitFor(() => expect(screen.queryByText('Aberta')).not.toBeInTheDocument())
    expect(api.remove).toHaveBeenCalledWith('1')
  })

  it('filters tasks', async () => {
    api.list.mockResolvedValue(seed)
    render(<App />)
    await screen.findByText('Aberta')

    await userEvent.click(screen.getByRole('button', { name: 'Concluídas' }))
    expect(screen.queryByText('Aberta')).not.toBeInTheDocument()
    expect(screen.getByText('Feita')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Abertas' }))
    expect(screen.getByText('Aberta')).toBeInTheDocument()
    expect(screen.queryByText('Feita')).not.toBeInTheDocument()
  })

  it('reloads the list', async () => {
    render(<App />)
    await screen.findByText('Nenhuma tarefa.')

    api.list.mockResolvedValue([seed[0]])
    await userEvent.click(screen.getByRole('button', { name: 'Recarregar' }))

    expect(await screen.findByText('Aberta')).toBeInTheDocument()
  })
})
