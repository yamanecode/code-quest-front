import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as studentService from '~/services/student'
import type { Ranking, RankingPeriod, RankingQuery } from '~/types/api'
import { errorMessage } from '~/utils/format'

// 'global' or the id of one of the student's turmas.
export type RankingChoice = 'global' | number

// Ranking window around the student (spec §5: me ± 2), by scope and period.
export const useRankingStore = defineStore('ranking', () => {
  const scope = ref<RankingChoice>('global')
  const period = ref<RankingPeriod>('week')
  const ranking = ref<Ranking | null>(null)
  // The choice the shown ranking was loaded for; it lags `scope` while a new one loads.
  const shownScope = ref<RankingChoice>('global')
  const loading = ref(false)
  const error = ref<string | null>(null)
  // Only the answer to the latest request is shown when the student switches quickly.
  let latestRequest = 0

  function query(): RankingQuery {
    return scope.value === 'global'
      ? { scope: 'global', period: period.value }
      : { scope: 'classroom', period: period.value, classroom_id: scope.value }
  }

  async function load() {
    const request = ++latestRequest
    const choice = scope.value
    loading.value = true
    error.value = null
    try {
      const result = await studentService.getRanking(query())
      if (request === latestRequest) {
        ranking.value = result
        shownScope.value = choice
      }
    }
    catch (e) {
      if (request === latestRequest) {
        ranking.value = null
        error.value = errorMessage(e)
      }
    }
    finally {
      if (request === latestRequest) loading.value = false
    }
  }

  function setScope(value: RankingChoice) {
    scope.value = value
    return load()
  }

  function setPeriod(value: RankingPeriod) {
    period.value = value
    return load()
  }

  return { scope, period, ranking, shownScope, loading, error, load, setScope, setPeriod }
})
