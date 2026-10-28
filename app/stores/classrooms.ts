import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as classroomService from '~/services/classrooms'
import type { ClassroomRef, MyClassroom } from '~/types/api'
import { errorMessage } from '~/utils/format'

// The turmas the student is a member of, with this week's class goal.
export const useClassroomsStore = defineStore('classrooms', () => {
  const list = ref<MyClassroom[]>([])
  const loaded = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load() {
    loading.value = true
    error.value = null
    try {
      list.value = await classroomService.listMyClassrooms()
      loaded.value = true
    }
    catch (e) {
      error.value = errorMessage(e)
    }
    finally {
      loading.value = false
    }
  }

  // The join response has no goal, so the list is reloaded. Errors reach the caller.
  async function join(joinCode: string): Promise<ClassroomRef> {
    const classroom = await classroomService.joinClassroom(joinCode.trim().toUpperCase())
    await load()
    return classroom
  }

  async function leave(id: number) {
    await classroomService.leaveClassroom(id)
    list.value = list.value.filter((classroom) => classroom.id !== id)
  }

  function goalOf(id: number) {
    return list.value.find((classroom) => classroom.id === id)?.goal ?? null
  }

  function isClosed(id: number) {
    return list.value.find((classroom) => classroom.id === id)?.closed ?? false
  }

  return { list, loaded, loading, error, load, join, leave, goalOf, isClosed }
})
