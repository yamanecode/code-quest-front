<script setup lang="ts">
import type { ChallengeType } from '~/types/challenge'
import { SKILLS } from '~/utils/skills'

// The skill of a challenge type in its colour, with an optional "?" explaining it.
const props = withDefaults(defineProps<{ type: ChallengeType; help?: boolean }>(), { help: true })

const COLOR: Record<ChallengeType, string> = {
  ordering: 'bg-ordering',
  grouping: 'bg-grouping',
  filtering: 'bg-filtering',
  pattern: 'bg-pattern',
}
</script>

<template>
  <span class="inline-flex items-center gap-2" :data-testid="`skill-${props.type}`">
    <span
      class="px-2 py-0.5 font-display text-sm font-bold leading-6 text-on-color"
      :class="COLOR[props.type]"
    >{{ SKILLS[props.type].label }}</span>
    <HelpTip
      v-if="props.help"
      :topic="`skill-${props.type}`"
      :label="SKILLS[props.type].label"
      :text="SKILLS[props.type].description"
    />
  </span>
</template>
