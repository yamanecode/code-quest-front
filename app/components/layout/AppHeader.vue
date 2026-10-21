<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useProfileStore } from '~/stores/profile'

// Logged-in header: navigation for the role and, for students, level, title, XP and streak.
// A page that shows its own stat panel sets `hideStats` in its page meta.
const auth = useAuthStore()
const profileStore = useProfileStore()
const route = useRoute()

const isStudent = computed(() => auth.role === 'student')
const showStats = computed(() => isStudent.value && route.meta.hideStats !== true)
const profile = computed(() => profileStore.profile)

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
    <div class="border-b-2 border-top-line bg-top">
      <div class="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 px-4 sm:px-6">
        <NuxtLink
          :to="auth.home"
          class="flex h-14 items-center font-display text-2xl font-extrabold text-ink sm:h-16"
          aria-label="CodeQuest, página inicial"
          data-testid="nav-home"
        >
          <span>Code</span><span class="cq-mark">Quest</span>
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

        <div class="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            class="px-3 py-2 font-semibold text-muted transition-colors hover:text-ink"
            data-testid="nav-sair"
            @click="logout"
          >Sair</button>
        </div>
      </div>
    </div>

    <section
      v-if="showStats"
      aria-label="Seu progresso"
      class="mx-auto max-w-6xl px-4 pt-6 sm:px-6"
      data-testid="header-stats"
    >
      <StatPanel v-if="profile" :profile="profile" prefix="header" :pulsing="pulsing" />

      <div v-else class="cq-sheet px-5 py-4 sm:px-7 sm:py-5">
        <p v-if="profileStore.error" class="flex flex-wrap items-center gap-3 text-sm" role="alert">
          <span>Não foi possível carregar seu progresso.</span>
          <button
            type="button"
            class="font-semibold underline underline-offset-4 hover:decoration-2"
            data-testid="header-retry"
            @click="profileStore.load()"
          >Tentar de novo</button>
        </p>

        <p v-else class="text-sm text-muted" aria-live="polite">Carregando seu progresso…</p>
      </div>
    </section>
  </header>
</template>

<style scoped>
/* The current page is marked like a word underlined with a highlighter. */
.nav-current {
  color: var(--cq-ink);
  background-image: linear-gradient(var(--cq-mark-nav), var(--cq-mark-nav));
  background-repeat: no-repeat;
  background-position: center 62%;
  background-size: calc(100% - 1rem) 0.6em;
}
</style>
