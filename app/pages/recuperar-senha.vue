<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCountdown } from '~/composables/useCountdown'
import { useAuthStore } from '~/stores/auth'
import { useProfileStore } from '~/stores/profile'
import { errorDetail, errorLines, errorMessage, errorRetryAfter, errorStatus } from '~/utils/format'

useHead({ title: 'Esqueci minha senha · CodeQuest' })

// One message for every mismatch: never say which part was wrong.
const INVALID_RECOVERY = 'Usuário ou código de recuperação inválido.'

const auth = useAuthStore()
const profile = useProfileStore()
const { seconds: waitLeft, start: startWait } = useCountdown()

const username = ref('')
const recoveryCode = ref('')
const newPassword = ref('')
const showPassword = ref(false)
const error = ref<string | null>(null)
const sending = ref(false)
// The replacement code is kept only while its modal is open (spec §3).
const replacement = ref('')
const loggedIn = ref(false)
const confirming = ref(false)
const confirmError = ref<string | undefined>(undefined)
const done = ref(false)

const waiting = computed(() => waitLeft.value > 0)

async function submit() {
  if (sending.value || waiting.value) return
  error.value = null
  sending.value = true
  try {
    const code = await auth.resetPassword({
      username: username.value,
      recovery_code: recoveryCode.value,
      new_password: newPassword.value,
    })
    recoveryCode.value = ''
    // Log in with the new password, so that "Guardei meu código" can be saved on the server
    // (the confirmation needs a session). If that fails, the student logs in by hand later.
    try {
      await auth.login({ username: username.value, password: newPassword.value })
      loggedIn.value = true
    }
    catch {
      loggedIn.value = false
    }
    newPassword.value = ''
    replacement.value = code
  }
  catch (e) {
    error.value = errorDetail(e) === 'invalid_recovery' ? INVALID_RECOVERY : errorLines(e).join(' ')
    // Too many tries: the API says how long to wait (429 retry_after).
    if (errorStatus(e) === 429) startWait(errorRetryAfter(e))
  }
  finally {
    sending.value = false
  }
}

async function codeSaved() {
  if (!loggedIn.value) {
    // No session: the new code stays unconfirmed and the reminder asks again after login.
    replacement.value = ''
    done.value = true
    return
  }
  confirming.value = true
  confirmError.value = undefined
  try {
    await profile.confirmRecoveryCode()
    replacement.value = ''
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
    <template v-if="!done">
      <h2 class="font-display text-3xl font-bold">Esqueci minha senha</h2>
      <p class="mt-1 text-muted">Use o código de recuperação que você guardou ao criar a conta.</p>

      <form class="mt-6 grid gap-5" novalidate @submit.prevent="submit">
        <TextField v-model="username" label="Nome de usuário" testid="reset-username" autocomplete="username" />
        <TextField
          v-model="recoveryCode"
          label="Código de recuperação"
          testid="reset-code"
          autocomplete="off"
          placeholder="XXXX-XXXX-XXXX-XXXX"
          hint="Pode digitar em minúsculas, com ou sem os traços."
        />
        <div>
          <TextField
            v-model="newPassword"
            label="Nova senha"
            :type="showPassword ? 'text' : 'password'"
            testid="reset-password"
            autocomplete="new-password"
            hint="8 a 72 caracteres."
          />
          <label class="mt-2 flex items-center gap-2">
            <input v-model="showPassword" type="checkbox" class="h-5 w-5 accent-[var(--cq-ink)]" data-testid="reset-show-password">
            <span>Mostrar a senha</span>
          </label>
        </div>

        <p v-if="error" role="alert" class="cq-alert px-3 py-2 text-error-ink" data-testid="reset-error">{{ error }}</p>
        <p v-if="waiting" role="status" class="text-sm text-muted" data-testid="reset-wait">Tente de novo em {{ waitLeft }} s.</p>

        <button
          type="submit"
          :disabled="sending || waiting"
          class="bg-go px-5 py-3 font-display text-lg font-bold text-on-go transition-colors hover:bg-go-hover disabled:cursor-not-allowed disabled:opacity-60 cq-go-shadow"
          data-testid="reset-submit"
        >{{ sending ? 'Redefinindo…' : 'Redefinir senha' }}</button>
      </form>

      <p class="mt-6 text-muted">
        Lembrou a senha?
        <NuxtLink to="/entrar" class="font-semibold text-ink underline underline-offset-4 hover:decoration-2" data-testid="reset-login-link">Voltar para o login</NuxtLink>
      </p>
    </template>

    <template v-else>
      <h2 class="font-display text-3xl font-bold" data-testid="reset-done">Senha alterada</h2>
      <p class="mt-2 leading-relaxed text-muted">
        Entre com a sua nova senha. O código antigo deixou de funcionar; depois de entrar, gere um novo código no seu perfil.
      </p>
      <AppButton to="/entrar" variant="primary" class="mt-6" data-testid="reset-go-login">Ir para o login</AppButton>
    </template>

    <RecoveryCodeModal v-if="replacement" :code="replacement" :busy="confirming" :error="confirmError" @confirmed="codeSaved" />
  </div>
</template>
