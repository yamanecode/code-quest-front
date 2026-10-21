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

  function clear() {
    profile.value = null
    error.value = null
  }

  return { profile, loading, error, load, clear }
})
