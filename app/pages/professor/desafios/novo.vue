<script setup lang="ts">
definePageMeta({ layout: 'app' })
useHead({ title: 'Novo desafio · CodeQuest' })
</script>

<template>
  <div>
    <NuxtLink to="/professor/desafios" class="inline-flex min-h-11 items-center font-semibold underline underline-offset-4" data-testid="back-challenges">← Meus desafios</NuxtLink>
    <div class="mt-4">
      <ChallengeScreen :challenge-id="null" />
    </div>
  </div>
</template>
