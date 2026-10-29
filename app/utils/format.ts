// Small display helpers shared by pages and components.

const FALLBACK_ERROR = 'Ocorreu um erro inesperado. Tente de novo.'

const DAY_MONTH = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' })

// "20/10" for an API datetime; game dates follow São Paulo time (spec §5).
export function formatDayMonth(iso: string): string {
  return DAY_MONTH.format(new Date(iso))
}

// The HTTP layer already turns API errors into Errors whose message is the PT-BR text.
export function errorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : FALLBACK_ERROR
}

// Lines to list under a form: the content-rule errors when the API sent them, else its message.
export function errorLines(error: unknown): string[] {
  const errors = (error as { errors?: unknown } | null)?.errors
  if (Array.isArray(errors) && errors.length > 0) return errors.map(String)
  return [errorMessage(error)]
}

// Fields the HTTP layer adds to the Errors it throws (services/http.ts), read without importing it.
export function errorDetail(error: unknown): string | null {
  const detail = (error as { detail?: unknown } | null)?.detail
  return typeof detail === 'string' ? detail : null
}

export function errorStatus(error: unknown): number | null {
  const status = (error as { status?: unknown } | null)?.status
  return typeof status === 'number' ? status : null
}

// Seconds to wait before trying again, when the API sent them (429 `retry_after`).
export function errorRetryAfter(error: unknown): number {
  const seconds = (error as { retryAfter?: unknown } | null)?.retryAfter
  return typeof seconds === 'number' ? seconds : 0
}
