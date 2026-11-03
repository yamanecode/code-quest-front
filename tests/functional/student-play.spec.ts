import { expect, test } from '@playwright/test'
import {
  answerInBrowser,
  createChallenge,
  createClassroom,
  createMission,
  createStudent,
  joinClassroom,
  loginStudentUi,
  professorToken,
  solveViaApi,
  type ChallengeType,
} from './helpers'

const TYPES: ChallengeType[] = ['ordering', 'grouping', 'filtering', 'pattern']

// A fresh turma with one published mission holding one challenge per type, and a student inside it.
async function setup(types: ChallengeType[] = TYPES) {
  const prof = await professorToken()
  const classroom = await createClassroom(prof)
  const challenges = []
  for (const type of types) challenges.push(await createChallenge(prof, type, { explanation: `Porque sim ${type}.` }))
  const mission = await createMission(prof, classroom.id, challenges.map((c) => c.id), { title: 'Missão de teste' })
  const student = await createStudent()
  await joinClassroom(student, classroom.join_code)
  return { prof, classroom, challenges, mission, student }
}

test('FT-UI-03 the home shows level with title and XP first, then the Continuar card, class goal and missions', { tag: ['@UI-03'] }, async ({ page }) => {
  const { student, classroom } = await setup()
  await loginStudentUi(page, student)

  await expect(page.getByTestId('header-title')).toHaveText('Nível 1 · Iniciante')
  await expect(page.getByTestId('header-xp')).toContainText('0 XP')
  await expect(page.getByTestId('continue-card')).toBeVisible()

  // class goal of the new turma, with its milestones
  await expect(page.getByTestId(`home-goal-${classroom.id}`)).toBeVisible()
  await expect(page.getByTestId(`home-goal-${classroom.id}`)).toContainText('0 de 4')
  for (const mark of ['25', '50', '75', '100']) {
    await expect(page.getByTestId(`home-goal-${classroom.id}`).getByTestId(`goal-milestone-${mark}`)).toBeVisible()
  }

  // missions: base game and the turma, each with progress
  await expect(page.getByTestId('home-base')).toBeVisible()
  await expect(page.getByTestId('home-base').getByTestId('mission-progress').first()).toContainText('resolvidos')
  const turma = page.getByTestId(`home-classroom-${classroom.id}`)
  await expect(turma).toContainText('Missão de teste')
  await expect(turma.getByTestId('mission-progress')).toContainText('0 de 4 resolvidos')

  // order on the page: header, then the Continuar card, then the missions
  const y = async (id: string) => (await page.getByTestId(id).boundingBox())!.y
  expect(await y('header-title')).toBeLessThan(await y('continue-card'))
  expect(await y('continue-card')).toBeLessThan(await y('home-base'))
})

test('FT-UI-04 the mission screen lists the challenges in order with skills and solved marks, and any can be opened', { tag: ['@UI-04'] }, async ({ page }) => {
  const { student, challenges, mission } = await setup()
  await solveViaApi(student, challenges[1]!)
  await loginStudentUi(page, student)
  await page.goto(`/missoes/${mission.id}`)

  const rows = challenges.map((c) => page.getByTestId(`mission-challenge-${c.id}`))
  for (const [index, row] of rows.entries()) {
    await expect(row).toBeVisible()
    await expect(row).toContainText(challenges[index]!.title)
  }
  const ys = await Promise.all(rows.map(async (r) => (await r.boundingBox())!.y))
  expect([...ys].sort((a, b) => a - b)).toEqual(ys)
  await expect(rows[0]!.getByTestId('skill-ordering')).toBeVisible()
  await expect(rows[1]!.getByTestId('skill-grouping')).toBeVisible()
  await expect(rows[1]!).toContainText(/resolvido/i)
  await expect(rows[0]!).not.toContainText(/resolvido/i)

  // free order: open the last one first
  await rows[3]!.click()
  await expect(page).toHaveURL(new RegExp(`/desafios/${challenges[3]!.id}`))
})

