<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useAuthStore } from '~/stores/auth'

// Sticky bar of the public pages. On the landing page it links to the sections; on the
// limitations page it links back. Under 1024 px the links sit behind a menu button, which
// closes when a link is chosen and on Esc.
const auth = useAuthStore()
const route = useRoute()

const onLanding = computed(() => route.path === '/')
const open = ref(false)

const SECTIONS = [
  { hash: '#projeto', label: 'O projeto', testid: 'landing-link-projeto' },
  { hash: '#habilidades', label: 'Habilidades', testid: 'landing-link-habilidades' },
  { hash: '#como-funciona', label: 'Como funciona', testid: 'landing-link-como-funciona' },
  { hash: '#octalysis', label: 'Octalysis', testid: 'landing-link-octalysis' },
  { hash: '#professores', label: 'Professores', testid: 'landing-link-professores' },
]

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') open.value = false
}

onMounted(() => {
  auth.restore()
  window.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

const linkClass = 'inline-flex min-h-11 items-center font-bold text-ink hover:underline underline-offset-4'
</script>

<template>
  <header class="sticky top-0 z-20 border-b-2 border-line-strong bg-bg" data-testid="landing-header">
    <div class="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-1 px-4 py-2 sm:px-6">
      <NuxtLink
        to="/"
        class="mr-auto font-display text-2xl font-extrabold leading-none text-ink"
        aria-label="CodeQuest, início"
        data-testid="landing-brand"
      ><span>Code</span><span class="cq-mark">Quest</span></NuxtLink>

      <nav
        id="landing-nav"
        class="order-last basis-full flex-col pb-2 lg:order-none lg:flex lg:basis-auto lg:flex-row lg:gap-x-5 lg:pb-0"
        :class="open ? 'flex' : 'hidden'"
        aria-label="Seções da página"
        data-testid="landing-nav"
        @click="(event: MouseEvent) => { if ((event.target as HTMLElement).closest('a')) open = false }"
      >
        <template v-if="onLanding">
          <NuxtLink
            v-for="section in SECTIONS"
            :key="section.hash"
            :to="{ path: '/', hash: section.hash }"
            :class="linkClass"
            :data-testid="section.testid"
          >{{ section.label }}</NuxtLink>
        </template>
        <NuxtLink v-else :to="auth.isLoggedIn ? auth.home : '/'" :class="linkClass" data-testid="landing-link-inicio">Início</NuxtLink>
        <NuxtLink to="/limitacoes" :class="linkClass" data-testid="landing-link-limitacoes">Limitações</NuxtLink>
        <NuxtLink v-if="!auth.isLoggedIn" to="/entrar" :class="[linkClass, 'sm:hidden']" data-testid="landing-link-entrar-menu">Entrar</NuxtLink>
      </nav>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="grid h-11 w-11 place-items-center border-2 border-line-strong bg-panel text-ink transition-colors hover:bg-raised lg:hidden"
          :aria-expanded="open"
          aria-controls="landing-nav"
          :aria-label="open ? 'Fechar o menu de seções' : 'Abrir o menu de seções'"
          data-testid="landing-menu-button"
          @click="open = !open"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <ThemeToggle compact />
        <template v-if="auth.isLoggedIn">
          <NuxtLink
            :to="auth.home"
            class="cq-btn-outline inline-flex items-center"
            data-testid="landing-go-home"
          >Ir para o início</NuxtLink>
        </template>
        <template v-else>
          <NuxtLink to="/entrar" class="cq-btn-outline hidden items-center sm:inline-flex" data-testid="landing-login">Entrar</NuxtLink>
          <NuxtLink
            to="/cadastro"
            class="inline-flex min-h-11 items-center bg-go px-4 py-2 font-bold text-on-go transition-colors hover:bg-go-hover cq-go-shadow"
            data-testid="landing-signup"
          >Criar conta</NuxtLink>
        </template>
      </div>
    </div>
  </header>
</template>
