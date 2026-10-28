<script setup lang="ts">
import { BUTTON_BASE, BUTTON_VARIANTS, type ButtonVariant } from '~/utils/styles'

// One button for the main actions: same height, padding and font in every variant, so a row
// of them stays even. With `to` it renders a link that looks the same.
const props = withDefaults(defineProps<{ variant?: ButtonVariant, to?: string, type?: 'button' | 'submit' }>(), {
  variant: 'secondary',
  to: undefined,
  type: 'button',
})
</script>

<template>
  <NuxtLink v-if="props.to" :to="props.to" :class="[BUTTON_BASE, BUTTON_VARIANTS[props.variant]]"><slot /></NuxtLink>
  <button v-else :type="props.type" :class="[BUTTON_BASE, BUTTON_VARIANTS[props.variant]]"><slot /></button>
</template>
