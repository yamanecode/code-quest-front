<script setup lang="ts">
import { ref } from 'vue'

// The join code of a turma on a highlighted note, with a button that copies it.
const props = defineProps<{ code: string; name: string; id: number }>()

const copied = ref(false)

async function copy() {
  try {
    await navigator.clipboard.writeText(props.code)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  }
  catch {
    copied.value = false // the code stays visible next to the button
  }
}
</script>

<template>
  <span class="flex flex-wrap items-center gap-3">
    <span class="inline-flex items-center bg-sticky px-3 py-1 text-sticky-ink">
      Código: <strong class="cq-num ml-2 text-lg tracking-widest" data-testid="join-code">{{ props.code }}</strong>
    </span>
    <button
      type="button"
      class="cq-btn-outline"
      :aria-label="`Copiar o código da turma ${props.name}`"
      :data-testid="`copy-code-${props.id}`"
      @click="copy"
    >{{ copied ? 'Copiado!' : 'Copiar código' }}</button>
  </span>
</template>
