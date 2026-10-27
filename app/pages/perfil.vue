<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useProfileStore } from '~/stores/profile'
import { useSettingsStore } from '~/stores/settings'
import type { ProfileBadge } from '~/types/api'
import type { ChallengeType } from '~/types/challenge'
import { badgeProgress, nextBadges } from '~/utils/badges'
import { errorMessage } from '~/utils/format'
import { HELP } from '~/utils/help'
import { SKILLS } from '~/utils/skills'

// Student profile (spec §5, §9.1): the student's own stat panel (the header leaves
// its copy out here), skill progress, the badge shelf and the two preferences.
definePageMeta({ layout: 'app', hideStats: true })
useHead({ title: 'Meu perfil · CodeQuest' })

// The skill badges are earned at 3, 7 and 15 solves of a type (spec §5.1). All four bars
// share the 0–15 scale so a longer bar always means more solves.
const SKILL_MILESTONES = [3, 7, 15]
const SKILL_SCALE = 15
const SKILL_MARKS = [3, 7].map((mark) => (mark / SKILL_SCALE) * 100)
const NEXT_BADGES = 3
const NEW_BADGE_DAYS = 7
const DAY_MS = 24 * 60 * 60 * 1000
const TYPES: ChallengeType[] = ['ordering', 'grouping', 'filtering', 'pattern']

const profileStore = useProfileStore()
const settings = useSettingsStore()

const profile = computed(() => profileStore.profile)
const allBadges = computed(() => profile.value?.badges ?? [])

const isSecret = (badge: ProfileBadge) => badge.hidden && !badge.earned

// Newest first, so what was just earned is the first thing on the shelf.
const earned = computed(() =>
  allBadges.value
    .filter((badge) => badge.earned)
    .sort((a, b) => (b.earned_at ?? '').localeCompare(a.earned_at ?? '')),
)
// A student with no badge yet gets one clear first goal instead of a shelf of zeros.
const firstBadge = computed(() =>
  earned.value.length === 0 ? (allBadges.value.find((badge) => badge.code === 'first_solve') ?? null) : null,
)
const next = computed(() =>
  profile.value && earned.value.length > 0 ? nextBadges(allBadges.value, profile.value, NEXT_BADGES) : [],
)
// Everything else, secret ones last (folded until asked for).
const others = computed(() => {
  const shown = new Set([...next.value, ...(firstBadge.value ? [firstBadge.value] : [])].map((badge) => badge.code))
  return allBadges.value
    .filter((badge) => !badge.earned && !shown.has(badge.code))
    .sort((a, b) => Number(isSecret(a)) - Number(isSecret(b)))
})
const showOthers = ref(false)

const loadedAt = Date.now()
const isNew = (badge: ProfileBadge) =>
  badge.earned_at !== null && loadedAt - Date.parse(badge.earned_at) < NEW_BADGE_DAYS * DAY_MS

function progressOf(badge: ProfileBadge) {
  return profile.value ? badgeProgress(badge.code, profile.value) : null
}

function skillProgress(type: ChallengeType) {
  const solved = profile.value?.solved_by_skill[type] ?? 0
  const nextMark = SKILL_MILESTONES.find((mark) => mark > solved) ?? null
  return { solved, next: nextMark }
}

const solvedLabel = (n: number) => (n === 1 ? '1 resolvido' : `${n} resolvidos`)

function skillValueText(type: ChallengeType) {
  const { solved, next: nextMark } = skillProgress(type)
  return nextMark ? `${solvedLabel(solved)}, próxima insígnia aos ${nextMark}` : `${solvedLabel(solved)}, todas as insígnias conquistadas`
}

// Local copy of the switch so a failed request can put it back.
const isPublic = ref(false)
const savingPublic = ref(false)
const publicStatus = ref('')
const settingsError = ref<string | null>(null)

watch(
  () => profile.value?.profile_public,
  (value) => (isPublic.value = value ?? false),
  { immediate: true },
)

async function changePublic() {
  // The switch stays focusable while saving (aria-busy); a second click just waits.
  if (savingPublic.value) {
    isPublic.value = !isPublic.value
    return
  }
  const wanted = isPublic.value
  settingsError.value = null
  publicStatus.value = 'Salvando…'
  savingPublic.value = true
  try {
    await profileStore.setPublic(wanted)
    publicStatus.value = 'Salvo.'
  }
  catch (e) {
    isPublic.value = !wanted
    publicStatus.value = ''
    settingsError.value = `${errorMessage(e)} Seu perfil continua ${wanted ? 'privado' : 'público'}.`
  }
  finally {
    savingPublic.value = false
  }
}

