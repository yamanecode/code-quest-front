<script setup lang="ts">
// A closed turma takes no new students. Told by a dashed border and a lock symbol, not colour alone.
</script>

<template>
  <span class="inline-flex items-center gap-1.5 whitespace-nowrap border-2 border-dashed border-control bg-raised px-2 py-0.5 text-sm font-bold leading-5 text-ink" data-testid="classroom-closed-badge">
    <svg class="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true">
      <path d="M4 7V5a4 4 0 018 0v2M3 7h10v7H3z" />
    </svg>
    Encerrada
  </span>
</template>
