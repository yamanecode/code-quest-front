<script setup lang="ts">
import { computed } from 'vue'

definePageMeta({ layout: 'app' })
useHead({ title: 'Novo desafio · CodeQuest' })

// Set when the professor came from a mission page (?missao=<id>).
const route = useRoute()
const missionId = computed(() => Number(route.query.missao) || null)
</script>

<template>
  <div>
    <NuxtLink v-if="missionId" :to="`/professor/missoes/${missionId}`" class="inline-flex min-h-11 items-center font-semibold underline underline-offset-4" data-testid="back-mission">← Voltar para a missão</NuxtLink>
    <NuxtLink v-else to="/professor/desafios" class="inline-flex min-h-11 items-center font-semibold underline underline-offset-4" data-testid="back-challenges">← Meus desafios</NuxtLink>
    <div class="mt-4">
      <ChallengeScreen :challenge-id="null" :mission-id="missionId" />
    </div>
  </div>
</template>
