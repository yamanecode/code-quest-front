// Class strings shared by the professor forms and editors, so a size or focus fix lands once.
// Controls are at least 44px tall and keep the global focus outline (never `outline-none`).
export const FOCUS_RING = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink'

export const SMALL_BUTTON =
  'min-h-11 border-2 border-line-strong px-3 py-1.5 font-semibold transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40'

export const TEXT_FIELD = `min-h-11 min-w-0 flex-1 border-2 border-line-strong bg-panel px-3 py-2 text-ink ${FOCUS_RING}`
