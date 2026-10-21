<script setup lang="ts">
import { computed } from 'vue'
import type { FormState } from '~/utils/challengeForm'
import { validateForm } from '~/utils/rules'

// Fields common to the four types, the editor of the type and the live rule check.
// Locked challenges (already answered) keep only their texts editable (spec §4.5).
const form = defineModel<FormState>({ required: true })
const props = defineProps<{ locked: boolean }>()

const rules = computed(() => validateForm(form.value))

const area = 'w-full border-2 border-line-strong bg-panel px-3 py-2.5 text-ink focus:border-ink focus:outline-none'
</script>

<template>
  <div class="grid gap-6">
    <p
      v-if="props.locked"
      role="note"
      class="border-2 border-line-strong bg-raised px-4 py-3"
      data-testid="locked-note"
    >Este desafio já foi respondido: só os textos podem mudar. Use Duplicar para alterar a estrutura.</p>

    <TextField v-model="form.title" label="Título" testid="field-title" :maxlength="80" autocomplete="off" />

    <label class="grid gap-1.5">
      <span class="font-semibold">Enunciado</span>
      <textarea v-model="form.statement" rows="4" maxlength="600" :class="area" data-testid="field-statement" />
      <span class="text-sm text-muted">De 20 a 600 caracteres; precisa caber em uma tela.</span>
    </label>

    <OrderingEditor v-if="form.type === 'ordering'" v-model="form" :locked="props.locked" />
    <GroupingEditor v-else-if="form.type === 'grouping'" v-model="form" :locked="props.locked" />
    <FilteringEditor v-else-if="form.type === 'filtering'" v-model="form" :locked="props.locked" />
    <PatternEditor v-else v-model="form" :locked="props.locked" />

    <label class="grid gap-1.5">
      <span class="font-semibold">Explicação (opcional)</span>
      <textarea v-model="form.explanation" rows="3" maxlength="400" :class="area" data-testid="field-explanation" />
      <span class="text-sm text-muted">Aparece para o aluno depois que ele acerta.</span>
    </label>

    <section aria-labelledby="h-rules" class="border-2 border-line-strong bg-panel px-4 py-3" data-testid="rules">
      <h2 id="h-rules" class="font-display text-lg font-bold">Regras do modelo</h2>
      <p v-if="rules.length === 0" class="mt-1 text-success" data-testid="rules-ok">Tudo certo: o desafio segue as regras.</p>
      <ul v-else class="mt-1 list-disc pl-5" data-testid="rule-errors">
        <li v-for="message in rules" :key="message">{{ message }}</li>
      </ul>
    </section>
  </div>
</template>
