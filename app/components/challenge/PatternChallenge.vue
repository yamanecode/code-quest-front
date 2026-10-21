<script setup lang="ts">
import { ref, useId, watch } from 'vue'
import type { PatternAnswer, PatternContent } from '~/types/challenge'

// Reconhecimento de padrões: the student picks the next term of the sequence.
// Emits null until an option is chosen.
const props = withDefaults(defineProps<{ content: PatternContent; disabled?: boolean }>(), { disabled: false })
const emit = defineEmits<{ change: [answer: PatternAnswer | null] }>()

const baseId = `pattern-${useId()}`
const chosen = ref<string | null>(null)

watch(
  () => props.content,
  () => {
    chosen.value = null
    emit('change', null)
  },
  { immediate: true },
)

function choose(optionId: string) {
  chosen.value = optionId
  emit('change', { option: optionId })
}
</script>

<template>
  <div>
    <ol class="mb-5 flex flex-wrap items-center gap-2" aria-label="Sequência">
      <li
        v-for="(term, index) in props.content.sequence"
        :key="index"
        class="cq-num min-w-12 border-2 border-line-strong bg-bg px-3 py-2 text-center text-2xl font-bold"
        data-testid="pattern-term"
      >{{ term }}</li>
      <li class="cq-num min-w-12 border border-dashed border-control px-3 py-2 text-center text-2xl font-bold text-muted">
        <span aria-hidden="true">?</span><span class="sr-only">próximo termo</span>
      </li>
    </ol>
    <fieldset>
      <legend class="mb-3 font-semibold">Qual é o próximo termo?</legend>
      <ul class="grid gap-2 sm:grid-cols-2">
        <li v-for="option in props.content.options" :key="option.id">
          <label
            :for="`${baseId}-${option.id}`"
            class="flex cursor-pointer items-center gap-3 border-2 border-line-strong bg-bg px-3 py-2.5 has-[:checked]:border-ink has-[:disabled]:cursor-not-allowed"
          >
            <input
              :id="`${baseId}-${option.id}`"
              type="radio"
              :name="baseId"
              :value="option.id"
              :checked="chosen === option.id"
              :disabled="props.disabled"
              class="h-5 w-5 shrink-0 accent-[var(--cq-ink)]"
              :data-testid="`pattern-option-${option.id}`"
              @change="choose(option.id)"
            >
            <span class="cq-num text-xl" :data-testid="`pattern-label-${option.id}`">{{ option.text }}</span>
          </label>
        </li>
      </ul>
    </fieldset>
  </div>
</template>
