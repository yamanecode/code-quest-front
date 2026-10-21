<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useClassroomsStore } from '~/stores/classrooms'
import { useRankingStore } from '~/stores/ranking'
import type { RankingEntry, RankingPeriod } from '~/types/api'
import { HELP } from '~/utils/help'
import { rankingPeriod } from '~/utils/ranking'

// Ranking (spec §5, §9.1): the student and up to two positions above and below. The
// panel leads with the student's own XP for the period, so effort comes before rank.
// Everything under the tabs describes the ranking on screen, never the one still loading.
definePageMeta({ layout: 'app' })
useHead({ title: 'Ranking · CodeQuest' })

const PERIODS: { value: RankingPeriod; label: string; xpColumn: string; xpPhrase: string }[] = [
  { value: 'week', label: 'Semanal', xpColumn: 'XP da semana', xpPhrase: 'nesta semana' },
  { value: 'month', label: 'Mensal', xpColumn: 'XP do mês', xpPhrase: 'neste mês' },
]

const ranking = useRankingStore()
const classrooms = useClassroomsStore()

const shown = computed(() => ranking.ranking)
const shownPeriod = computed(() => PERIODS.find((p) => p.value === shown.value?.period) ?? PERIODS[0]!)
const entries = computed(() => shown.value?.entries ?? [])
const me = computed(() => entries.value.find((entry) => entry.is_me) ?? null)
const allZero = computed(() => entries.value.every((entry) => entry.xp === 0))
const periodText = computed(() => rankingPeriod(shownPeriod.value.value, new Date()))

const shownClassroomName = computed(() => {
  const chosen = ranking.shownScope
  if (chosen === 'global') return null
  return classrooms.list.find((classroom) => classroom.id === chosen)?.name ?? 'sua turma'
})
const scopeLine = computed(() =>
  shownClassroomName.value ? `Na turma ${shownClassroomName.value}` : 'Entre todos os estudantes',
)

// Read out after each switch, so a screen reader hears the new result.
const announcement = computed(() => {
  if (!me.value || ranking.loading) return ''
  const scope = shownClassroomName.value ? `turma ${shownClassroomName.value}` : 'geral'
  return `${shownPeriod.value.label}, ${scope}: você está em ${me.value.position}º, com ${me.value.xp} XP.`
})

// Podium colours for 1º, 2º and 3º; with dense rank a tie shares the position, so it shares the colour.
const PODIUM: Record<number, string> = { 1: 'text-podium-1', 2: 'text-podium-2', 3: 'text-podium-3' }
const positionColor = (position: number) => PODIUM[position] ?? 'text-ink'

// Dense rank (spec §5): equal positions are a tie, said in words too.
function isTie(entry: RankingEntry): boolean {
  return entries.value.filter((other) => other.position === entry.position).length > 1
}

// The <select> works with strings; the store keeps 'global' or the turma id.
const scopeValue = computed({
  get: () => String(ranking.scope),
  set: (value: string) => ranking.setScope(value === 'global' ? 'global' : Number(value)),
})

const tabs = ref<HTMLButtonElement[]>([])

// Arrow keys, Home and End move between the tabs (WAI-ARIA tabs pattern). Focus moves
// at once; the new ranking loads behind it.
async function onTabKey(event: KeyboardEvent, index: number) {
  const last = PERIODS.length - 1
  const target = {
    ArrowRight: index === last ? 0 : index + 1,
    ArrowLeft: index === 0 ? last : index - 1,
    Home: 0,
    End: last,
  }[event.key]
  if (target === undefined) return
  event.preventDefault()
  ranking.setPeriod(PERIODS[target]!.value)
  await nextTick()
  tabs.value[target]?.focus()
}

onMounted(async () => {
  if (ranking.scope === 'global') {
    ranking.load()
    classrooms.load()
    return
  }
  // The student may have left the turma chosen last time; check before asking for it.
  await classrooms.load()
  const chosen = ranking.scope
  if (classrooms.list.some((classroom) => classroom.id === chosen)) ranking.load()
  else ranking.setScope('global')
})
</script>

