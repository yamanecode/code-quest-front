<script setup lang="ts">
import { ref, useId, watch } from 'vue'
import type { GroupingAnswer, GroupingContent } from '~/types/challenge'

// Decomposição: the student assigns each task to its etapa, with one select per item.
// Emits null until every item has an etapa.
const props = withDefaults(defineProps<{ content: GroupingContent; disabled?: boolean }>(), { disabled: false })
const emit = defineEmits<{ change: [answer: GroupingAnswer | null] }>()

const baseId = `grouping-${useId()}`
const assignment = ref<Record<string, string>>({})

watch(
  () => props.content,
  () => {
    assignment.value = {}
    emitAnswer()
  },
  { immediate: true },
)

function assign(itemId: string, groupId: string) {
  assignment.value = { ...assignment.value, [itemId]: groupId }
  emitAnswer()
}

function emitAnswer() {
  const complete = props.content.items.every((item) => assignment.value[item.id])
  emit('change', complete ? { assignment: { ...assignment.value } } : null)
}
</script>

<template>
  <div>
    <p class="mb-3 text-sm text-muted">Etapas: {{ props.content.groups.map((group) => group.text).join(' · ') }}</p>
    <ul class="grid gap-2" data-testid="grouping-list">
      <li
        v-for="item in props.content.items"
        :key="item.id"
        class="grid gap-2 border-2 border-line-strong bg-bg px-3 py-2 sm:grid-cols-[1fr_16rem] sm:items-center"
      >
        <label :for="`${baseId}-${item.id}`" class="leading-snug">
          <span class="sr-only">Etapa de: </span><span data-testid="grouping-item-text">{{ item.text }}</span>
        </label>
        <select
          :id="`${baseId}-${item.id}`"
          :value="assignment[item.id] ?? ''"
          :disabled="props.disabled"
          class="w-full border-2 border-line-strong bg-panel px-3 py-2 text-ink transition-colors hover:border-muted focus:border-ink disabled:cursor-not-allowed disabled:opacity-60"
          :data-testid="`grouping-select-${item.id}`"
          @change="assign(item.id, ($event.target as HTMLSelectElement).value)"
        >
          <option value="" disabled>Escolha a etapa</option>
          <option v-for="group in props.content.groups" :key="group.id" :value="group.id">{{ group.text }}</option>
        </select>
      </li>
    </ul>
  </div>
</template>
