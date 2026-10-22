<script setup lang="ts">
import { nextItemId, type FormState } from '~/utils/challengeForm'
import { SMALL_BUTTON, TEXT_FIELD } from '~/utils/styles'

// A question and a list of pieces of information; the professor marks the relevant ones.
const form = defineModel<FormState>({ required: true })
defineProps<{ locked: boolean }>()

const MAX = 10
const MIN = 4

function add() {
  form.value.items.push({ id: nextItemId(form.value.items), text: '' })
}

function remove(index: number) {
  const [removed] = form.value.items.splice(index, 1)
  form.value.relevant = form.value.relevant.filter((id) => id !== removed!.id)
}

const button = SMALL_BUTTON
const field = TEXT_FIELD
</script>

<template>
  <fieldset class="grid gap-3" data-testid="editor-filtering">
    <legend class="font-display text-xl font-bold">Pergunta e informações</legend>
    <label class="grid gap-1.5">
      <span class="font-semibold">Pergunta que precisa ser respondida</span>
      <input
        v-model="form.question"
        type="text"
        maxlength="200"
        :class="field"
        data-testid="editor-question"
      >
    </label>
    <p class="text-sm text-muted">Marque as informações necessárias para responder. As outras são distração.</p>
    <ul class="grid gap-2">
      <li v-for="(item, index) in form.items" :key="item.id" class="flex flex-wrap items-center gap-2">
        <input
          v-model="form.relevant"
          type="checkbox"
          :value="item.id"
          :disabled="locked"
          class="size-5"
          :aria-label="`Informação ${index + 1} é relevante`"
          :data-testid="`editor-relevant-${index}`"
        >
        <input
          v-model="item.text"
          type="text"
          maxlength="120"
          :aria-label="`Informação ${index + 1}`"
          :class="field"
          :data-testid="`editor-item-${index}`"
        >
        <button type="button" :class="button" :disabled="locked || form.items.length <= MIN" :aria-label="`Remover a informação ${index + 1}`" :data-testid="`editor-remove-${index}`" @click="remove(index)">Remover</button>
      </li>
    </ul>
    <div>
      <button type="button" :class="button" :disabled="locked || form.items.length >= MAX" data-testid="editor-add" @click="add">Adicionar informação</button>
    </div>
  </fieldset>
</template>
