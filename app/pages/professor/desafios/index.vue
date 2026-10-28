<script setup lang="ts">
import { onMounted } from 'vue'
import { useProfessorStore } from '~/stores/professor'
import { CHALLENGE_TYPES } from '~/types/challenge'
import type { ChallengeSortKey } from '~/utils/challengeSort'
import { SKILLS } from '~/utils/skills'

definePageMeta({ layout: 'app' })
useHead({ title: 'Meus desafios · CodeQuest' })

const professor = useProfessorStore()
onMounted(() => professor.loadChallenges())

const COLUMNS: { key: ChallengeSortKey, label: string }[] = [
  { key: 'title', label: 'Título' },
  { key: 'type', label: 'Habilidade' },
  { key: 'status', label: 'Situação' },
]

function ariaSort(key: ChallengeSortKey) {
  if (professor.sortKey !== key) return 'none'
  return professor.sortDir === 'asc' ? 'ascending' : 'descending'
}

const select = 'h-11 border-2 border-line-strong bg-panel px-3'
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="font-display text-4xl font-extrabold">Meus desafios</h1>
      <AppButton to="/professor/desafios/novo" variant="primary" data-testid="new-challenge">Novo desafio</AppButton>
    </div>

    <div class="mt-6 flex flex-wrap items-end gap-4">
      <label class="grid gap-1.5">
        <span class="text-sm font-semibold">Tipo</span>
        <select v-model="professor.typeFilter" :class="select" data-testid="filter-type">
          <option value="all">Todos</option>
          <option v-for="type in CHALLENGE_TYPES" :key="type" :value="type">{{ SKILLS[type].label }}</option>
        </select>
      </label>
      <label class="grid gap-1.5">
        <span class="text-sm font-semibold">Situação</span>
        <select v-model="professor.statusFilter" :class="select" data-testid="filter-status">
          <option value="all">Todas</option>
          <option value="draft">Rascunho</option>
          <option value="published">Publicado</option>
        </select>
      </label>
      <p v-if="professor.challengesLoaded" class="cq-num pb-2.5 text-muted" role="status" data-testid="challenges-count">
        {{ professor.filteredChallenges.length }} de {{ professor.challenges.length }} desafios
      </p>
    </div>

    <p v-if="professor.loading && !professor.challengesLoaded" class="mt-6 text-muted">Carregando desafios…</p>
    <div v-else-if="professor.error" role="alert" class="mt-6" data-testid="challenges-error">
      <p>{{ professor.error }}</p>
      <button type="button" class="mt-2 font-semibold underline underline-offset-4" data-testid="challenges-retry" @click="professor.loadChallenges()">Tentar de novo</button>
    </div>
    <p v-else-if="professor.filteredChallenges.length === 0" class="mt-6 text-muted" data-testid="challenges-empty">
      Nenhum desafio por aqui. Crie um novo ou mude os filtros.
    </p>

    <div v-else class="mt-4 overflow-x-auto">
      <table class="w-full min-w-[40rem] border-collapse border-2 border-line-strong bg-panel text-left" data-testid="challenges-table">
        <caption class="sr-only">Seus desafios. Use os botões do cabeçalho para ordenar.</caption>
        <thead class="bg-raised">
          <tr class="border-b-2 border-line-strong">
            <th v-for="column in COLUMNS" :key="column.key" scope="col" class="p-0" :aria-sort="ariaSort(column.key)">
              <button
                type="button"
                class="flex min-h-11 w-full items-center gap-1.5 px-3 py-2 text-left font-bold hover:underline underline-offset-4"
                :data-testid="`sort-${column.key}`"
                @click="professor.sortBy(column.key)"
              >
                {{ column.label }}
                <span class="w-3 text-sm" aria-hidden="true">{{ professor.sortKey === column.key ? (professor.sortDir === 'asc' ? '▲' : '▼') : '' }}</span>
              </button>
            </th>
            <th scope="col" class="px-3 py-2 font-bold">Acertos</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="challenge in professor.filteredChallenges"
            :key="challenge.id"
            class="border-b border-line last:border-b-0 hover:bg-raised"
            :data-testid="`challenge-${challenge.id}`"
          >
            <td class="px-3 py-2">
              <NuxtLink :to="`/professor/desafios/${challenge.id}`" class="font-semibold underline underline-offset-4" data-testid="challenge-title">{{ challenge.title }}</NuxtLink>
              <span v-if="challenge.origin === 'ai'" class="ml-2 whitespace-nowrap text-sm text-muted" data-testid="challenge-origin">gerado por IA</span>
            </td>
            <td class="px-3 py-2"><SkillTag :type="challenge.type" :help="false" /></td>
            <td class="px-3 py-2"><StatusBadge :status="challenge.status" data-testid="challenge-status" /></td>
            <td class="cq-num whitespace-nowrap px-3 py-2">
              <span v-if="challenge.status === 'published'" data-testid="challenge-stats">{{ challenge.solve_stats.solved }} de {{ challenge.solve_stats.attempted }} acertaram</span>
              <span v-else class="text-muted" data-testid="challenge-stats-none"><span aria-hidden="true">—</span><span class="sr-only">Sem acertos: ainda é rascunho</span></span>
            </td>
          </tr>
        </tbody>
      </table>

      <button
        v-if="professor.sortKey !== 'recent'"
        type="button"
        class="mt-3 min-h-11 font-semibold underline underline-offset-4"
        data-testid="sort-recent"
        @click="professor.sortBy('recent')"
      >Voltar à ordem dos mais recentes</button>
    </div>
  </div>
</template>
