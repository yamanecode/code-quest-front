import { expect, test } from '@playwright/test'
import { createChallenge, createClassroom, createMission, createStudent, joinClassroom, loginStudentUi, professorToken } from './helpers'

test('FT-UI-17 the welcome card "Começar" opens the first unsolved base challenge', { tag: ['@UI-17'] }, async ({ page }) => {
  const student = await createStudent()
  await loginStudentUi(page, student)

  const card = page.getByTestId('welcome-card')
  await expect(card).toBeVisible()
  await expect(card).toContainText('Escolha uma missão')
  await expect(card).toContainText('Resolva o desafio e ganhe XP')
  await expect(card).toContainText('Peça uma dica se travar')

  // the first challenge of the first base trail, as listed on its mission screen
  await page.getByTestId('home-base').getByRole('link').first().click()
  const firstChallenge = page.locator('[data-testid^=mission-challenge-]').first()
  await expect(firstChallenge).toBeVisible()
  const href = (await firstChallenge.getAttribute('href'))!.split('?')[0]!
  await page.goto('/')
  await page.getByTestId('welcome-start').click()
  await expect(page).toHaveURL(new RegExp(href))
  await expect(page.getByTestId('challenge-title')).toBeVisible()
})

test('FT-UI-17 once closed the welcome card does not return, even after a reload', { tag: ['@UI-17'] }, async ({ page }) => {
  const student = await createStudent()
  await loginStudentUi(page, student)
  await expect(page.getByTestId('welcome-card')).toBeVisible()
  await page.getByTestId('welcome-close').click()
  await expect(page.getByTestId('welcome-card')).toHaveCount(0)
  await page.reload()
  await expect(page.getByTestId('header-level')).toBeVisible()
  await expect(page.getByTestId('welcome-card')).toHaveCount(0)
})

test('FT-UI-17 the welcome card is remembered per student, not per browser', { tag: ['@UI-17'] }, async ({ page }) => {
  const first = await createStudent()
  const second = await createStudent()
  await loginStudentUi(page, first)
  await page.getByTestId('welcome-close').click()
  await page.getByTestId('nav-sair').click()
  await expect(page).toHaveURL(/\/entrar/)

  await loginStudentUi(page, second)
  await expect(page.getByTestId('welcome-card')).toBeVisible()
})

test('FT-UI-17 the help page explains the skills and the game rules', { tag: ['@UI-17'] }, async ({ page }) => {
  const student = await createStudent()
  await loginStudentUi(page, student)
  await page.getByTestId('nav-ajuda').click()
  await expect(page).toHaveURL(/\/ajuda/)

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Como funciona')
  for (const skill of ['Pensamento algorítmico', 'Decomposição', 'Abstração', 'Reconhecimento de padrões']) {
    await expect(page.getByTestId('help-skills')).toContainText(skill)
  }
  for (const heading of ['XP', 'Níveis e títulos', 'Insígnias', 'Ranking', 'Meta da turma', 'Sequência de dias', 'Desafio diário', 'Dicas']) {
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible()
  }
})

test('FT-UI-17 help buttons next to XP, streak, daily challenge, hints and ranking open a short explanation', { tag: ['@UI-17'] }, async ({ page }) => {
  const prof = await professorToken()
  const classroom = await createClassroom(prof)
  const challenge = await createChallenge(prof, 'ordering')
  await createMission(prof, classroom.id, [challenge.id])
  const student = await createStudent()
  await joinClassroom(student, classroom.join_code)
  await loginStudentUi(page, student)

  const open = async (testId: string) => {
    const button = page.getByTestId(testId)
    await button.click()
    await expect(button).toHaveAttribute('aria-expanded', 'true')
    const panel = page.locator(`[id="${await button.getAttribute('aria-controls')}"]`)
    await expect(panel).toBeVisible()
    await expect(panel).not.toBeEmpty()
    await page.keyboard.press('Escape')
    await expect(button).toHaveAttribute('aria-expanded', 'false')
  }

  await open('help-header-xp')
  await open('help-header-streak')
  await open('help-daily')
  await open(`help-home-goal-${classroom.id}`)

  await page.goto(`/desafios/${challenge.id}`)
  await open('help-hints')
  await page.goto('/ranking')
  await open('help-ranking')
})
