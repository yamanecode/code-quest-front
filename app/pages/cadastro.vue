<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useProfileStore } from '~/stores/profile'
import { errorMessage } from '~/utils/format'

useHead({ title: 'Criar conta · CodeQuest' })

const auth = useAuthStore()
const profile = useProfileStore()
const username = ref('')
const password = ref('')
const error = ref<string | null>(null)
const sending = ref(false)
// The recovery code is kept here only while its modal is open (spec §3).
const recoveryCode = ref('')
const confirming = ref(false)
const confirmError = ref<string | undefined>(undefined)

// Only students sign up here; professor accounts are created by the backend CLI.
async function submit() {
  error.value = null
  sending.value = true
  try {
    recoveryCode.value = await auth.register({ username: username.value, password: password.value })
  }
  catch (e) {
    error.value = errorMessage(e)
  }
  finally {
    sending.value = false
  }
}

// The student is already logged in; the home opens only after the code is confirmed.
async function confirmSaved() {
  confirming.value = true
  confirmError.value = undefined
  try {
    await profile.confirmRecoveryCode()
    recoveryCode.value = ''
    await navigateTo('/inicio')
  }
  catch (e) {
    confirmError.value = errorMessage(e)
  }
  finally {
    confirming.value = false
  }
}
</script>

<template>
  <div>
    <h2 class="font-display text-3xl font-bold">Criar conta</h2>
    <p class="mt-1 text-muted">Só pedimos um nome de usuário e uma senha.</p>

    <p class="mt-5 border-2 border-line-strong bg-raised px-3 py-2 font-semibold" data-testid="signup-real-name-warning">
      Não use seu nome real: escolha um apelido.
    </p>

    <form class="mt-5 grid gap-5" novalidate @submit.prevent="submit">
      <TextField
        v-model="username"
        label="Nome de usuário"
        testid="signup-username"
        autocomplete="username"
        hint="3 a 30 caracteres: letras minúsculas, números, ponto (.) e sublinhado (_)."
      />
      <TextField
        v-model="password"
        label="Senha"
        type="password"
        testid="signup-password"
        autocomplete="new-password"
        hint="8 a 72 caracteres."
      />

      <p
        v-if="error"
        role="alert"
        class="cq-alert px-3 py-2 text-error-ink"
        data-testid="signup-error"
      >{{ error }}</p>

      <button
        type="submit"
        :disabled="sending"
        class="bg-go px-5 py-3 font-display text-lg font-bold text-on-go transition-colors hover:bg-go-hover disabled:cursor-wait disabled:opacity-60 cq-go-shadow"
        data-testid="signup-submit"
      >{{ sending ? 'Criando conta…' : 'Criar conta' }}</button>
    </form>

    <RecoveryCodeModal v-if="recoveryCode" :code="recoveryCode" :busy="confirming" :error="confirmError" @confirmed="confirmSaved" />

    <p class="mt-6 text-muted">
      Já tem conta?
      <NuxtLink to="/entrar" class="font-semibold text-ink underline underline-offset-4 hover:decoration-2" data-testid="signup-login-link">Entrar</NuxtLink>
    </p>
  </div>
</template>
