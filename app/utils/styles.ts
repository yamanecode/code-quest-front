// Class strings shared by the professor forms and editors, so a size or focus fix lands once.
// Controls are at least 44px tall and keep the global focus outline (never `outline-none`).
export const FOCUS_RING = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink'

export const SMALL_BUTTON =
  'min-h-11 border-2 border-line-strong px-3 py-1.5 font-semibold transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40'

// Main action buttons (see components/ui/AppButton.vue). The border is on every variant so
// they all measure the same; delete is an outline, quieter than the filled primary action.
export type ButtonVariant = 'primary' | 'secondary' | 'danger'

export const BUTTON_BASE =
  'inline-flex min-h-11 items-center justify-center border-2 px-5 py-2 font-display text-lg font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50'

export const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'border-transparent bg-go text-on-go hover:bg-go-hover cq-go-shadow',
  secondary: 'border-line-strong bg-panel text-ink hover:border-ink',
  danger: 'border-error-line bg-error-bg text-error-ink hover:border-error-ink',
}

export const TEXT_FIELD = `min-h-11 min-w-0 flex-1 border-2 border-line-strong bg-panel px-3 py-2 text-ink ${FOCUS_RING}`
