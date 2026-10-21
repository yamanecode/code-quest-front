<script setup lang="ts">
import { computed } from 'vue'
import type { Profile } from '~/types/api'
import { HELP } from '~/utils/help'

// The broadcast lower-third (DESIGN.md "Stat Panel"): level, title, XP bar and streak.
// Used by the header on every student page and, in its place, by the profile page.
const XP_PER_LEVEL = 50

const props = withDefaults(
  defineProps<{
    profile: Profile
    prefix: string // data-testid and HelpTip prefix, e.g. "header" or "profile"
    pulsing?: boolean // short glow on the XP bar after a correct answer
  }>(),
  { pulsing: false },
)

const xpInLevel = computed(() => XP_PER_LEVEL - props.profile.xp_to_next_level)
</script>

<template>
  <div class="cq-cut bg-panel px-5 py-4 sm:px-7 sm:py-5">
    <slot name="top" />

    <div class="grid grid-cols-[auto_1fr] items-end gap-x-5 gap-y-4 sm:grid-cols-[auto_minmax(12rem,auto)_1fr_auto] sm:gap-x-8">
      <p class="cq-num text-6xl font-extrabold leading-[0.8] text-ink sm:text-8xl sm:leading-[0.8]" :data-testid="`${props.prefix}-level`">
        <span class="sr-only">Nível </span>{{ props.profile.level }}
      </p>

      <div :data-testid="`${props.prefix}-title`">
        <p class="flex items-center gap-2 font-display text-2xl font-bold leading-tight text-ink">
          {{ props.profile.title }}
          <HelpTip :topic="`${props.prefix}-title`" label="Título" :text="HELP.title" />
        </p>
        <p class="text-sm text-muted" aria-hidden="true">Nível {{ props.profile.level }}</p>
      </div>

      <div class="col-span-2 sm:col-span-1" :class="{ 'cq-xp-pulse': props.pulsing }" :data-testid="`${props.prefix}-xp`">
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

      <div class="col-span-2 flex items-center gap-3 sm:col-span-1 sm:justify-end" :data-testid="`${props.prefix}-streak`">
        <span class="cq-num text-4xl font-extrabold leading-none text-ink">{{ props.profile.streak }}</span>
        <span class="text-sm leading-tight text-muted">{{ props.profile.streak === 1 ? 'dia seguido' : 'dias seguidos' }}</span>
        <HelpTip :topic="`${props.prefix}-streak`" label="Sequência de dias" :text="HELP.streak" />
      </div>
    </div>

    <slot />
  </div>
</template>
