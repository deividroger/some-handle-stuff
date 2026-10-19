import { tasksApi, type Task } from '../api/tasks'
import { selectVisibleTasks, useTaskStore } from './taskStore'

vi.mock('../api/tasks', () => ({
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
const t = (id: string, done = false): Task => ({ id, title: `task ${id}`, done })
const initial = useTaskStore.getState()

beforeEach(() => {
  vi.resetAllMocks()
  useTaskStore.setState({ ...initial, tasks: [], loading: true, error: null, online: null, filter: 'all' })
})

describe('taskStore', () => {
  it('loads tasks and stops loading', async () => {
    api.list.mockResolvedValue([t('1')])

    await useTaskStore.getState().load()

    expect(useTaskStore.getState().tasks).toEqual([t('1')])
    expect(useTaskStore.getState().loading).toBe(false)
  })

  it('stores the error when loading fails and still stops loading', async () => {
    api.list.mockRejectedValue(new Error('boom'))

    await useTaskStore.getState().load()

    expect(useTaskStore.getState().error).toBe('boom')
    expect(useTaskStore.getState().loading).toBe(false)
  })

  it('creates a task and appends it', async () => {
    useTaskStore.setState({ tasks: [t('1')] })
    api.create.mockResolvedValue(t('2'))

    await useTaskStore.getState().create('task 2')

    expect(api.create).toHaveBeenCalledWith('task 2')
    expect(useTaskStore.getState().tasks.map((x) => x.id)).toEqual(['1', '2'])
  })

  it('completes a task', async () => {
    useTaskStore.setState({ tasks: [t('1'), t('2')] })
    api.complete.mockResolvedValue(t('1', true))

    await useTaskStore.getState().complete('1')

    expect(useTaskStore.getState().tasks.find((x) => x.id === '1')?.done).toBe(true)
    expect(useTaskStore.getState().tasks.find((x) => x.id === '2')?.done).toBe(false)
  })

  it('refreshes a task from the API', async () => {
    useTaskStore.setState({ tasks: [t('1')] })
    api.get.mockResolvedValue({ id: '1', title: 'renamed', done: true })

    await useTaskStore.getState().refresh('1')

    expect(useTaskStore.getState().tasks[0].title).toBe('renamed')
  })

  it('removes a task', async () => {
    useTaskStore.setState({ tasks: [t('1'), t('2')] })
    api.remove.mockResolvedValue(undefined)

    await useTaskStore.getState().remove('1')

    expect(useTaskStore.getState().tasks.map((x) => x.id)).toEqual(['2'])
  })

  it('keeps tasks and sets error when an action fails, clearing it on the next success', async () => {
    useTaskStore.setState({ tasks: [t('1')] })
    api.remove.mockRejectedValueOnce(new Error('task not found'))

    await useTaskStore.getState().remove('1')
    expect(useTaskStore.getState().error).toBe('task not found')
    expect(useTaskStore.getState().tasks).toHaveLength(1)

    api.remove.mockResolvedValue(undefined)
    await useTaskStore.getState().remove('1')
    expect(useTaskStore.getState().error).toBeNull()
  })

  it('checks health', async () => {
    api.health.mockResolvedValue(true)
    await useTaskStore.getState().checkHealth()
    expect(useTaskStore.getState().online).toBe(true)

    api.health.mockRejectedValue(new Error('down'))
    await useTaskStore.getState().checkHealth()
    expect(useTaskStore.getState().online).toBe(false)
  })

  it('selects visible tasks by filter', () => {
    const tasks = [t('1'), t('2', true)]
    expect(selectVisibleTasks({ tasks, filter: 'all' })).toHaveLength(2)
    expect(selectVisibleTasks({ tasks, filter: 'open' }).map((x) => x.id)).toEqual(['1'])
    expect(selectVisibleTasks({ tasks, filter: 'done' }).map((x) => x.id)).toEqual(['2'])
  })
})
