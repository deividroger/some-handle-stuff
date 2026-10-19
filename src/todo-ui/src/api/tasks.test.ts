import { tasksApi } from './tasks'

function mockFetch(response: Partial<Response> & { text?: () => Promise<string> }) {
  const fn = vi.fn().mockResolvedValue(response)
  vi.stubGlobal('fetch', fn)
  return fn
}

afterEach(() => vi.unstubAllGlobals())

describe('tasksApi', () => {
  it('lists tasks', async () => {
    const tasks = [{ id: '1', title: 'a', done: false }]
    const fetchMock = mockFetch({ ok: true, status: 200, json: async () => tasks })

    await expect(tasksApi.list()).resolves.toEqual(tasks)
    expect(fetchMock.mock.calls[0][0]).toBe('/api/tasks')
  })

  it('creates a task with a JSON body', async () => {
    const fetchMock = mockFetch({ ok: true, status: 201, json: async () => ({ id: '1' }) })

    await tasksApi.create('novo')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/tasks')
    expect(init.method).toBe('POST')
    expect(init.body).toBe(JSON.stringify({ title: 'novo' }))
  })

  it('gets a task by id', async () => {
    const fetchMock = mockFetch({ ok: true, status: 200, json: async () => ({ id: 'a b' }) })

    await tasksApi.get('a b')
    expect(fetchMock.mock.calls[0][0]).toBe('/api/tasks/a%20b')
  })

  it('completes a task', async () => {
    const fetchMock = mockFetch({ ok: true, status: 200, json: async () => ({ id: '1', done: true }) })

    await tasksApi.complete('1')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/tasks/1/complete')
    expect(init.method).toBe('POST')
  })

  it('removes a task and handles 204', async () => {
    const fetchMock = mockFetch({ ok: true, status: 204 })

    await expect(tasksApi.remove('1')).resolves.toBeUndefined()
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/tasks/1')
    expect(init.method).toBe('DELETE')
  })

  it('throws the server message on error', async () => {
    mockFetch({ ok: false, status: 404, text: async () => 'task not found\n' })

    await expect(tasksApi.get('9')).rejects.toThrow('task not found')
  })

  it('falls back to the status code when the body is empty', async () => {
    mockFetch({ ok: false, status: 500, text: async () => '' })

    await expect(tasksApi.list()).rejects.toThrow('HTTP 500')
  })

  it('reports health', async () => {
    const fetchMock = mockFetch({ ok: true, status: 200 })

    await expect(tasksApi.health()).resolves.toBe(true)
    expect(fetchMock.mock.calls[0][0]).toBe('/api/healthz')
  })
})
