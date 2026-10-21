import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as studentService from '~/services/student'
import type { ChallengeSummary, Daily, MissionDetail, Missions } from '~/types/api'
import { errorMessage } from '~/utils/format'

export function challengePath(challengeId: number, missionId: number | null = null): string {
  return missionId === null ? `/desafios/${challengeId}` : `/desafios/${challengeId}?missao=${missionId}`
}

// The next unsolved challenge after `currentId`, wrapping to the start of the mission.
function nextUnsolved(challenges: ChallengeSummary[], currentId: number): ChallengeSummary | null {
  const index = challenges.findIndex((challenge) => challenge.id === currentId)
  const ordered = [...challenges.slice(index + 1), ...challenges.slice(0, Math.max(index, 0))]
  return ordered.find((challenge) => !challenge.solved && challenge.id !== currentId) ?? null
}

// What the student can play: missions on the home, the daily challenge and one mission's challenges.
export const usePlayStore = defineStore('play', () => {
  const missions = ref<Missions | null>(null)
  const daily = ref<Daily | null>(null)
  const homeLoading = ref(false)
  const homeError = ref<string | null>(null)

  const mission = ref<MissionDetail | null>(null)
  const missionLoading = ref(false)
  const missionError = ref<string | null>(null)

  async function loadHome() {
    homeLoading.value = true
    homeError.value = null
    try {
      const [missionList, dailyChallenge] = await Promise.all([
        studentService.getMissions(),
        studentService.getDailyChallenge(),
      ])
      missions.value = missionList
      daily.value = dailyChallenge
    }
    catch (e) {
      homeError.value = errorMessage(e)
    }
    finally {
      homeLoading.value = false
    }
  }

  async function loadMission(id: number) {
    missionLoading.value = true
    missionError.value = null
    mission.value = null
    try {
      mission.value = await studentService.getMission(id)
    }
    catch (e) {
      missionError.value = errorMessage(e)
    }
    finally {
      missionLoading.value = false
    }
  }

  // Where "Começar" on the welcome card leads: the first unsolved challenge of the
  // first base trilha, or that trilha's page when it is already done.
  async function firstBasePath(): Promise<string | null> {
    if (!missions.value) await loadHome()
    const first = missions.value?.base[0]
    if (!first) return null
    const detail = await studentService.getMission(first.id)
    const target = detail.challenges.find((challenge) => !challenge.solved)
    return target ? challengePath(target.id, first.id) : `/missoes/${first.id}`
  }

  // Where "Próximo desafio" leads (spec §9.1). Without a mission (daily challenge)
  // or with nothing left to solve, the student goes back home.
  async function nextChallengePath(missionId: number | null, currentId: number): Promise<string> {
    if (missionId === null) return '/'
    try {
      const detail = await studentService.getMission(missionId)
      const next = nextUnsolved(detail.challenges, currentId)
      return next ? challengePath(next.id, missionId) : '/'
    }
    catch {
      return '/'
    }
  }

  return {
    missions,
    daily,
    homeLoading,
    homeError,
    mission,
    missionLoading,
    missionError,
    loadHome,
    loadMission,
    firstBasePath,
    nextChallengePath,
  }
})
