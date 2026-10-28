<script setup lang="ts">
// Published or draft, told apart by fill, border style and a small symbol, never by colour alone.
const props = defineProps<{ status: 'draft' | 'published', feminine?: boolean }>()
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 whitespace-nowrap border-2 px-2 py-0.5 text-sm font-bold leading-5"
    :class="props.status === 'published'
      ? 'border-success bg-success text-on-skill'
      : 'border-dashed border-control bg-raised text-ink'"
  >
    <svg v-if="props.status === 'published'" class="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square" aria-hidden="true">
      <path d="M3 8.5l3.5 3.5L13 4.5" />
    </svg>
    <svg v-else class="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true">
      <path d="M2.5 13.5l.8-3.2 7.5-7.5 2.4 2.4-7.5 7.5z" />
    </svg>
    {{ props.status === 'published' ? (props.feminine ? 'Publicada' : 'Publicado') : 'Rascunho' }}
  </span>
</template>
