<script setup lang="ts">
import { SMALL_BUTTON } from '~/utils/styles'
import { computed, onMounted, ref, watch } from 'vue'
import { useProfessorStore } from '~/stores/professor'
import { errorLines } from '~/utils/format'

definePageMeta({ layout: 'app' })
useHead({ title: 'Missão · CodeQuest' })

const route = useRoute()
const professor = useProfessorStore()
const missionId = computed(() => Number(route.params.id))

const title = ref('')
const description = ref('')
const adding = ref(false)
const errors = ref<string[]>([])
const status = ref('')
const busy = ref(false)
const askDelete = ref(false)

// Fill the edit form whenever the mission is (re)loaded or saved.
watch(
  () => professor.mission,
  (mission) => {
    if (!mission) return
    title.value = mission.title
    description.value = mission.description ?? ''
  },
  { immediate: true },
)

onMounted(() => {
  professor.loadMission(missionId.value)
  professor.loadChallenges()
})

async function run(action: () => Promise<void>) {
  busy.value = true
  errors.value = []
  status.value = ''
  try {
    await action()
  }
  catch (e) {
    errors.value = errorLines(e)
  }
  finally {
    busy.value = false
  }
}

const save = () => run(async () => {
  if (!title.value.trim()) throw new Error('Dê um título à missão.')
  // The order of the missions is set on the turma screen; the API still wants the position, so it is kept.
  await professor.updateMission(missionId.value, {
    title: title.value.trim(),
    description: description.value.trim() || null,
    position: professor.mission?.position ?? 0,
  })
  status.value = 'Missão salva.'
})

const publish = () => run(async () => {
  await professor.publishMission(missionId.value)
  status.value = 'Missão publicada.'
})

const unpublish = () => run(async () => {
  await professor.unpublishMission(missionId.value)
  status.value = 'Missão despublicada: a turma não a vê mais.'
})

const setIds = (ids: number[]) => run(async () => {
  await professor.setMissionChallenges(missionId.value, ids)
})

const hasPublished = computed(() => professor.mission?.challenges.some((c) => c.status === 'published') ?? false)

const currentIds = () => professor.mission?.challenges.map((c) => c.id) ?? []

// The ticked challenges go to the end of the mission, in the order the modal listed them.
async function addChallenges(ids: number[]) {
  await setIds([...currentIds(), ...ids])
  if (errors.value.length === 0) adding.value = false
}

const removeChallenge = (id: number) => setIds(currentIds().filter((x) => x !== id))

function moveChallenge(index: number, by: -1 | 1) {
  const ids = currentIds()
  const target = index + by
  if (target < 0 || target >= ids.length) return
  const [moved] = ids.splice(index, 1)
  ids.splice(target, 0, moved!)
  return setIds(ids)
}

const remove = () => run(async () => {
  askDelete.value = false
  const classroomId = professor.mission?.classroom_id
  await professor.deleteMission(missionId.value)
  await navigateTo(`/professor/turmas/${classroomId}`)
})

const button = SMALL_BUTTON
</script>