for (const type of TYPES) {
  test(`FT-UI-05 a ${type} challenge is answered with its control and "Enviar" shows the result`, { tag: ['@UI-05'] }, async ({ page }) => {
    const { student, challenges } = await setup([type])
    const challenge = challenges[0]!
    await loginStudentUi(page, student)
    await page.goto(`/desafios/${challenge.id}`)

    await expect(page.getByTestId('challenge-title')).toHaveText(challenge.title)
    await expect(page.getByTestId(`skill-${type}`)).toBeVisible()
    await page.getByTestId(`help-skill-${type}`).click()
    await expect(page.getByTestId(`help-skill-${type}`)).toHaveAttribute('aria-expanded', 'true')

    // the control of the type
    if (type === 'ordering') await expect(page.getByRole('button', { name: /^Mover para cima/ }).first()).toBeVisible()
    if (type === 'grouping') await expect(page.getByRole('combobox').first()).toBeVisible()
    if (type === 'filtering') await expect(page.getByRole('checkbox').first()).toBeVisible()
    if (type === 'pattern') await expect(page.getByRole('radio').first()).toBeVisible()

    await answerInBrowser(page, challenge.spec, 'wrong')
    await page.getByTestId('challenge-submit').click()
    await expect(page.getByTestId('feedback-wrong')).toBeVisible()

    await page.getByTestId('feedback-retry').click()
    await answerInBrowser(page, challenge.spec, 'correct')
    await page.getByTestId('challenge-submit').click()
    await expect(page.getByTestId('feedback-correct')).toBeVisible()
  })
}

test('FT-UI-05 an ordering challenge keeps Enviar disabled until the student moves a step', { tag: ['@UI-05'] }, async ({ page }) => {
  const { student, challenges } = await setup(['ordering'])
  await loginStudentUi(page, student)
  await page.goto(`/desafios/${challenges[0]!.id}`)
  const submit = page.getByTestId('challenge-submit')

  await expect(page.getByTestId('ordering-list')).toBeVisible()
  await expect(submit).toBeDisabled()
  await expect(page.getByTestId('submit-help')).toContainText('Mexa nos passos')

  const [firstStep] = await page.getByTestId('ordering-text').allTextContents()
  await page.getByRole('button', { name: `Mover para baixo: ${firstStep!.trim()}` }).click()
  await expect(submit).toBeEnabled()
  await expect(page.getByTestId('submit-help')).toHaveCount(0)
})

test('FT-UI-06 a correct answer shows message, explanation, XP and the new badge', { tag: ['@UI-06'] }, async ({ page }) => {
  const { student, challenges } = await setup(['ordering'])
  await loginStudentUi(page, student)
  await page.goto(`/desafios/${challenges[0]!.id}`)
  await answerInBrowser(page, challenges[0]!.spec)
  await page.getByTestId('challenge-submit').click()

  const feedback = page.getByTestId('feedback-correct')
  await expect(feedback).toBeVisible()
  await expect(page.getByTestId('feedback-message')).not.toBeEmpty()
  await expect(feedback).toContainText('Porque sim ordering.')
  await expect(feedback).toContainText('+10')
  await expect(feedback).toContainText('Primeiro desafio')
  await expect(page.getByTestId('header-xp')).toContainText('10 XP')
})

