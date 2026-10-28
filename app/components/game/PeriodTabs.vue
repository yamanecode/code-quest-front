<script setup lang="ts">
import { nextTick, ref } from 'vue'
import type { RankingPeriod } from '~/types/api'

// Semanal / Mensal tabs of the rankings (WAI-ARIA tabs). The panel they control must have
// the id `panelId` and be labelled by the tab `ranking-tab-<period>`.
defineProps<{ panelId: string }>()
const period = defineModel<RankingPeriod>({ required: true })

const PERIODS: { value: RankingPeriod, label: string }[] = [
  { value: 'week', label: 'Semanal' },
  { value: 'month', label: 'Mensal' },
]

const tabs = ref<HTMLButtonElement[]>([])

// Arrow keys, Home and End move between the tabs. Focus moves at once; the ranking loads behind it.
async function onKey(event: KeyboardEvent, index: number) {
  const last = PERIODS.length - 1
  const target = {
    ArrowRight: index === last ? 0 : index + 1,
    ArrowLeft: index === 0 ? last : index - 1,
    Home: 0,
    End: last,
  }[event.key]
  if (target === undefined) return
  event.preventDefault()
  period.value = PERIODS[target]!.value
  await nextTick()
  tabs.value[target]?.focus()
}
</script>

<template>
  <div role="tablist" aria-label="Período do ranking" class="flex w-fit border-2 border-line-strong">
    <button
      v-for="(item, index) in PERIODS"
      :id="`ranking-tab-${item.value}`"
      :key="item.value"
      ref="tabs"
      type="button"
      role="tab"
      :aria-selected="period === item.value ? 'true' : 'false'"
      :aria-controls="panelId"
      :tabindex="period === item.value ? 0 : -1"
      class="h-11 px-5 font-semibold transition-colors"
      :class="period === item.value ? 'bg-ink text-bg' : 'text-muted hover:text-ink'"
      :data-testid="`ranking-tab-${item.value}`"
      @click="period = item.value"
      @keydown="onKey($event, index)"
    >{{ item.label }}</button>
  </div>
</template>
