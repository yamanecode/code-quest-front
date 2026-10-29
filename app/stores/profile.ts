import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as studentService from '~/services/student'
import type { Profile } from '~/types/api'
import { RECOVERY_LATER_KEY } from '~/stores/auth'
import { errorMessage } from '~/utils/format'

function readLater(): boolean {
  try {
    return sessionStorage.getItem(RECOVERY_LATER_KEY) === '1'
  }
  catch {
    return false
  }
}

// The student's own profile (GET /api/me): feeds the header stats and the profile page.
export const useProfileStore = defineStore('profile', () => {
  const profile = ref<Profile | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  // Bumped after a correct answer that earned XP, so the header can celebrate it.
  const xpPulse = ref(0)
  // True while a RecoveryCodeModal is on screen: the reminder stays away then.
  const codeModalOpen = ref(false)
  const reminderLater = ref(readLater())
  const showRecoveryReminder = computed(
    () => !!profile.value && !profile.value.recovery_code_confirmed && !reminderLater.value && !codeModalOpen.value,
  )

  async function load() {
    loading.value = true
    error.value = null
    try {
      profile.value = await studentService.getMe()
    }
    catch (e) {
      error.value = errorMessage(e)
    }
    finally {
      loading.value = false
    }
  }

  // Opt-in public profile (spec §5). Errors reach the caller, which keeps the old value.
  async function setPublic(value: boolean) {
    const settings = await studentService.updateSettings({ profile_public: value })
    if (profile.value) profile.value.profile_public = settings.profile_public
  }

  // The code goes straight to the caller, which shows it once; nothing here keeps it.
  async function generateRecoveryCode(password: string): Promise<string> {
    const issued = await studentService.regenerateRecoveryCode(password)
    await load()
    return issued.recovery_code
  }

  async function confirmRecoveryCode() {
    await studentService.confirmRecoveryCode()
    if (profile.value) profile.value.recovery_code_confirmed = true
  }

  function postponeReminder() {
    reminderLater.value = true
    try {
      sessionStorage.setItem(RECOVERY_LATER_KEY, '1')
    }
    catch {
      // Storage can be blocked; the reminder then only hides until the page reloads.
    }
  }

  function celebrateXp() {
    xpPulse.value += 1
  }

  function clear() {
    profile.value = null
    error.value = null
    reminderLater.value = false
  }

  return {
    profile,
    loading,
    error,
    xpPulse,
    codeModalOpen,
    showRecoveryReminder,
    load,
    setPublic,
    generateRecoveryCode,
    confirmRecoveryCode,
    postponeReminder,
    celebrateXp,
    clear,
  }
})
