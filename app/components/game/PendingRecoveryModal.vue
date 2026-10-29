<script setup lang="ts">
import { nextTick, onMounted, ref, useId } from 'vue'

// Reminder for a student who never confirmed saving the recovery code (spec §3). It can be
// dismissed: "Depois" lasts for the session, "Ir para o perfil" leads to where a new code is made.
const emit = defineEmits<{ profile: [], later: [] }>()

const titleId = `dialog-${useId()}`
const panel = ref<HTMLElement | null>(null)

onMounted(() => nextTick(() => panel.value?.querySelector<HTMLElement>('button')?.focus()))

function trapTab(event: KeyboardEvent) {
  const buttons = [...(panel.value?.querySelectorAll<HTMLElement>('button:not([disabled])') ?? [])]
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
  <div class="fixed inset-0 z-40 grid place-items-center bg-[var(--cq-scrim)] px-4" @keydown.esc="emit('later')">
    <div
      ref="panel"
      role="alertdialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      class="cq-sheet w-full max-w-md p-6"
      data-testid="recovery-pending"
      @keydown.tab="trapTab"
    >
      <h2 :id="titleId" class="font-display text-2xl font-bold">Seu código de recuperação</h2>
      <p class="mt-2 leading-relaxed text-muted">
        Você ainda não guardou o seu código de recuperação. Por segurança ele só aparece uma vez, então gere um novo no seu perfil.
      </p>
      <div class="mt-6 flex flex-wrap justify-end gap-3">
        <AppButton data-testid="recovery-pending-later" @click="emit('later')">Depois</AppButton>
        <AppButton variant="primary" data-testid="recovery-pending-profile" @click="emit('profile')">Ir para o perfil</AppButton>
      </div>
    </div>
  </div>
</template>
