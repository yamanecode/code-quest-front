import { expect, test } from '@playwright/test'
import {
  createChallenge,
  createClassroom,
  createMission,
  createStudent,
  joinClassroom,
  loginProfessorUi,
  loginStudentUi,
  professorToken,
  solveViaApi,
  unique,
} from './helpers'

test('FT-UI-10 the professor creates a class and sees its join code', { tag: ['@UI-10'] }, async ({ page, browser }) => {
  await loginProfessorUi(page)
  const name = unique('Turma UI ')
  await page.getByTestId('new-classroom-name').fill(name)
  await page.getByTestId('create-submit').click()

  const item = page.locator('[data-testid^=classroom-]', { hasText: name }).first()
  await expect(item).toBeVisible()
  const code = await item.getByTestId('join-code').innerText()
  expect(code).toMatch(/^[A-Z0-9]{6}$/)

  // the student can use that code
  const student = await createStudent()
  const studentContext = await browser.newContext()
  const studentPage = await studentContext.newPage()
  await loginStudentUi(studentPage, student)
  await studentPage.goto('/turmas')
  await studentPage.getByTestId('join-code').fill(code)
  await studentPage.getByTestId('join-submit').click()
  await expect(studentPage.getByTestId('classroom-name')).toHaveText(name)
  await studentContext.close()
})

test('FT-UI-10 the class screen shows missions, goal, progress with the completion percentage and the full ranking', { tag: ['@UI-10'] }, async ({ page }) => {
  const prof = await professorToken()
  const classroom = await createClassroom(prof)
  const first = await createChallenge(prof, 'ordering')
  const second = await createChallenge(prof, 'pattern')
  const mission = await createMission(prof, classroom.id, [first.id, second.id], { title: 'Missão da turma' })
  const ana = await createStudent('ana')
  const bia = await createStudent('bia')
  await joinClassroom(ana, classroom.join_code)
  await joinClassroom(bia, classroom.join_code)
  await solveViaApi(ana, first)
  await solveViaApi(ana, second)
  await solveViaApi(bia, first)

  await loginProfessorUi(page)
  await page.goto(`/professor/turmas/${classroom.id}`)

  await expect(page.getByTestId('classroom-title')).toHaveText(classroom.name)
  await expect(page.getByTestId('join-code')).toHaveText(classroom.join_code)
  await expect(page.getByTestId(`mission-${mission.id}`)).toContainText('Missão da turma')
  await expect(page.getByTestId(`mission-${mission.id}`)).toContainText('Publicada')

  // automatic goal: 2 students x 2 challenges = 4 open first solves; 3 were made
  await expect(page.getByTestId('classroom-goal')).toContainText('3 de 4 desafios')

  // progress table and completion percentage
  await expect(page.getByTestId('completed-all')).toHaveText('50% da turma concluiu todas as missões')
  const anaRow = page.getByTestId(`progress-${ana.username}`)
  await expect(anaRow).toContainText('20') // XP in the class
  await expect(page.getByTestId(`progress-${bia.username}`)).toContainText('10')

  // full ranking, week and month
  const entries = page.locator('[data-testid^=ranking-entry-]')
  await expect(entries).toHaveCount(2)
  await expect(entries.first()).toContainText(ana.username)
  await expect(entries.first()).toContainText('20 XP')
  await page.getByTestId('ranking-month').click()
  await expect(entries).toHaveCount(2)
  await expect(entries.nth(1)).toContainText(bia.username)
})

test('FT-UI-10 the professor changes the weekly goal and can go back to the automatic one', { tag: ['@UI-10'] }, async ({ page }) => {
  const prof = await professorToken()
  const classroom = await createClassroom(prof)
  const challenges = []
  for (let i = 0; i < 4; i++) challenges.push(await createChallenge(prof, 'ordering'))
  await createMission(prof, classroom.id, challenges.map((c) => c.id))
  const student = await createStudent()
  await joinClassroom(student, classroom.join_code)
  await solveViaApi(student, challenges[0]!)

  await loginProfessorUi(page)
  await page.goto(`/professor/turmas/${classroom.id}`)
  await expect(page.getByTestId('classroom-goal')).toContainText('1 de 4 desafios')

  await page.getByTestId('weekly-goal-input').fill('2')
  await page.getByTestId('goal-save').click()
  await expect(page.getByTestId('goal-status')).toHaveText('Turma atualizada.')
  await expect(page.getByTestId('classroom-goal')).toContainText('1 de 2 desafios')
  await page.reload()
  await expect(page.getByTestId('weekly-goal-input')).toHaveValue('2')

  // empty field = automatic goal again
  await page.getByTestId('weekly-goal-input').fill('')
  await page.getByTestId('goal-save').click()
  await expect(page.getByTestId('goal-status')).toHaveText('Turma atualizada.')
  await expect(page.getByTestId('classroom-goal')).toContainText('1 de 4 desafios')

  // the name is kept while the goal changes
  await expect(page.getByTestId('classroom-title')).toHaveText(classroom.name)
})

