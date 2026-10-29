import { onScopeDispose, ref } from 'vue'

// Seconds left of a wait the API asked for (429 `retry_after`), ticking once a second.
export function useCountdown() {
  const seconds = ref(0)
  let timer: ReturnType<typeof setInterval> | null = null

  function stop() {
    if (timer) clearInterval(timer)
    timer = null
  }

  function start(total: number) {
    stop()
    seconds.value = Math.max(0, Math.ceil(total))
    if (seconds.value === 0) return
    timer = setInterval(() => {
      seconds.value -= 1
      if (seconds.value <= 0) {
        seconds.value = 0
        stop()
      }
    }, 1000)
  }

  onScopeDispose(stop)
  return { seconds, start }
}
