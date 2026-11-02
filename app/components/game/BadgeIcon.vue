<script setup lang="ts">
import { computed } from 'vue'
import type { Tier } from '~/types/api'
import type { BadgeFamily } from '~/utils/badges'

// A badge drawn as a sticker (spec §9.2): a disc in the tier colour with a white die-cut edge
// and the symbol of the badge's family, all inline SVG (no image files). Locked badges are a
// dashed outline with the symbol in grey; a secret one shows "?".
const props = defineProps<{ family: BadgeFamily | 'secret'; tier: Tier; earned: boolean }>()

const ink = computed(() => (props.earned ? 'var(--cq-badge-glyph)' : 'var(--cq-control)'))
const SKILL_SQUARES = [
  { x: 4, y: 4, color: 'var(--cq-ordering)' },
  { x: 12.6, y: 4, color: 'var(--cq-grouping)' },
  { x: 4, y: 12.6, color: 'var(--cq-filtering)' },
  { x: 12.6, y: 12.6, color: 'var(--cq-pattern)' },
]
</script>

<template>
  <svg viewBox="0 0 64 64" aria-hidden="true" data-testid="badge-icon" :data-family="props.family" class="overflow-visible">
    <template v-if="props.earned">
      <circle cx="32" cy="34" r="27" style="fill: var(--cq-shadow)" />
      <circle
        cx="32"
        cy="31"
        r="26"
        :style="{ fill: `var(--cq-${props.tier})`, stroke: 'var(--cq-sticker-edge)' }"
        stroke-width="3"
        data-testid="badge-disc"
      />
      <circle cx="32" cy="31" r="20.5" fill="none" style="stroke: var(--cq-sticker-edge); stroke-opacity: 0.55" stroke-width="1.5" />
    </template>
    <circle
      v-else
      cx="32"
      cy="31"
      r="26"
      fill="none"
      style="stroke: var(--cq-control)"
      stroke-width="2.5"
      stroke-dasharray="5 4"
      data-testid="badge-disc"
    />

    <g transform="translate(20 19)" fill="none" :style="{ stroke: ink }" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <template v-if="props.family === 'secret'">
        <path d="M8.5 8.5a3.5 3.5 0 1 1 4.6 3.3c-.7.3-1.1 1-1.1 1.7v1.5" />
        <circle cx="12" cy="18.6" r="1.2" :style="{ fill: ink }" stroke="none" />
      </template>
      <path v-else-if="props.family === 'first_solve'" :style="{ fill: ink }" stroke="none" d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8L3.6 9.6l5.8-.8z" />
      <template v-else-if="props.family === 'ordering'">
        <path d="M4 19h4v-4h4v-4h4V7h4" />
        <path d="M16 3.5h4v4" />
      </template>
      <template v-else-if="props.family === 'grouping'">
        <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
        <rect x="14.5" y="14.5" width="7" height="7" rx="1" transform="rotate(12 18 18)" />
      </template>
      <path v-else-if="props.family === 'filtering'" d="M3.5 5h17l-6.5 7.5v6L10 20.5v-8z" />
      <template v-else-if="props.family === 'pattern'">
        <circle cx="5" cy="12" r="2.6" />
        <rect x="9.4" y="9.4" width="5.2" height="5.2" rx="0.6" />
        <circle cx="19" cy="12" r="2.6" stroke-dasharray="2 2" />
      </template>
      <template v-else-if="props.family === 'level'">
        <circle cx="12" cy="12" r="8.5" />
        <path :style="{ fill: ink }" stroke="none" d="M12 5.5l2.4 6.5L12 18.5 9.6 12z" />
      </template>
      <template v-else-if="props.family === 'mission'">
        <path d="M6 21V3.5" />
        <path d="M6 4.5h11l-2.5 4 2.5 4H6" />
      </template>
      <template v-else-if="props.family === 'first_try'">
        <circle cx="12" cy="12" r="8.5" />
        <circle cx="12" cy="12" r="4.6" />
        <circle cx="12" cy="12" r="1.6" :style="{ fill: ink }" stroke="none" />
      </template>
      <template v-else-if="props.family === 'class_goal'">
        <circle cx="8" cy="8.5" r="2.8" />
        <circle cx="16" cy="8.5" r="2.8" />
        <path d="M3 19c.6-3.2 2.6-5 5-5s4.4 1.8 5 5M11 19c.6-3.2 2.6-5 5-5s4.4 1.8 5 5" />
      </template>
      <template v-else-if="props.family === 'all_types_day'">
        <rect
          v-for="square in SKILL_SQUARES"
          :key="square.color"
          :x="square.x"
          :y="square.y"
          width="7.4"
          height="7.4"
          :style="{ fill: props.earned ? square.color : 'none' }"
          stroke-width="1.6"
        />
      </template>
      <template v-else-if="props.family === 'persistent'">
        <path d="M19 12a7 7 0 1 1-2.1-5" />
        <path d="M19.5 3.5v4h-4" />
        <path d="M9 12l2 2 4-4" />
      </template>
      <template v-else-if="props.family === 'explorer_base'">
        <path d="M3.5 6l5.5-2.5 6 2.5 5.5-2.5V18l-5.5 2.5-6-2.5-5.5 2.5z" />
        <path d="M9 3.5V18M15 6v14.5" />
      </template>
    </g>
  </svg>
</template>