const muted = computed({
  get: () => settings.muted,
  set: (value: boolean) => settings.setMuted(value),
})

onMounted(() => profileStore.load())
</script>

<template>
  <div class="grid gap-12">
    <div v-if="profileStore.error && !profile" role="alert" data-testid="profile-error">
      <p class="font-semibold">Não foi possível carregar seu perfil.</p>
      <p class="mt-1 text-muted">{{ profileStore.error }}</p>
      <button
        type="button"
        class="mt-3 font-semibold underline underline-offset-4 hover:decoration-2"
        data-testid="profile-retry"
        @click="profileStore.load()"
      >Tentar de novo</button>
    </div>

    <p v-else-if="!profile" class="text-muted" aria-live="polite">Carregando seu perfil…</p>

    <template v-else>
      <section aria-labelledby="profile-username">
        <StatPanel :profile="profile" prefix="profile">
          <template #top>
            <h1
              id="profile-username"
              class="mb-4 break-words font-display text-3xl font-extrabold leading-tight sm:text-4xl"
              data-testid="profile-username"
            ><span class="sr-only">Perfil de </span>{{ profile.username }}</h1>
          </template>

          <dl class="mt-4 grid grid-cols-3 gap-x-4 border-t border-line pt-4 sm:grid-cols-[repeat(3,minmax(0,12rem))] sm:gap-x-8">
            <div class="flex flex-col justify-between gap-1" data-testid="profile-first-try">
              <dt class="text-sm leading-snug text-label">
                Acertos de primeira
                <HelpTip class="ml-0.5 align-middle" topic="profile-first-try" label="Acertos de primeira" :text="HELP.firstTry" />
              </dt>
              <dd class="cq-num text-3xl font-extrabold leading-none text-ink">{{ profile.first_try_solves }}</dd>
            </div>
            <div class="flex flex-col justify-between gap-1" data-testid="profile-missions">
              <dt class="text-sm leading-snug text-label">
                Missões concluídas
                <HelpTip class="ml-0.5 align-middle" topic="profile-missions" label="Missões concluídas" :text="HELP.missions" />
              </dt>
              <dd class="cq-num text-3xl font-extrabold leading-none text-ink">{{ profile.missions_completed }}</dd>
            </div>
            <div class="flex flex-col justify-between gap-1" data-testid="profile-badge-count">
              <dt class="text-sm leading-snug text-label">
                Insígnias
                <HelpTip class="ml-0.5 align-middle" topic="profile-badges" label="Insígnias" :text="HELP.badges" />
              </dt>
              <dd class="cq-num leading-none">
                <span class="text-3xl font-extrabold text-ink">{{ earned.length }}</span>
                <span class="text-lg text-muted"> de {{ allBadges.length }}</span>
              </dd>
            </div>
          </dl>
        </StatPanel>
      </section>

      <section aria-labelledby="h-badges">
        <h2 id="h-badges" class="font-display text-2xl font-bold">Insígnias</h2>

        <div class="mt-5 grid gap-10">
          <div v-if="firstBadge" class="flex flex-wrap items-center gap-x-6 gap-y-4" data-testid="badges-first">
            <BadgeMedal :badge="firstBadge" :earned="false" />
            <div class="max-w-md">
              <p class="font-semibold">Nenhuma insígnia ainda.</p>
              <p class="mt-1 text-muted">Resolva seu primeiro desafio para conquistar a insígnia Primeiro desafio.</p>
              <NuxtLink
                to="/inicio"
                class="mt-4 inline-block bg-go px-5 py-2.5 font-display text-lg font-bold text-on-go transition-colors hover:bg-go-hover cq-go-shadow"
                data-testid="profile-start"
              >Resolver um desafio</NuxtLink>
            </div>
          </div>

          <div v-else>
            <h3 class="font-display text-xl font-bold">
              Conquistadas <span class="cq-num font-semibold text-muted">({{ earned.length }})</span>
            </h3>
            <ul class="mt-4 grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4 lg:grid-cols-6" data-testid="badges-earned">
              <li v-for="badge in earned" :key="badge.code" class="flex justify-center">
                <BadgeMedal :badge="badge" earned :earned-at="badge.earned_at" :is-new="isNew(badge)" />
              </li>
            </ul>
          </div>

          <div v-if="next.length > 0">
            <h3 class="font-display text-xl font-bold">Mais perto de conquistar</h3>
            <ul class="mt-4 grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4 lg:grid-cols-6" data-testid="badges-next">
              <li v-for="badge in next" :key="badge.code" class="flex justify-center">
                <BadgeMedal :badge="badge" :earned="false" :progress="progressOf(badge)" />
              </li>
            </ul>
          </div>

          <div v-if="others.length > 0">
            <button
              type="button"
              class="cq-btn-outline"
              :aria-expanded="showOthers ? 'true' : 'false'"
              aria-controls="badges-others"
              data-testid="badges-others-toggle"
              @click="showOthers = !showOthers"
            >{{ showOthers ? 'Esconder as outras insígnias' : `Ver as outras ${others.length} insígnias` }}</button>
            <ul
              v-show="showOthers"
              id="badges-others"
              class="mt-6 grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4 lg:grid-cols-6"
              data-testid="badges-others"
            >
              <li v-for="badge in others" :key="badge.code" class="flex justify-center">
                <BadgeMedal :badge="badge" :earned="false" :secret="isSecret(badge)" />
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section aria-labelledby="h-skills">
        <h2 id="h-skills" class="font-display text-2xl font-bold">Habilidades</h2>
        <p class="mt-1 text-muted">Desafios resolvidos de cada habilidade, com as insígnias de 3, 7 e 15.</p>
        <ul class="mt-4 grid gap-5 sm:grid-cols-2 sm:gap-x-8">
          <li v-for="type in TYPES" :key="type" :data-testid="`skill-progress-${type}`">
            <SkillTag :type="type" />
            <p class="mb-2 mt-1.5 text-sm text-muted">
              <span class="text-ink">{{ solvedLabel(skillProgress(type).solved) }}</span>
              ·
              <template v-if="skillProgress(type).next">próxima insígnia aos {{ skillProgress(type).next }}</template>
              <template v-else>todas as insígnias conquistadas</template>
            </p>
            <ProgressBar
              :value="Math.min(skillProgress(type).solved, SKILL_SCALE)"
              :max="SKILL_SCALE"
              :label="`${SKILLS[type].label}: desafios resolvidos`"
              :value-text="skillValueText(type)"
              :tone="type"
              :milestones="SKILL_MARKS"
            />
            <div class="relative mt-1.5 h-5 text-sm text-muted" aria-hidden="true">
              <span
                v-for="(mark, index) in SKILL_MARKS"
                :key="mark"
                class="cq-num absolute -translate-x-1/2"
                :style="{ left: `${mark}%` }"
              >{{ SKILL_MILESTONES[index] }}</span>
              <span class="cq-num absolute right-0">{{ SKILL_SCALE }}</span>
            </div>
          </li>
        </ul>
      </section>

      <section aria-labelledby="h-settings" class="border-t border-line pt-8">
        <h2 id="h-settings" class="font-display text-2xl font-bold">Preferências</h2>
        <div class="mt-4 grid max-w-2xl gap-5">
          <div>
            <label class="flex items-start gap-3">
              <input
                v-model="isPublic"
                type="checkbox"
                class="mt-1 h-5 w-5 shrink-0 accent-[var(--cq-ink)]"
                :aria-busy="savingPublic ? 'true' : 'false'"
                data-testid="profile-public-toggle"
                @change="changePublic"
              >
              <span>
                <span class="block font-semibold">Mostrar meu perfil para outros estudantes</span>
                <span class="block text-sm text-muted">Mostra só seu nome de usuário, nível, título e insígnias conquistadas. Começa desligado.</span>
              </span>
            </label>
            <p class="ml-8 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span role="status" class="font-semibold" data-testid="profile-public-status">{{ publicStatus }}</span>
              <NuxtLink
                v-if="profile.profile_public"
                :to="`/jogadores/${encodeURIComponent(profile.username)}`"
                class="font-semibold underline underline-offset-4 hover:decoration-2"
                data-testid="profile-public-link"
              >Ver como os outros veem seu perfil</NuxtLink>
            </p>
            <p
              v-if="settingsError"
              role="alert"
              class="ml-8 mt-2 cq-alert px-3 py-2 text-error-ink"
              data-testid="profile-settings-error"
            >{{ settingsError }}</p>
          </div>

          <label class="flex items-start gap-3">
            <input
              v-model="muted"
              type="checkbox"
              class="mt-1 h-5 w-5 shrink-0 accent-[var(--cq-ink)]"
              data-testid="mute-toggle"
            >
            <span>
              <span class="block font-semibold">Sem som</span>
              <span class="block text-sm text-muted">Desliga o som de acerto, de novo nível e de insígnia nova.</span>
            </span>
          </label>
        </div>
      </section>
    </template>
  </div>
</template>
