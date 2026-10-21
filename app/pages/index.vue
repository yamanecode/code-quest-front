<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useClassroomsStore } from '~/stores/classrooms'
import { challengePath, usePlayStore } from '~/stores/play'
import { useProfileStore } from '~/stores/profile'
import { badgeProgress, nextBadges } from '~/utils/badges'

// Student home (spec §9.1). Level, title, XP and streak are in the layout header; the latest
// badges sit next to the daily challenge (author decision, 2026-10-21).
const RECENT_BADGES = 3
const NEXT_BADGES = 2
definePageMeta({ layout: 'app' })
useHead({ title: 'Início · CodeQuest' })

const play = usePlayStore()
const classrooms = useClassroomsStore()
const profileStore = useProfileStore()

const missions = computed(() => play.missions)
const daily = computed(() => play.daily)

const recentBadges = computed(() =>
  (profileStore.profile?.badges ?? [])
    .filter((badge) => badge.earned)
    .sort((a, b) => (b.earned_at ?? '').localeCompare(a.earned_at ?? ''))
    .slice(0, RECENT_BADGES),
)
const closeBadges = computed(() =>
  profileStore.profile ? nextBadges(profileStore.profile.badges, profileStore.profile, NEXT_BADGES) : [],
)

onMounted(() => {
  play.loadHome()
  classrooms.load()
})
</script>

<template>
  <div class="grid gap-10">
    <p class="max-w-2xl text-lg leading-relaxed text-muted" data-testid="home-purpose">
      Pense como quem resolve problemas: treine as 4 habilidades do pensamento computacional
    </p>

    <WelcomeCard />

    <p v-if="play.homeLoading && !missions" class="text-muted" aria-live="polite">Carregando suas missões…</p>

    <div v-else-if="play.homeError" role="alert" data-testid="home-error">
      <p>{{ play.homeError }}</p>
      <button
        type="button"
        class="mt-2 font-semibold underline underline-offset-4 hover:decoration-2"
        data-testid="home-retry"
        @click="play.loadHome()"
      >Tentar de novo</button>
    </div>

    <template v-else-if="missions">
      <div class="grid items-start gap-10 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <section aria-labelledby="h-daily" class="cq-postit max-w-md px-5 pb-5 pt-6" data-testid="daily-card">
          <h2 id="h-daily" class="flex items-center gap-2 font-display text-2xl font-extrabold">
            Desafio diário
            <HelpTip
              topic="daily"
              label="Desafio diário"
              text="Todo dia você recebe um desafio que ainda não resolveu. Ele não muda durante o dia e não dá XP extra."
            />
          </h2>
          <NuxtLink
            v-if="daily?.challenge"
            :to="challengePath(daily.challenge.id)"
            class="mt-3 block"
            data-testid="daily-link"
          >
            <SkillTag :type="daily.challenge.type" :help="false" />
            <span class="mt-2 block font-display text-xl font-bold">{{ daily.challenge.title }}</span>
            <span v-if="daily.challenge.solved" class="mt-3 inline-block font-semibold">✓ Resolvido hoje</span>
            <span v-else class="mt-3 inline-block border-b-2 border-current font-bold">Resolver →</span>
          </NuxtLink>
          <p v-else class="mt-3" data-testid="daily-all-solved">Você resolveu todos os desafios disponíveis!</p>
        </section>

        <section v-if="profileStore.profile" aria-labelledby="h-home-badges" data-testid="home-badges">
          <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 id="h-home-badges" class="font-display text-2xl font-bold">Suas insígnias</h2>
            <NuxtLink
              to="/perfil"
              class="text-sm font-semibold text-ink underline underline-offset-4 hover:decoration-2"
              data-testid="home-badges-all"
            >Ver todas</NuxtLink>
          </div>
          <ul class="mt-4 grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-5">
            <li v-for="badge in recentBadges" :key="badge.code" class="flex justify-center">
              <BadgeMedal :badge="badge" earned :earned-at="badge.earned_at" />
            </li>
            <li v-for="badge in closeBadges" :key="badge.code" class="flex justify-center">
              <BadgeMedal :badge="badge" :earned="false" :progress="badgeProgress(badge.code, profileStore.profile)" :show-condition="false" />
            </li>
          </ul>
        </section>
      </div>

      <section aria-labelledby="h-base" data-testid="home-base">
        <h2 id="h-base" class="font-display text-2xl font-bold">Trilhas para todos</h2>
        <p class="mt-1 text-muted">Uma trilha para cada habilidade, liberada para todos os estudantes. Resolva na ordem que quiser.</p>
        <ul class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <li v-for="mission in missions.base" :key="mission.id">
            <MissionCard :mission="mission" :skills="play.missionSkills[mission.id]" />
          </li>
        </ul>
      </section>

      <section
        v-for="classroom in missions.classrooms"
        :key="classroom.id"
        :aria-labelledby="`h-classroom-${classroom.id}`"
        :data-testid="`home-classroom-${classroom.id}`"
      >
        <h2 :id="`h-classroom-${classroom.id}`" class="font-display text-2xl font-bold">{{ classroom.name }}</h2>
        <ClassGoalBar
          class="mt-3 max-w-xl"
          :goal="classrooms.goalOf(classroom.id)"
          :name="classroom.name"
          :testid="`home-goal-${classroom.id}`"
        />
        <p
          v-if="classroom.missions.length === 0"
          class="mt-4 text-muted"
          :data-testid="`home-classroom-empty-${classroom.id}`"
        >Seu professor ainda não publicou missões</p>
        <ul v-else class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <li v-for="mission in classroom.missions" :key="mission.id">
            <MissionCard :mission="mission" :skills="play.missionSkills[mission.id]" />
          </li>
        </ul>
      </section>

      <p v-if="missions.classrooms.length === 0" class="text-muted" data-testid="home-no-classrooms">
        Tem um código de turma?
        <NuxtLink to="/turmas" class="font-semibold text-ink underline underline-offset-4 hover:decoration-2" data-testid="home-join-link">Entre na turma</NuxtLink>
        para ver as missões da sua turma.
      </p>
    </template>
  </div>
</template>
