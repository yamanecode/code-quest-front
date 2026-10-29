<script setup lang="ts">
import { computed, ref } from 'vue'
import { useProfileStore } from '~/stores/profile'
import { errorDetail, errorMessage } from '~/utils/format'

// Recovery-code section of the profile (spec §3, §9.1): status, and a new code on request.
// The new code is shown once in the modal and dropped as soon as it closes.
const profile = useProfileStore()

const asking = ref(false)
const password = ref('')
const passwordError = ref<string | null>(null)
const generating = ref(false)
const newCode = ref('')
const confirming = ref(false)
const confirmError = ref<string | undefined>(undefined)

const status = computed(() => {
  const current = profile.profile
  if (!current?.recovery_code_active) return 'Você ainda não tem um código de recuperação.'
  const since = current.recovery_code_created_at
    ? ` desde ${new Date(current.recovery_code_created_at).toLocaleDateString('pt-BR')}`
    : ''
  return `Código de recuperação ativo${since}`
})
const unconfirmed = computed(() => !!profile.profile?.recovery_code_active && !profile.profile.recovery_code_confirmed)

function open() {
  asking.value = true
  password.value = ''
  passwordError.value = null
}

function close() {
  asking.value = false
  password.value = ''
  passwordError.value = null
}

async function generate() {
  if (generating.value) return
  passwordError.value = null
  generating.value = true
  try {
    newCode.value = await profile.generateRecoveryCode(password.value)
    close()
  }
  catch (e) {
    passwordError.value = errorDetail(e) === 'invalid_password' ? 'Senha incorreta.' : errorMessage(e)
  }
  finally {
    generating.value = false
  }
}

async function confirmSaved() {
  confirming.value = true
  confirmError.value = undefined
  try {
    await profile.confirmRecoveryCode()
    newCode.value = ''
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
  <section aria-labelledby="h-recovery" class="border-t border-line pt-8" data-testid="recovery-card">
    <h2 id="h-recovery" class="font-display text-2xl font-bold">Código de recuperação</h2>
    <p class="mt-2 max-w-2xl text-muted">
      Se você esquecer a senha, o código de recuperação é a única forma de voltar para a sua conta.
    </p>
    <p class="mt-3 font-semibold" data-testid="recovery-status">{{ status }}</p>
    <p v-if="unconfirmed" class="mt-1 text-sm text-muted" data-testid="recovery-unconfirmed">
      Você ainda não confirmou que guardou este código.
    </p>

    <AppButton v-if="!asking" class="mt-4" data-testid="recovery-generate" @click="open">Gerar novo código</AppButton>

    <form v-else class="mt-4 grid max-w-md gap-4" novalidate @submit.prevent="generate">
      <TextField
        v-model="password"
        label="Sua senha"
        type="password"
        testid="recovery-password"
        autocomplete="current-password"
        hint="Digite sua senha para gerar um novo código. O código antigo deixa de funcionar."
      />
      <p v-if="passwordError" role="alert" class="cq-alert px-3 py-2 text-error-ink" data-testid="recovery-generate-error">{{ passwordError }}</p>
      <div class="flex flex-wrap gap-3">
        <AppButton type="submit" variant="primary" :disabled="generating || password.length === 0" data-testid="recovery-generate-submit">
          {{ generating ? 'Gerando…' : 'Gerar código' }}
        </AppButton>
        <AppButton data-testid="recovery-generate-cancel" @click="close">Cancelar</AppButton>
      </div>
    </form>

    <RecoveryCodeModal v-if="newCode" :code="newCode" :busy="confirming" :error="confirmError" @confirmed="confirmSaved" />
  </section>
</template>
