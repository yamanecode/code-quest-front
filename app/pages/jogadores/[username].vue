<script setup lang="ts">
import { computed, watch } from 'vue'
import { usePlayersStore } from '~/stores/players'

// Public profile of another student (spec §5): username, level, title and earned badges only.
definePageMeta({ layout: 'app', compactStats: true })

const route = useRoute()
const players = usePlayersStore()

const username = computed(() => String(route.params.username))
const player = computed(() => players.player)

useHead({ title: () => `${username.value} · CodeQuest` })

watch(username, (name) => players.load(name), { immediate: true })
</script>

<template>
  <div class="max-w-3xl">
    <NuxtLink
      to="/ranking"
      class="inline-flex min-h-11 items-center text-sm font-semibold text-muted underline-offset-4 hover:text-ink hover:underline"
      data-testid="player-back"
    >← Voltar ao ranking</NuxtLink>

    <p v-if="players.loading" class="mt-6 text-muted" aria-live="polite">Carregando perfil…</p>

    <div v-else-if="players.error" class="cq-alert mt-6 px-4 py-3" role="alert" data-testid="player-error">
      <p>{{ players.error }}</p>
    </div>

    <article v-else-if="player" class="mt-6" aria-labelledby="player-username">
      <div class="cq-sheet flex flex-wrap items-end gap-x-8 gap-y-3 bg-panel p-5 sm:p-7">
        <p class="cq-num text-6xl font-extrabold leading-[0.8]" data-testid="player-level">
          <span class="sr-only">Nível </span>{{ player.level }}
        </p>
        <div>
          <h1 id="player-username" class="font-display text-4xl font-extrabold" data-testid="player-username">{{ player.username }}</h1>
          <p class="font-display text-xl font-bold text-muted" data-testid="player-title">
            {{ player.title }} <span aria-hidden="true">·</span> <span class="sr-only">,</span> Nível {{ player.level }}
          </p>
        </div>
      </div>

      <section class="mt-8" aria-labelledby="h-player-badges">
        <h2 id="h-player-badges" class="font-display text-2xl font-bold">Insígnias conquistadas</h2>
        <p v-if="player.badges.length === 0" class="mt-3 text-muted" data-testid="player-no-badges">Nenhuma insígnia ainda.</p>
        <ul v-else class="mt-5 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 lg:grid-cols-6" data-testid="player-badges">
          <li v-for="badge in player.badges" :key="badge.code" class="flex justify-center">
            <BadgeMedal :badge="badge" earned />
          </li>
        </ul>
      </section>
    </article>
  </div>
</template>
