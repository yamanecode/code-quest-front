<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { usePlayStore } from '~/stores/play'
import { useSettingsStore } from '~/stores/settings'

// First-visit welcome (spec §9.3). Part of the page, not a notification:
// it stays until the student starts or closes it, once per username.
const auth = useAuthStore()
const play = usePlayStore()
const settings = useSettingsStore()

const STEPS = ['Escolha uma missão', 'Resolva o desafio e ganhe XP', 'Peça uma dica se travar']

const starting = ref(false)
const visible = computed(() => !!auth.username && !settings.isWelcomeDismissed(auth.username))

function dismiss() {
  if (auth.username) settings.dismissWelcome(auth.username)
}

async function start() {
  starting.value = true
  try {
    const target = await play.firstBasePath()
    dismiss()
    if (target) await navigateTo(target)
  }
  finally {
    starting.value = false
  }
}
</script>

<template>
  <section
    v-if="visible"
    class="cq-cut bg-panel px-5 py-5 sm:px-7"
    aria-labelledby="welcome-title"
    data-testid="welcome-card"
  >
    <h2 id="welcome-title" class="font-display text-2xl font-bold">Boas-vindas ao CodeQuest!</h2>
    <ol class="mt-4 grid gap-3 sm:grid-cols-3">
      <li v-for="(step, index) in STEPS" :key="step" class="flex items-center gap-3">
        <span class="cq-num text-3xl font-extrabold text-go" aria-hidden="true">{{ index + 1 }}</span>
        <span class="leading-snug">{{ step }}</span>
      </li>
    </ol>
    <div class="mt-5 flex flex-wrap items-center gap-3">
      <button
        type="button"
        :disabled="starting"
        class="bg-go px-5 py-2.5 font-display text-lg font-bold text-on-color transition-colors hover:bg-go-hover disabled:cursor-wait disabled:opacity-60"
        data-testid="welcome-start"
        @click="start"
      >Começar</button>
      <button
        type="button"
        class="px-3 py-2.5 font-semibold text-muted transition-colors hover:text-ink"
        data-testid="welcome-close"
        @click="dismiss"
      >Fechar</button>
    </div>
  </section>
</template>
