<template>
  <p>{{ count }}</p>
</template>

<script setup lang="ts">
// Lint fixture for T-FE-ARCH-01: breaks the layer rules on purpose.
import { ref } from 'vue'
import { login } from '~/services/auth'

const count = ref(0)

async function load() {
  await login({ username: 'ana', password: 'segredo123' })
  count.value = await $fetch<number>('/api/count')
}

load()
</script>
