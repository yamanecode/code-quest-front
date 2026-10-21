<script setup lang="ts">
import { computed, watch } from 'vue'
import { challengePath, usePlayStore } from '~/stores/play'

// One mission: its challenges in order, any of them can be opened (free order, spec §5).
definePageMeta({ layout: 'app' })

const route = useRoute()
const play = usePlayStore()

const id = computed(() => Number(route.params.id))
const mission = computed(() => (play.mission?.id === id.value ? play.mission : null))
const solvedCount = computed(() => mission.value?.challenges.filter((challenge) => challenge.solved).length ?? 0)

useHead({ title: () => `${mission.value?.title ?? 'Missão'} · CodeQuest` })

watch(id, (missionId) => play.loadMission(missionId), { immediate: true })
</script>

<template>
  <div class="max-w-3xl">
    <NuxtLink
      to="/"
      class="text-sm font-semibold text-muted underline-offset-4 hover:text-ink hover:underline"
      data-testid="mission-back"
    >← Voltar ao início</NuxtLink>

    <p v-if="play.missionLoading" class="mt-6 text-muted" aria-live="polite">Carregando missão…</p>

    <div v-else-if="play.missionError" class="mt-6" role="alert" data-testid="mission-error">
      <p>{{ play.missionError }}</p>
      <button
        type="button"
        class="mt-2 font-semibold underline underline-offset-4 hover:decoration-2"
        data-testid="mission-retry"
        @click="play.loadMission(id)"
      >Tentar de novo</button>
    </div>

    <article v-else-if="mission" class="mt-6" data-testid="mission">
      <h1 class="font-display text-4xl font-extrabold leading-tight">{{ mission.title }}</h1>
      <p v-if="mission.description" class="mt-2 text-lg leading-relaxed text-muted">{{ mission.description }}</p>

      <p v-if="mission.challenges.length === 0" class="mt-6 text-muted" data-testid="mission-empty">
        Nenhum desafio disponível ainda.
      </p>

      <template v-else>
        <div class="mt-6 max-w-sm">
          <p class="cq-num mb-1.5 text-lg" data-testid="mission-progress">{{ solvedCount }} de {{ mission.challenges.length }} resolvidos</p>
          <ProgressBar :value="solvedCount" :max="mission.challenges.length" :label="`Progresso em ${mission.title}`" />
        </div>
        <p class="mt-4 text-sm text-muted">Você pode abrir os desafios na ordem que quiser.</p>

        <ol class="mt-4 grid gap-2">
          <li v-for="(challenge, index) in mission.challenges" :key="challenge.id">
            <NuxtLink
              :to="challengePath(challenge.id, mission.id)"
              class="flex flex-wrap items-center gap-x-4 gap-y-2 border border-line-strong bg-panel px-4 py-3 transition-colors hover:border-ink"
              :data-testid="`mission-challenge-${challenge.id}`"
            >
              <span class="cq-num w-6 text-xl font-bold text-muted" aria-hidden="true">{{ index + 1 }}</span>
              <span class="min-w-0 flex-1">
                <span class="block font-semibold">{{ challenge.title }}</span>
                <SkillTag class="mt-1" :type="challenge.type" :help="false" />
              </span>
              <span
                v-if="challenge.solved"
                class="font-semibold text-go"
                :data-testid="`mission-challenge-solved-${challenge.id}`"
              >✓ Resolvido</span>
              <span v-else class="text-sm text-muted">A resolver</span>
            </NuxtLink>
          </li>
        </ol>
      </template>
    </article>
  </div>
</template>
