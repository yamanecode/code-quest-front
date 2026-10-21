<script setup lang="ts">
import type { ChallengeType } from '~/types/challenge'
import { SKILLS } from '~/utils/skills'

// The skill of a challenge type as a highlighter swipe in its colour, with an optional "?" explaining it.
const props = withDefaults(defineProps<{ type: ChallengeType; help?: boolean }>(), { help: true })

const MARK: Record<ChallengeType, string> = {
  ordering: 'cq-mark-ordering',
  grouping: 'cq-mark-grouping',
  filtering: 'cq-mark-filtering',
  pattern: 'cq-mark-pattern',
}
</script>

<template>
  <span class="inline-flex items-center gap-2" :data-testid="`skill-${props.type}`">
    <span
      class="cq-mark cq-mark-in px-1 font-display text-sm font-bold leading-6 text-on-color"
      :class="MARK[props.type]"
    >{{ SKILLS[props.type].label }}</span>
    <HelpTip
      v-if="props.help"
      :topic="`skill-${props.type}`"
      :label="SKILLS[props.type].label"
      :text="SKILLS[props.type].description"
    />
  </span>
</template>