<template>
  <div class="max-w-3xl">
    <div class="flex items-center gap-3">
      <h1 class="font-display text-4xl font-extrabold">Ranking</h1>
      <HelpTip topic="ranking" label="Ranking" :text="HELP.ranking" />
    </div>

    <div class="mt-6 flex flex-wrap items-end gap-4">
      <label class="grid w-full gap-1.5 sm:w-72">
        <span class="text-sm font-semibold">Ranking de</span>
        <select
          v-model="scopeValue"
          class="h-11 w-full border border-control bg-panel px-3"
          data-testid="ranking-scope"
        >
          <option value="global">Geral</option>
          <option v-for="classroom in classrooms.list" :key="classroom.id" :value="String(classroom.id)">{{ classroom.name }}</option>
        </select>
      </label>

      <div role="tablist" aria-label="Período do ranking" class="flex border border-control">
        <button
          v-for="(period, index) in PERIODS"
          :id="`ranking-tab-${period.value}`"
          :key="period.value"
          ref="tabs"
          type="button"
          role="tab"
          :aria-selected="ranking.period === period.value ? 'true' : 'false'"
          aria-controls="ranking-panel"
          :tabindex="ranking.period === period.value ? 0 : -1"
          class="h-11 px-5 font-semibold transition-colors"
          :class="ranking.period === period.value ? 'bg-ink text-bg' : 'text-muted hover:text-ink'"
          :data-testid="`ranking-tab-${period.value}`"
          @click="ranking.setPeriod(period.value)"
          @keydown="onTabKey($event, index)"
        >{{ period.label }}</button>
      </div>
    </div>

    <p class="sr-only" role="status" data-testid="ranking-announcement">{{ announcement }}</p>

    <section
      id="ranking-panel"
      role="tabpanel"
      :aria-labelledby="`ranking-tab-${shown ? shownPeriod.value : ranking.period}`"
      :aria-busy="ranking.loading ? 'true' : 'false'"
      class="mt-6 bg-panel px-5 py-5 sm:px-7 sm:py-6"
    >
      <p v-if="ranking.loading && !shown && !ranking.error" class="text-muted" aria-live="polite">Carregando ranking…</p>

      <div
        v-else-if="ranking.error"
        role="alert"
        class="border border-error-line bg-error-bg px-4 py-3 text-error-ink"
        data-testid="ranking-error"
      >
        <p>{{ ranking.error }}</p>
        <button
          type="button"
          class="mt-2 font-semibold underline underline-offset-4 hover:decoration-2"
          data-testid="ranking-retry"
          @click="ranking.load()"
        >Carregar de novo</button>
      </div>

      <div
        v-else-if="shown"
        class="transition-opacity duration-200"
        :class="{ 'opacity-50': ranking.loading }"
        data-testid="ranking-body"
      >
        <div class="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div v-if="me && !allZero" data-testid="ranking-hero">
            <p class="cq-num text-6xl font-extrabold leading-[0.85] text-ink">
              {{ me.xp }} <span class="text-2xl">XP</span>
            </p>
            <p class="mt-2 font-semibold" data-testid="ranking-summary">
              {{ shownPeriod.xpPhrase }} · você está em {{ me.position }}º<template v-if="isTie(me)"> (empate)</template>
            </p>
            <p v-if="me.xp === 0" class="mt-1 text-sm text-muted" data-testid="ranking-tip">Um desafio acertado de primeira vale 10 XP.</p>
          </div>
          <div class="min-w-0">
            <h2 class="font-display text-2xl font-bold" data-testid="ranking-period">{{ periodText.title }}</h2>
            <p class="mt-0.5 text-sm text-muted" data-testid="ranking-scope-line">{{ scopeLine }}</p>
          </div>
        </div>

        <p
          v-if="allZero"
          class="mt-5 border-2 border-line-strong bg-raised px-4 py-3"
          data-testid="ranking-empty"
        >Nenhum XP neste período ainda. Resolva um desafio para entrar no ranking.</p>

        <table class="mt-6 w-full table-fixed border-collapse">
          <caption class="sr-only">{{ periodText.title }}, {{ scopeLine.toLowerCase() }}</caption>
          <colgroup>
            <col class="w-20 sm:w-28">
            <col>
            <col class="w-28 sm:w-36">
          </colgroup>
          <thead>
            <tr class="text-left text-sm text-label">
              <th scope="col" class="pb-2 pl-3 font-semibold">Posição</th>
              <th scope="col" class="pb-2 font-semibold">Estudante</th>
              <th scope="col" class="pb-2 pr-3 text-right font-semibold">{{ shownPeriod.xpColumn }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="entry in entries"
              :key="entry.username"
              :class="entry.is_me ? 'border-y border-control bg-raised' : 'border-t border-line'"
              :aria-current="entry.is_me ? 'true' : undefined"
              :data-testid="`ranking-entry-${entry.username}`"
            >
              <td class="py-3 pl-3" :class="{ 'shadow-[inset_4px_0_0_var(--cq-ink)]': entry.is_me }">
                <template v-if="allZero">
                  <span class="cq-num block text-3xl font-extrabold leading-none text-muted" aria-hidden="true">—</span>
                  <span class="sr-only">sem posição</span>
                </template>
                <template v-else>
                  <span
                    class="cq-num block text-3xl font-extrabold leading-none"
                    :class="positionColor(entry.position)"
                    data-testid="ranking-position"
                  >{{ entry.position }}º</span>
                  <span v-if="isTie(entry)" class="block text-xs text-muted" data-testid="ranking-tie">empate</span>
                </template>
              </td>
              <td class="min-w-0 py-3">
                <span class="flex min-w-0 items-center gap-2 text-ink">
                  <NuxtLink
                    v-if="entry.profile_public"
                    :to="`/jogadores/${encodeURIComponent(entry.username)}`"
                    class="-my-2.5 inline-block truncate py-2.5 font-semibold underline underline-offset-4 hover:decoration-2"
                    data-testid="ranking-name"
                  >{{ entry.username }}<span class="sr-only">, ver perfil público</span></NuxtLink>
                  <span v-else class="truncate font-semibold" data-testid="ranking-name">{{ entry.username }}</span>
                  {{ ' ' }}<span
                    v-if="entry.is_me"
                    class="shrink-0 bg-ink px-1.5 py-0.5 text-xs font-bold text-bg"
                  >Você</span>
                </span>
              </td>
              <td class="cq-num py-3 pr-3 text-right text-xl text-ink">{{ entry.xp }} XP</td>
            </tr>
          </tbody>
        </table>

        <div class="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
          <NuxtLink
            to="/"
            class="bg-go px-5 py-2.5 font-display text-lg font-bold text-on-go transition-colors hover:bg-go-hover cq-go-shadow"
            data-testid="ranking-play"
          >Resolver um desafio</NuxtLink>
          <p class="text-sm text-muted" data-testid="ranking-resets">{{ periodText.resets }}</p>
        </div>
      </div>
    </section>
  </div>
</template>
