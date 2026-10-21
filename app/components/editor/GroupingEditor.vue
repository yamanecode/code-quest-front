<script setup lang="ts">
import { nextGroupId, nextItemId, type FormState } from '~/utils/challengeForm'

// Etapas (groups) and tasks (items); each task is assigned to the etapa it belongs to.
const form = defineModel<FormState>({ required: true })
defineProps<{ locked: boolean }>()

function addGroup() {
  form.value.groups.push({ id: nextGroupId(form.value.groups), text: '' })
}

function removeGroup(index: number) {
  const [removed] = form.value.groups.splice(index, 1)
  for (const item of form.value.items) {
    if (form.value.assignment[item.id] === removed!.id) form.value.assignment[item.id] = ''
  }
}

function addItem() {
  const id = nextItemId(form.value.items)
  form.value.items.push({ id, text: '' })
  form.value.assignment[id] = ''
}

function removeItem(index: number) {
  const [removed] = form.value.items.splice(index, 1)
  form.value.assignment = Object.fromEntries(
    Object.entries(form.value.assignment).filter(([id]) => id !== removed!.id),
  )
}

const button = 'border-2 border-line-strong px-2.5 py-1.5 font-semibold transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40'
const field = 'min-w-0 flex-1 border-2 border-line-strong bg-panel px-3 py-2 text-ink focus:border-ink focus:outline-none'
</script>

<template>
  <div class="grid gap-6" data-testid="editor-grouping">
    <fieldset class="grid gap-3">
      <legend class="font-display text-xl font-bold">Etapas</legend>
      <ul class="grid gap-2">
        <li v-for="(group, index) in form.groups" :key="group.id" class="flex flex-wrap items-center gap-2">
          <input v-model="group.text" type="text" maxlength="120" :aria-label="`Etapa ${index + 1}`" :class="field" :data-testid="`editor-group-${index}`">
          <button type="button" :class="button" :disabled="locked || form.groups.length <= 2" :aria-label="`Remover a etapa ${index + 1}`" :data-testid="`editor-group-remove-${index}`" @click="removeGroup(index)">Remover</button>
        </li>
      </ul>
      <div>
        <button type="button" :class="button" :disabled="locked || form.groups.length >= 4" data-testid="editor-add-group" @click="addGroup">Adicionar etapa</button>
      </div>
    </fieldset>

    <fieldset class="grid gap-3">
      <legend class="font-display text-xl font-bold">Tarefas</legend>
      <ul class="grid gap-2">
        <li v-for="(item, index) in form.items" :key="item.id" class="flex flex-wrap items-center gap-2">
          <input v-model="item.text" type="text" maxlength="120" :aria-label="`Tarefa ${index + 1}`" :class="field" :data-testid="`editor-item-${index}`">
          <select
            v-model="form.assignment[item.id]"
            :disabled="locked"
            :aria-label="`Etapa da tarefa ${index + 1}`"
            class="h-11 border-2 border-line-strong bg-panel px-3"
            :data-testid="`editor-assign-${index}`"
          >
            <option value="">Escolha a etapa</option>
            <option v-for="(group, groupIndex) in form.groups" :key="group.id" :value="group.id">{{ group.text.trim() || `Etapa ${groupIndex + 1}` }}</option>
          </select>
          <button type="button" :class="button" :disabled="locked || form.items.length <= 4" :aria-label="`Remover a tarefa ${index + 1}`" :data-testid="`editor-remove-${index}`" @click="removeItem(index)">Remover</button>
        </li>
      </ul>
      <div>
        <button type="button" :class="button" :disabled="locked || form.items.length >= 10" data-testid="editor-add" @click="addItem">Adicionar tarefa</button>
      </div>
    </fieldset>
  </div>
</template>
