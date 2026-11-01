import { expect, test } from '@playwright/test'
import {
  api,
  createChallenge,
  createClassroom,
  createMission,
  createStudent,
  joinClassroom,
  loginStudentUi,
  professorToken,
  solveViaApi,
  type Student,
} from './helpers'

async function xpOf(student: Student): Promise<number> {
  const { data } = await api<{ xp: number }>('/api/me', { token: student.token })
  return data.xp
}

// A fresh turma with one published mission of two challenges, and a student who joined it.
async function turmaWithMission() {
  const prof = await professorToken()
  const classroom = await createClassroom(prof)
  const first = await createChallenge(prof, 'ordering')
  const second = await createChallenge(prof, 'pattern')
  const mission = await createMission(prof, classroom.id, [first.id, second.id])
  const student = await createStudent('cont')
  await joinClassroom(student, classroom.join_code)
  return { mission, first, second, student }
}

test('FT-UI-22 the Continuar card opens the next challenge of the mission answered last, without XP', { tag: ['@UI-22'] }, async ({ page }) => {
  const { mission, first, second, student } = await turmaWithMission()
  await solveViaApi(student, first)
  const xpBefore = await xpOf(student)

  await loginStudentUi(page, student)
  const card = page.getByTestId('continue-card')
  await expect(card).toBeVisible()
  await expect(card.getByTestId('continue-text')).toContainText(mission.title)
  await expect(card.getByTestId('continue-text')).toContainText(second.title)
  await expect(card).not.toContainText('XP')

  await card.getByTestId('continue-link').click()
  await expect(page).toHaveURL(new RegExp(`/desafios/${second.id}\\?missao=${mission.id}`))
  await expect(page.getByTestId('challenge-title')).toHaveText(second.title)
  expect(await xpOf(student)).toBe(xpBefore)
})

test('FT-UI-22 before any answer the card points to the turma mission first', { tag: ['@UI-22'] }, async ({ page }) => {
  const { mission, first, student } = await turmaWithMission()

  await loginStudentUi(page, student)
  const text = page.getByTestId('continue-card').getByTestId('continue-text')
  await expect(text).toContainText(mission.title)
  await expect(text).toContainText(first.title)
})

test('FT-UI-23 new turma content shows "Novo" until answered; base trilhas never do', { tag: ['@UI-23'] }, async ({ page }) => {
  const { mission, first, second, student } = await turmaWithMission()

  await loginStudentUi(page, student)
  await expect(page.getByTestId(`mission-new-${mission.id}`)).toHaveText('Novo')
  await expect(page.getByTestId('home-base').locator('[data-testid^=mission-new]')).toHaveCount(0)
  await expect(page.getByTestId('continue-new')).toHaveText('Novo')

  await page.getByTestId(`mission-${mission.id}`).click()
  await expect(page.getByTestId(`mission-challenge-new-${first.id}`)).toHaveText('Novo')
  await expect(page.getByTestId(`mission-challenge-new-${second.id}`)).toHaveText('Novo')
  await page.getByTestId(`mission-challenge-${first.id}`).click()
  await expect(page.getByTestId('challenge-new')).toHaveText('Novo')

  // After answering one challenge the mission is started: it keeps only "Novo desafio" for the other.
  await solveViaApi(student, first)
  await page.goto('/inicio')
  await expect(page.getByTestId(`mission-new-challenges-${mission.id}`)).toHaveText('Novo desafio')
  await expect(page.getByTestId(`mission-new-${mission.id}`)).toHaveCount(0)
  await page.goto(`/missoes/${mission.id}`)
  await expect(page.getByTestId(`mission-challenge-new-${second.id}`)).toHaveText('Novo')
  await expect(page.getByTestId(`mission-challenge-new-${first.id}`)).toHaveCount(0)

  // Once everything is answered, no label is left.
  await solveViaApi(student, second)
  await page.goto('/inicio')
  await expect(page.getByTestId(`mission-${mission.id}`)).toBeVisible()
  await expect(page.getByTestId(`mission-new-challenges-${mission.id}`)).toHaveCount(0)
  await expect(page.getByTestId(`mission-new-${mission.id}`)).toHaveCount(0)
})
