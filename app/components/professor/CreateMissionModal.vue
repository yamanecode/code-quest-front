<script setup lang="ts">
import { ref } from 'vue'
import type { MissionCreateInput, ProfMission } from '~/types/api'
import { errorLines } from '~/utils/format'

// New mission of a turma: title and optional description. Challenges are added on the mission page.
const props = defineProps<{ create: (input: MissionCreateInput) => Promise<ProfMission> }>()
const emit = defineEmits<{ created: [mission: ProfMission], cancel: [] }>()

const title = ref('')
const description = ref('')
const errors = ref<string[]>([])
const busy = ref(false)

async function submit() {
  errors.value = []
  if (!title.value.trim()) {
    errors.value = ['Dê um título à missão.']
    return
  }
  busy.value = true
  try {
    emit('created', await props.create({ title: title.value.trim(), description: description.value.trim() || null }))
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
  <FormDialog title="Nova missão" submit-label="Criar missão" testid="create-mission" :errors="errors" :busy="busy" @submit="submit" @cancel="emit('cancel')">
    <TextField v-model="title" label="Título" testid="new-mission-title" :maxlength="80" autocomplete="off" />
    <TextField v-model="description" label="Descrição (opcional)" testid="new-mission-description" :maxlength="400" autocomplete="off" />
  </FormDialog>
</template>
