<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useProfileStore } from '~/stores/profile'

// Logged-in header: navigation for the role and, for students, level, title, XP and streak.
const XP_PER_LEVEL = 50

const auth = useAuthStore()
const profileStore = useProfileStore()

const isStudent = computed(() => auth.role === 'student')
const profile = computed(() => profileStore.profile)
const xpInLevel = computed(() => (profile.value ? XP_PER_LEVEL - profile.value.xp_to_next_level : 0))

interface NavLink {
  to: string
  label: string
  testid: string
  exact?: boolean
}

const STUDENT_LINKS: NavLink[] = [
  { to: '/', label: 'Início', testid: 'nav-inicio', exact: true },
  { to: '/turmas', label: 'Turmas', testid: 'nav-turmas' },
  { to: '/ranking', label: 'Ranking', testid: 'nav-ranking' },
  { to: '/perfil', label: 'Perfil', testid: 'nav-perfil' },
  { to: '/ajuda', label: 'Ajuda', testid: 'nav-ajuda' },
]

const PROFESSOR_LINKS: NavLink[] = [
  { to: '/professor', label: 'Turmas', testid: 'nav-prof-turmas', exact: true },
  { to: '/professor/desafios', label: 'Desafios', testid: 'nav-prof-desafios' },
  { to: '/ajuda', label: 'Ajuda', testid: 'nav-ajuda' },
]

// A short glow on the XP bar after a correct answer that earned XP (spec §9.2).
const pulsing = ref(false)
let pulseTimer: ReturnType<typeof setTimeout> | null = null
watch(
  () => profileStore.xpPulse,
  () => {
    pulsing.value = false
    if (pulseTimer) clearTimeout(pulseTimer)
    requestAnimationFrame(() => {
      pulsing.value = true
      pulseTimer = setTimeout(() => (pulsing.value = false), 1200)
    })
  },
)
onBeforeUnmount(() => {
  if (pulseTimer) clearTimeout(pulseTimer)
})

const links = computed(() => (isStudent.value ? STUDENT_LINKS : PROFESSOR_LINKS))

onMounted(() => {
  if (isStudent.value && !profileStore.profile) profileStore.load()
})

function logout() {
  auth.logout()
  profileStore.clear()
  navigateTo('/entrar')
}
</script>

<template>
  <header>
    <div class="border-b border-line">
      <div class="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 px-4 sm:px-6">
        <NuxtLink
          :to="auth.home"
          class="flex h-14 items-center font-display text-2xl font-extrabold tracking-wide sm:h-16"
          aria-label="CodeQuest, página inicial"
          data-testid="nav-home"
        >
          <span>Code</span><span class="text-go">Quest</span>
        </NuxtLink>

        <nav aria-label="Principal" class="order-last -mx-4 w-[calc(100%+2rem)] overflow-x-auto px-4 sm:order-none sm:mx-0 sm:w-auto sm:px-0">
          <ul class="flex gap-1">
            <li v-for="link in links" :key="link.to">
              <NuxtLink
                :to="link.to"
                :data-testid="link.testid"
                class="block whitespace-nowrap px-2.5 py-3 font-semibold text-muted transition-colors hover:text-ink sm:px-3 sm:py-5"
                :active-class="link.exact ? '' : 'nav-current'"
                :exact-active-class="'nav-current'"
              >{{ link.label }}</NuxtLink>
            </li>
          </ul>
        </nav>

        <button
          type="button"
          class="ml-auto px-3 py-2 font-semibold text-muted transition-colors hover:text-ink"
          data-testid="nav-sair"
          @click="logout"
        >Sair</button>
      </div>
    </div>

    <section
      v-if="isStudent"
      aria-label="Seu progresso"
      class="mx-auto max-w-6xl px-4 pt-6 sm:px-6"
      data-testid="header-stats"
    >
      <div class="cq-cut grid grid-cols-[auto_1fr] items-end gap-x-5 gap-y-4 bg-panel px-5 py-4 sm:grid-cols-[auto_minmax(12rem,auto)_1fr_auto] sm:gap-x-8 sm:px-7 sm:py-5">
        <template v-if="profile">
          <p class="cq-num text-6xl font-extrabold leading-[0.8] sm:text-8xl sm:leading-[0.8]" data-testid="header-level">
            <span class="sr-only">Nível </span>{{ profile.level }}
          </p>

          <div data-testid="header-title">
            <p class="flex items-center gap-2 font-display text-2xl font-bold leading-tight">
              {{ profile.title }}
              <HelpTip
                topic="title"
                label="Título"
                text="Seu título muda com o nível: Aprendiz, Explorador(a), Estrategista, Arquiteto(a) de soluções e Mestre do pensamento."
              />
            </p>
            <p class="text-sm text-muted" aria-hidden="true">Nível {{ profile.level }}</p>
          </div>

          <div class="col-span-2 sm:col-span-1" :class="{ 'cq-xp-pulse': pulsing }" data-testid="header-xp">
            <div class="mb-2 flex items-center justify-between gap-3 text-sm">
              <span class="flex items-center gap-2 font-semibold">
                XP
                <HelpTip
                  topic="xp"
                  label="XP"
                  text="Você ganha XP só na primeira vez que acerta cada desafio: 10 XP de primeira, 5 XP depois de 1 ou 2 erros e 2 XP depois de 3 erros ou mais."
                />
              </span>
              <span class="cq-num text-lg text-muted">
                <span class="text-ink">{{ profile.xp }} XP</span> · faltam {{ profile.xp_to_next_level }} para o nível {{ profile.level + 1 }}
              </span>
            </div>
            <ProgressBar :value="xpInLevel" :max="XP_PER_LEVEL" label="XP do nível atual" />
          </div>

          <div class="col-span-2 flex items-center gap-3 sm:col-span-1 sm:justify-end" data-testid="header-streak">
            <span class="cq-num text-4xl font-extrabold leading-none">{{ profile.streak }}</span>
            <span class="text-sm leading-tight text-muted">{{ profile.streak === 1 ? 'dia seguido' : 'dias seguidos' }}</span>
            <HelpTip
              topic="streak"
              label="Sequência de dias"
              text="Conta os dias seguidos em que você resolveu pelo menos um desafio; ela não dá XP."
            />
          </div>
        </template>

        <p v-else-if="profileStore.error" class="col-span-full flex flex-wrap items-center gap-3 text-sm" role="alert">
          <span>Não foi possível carregar seu progresso.</span>
          <button
            type="button"
            class="font-semibold underline underline-offset-4 hover:decoration-2"
            data-testid="header-retry"
            @click="profileStore.load()"
          >Tentar de novo</button>
        </p>

        <p v-else class="col-span-full text-sm text-muted" aria-live="polite">Carregando seu progresso…</p>
      </div>
    </section>
  </header>
</template>

<style scoped>
.nav-current {
  color: var(--cq-ink);
  box-shadow: inset 0 -3px 0 var(--cq-ink);
}
</style>
