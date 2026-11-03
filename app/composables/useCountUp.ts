import { onScopeDispose, ref, type Ref } from 'vue'

// Counts from 0 to `target` with an ease-out curve; with reduced motion the final value shows at once.
export function useCountUp(target: number, options: { durationMs: number; reduced: boolean }): Ref<number> {
  const value = ref(options.reduced || target <= 0 ? target : 0)
  if (value.value === target) return value

  let frame = 0
  let start: number | null = null
  const step = (now: number) => {
    start ??= now
    const progress = Math.min((now - start) / options.durationMs, 1)
    value.value = Math.round(target * (1 - (1 - progress) ** 3))
    if (progress < 1) frame = requestAnimationFrame(step)
  }
  frame = requestAnimationFrame(step)
  onScopeDispose(() => cancelAnimationFrame(frame))
  return value
}
