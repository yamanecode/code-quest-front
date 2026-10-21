<script setup lang="ts">
import type { ChallengeType } from '~/types/challenge'
import { SKILLS } from '~/utils/skills'

// A full-colour block naming one skill, optionally with its one-line description.
const props = withDefaults(defineProps<{ type: ChallengeType; description?: boolean }>(), { description: false })

const COLOR: Record<ChallengeType, string> = {
  ordering: 'bg-ordering',
  grouping: 'bg-grouping',
  filtering: 'bg-filtering',
  pattern: 'bg-pattern',
}
</script>

<template>
  <div
    class="flex min-h-[4.5rem] flex-col p-3 text-on-color sm:p-4"
    :class="[COLOR[props.type], props.description ? 'justify-start' : 'justify-end']"
    :data-testid="`skill-block-${props.type}`"
  >
    <p class="font-display text-lg font-bold leading-tight">{{ SKILLS[props.type].label }}</p>
    <p v-if="props.description" class="mt-1 leading-snug">{{ SKILLS[props.type].description }}</p>
  </div>
</template>
