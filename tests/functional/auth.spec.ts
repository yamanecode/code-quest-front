import { expect, test } from '@playwright/test'
import { createStudent, loginProfessorUi, loginUi, STUDENT_PASSWORD, unique } from './helpers'

test('FT-UI-01 a visitor signs up with username and password and lands on the student home', { tag: ['@UI-01'] }, async ({ page }) => {
  await page.goto('/cadastro')
  await expect(page.getByTestId('signup-real-name-warning')).toContainText('nome real')
  await expect(page.getByTestId('signup-username')).toBeVisible()
  await expect(page.getByTestId('signup-password')).toBeVisible()

  await page.getByTestId('signup-username').fill(unique('novo'))
  await page.getByTestId('signup-password').fill(STUDENT_PASSWORD)
  await page.getByTestId('signup-submit').click()

  await expect(page).toHaveURL('/')
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
  await expect(page).toHaveURL('/')
})

test('FT-UI-02 a visitor is sent to the login screen', { tag: ['@UI-02'] }, async ({ page }) => {
  for (const path of ['/', '/turmas', '/ranking', '/perfil', '/professor']) {
    await page.goto(path)
    await expect(page).toHaveURL(/\/entrar/)
  }
})

test('FT-UI-02 a student cannot open professor screens', { tag: ['@UI-02'] }, async ({ page }) => {
  const student = await createStudent()
  await loginUi(page, student.username, student.password)
  await expect(page).toHaveURL('/')

  await page.goto('/professor')
  await expect(page).not.toHaveURL(/\/professor/)
  await page.goto('/professor/desafios/novo')
  await expect(page).not.toHaveURL(/\/professor/)
})

test('FT-UI-02 a professor lands on the professor home', { tag: ['@UI-02'] }, async ({ page }) => {
  await loginProfessorUi(page)
  await expect(page).toHaveURL('/professor')
  await page.goto('/')
  await expect(page).toHaveURL(/\/professor/)
})
