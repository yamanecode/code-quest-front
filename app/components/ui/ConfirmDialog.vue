<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, useId } from 'vue'

// Modal yes/no question. Focus starts on "cancel", stays inside, and Escape cancels.
const props = defineProps<{
  title: string
  message: string
  confirmLabel: string
  testid: string
  busy?: boolean
  error?: string // a failed action is told here, inside the dialog, which then stays open
  returnTo?: string // selector that gets the focus when the opener is gone after closing
}>()
const emit = defineEmits<{ confirm: []; cancel: [] }>()

const titleId = `dialog-${useId()}`
const messageId = `${titleId}-message`
const panel = ref<HTMLElement | null>(null)
const cancelButton = ref<HTMLButtonElement | null>(null)
const opener = import.meta.client ? (document.activeElement as HTMLElement | null) : null

// Focus goes back to the opener; if it is gone (its row was removed, its button swapped), to `returnTo`.
onBeforeUnmount(() => {
  nextTick(() => {
    const fallback = props.returnTo ? document.querySelector<HTMLElement>(props.returnTo) : null
    const target = opener?.isConnected ? opener : fallback
    target?.focus()
  })
})

onMounted(() => nextTick(() => cancelButton.value?.focus()))

function cancel() {
  emit('cancel')
  opener?.focus()
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
  <div class="fixed inset-0 z-40 grid place-items-center bg-[var(--cq-scrim)] px-4" @keydown.esc="cancel">
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
      <p v-if="props.error" role="alert" class="mt-4 cq-alert px-4 py-3 text-error-ink" :data-testid="`${props.testid}-error`">{{ props.error }}</p>
      <div class="mt-6 flex flex-wrap justify-end gap-3">
        <button
          ref="cancelButton"
          type="button"
          class="min-h-11 px-4 font-display text-lg font-bold text-muted transition-colors hover:text-ink"
          :data-testid="`${props.testid}-cancel`"
          @click="cancel"
        >Cancelar</button>
        <AppButton
          variant="danger"
          :disabled="props.busy"
          :data-testid="`${props.testid}-confirm`"
          @click="emit('confirm')"
        >{{ props.confirmLabel }}</AppButton>
      </div>
    </div>
  </div>
</template>
