<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useProfessorStore } from '~/stores/professor'
import type { ProfClassroom } from '~/types/api'

definePageMeta({ layout: 'app' })
useHead({ title: 'Turmas · CodeQuest' })

const professor = useProfessorStore()

const creating = ref(false)
// Tells what happened after creating, with the way to the next step.
const created = ref<ProfClassroom | null>(null)

onMounted(() => professor.loadClassrooms())

function onCreated(classroom: ProfClassroom) {
  created.value = classroom
  creating.value = false
}
</script>

<template>
  <div class="max-w-3xl">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="font-display text-4xl font-extrabold">Turmas</h1>
      <AppButton variant="primary" data-testid="new-classroom-open" @click="creating = true">Nova turma</AppButton>
    </div>
    <p class="mt-2 leading-relaxed text-muted">Cada turma tem um código: passe-o aos alunos para eles entrarem.</p>

    <p v-if="created" class="cq-sheet mt-6 bg-panel p-4 font-semibold" role="status" data-testid="created-notice">
      Turma {{ created.name }} criada. Passe o código <span class="cq-num">{{ created.join_code }}</span> aos alunos e
      <NuxtLink :to="`/professor/turmas/${created.id}`" class="underline underline-offset-4" data-testid="created-open">crie a primeira missão</NuxtLink>.
    </p>

    <section class="mt-8" aria-labelledby="h-classrooms">
      <h2 id="h-classrooms" class="font-display text-2xl font-bold">Suas turmas</h2>
      <p v-if="professor.loading && professor.classrooms.length === 0" class="mt-3 text-muted">Carregando turmas…</p>
      <div v-else-if="professor.error" role="alert" class="mt-3" data-testid="classrooms-error">
        <p>{{ professor.error }}</p>
        <button type="button" class="mt-2 font-semibold underline underline-offset-4" data-testid="classrooms-retry" @click="professor.loadClassrooms()">Tentar de novo</button>
      </div>
      <p v-else-if="professor.classrooms.length === 0" class="mt-3 text-muted" data-testid="classrooms-empty">Você ainda não criou nenhuma turma. Use “Nova turma” para começar.</p>
      <ul v-else class="mt-4 grid gap-3">
        <li
          v-for="classroom in professor.classrooms"
          :key="classroom.id"
          class="flex flex-wrap items-center justify-between gap-3 border-2 border-line-strong bg-panel p-4"
          :data-testid="`classroom-${classroom.id}`"
        >
          <NuxtLink :to="`/professor/turmas/${classroom.id}`" class="font-display text-xl font-bold underline underline-offset-4" data-testid="classroom-name">{{ classroom.name }}</NuxtLink>
          <ClosedBadge v-if="classroom.closed" />
          <JoinCode :id="classroom.id" :code="classroom.join_code" :name="classroom.name" class="text-sm" />
        </li>
      </ul>
    </section>

    <CreateClassroomModal
      v-if="creating"
      :create="professor.createClassroom"
      @created="onCreated"
      @cancel="creating = false"
    />
  </div>
</template>
