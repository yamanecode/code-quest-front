<script setup lang="ts">
import { computed, ref } from 'vue'
import { useProfessorStore } from '~/stores/professor'
import type { ProfClassroom } from '~/types/api'
import { errorLines } from '~/utils/format'
import { HELP } from '~/utils/help'

// Name and weekly goal of a turma. PUT replaces the turma, so both fields are always sent;
// an empty goal means "automatic" and is sent as null (spec §8.4).
const props = defineProps<{ classroom: ProfClassroom, members?: number }>()

const professor = useProfessorStore()

const name = ref(props.classroom.name)
const goal = ref(props.classroom.weekly_goal === null ? '' : String(props.classroom.weekly_goal))
const errors = ref<string[]>([])
const status = ref('')
const busy = ref(false)

// The "?" explains the automatic goal and, when the member count is known, what it is today.
const goalHelp = computed(() => {
  if (props.members === undefined) return HELP.weeklyGoal
  const word = props.members === 1 ? 'aluno' : 'alunos'
  return `${HELP.weeklyGoal} Hoje, com ${props.members} ${word}, a meta automática parte de ${Math.max(10, 5 * props.members)}.`
})

async function save() {
  errors.value = []
  status.value = ''
  const text = goal.value.trim()
  const weeklyGoal = text === '' ? null : Number(text)
  if (weeklyGoal !== null && (!Number.isInteger(weeklyGoal) || weeklyGoal < 1 || weeklyGoal > 1000)) {
    errors.value = ['A meta semanal precisa ser um número inteiro de 1 a 1000, ou deixe vazio para automática.']
    return
  }
  busy.value = true
  try {
    await professor.updateClassroom(props.classroom.id, { name: name.value.trim(), weekly_goal: weeklyGoal })
    status.value = 'Turma atualizada.'
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
  <form class="cq-sheet grid gap-4 bg-panel p-5" novalidate data-testid="goal-editor" @submit.prevent="save">
    <h2 class="font-display text-xl font-bold">Nome e meta da turma</h2>
    <TextField v-model="name" label="Nome da turma" testid="classroom-name-input" :maxlength="60" autocomplete="off" />
    <TextField
      v-model="goal"
      label="Meta semanal (desafios resolvidos pela primeira vez)"
      testid="weekly-goal-input"
      hint="Um número inteiro de 1 a 1000, por exemplo 20. Vazio = meta automática."
      placeholder="Ex.: 20"
      :help="goalHelp"
      :maxlength="4"
      autocomplete="off"
    />
    <ul v-if="errors.length" role="alert" class="list-disc cq-alert py-2 pl-8 pr-3 text-error-ink" data-testid="goal-errors">
      <li v-for="message in errors" :key="message">{{ message }}</li>
    </ul>
    <p class="min-h-6 font-semibold" role="status" data-testid="goal-status">{{ status }}</p>
    <div>
      <AppButton type="submit" :disabled="busy" data-testid="goal-save">Salvar turma</AppButton>
    </div>
  </form>
</template>
