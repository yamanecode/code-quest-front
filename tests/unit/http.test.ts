import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiFetch, configureHttp } from '~/services/http'

// Builds an error shaped like the one $fetch throws for a non-2xx response.
function httpError(status: number, data: unknown, headers: Record<string, string> = {}) {
  return Object.assign(new Error(`HTTP ${status}`), {
    data,
    response: { status, headers: new Headers(headers) },
  })
}

const fetchMock = vi.fn()
const onUnauthorized = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  onUnauthorized.mockReset()
  vi.stubGlobal('$fetch', fetchMock)
  configureHttp({ baseURL: 'http://api.test', getToken: () => 'tok-123', onUnauthorized })
})

describe('apiFetch', () => {
  it('T-FE-HTTP-01 adds the Authorization header with the bearer token', async () => {
    fetchMock.mockResolvedValue({ ok: true })

    await apiFetch('/api/me')

    const [path, options] = fetchMock.mock.calls[0]!
    expect(path).toBe('/api/me')
    expect(options.baseURL).toBe('http://api.test')
    expect(options.headers).toMatchObject({ Authorization: 'Bearer tok-123' })
  })

  it('T-FE-HTTP-01 sends no Authorization header without a token', async () => {
    configureHttp({ getToken: () => null })
    fetchMock.mockResolvedValue({})

    await apiFetch('/api/auth/login', { method: 'POST', body: { username: 'ana', password: 'x' } })

    const [, options] = fetchMock.mock.calls[0]!
    expect(options.headers).not.toHaveProperty('Authorization')
    expect(options.method).toBe('POST')
  })

  it('T-FE-HTTP-02 maps {detail, message} to an ApiError', async () => {
    fetchMock.mockRejectedValue(httpError(409, { detail: 'username_taken', message: 'Esse nome já existe.' }))

    const error = await apiFetch('/api/auth/register').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 409,
      detail: 'username_taken',
      message: 'Esse nome já existe.',
      retryAfter: null,
      errors: [],
    })
  })

  it('T-FE-HTTP-02 gives a PT-BR message when the server cannot be reached', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'))

    const error = await apiFetch('/api/me').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 0, detail: 'network_error' })
    expect((error as ApiError).message).toMatch(/servidor/)
  })

  it('T-FE-HTTP-03 keeps retry_after from the body', async () => {
    fetchMock.mockRejectedValue(
      httpError(429, { detail: 'hint_cooldown', message: 'Espere um pouco.', retry_after: 12 }),
    )

    const error = await apiFetch('/api/challenges/1/hints', { method: 'POST' }).catch((e: unknown) => e)

    expect(error).toMatchObject({ status: 429, detail: 'hint_cooldown', retryAfter: 12 })
  })

  it('T-FE-HTTP-03 falls back to the Retry-After header', async () => {
    fetchMock.mockRejectedValue(
      httpError(429, { detail: 'hint_cooldown', message: 'Espere um pouco.' }, { 'Retry-After': '7' }),
    )

    const error = await apiFetch('/api/challenges/1/hints', { method: 'POST' }).catch((e: unknown) => e)

    expect(error).toMatchObject({ retryAfter: 7 })
  })

  it('T-FE-HTTP-04 keeps the errors list', async () => {
    const errors = ['O enunciado precisa ter de 20 a 600 caracteres.']
    fetchMock.mockRejectedValue(
      httpError(422, { detail: 'validation_error', message: 'Revise o desafio.', errors }),
    )

    const error = await apiFetch('/api/professor/challenges', { method: 'POST' }).catch((e: unknown) => e)

    expect(error).toMatchObject({ status: 422, detail: 'validation_error', errors })
  })

  it('T-FE-HTTP-05 a 401 outside login calls the unauthorized handler', async () => {
    fetchMock.mockRejectedValue(httpError(401, { detail: 'unauthorized', message: 'Entre de novo.' }))

    await expect(apiFetch('/api/me')).rejects.toBeInstanceOf(ApiError)

    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })

  it('T-FE-HTTP-05 a 401 on login does not log out', async () => {
    fetchMock.mockRejectedValue(
      httpError(401, { detail: 'invalid_credentials', message: 'Usuário ou senha incorretos.' }),
    )

    await expect(apiFetch('/api/auth/login', { method: 'POST' })).rejects.toMatchObject({
      detail: 'invalid_credentials',
    })

    expect(onUnauthorized).not.toHaveBeenCalled()
  })
})
