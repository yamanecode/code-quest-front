<script setup lang="ts">
import { computed } from 'vue'
import { useSettingsStore } from '~/stores/settings'

// Light/dark switch (spec §9.2). The button names the mode it switches to.
const settings = useSettingsStore()

const toDark = computed(() => settings.theme === 'light')
const label = computed(() => (toDark.value ? 'Mudar para o modo escuro' : 'Mudar para o modo claro'))
</script>

<template>
  <button
    type="button"
    class="inline-flex items-center gap-1.5 border-2 border-line-strong bg-panel min-h-11 px-3 py-1 text-sm font-bold text-ink transition-colors hover:bg-raised"
    :aria-label="label"
    data-testid="theme-toggle"
    @click="settings.toggleTheme()"
  >
    <svg
      v-if="toDark"
      class="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    ><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
    <svg
      v-else
      class="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      aria-hidden="true"
    ><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
    <span>{{ toDark ? 'Escuro' : 'Claro' }}</span>
  </button>
</template>
