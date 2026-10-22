<script setup lang="ts">
import { computed } from 'vue'

definePageMeta({ layout: 'app' })
useHead({ title: 'Editar desafio · CodeQuest' })

const route = useRoute()
const challengeId = computed(() => Number(route.params.id))
</script>

<template>
  <div>
    <NuxtLink to="/professor/desafios" class="inline-flex min-h-11 items-center font-semibold underline underline-offset-4" data-testid="back-challenges">← Meus desafios</NuxtLink>
    <div class="mt-4">
      <ChallengeScreen :challenge-id="challengeId" />
    </div>
  </div>
</template>
