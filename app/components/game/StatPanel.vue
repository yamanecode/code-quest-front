<script setup lang="ts">
import { computed } from 'vue'
import type { Profile } from '~/types/api'
import { HELP } from '~/utils/help'
import { XP_PER_LEVEL, levelLabel } from '~/utils/levels'

// The stat card pinned to the notebook (DESIGN.md "Stat Card"): level and title on an ink block,
// the XP bar on the paper beside it, so the game stats stand apart from the content.
// Used by the header on every student page and, in its place, by the profile page.

const props = withDefaults(
  defineProps<{
    profile: Profile
    prefix: string // data-testid and HelpTip prefix, e.g. "header" or "profile"
    pulsing?: boolean // short glow on the XP bar after a correct answer
    compact?: boolean // one row, for pages where the task comes first (challenge, turmas, ajuda)
  }>(),
  { pulsing: false, compact: false },
)

const xpInLevel = computed(() => XP_PER_LEVEL - props.profile.xp_to_next_level)
const label = computed(() => levelLabel(props.profile.level, props.profile.title))
</script>

<template>
  <div v-if="props.compact" class="cq-sheet flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2" :data-testid="`${props.prefix}-compact`">
    <p class="flex items-center gap-2" :data-testid="`${props.prefix}-level`">
      <span class="cq-invert px-3 py-1 font-display text-lg font-bold text-ink" :data-testid="`${props.prefix}-title`">{{ label }}</span>
      <HelpTip :topic="`${props.prefix}-title`" label="Nível e título" :text="HELP.title" />
    </p>

    <div :class="{ 'cq-xp-pulse': props.pulsing }" class="flex min-w-40 flex-1 items-center gap-2" :data-testid="`${props.prefix}-xp`">
      <ProgressBar class="flex-1" :value="xpInLevel" :max="XP_PER_LEVEL" label="XP do nível atual" tone="progress" />
      <span class="cq-num whitespace-nowrap text-sm text-ink">{{ props.profile.xp }} XP</span>
      <HelpTip :topic="`${props.prefix}-xp`" label="XP" :text="HELP.xp" />
    </div>

  </div>

  <div v-else class="cq-sheet cq-tilt">
    <div v-if="$slots.top" class="px-5 pt-4 sm:px-7 sm:pt-5">
      <slot name="top" />
    </div>

    <div class="grid sm:grid-cols-[auto_1fr]">
      <div class="cq-invert flex items-center gap-4 px-5 py-4 sm:px-6">
        <p class="cq-num text-6xl font-extrabold leading-[0.8] text-ink sm:text-7xl sm:leading-[0.8]" aria-hidden="true" :data-testid="`${props.prefix}-level`">
          {{ props.profile.level }}
        </p>
        <p class="flex items-center gap-2 font-display text-2xl font-bold leading-tight text-ink">
          <span :data-testid="`${props.prefix}-title`">{{ label }}</span>
          <HelpTip :topic="`${props.prefix}-title`" label="Nível e título" :text="HELP.title" />
        </p>
      </div>

      <div class="grid content-center px-5 py-4 sm:px-6">
        <div :class="{ 'cq-xp-pulse': props.pulsing }" :data-testid="`${props.prefix}-xp`">
          <div class="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
            <span class="flex items-center gap-2 font-semibold text-label">
              XP
              <HelpTip :topic="`${props.prefix}-xp`" label="XP" :text="HELP.xp" />
            </span>
            <span class="cq-num text-lg text-muted">
              <span class="text-ink">{{ props.profile.xp }} XP</span> · faltam {{ props.profile.xp_to_next_level }} para o nível {{ props.profile.level + 1 }}
            </span>
          </div>
          <ProgressBar :value="xpInLevel" :max="XP_PER_LEVEL" label="XP do nível atual" tone="progress" />
        </div>
      </div>
    </div>

    <div v-if="$slots.default" class="px-5 pb-4 sm:px-7 sm:pb-5">
      <slot />
    </div>
  </div>
</template>
