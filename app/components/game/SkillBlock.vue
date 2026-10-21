<script setup lang="ts">
import type { ChallengeType } from '~/types/challenge'
import { SKILLS } from '~/utils/skills'

// A card naming one skill with a highlighter swipe in its colour, optionally with its one-line description.
const props = withDefaults(defineProps<{ type: ChallengeType; description?: boolean }>(), { description: false })

const MARK: Record<ChallengeType, string> = {
  ordering: 'cq-mark-ordering',
  grouping: 'cq-mark-grouping',
  filtering: 'cq-mark-filtering',
  pattern: 'cq-mark-pattern',
}
</script>

<template>
  <div
    class="cq-sheet flex min-h-[4.5rem] flex-col p-3 sm:p-4"
    :class="props.description ? 'justify-start' : 'justify-end'"
    :data-testid="`skill-block-${props.type}`"
  >
    <p class="font-display text-lg font-bold leading-tight text-ink"><span class="cq-mark px-0.5" :class="MARK[props.type]">{{ SKILLS[props.type].label }}</span></p>
    <p v-if="props.description" class="mt-1 leading-snug">{{ SKILLS[props.type].description }}</p>
  </div>
</template>
