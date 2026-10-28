<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useId } from 'vue'
import type { ProfChallenge } from '~/types/api'
import { CHALLENGE_TYPES, type ChallengeType } from '~/types/challenge'
import { sortChallenges, type ChallengeSortKey } from '~/utils/challengeSort'
import { SKILLS } from '~/utils/skills'

// Modal list of the published challenges that are not in the mission yet; the professor ticks
// one or more and adds them together. Same filter and sort as "Meus desafios".
const props = defineProps<{ challenges: ProfChallenge[]; excludeIds: number[]; busy?: boolean }>()
const emit = defineEmits<{ add: [ids: number[]]; cancel: [] }>()

const titleId = `dialog-${useId()}`
const panel = ref<HTMLElement | null>(null)
const firstControl = ref<HTMLSelectElement | null>(null)
const returnTo = import.meta.client ? (document.activeElement as HTMLElement | null) : null

const typeFilter = ref<ChallengeType | 'all'>('all')
const sortKey = ref<ChallengeSortKey>('recent')
const sortDir = ref<'asc' | 'desc'>('asc')
const selected = ref<Set<number>>(new Set())

const COLUMNS: { key: ChallengeSortKey, label: string }[] = [
  { key: 'title', label: 'Título' },
  { key: 'type', label: 'Habilidade' },
]

// Only published challenges can be offered: a mission needs published ones to be published.
const offered = computed(() => {
  const inMission = new Set(props.excludeIds)
  const published = props.challenges.filter((c) => c.status === 'published' && !inMission.has(c.id))
  return published.filter((c) => typeFilter.value === 'all' || c.type === typeFilter.value)
})
const rows = computed(() => sortChallenges(offered.value, sortKey.value, sortDir.value))
const allTicked = computed(() => rows.value.length > 0 && rows.value.every((c) => selected.value.has(c.id)))
const count = computed(() => selected.value.size)

function sortBy(key: ChallengeSortKey) {
  sortDir.value = sortKey.value === key && sortDir.value === 'asc' ? 'desc' : 'asc'
  sortKey.value = key
}

function ariaSort(key: ChallengeSortKey) {
  if (sortKey.value !== key) return 'none'
  return sortDir.value === 'asc' ? 'ascending' : 'descending'
}

function toggle(id: number) {
  const next = new Set(selected.value)
  if (!next.delete(id)) next.add(id)
  selected.value = next
}

function toggleAll() {
  const next = new Set(selected.value)
  for (const c of rows.value) {
    if (allTicked.value) next.delete(c.id)
    else next.add(c.id)
  }
  selected.value = next
}

// The ids go out in the order they are listed, so the mission order is predictable.
function confirm() {
  const ids = rows.value.filter((c) => selected.value.has(c.id)).map((c) => c.id)
  if (ids.length > 0) emit('add', ids)
}

function cancel() {
  emit('cancel')
  returnTo?.focus()
}

function trapTab(event: KeyboardEvent) {
  const items = [...(panel.value?.querySelectorAll<HTMLElement>('button:not([disabled]), select, input:not([disabled]), a[href]') ?? [])]
  if (items.length === 0) return
  const first = items[0]!
  const last = items[items.length - 1]!
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  }
  else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

onMounted(() => nextTick(() => firstControl.value?.focus()))
</script>

<template>
  <div class="fixed inset-0 z-40 grid place-items-center bg-[var(--cq-scrim)] px-4 py-6" @keydown.esc="cancel">
    <div
      ref="panel"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      class="cq-sheet flex max-h-[94vh] w-full max-w-3xl flex-col p-4 sm:p-5"
      data-testid="add-challenges-dialog"
      @keydown.tab="trapTab"
    >
      <div class="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div>
          <h2 :id="titleId" class="font-display text-2xl font-bold">Adicionar desafios à missão</h2>
          <p class="text-sm text-muted">Só os publicados que ainda não estão na missão.</p>
        </div>
        <label class="flex items-center gap-2">
          <span class="text-sm font-semibold">Tipo</span>
          <select ref="firstControl" v-model="typeFilter" class="h-11 border-2 border-line-strong bg-panel px-3" data-testid="add-filter-type">
            <option value="all">Todos</option>
            <option v-for="type in CHALLENGE_TYPES" :key="type" :value="type">{{ SKILLS[type].label }}</option>
          </select>
        </label>
      </div>

      <p v-if="rows.length === 0" class="mt-3 text-muted" data-testid="add-empty">
        Nenhum desafio publicado disponível. Crie um desafio ou publique um rascunho em “Meus desafios”.
      </p>

      <div v-else class="mt-3 min-h-0 overflow-y-auto border-2 border-line-strong">
        <table class="w-full border-collapse bg-panel text-left" data-testid="add-table">
          <caption class="sr-only">Desafios publicados para adicionar. Marque os que quiser.</caption>
          <thead class="sticky top-0 bg-raised">
            <tr class="border-b-2 border-line-strong">
              <th scope="col" class="w-10 px-3 py-1">
                <input type="checkbox" class="h-5 w-5 accent-[var(--cq-go)]" :checked="allTicked" aria-label="Marcar todos os desafios da lista" data-testid="add-all" @change="toggleAll">
              </th>
              <th v-for="column in COLUMNS" :key="column.key" scope="col" class="p-0" :aria-sort="ariaSort(column.key)">
                <button
                  type="button"
                  class="flex min-h-9 w-full items-center gap-1.5 px-2 py-1 text-left text-sm font-bold hover:underline underline-offset-4"
                  :data-testid="`add-sort-${column.key}`"
                  @click="sortBy(column.key)"
                >
                  {{ column.label }}
                  <span class="w-3 text-sm" aria-hidden="true">{{ sortKey === column.key ? (sortDir === 'asc' ? '▲' : '▼') : '' }}</span>
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="challenge in rows"
              :key="challenge.id"
              class="cursor-pointer border-b border-line last:border-b-0 hover:bg-raised"
              :class="selected.has(challenge.id) ? 'bg-raised' : ''"
              :data-testid="`add-row-${challenge.id}`"
              @click="toggle(challenge.id)"
            >
              <td class="px-3 py-1">
                <input
                  type="checkbox"
                  class="block h-5 w-5 accent-[var(--cq-go)]"
                  :checked="selected.has(challenge.id)"
                  :aria-label="`Adicionar ${challenge.title}`"
                  :data-testid="`add-check-${challenge.id}`"
                  @click.stop
                  @change="toggle(challenge.id)"
                >
              </td>
              <td class="px-2 py-1 font-semibold leading-snug">{{ challenge.title }}</td>
              <td class="whitespace-nowrap px-2 py-1">
                <span class="inline-flex items-center gap-2 text-sm font-bold"><TypeBar :type="challenge.type" class="!h-5" />{{ SKILLS[challenge.type].short }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-3 flex flex-wrap items-center justify-end gap-3">
        <p class="cq-num mr-auto text-muted" role="status" data-testid="add-count">{{ count }} {{ count === 1 ? 'selecionado' : 'selecionados' }}</p>
        <AppButton data-testid="add-cancel" @click="cancel">Cancelar</AppButton>
        <AppButton variant="primary" :disabled="count === 0 || props.busy" data-testid="add-confirm" @click="confirm">{{ count > 1 ? `Adicionar ${count} desafios` : 'Adicionar à missão' }}</AppButton>
      </div>
    </div>
  </div>
</template>
