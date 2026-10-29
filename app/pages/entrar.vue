<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCountdown } from '~/composables/useCountdown'
import { useAuthStore } from '~/stores/auth'
import { errorMessage, errorRetryAfter, errorStatus } from '~/utils/format'

useHead({ title: 'Entrar · CodeQuest' })

const auth = useAuthStore()
const username = ref('')
const password = ref('')
const error = ref<string | null>(null)
const sending = ref(false)
const { seconds: waitLeft, start: startWait } = useCountdown()
const waiting = computed(() => waitLeft.value > 0)

async function submit() {
  if (sending.value || waiting.value) return
  error.value = null
  sending.value = true
  try {
    await auth.login({ username: username.value, password: password.value })
    await navigateTo(auth.home)
  }
  catch (e) {
    error.value = errorMessage(e)
    // Too many failed logins: the API says how long to wait (429 retry_after).
    if (errorStatus(e) === 429) startWait(errorRetryAfter(e))
  }
  finally {
    sending.value = false
  }
}
</script>

<template>
  <div>
    <h2 class="font-display text-3xl font-bold">Entrar</h2>
    <p class="mt-1 text-muted">Use seu nome de usuário e sua senha.</p>

    <form class="mt-6 grid gap-5" novalidate @submit.prevent="submit">
      <TextField v-model="username" label="Nome de usuário" testid="login-username" autocomplete="username" />
      <TextField v-model="password" label="Senha" type="password" testid="login-password" autocomplete="current-password" />
      <p class="-mt-2">
        <NuxtLink to="/recuperar-senha" class="font-semibold text-ink underline underline-offset-4 hover:decoration-2" data-testid="login-forgot-link">Esqueci minha senha</NuxtLink>
      </p>

      <p
        v-if="error"
        role="alert"
        class="cq-alert px-3 py-2 text-error-ink"
        data-testid="login-error"
      >{{ error }}</p>
      <p v-if="waiting" role="status" class="text-sm text-muted" data-testid="login-wait">Tente de novo em {{ waitLeft }} s.</p>

      <button
        type="submit"
        :disabled="sending || waiting"
        class="bg-go px-5 py-3 font-display text-lg font-bold text-on-go transition-colors hover:bg-go-hover disabled:cursor-wait disabled:opacity-60 cq-go-shadow"
        data-testid="login-submit"
      >{{ sending ? 'Entrando…' : 'Entrar' }}</button>
    </form>

    <p class="mt-6 text-muted">
      Ainda não tem conta?
      <NuxtLink to="/cadastro" class="font-semibold text-ink underline underline-offset-4 hover:decoration-2" data-testid="login-signup-link">Criar conta</NuxtLink>
    </p>
  </div>
</template>
