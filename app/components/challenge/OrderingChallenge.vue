<script setup lang="ts">
import { nextTick, ref, watch, type ComponentPublicInstance } from 'vue'
import type { Item, OrderingAnswer, OrderingContent } from '~/types/challenge'

// Pensamento algorítmico: the student puts the steps in order with ▲/▼ buttons.
// Items start in the order received and keep the ids received (spec §4.2).
const props = withDefaults(defineProps<{ content: OrderingContent; disabled?: boolean }>(), { disabled: false })
const emit = defineEmits<{ change: [answer: OrderingAnswer] }>()

const items = ref<Item[]>([])
const list = ref<ComponentPublicInstance | null>(null)

watch(
  () => props.content,
  (content) => {
    items.value = [...content.items]
    emitAnswer()
  },
  { immediate: true },
)

function emitAnswer() {
  emit('change', { order: items.value.map((item) => item.id) })
}

async function move(index: number, step: -1 | 1) {
  const target = index + step
  if (target < 0 || target >= items.value.length) return
  const next = [...items.value]
  const [item] = next.splice(index, 1)
  next.splice(target, 0, item!)
  items.value = next
  emitAnswer()
  await keepFocus(item!.id, step, target)
}

// Moving a node in the DOM drops its focus, so it is put back on the same
// button, or on the other button of the item when this one became disabled.
async function keepFocus(id: string, step: -1 | 1, index: number) {
  await nextTick()
  const atEnd = step === -1 ? index === 0 : index === items.value.length - 1
  const forward = step === -1 ? 'up' : 'down'
  const back = step === -1 ? 'down' : 'up'
  const direction = atEnd ? back : forward
  const root = list.value?.$el as HTMLElement | undefined
  root?.querySelector<HTMLButtonElement>(`[data-testid="ordering-${direction}-${id}"]`)?.focus()
}
</script>

<template>
  <TransitionGroup ref="list" tag="ol" name="cq-swap" class="grid gap-2" aria-label="Passos na ordem escolhida" data-testid="ordering-list">
    <li
      v-for="(item, index) in items"
      :key="item.id"
      class="flex items-center gap-3 border-2 border-line-strong bg-bg px-3 py-2"
      :data-testid="`ordering-item-${item.id}`"
    >
      <span class="cq-num w-6 shrink-0 text-center text-xl font-bold text-muted" aria-hidden="true">{{ index + 1 }}</span>
      <span class="flex-1 leading-snug" data-testid="ordering-text">{{ item.text }}</span>
      <span class="flex shrink-0 gap-1">
        <button
          type="button"
          class="grid h-11 w-11 place-items-center border-2 border-line-strong bg-panel text-lg text-ink transition-colors hover:bg-raised disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="props.disabled || index === 0"
          :aria-label="`Mover para cima: ${item.text}`"
          :data-testid="`ordering-up-${item.id}`"
          @click="move(index, -1)"
        >▲</button>
        <button
          type="button"
          class="grid h-11 w-11 place-items-center border-2 border-line-strong bg-panel text-lg text-ink transition-colors hover:bg-raised disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="props.disabled || index === items.length - 1"
          :aria-label="`Mover para baixo: ${item.text}`"
          :data-testid="`ordering-down-${item.id}`"
          @click="move(index, 1)"
        >▼</button>
      </span>
    </li>
  </TransitionGroup>
</template>