test('FT-UI-06 a first-try solve opens the result dialog with "Primeira tentativa!", +10 XP and the first badge', { tag: ['@UI-06'] }, async ({ page }) => {
  const { student, challenges } = await setup(['pattern'])
  await loginStudentUi(page, student)
  await page.goto(`/desafios/${challenges[0]!.id}`)
  await answerInBrowser(page, challenges[0]!.spec)
  await page.getByTestId('challenge-submit').click()

  const dialog = page.getByRole('dialog', { name: 'Primeira tentativa!' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByTestId('feedback-xp')).toContainText('+10 XP')
  await expect(dialog.getByTestId('result-xp-count')).toHaveText('+10 XP')
  await expect(dialog.getByTestId('feedback-badge-first_solve')).toContainText('Primeiro desafio')
  await expect(dialog.getByTestId('feedback-status')).toContainText('Nível 1 · Iniciante')
  await expect(dialog.getByTestId('result-next')).toBeFocused()
})

test('FT-UI-06 Escape closes the result dialog and the focus goes to "Próximo desafio"', { tag: ['@UI-06'] }, async ({ page }) => {
  const { student, challenges } = await setup(['pattern'])
  await loginStudentUi(page, student)
  await page.goto(`/desafios/${challenges[0]!.id}`)
  await answerInBrowser(page, challenges[0]!.spec)
  await page.getByTestId('challenge-submit').click()
  await expect(page.getByTestId('result-modal')).toBeVisible()

  await page.keyboard.press('Escape')

  await expect(page.getByTestId('result-modal')).toHaveCount(0)
  await expect(page.getByTestId('challenge-next')).toBeFocused()
  await expect(page.getByTestId('challenge-already-solved')).toContainText('Porque sim pattern.')
})

test('FT-UI-06 a wrong answer opens no dialog', { tag: ['@UI-06'] }, async ({ page }) => {
  const { student, challenges } = await setup(['pattern'])
  await loginStudentUi(page, student)
  await page.goto(`/desafios/${challenges[0]!.id}`)
  await answerInBrowser(page, challenges[0]!.spec, 'wrong')
  await page.getByTestId('challenge-submit').click()

  await expect(page.getByTestId('feedback-wrong')).toBeVisible()
  await expect(page.getByTestId('result-modal')).toHaveCount(0)
})

test('FT-UI-06 a wrong answer shows message, the hint and "Tentar novamente"', { tag: ['@UI-06'] }, async ({ page }) => {
  const { student, challenges } = await setup(['pattern'])
  await loginStudentUi(page, student)
  await page.goto(`/desafios/${challenges[0]!.id}`)
  await answerInBrowser(page, challenges[0]!.spec, 'wrong')
  await page.getByTestId('challenge-submit').click()

  await expect(page.getByTestId('feedback-wrong')).toBeVisible()
  await expect(page.getByTestId('feedback-message')).not.toBeEmpty()
  await expect(page.getByTestId('hint-1')).toContainText('Dica automática')
  await expect(page.getByTestId('hint-1')).toContainText('Dica nível 1')
  await expect(page.getByTestId('feedback-retry')).toHaveText(/Tentar novamente/)
  // the explanation stays hidden until the answer is right
  await expect(page.getByTestId('feedback-wrong')).not.toContainText('Porque sim')

  // the automatic hint stays after a retry and comes back after a reload
  await page.getByTestId('feedback-retry').click()
  await expect(page.getByTestId('hint-1')).toContainText('Dica nível 1')
  await page.reload()
  await expect(page.getByTestId('hint-1')).toContainText('Dica automática')
  await expect(page.getByTestId('hint-1')).toContainText('Dica nível 1')
})

test('FT-UI-06 reaching 30 XP shows the level-up with the level and title', { tag: ['@UI-06'] }, async ({ page }) => {
  const { student, challenges } = await setup(['ordering', 'ordering', 'ordering'])
  for (const challenge of challenges.slice(0, 2)) await solveViaApi(student, challenge)
  await loginStudentUi(page, student)
  await page.goto(`/desafios/${challenges[2]!.id}`)
  await answerInBrowser(page, challenges[2]!.spec)
  await page.getByTestId('challenge-submit').click()

  await expect(page.getByTestId('feedback-level-up')).toContainText('Nível 2 · Iniciante')
  await expect(page.getByTestId('header-title')).toHaveText('Nível 2 · Iniciante')
})

test('FT-UI-07 the hint button counts down, shows each hint and has no limit', { tag: ['@UI-07'] }, async ({ page }) => {
  const { student, challenges } = await setup(['ordering'])
  await loginStudentUi(page, student)
  await page.goto(`/desafios/${challenges[0]!.id}`)
  const button = page.getByTestId('challenge-hint')

  await expect(button).toHaveText('Dica')
  await button.click()
  await expect(page.getByTestId('hint-1')).toContainText('Dica nível 1')
  await expect(button).toBeDisabled()
  await expect(button).toHaveText(/\d+ s/) // cooldown countdown

  for (let used = 2; used <= 6; used++) {
    await expect(button).toBeEnabled({ timeout: 10_000 })
    await button.click()
    await expect(page.getByTestId(`hint-${used}`)).toBeVisible()
  }
  await expect(button).toBeEnabled({ timeout: 10_000 }) // a sixth hint was shown: still no cap
})

test('FT-UI-07 a solved challenge is closed: no Enviar, no Dica, the explanation is shown', { tag: ['@UI-07'] }, async ({ page }) => {
  const { student, challenges } = await setup(['ordering'])
  await solveViaApi(student, challenges[0]!)
  await loginStudentUi(page, student)
  await page.goto(`/desafios/${challenges[0]!.id}`)

  await expect(page.getByTestId('challenge-already-solved')).toBeVisible()
  await expect(page.getByTestId('challenge-submit')).toHaveCount(0)
  await expect(page.getByTestId('challenge-hint')).toHaveCount(0)
})

for (const type of TYPES) {
  test(`FT-UI-12 the ${type} challenge screen has no free-text input`, { tag: ['@UI-12'] }, async ({ page }) => {
    const { student, challenges } = await setup([type])
    await loginStudentUi(page, student)
    await page.goto(`/desafios/${challenges[0]!.id}`)
    await expect(page.getByTestId('challenge-title')).toBeVisible()
    await expect(page.locator('textarea')).toHaveCount(0)
    await expect(page.locator('input[type=text], input:not([type]), input[type=search]')).toHaveCount(0)
    await expect(page.locator('[contenteditable=true]')).toHaveCount(0)
  })
}

test('FT-UI-12 the mission, home and profile screens have no textarea', { tag: ['@UI-12'] }, async ({ page }) => {
  const { student, mission } = await setup()
  await loginStudentUi(page, student)
  for (const path of ['/', `/missoes/${mission.id}`, '/perfil', '/ranking']) {
    await page.goto(path)
    await expect(page.locator('textarea')).toHaveCount(0)
  }
})
