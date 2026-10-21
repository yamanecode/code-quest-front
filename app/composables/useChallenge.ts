import { computed, onScopeDispose, ref, watch, type Ref } from 'vue'
import * as studentService from '~/services/student'
import { ApiError } from '~/services/http'
import { useProfileStore } from '~/stores/profile'
import { useSettingsStore } from '~/stores/settings'
import type { ChallengeForStudent, SubmissionResult } from '~/types/api'
import type { Answer } from '~/types/challenge'
import { CORRECT_MESSAGES, WRONG_MESSAGES, pickMessage } from '~/utils/feedback'
import { errorMessage } from '~/utils/format'
import { playTone, type Tone } from '~/utils/sound'

export interface AnswerOutcome extends SubmissionResult {
  message: string
}

// Use case of the challenge screen: load it, keep the answer being built,
// submit it, ask for hints (cap and cooldown) and keep the last result.
export function useChallenge(id: Ref<number>) {
  const profile = useProfileStore()
  const settings = useSettingsStore()

  const challenge = ref<ChallengeForStudent | null>(null)
  const loading = ref(false)
  const loadError = ref<string | null>(null)

  const answer = ref<Answer | null>(null)
  const sending = ref(false)
  const outcome = ref<AnswerOutcome | null>(null)
  const submitError = ref<string | null>(null)

  const hints = ref<string[]>([])
  const hintsLeft = ref(0)
  const hintLoading = ref(false)
  const hintError = ref<string | null>(null)
  const cooldown = ref(0)
  let timer: ReturnType<typeof setInterval> | null = null

  const solved = computed(() => challenge.value?.solved ?? false)
  const canHint = computed(
    () => !!challenge.value && !solved.value && hintsLeft.value > 0 && cooldown.value === 0 && !hintLoading.value,
  )
  const canSubmit = computed(() => answer.value !== null && !sending.value && outcome.value === null)

  function stopCooldown() {
    if (timer) clearInterval(timer)
    timer = null
  }

  function startCooldown(seconds: number) {
    stopCooldown()
    cooldown.value = Math.max(0, Math.ceil(seconds))
    if (cooldown.value === 0) return
    timer = setInterval(() => {
      cooldown.value -= 1
      if (cooldown.value <= 0) {
        cooldown.value = 0
        stopCooldown()
      }
    }, 1000)
  }

  async function load() {
    loading.value = true
    loadError.value = null
    challenge.value = null
    outcome.value = null
    submitError.value = null
    hints.value = []
    hintError.value = null
    try {
      const loaded = await studentService.getChallenge(id.value)
      challenge.value = loaded
      hintsLeft.value = loaded.hints_left
      startCooldown(loaded.cooldown_seconds_left)
    }
    catch (e) {
      loadError.value = errorMessage(e)
    }
    finally {
      loading.value = false
    }
  }

  function setAnswer(value: Answer | null) {
    answer.value = value
  }

  function toneFor(result: SubmissionResult): Tone {
    if (result.new_badges.length > 0) return 'badge'
    if (result.level_up) return 'levelUp'
    return 'correct'
  }

  async function submit() {
    if (!challenge.value || !answer.value || !canSubmit.value) return
    sending.value = true
    submitError.value = null
    try {
      const result = await studentService.submitAnswer(challenge.value.id, answer.value)
      const message = pickMessage(result.is_correct ? CORRECT_MESSAGES : WRONG_MESSAGES)
      outcome.value = { ...result, message }
      if (result.is_correct) {
        challenge.value = { ...challenge.value, solved: true }
        stopCooldown()
        cooldown.value = 0
        playTone(toneFor(result), { muted: settings.muted })
        if (result.xp_earned > 0) profile.celebrateXp()
        profile.load()
      }
    }
    catch (e) {
      submitError.value = errorMessage(e)
    }
    finally {
      sending.value = false
    }
  }

  // "Tentar novamente": clears the wrong-answer feedback and keeps the answer to adjust it.
  function retry() {
    outcome.value = null
    submitError.value = null
  }

  async function requestHint() {
    if (!challenge.value || !canHint.value) return
    hintLoading.value = true
    hintError.value = null
    try {
      const result = await studentService.requestHint(challenge.value.id)
      hints.value = [...hints.value, result.hint]
      hintsLeft.value = result.hints_left
      startCooldown(result.cooldown_seconds)
    }
    catch (e) {
      hintError.value = errorMessage(e)
      if (e instanceof ApiError) {
        if (e.detail === 'hint_cooldown') startCooldown(e.retryAfter ?? 0)
        if (e.detail === 'hint_cap_reached') hintsLeft.value = 0
        if (e.detail === 'already_solved') challenge.value = { ...challenge.value, solved: true }
      }
    }
    finally {
      hintLoading.value = false
    }
  }

  watch(id, load, { immediate: true })
  onScopeDispose(stopCooldown)

  return {
    challenge,
    loading,
    loadError,
    answer,
    sending,
    outcome,
    submitError,
    hints,
    hintsLeft,
    hintLoading,
    hintError,
    cooldown,
    solved,
    canHint,
    canSubmit,
    load,
    setAnswer,
    submit,
    retry,
    requestHint,
  }
}
