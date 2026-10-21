<script setup lang="ts">
import { nextItemId, type FormState } from '~/utils/challengeForm'

// Steps typed in the correct order: the list order is the solution. With `locked`, only the texts change.
const form = defineModel<FormState>({ required: true })
defineProps<{ locked: boolean }>()

const MAX = 8
const MIN = 3

function add() {
  form.value.items.push({ id: nextItemId(form.value.items), text: '' })
}

function remove(index: number) {
  form.value.items.splice(index, 1)
}

function move(index: number, by: -1 | 1) {
  const items = form.value.items
  const target = index + by
  if (target < 0 || target >= items.length) return
  const [moved] = items.splice(index, 1)
  items.splice(target, 0, moved!)
}

const button = 'border-2 border-line-strong px-2.5 py-1.5 font-semibold transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40'
</script>

<template>
  <fieldset class="grid gap-3" data-testid="editor-ordering">
    <legend class="font-display text-xl font-bold">Passos na ordem correta</legend>
    <p class="text-sm text-muted">Escreva os passos do primeiro ao último. O aluno os vê embaralhados.</p>
    <ol class="grid gap-2">
      <li v-for="(item, index) in form.items" :key="item.id" class="flex flex-wrap items-center gap-2">
        <span class="cq-num w-6 text-right font-bold" aria-hidden="true">{{ index + 1 }}</span>
        <input
          v-model="item.text"
          type="text"
          maxlength="120"
          :aria-label="`Passo ${index + 1}`"
          class="min-w-0 flex-1 border-2 border-line-strong bg-panel px-3 py-2 text-ink focus:border-ink focus:outline-none"
          :data-testid="`editor-item-${index}`"
        >
        <button type="button" :class="button" :disabled="locked || index === 0" :aria-label="`Subir o passo ${index + 1}`" :data-testid="`editor-up-${index}`" @click="move(index, -1)">▲</button>
        <button type="button" :class="button" :disabled="locked || index === form.items.length - 1" :aria-label="`Descer o passo ${index + 1}`" :data-testid="`editor-down-${index}`" @click="move(index, 1)">▼</button>
        <button type="button" :class="button" :disabled="locked || form.items.length <= MIN" :aria-label="`Remover o passo ${index + 1}`" :data-testid="`editor-remove-${index}`" @click="remove(index)">Remover</button>
      </li>
    </ol>
    <div>
      <button type="button" :class="button" :disabled="locked || form.items.length >= MAX" data-testid="editor-add" @click="add">Adicionar passo</button>
    </div>
  </fieldset>
</template>
