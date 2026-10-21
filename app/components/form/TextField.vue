<script setup lang="ts">
import { useId } from 'vue'

// Labelled text input with an optional hint linked through aria-describedby.
const props = defineProps<{
  label: string
  testid: string
  type?: 'text' | 'password'
  autocomplete?: string
  hint?: string
  placeholder?: string
  help?: string // text of a "?" balloon next to the label
  maxlength?: number
}>()

const model = defineModel<string>({ required: true })
const id = `field-${useId()}`
const hintId = `${id}-hint`
</script>

<template>
  <div>
    <div class="mb-1.5 flex items-center gap-2">
      <label :for="id" class="font-semibold">{{ props.label }}</label>
      <HelpTip v-if="props.help" :topic="props.testid" :label="props.label" :text="props.help" />
    </div>
    <input
      :id="id"
      v-model="model"
      :type="props.type ?? 'text'"
      :autocomplete="props.autocomplete"
      :maxlength="props.maxlength"
      :placeholder="props.placeholder"
      :aria-describedby="props.hint ? hintId : undefined"
      autocapitalize="none"
      spellcheck="false"
      class="w-full border-2 border-line-strong bg-panel px-3 py-2.5 text-ink transition-colors placeholder:text-muted hover:border-muted focus:border-ink focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      :data-testid="props.testid"
    >
    <p v-if="props.hint" :id="hintId" class="mt-1.5 text-sm text-muted">{{ props.hint }}</p>
  </div>
</template>
