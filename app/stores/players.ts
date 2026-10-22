import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ApiError } from '~/services/http'
import * as studentService from '~/services/student'
import type { PublicProfile } from '~/types/api'
import { errorMessage } from '~/utils/format'

const PRIVATE_PROFILE = 'Este perfil é privado.'

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
      // The API answers 404 for a private profile and for an unknown name alike, so the page
      // says "private" for both and does not reveal which usernames exist.
      error.value = e instanceof ApiError && e.detail === 'player_not_found' ? PRIVATE_PROFILE : errorMessage(e)
    }
    finally {
      loading.value = false
    }
  }

  return { player, loading, error, load }
})
