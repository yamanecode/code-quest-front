<script setup lang="ts">
import { computed } from 'vue'
import type { MissionSummary } from '~/types/api'
import type { ChallengeType } from '~/types/challenge'
import { SKILLS } from '~/utils/skills'

// One mission on the home: a band in the colour of its skill (one segment per skill when it
// mixes several), progress, or a note when it has no challenge yet (spec §8.4).
const props = withDefaults(defineProps<{ mission: MissionSummary; skills?: ChallengeType[] }>(), { skills: () => [] })

const BAND: Record<ChallengeType, string> = {
  ordering: 'bg-ordering',
  grouping: 'bg-grouping',
  filtering: 'bg-filtering',
  pattern: 'bg-pattern',
}

const single = computed(() => (props.skills.length === 1 ? props.skills[0]! : null))
</script>

<template>
  <NuxtLink
    :to="`/missoes/${props.mission.id}`"
    class="cq-sheet flex h-full flex-col transition-transform hover:-translate-y-0.5"
    :data-testid="`mission-${props.mission.id}`"
  >
    <span class="flex h-3 border-b-2 border-line-strong" aria-hidden="true" data-testid="mission-band">
      <template v-if="props.skills.length > 0">
        <span v-for="skill in props.skills" :key="skill" class="flex-1" :class="BAND[skill]" :data-skill="skill" />
      </template>
      <span v-else class="flex-1 bg-line" />
    </span>

    <span class="flex flex-1 flex-col p-4">
      <span class="font-display text-xl font-bold leading-tight text-ink">{{ props.mission.title }}</span>
      <span v-if="props.mission.description" class="mt-1 line-clamp-3 text-sm leading-snug text-muted">{{ props.mission.description }}</span>
      <span v-if="props.skills.length > 1" class="mt-2 flex flex-wrap gap-x-3 gap-y-1" data-testid="mission-skills">
        <span v-for="skill in props.skills" :key="skill" class="inline-flex items-center gap-1.5 text-xs font-bold text-ink">
          <span class="h-2.5 w-2.5 border border-line-strong" :class="BAND[skill]" aria-hidden="true" />{{ SKILLS[skill].short }}
        </span>
      </span>
      <span class="mt-auto pt-4">
        <span v-if="props.mission.total === 0" class="text-sm text-muted" data-testid="mission-empty">
          Nenhum desafio disponível ainda.
        </span>
        <template v-else>
          <span class="mb-1.5 flex justify-between text-sm">
            <span class="cq-num" data-testid="mission-progress">{{ props.mission.solved }} de {{ props.mission.total }} resolvidos</span>
            <span v-if="props.mission.solved === props.mission.total" class="font-semibold text-success">✓ Completa</span>
          </span>
          <ProgressBar
            :value="props.mission.solved"
            :max="props.mission.total"
            :label="`Progresso em ${props.mission.title}`"
            size="sm"
            :tone="single ?? 'progress'"
          />
        </template>
      </span>
    </span>
  </NuxtLink>
</template>
