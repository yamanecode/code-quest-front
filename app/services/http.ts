// The only module that talks HTTP. Every other service goes through apiFetch.

import type { ApiErrorBody } from '~/types/api'

export interface HttpConfig {
  baseURL: string
  getToken: () => string | null
  onUnauthorized: () => void
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export interface RequestOptions {
  method?: HttpMethod
  body?: object
  query?: Record<string, string | number | undefined>
}

const LOGIN_PATH = '/api/auth/login'
const NETWORK_ERROR_MESSAGE = 'Não foi possível falar com o servidor. Verifique sua conexão e tente de novo.'

const config: HttpConfig = {
  baseURL: '',
  getToken: () => null,
  onUnauthorized: () => {},
}

export function configureHttp(options: Partial<HttpConfig>): void {
  Object.assign(config, options)
}

export class ApiError extends Error {
  readonly status: number
  readonly detail: string
  readonly retryAfter: number | null
  readonly errors: string[]

  constructor(status: number, detail: string, message: string, retryAfter: number | null = null, errors: string[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
    this.retryAfter = retryAfter
    this.errors = errors
  }
}

interface FetchErrorLike {
  data?: unknown
  response?: { status: number; headers: Headers }
}

function isFetchError(error: unknown): error is FetchErrorLike & { response: { status: number; headers: Headers } } {
  return typeof error === 'object' && error !== null && typeof (error as FetchErrorLike).response?.status === 'number'
}

function isErrorBody(data: unknown): data is ApiErrorBody {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as ApiErrorBody).detail === 'string' &&
    typeof (data as ApiErrorBody).message === 'string'
  )
}

function toApiError(error: unknown): ApiError {
  if (!isFetchError(error)) {
    return new ApiError(0, 'network_error', NETWORK_ERROR_MESSAGE)
  }
  const { status, headers } = error.response
  if (!isErrorBody(error.data)) {
    return new ApiError(status, 'internal_error', 'Ocorreu um erro inesperado. Tente de novo.')
  }
  const body = error.data
  const header = Number(headers.get('Retry-After'))
  const retryAfter = body.retry_after ?? (Number.isFinite(header) && header > 0 ? header : null)
  return new ApiError(status, body.detail, body.message, retryAfter, body.errors ?? [])
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {}
  const token = config.getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  try {
    return await $fetch<T>(path, {
      baseURL: config.baseURL,
      method: options.method ?? 'GET',
      body: options.body,
      query: options.query,
      headers,
    })
  }
  catch (error) {
    const apiError = toApiError(error)
    // A wrong password on the login form is a 401 too, but must not log anybody out.
    if (apiError.status === 401 && path !== LOGIN_PATH) config.onUnauthorized()
    throw apiError
  }
}
