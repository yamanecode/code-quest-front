<script setup lang="ts">
import { nextTick, onMounted, ref, useId } from 'vue'

// Modal yes/no question. Focus starts on "cancel", stays inside, and Escape cancels.
const props = defineProps<{
  title: string
  message: string
  confirmLabel: string
  testid: string
  busy?: boolean
}>()
const emit = defineEmits<{ confirm: []; cancel: [] }>()

const titleId = `dialog-${useId()}`
const messageId = `${titleId}-message`
const panel = ref<HTMLElement | null>(null)
const cancelButton = ref<HTMLButtonElement | null>(null)
const returnTo = import.meta.client ? (document.activeElement as HTMLElement | null) : null

onMounted(() => nextTick(() => cancelButton.value?.focus()))

function cancel() {
  emit('cancel')
  returnTo?.focus()
}

function trapTab(event: KeyboardEvent) {
  const buttons = [...(panel.value?.querySelectorAll<HTMLButtonElement>('button:not([disabled])') ?? [])]
  if (buttons.length === 0) return
  const first = buttons[0]!
  const last = buttons[buttons.length - 1]!
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  }
  else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}
</script>

<template>
  <div class="fixed inset-0 z-40 grid place-items-center bg-[rgba(0,0,0,0.55)] px-4" @keydown.esc="cancel">
    <div
      ref="panel"
      role="alertdialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      :aria-describedby="messageId"
      class="cq-sheet w-full max-w-md p-6"
      :data-testid="props.testid"
      @keydown.tab="trapTab"
    >
      <h2 :id="titleId" class="font-display text-2xl font-bold">{{ props.title }}</h2>
      <p :id="messageId" class="mt-2 leading-relaxed text-muted">{{ props.message }}</p>
      <div class="mt-6 flex flex-wrap justify-end gap-3">
        <button
          ref="cancelButton"
          type="button"
          class="px-4 py-2.5 font-semibold text-muted transition-colors hover:text-ink"
          :data-testid="`${props.testid}-cancel`"
          @click="cancel"
        >Cancelar</button>
        <button
          type="button"
          :disabled="props.busy"
          class="border-2 border-error-line bg-error-bg px-4 py-2.5 font-semibold text-error-ink transition-colors hover:border-error-ink disabled:cursor-wait disabled:opacity-60"
          :data-testid="`${props.testid}-confirm`"
          @click="emit('confirm')"
        >{{ props.confirmLabel }}</button>
      </div>
    </div>
  </div>
</template>
