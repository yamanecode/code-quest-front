<script setup lang="ts">
import { SMALL_BUTTON } from '~/utils/styles'
import { computed, onMounted, ref, watch } from 'vue'
import { useProfessorStore } from '~/stores/professor'
import { CHALLENGE_TYPES, type ChallengeType } from '~/types/challenge'
import { errorLines } from '~/utils/format'
import { SKILLS } from '~/utils/skills'

definePageMeta({ layout: 'app' })
useHead({ title: 'Missão · CodeQuest' })

const route = useRoute()
const professor = useProfessorStore()
const missionId = computed(() => Number(route.params.id))

const title = ref('')
const description = ref('')
const position = ref('')
const addId = ref('')
const draftType = ref<ChallengeType>('ordering')
const draftTopic = ref('')
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
    position.value = String(mission.position)
  },
  { immediate: true },
)

onMounted(() => {
  professor.loadMission(missionId.value)
  professor.loadChallenges()
})

// Own challenges that are not in the mission yet.
const available = computed(() => {
  const inMission = new Set(professor.mission?.challenges.map((c) => c.id))
  return professor.challenges.filter((c) => !inMission.has(c.id))
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
  const order = Number(position.value)
  if (!title.value.trim()) throw new Error('Dê um título à missão.')
  if (!Number.isInteger(order) || order < 0) throw new Error('A posição precisa ser um número inteiro, 0 ou mais.')
  await professor.updateMission(missionId.value, {
    title: title.value.trim(),
    description: description.value.trim() || null,
    position: order,
  })
  status.value = 'Missão salva.'
})

const publish = () => run(async () => {
  await professor.publishMission(missionId.value)
  status.value = 'Missão publicada.'
})

const unpublish = () => run(async () => {
  await professor.unpublishMission(missionId.value)
  status.value = 'Missão voltou para rascunho.'
})

const setIds = (ids: number[]) => run(async () => {
  await professor.setMissionChallenges(missionId.value, ids)
})

const currentIds = () => professor.mission?.challenges.map((c) => c.id) ?? []

