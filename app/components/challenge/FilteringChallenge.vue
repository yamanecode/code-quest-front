<script setup lang="ts">
import { ref, useId, watch } from 'vue'
import type { FilteringAnswer, FilteringContent } from '~/types/challenge'

// Abstração: the student checks only the information needed to answer the question.
// Emits null while nothing is checked; ids are sent in the order shown.
const props = withDefaults(defineProps<{ content: FilteringContent; disabled?: boolean }>(), { disabled: false })
const emit = defineEmits<{ change: [answer: FilteringAnswer | null] }>()

const baseId = `filtering-${useId()}`
const selected = ref<Set<string>>(new Set())

watch(
  () => props.content,
  () => {
    selected.value = new Set()
    emitAnswer()
  },
  { immediate: true },
)

function toggle(itemId: string, checked: boolean) {
  const next = new Set(selected.value)
  if (checked) next.add(itemId)
  else next.delete(itemId)
  selected.value = next
  emitAnswer()
}

function emitAnswer() {
  const ids = props.content.items.map((item) => item.id).filter((id) => selected.value.has(id))
  emit('change', ids.length > 0 ? { selected: ids } : null)
}
</script>

<template>
  <fieldset>
    <legend class="mb-3 font-semibold">{{ props.content.question }}</legend>
    <p class="mb-3 text-sm text-muted">Marque só as informações necessárias para responder.</p>
    <ul class="grid gap-2" data-testid="filtering-list">
      <li v-for="item in props.content.items" :key="item.id">
        <label
          :for="`${baseId}-${item.id}`"
          class="flex cursor-pointer items-center gap-3 border-2 border-line-strong bg-bg px-3 py-2.5 cq-choice [--cq-choice-hl:var(--cq-filtering-hl)] has-[:disabled]:cursor-not-allowed"
        >
          <input
            :id="`${baseId}-${item.id}`"
            type="checkbox"
            :checked="selected.has(item.id)"
            :disabled="props.disabled"
            class="h-5 w-5 shrink-0 accent-[var(--cq-ink)]"
            :data-testid="`filtering-option-${item.id}`"
            @change="toggle(item.id, ($event.target as HTMLInputElement).checked)"
          >
          <span class="leading-snug" :data-testid="`filtering-label-${item.id}`">{{ item.text }}</span>
        </label>
      </li>
    </ul>
  </fieldset>
</template>
