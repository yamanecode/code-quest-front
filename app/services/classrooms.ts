// Student membership in turmas.

import type { ClassroomRef, MyClassroom } from '~/types/api'
import { apiFetch } from './http'

export function listMyClassrooms(): Promise<MyClassroom[]> {
  return apiFetch<MyClassroom[]>('/api/classrooms')
}

export function joinClassroom(joinCode: string): Promise<ClassroomRef> {
  return apiFetch<ClassroomRef>('/api/classrooms/join', { method: 'POST', body: { join_code: joinCode } })
}

export async function leaveClassroom(id: number): Promise<void> {
  await apiFetch<unknown>(`/api/classrooms/${id}/membership`, { method: 'DELETE' })
}
