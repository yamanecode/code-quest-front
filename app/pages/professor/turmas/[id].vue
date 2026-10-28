<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useProfessorStore } from '~/stores/professor'
import type { ProfMission } from '~/types/api'
import { errorLines } from '~/utils/format'
import { SMALL_BUTTON } from '~/utils/styles'

definePageMeta({ layout: 'app' })
useHead({ title: 'Turma · CodeQuest' })

const route = useRoute()
const professor = useProfessorStore()
const classroomId = computed(() => Number(route.params.id))

const creating = ref(false)
// Tells what happened after creating a mission, with the way to the next step.
const created = ref<ProfMission | null>(null)
const busy = ref(false)
const moveError = ref('')
const closing = ref(false)
const closeBusy = ref(false)
const closeError = ref('')
const renewHelp = computed(() =>
  professor.classroom?.closed
    ? 'O código não funciona mais para novos alunos. Quem já está na turma continua com tudo.'
    : 'Quem entrou por engano? Primeiro remova o estudante na tabela de progresso, depois gere um novo código. Sem isso, ele pode entrar de novo.',
)
const removing = ref<string | null>(null)
const renewing = ref(false)
const renewBusy = ref(false)
const renewError = ref('')
const members = computed(() => professor.progress?.students.length ?? 0)

const arrow = SMALL_BUTTON

async function move(id: number, by: -1 | 1) {
  moveError.value = ''
  busy.value = true
  try {
    await professor.moveMission(id, by)
  }
  catch (e) {
    moveError.value = errorLines(e).join(' ')
  }
  finally {
    busy.value = false
  }
}

// Closing asks first; reopening is harmless, so it goes straight through.
async function setClosed(close: boolean) {
  closeError.value = ''
  closeBusy.value = true
  try {
    if (close) await professor.closeClassroom(classroomId.value)
    else await professor.reopenClassroom(classroomId.value)
    closing.value = false
  }
  catch (e) {
    closeError.value = errorLines(e).join(' ') // the dialog stays open and shows it
  }
  finally {
    closeBusy.value = false
  }
}

async function renew() {
  renewError.value = ''
  renewBusy.value = true
  try {
    await professor.renewJoinCode(classroomId.value)
    renewing.value = false
  }
  catch (e) {
    renewError.value = errorLines(e).join(' ') // the dialog stays open and shows it
  }
  finally {
    renewBusy.value = false
  }
}

onMounted(() => professor.loadClassroom(classroomId.value))

function onCreated(mission: ProfMission) {
  created.value = mission
  creating.value = false
}
</script>