<template>
  <div class="max-w-3xl">
    <div v-if="professor.error" role="alert" data-testid="mission-load-error">
      <p>{{ professor.error }}</p>
      <button type="button" class="mt-2 font-semibold underline underline-offset-4" data-testid="mission-retry" @click="professor.loadMission(missionId)">Tentar de novo</button>
    </div>
    <p v-else-if="!professor.mission || professor.mission.id !== missionId" class="text-muted">Carregando missão…</p>

    <template v-else>
      <NuxtLink :to="`/professor/turmas/${professor.mission.classroom_id}`" class="inline-flex min-h-11 items-center font-semibold underline underline-offset-4" data-testid="back-classroom">← Turma</NuxtLink>
      <div class="mt-4 flex flex-wrap items-center gap-3">
        <h1 class="font-display text-4xl font-extrabold" data-testid="mission-heading">{{ professor.mission.title }}</h1>
        <StatusBadge :status="professor.mission.status" feminine data-testid="mission-status" />
      </div>

      <section class="cq-sheet mt-6 bg-panel p-5" aria-labelledby="h-publication">
        <h2 id="h-publication" class="font-display text-xl font-bold">Publicação</h2>
        <p class="mt-1 text-muted">
          {{ professor.mission.status === 'draft' ? 'Os alunos da turma só veem a missão depois de publicada.' : 'Os alunos da turma já veem esta missão.' }}
        </p>
        <p
          v-if="professor.mission.status === 'draft' && !hasPublished"
          class="cq-alert mt-3 px-4 py-3 text-error-ink"
          data-testid="mission-needs-published"
        >Para publicar a missão, ela precisa de pelo menos 1 desafio publicado. Os rascunhos não contam.</p>
        <div class="mt-4 flex flex-wrap items-center gap-3">
          <AppButton v-if="professor.mission.status === 'draft'" variant="primary" :disabled="busy" data-testid="mission-publish" @click="publish">Publicar missão</AppButton>
          <AppButton v-else :disabled="busy" data-testid="mission-unpublish" @click="unpublish">Despublicar missão</AppButton>
        </div>
        <ul v-if="errors.length" role="alert" class="mt-4 list-disc cq-alert py-3 pl-8 pr-4 text-error-ink" data-testid="mission-errors">
          <li v-for="message in errors" :key="message">{{ message }}</li>
        </ul>
        <p class="mt-3 min-h-6 font-semibold" role="status" data-testid="mission-feedback">{{ status }}</p>
      </section>

      <form class="cq-sheet mt-6 grid gap-4 bg-panel p-5" novalidate data-testid="mission-form" @submit.prevent="save">
        <h2 class="font-display text-xl font-bold">Dados da missão</h2>
        <TextField v-model="title" label="Título" testid="mission-title-input" :maxlength="80" autocomplete="off" />
        <TextField v-model="description" label="Descrição (opcional)" testid="mission-description-input" :maxlength="400" autocomplete="off" />
        <div>
          <AppButton type="submit" :disabled="busy" data-testid="mission-save">Salvar missão</AppButton>
        </div>
      </form>

      <section class="cq-sheet mt-8 bg-panel p-5" aria-labelledby="h-mission-challenges">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 id="h-mission-challenges" class="font-display text-2xl font-bold">Desafios da missão</h2>
          <div class="flex flex-wrap gap-3">
            <AppButton :to="`/professor/desafios/novo?missao=${missionId}`" variant="primary" data-testid="mission-create-challenge">Criar desafio</AppButton>
            <AppButton :disabled="busy" data-testid="mission-add-open" @click="adding = true">Adicionar existente</AppButton>
          </div>
        </div>
        <p v-if="professor.mission.challenges.length === 0" class="mt-3 text-muted" data-testid="mission-empty">Nenhum desafio na missão ainda.</p>
        <ol v-else class="mt-4">
          <li
            v-for="(challenge, index) in professor.mission.challenges"
            :key="challenge.id"
            class="flex flex-wrap items-center gap-2 border-b border-line py-2 last:border-b-0"
            :data-testid="`mission-challenge-${challenge.id}`"
          >
            <TypeBar :type="challenge.type" />
            <span class="cq-num w-6 text-right font-bold" aria-hidden="true">{{ index + 1 }}</span>
            <NuxtLink :to="`/professor/desafios/${challenge.id}`" class="min-w-0 flex-1 font-semibold underline underline-offset-4">{{ challenge.title }}</NuxtLink>
            <SkillTag :type="challenge.type" :help="false" />
            <StatusBadge :status="challenge.status" />
            <button type="button" :class="button" :disabled="busy || index === 0" :aria-label="`Subir ${challenge.title}`" :data-testid="`mission-up-${challenge.id}`" @click="moveChallenge(index, -1)">▲</button>
            <button type="button" :class="button" :disabled="busy || index === professor.mission.challenges.length - 1" :aria-label="`Descer ${challenge.title}`" :data-testid="`mission-down-${challenge.id}`" @click="moveChallenge(index, 1)">▼</button>
            <button type="button" :class="button" :disabled="busy" :aria-label="`Remover ${challenge.title} da missão`" :data-testid="`mission-remove-${challenge.id}`" @click="removeChallenge(challenge.id)">Remover</button>
          </li>
        </ol>

      </section>

      <div class="mt-8 flex justify-end">
        <AppButton variant="danger" :disabled="busy" data-testid="mission-delete" @click="askDelete = true">Excluir missão</AppButton>
      </div>
    </template>

    <AddChallengesModal
      v-if="adding && professor.mission"
      :challenges="professor.challenges"
      :exclude-ids="professor.mission.challenges.map((c) => c.id)"
      :busy="busy"
      @add="addChallenges"
      @cancel="adding = false"
    />

    <ConfirmDialog
      v-if="askDelete"
      title="Excluir missão?"
      message="A missão some da turma. Se algum aluno já respondeu, ela não pode ser excluída."
      confirm-label="Excluir"
      testid="delete-mission-dialog"
      :busy="busy"
      @confirm="remove"
      @cancel="askDelete = false"
    />
  </div>
</template>
