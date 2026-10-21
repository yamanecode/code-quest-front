<script setup lang="ts">
import { onMounted } from 'vue'
import { useProfessorStore } from '~/stores/professor'
import { CHALLENGE_TYPES } from '~/types/challenge'
import { SKILLS } from '~/utils/skills'

definePageMeta({ layout: 'app' })
useHead({ title: 'Meus desafios · CodeQuest' })

const professor = useProfessorStore()
onMounted(() => professor.loadChallenges())

const select = 'h-11 border-2 border-line-strong bg-panel px-3'
</script>

<template>
  <div class="max-w-4xl">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="font-display text-4xl font-extrabold">Meus desafios</h1>
      <NuxtLink
        to="/professor/desafios/novo"
        class="bg-go px-5 py-2.5 font-display text-lg font-bold text-on-go transition-colors hover:bg-go-hover cq-go-shadow"
        data-testid="new-challenge"
      >Novo desafio</NuxtLink>
    </div>

    <div class="mt-6 flex flex-wrap gap-4">
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
    </div>

    <p v-if="professor.loading && !professor.challengesLoaded" class="mt-6 text-muted">Carregando desafios…</p>
    <div v-else-if="professor.error" role="alert" class="mt-6" data-testid="challenges-error">
      <p>{{ professor.error }}</p>
      <button type="button" class="mt-2 font-semibold underline underline-offset-4" data-testid="challenges-retry" @click="professor.loadChallenges()">Tentar de novo</button>
    </div>
    <p v-else-if="professor.filteredChallenges.length === 0" class="mt-6 text-muted" data-testid="challenges-empty">
      Nenhum desafio por aqui. Crie um novo ou mude os filtros.
    </p>

    <ul v-else class="mt-6 grid gap-3">
      <li
        v-for="challenge in professor.filteredChallenges"
        :key="challenge.id"
        class="border-2 border-line-strong bg-panel p-4"
        :data-testid="`challenge-${challenge.id}`"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="min-w-0">
            <NuxtLink :to="`/professor/desafios/${challenge.id}`" class="font-display text-xl font-bold underline underline-offset-4" data-testid="challenge-title">{{ challenge.title }}</NuxtLink>
            <p class="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted">
              <SkillTag :type="challenge.type" :help="false" />
              <span data-testid="challenge-status">{{ challenge.status === 'published' ? 'Publicado' : 'Rascunho' }}</span>
              <span v-if="challenge.origin === 'ai'">Rascunho da IA</span>
            </p>
          </div>
          <p class="cq-num text-lg" data-testid="challenge-stats">
            {{ challenge.solve_stats.solved }} de {{ challenge.solve_stats.attempted }} acertaram
          </p>
        </div>
      </li>
    </ul>
  </div>
</template>
