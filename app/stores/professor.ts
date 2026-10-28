import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as professorService from '~/services/professor'
import { ApiError } from '~/services/http'
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
import { sortChallenges, type ChallengeSortKey } from '~/utils/challengeSort'
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

  const sortKey = ref<ChallengeSortKey>('recent')
  const sortDir = ref<'asc' | 'desc'>('asc')

  // Clicking the active column flips the direction; a new column starts ascending.
  function sortBy(key: ChallengeSortKey) {
    sortDir.value = sortKey.value === key && sortDir.value === 'asc' ? 'desc' : 'asc'
    sortKey.value = key
  }

  // The API has no query filters or ordering (spec §8.4): filter and sort here.
  const filteredChallenges = computed(() => {
    const shown = challenges.value.filter(
      (c) =>
        (typeFilter.value === 'all' || c.type === typeFilter.value) &&
        (statusFilter.value === 'all' || c.status === statusFilter.value),
    )
    return sortChallenges(shown, sortKey.value, sortDir.value)
  })

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

  // Both calls answer with the turma, which replaces the one held in state.
  function rememberClassroom(updated: ProfClassroom) {
    if (classroom.value?.id === updated.id) classroom.value = updated
    classrooms.value = classrooms.value.map((c) => (c.id === updated.id ? updated : c))
    return updated
  }

  const closeClassroom = async (id: number) => rememberClassroom(await professorService.closeClassroom(id))
  const reopenClassroom = async (id: number) => rememberClassroom(await professorService.reopenClassroom(id))

  const renewJoinCode = async (id: number) => rememberClassroom(await professorService.renewJoinCode(id))

  // A removal changes the table, the ranking, the member count and so the goal, so all of them are
  // read again. The student may also have left by themselves a moment ago; then it is read the same.
  async function reloadMembers(id: number) {
    const [report, found, ranked] = await Promise.all([
      professorService.getClassroomProgress(id),
      professorService.getClassroom(id),
      professorService.getClassroomRanking(id, rankingPeriod.value),
    ])
    progress.value = report
    ranking.value = ranked
    rememberClassroom(found)
  }

  async function removeMember(id: number, username: string) {
    try {
      await professorService.removeMember(id, username)
    }
    catch (e) {
      if (e instanceof ApiError && e.detail === 'member_not_found') await reloadMembers(id)
      throw e
    }
    await reloadMembers(id)
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

  // Swaps a mission with its neighbour and sends the whole new order in one call, so the server
  // either takes it all or nothing. On failure the list on screen stays as it was.
  async function moveMission(id: number, by: -1 | 1) {
    const ids = missions.value.map((m) => m.id)
    const from = ids.indexOf(id)
    const to = from + by
    if (from < 0 || to < 0 || to >= ids.length) return
    const [moved] = ids.splice(from, 1)
    ids.splice(to, 0, moved!)
    const classroomId = missions.value[0]!.classroom_id
    missions.value = await professorService.setMissionOrder(classroomId, ids)
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

  // Puts a challenge created elsewhere at the end of a mission, keeping the order it has.
  async function attachToMission(id: number, challengeId: number) {
    const current = await professorService.getMission(id)
    const ids = current.challenges.map((c) => c.id)
    if (!ids.includes(challengeId)) await professorService.setMissionChallenges(id, [...ids, challengeId])
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

  function rememberChallenge(challenge: ProfChallenge) {
    const exists = challenges.value.some((c) => c.id === challenge.id)
    challenges.value = exists
      ? challenges.value.map((c) => (c.id === challenge.id ? challenge : c))
      : [challenge, ...challenges.value]
    return challenge
  }

  const getChallenge = (id: number) => professorService.getChallenge(id)
  const createChallenge = async (input: ChallengeInput) => rememberChallenge(await professorService.createChallenge(input))
  const updateChallenge = async (id: number, input: ChallengeInput) =>
    rememberChallenge(await professorService.updateChallenge(id, input))
  const duplicateChallenge = async (id: number) => rememberChallenge(await professorService.duplicateChallenge(id))
  const publishChallenge = async (id: number) => rememberChallenge(await professorService.publishChallenge(id))
  const unpublishChallenge = async (id: number) => rememberChallenge(await professorService.unpublishChallenge(id))

  async function deleteChallenge(id: number) {
    await professorService.deleteChallenge(id)
    challenges.value = challenges.value.filter((c) => c.id !== id)
  }

  const reviewChallenge = (id: number): Promise<Review> => professorService.reviewChallenge(id)

  // The draft is saved by the backend with status "draft"; with a mission it is also added there.
  async function generateDraft(request: DraftRequest) {
    return rememberChallenge(await professorService.generateDraft(request))
  }

  return {
    classrooms, classroom, missions, progress, ranking, rankingPeriod, mission, challenges, challengesLoaded,
    typeFilter, statusFilter, sortKey, sortDir, sortBy, filteredChallenges, loading, error,
    loadClassrooms, createClassroom, loadClassroom, updateClassroom, closeClassroom, reopenClassroom, renewJoinCode, removeMember, loadRanking,
    createMission, moveMission, loadMission, updateMission, setMissionChallenges, attachToMission, publishMission, unpublishMission, deleteMission,
    loadChallenges, getChallenge, createChallenge, updateChallenge, duplicateChallenge, publishChallenge,
    unpublishChallenge, deleteChallenge, reviewChallenge, generateDraft,
  }
})
