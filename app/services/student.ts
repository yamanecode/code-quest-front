import type {
  ChallengeForStudent,
  Daily,
  HintResult,
  MissionDetail,
  Missions,
  Profile,
  PublicProfile,
  RecoveryCodeIssued,
  Ranking,
  RankingQuery,
  Settings,
  SubmissionResult,
} from '~/types/api'
import type { Answer } from '~/types/challenge'
import { apiFetch } from './http'

export function getMe(): Promise<Profile> {
  return apiFetch<Profile>('/api/me')
}

export function regenerateRecoveryCode(password: string): Promise<RecoveryCodeIssued> {
  return apiFetch<RecoveryCodeIssued>('/api/me/recovery-code', { method: 'POST', body: { password } })
}

export async function confirmRecoveryCode(): Promise<void> {
  await apiFetch<unknown>('/api/me/recovery-code/confirm', { method: 'POST' })
}

export function updateSettings(settings: Settings): Promise<Settings> {
  return apiFetch<Settings>('/api/me/settings', { method: 'PUT', body: settings })
}

export function getMissions(): Promise<Missions> {
  return apiFetch<Missions>('/api/missions')
}

export function getMission(id: number): Promise<MissionDetail> {
  return apiFetch<MissionDetail>(`/api/missions/${id}`)
}

export function getChallenge(id: number): Promise<ChallengeForStudent> {
  return apiFetch<ChallengeForStudent>(`/api/challenges/${id}`)
}

export function submitAnswer(challengeId: number, answer: Answer): Promise<SubmissionResult> {
  return apiFetch<SubmissionResult>(`/api/challenges/${challengeId}/submissions`, {
    method: 'POST',
    body: { answer },
  })
}

export function requestHint(challengeId: number): Promise<HintResult> {
  return apiFetch<HintResult>(`/api/challenges/${challengeId}/hints`, { method: 'POST' })
}

export function getDailyChallenge(): Promise<Daily> {
  return apiFetch<Daily>('/api/daily-challenge')
}

export function getRanking(query: RankingQuery): Promise<Ranking> {
  return apiFetch<Ranking>('/api/rankings', {
    query: { scope: query.scope, period: query.period, classroom_id: query.classroom_id },
  })
}

export function getPlayer(username: string): Promise<PublicProfile> {
  return apiFetch<PublicProfile>(`/api/players/${encodeURIComponent(username)}`)
}
