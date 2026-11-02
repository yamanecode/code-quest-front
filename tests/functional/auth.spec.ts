import { expect, test } from '@playwright/test'
import {
  createClassroom,
  createStudent,
  joinClassroom,
  loginProfessorUi,
  loginUi,
  professorToken,
  STUDENT_PASSWORD,
  unique,
} from './helpers'

test('FT-UI-01 a visitor signs up with username and password and lands on the student home', { tag: ['@UI-01'] }, async ({ page }) => {
  await page.goto('/cadastro')
  await expect(page.getByTestId('signup-real-name-warning')).toContainText('nome real')
  await expect(page.getByTestId('signup-username')).toBeVisible()
  await expect(page.getByTestId('signup-password')).toBeVisible()

  await page.getByTestId('signup-username').fill(unique('novo'))
  await page.getByTestId('signup-password').fill(STUDENT_PASSWORD)
  await page.getByTestId('signup-submit').click()

  // The recovery code comes first (FT-UI-40); the home opens only after it is saved.
  await page.getByTestId('recovery-confirm-check').check()
  await page.getByTestId('recovery-continue').click()
  await expect(page).toHaveURL('/inicio')
  await expect(page.getByTestId('header-level')).toBeVisible()
})

test('FT-UI-01 a taken username shows the error in Portuguese', { tag: ['@UI-01'] }, async ({ page }) => {
  const existing = await createStudent()
  await page.goto('/cadastro')
  await page.getByTestId('signup-username').fill(existing.username)
  await page.getByTestId('signup-password').fill(STUDENT_PASSWORD)
  await page.getByTestId('signup-submit').click()

  await expect(page.getByRole('alert')).toContainText(/já|uso|existe|escolh/i)
  await expect(page).toHaveURL(/\/cadastro/)
})

test('FT-UI-01 a wrong password shows the error in Portuguese and an existing student logs in', { tag: ['@UI-01'] }, async ({ page }) => {
  const student = await createStudent()
  await loginUi(page, student.username, 'senha-errada-99')
  await expect(page.getByRole('alert')).toContainText(/incorret|inválid|senha/i)
  await expect(page).toHaveURL(/\/entrar/)

  await loginUi(page, student.username, student.password)
  await expect(page).toHaveURL('/inicio')
})

test('FT-UI-02 a visitor is sent to the login screen', { tag: ['@UI-02'] }, async ({ page }) => {
  for (const path of ['/inicio', '/turmas', '/ranking', '/perfil', '/professor']) {
    await page.goto(path)
    await expect(page).toHaveURL(/\/entrar/)
  }
})

test('FT-UI-02 a student cannot open professor screens', { tag: ['@UI-02'] }, async ({ page }) => {
  const student = await createStudent()
  await loginUi(page, student.username, student.password)
  await expect(page).toHaveURL('/inicio')

  await page.goto('/professor')
  await expect(page).not.toHaveURL(/\/professor/)
  await page.goto('/professor/desafios/novo')
  await expect(page).not.toHaveURL(/\/professor/)
})

test('FT-UI-02 a professor lands on the professor home', { tag: ['@UI-02'] }, async ({ page }) => {
  await loginProfessorUi(page)
  await expect(page).toHaveURL('/professor')
  await page.goto('/entrar')
  await expect(page).toHaveURL(/\/professor/)
  await page.goto('/')
  await expect(page).toHaveURL('/')
  await expect(page.getByTestId('landing-go-home')).toBeVisible()
})

test('FT-UI-02 after Sair, the next user on the same browser never sees the turmas of the previous one', { tag: ['@UI-02'] }, async ({ page }) => {
  const prof = await professorToken()
  const classroom = await createClassroom(prof, unique('Turma de A '))
  const first = await createStudent('alunoa')
  const second = await createStudent('alunob')
  await joinClassroom(first, classroom.join_code)

  await loginUi(page, first.username, first.password)
  await expect(page).toHaveURL('/inicio')
  await expect(page.getByRole('heading', { name: classroom.name })).toBeVisible()
  await page.getByTestId('nav-ranking').click()
  await expect(page.getByTestId('ranking-scope')).toContainText(classroom.name)
  await page.getByTestId('nav-sair').click()
  await expect(page).toHaveURL(/\/entrar/)

  // Same tab, no page.goto: the second user signs in on the screen the first one left.
  await page.getByTestId('login-username').fill(second.username)
  await page.getByTestId('login-password').fill(second.password)
  await page.getByTestId('login-submit').click()
  await expect(page).toHaveURL('/inicio')
  await expect(page.getByText(classroom.name)).toHaveCount(0)
  await expect(page.getByTestId('header-level')).toBeVisible()
  await expect(page.getByText(classroom.name)).toHaveCount(0)

  await page.getByTestId('nav-ranking').click()
  await expect(page.getByTestId('ranking-scope')).toBeVisible()
  await expect(page.getByTestId('ranking-scope')).not.toContainText(classroom.name)
  await page.getByTestId('nav-turmas').click()
  await expect(page.getByTestId('header-level')).toBeVisible()
  await expect(page.getByText(classroom.name)).toHaveCount(0)
})
