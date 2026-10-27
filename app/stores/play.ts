import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as studentService from '~/services/student'
import type { ChallengeSummary, Daily, MissionDetail, Missions } from '~/types/api'
import { CHALLENGE_TYPES, type ChallengeType } from '~/types/challenge'
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
  // The skills each mission's challenges use, in the fixed skill order, so trail cards can
  // take their colours. The mission list does not carry them, so each mission is read once.
  const missionSkills = ref<Record<number, ChallengeType[]>>({})

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
      void loadMissionSkills(missionList)
    }
    catch (e) {
      homeError.value = errorMessage(e)
    }
    finally {
      homeLoading.value = false
    }
  }

  // Fills missionSkills for missions not read yet. A failure only leaves that card uncoloured.
  async function loadMissionSkills(list: Missions) {
    const ids = [...list.base, ...list.classrooms.flatMap((classroom) => classroom.missions)]
      .map((summary) => summary.id)
      .filter((id) => !(id in missionSkills.value))
    const details = await Promise.allSettled(ids.map((id) => studentService.getMission(id)))
    const found: Record<number, ChallengeType[]> = {}
    details.forEach((result, index) => {
      if (result.status !== 'fulfilled') return
      const used = new Set(result.value.challenges.map((challenge) => challenge.type))
      found[ids[index]!] = CHALLENGE_TYPES.filter((type) => used.has(type))
    })
    missionSkills.value = { ...missionSkills.value, ...found }
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
    if (missionId === null) return '/inicio'
    try {
      const detail = await studentService.getMission(missionId)
      const next = nextUnsolved(detail.challenges, currentId)
      return next ? challengePath(next.id, missionId) : '/inicio'
    }
    catch {
      return '/inicio'
    }
  }

  return {
    missions,
    daily,
    homeLoading,
    homeError,
    missionSkills,
    mission,
    missionLoading,
    missionError,
    loadHome,
    loadMission,
    firstBasePath,
    nextChallengePath,
  }
})
