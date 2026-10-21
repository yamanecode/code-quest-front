<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useProfessorStore } from '~/stores/professor'
import type { RankingPeriod } from '~/types/api'
import { errorLines } from '~/utils/format'

definePageMeta({ layout: 'app' })
useHead({ title: 'Turma · CodeQuest' })

const PERIODS: { value: RankingPeriod; label: string }[] = [
  { value: 'week', label: 'Semanal' },
  { value: 'month', label: 'Mensal' },
]

const route = useRoute()
const professor = useProfessorStore()
const classroomId = computed(() => Number(route.params.id))

const missionTitle = ref('')
const missionDescription = ref('')
const missionErrors = ref<string[]>([])
const busy = ref(false)

onMounted(() => professor.loadClassroom(classroomId.value))

async function createMission() {
  missionErrors.value = []
  if (!missionTitle.value.trim()) {
    missionErrors.value = ['Dê um título à missão.']
    return
  }
  busy.value = true
  try {
    await professor.createMission(classroomId.value, {
      title: missionTitle.value.trim(),
      description: missionDescription.value.trim() || null,
    })
    missionTitle.value = ''
    missionDescription.value = ''
  }
  catch (e) {
    missionErrors.value = errorLines(e)
  }
  finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="max-w-4xl">
    <NuxtLink to="/professor" class="font-semibold underline underline-offset-4" data-testid="back-classrooms">← Turmas</NuxtLink>

    <div v-if="professor.error" role="alert" class="mt-4" data-testid="classroom-error">
      <p>{{ professor.error }}</p>
      <button type="button" class="mt-2 font-semibold underline underline-offset-4" data-testid="classroom-retry" @click="professor.loadClassroom(classroomId)">Tentar de novo</button>
    </div>
    <p v-else-if="!professor.classroom || professor.classroom.id !== classroomId" class="mt-4 text-muted">Carregando turma…</p>

    <template v-else>
      <h1 class="mt-4 font-display text-4xl font-extrabold" data-testid="classroom-title">{{ professor.classroom.name }}</h1>
      <p class="mt-2">
        Código da turma: <strong class="cq-num text-xl tracking-widest" data-testid="join-code">{{ professor.classroom.join_code }}</strong>
      </p>

      <div class="mt-6 grid gap-6 md:grid-cols-2">
        <section class="cq-sheet bg-panel p-5" aria-label="Meta da turma">
          <ClassGoalBar :goal="professor.classroom.goal" :name="professor.classroom.name" testid="classroom-goal" />
        </section>
        <GoalEditor :key="professor.classroom.id" :classroom="professor.classroom" />
      </div>

      <section class="mt-10" aria-labelledby="h-missions">
        <h2 id="h-missions" class="font-display text-2xl font-bold">Missões</h2>
        <p v-if="professor.missions.length === 0" class="mt-3 text-muted" data-testid="missions-empty">Esta turma ainda não tem missões.</p>
        <ul v-else class="mt-4 grid gap-3">
          <li
            v-for="mission in professor.missions"
            :key="mission.id"
            class="flex flex-wrap items-center justify-between gap-3 border-2 border-line-strong bg-panel p-4"
            :data-testid="`mission-${mission.id}`"
          >
            <NuxtLink :to="`/professor/missoes/${mission.id}`" class="font-display text-xl font-bold underline underline-offset-4" data-testid="mission-title">{{ mission.title }}</NuxtLink>
            <p class="text-sm text-muted">
              <span data-testid="mission-status">{{ mission.status === 'published' ? 'Publicada' : 'Rascunho' }}</span>
              · {{ mission.challenges.length }} desafios
            </p>
          </li>
        </ul>

        <form class="cq-sheet mt-6 grid gap-4 bg-panel p-5" novalidate data-testid="create-mission" @submit.prevent="createMission">
          <h3 class="font-display text-xl font-bold">Nova missão</h3>
          <TextField v-model="missionTitle" label="Título" testid="new-mission-title" :maxlength="80" autocomplete="off" />
          <TextField v-model="missionDescription" label="Descrição (opcional)" testid="new-mission-description" :maxlength="400" autocomplete="off" />
          <ul v-if="missionErrors.length" role="alert" class="list-disc border border-error-line bg-error-bg py-2 pl-8 pr-3 text-error-ink" data-testid="mission-errors">
            <li v-for="message in missionErrors" :key="message">{{ message }}</li>
          </ul>
          <div>
            <button type="submit" :disabled="busy" class="border-2 border-line-strong px-4 py-2.5 font-semibold transition-colors hover:border-ink disabled:cursor-wait disabled:opacity-60" data-testid="create-mission-submit">Criar missão</button>
          </div>
        </form>
      </section>

      <section v-if="professor.progress" class="mt-10" aria-labelledby="h-progress">
        <h2 id="h-progress" class="font-display text-2xl font-bold">Progresso</h2>
        <p class="mt-2 text-lg" data-testid="completed-all">
          <strong class="cq-num">{{ professor.progress.completed_all_pct }}%</strong> da turma concluiu todas as missões
        </p>
        <p v-if="professor.progress.students.length === 0" class="mt-3 text-muted" data-testid="progress-empty">Nenhum aluno entrou na turma ainda.</p>
        <div v-else class="mt-4 overflow-x-auto">
          <table class="w-full border-collapse text-left" data-testid="progress-table">
            <caption class="sr-only">Progresso dos alunos na turma</caption>
            <thead>
              <tr class="text-sm text-label">
                <th scope="col" class="pb-2 pr-3 font-semibold">Aluno</th>
                <th scope="col" class="pb-2 pr-3 text-right font-semibold">XP na turma</th>
                <th scope="col" class="pb-2 pr-3 text-right font-semibold">Nível</th>
                <th scope="col" class="pb-2 pr-3 text-right font-semibold">Resolvidos</th>
                <th scope="col" class="pb-2 pr-3 text-right font-semibold">Missões</th>
                <th scope="col" class="pb-2 pr-3 text-right font-semibold">Dicas</th>
                <th scope="col" class="pb-2 text-right font-semibold">Sequência</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="student in professor.progress.students" :key="student.username" class="border-t border-line" :data-testid="`progress-${student.username}`">
                <th scope="row" class="py-2 pr-3 font-semibold">{{ student.username }}</th>
                <td class="cq-num py-2 pr-3 text-right">{{ student.xp_in_class }}</td>
                <td class="cq-num py-2 pr-3 text-right">{{ student.level }}</td>
                <td class="cq-num py-2 pr-3 text-right">{{ student.solved_in_class }}</td>
                <td class="cq-num py-2 pr-3 text-right">{{ student.missions_completed_in_class }}</td>
                <td class="cq-num py-2 pr-3 text-right">{{ student.hints_used }}</td>
                <td class="cq-num py-2 text-right">{{ student.streak }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="mt-10" aria-labelledby="h-ranking">
        <h2 id="h-ranking" class="font-display text-2xl font-bold">Ranking da turma</h2>
        <div class="mt-3 flex border border-control w-fit" role="group" aria-label="Período do ranking">
          <button
            v-for="period in PERIODS"
            :key="period.value"
            type="button"
            :aria-pressed="professor.rankingPeriod === period.value ? 'true' : 'false'"
            class="h-11 px-5 font-semibold transition-colors"
            :class="professor.rankingPeriod === period.value ? 'bg-ink text-bg' : 'text-muted hover:text-ink'"
            :data-testid="`ranking-${period.value}`"
            @click="professor.loadRanking(classroomId, period.value)"
          >{{ period.label }}</button>
        </div>
        <p v-if="!professor.ranking || professor.ranking.entries.length === 0" class="mt-3 text-muted" data-testid="ranking-empty">Nenhum aluno no ranking ainda.</p>
        <ol v-else class="mt-4 grid gap-2" data-testid="ranking-list">
          <li v-for="entry in professor.ranking.entries" :key="entry.username" class="flex items-baseline gap-4 border-t border-line pt-2" :data-testid="`ranking-entry-${entry.username}`">
            <span class="cq-num w-10 text-2xl font-extrabold">{{ entry.position }}º</span>
            <span class="min-w-0 flex-1 truncate font-semibold">{{ entry.username }}</span>
            <span class="cq-num text-lg">{{ entry.xp }} XP</span>
          </li>
        </ol>
      </section>
    </template>
  </div>
</template>
