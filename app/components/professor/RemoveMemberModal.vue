<script setup lang="ts">
import { computed, ref } from 'vue'
import { errorLines } from '~/utils/format'

// Second check before taking a student out: the professor types the username to confirm.
const props = defineProps<{ username: string, remove: () => Promise<void> }>()
const emit = defineEmits<{ done: [], cancel: [] }>()

const typed = ref('')
const errors = ref<string[]>([])
const busy = ref(false)
const matches = computed(() => typed.value === props.username)

async function submit() {
  if (!matches.value) return
  errors.value = []
  busy.value = true
  try {
    await props.remove()
    emit('done')
  }
  catch (e) {
    errors.value = errorLines(e)
  }
  finally {
    busy.value = false
  }
}
</script>

<template>
  <FormDialog :title="`Remover ${props.username} da turma?`" submit-label="Remover da turma" testid="remove-member" danger return-to="#h-progress" :errors="errors" :busy="busy || !matches" @submit="submit" @cancel="emit('cancel')">
    <p class="leading-relaxed text-muted">
      O XP, as insígnias e o histórico do estudante continuam com ele. Ele poderá entrar de novo com o código, a menos que você gere um novo.
    </p>
    <TextField v-model="typed" :label="`Para confirmar, digite ${props.username}`" testid="remove-member-name" autocomplete="off" />
  </FormDialog>
</template>