test('FT-UI-10 a class with no students shows empty progress and ranking', { tag: ['@UI-10'] }, async ({ page }) => {
  const prof = await professorToken()
  const classroom = await createClassroom(prof)
  await loginProfessorUi(page)
  await page.goto(`/professor/turmas/${classroom.id}`)
  await expect(page.getByTestId('progress-empty')).toBeVisible()
  await expect(page.getByTestId('ranking-empty')).toBeVisible()
  await expect(page.getByTestId('goal-none')).toContainText('Sem meta esta semana')
})

test('FT-UI-14 an empty mission cannot be published; after adding a published challenge it can, and the class sees it', { tag: ['@UI-14'] }, async ({ page, browser }) => {
  const prof = await professorToken()
  const classroom = await createClassroom(prof)
  const student = await createStudent()
  await joinClassroom(student, classroom.join_code)

  await loginProfessorUi(page)
  await page.goto(`/professor/turmas/${classroom.id}`)
  const title = unique('Missão nova ')
  await page.getByTestId('new-mission-title').fill(title)
  await page.getByTestId('create-mission-submit').click()
  await page.locator('[data-testid^=mission-title]', { hasText: title }).click()
  await expect(page.getByTestId('mission-heading')).toHaveText(title)

  // blocked while empty
  await page.getByTestId('mission-publish').click()
  await expect(page.getByTestId('mission-errors')).toHaveText('A missão precisa de pelo menos um desafio publicado.')
  await expect(page.getByTestId('mission-status')).toHaveText('Rascunho')

  // a draft challenge still does not count
  const draft = await createChallenge(prof, 'ordering', { publish: false, title: unique('Rascunho ') })
  await page.reload()
  await page.getByTestId('mission-add-select').selectOption({ label: draft.title })
  await page.getByTestId('mission-add').click()
  await expect(page.getByTestId(`mission-challenge-${draft.id}`)).toBeVisible()
  await page.getByTestId('mission-publish').click()
  await expect(page.getByTestId('mission-status')).toHaveText('Rascunho')

  // remove it and add a published one
  await page.getByTestId(`mission-remove-${draft.id}`).click()
  await expect(page.getByTestId(`mission-challenge-${draft.id}`)).toHaveCount(0)
  const published = await createChallenge(prof, 'grouping', { title: unique('Publicado ') })
  await page.reload()
  await page.getByTestId('mission-add-select').selectOption({ label: published.title })
  await page.getByTestId('mission-add').click()
  await expect(page.getByTestId(`mission-challenge-${published.id}`)).toBeVisible()

  // not visible to the student yet
  const studentContext = await browser.newContext()
  const studentPage = await studentContext.newPage()
  await loginStudentUi(studentPage, student)
  await expect(studentPage.getByText(title)).toHaveCount(0)

  await page.getByTestId('mission-publish').click()
  await expect(page.getByTestId('mission-status')).toHaveText('Publicada')

  await studentPage.reload()
  await expect(studentPage.getByTestId(`home-classroom-${classroom.id}`)).toContainText(title)
  await studentContext.close()
})

test('FT-UI-14 the professor reorders the challenges of a mission', { tag: ['@UI-14'] }, async ({ page }) => {
  const prof = await professorToken()
  const classroom = await createClassroom(prof)
  const a = await createChallenge(prof, 'ordering', { title: unique('Primeiro ') })
  const b = await createChallenge(prof, 'pattern', { title: unique('Segundo ') })
  const c = await createChallenge(prof, 'filtering', { title: unique('Terceiro ') })
  const mission = await createMission(prof, classroom.id, [a.id, b.id, c.id], { publish: false })

  await loginProfessorUi(page)
  await page.goto(`/professor/missoes/${mission.id}`)
  const rows = page.locator('[data-testid^=mission-challenge-]')
  await expect(rows).toHaveCount(3)
  await expect(rows.nth(0)).toContainText(a.title)

  await page.getByTestId(`mission-down-${a.id}`).click()
  await expect(rows.nth(0)).toContainText(b.title)
  await expect(rows.nth(1)).toContainText(a.title)
  await page.getByTestId(`mission-up-${c.id}`).click()
  await expect(rows.nth(1)).toContainText(c.title)

  // the order survives a reload
  await page.reload()
  await expect(rows.nth(0)).toContainText(b.title)
  await expect(rows.nth(1)).toContainText(c.title)
  await expect(rows.nth(2)).toContainText(a.title)
})

test('FT-UI-14 the mission data can be edited', { tag: ['@UI-14'] }, async ({ page }) => {
  const prof = await professorToken()
  const classroom = await createClassroom(prof)
  const challenge = await createChallenge(prof, 'pattern')
  const mission = await createMission(prof, classroom.id, [challenge.id], { publish: false })

  await loginProfessorUi(page)
  await page.goto(`/professor/missoes/${mission.id}`)
  const title = unique('Título novo ')
  await page.getByTestId('mission-title-input').fill(title)
  await page.getByTestId('mission-description-input').fill('Descrição nova da missão.')
  await page.getByTestId('mission-save').click()
  await expect(page.getByTestId('mission-heading')).toHaveText(title)
  await page.reload()
  await expect(page.getByTestId('mission-title-input')).toHaveValue(title)
  await expect(page.getByTestId('mission-description-input')).toHaveValue('Descrição nova da missão.')
})
