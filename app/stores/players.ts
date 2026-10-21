import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as studentService from '~/services/student'
import type { PublicProfile } from '~/types/api'
import { errorMessage } from '~/utils/format'

// Public profile of another student (spec §5): only when that student turned it on.
export const usePlayersStore = defineStore('players', () => {
  const player = ref<PublicProfile | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load(username: string) {
    loading.value = true
    error.value = null
    player.value = null
    try {
      player.value = await studentService.getPlayer(username)
    }
    catch (e) {
      error.value = errorMessage(e)
    }
    finally {
      loading.value = false
    }
  }

  return { player, loading, error, load }
})
