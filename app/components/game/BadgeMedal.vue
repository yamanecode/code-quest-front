<script setup lang="ts">
import { computed } from 'vue'
import type { Tier } from '~/types/api'
import { badgeFamily, SECRET_BADGE_NAME, TIER_LABEL, type BadgeProgress } from '~/utils/badges'
import { formatDayMonth } from '~/utils/format'

// One badge (spec §9.2): a sticker in the tier colour with the symbol of its family once
// earned (BadgeIcon); a dashed outline with a grey symbol while locked. Shape and text carry
// the state, not colour alone, since silver itself is grey.
interface MedalBadge {
  code: string
  name: string
  tier: Tier
  description?: string
}

const props = withDefaults(
  defineProps<{
    badge: MedalBadge
    earned: boolean
    earnedAt?: string | null
    secret?: boolean // hidden and not earned yet: no name, no tier, no condition
    progress?: BadgeProgress | null
    isNew?: boolean // earned in the last few days
    showCondition?: boolean // false where space is tight (the home strip)
  }>(),
  { earnedAt: null, secret: false, progress: null, isNew: false, showCondition: true },
)

// A non-breaking space keeps a tier numeral with its word ("Decomposição I" never ends a line on "I").
const name = computed(() => (props.secret ? SECRET_BADGE_NAME : props.badge.name.replace(/ (I{1,3})$/, ' $1')))

// The outline already shows a badge is still to earn, so the visible text stays calm
// ("Prata", "Para conquistar: …"); screen readers get the state in words.
const tier = computed(() => (props.secret ? '' : TIER_LABEL[props.badge.tier]))
const family = computed(() => (props.secret ? 'secret' : badgeFamily(props.badge.code)))
const earnedOn = computed(() => (props.earned && props.earnedAt ? formatDayMonth(props.earnedAt) : ''))

const condition = computed(() => (props.earned || props.secret || !props.showCondition ? '' : (props.badge.description ?? '')))
</script>

<template>
  <figure
    class="flex flex-col items-center text-center"
    :data-testid="`badge-${props.badge.code}`"
    :data-earned="String(props.earned)"
  >
    <span class="block h-12 w-12 sm:h-16 sm:w-16" :class="{ 'cq-sticker': props.earned }" aria-hidden="true" data-testid="badge-circle">
      <BadgeIcon class="h-full w-full" :family="family" :tier="props.badge.tier" :earned="props.earned" />
    </span>
    <figcaption class="mt-2 w-full max-w-[9rem]">
      <span
        class="block leading-tight"
        :class="props.earned ? 'font-semibold text-ink' : 'text-muted'"
        data-testid="badge-name"
      >{{ name }}</span>
      <span v-if="props.isNew" class="mt-1 inline-block bg-ink px-1.5 text-xs font-bold text-bg" data-testid="badge-new">Nova</span>
      <span class="block text-xs text-muted" data-testid="badge-status">{{ tier }}<span v-if="!props.earned" class="sr-only">{{ tier ? ', ' : '' }}ainda não conquistada</span></span>
      <span v-if="earnedOn" class="block text-xs text-muted" data-testid="badge-earned-on"><span class="sr-only">Conquistada em </span>{{ earnedOn }}</span>
      <span
        v-if="props.progress && !props.earned"
        class="cq-num mt-1 block text-base font-bold"
        data-testid="badge-progress"
      ><span class="sr-only">Progresso: </span>{{ props.progress.current }} de {{ props.progress.target }}</span>
      <span v-if="condition" class="mt-1 block text-xs leading-snug text-muted sm:text-sm" data-testid="badge-condition">Para conquistar: {{ condition }}</span>
    </figcaption>
  </figure>
</template>
