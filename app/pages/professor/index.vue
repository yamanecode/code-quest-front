<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useProfessorStore } from '~/stores/professor'
import { errorLines } from '~/utils/format'
import { HELP } from '~/utils/help'

definePageMeta({ layout: 'app' })
useHead({ title: 'Turmas · CodeQuest' })

const professor = useProfessorStore()

const name = ref('')
const goal = ref('')
const errors = ref<string[]>([])
const busy = ref(false)

onMounted(() => professor.loadClassrooms())

const copiedId = ref<number | null>(null)

async function copyCode(code: string, classroomId: number) {
  try {
    await navigator.clipboard.writeText(code)
    copiedId.value = classroomId
    setTimeout(() => (copiedId.value = null), 2000)
  }
  catch {
    copiedId.value = null // the code stays visible next to the button
  }
}

async function create() {
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
    await professor.createClassroom({ name: name.value.trim(), weekly_goal: weeklyGoal })
    name.value = ''
    goal.value = ''
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
  <div class="max-w-3xl">
    <h1 class="font-display text-4xl font-extrabold">Turmas</h1>
    <p class="mt-2 leading-relaxed text-muted">Cada turma tem um código: passe-o aos alunos para eles entrarem.</p>

    <form class="cq-sheet mt-6 grid gap-4 bg-panel p-5" novalidate data-testid="create-classroom" @submit.prevent="create">
      <h2 class="font-display text-xl font-bold">Nova turma</h2>
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
      <ul v-if="errors.length" role="alert" class="list-disc cq-alert py-2 pl-8 pr-3 text-error-ink" data-testid="create-errors">
        <li v-for="message in errors" :key="message">{{ message }}</li>
      </ul>
      <div>
        <button
          type="submit"
          :disabled="busy"
          class="bg-go px-5 py-2.5 font-display text-lg font-bold text-on-go transition-colors hover:bg-go-hover disabled:cursor-wait disabled:opacity-60 cq-go-shadow"
          data-testid="create-submit"
        >Criar turma</button>
      </div>
    </form>

    <section class="mt-8" aria-labelledby="h-classrooms">
      <h2 id="h-classrooms" class="font-display text-2xl font-bold">Suas turmas</h2>
      <p v-if="professor.loading && professor.classrooms.length === 0" class="mt-3 text-muted">Carregando turmas…</p>
      <div v-else-if="professor.error" role="alert" class="mt-3" data-testid="classrooms-error">
        <p>{{ professor.error }}</p>
        <button type="button" class="mt-2 font-semibold underline underline-offset-4" data-testid="classrooms-retry" @click="professor.loadClassrooms()">Tentar de novo</button>
      </div>
      <p v-else-if="professor.classrooms.length === 0" class="mt-3 text-muted" data-testid="classrooms-empty">Você ainda não criou nenhuma turma.</p>
      <ul v-else class="mt-4 grid gap-3">
        <li
          v-for="classroom in professor.classrooms"
          :key="classroom.id"
          class="flex flex-wrap items-center justify-between gap-3 border-2 border-line-strong bg-panel p-4"
          :data-testid="`classroom-${classroom.id}`"
        >
          <NuxtLink :to="`/professor/turmas/${classroom.id}`" class="font-display text-xl font-bold underline underline-offset-4" data-testid="classroom-name">{{ classroom.name }}</NuxtLink>
          <p class="flex flex-wrap items-center gap-3 text-sm">
            <span class="inline-flex items-center bg-sticky px-3 py-1 text-sticky-ink">
              Código: <strong class="cq-num ml-2 text-lg tracking-widest" data-testid="join-code">{{ classroom.join_code }}</strong>
            </span>
            <button
              type="button"
              class="cq-btn-outline"
              :aria-label="`Copiar o código da turma ${classroom.name}`"
              :data-testid="`copy-code-${classroom.id}`"
              @click="copyCode(classroom.join_code, classroom.id)"
            >{{ copiedId === classroom.id ? 'Copiado!' : 'Copiar código' }}</button>
          </p>
        </li>
      </ul>
    </section>
  </div>
</template>
