<script setup lang="ts">
import type { ChallengeType } from '~/types/challenge'

// A little upright rectangle in the colour of the skill, so the type shows at a glance.
const props = defineProps<{ type: ChallengeType }>()

const COLOR: Record<ChallengeType, string> = {
  ordering: 'bg-ordering',
  grouping: 'bg-grouping',
  filtering: 'bg-filtering',
  pattern: 'bg-pattern',
}
</script>

<template>
  <span class="inline-block h-7 w-2 shrink-0" :class="COLOR[props.type]" aria-hidden="true" />
</template>
