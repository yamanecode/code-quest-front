<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'

// A small tag that explains itself in a card: on hover and on keyboard focus, and pinned by a click
// or tap (so it works on a phone). Escape or a click outside closes it.
const props = defineProps<{
  label: string
  text: string
  testid: string
  swatch?: string // optional colour square before the label
}>()

const emit = defineEmits<{ active: [value: boolean] }>()

const VIEWPORT_MARGIN = 16

const hovered = ref(false)
const focused = ref(false)
const pinned = ref(false)
const visible = computed(() => hovered.value || focused.value || pinned.value)

const root = ref<HTMLElement | null>(null)
const card = ref<HTMLElement | null>(null)
const offset = ref(0)
const cardId = `term-${useId()}`

function onDocumentClick(event: MouseEvent) {
  if (root.value && !root.value.contains(event.target as Node)) pinned.value = false
}

// Moves the card sideways so it never leaves the screen.
function keepInViewport() {
  if (!root.value || !card.value) return
  const rootLeft = root.value.getBoundingClientRect().left
  const maxLeft = document.documentElement.clientWidth - card.value.offsetWidth - VIEWPORT_MARGIN
  offset.value = Math.max(VIEWPORT_MARGIN, Math.min(rootLeft, maxLeft)) - rootLeft
}

watch(visible, async (value) => {
  emit('active', value)
  if (value) {
    document.addEventListener('click', onDocumentClick)
    offset.value = 0
    await nextTick()
    keepInViewport()
  } else {
    document.removeEventListener('click', onDocumentClick)
  }
})

function close() {
  hovered.value = false
  pinned.value = false
}

onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick))
</script>

<template>
  <span
    ref="root"
    class="relative inline-flex"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
    @keydown.esc="close"
  >
    <button
      type="button"
      class="inline-flex min-h-8 items-center gap-1.5 border-2 border-control bg-panel px-2 py-1 text-xs font-bold text-ink transition-colors hover:bg-raised aria-expanded:border-ink"
      :aria-expanded="visible"
      :aria-describedby="visible ? cardId : undefined"
      :data-testid="props.testid"
      @click="pinned = !pinned"
      @focus="focused = true"
      @blur="focused = false"
    >
      <i v-if="props.swatch" class="inline-block h-3 w-3 border-2 border-line-strong" :style="{ background: props.swatch }" aria-hidden="true" />
      {{ props.label }}
    </button>
    <span
      v-if="visible"
      :id="cardId"
      ref="card"
      role="tooltip"
      class="absolute top-full z-30 mt-1.5 w-64 max-w-[calc(100vw-2rem)] border-2 border-line-strong bg-raised px-3 py-2 text-left text-sm font-normal leading-snug text-ink shadow-[var(--cq-pop-shadow)]"
      :style="{ left: `${offset}px` }"
      :data-testid="`${props.testid}-card`"
    >{{ props.text }}</span>
  </span>
</template>
