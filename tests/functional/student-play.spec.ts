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

test('FT-UI-03 the home shows level, title and XP first, then streak, daily card, class goal and missions', { tag: ['@UI-03'] }, async ({ page }) => {
  const { student, classroom } = await setup()
  await loginStudentUi(page, student)

  await expect(page.getByTestId('header-level')).toContainText('Nível 1')
  await expect(page.getByTestId('header-title')).toContainText('Aprendiz')
  await expect(page.getByTestId('header-xp')).toContainText('0 XP')
  await expect(page.getByTestId('header-streak')).toBeVisible()
  await expect(page.getByTestId('daily-card')).toBeVisible()

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

  // order on the page: header, then the daily card, then the missions
  const y = async (id: string) => (await page.getByTestId(id).boundingBox())!.y
  expect(await y('header-level')).toBeLessThan(await y('daily-card'))
  expect(await y('daily-card')).toBeLessThan(await y('home-base'))
})

test('FT-UI-03 the daily challenge card opens a challenge and the streak counts the first solve', { tag: ['@UI-03'] }, async ({ page }) => {
  const { student, challenges } = await setup(['ordering'])
  await solveViaApi(student, challenges[0]!)
  await loginStudentUi(page, student)
  await expect(page.getByTestId('header-streak')).toContainText('1')
  await page.getByTestId('daily-link').click()
  await expect(page).toHaveURL(/\/desafios\/\d+/)
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

test('FT-UI-06 a wrong answer shows message, the hint and "Tentar novamente"', { tag: ['@UI-06'] }, async ({ page }) => {
  const { student, challenges } = await setup(['pattern'])
  await loginStudentUi(page, student)
  await page.goto(`/desafios/${challenges[0]!.id}`)
  await answerInBrowser(page, challenges[0]!.spec, 'wrong')
  await page.getByTestId('challenge-submit').click()

  await expect(page.getByTestId('feedback-wrong')).toBeVisible()
  await expect(page.getByTestId('feedback-message')).not.toBeEmpty()
  await expect(page.getByTestId('feedback-hint')).toContainText('Dica nível 1')
  await expect(page.getByTestId('feedback-retry')).toHaveText(/Tentar novamente/)
  // the explanation stays hidden until the answer is right
  await expect(page.getByTestId('feedback-wrong')).not.toContainText('Porque sim')
})

test('FT-UI-06 reaching 50 XP shows the level-up', { tag: ['@UI-06'] }, async ({ page }) => {
  const { student, challenges } = await setup(['ordering', 'ordering', 'ordering', 'ordering', 'ordering'])
  for (const challenge of challenges.slice(0, 4)) await solveViaApi(student, challenge)
  await loginStudentUi(page, student)
  await page.goto(`/desafios/${challenges[4]!.id}`)
  await answerInBrowser(page, challenges[4]!.spec)
  await page.getByTestId('challenge-submit').click()

  await expect(page.getByTestId('feedback-correct')).toContainText(/n[ií]vel 2/i)
  await expect(page.getByTestId('header-level')).toContainText('Nível 2')
})

test('FT-UI-07 the hint button counts down, shows the hint, waits and is disabled at zero', { tag: ['@UI-07'] }, async ({ page }) => {
  const { student, challenges } = await setup(['ordering'])
  await loginStudentUi(page, student)
  await page.goto(`/desafios/${challenges[0]!.id}`)
  const button = page.getByTestId('challenge-hint')

  await expect(button).toHaveText(/Dica \(5 restantes\)/)
  await button.click()
  await expect(page.getByTestId('hint-1')).toContainText('Dica nível 1')
  await expect(button).toBeDisabled()
  await expect(button).toHaveText(/\d+ s/) // cooldown countdown

  for (let used = 2; used <= 5; used++) {
    await expect(button).toBeEnabled({ timeout: 10_000 })
    await button.click()
    await expect(page.getByTestId(`hint-${used}`)).toBeVisible()
  }
  await expect(button).toBeDisabled()
  await page.waitForTimeout(2500) // longer than the cooldown: still disabled because none are left
  await expect(button).toBeDisabled()
  await expect(button).toHaveText(/0 restantes|sem dicas|esgot/i)
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
