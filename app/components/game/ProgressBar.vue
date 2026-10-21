<script setup lang="ts">
import { computed } from 'vue'

// Accessible progress bar for XP, missions and the class goal (spec §9.2).
type Tone = 'ink' | 'progress' | 'ordering' | 'grouping' | 'filtering' | 'pattern'

const props = withDefaults(
  defineProps<{
    value: number
    max: number
    label: string // accessible name, e.g. "XP para o próximo nível"
    tone?: Tone
    size?: 'sm' | 'md'
    milestones?: number[] // percentages drawn as ticks (visual only)
    valueText?: string // read instead of "N of M" when the numbers need words
  }>(),
  { tone: 'ink', size: 'md', milestones: () => [], valueText: undefined },
)

const FILL: Record<Tone, string> = {
  ink: 'bg-ink',
  progress: 'bg-progress',
  ordering: 'bg-ordering',
  grouping: 'bg-grouping',
  filtering: 'bg-filtering',
  pattern: 'bg-pattern',
}

const clamped = computed(() => Math.min(Math.max(props.value, 0), props.max))
const percent = computed(() => (props.max > 0 ? (clamped.value / props.max) * 100 : 0))
</script>

<template>
  <div
    role="progressbar"
    :aria-label="props.label"
    :aria-valuenow="clamped"
    aria-valuemin="0"
    :aria-valuemax="props.max"
    :aria-valuetext="props.valueText"
    class="relative w-full bg-line ring-1 ring-inset ring-control"
    :class="props.size === 'sm' ? 'h-2' : 'h-3'"
  >
    <div
      class="h-full transition-[width] duration-700 ease-out"
      :class="FILL[props.tone]"
      :style="{ width: `${percent}%` }"
    />
    <span
      v-for="mark in props.milestones"
      :key="mark"
      aria-hidden="true"
      class="absolute -bottom-1 -top-1 w-0.5 bg-ink opacity-70"
      :style="{ left: `${mark}%` }"
    />
  </div>
</template>
