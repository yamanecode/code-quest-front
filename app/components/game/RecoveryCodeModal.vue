<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { useProfileStore } from '~/stores/profile'

// "Save your code" step (spec §3). The code is covered until the student asks to see it, and the
// dialog cannot be dismissed: the only way out is ticking the box and pressing Continuar.
// The code lives only in the `code` prop of the parent, which clears it when this closes.
const props = defineProps<{ code: string, busy?: boolean, error?: string }>()
const emit = defineEmits<{ confirmed: [] }>()

const COPIED_MS = 2000
const HIDDEN_TEXT = '••••-••••-••••-••••'

const profile = useProfileStore()
const titleId = `dialog-${useId()}`
const panel = ref<HTMLElement | null>(null)
const codeText = ref<HTMLElement | null>(null)
const revealed = ref(false)
const saved = ref(false)
const copied = ref(false)
const copyError = ref<string | null>(null)
let copiedTimer: ReturnType<typeof setTimeout> | null = null

const shown = computed(() => (revealed.value ? props.code : HIDDEN_TEXT))

onMounted(() => {
  profile.codeModalOpen = true
  nextTick(() => panel.value?.querySelector<HTMLElement>('button')?.focus())
})

onBeforeUnmount(() => {
  profile.codeModalOpen = false
  if (copiedTimer) clearTimeout(copiedTimer)
})

function selectCode() {
  if (!codeText.value) return
  const range = document.createRange()
  range.selectNodeContents(codeText.value)
  const selection = window.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)
}

async function copy() {
  copyError.value = null
  try {
    await navigator.clipboard.writeText(props.code)
    copied.value = true
    if (copiedTimer) clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => (copied.value = false), COPIED_MS)
  }
  catch {
    selectCode()
    copyError.value = 'Não foi possível copiar. O código está selecionado: copie com Ctrl+C.'
  }
}

function trapTab(event: KeyboardEvent) {
  const items = [...(panel.value?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled])') ?? [])]
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
  <div class="fixed inset-0 z-50 grid place-items-center bg-[var(--cq-scrim)] px-4 py-6" @keydown.esc.prevent>
    <div
      ref="panel"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      class="cq-sheet grid max-h-[94vh] w-full max-w-lg gap-4 overflow-y-auto p-5 sm:p-6"
      data-testid="recovery-modal"
      @keydown.tab="trapTab"
    >
      <h2 :id="titleId" class="font-display text-2xl font-bold">Guarde seu código de recuperação</h2>
      <p class="leading-relaxed">
        Este é o seu código de recuperação. Se você esquecer a sua senha, ele é a única forma de voltar para a sua conta e
        manter o seu progresso. Ninguém, nem mesmo o seu professor, consegue recuperá-lo depois. Guarde em um lugar seguro e
        não compartilhe com ninguém.
      </p>

      <div class="border-2 border-line-strong bg-raised px-4 py-3">
        <p
          ref="codeText"
          class="break-all font-mono text-2xl font-bold tracking-wider"
          :aria-label="revealed ? undefined : 'Código oculto'"
          data-testid="recovery-code-text"
        >{{ shown }}</p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <AppButton data-testid="recovery-toggle" :aria-pressed="revealed ? 'true' : 'false'" @click="revealed = !revealed">
          {{ revealed ? 'Ocultar' : 'Mostrar' }}
        </AppButton>
        <AppButton v-if="revealed" data-testid="recovery-copy" @click="copy">Copiar</AppButton>
        <span v-if="copied" role="status" class="font-semibold text-success" data-testid="recovery-copied">Copiado</span>
      </div>
      <p v-if="copyError" role="alert" class="cq-alert px-3 py-2 text-error-ink" data-testid="recovery-copy-error">{{ copyError }}</p>

      <label class="flex items-start gap-3">
        <input
          v-model="saved"
          type="checkbox"
          class="mt-1 h-5 w-5 shrink-0 accent-[var(--cq-ink)]"
          data-testid="recovery-confirm-check"
        >
        <span class="font-semibold">Guardei meu código</span>
      </label>

      <p v-if="props.error" role="alert" class="cq-alert px-3 py-2 text-error-ink" data-testid="recovery-error">{{ props.error }}</p>

      <div class="flex justify-end">
        <AppButton variant="primary" :disabled="!saved || props.busy" data-testid="recovery-continue" @click="emit('confirmed')">
          {{ props.busy ? 'Confirmando…' : 'Continuar' }}
        </AppButton>
      </div>
    </div>
  </div>
</template>
