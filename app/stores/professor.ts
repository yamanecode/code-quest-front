import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as professorService from '~/services/professor'
import type {
  ChallengeInput,
  ClassroomInput,
  DraftRequest,
  MissionCreateInput,
  MissionInput,
  ProfChallenge,
  ProfClassroom,
  ProfMission,
  Progress,
  Ranking,
  RankingPeriod,
  Review,
} from '~/types/api'
import type { ChallengeType } from '~/types/challenge'
import { errorMessage } from '~/utils/format'

// Everything the professor pages show: turmas, missions, challenges. The load functions keep
// their failure in `error`; the save functions throw so the form that sent them can show it.
export const useProfessorStore = defineStore('professor', () => {
  const classrooms = ref<ProfClassroom[]>([])
  const classroom = ref<ProfClassroom | null>(null)
  const missions = ref<ProfMission[]>([])
  const progress = ref<Progress | null>(null)
  const ranking = ref<Ranking | null>(null)
  const rankingPeriod = ref<RankingPeriod>('week')
  const mission = ref<ProfMission | null>(null)
  const challenges = ref<ProfChallenge[]>([])
  const challengesLoaded = ref(false)
  const typeFilter = ref<ChallengeType | 'all'>('all')
  const statusFilter = ref<'draft' | 'published' | 'all'>('all')
  const loading = ref(false)
  const error = ref<string | null>(null)

  // The API has no query filters (spec §8.4): filter here.
  const filteredChallenges = computed(() =>
    challenges.value.filter(
      (c) =>
        (typeFilter.value === 'all' || c.type === typeFilter.value) &&
        (statusFilter.value === 'all' || c.status === statusFilter.value),
    ),
  )

  async function guarded(task: () => Promise<void>) {
    loading.value = true
    error.value = null
    try {
      await task()
    }
    catch (e) {
      error.value = errorMessage(e)
    }
    finally {
      loading.value = false
    }
  }

  // Turmas

  const loadClassrooms = () =>
    guarded(async () => {
      classrooms.value = await professorService.listClassrooms()
    })

  async function createClassroom(input: ClassroomInput) {
    const created = await professorService.createClassroom(input)
    classrooms.value = [...classrooms.value, created]
    return created
  }

  const loadClassroom = (id: number) =>
    guarded(async () => {
      const [found, list, report] = await Promise.all([
        professorService.getClassroom(id),
        professorService.listMissions(id),
        professorService.getClassroomProgress(id),
      ])
      classroom.value = found
      missions.value = list
      progress.value = report
      ranking.value = await professorService.getClassroomRanking(id, rankingPeriod.value)
    })

  async function updateClassroom(id: number, input: ClassroomInput) {
    classroom.value = await professorService.updateClassroom(id, input)
    return classroom.value
  }

  async function loadRanking(id: number, period: RankingPeriod) {
    rankingPeriod.value = period
    await guarded(async () => {
      ranking.value = await professorService.getClassroomRanking(id, period)
    })
  }

  // Missions

  async function createMission(classroomId: number, input: MissionCreateInput) {
    const created = await professorService.createMission(classroomId, input)
    missions.value = [...missions.value, created]
    return created
  }

  const loadMission = (id: number) =>
    guarded(async () => {
      mission.value = await professorService.getMission(id)
    })

  async function updateMission(id: number, input: MissionInput) {
    mission.value = await professorService.updateMission(id, input)
    return mission.value
  }

  async function setMissionChallenges(id: number, challengeIds: number[]) {
    mission.value = await professorService.setMissionChallenges(id, challengeIds)
    return mission.value
  }

  async function publishMission(id: number) {
    mission.value = await professorService.publishMission(id)
    return mission.value
  }

  async function unpublishMission(id: number) {
    mission.value = await professorService.unpublishMission(id)
    return mission.value
  }

  async function deleteMission(id: number) {
    await professorService.deleteMission(id)
    missions.value = missions.value.filter((m) => m.id !== id)
    mission.value = null
  }

  // Challenges

  const loadChallenges = () =>
    guarded(async () => {
      challenges.value = await professorService.listChallenges()
      challengesLoaded.value = true
    })

  function remember(challenge: ProfChallenge) {
    const exists = challenges.value.some((c) => c.id === challenge.id)
    challenges.value = exists
      ? challenges.value.map((c) => (c.id === challenge.id ? challenge : c))
      : [challenge, ...challenges.value]
    return challenge
  }

  const getChallenge = (id: number) => professorService.getChallenge(id)
  const createChallenge = async (input: ChallengeInput) => remember(await professorService.createChallenge(input))
  const updateChallenge = async (id: number, input: ChallengeInput) =>
    remember(await professorService.updateChallenge(id, input))
  const duplicateChallenge = async (id: number) => remember(await professorService.duplicateChallenge(id))
  const publishChallenge = async (id: number) => remember(await professorService.publishChallenge(id))
  const unpublishChallenge = async (id: number) => remember(await professorService.unpublishChallenge(id))

  async function deleteChallenge(id: number) {
    await professorService.deleteChallenge(id)
    challenges.value = challenges.value.filter((c) => c.id !== id)
  }

  const reviewChallenge = (id: number): Promise<Review> => professorService.reviewChallenge(id)

  // The draft is saved by the backend with status "draft"; with a mission it is also added there.
  async function generateDraft(request: DraftRequest) {
    return remember(await professorService.generateDraft(request))
  }

  return {
    classrooms, classroom, missions, progress, ranking, rankingPeriod, mission, challenges, challengesLoaded,
    typeFilter, statusFilter, filteredChallenges, loading, error,
    loadClassrooms, createClassroom, loadClassroom, updateClassroom, loadRanking,
    createMission, loadMission, updateMission, setMissionChallenges, publishMission, unpublishMission, deleteMission,
    loadChallenges, getChallenge, createChallenge, updateChallenge, duplicateChallenge, publishChallenge,
    unpublishChallenge, deleteChallenge, reviewChallenge, generateDraft,
  }
})
