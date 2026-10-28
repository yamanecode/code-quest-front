<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, useId } from 'vue'

// Modal form: a title, the fields in the slot, the errors, Cancelar and a submit button.
// Focus starts on the first field, stays inside, goes back to the opener on close, and
// Escape cancels. The owner decides what "submit" does and fills `errors`.
const props = defineProps<{
  title: string
  submitLabel: string
  testid: string
  errors: string[]
  busy?: boolean
  danger?: boolean // red submit for a destructive action
  returnTo?: string // selector that gets the focus when the opener is gone after closing
}>()
const emit = defineEmits<{ submit: [], cancel: [] }>()

const titleId = `dialog-${useId()}`
const panel = ref<HTMLElement | null>(null)
const opener = import.meta.client ? (document.activeElement as HTMLElement | null) : null

// Focus goes back to the opener; if it is gone (its row was removed, its button swapped), to `returnTo`.
onBeforeUnmount(() => {
  nextTick(() => {
    const fallback = props.returnTo ? document.querySelector<HTMLElement>(props.returnTo) : null
    const target = opener?.isConnected ? opener : fallback
    target?.focus()
  })
})

onMounted(() => nextTick(() => panel.value?.querySelector<HTMLElement>('input, select, textarea')?.focus()))

function cancel() {
  emit('cancel')
  opener?.focus()
}

function trapTab(event: KeyboardEvent) {
  const items = [...(panel.value?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])') ?? [])]
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
</script>

<template>
  <div class="fixed inset-0 z-40 grid place-items-center bg-[var(--cq-scrim)] px-4 py-6" @keydown.esc="cancel">
    <form
      ref="panel"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      class="cq-sheet grid max-h-[94vh] w-full max-w-lg gap-4 overflow-y-auto p-5 sm:p-6"
      novalidate
      :data-testid="props.testid"
      @keydown.tab="trapTab"
      @submit.prevent="emit('submit')"
    >
      <h2 :id="titleId" class="font-display text-2xl font-bold">{{ props.title }}</h2>
      <slot />
      <ul v-if="props.errors.length" role="alert" class="list-disc cq-alert py-2 pl-8 pr-3 text-error-ink" :data-testid="`${props.testid}-errors`">
        <li v-for="message in props.errors" :key="message">{{ message }}</li>
      </ul>
      <div class="flex flex-wrap justify-end gap-3">
        <AppButton :data-testid="`${props.testid}-cancel`" @click="cancel">Cancelar</AppButton>
        <AppButton type="submit" :variant="props.danger ? 'danger' : 'primary'" :disabled="props.busy" :data-testid="`${props.testid}-submit`">{{ props.submitLabel }}</AppButton>
      </div>
    </form>
  </div>
</template>
