import { expect, test } from '@playwright/test'
import { createChallenge, createClassroom, createMission, createStudent, loginStudentUi, professorToken, unique } from './helpers'

test('FT-UI-16 the student joins a class with its code and sees it with its goal', { tag: ['@UI-16'] }, async ({ page }) => {
  const prof = await professorToken()
  const classroom = await createClassroom(prof, unique('Turma Alfa '))
  const challenge = await createChallenge(prof, 'pattern')
  await createMission(prof, classroom.id, [challenge.id], { title: 'Missão da turma Alfa' })
  const student = await createStudent()
  await loginStudentUi(page, student)

  await page.goto('/turmas')
  await expect(page.getByTestId('classrooms-empty')).toBeVisible()
  await page.getByTestId('join-code').fill(classroom.join_code)
  await page.getByTestId('join-submit').click()

  const item = page.getByTestId(`classroom-${classroom.id}`)
  await expect(item).toBeVisible()
  await expect(item).toContainText(classroom.name)
  await expect(item.getByTestId(`goal-${classroom.id}`)).toContainText('0 de 1')

  await page.goto('/inicio')
  await expect(page.getByTestId(`home-classroom-${classroom.id}`)).toContainText('Missão da turma Alfa')
})

test('FT-UI-16 an invalid code shows the error in Portuguese', { tag: ['@UI-16'] }, async ({ page }) => {
  const student = await createStudent()
  await loginStudentUi(page, student)
  await page.goto('/turmas')
  await page.getByTestId('join-code').fill('ZZZZZ9')
  await page.getByTestId('join-submit').click()
  await expect(page.getByTestId('join-error')).toHaveText('Código de turma inválido.')
  await expect(page.getByTestId('classrooms-empty')).toBeVisible()
})

test('FT-UI-16 leaving asks for confirmation and removes the class missions from the home', { tag: ['@UI-16'] }, async ({ page }) => {
  const prof = await professorToken()
  const classroom = await createClassroom(prof)
  const challenge = await createChallenge(prof, 'ordering')
  await createMission(prof, classroom.id, [challenge.id], { title: 'Missão que vai sumir' })
  const student = await createStudent()
  await loginStudentUi(page, student)
  await page.goto('/turmas')
  await page.getByTestId('join-code').fill(classroom.join_code)
  await page.getByTestId('join-submit').click()
  await expect(page.getByTestId(`classroom-${classroom.id}`)).toBeVisible()

  await page.getByTestId(`classroom-leave-${classroom.id}`).click()
  const dialog = page.getByTestId('leave-dialog')
  await expect(dialog).toBeVisible()

  // cancelling keeps the class
  await page.getByTestId('leave-dialog-cancel').click()
  await expect(dialog).toHaveCount(0)
  await expect(page.getByTestId(`classroom-${classroom.id}`)).toBeVisible()

  await page.getByTestId(`classroom-leave-${classroom.id}`).click()
  await page.getByTestId('leave-dialog-confirm').click()
  await expect(page.getByTestId(`classroom-${classroom.id}`)).toHaveCount(0)

  await page.goto('/inicio')
  await expect(page.getByTestId('header-level')).toBeVisible()
  await expect(page.getByTestId(`home-classroom-${classroom.id}`)).toHaveCount(0)
  await expect(page.getByText('Missão que vai sumir')).toHaveCount(0)
})

test('FT-UI-03 a joined class without published missions shows the empty state and the no-goal message', { tag: ['@UI-03'] }, async ({ page }) => {
  const prof = await professorToken()
  const classroom = await createClassroom(prof)
  const student = await createStudent()
  await loginStudentUi(page, student)
  await page.goto('/turmas')
  await page.getByTestId('join-code').fill(classroom.join_code)
  await page.getByTestId('join-submit').click()
  await expect(page.getByTestId(`classroom-${classroom.id}`)).toContainText('Sem meta esta semana')

  await page.goto('/inicio')
  const section = page.getByTestId(`home-classroom-${classroom.id}`)
  await expect(section).toContainText('Seu professor ainda não publicou missões')
  await expect(section).toContainText('Sem meta esta semana')
})
