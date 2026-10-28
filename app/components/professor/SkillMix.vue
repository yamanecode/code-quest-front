<script setup lang="ts">
import { computed } from 'vue'
import { CHALLENGE_TYPES, type ChallengeType } from '~/types/challenge'
import { SKILLS } from '~/utils/skills'

// How the challenges of a mission are spread over the four skills: one bar split by skill
// colour (wider = more challenges) and the counts in words, so colour is never the only signal.
const props = defineProps<{ challenges: { type: ChallengeType }[] }>()

const BAND: Record<ChallengeType, string> = {
  ordering: 'bg-ordering',
  grouping: 'bg-grouping',
  filtering: 'bg-filtering',
  pattern: 'bg-pattern',
}

const parts = computed(() =>
  CHALLENGE_TYPES
    .map((type) => ({ type, count: props.challenges.filter((c) => c.type === type).length }))
    .filter((part) => part.count > 0),
)

const summary = computed(() => parts.value.map((part) => `${SKILLS[part.type].short}: ${part.count}`).join(', '))
</script>

<template>
  <div data-testid="skill-mix">
    <p v-if="parts.length === 0" class="text-sm text-muted" data-testid="skill-mix-empty">Sem desafios ainda.</p>
    <template v-else>
      <span class="flex h-3 border-2 border-line-strong bg-line" role="img" :aria-label="summary">
        <span v-for="part in parts" :key="part.type" class="h-full" :class="BAND[part.type]" :style="{ flexGrow: part.count }" :data-skill="part.type" />
      </span>
      <span class="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5" aria-hidden="true">
        <span v-for="part in parts" :key="part.type" class="inline-flex items-center gap-1.5 text-xs font-bold text-ink">
          <span class="h-2.5 w-2.5 border border-line-strong" :class="BAND[part.type]" />{{ SKILLS[part.type].short }} {{ part.count }}
        </span>
      </span>
    </template>
  </div>
</template>
