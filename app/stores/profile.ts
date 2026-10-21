import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as studentService from '~/services/student'
import type { Profile } from '~/types/api'
import { errorMessage } from '~/utils/format'

// The student's own profile (GET /api/me): feeds the header stats and the profile page.
export const useProfileStore = defineStore('profile', () => {
  const profile = ref<Profile | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  // Bumped after a correct answer that earned XP, so the header can celebrate it.
  const xpPulse = ref(0)

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

  function celebrateXp() {
    xpPulse.value += 1
  }

  function clear() {
    profile.value = null
    error.value = null
  }

  return { profile, loading, error, xpPulse, load, setPublic, celebrateXp, clear }
})