function addChallenge() {
  if (!addId.value) return
  const ids = [...currentIds(), Number(addId.value)]
  addId.value = ''
  return setIds(ids)
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

// The backend appends the draft to the mission, so the mission is loaded again.
const generate = () => run(async () => {
  const topic = draftTopic.value.trim()
  if (!topic) throw new Error('Escreva o tema do rascunho.')
  await professor.generateDraft({ type: draftType.value, topic, mission_id: missionId.value })
  await professor.loadMission(missionId.value)
  draftTopic.value = ''
  status.value = 'Rascunho criado e adicionado à missão. Abra o desafio para revisar e publicar.'
})

const remove = () => run(async () => {
  askDelete.value = false
  const classroomId = professor.mission?.classroom_id
  await professor.deleteMission(missionId.value)
  await navigateTo(`/professor/turmas/${classroomId}`)
})

const button = SMALL_BUTTON
const input = 'h-11 border-2 border-line-strong bg-panel px-3'
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
        <span class="border-2 border-line-strong px-2 py-0.5 text-sm font-semibold" data-testid="mission-status">{{ professor.mission.status === 'published' ? 'Publicada' : 'Rascunho' }}</span>
      </div>

      <form class="cq-sheet mt-6 grid gap-4 bg-panel p-5" novalidate data-testid="mission-form" @submit.prevent="save">
        <h2 class="font-display text-xl font-bold">Dados da missão</h2>
        <TextField v-model="title" label="Título" testid="mission-title-input" :maxlength="80" autocomplete="off" />
        <TextField v-model="description" label="Descrição (opcional)" testid="mission-description-input" :maxlength="400" autocomplete="off" />
        <TextField v-model="position" label="Posição na lista" testid="mission-position-input" hint="Quanto menor o número, mais cedo a missão aparece na lista. O 0 é a primeira." :maxlength="4" autocomplete="off" />
        <div>
          <button type="submit" :disabled="busy" :class="button" data-testid="mission-save">Salvar missão</button>
        </div>
      </form>

      <section class="mt-8" aria-labelledby="h-mission-challenges">
        <h2 id="h-mission-challenges" class="font-display text-2xl font-bold">Desafios da missão</h2>
        <p v-if="professor.mission.challenges.length === 0" class="mt-3 text-muted" data-testid="mission-empty">Nenhum desafio na missão ainda.</p>
        <ol v-else class="mt-4 grid gap-2">
          <li v-for="(challenge, index) in professor.mission.challenges" :key="challenge.id" class="flex flex-wrap items-center gap-2" :data-testid="`mission-challenge-${challenge.id}`">
            <span class="cq-num w-6 text-right font-bold" aria-hidden="true">{{ index + 1 }}</span>
            <NuxtLink :to="`/professor/desafios/${challenge.id}`" class="min-w-0 flex-1 font-semibold underline underline-offset-4">{{ challenge.title }}</NuxtLink>
            <span class="text-sm text-muted">{{ SKILLS[challenge.type].short }} · {{ challenge.status === 'published' ? 'Publicado' : 'Rascunho' }}</span>
            <button type="button" :class="button" :disabled="busy || index === 0" :aria-label="`Subir ${challenge.title}`" :data-testid="`mission-up-${challenge.id}`" @click="moveChallenge(index, -1)">▲</button>
            <button type="button" :class="button" :disabled="busy || index === professor.mission.challenges.length - 1" :aria-label="`Descer ${challenge.title}`" :data-testid="`mission-down-${challenge.id}`" @click="moveChallenge(index, 1)">▼</button>
            <button type="button" :class="button" :disabled="busy" :aria-label="`Remover ${challenge.title} da missão`" :data-testid="`mission-remove-${challenge.id}`" @click="removeChallenge(challenge.id)">Remover</button>
          </li>
        </ol>

        <div class="mt-4 flex flex-wrap items-end gap-3">
          <label class="grid gap-1.5">
            <span class="text-sm font-semibold">Adicionar desafio</span>
            <select v-model="addId" :class="input" data-testid="mission-add-select">
              <option value="">Escolha um desafio</option>
              <option v-for="challenge in available" :key="challenge.id" :value="String(challenge.id)">{{ challenge.title }}</option>
            </select>
          </label>
          <button type="button" :class="button" :disabled="busy || !addId" data-testid="mission-add" @click="addChallenge">Adicionar</button>
        </div>
      </section>

      <form class="cq-sheet mt-8 grid gap-4 bg-panel p-5" novalidate data-testid="mission-draft" @submit.prevent="generate">
        <h2 class="font-display text-xl font-bold">Gerar rascunho com IA</h2>
        <div class="grid items-start gap-4 sm:grid-cols-[auto_1fr]">
          <label class="grid gap-1.5">
            <span class="font-semibold">Tipo</span>
            <select v-model="draftType" class="h-12 border-2 border-line-strong bg-panel px-3" data-testid="mission-draft-type">
              <option v-for="type in CHALLENGE_TYPES" :key="type" :value="type">{{ SKILLS[type].label }}</option>
            </select>
          </label>
          <TextField v-model="draftTopic" label="Tema" testid="mission-draft-topic" :maxlength="120" autocomplete="off" />
        </div>
        <div>
          <button type="submit" :disabled="busy" :class="button" data-testid="mission-draft-submit">Gerar rascunho com IA</button>
        </div>
      </form>

      <ul v-if="errors.length" role="alert" class="mt-6 list-disc cq-alert py-3 pl-8 pr-4 text-error-ink" data-testid="mission-errors">
        <li v-for="message in errors" :key="message">{{ message }}</li>
      </ul>
      <p class="mt-4 min-h-6 font-semibold" role="status" data-testid="mission-feedback">{{ status }}</p>

      <div class="mt-2 flex flex-wrap items-center gap-3">
        <button
          v-if="professor.mission.status === 'draft'"
          type="button"
          :disabled="busy"
          class="bg-go px-5 py-2.5 font-display text-lg font-bold text-on-go transition-colors hover:bg-go-hover disabled:cursor-wait disabled:opacity-60 cq-go-shadow"
          data-testid="mission-publish"
          @click="publish"
        >Publicar missão</button>
        <button v-else type="button" :disabled="busy" :class="button" data-testid="mission-unpublish" @click="unpublish">Voltar para rascunho</button>
        <button type="button" :disabled="busy" :class="button" data-testid="mission-delete" @click="askDelete = true">Excluir missão</button>
      </div>
    </template>

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
