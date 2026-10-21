<script setup lang="ts">
import { nextItemId, type FormState } from '~/utils/challengeForm'

// The shown terms of the sequence and 4–5 options; one option is the correct next term.
const form = defineModel<FormState>({ required: true })
defineProps<{ locked: boolean }>()

function addTerm() {
  form.value.sequence.push('')
}

function removeTerm(index: number) {
  form.value.sequence.splice(index, 1)
}

function addOption() {
  form.value.options.push({ id: nextItemId(form.value.options), text: '' })
}

function removeOption(index: number) {
  const [removed] = form.value.options.splice(index, 1)
  if (form.value.correct === removed!.id) form.value.correct = ''
}

const button = 'border-2 border-line-strong px-2.5 py-1.5 font-semibold transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40'
const field = 'min-w-0 flex-1 border-2 border-line-strong bg-panel px-3 py-2 text-ink focus:border-ink focus:outline-none'
</script>

<template>
  <div class="grid gap-6" data-testid="editor-pattern">
    <fieldset class="grid gap-3">
      <legend class="font-display text-xl font-bold">Sequência mostrada</legend>
      <ol class="grid gap-2">
        <li v-for="(_, index) in form.sequence" :key="index" class="flex flex-wrap items-center gap-2">
          <input v-model="form.sequence[index]" type="text" maxlength="40" :aria-label="`Termo ${index + 1}`" :class="field" :data-testid="`editor-term-${index}`">
          <button type="button" :class="button" :disabled="locked || form.sequence.length <= 3" :aria-label="`Remover o termo ${index + 1}`" :data-testid="`editor-term-remove-${index}`" @click="removeTerm(index)">Remover</button>
        </li>
      </ol>
      <div>
        <button type="button" :class="button" :disabled="locked || form.sequence.length >= 8" data-testid="editor-add-term" @click="addTerm">Adicionar termo</button>
      </div>
    </fieldset>

    <fieldset class="grid gap-3">
      <legend class="font-display text-xl font-bold">Opções para o próximo termo</legend>
      <p class="text-sm text-muted">Marque a opção correta.</p>
      <ul class="grid gap-2">
        <li v-for="(option, index) in form.options" :key="option.id" class="flex flex-wrap items-center gap-2">
          <input v-model="form.correct" type="radio" name="correct-option" :value="option.id" :disabled="locked" class="size-5" :aria-label="`Opção ${index + 1} é a correta`" :data-testid="`editor-correct-${index}`">
          <input v-model="option.text" type="text" maxlength="40" :aria-label="`Opção ${index + 1}`" :class="field" :data-testid="`editor-item-${index}`">
          <button type="button" :class="button" :disabled="locked || form.options.length <= 4" :aria-label="`Remover a opção ${index + 1}`" :data-testid="`editor-remove-${index}`" @click="removeOption(index)">Remover</button>
        </li>
      </ul>
      <div>
        <button type="button" :class="button" :disabled="locked || form.options.length >= 5" data-testid="editor-add" @click="addOption">Adicionar opção</button>
      </div>
    </fieldset>
  </div>
</template>
