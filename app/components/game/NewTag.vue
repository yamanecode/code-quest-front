<script setup lang="ts">
// The "Novo" label (spec §5): plain text inside the page for recent turma content the student
// has not answered yet. No dot, no counter, no animation.
const props = withDefaults(defineProps<{ text?: string; testid?: string }>(), { text: 'Novo', testid: 'new-tag' })
</script>

<template>
  <span
    class="inline-block border-2 border-ink px-1.5 text-xs font-bold uppercase tracking-wide text-ink"
    :data-testid="props.testid"
  >{{ props.text }}</span>
</template>
