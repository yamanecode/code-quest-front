<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useId } from 'vue'

// A "?" button that opens one short explanation (spec §9.2, §9.3).
const props = defineProps<{
  topic: string // used in the data-testid
  label: string // what the help is about, read by screen readers
  text: string
}>()

const VIEWPORT_MARGIN = 16

const open = ref(false)
const button = ref<HTMLButtonElement | null>(null)
const root = ref<HTMLElement | null>(null)
const panel = ref<HTMLElement | null>(null)
const offset = ref(0)
const panelId = `help-${useId()}`

function onDocumentClick(event: MouseEvent) {
  if (root.value && !root.value.contains(event.target as Node)) close(false)
}

// Shifts the panel sideways so it never leaves the screen, even on a phone.
function keepInViewport() {
  if (!root.value || !panel.value) return
  const rootLeft = root.value.getBoundingClientRect().left
  const maxLeft = document.documentElement.clientWidth - panel.value.offsetWidth - VIEWPORT_MARGIN
  const left = Math.max(VIEWPORT_MARGIN, Math.min(rootLeft, maxLeft))
  offset.value = left - rootLeft
}

async function show() {
  offset.value = 0
  open.value = true
  document.addEventListener('click', onDocumentClick)
  await nextTick()
  keepInViewport()
}

function close(returnFocus = true) {
  if (!open.value) return
  open.value = false
  document.removeEventListener('click', onDocumentClick)
  if (returnFocus) nextTick(() => button.value?.focus())
}

function toggle() {
  if (open.value) close()
  else show()
}

onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick))
</script>

<template>
  <span ref="root" class="relative inline-flex align-middle" @keydown.esc="close()">
    <button
      ref="button"
      type="button"
      class="relative grid h-6 w-6 place-items-center rounded-full border-2 border-control before:absolute before:-inset-2.5 before:content-[''] text-xs font-bold text-muted transition-colors hover:border-ink hover:text-ink aria-expanded:border-ink aria-expanded:bg-ink aria-expanded:text-bg"
      :aria-label="`Ajuda: ${props.label}`"
      :aria-expanded="open"
      :aria-controls="panelId"
      :data-testid="`help-${props.topic}`"
      @click="toggle"
      @keydown.enter.prevent="toggle"
      @keydown.space.prevent="toggle"
    >?</button>
    <span
      v-if="open"
      :id="panelId"
      ref="panel"
      role="note"
      tabindex="-1"
      class="absolute left-0 top-full z-30 mt-2 w-max max-w-[min(18rem,calc(100vw-2rem))] border-2 border-line-strong bg-raised px-3 py-2 text-left text-sm font-normal normal-case leading-snug tracking-normal text-ink shadow-[var(--cq-pop-shadow)]"
      :style="{ left: `${offset}px` }"
      :data-testid="`help-${props.topic}-panel`"
    >{{ props.text }}</span>
  </span>
</template>
