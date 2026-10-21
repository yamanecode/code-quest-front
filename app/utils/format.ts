// Small display helpers shared by pages and components.

const FALLBACK_ERROR = 'Ocorreu um erro inesperado. Tente de novo.'

// The HTTP layer already turns API errors into Errors whose message is the PT-BR text.
export function errorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : FALLBACK_ERROR
}
