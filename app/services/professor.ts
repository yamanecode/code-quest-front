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
import { apiFetch } from './http'

const BASE = '/api/professor'

// Turmas

export function listClassrooms(): Promise<ProfClassroom[]> {
  return apiFetch<ProfClassroom[]>(`${BASE}/classrooms`)
}

export function createClassroom(input: ClassroomInput): Promise<ProfClassroom> {
  return apiFetch<ProfClassroom>(`${BASE}/classrooms`, { method: 'POST', body: input })
}

export function getClassroom(id: number): Promise<ProfClassroom> {
  return apiFetch<ProfClassroom>(`${BASE}/classrooms/${id}`)
}

export function updateClassroom(id: number, input: ClassroomInput): Promise<ProfClassroom> {
  return apiFetch<ProfClassroom>(`${BASE}/classrooms/${id}`, { method: 'PUT', body: input })
}

export function getClassroomProgress(id: number): Promise<Progress> {
  return apiFetch<Progress>(`${BASE}/classrooms/${id}/progress`)
}

export function getClassroomRanking(id: number, period: RankingPeriod): Promise<Ranking> {
  return apiFetch<Ranking>(`${BASE}/classrooms/${id}/rankings`, { query: { period } })
}

// Missions

export function listMissions(classroomId: number): Promise<ProfMission[]> {
  return apiFetch<ProfMission[]>(`${BASE}/classrooms/${classroomId}/missions`)
}

export function createMission(classroomId: number, input: MissionCreateInput): Promise<ProfMission> {
  return apiFetch<ProfMission>(`${BASE}/classrooms/${classroomId}/missions`, { method: 'POST', body: input })
}

export function getMission(id: number): Promise<ProfMission> {
  return apiFetch<ProfMission>(`${BASE}/missions/${id}`)
}

export function updateMission(id: number, input: MissionInput): Promise<ProfMission> {
  return apiFetch<ProfMission>(`${BASE}/missions/${id}`, { method: 'PUT', body: input })
}

export async function deleteMission(id: number): Promise<void> {
  await apiFetch<unknown>(`${BASE}/missions/${id}`, { method: 'DELETE' })
}

export function setMissionChallenges(id: number, challengeIds: number[]): Promise<ProfMission> {
  return apiFetch<ProfMission>(`${BASE}/missions/${id}/challenges`, {
    method: 'PUT',
    body: { challenge_ids: challengeIds },
  })
}

export function publishMission(id: number): Promise<ProfMission> {
  return apiFetch<ProfMission>(`${BASE}/missions/${id}/publish`, { method: 'POST' })
}

export function unpublishMission(id: number): Promise<ProfMission> {
  return apiFetch<ProfMission>(`${BASE}/missions/${id}/unpublish`, { method: 'POST' })
}

// Challenges

export function listChallenges(): Promise<ProfChallenge[]> {
  return apiFetch<ProfChallenge[]>(`${BASE}/challenges`)
}

export function createChallenge(input: ChallengeInput): Promise<ProfChallenge> {
  return apiFetch<ProfChallenge>(`${BASE}/challenges`, { method: 'POST', body: input })
}

export function getChallenge(id: number): Promise<ProfChallenge> {
  return apiFetch<ProfChallenge>(`${BASE}/challenges/${id}`)
}

export function updateChallenge(id: number, input: ChallengeInput): Promise<ProfChallenge> {
  return apiFetch<ProfChallenge>(`${BASE}/challenges/${id}`, { method: 'PUT', body: input })
}

export async function deleteChallenge(id: number): Promise<void> {
  await apiFetch<unknown>(`${BASE}/challenges/${id}`, { method: 'DELETE' })
}

export function duplicateChallenge(id: number): Promise<ProfChallenge> {
  return apiFetch<ProfChallenge>(`${BASE}/challenges/${id}/duplicate`, { method: 'POST' })
}

export function publishChallenge(id: number): Promise<ProfChallenge> {
  return apiFetch<ProfChallenge>(`${BASE}/challenges/${id}/publish`, { method: 'POST' })
}

export function unpublishChallenge(id: number): Promise<ProfChallenge> {
  return apiFetch<ProfChallenge>(`${BASE}/challenges/${id}/unpublish`, { method: 'POST' })
}

export function reviewChallenge(id: number): Promise<Review> {
  return apiFetch<Review>(`${BASE}/challenges/${id}/ai-review`, { method: 'POST' })
}

export function generateDraft(request: DraftRequest): Promise<ProfChallenge> {
  return apiFetch<ProfChallenge>(`${BASE}/challenges/ai-draft`, { method: 'POST', body: request })
}
