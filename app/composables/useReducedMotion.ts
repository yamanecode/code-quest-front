// Whether the device asks for reduced motion (read once, when the component is set up).
export function useReducedMotion(): boolean {
  if (!import.meta.client || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
