<script setup lang="ts">
import type { ChallengeType } from '~/types/challenge'

// Public shell for the login and sign-up pages. On phones the form comes right
// after the name; on wide screens the skill blocks sit under the name.
const SKILL_ORDER: ChallengeType[] = ['ordering', 'grouping', 'filtering', 'pattern']
</script>

<template>
  <div class="mx-auto grid min-h-screen max-w-6xl content-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_28rem] lg:gap-x-16 lg:gap-y-8">
    <section aria-labelledby="brand-title" class="max-w-xl lg:col-start-1 lg:row-start-1 lg:self-end">
      <h1 id="brand-title" class="font-display text-5xl font-extrabold tracking-wide sm:text-6xl">
        <span>Code</span><span class="text-go">Quest</span>
      </h1>
      <p class="mt-4 text-lg leading-relaxed text-muted">
        Pense como quem resolve problemas: treine as 4 habilidades do pensamento computacional com desafios de lógica, sem precisar programar.
      </p>
    </section>

    <main class="cq-cut bg-panel p-6 sm:p-8 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center">
      <slot />
    </main>

    <ul class="grid max-w-xl grid-cols-2 gap-2 lg:col-start-1 lg:row-start-2 lg:self-start" aria-label="As 4 habilidades">
      <li v-for="type in SKILL_ORDER" :key="type">
        <SkillBlock :type="type" class="h-full" />
      </li>
    </ul>
  </div>
</template>
