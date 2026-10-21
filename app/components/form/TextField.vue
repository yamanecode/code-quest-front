<script setup lang="ts">
import { useId } from 'vue'

// Labelled text input with an optional hint linked through aria-describedby.
const props = defineProps<{
  label: string
  testid: string
  type?: 'text' | 'password'
  autocomplete?: string
  hint?: string
  maxlength?: number
}>()

const model = defineModel<string>({ required: true })
const id = `field-${useId()}`
const hintId = `${id}-hint`
</script>

<template>
  <div>
    <label :for="id" class="mb-1.5 block font-semibold">{{ props.label }}</label>
    <input
      :id="id"
      v-model="model"
      :type="props.type ?? 'text'"
      :autocomplete="props.autocomplete"
      :maxlength="props.maxlength"
      :aria-describedby="props.hint ? hintId : undefined"
      autocapitalize="none"
      spellcheck="false"
      class="w-full border border-control bg-bg px-3 py-2.5 text-ink transition-colors placeholder:text-muted hover:border-muted focus:border-ink focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      :data-testid="props.testid"
    >
    <p v-if="props.hint" :id="hintId" class="mt-1.5 text-sm text-muted">{{ props.hint }}</p>
  </div>
</template>
