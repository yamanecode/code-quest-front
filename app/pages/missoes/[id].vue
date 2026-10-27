<script setup lang="ts">
import { computed, watch } from 'vue'
import { challengePath, usePlayStore } from '~/stores/play'
import { CHALLENGE_TYPES, type ChallengeType } from '~/types/challenge'

// One mission: a header card (title, description, skills, progress) and its challenges as
// rooms along a dashed line. Any room can be opened (free order, spec §5); the first unsolved
// one only carries a suggestion of where to continue.
definePageMeta({ layout: 'app' })

const route = useRoute()
const play = usePlayStore()

const BAND: Record<ChallengeType, string> = {
  ordering: 'bg-ordering',
  grouping: 'bg-grouping',
  filtering: 'bg-filtering',
  pattern: 'bg-pattern',
}

const id = computed(() => Number(route.params.id))
const mission = computed(() => (play.mission?.id === id.value ? play.mission : null))
const solvedCount = computed(() => mission.value?.challenges.filter((challenge) => challenge.solved).length ?? 0)
const skills = computed(() => {
  const used = new Set(mission.value?.challenges.map((challenge) => challenge.type))
  return CHALLENGE_TYPES.filter((type) => used.has(type))
})
const singleSkill = computed(() => (skills.value.length === 1 ? skills.value[0]! : null))
const suggestedId = computed(() => mission.value?.challenges.find((challenge) => !challenge.solved)?.id ?? null)

useHead({ title: () => `${mission.value?.title ?? 'Missão'} · CodeQuest` })

watch(id, (missionId) => play.loadMission(missionId), { immediate: true })
</script>

<template>
  <div class="max-w-3xl">
    <NuxtLink
      to="/inicio"
      class="inline-flex min-h-11 items-center text-sm font-semibold text-muted underline-offset-4 hover:text-ink hover:underline"
      data-testid="mission-back"
    >← Voltar ao início</NuxtLink>

    <p v-if="play.missionLoading" class="mt-6 text-muted" aria-live="polite">Carregando missão…</p>

    <div v-else-if="play.missionError" class="cq-alert mt-6 px-4 py-3" role="alert" data-testid="mission-error">
      <p>{{ play.missionError }}</p>
      <button
        type="button"
        class="mt-2 font-semibold underline underline-offset-4 hover:decoration-2"
        data-testid="mission-retry"
        @click="play.loadMission(id)"
      >Tentar de novo</button>
    </div>

    <article v-else-if="mission" class="mt-4" data-testid="mission">
      <section class="cq-sheet" data-testid="mission-head">
        <span class="flex h-3 border-b-2 border-line-strong" aria-hidden="true" data-testid="mission-band">
          <template v-if="skills.length > 0">
            <span v-for="skill in skills" :key="skill" class="flex-1" :class="BAND[skill]" :data-skill="skill" />
          </template>
          <span v-else class="flex-1 bg-line" />
        </span>
        <div class="grid gap-3 p-5 sm:p-6">
          <div v-if="skills.length > 0" class="flex flex-wrap gap-x-3 gap-y-1">
            <SkillTag v-for="skill in skills" :key="skill" :type="skill" :help="skills.length === 1" />
          </div>
          <h1 class="font-display text-3xl font-extrabold leading-tight sm:text-4xl">{{ mission.title }}</h1>
          <p v-if="mission.description" class="max-w-prose leading-relaxed">{{ mission.description }}</p>

          <p v-if="mission.challenges.length === 0" class="text-muted" data-testid="mission-empty">
            Nenhum desafio disponível ainda.
          </p>
          <div v-else>
            <div class="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <span class="cq-num text-lg text-ink" data-testid="mission-progress">{{ solvedCount }} de {{ mission.challenges.length }} resolvidos</span>
              <span class="text-sm text-muted">Resolva na ordem que quiser</span>
            </div>
            <ProgressBar
              :value="solvedCount"
              :max="mission.challenges.length"
              :label="`Progresso em ${mission.title}`"
              :tone="singleSkill ?? 'progress'"
            />
          </div>
        </div>
      </section>

      <ol
        v-if="mission.challenges.length > 0"
        class="relative mt-8 grid gap-4 pl-14 before:absolute before:bottom-6 before:left-[1.2rem] before:top-6 before:border-l-[3px] before:border-dashed before:border-line-strong before:content-['']"
        aria-label="Desafios da missão"
      >
        <li v-for="(challenge, index) in mission.challenges" :key="challenge.id" class="relative">
          <span
            class="absolute -left-14 top-1/2 z-10 -mt-5 grid h-10 w-10 place-items-center rounded-full border-[3px] border-line-strong font-display font-extrabold"
            :class="challenge.solved ? [BAND[challenge.type], 'text-on-skill'] : 'bg-panel text-ink'"
            aria-hidden="true"
          >{{ challenge.solved ? '✓' : index + 1 }}</span>
          <NuxtLink
            :to="challengePath(challenge.id, mission.id)"
            class="cq-sheet flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 transition-transform hover:-translate-y-0.5"
            :class="{ 'shadow-[0_0_0_5px_var(--cq-mark),0_6px_14px_var(--cq-shadow)]': challenge.id === suggestedId }"
            :data-testid="`mission-challenge-${challenge.id}`"
          >
            <span class="min-w-0 flex-1">
              <span class="block font-display text-lg font-bold leading-tight text-ink">
                <span class="sr-only">Desafio {{ index + 1 }}: </span>{{ challenge.title }}
              </span>
              <span class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <SkillTag :type="challenge.type" :help="false" />
                <span v-if="challenge.id === suggestedId" class="text-sm" data-testid="mission-suggestion">
                  <strong class="text-ink">Sugestão:</strong> continue por aqui
                </span>
              </span>
            </span>
            <span
              v-if="challenge.solved"
              class="font-semibold text-success"
              :data-testid="`mission-challenge-solved-${challenge.id}`"
            >✓ Resolvido</span>
            <span v-else class="font-bold text-ink">Abrir →</span>
          </NuxtLink>
        </li>

        <li class="relative" data-testid="mission-finish">
          <span
            class="absolute -left-14 top-1/2 z-10 -mt-5 grid h-10 w-10 place-items-center rounded-full border-[3px] border-dashed border-line-strong bg-panel text-ink"
            aria-hidden="true"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 21V3.5" /><path d="M6 4.5h11l-2.5 4 2.5 4H6" />
            </svg>
          </span>
          <p class="border-2 border-dashed border-line-strong px-4 py-3 font-semibold text-ink">
            Fim da trilha: resolva os {{ mission.challenges.length }} desafios para concluir a missão.
          </p>
        </li>
      </ol>
    </article>
  </div>
</template>
