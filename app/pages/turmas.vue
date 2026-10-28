<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useClassroomsStore } from '~/stores/classrooms'
import type { MyClassroom } from '~/types/api'
import { errorMessage } from '~/utils/format'

definePageMeta({ layout: 'app', compactStats: true })
useHead({ title: 'Minhas turmas · CodeQuest' })

const classrooms = useClassroomsStore()

const code = ref('')
const joining = ref(false)
const joinError = ref<string | null>(null)
// Announces what happened after joining or leaving a turma.
const status = ref<string | null>(null)

const leaving = ref<MyClassroom | null>(null)
const leaveBusy = ref(false)
const leaveError = ref<string | null>(null)

onMounted(() => classrooms.load())

async function join() {
  joinError.value = null
  status.value = null
  if (!code.value.trim()) {
    joinError.value = 'Digite o código da turma.'
    return
  }
  joining.value = true
  try {
    const classroom = await classrooms.join(code.value)
    status.value = `Você está na turma ${classroom.name}.`
    code.value = ''
  }
  catch (e) {
    joinError.value = errorMessage(e)
  }
  finally {
    joining.value = false
  }
}

function askLeave(classroom: MyClassroom) {
  leaveError.value = null
  leaving.value = classroom
}

async function confirmLeave() {
  if (!leaving.value) return
  const classroom = leaving.value
  leaveBusy.value = true
  try {
    await classrooms.leave(classroom.id)
    status.value = `Você saiu da turma ${classroom.name}. Seu XP e suas insígnias continuam com você.`
  }
  catch (e) {
    leaveError.value = errorMessage(e)
  }
  finally {
    leaveBusy.value = false
    leaving.value = null
  }
}
</script>

<template>
  <div class="max-w-3xl">
    <h1 class="font-display text-4xl font-extrabold">Minhas turmas</h1>
    <p class="mt-2 leading-relaxed text-muted">
      Entre em uma turma com o código que você recebeu na escola. Você pode estar em várias turmas ao mesmo tempo.
    </p>

    <form class="cq-sheet mt-6 grid gap-4 bg-panel p-5 sm:grid-cols-[1fr_auto] sm:items-end sm:p-6" novalidate @submit.prevent="join">
      <TextField
        v-model="code"
        label="Código da turma"
        testid="join-code"
        hint="6 letras ou números, por exemplo DEMO01."
        :maxlength="6"
        autocomplete="off"
      />
      <AppButton type="submit" variant="primary" class="sm:mb-[1.875rem]" :disabled="joining" data-testid="join-submit">{{ joining ? 'Entrando…' : 'Entrar na turma' }}</AppButton>
      <p
        v-if="joinError"
        role="alert"
        class="cq-alert px-3 py-2 text-error-ink sm:col-span-2"
        data-testid="join-error"
      >{{ joinError }}</p>
    </form>

    <p class="mt-4 min-h-6 font-semibold" role="status" data-testid="classrooms-status">{{ status }}</p>
    <p v-if="leaveError" role="alert" class="mt-2 text-error-ink" data-testid="leave-error">{{ leaveError }}</p>

    <section class="mt-6" aria-labelledby="h-my-classrooms">
      <h2 id="h-my-classrooms" class="font-display text-2xl font-bold">Turmas em que você está</h2>

      <p v-if="classrooms.loading && !classrooms.loaded" class="mt-3 text-muted">Carregando turmas…</p>
      <div v-else-if="classrooms.error" class="mt-3" role="alert">
        <p>{{ classrooms.error }}</p>
        <button
          type="button"
          class="mt-2 font-semibold underline underline-offset-4 hover:decoration-2"
          data-testid="classrooms-retry"
          @click="classrooms.load()"
        >Tentar de novo</button>
      </div>
      <p v-else-if="classrooms.list.length === 0" class="mt-3 text-muted" data-testid="classrooms-empty">
        Você ainda não está em nenhuma turma. Enquanto isso, as missões da Trilha CodeQuest estão liberadas no início.
      </p>

      <ul v-else class="mt-4 grid gap-3">
        <li
          v-for="classroom in classrooms.list"
          :key="classroom.id"
          class="border-2 border-line-strong bg-panel p-5"
          :data-testid="`classroom-${classroom.id}`"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <h3 class="font-display text-xl font-bold" data-testid="classroom-name">{{ classroom.name }}</h3>
            <button
              type="button"
              class="min-h-11 px-2 text-sm font-semibold text-muted underline underline-offset-4 hover:text-ink"
              :aria-label="`Sair da turma ${classroom.name}`"
              :data-testid="`classroom-leave-${classroom.id}`"
              @click="askLeave(classroom)"
            >Sair da turma</button>
          </div>
          <template v-if="classroom.closed">
            <ClosedBadge class="mt-2" />
            <p class="mt-2 text-sm text-muted" data-testid="classroom-closed-note">O professor encerrou esta turma: ninguém novo entra, e suas missões continuam.</p>
          </template>
          <ClassGoalBar v-if="!classroom.closed" class="mt-4" :goal="classroom.goal" :name="classroom.name" :testid="`goal-${classroom.id}`" />
        </li>
      </ul>
    </section>

    <ConfirmDialog
      v-if="leaving"
      testid="leave-dialog"
      :title="`Sair da turma ${leaving.name}?`"
      message="As missões dessa turma vão sumir do seu início. Seu XP, suas insígnias e seu histórico continuam com você."
      confirm-label="Sair da turma"
      :busy="leaveBusy"
      @confirm="confirmLeave"
      @cancel="leaving = null"
    />
  </div>
</template>
