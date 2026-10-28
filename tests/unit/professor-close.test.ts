import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { ApiError, configureHttp } from '~/services/http'
import * as professorService from '~/services/professor'
import { useProfessorStore } from '~/stores/professor'
import type { ProfClassroom, ProfMission } from '~/types/api'

const fetchMock = vi.fn()

const classroom: ProfClassroom = { id: 4, name: 'Turma A', join_code: 'ABC123', weekly_goal: null, closed: false, goal: null }
const mission = (id: number, position: number): ProfMission => ({
  id, classroom_id: 4, title: `Missão ${id}`, description: null, position, status: 'draft', challenges: [],
})

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('$fetch', fetchMock)
  configureHttp({ baseURL: 'http://api.test', getToken: () => 'tok', onUnauthorized: vi.fn() })
  setActivePinia(createPinia())
})

describe('professor close and reopen', () => {
  it('T-FE-PROF-CLOSE-01 the service sends POST close and POST reopen', async () => {
    fetchMock.mockResolvedValue({ ...classroom, closed: true })
    await professorService.closeClassroom(4)
    await professorService.reopenClassroom(4)

    expect(fetchMock.mock.calls[0]![0]).toBe('/api/professor/classrooms/4/close')
    expect(fetchMock.mock.calls[0]![1].method).toBe('POST')
    expect(fetchMock.mock.calls[1]![0]).toBe('/api/professor/classrooms/4/reopen')
    expect(fetchMock.mock.calls[1]![1].method).toBe('POST')
  })

  it('T-FE-PROF-CLOSE-01 the store replaces the turma in the open page and in the list', async () => {
    const store = useProfessorStore()
    store.classroom = classroom
    store.classrooms = [classroom, { ...classroom, id: 5 }]

    fetchMock.mockResolvedValueOnce({ ...classroom, closed: true })
    await store.closeClassroom(4)
    expect(store.classroom?.closed).toBe(true)
    expect(store.classrooms.map((c) => c.closed)).toEqual([true, false])

    fetchMock.mockResolvedValueOnce({ ...classroom, closed: false })
    await store.reopenClassroom(4)
    expect(store.classroom?.closed).toBe(false)
    expect(store.classrooms.map((c) => c.closed)).toEqual([false, false])
  })
})

describe('professor mission order', () => {
  it('T-FE-PROF-ORDER-01 the service sends PUT .../missions/order with mission_ids', async () => {
    fetchMock.mockResolvedValue([])
    await professorService.setMissionOrder(4, [2, 1, 3])
    const [path, options] = fetchMock.mock.calls[0]!
    expect(path).toBe('/api/professor/classrooms/4/missions/order')
    expect(options.method).toBe('PUT')
    expect(options.body).toEqual({ mission_ids: [2, 1, 3] })
  })

  it('T-FE-PROF-ORDER-01 a failure leaves the missions as they were', async () => {
    const store = useProfessorStore()
    store.missions = [mission(1, 0), mission(2, 1)]
    fetchMock.mockRejectedValue(new Error('Falhou.'))
    await expect(store.moveMission(1, 1)).rejects.toThrow()
    expect(store.missions.map((m) => m.id)).toEqual([1, 2])
  })
})

describe('professor members and join code', () => {
  it('T-FE-PROF-MEMBER-01 the service sends DELETE with the username encoded', async () => {
    fetchMock.mockResolvedValue(null)
    await professorService.removeMember(4, 'ana.b/c d')
    const [path, options] = fetchMock.mock.calls[0]!
    expect(path).toBe('/api/professor/classrooms/4/members/ana.b%2Fc%20d')
    expect(options.method).toBe('DELETE')
  })

  it('T-FE-PROF-MEMBER-03 the store reads progress, turma and ranking again after a removal and after member_not_found', async () => {
    const store = useProfessorStore()
    const report = { completed_all_pct: 0, students: [] }
    const ranked = { scope: 'classroom', period: 'week', entries: [] }
    const reads = (path: string) => fetchMock.mock.calls.map((c) => c[0] as string).filter((p) => p === path).length
    fetchMock.mockImplementation(async (path: string) => {
      if (path.endsWith('/progress')) return report
      if (path.endsWith('/rankings')) return ranked
      if (path.endsWith('/classrooms/4')) return { ...classroom, join_code: 'FRESH1' }
      return null
    })
    await store.removeMember(4, 'ana')
    expect(reads('/api/professor/classrooms/4/progress')).toBe(1)
    expect(reads('/api/professor/classrooms/4/rankings')).toBe(1)
    expect(reads('/api/professor/classrooms/4')).toBe(1)
    expect(store.progress).toEqual(report)
    expect(store.ranking).toEqual(ranked)

    fetchMock.mockReset()
    store.progress = null
    store.ranking = null
    const gone = Object.assign(new Error('x'), {
      data: { detail: 'member_not_found', message: 'Estudante não encontrado.' },
      response: { status: 404, headers: new Headers() },
    })
    fetchMock.mockImplementation(async (path: string, options: { method?: string }) => {
      if (options.method === 'DELETE') throw gone
      if (path.endsWith('/progress')) return report
      if (path.endsWith('/rankings')) return ranked
      return classroom
    })
    const error = await store.removeMember(4, 'ana').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(store.progress).toEqual(report)
    expect(store.ranking).toEqual(ranked)
  })

  it('T-FE-PROF-CODE-01 the service sends POST new-code and the store shows the new code', async () => {
    const store = useProfessorStore()
    store.classroom = classroom
    store.classrooms = [classroom]
    fetchMock.mockResolvedValue({ ...classroom, join_code: 'NEW999' })
    await store.renewJoinCode(4)
    expect(fetchMock.mock.calls[0]![0]).toBe('/api/professor/classrooms/4/new-code')
    expect(fetchMock.mock.calls[0]![1].method).toBe('POST')
    expect(store.classroom?.join_code).toBe('NEW999')
    expect(store.classrooms[0]!.join_code).toBe('NEW999')
  })
})
