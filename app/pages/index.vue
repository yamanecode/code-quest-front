<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useClassroomsStore } from '~/stores/classrooms'
import { challengePath, usePlayStore } from '~/stores/play'

// Student home (spec §9.1). Level, title, XP and streak are in the layout header.
definePageMeta({ layout: 'app' })
useHead({ title: 'Início · CodeQuest' })

const play = usePlayStore()
const classrooms = useClassroomsStore()

const missions = computed(() => play.missions)
const daily = computed(() => play.daily)

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
      <section aria-labelledby="h-daily" data-testid="daily-card">
        <h2 id="h-daily" class="flex items-center gap-2 font-display text-2xl font-bold">
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
          class="cq-cut mt-3 flex flex-wrap items-center justify-between gap-4 bg-panel p-5 transition-colors hover:bg-raised"
          data-testid="daily-link"
        >
          <span>
            <SkillTag :type="daily.challenge.type" :help="false" />
            <span class="mt-2 block font-display text-xl font-bold">{{ daily.challenge.title }}</span>
          </span>
          <span v-if="daily.challenge.solved" class="font-semibold text-go">✓ Resolvido hoje</span>
          <span v-else class="font-semibold">Resolver →</span>
        </NuxtLink>
        <p v-else class="mt-3 text-muted" data-testid="daily-all-solved">Você resolveu todos os desafios disponíveis!</p>
      </section>

      <section aria-labelledby="h-base" data-testid="home-base">
        <h2 id="h-base" class="font-display text-2xl font-bold">Jogo base</h2>
        <p class="mt-1 text-muted">Trilhas para todos os estudantes, uma para cada habilidade. Resolva na ordem que quiser.</p>
        <ul class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <li v-for="mission in missions.base" :key="mission.id">
            <MissionCard :mission="mission" />
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
            <MissionCard :mission="mission" />
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
