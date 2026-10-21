import { defineStore } from 'pinia'
import { ref } from 'vue'

// Per-browser conveniences kept in localStorage: the mute switch (spec §9.2)
// and whether each student closed the welcome card (spec §9.3).
const MUTED_KEY = 'cq-muted'
const welcomeKey = (username: string) => `cq-welcome-${username}`

// Storage can be blocked (private windows, strict settings); the app still works without it.
function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  }
  catch {
    return null
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  }
  catch {
    // Nothing to do: the setting just lasts until the page is reloaded.
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const muted = ref(read(MUTED_KEY) === 'true')
  const dismissedWelcome = ref<Set<string>>(new Set())

  function setMuted(value: boolean) {
    muted.value = value
    write(MUTED_KEY, String(value))
  }

  function toggleMuted() {
    setMuted(!muted.value)
  }

  function isWelcomeDismissed(username: string): boolean {
    return dismissedWelcome.value.has(username) || read(welcomeKey(username)) === 'dismissed'
  }

  function dismissWelcome(username: string) {
    dismissedWelcome.value = new Set(dismissedWelcome.value).add(username)
    write(welcomeKey(username), 'dismissed')
  }

  return { muted, setMuted, toggleMuted, isWelcomeDismissed, dismissWelcome }
})