<template>
  <div class="max-w-4xl">
    <NuxtLink to="/professor" class="inline-flex min-h-11 items-center font-semibold underline underline-offset-4" data-testid="back-classrooms">← Turmas</NuxtLink>

    <div v-if="professor.error" role="alert" class="mt-4" data-testid="classroom-error">
      <p>{{ professor.error }}</p>
      <button type="button" class="mt-2 font-semibold underline underline-offset-4" data-testid="classroom-retry" @click="professor.loadClassroom(classroomId)">Tentar de novo</button>
    </div>
    <p v-else-if="!professor.classroom || professor.classroom.id !== classroomId" class="mt-4 text-muted">Carregando turma…</p>

    <template v-else>
      <div class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 class="font-display text-4xl font-extrabold" data-testid="classroom-title">{{ professor.classroom.name }}</h1>
        <ClosedBadge v-if="professor.classroom.closed" />
      </div>
      <div class="mt-3 flex flex-wrap items-center gap-3">
        <JoinCode :id="professor.classroom.id" :code="professor.classroom.join_code" :name="professor.classroom.name" />
        <button type="button" class="cq-btn-outline" :aria-label="`Gerar novo código da turma ${professor.classroom.name}`" data-testid="renew-code" @click="renewError = ''; renewing = true">Gerar novo código</button>
        <HelpTip topic="join-code" label="Código da turma" :text="renewHelp" />
      </div>

      <div class="mt-6 grid gap-6 md:grid-cols-2">
        <section class="cq-sheet bg-panel p-5" aria-label="Meta da turma">
          <p v-if="professor.classroom.closed" class="font-semibold" data-testid="classroom-goal-closed">Turma encerrada</p>
          <ClassGoalBar v-else :goal="professor.classroom.goal" :name="professor.classroom.name" testid="classroom-goal" />
          <div class="mt-4 grid gap-2 border-t border-line pt-3 text-sm text-muted">
            <p><strong class="text-ink">Para que serve:</strong> os alunos resolvem desafios juntos durante a semana. Quando a turma chega na meta, quem ajudou ganha a insígnia “Trabalho em equipe”. A meta não dá XP e não há chat: é cooperação, sem comparar alunos.</p>
            <p data-testid="goal-how">
              <strong class="text-ink">Como é calculada:</strong>
              {{ professor.classroom.weekly_goal === null
                ? `meta automática de 5 desafios por aluno, no mínimo 10 (hoje, com ${members} ${members === 1 ? 'aluno' : 'alunos'}: ${Math.max(10, 5 * members)}).`
                : `você definiu ${professor.classroom.weekly_goal} desafios por semana.` }}
              Ela nunca passa do que a turma ainda pode resolver: alunos × desafios publicados, menos o que já foi resolvido antes desta semana.
              Sem desafios novos, não há meta.
            </p>
          </div>
        </section>
        <GoalEditor :key="professor.classroom.id" :classroom="professor.classroom" :members="members" />
      </div>

      <section class="mt-10" aria-labelledby="h-missions">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 id="h-missions" class="font-display text-2xl font-bold">Missões</h2>
          <AppButton variant="primary" data-testid="new-mission-open" @click="creating = true">Nova missão</AppButton>
        </div>
        <p v-if="created" class="cq-sheet mt-4 bg-panel p-4 font-semibold" role="status" data-testid="mission-created-notice">
          Missão {{ created.title }} criada.
          <NuxtLink :to="`/professor/missoes/${created.id}`" class="underline underline-offset-4" data-testid="mission-created-open">Adicione os desafios</NuxtLink>
          e publique para os alunos verem.
        </p>
        <div v-if="professor.missions.length === 0" class="mt-3" data-testid="missions-empty">
          <p class="text-muted">Esta turma ainda não tem missões. Os alunos só veem missões publicadas.</p>
          <AppButton variant="primary" class="mt-3" data-testid="missions-empty-create" @click="creating = true">Criar a primeira missão</AppButton>
        </div>
        <p v-else class="mt-2 text-sm text-muted">A ordem daqui é a ordem em que os alunos veem as missões. Use as setas para mudar.</p>
        <ol v-if="professor.missions.length > 0" class="mt-4 grid gap-3">
          <li
            v-for="(mission, index) in professor.missions"
            :key="mission.id"
            class="flex flex-wrap items-center gap-x-4 gap-y-3 border-2 border-line-strong bg-panel p-4"
            :data-testid="`mission-${mission.id}`"
          >
            <span class="cq-num w-7 text-right text-2xl font-extrabold text-label" aria-hidden="true">{{ index + 1 }}</span>
            <div class="min-w-0 flex-1 basis-56">
              <NuxtLink :to="`/professor/missoes/${mission.id}`" class="font-display text-xl font-bold underline underline-offset-4" data-testid="mission-title">{{ mission.title }}</NuxtLink>
              <p class="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
                <StatusBadge :status="mission.status" feminine data-testid="mission-status" />
                <span class="cq-num">
                  {{ mission.challenges.length }} {{ mission.challenges.length === 1 ? 'desafio' : 'desafios' }}<template v-if="mission.challenges.length > 0">, {{ mission.challenges.filter((c) => c.status === 'published').length }} publicados</template>
                </span>
              </p>
            </div>
            <div class="w-full basis-48 sm:w-56 sm:basis-56">
              <SkillMix :challenges="mission.challenges" />
            </div>
            <div class="flex gap-2">
              <button type="button" :class="arrow" :disabled="busy || index === 0" :aria-label="`Subir ${mission.title}`" :data-testid="`mission-up-${mission.id}`" @click="move(mission.id, -1)">▲</button>
              <button type="button" :class="arrow" :disabled="busy || index === professor.missions.length - 1" :aria-label="`Descer ${mission.title}`" :data-testid="`mission-down-${mission.id}`" @click="move(mission.id, 1)">▼</button>
            </div>
          </li>
        </ol>
        <p v-if="moveError" role="alert" class="mt-3 cq-alert px-4 py-3 text-error-ink" data-testid="mission-move-error">{{ moveError }}</p>
      </section>

      <section v-if="professor.progress" class="cq-sheet mt-10 bg-panel p-5" aria-labelledby="h-progress">
        <h2 id="h-progress" tabindex="-1" class="font-display text-2xl font-bold">Progresso</h2>
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
                <th scope="row" class="py-2 pr-3 text-left font-semibold">
                  {{ student.username }}
                  <button
                    type="button"
                    class="block min-h-11 text-sm font-semibold text-muted underline underline-offset-4 hover:text-ink"
                    :aria-label="`Remover ${student.username} da turma`"
                    :data-testid="`member-remove-${student.username}`"
                    @click="removing = student.username"
                  >Remover</button>
                </th>
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

      <section class="cq-sheet mt-10 bg-panel p-5" aria-labelledby="h-ranking">
        <h2 id="h-ranking" class="font-display text-2xl font-bold">Ranking da turma</h2>
        <PeriodTabs class="mt-3" :model-value="professor.rankingPeriod" panel-id="ranking-panel" @update:model-value="professor.loadRanking(classroomId, $event)" />
        <div id="ranking-panel" role="tabpanel" :aria-labelledby="`ranking-tab-${professor.rankingPeriod}`">
        <p v-if="!professor.ranking || professor.ranking.entries.length === 0" class="mt-3 text-muted" data-testid="ranking-empty">Nenhum aluno no ranking ainda.</p>
        <ol v-else class="mt-4 grid gap-2" data-testid="ranking-list">
          <li v-for="entry in professor.ranking.entries" :key="entry.username" class="flex items-baseline gap-4 border-t border-line pt-2" :data-testid="`ranking-entry-${entry.username}`">
            <span class="cq-num w-10 text-2xl font-extrabold">{{ entry.position }}º</span>
            <span class="min-w-0 flex-1 truncate font-semibold">{{ entry.username }}</span>
            <span class="cq-num text-lg">{{ entry.xp }} XP</span>
          </li>
        </ol>
        </div>
      </section>

      <section class="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6" aria-labelledby="h-state">
        <div class="min-w-0 flex-1 basis-64">
          <h2 id="h-state" tabindex="-1" class="font-display text-xl font-bold">{{ professor.classroom.closed ? 'Turma encerrada' : 'Encerrar a turma' }}</h2>
          <p class="mt-1 text-sm text-muted">
            {{ professor.classroom.closed
              ? 'Reabra para o código voltar a aceitar novos alunos.'
              : 'O código deixa de aceitar novos alunos. Quem já está na turma continua com tudo.' }}
          </p>
        </div>
        <AppButton v-if="professor.classroom.closed" :disabled="closeBusy" data-testid="classroom-reopen" @click="setClosed(false)">Reabrir turma</AppButton>
        <AppButton v-else variant="danger" data-testid="classroom-close" @click="closeError = ''; closing = true">Encerrar turma</AppButton>
        <p v-if="closeError && !closing" role="alert" class="w-full cq-alert px-4 py-3 text-error-ink" data-testid="classroom-close-error">{{ closeError }}</p>
      </section>
    </template>

    <RemoveMemberModal
      v-if="removing && professor.classroom"
      :username="removing"
      :remove="() => professor.removeMember(classroomId, removing!)"
      @done="removing = null"
      @cancel="removing = null"
    />

    <ConfirmDialog
      v-if="renewing"
      testid="code-dialog"
      title="Gerar um novo código?"
      message="O código atual deixa de funcionar. Quem já está na turma continua nela."
      confirm-label="Gerar novo código"
      :busy="renewBusy"
      :error="renewError"
      @confirm="renew"
      @cancel="renewing = false"
    />

    <ConfirmDialog
      v-if="closing && professor.classroom"
      testid="close-dialog"
      :title="`Encerrar a turma ${professor.classroom.name}?`"
      message="Novos estudantes não poderão entrar com o código. Quem já está na turma continua com tudo."
      confirm-label="Encerrar turma"
      :busy="closeBusy"
      :error="closeError"
      return-to="#h-state"
      @confirm="setClosed(true)"
      @cancel="closing = false"
    />

    <CreateMissionModal
      v-if="creating"
      :create="(input) => professor.createMission(classroomId, input)"
      @created="onCreated"
      @cancel="creating = false"
    />
  </div>
</template>
