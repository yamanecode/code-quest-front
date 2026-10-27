<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { DEMO_CHALLENGES, DEMO_COOLDOWN_SECONDS, DEMO_HINTS } from '~/utils/landingDemo'

// The Dica button of the challenge screen, with canned hints and no call to the AI.
// After each hint the button counts down, as it does on the real screen.
const challenge = DEMO_CHALLENGES[0]!

const shown = ref<string[]>([])
const cooldown = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

const finished = computed(() => shown.value.length >= DEMO_HINTS.length)
const label = computed(() => {
  if (finished.value) return 'Fim das dicas do exemplo'
  if (cooldown.value > 0) return `Dica em ${cooldown.value} s`
  return 'Dica'
})

function stop() {
  if (timer) clearInterval(timer)
  timer = null
}

function ask() {
  if (finished.value || cooldown.value > 0) return
  shown.value = [...shown.value, DEMO_HINTS[shown.value.length]!]
  if (finished.value) return
  cooldown.value = DEMO_COOLDOWN_SECONDS
  timer = setInterval(() => {
    cooldown.value -= 1
    if (cooldown.value <= 0) {
      cooldown.value = 0
      stop()
    }
  }, 1000)
}

onBeforeUnmount(stop)
</script>

<template>
  <div class="cq-sheet grid gap-4 p-5" data-testid="hint-demo">
    <div>
      <p class="font-display text-xl font-bold text-ink">{{ challenge.title }}</p>
      <p class="mt-1 text-sm text-muted">Exemplo da tela de um desafio. Aperte Dica para ver como ela funciona.</p>
    </div>
    <div>
      <button
        type="button"
        class="cq-btn-outline px-4 py-3"
        :disabled="finished || cooldown > 0"
        data-testid="hint-demo-button"
        @click="ask"
      >{{ label }}</button>
    </div>
    <section v-if="shown.length > 0" class="border-2 border-line-strong px-5 py-4" aria-label="Dicas" data-testid="hint-demo-list">
      <ol class="grid gap-3" aria-live="polite">
        <li v-for="(hint, index) in shown" :key="index" :data-testid="`hint-demo-${index + 1}`">
          <p class="text-sm font-semibold text-muted">Dica {{ index + 1 }}</p>
          <p class="mt-1 leading-relaxed">{{ hint }}</p>
        </li>
      </ol>
    </section>
    <p class="text-sm text-muted">
      As dicas desta demonstração foram escritas à mão. Na plataforma, elas são geradas pela IA e conferidas antes de aparecer, e o tempo de espera entre uma dica e outra é definido pelo servidor.
    </p>
    <ul class="flex flex-wrap gap-2" aria-label="Como as dicas funcionam">
      <li class="border-2 border-control bg-panel px-2 py-1 text-xs font-bold text-ink">Sem campo de texto</li>
      <li class="border-2 border-control bg-panel px-2 py-1 text-xs font-bold text-ink">Pequena espera entre as dicas</li>
      <li class="border-2 border-control bg-panel px-2 py-1 text-xs font-bold text-ink">Nunca mostra a resposta</li>
    </ul>
  </div>
</template>
