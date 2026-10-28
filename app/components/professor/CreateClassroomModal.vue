<script setup lang="ts">
import { ref } from 'vue'
import { errorLines } from '~/utils/format'
import { HELP } from '~/utils/help'
import type { ClassroomInput, ProfClassroom } from '~/types/api'

// New turma: name and optional weekly goal (empty = automatic, spec §5.3).
const props = defineProps<{ create: (input: ClassroomInput) => Promise<ProfClassroom> }>()
const emit = defineEmits<{ created: [classroom: ProfClassroom], cancel: [] }>()

const name = ref('')
const goal = ref('')
const errors = ref<string[]>([])
const busy = ref(false)

async function submit() {
  errors.value = []
  const text = goal.value.trim()
  const weeklyGoal = text === '' ? null : Number(text)
  if (!name.value.trim()) {
    errors.value = ['Dê um nome à turma.']
    return
  }
  if (weeklyGoal !== null && (!Number.isInteger(weeklyGoal) || weeklyGoal < 1 || weeklyGoal > 1000)) {
    errors.value = ['A meta semanal precisa ser um número inteiro de 1 a 1000, ou deixe vazio para automática.']
    return
  }
  busy.value = true
  try {
    emit('created', await props.create({ name: name.value.trim(), weekly_goal: weeklyGoal }))
  }
  catch (e) {
    errors.value = errorLines(e)
  }
  finally {
    busy.value = false
  }
}
</script>

<template>
  <FormDialog title="Nova turma" submit-label="Criar turma" testid="create-classroom" :errors="errors" :busy="busy" @submit="submit" @cancel="emit('cancel')">
    <TextField v-model="name" label="Nome da turma" testid="new-classroom-name" :maxlength="60" autocomplete="off" />
    <TextField
      v-model="goal"
      label="Meta semanal (opcional)"
      testid="new-classroom-goal"
      hint="Um número inteiro de 1 a 1000, por exemplo 20. Vazio = meta automática."
      placeholder="Ex.: 20"
      :help="HELP.weeklyGoal"
      :maxlength="4"
      autocomplete="off"
    />
  </FormDialog>
</template>
