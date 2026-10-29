import { expect, test } from '@playwright/test'
import { api, createStudent, loginStudentUi, loginUi, STUDENT_PASSWORD, unique } from './helpers'

const CODE_FORMAT = /^[A-Z0-9]{4}(-[A-Z0-9]{4}){3}$/

test('FT-UI-40 sign-up shows the recovery code once, covered, and the home opens only after it is saved', { tag: ['@UI-40'] }, async ({ page }) => {
  await page.goto('/cadastro')
  await page.getByTestId('signup-username').fill(unique('rc'))
  await page.getByTestId('signup-password').fill(STUDENT_PASSWORD)
  await page.getByTestId('signup-submit').click()

  const modal = page.getByTestId('recovery-modal')
  await expect(modal).toBeVisible()
  await expect(page).toHaveURL(/\/cadastro/)
  await expect(page.getByTestId('recovery-code-text')).toHaveText('••••-••••-••••-••••')
  await expect(page.getByTestId('recovery-copy')).toHaveCount(0)

  await page.getByTestId('recovery-toggle').click()
  const code = (await page.getByTestId('recovery-code-text').textContent()) ?? ''
  expect(code).toMatch(CODE_FORMAT)
  await expect(page.getByTestId('recovery-copy')).toBeVisible()

  await expect(page.getByTestId('recovery-continue')).toBeDisabled()
  await page.keyboard.press('Escape')
  await expect(modal).toBeVisible()

  await page.getByTestId('recovery-confirm-check').check()
  await page.getByTestId('recovery-continue').click()
  await expect(page).toHaveURL('/inicio')
  await expect(page.getByTestId('recovery-pending')).toHaveCount(0) // confirmed: no reminder

  // Nothing about the code stays in the address or the browser storage.
  expect(page.url()).not.toContain(code)
  const stored = await page.evaluate(() => JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }))
  expect(stored).not.toContain(code)
})

test('FT-UI-41 a forgotten password is reset with the code; the student confirms the new code and lands on the home logged in', { tag: ['@UI-41'] }, async ({ page }) => {
  const student = await createStudent('rs')
  await page.goto('/entrar')
  await page.getByTestId('login-forgot-link').click()
  await expect(page).toHaveURL('/recuperar-senha')

  // A wrong code: one fixed message that does not say which part is wrong.
  await page.getByTestId('reset-username').fill(student.username)
  await page.getByTestId('reset-code').fill('AAAA-BBBB-CCCC-DDDD')
  await page.getByTestId('reset-password').fill('nova-senha-77')
  await page.getByTestId('reset-submit').click()
  await expect(page.getByTestId('reset-error')).toHaveText('Usuário ou código de recuperação inválido.')

  // The right code, typed in lower case without hyphens.
  await page.getByTestId('reset-code').fill(student.recoveryCode.toLowerCase().replaceAll('-', ''))
  await page.getByTestId('reset-submit').click()
  await expect(page.getByTestId('recovery-modal')).toBeVisible()
  await page.getByTestId('recovery-toggle').click()
  const replacement = (await page.getByTestId('recovery-code-text').textContent()) ?? ''
  expect(replacement).toMatch(CODE_FORMAT)
  expect(replacement).not.toBe(student.recoveryCode)
  await page.getByTestId('recovery-confirm-check').check()
  await page.getByTestId('recovery-continue').click()

  // Already logged in with the new password, and the new code counts as saved: no reminder.
  await expect(page).toHaveURL('/inicio')
  await expect(page.getByTestId('header-level')).toBeVisible()
  await expect(page.getByTestId('recovery-pending')).toHaveCount(0)
  await page.goto('/perfil')
  await expect(page.getByTestId('recovery-status')).toContainText('ativo')
  await expect(page.getByTestId('recovery-unconfirmed')).toHaveCount(0)

  // The old password stops working, the new one works, and the old code is spent.
  await page.getByTestId('nav-sair').click()
  await expect(page).toHaveURL('/entrar')
  await loginUi(page, student.username, student.password)
  await expect(page.getByRole('alert')).toContainText(/incorret|inválid|senha/i)
  await loginUi(page, student.username, 'nova-senha-77')
  await expect(page).toHaveURL('/inicio')
  const again = await api('/api/auth/reset-password', {
    body: { username: student.username, recovery_code: student.recoveryCode, new_password: 'outra-senha-88' },
  })
  expect(again.status).toBe(400)
})

test('FT-UI-41 a logged-in user who opens /recuperar-senha is sent home', { tag: ['@UI-41'] }, async ({ page }) => {
  const student = await createStudent('rg')
  await loginStudentUi(page, student)
  await page.goto('/recuperar-senha')
  await expect(page).toHaveURL('/inicio')
})

test('FT-UI-42 the profile generates a new code with the password and the old code stops working', { tag: ['@UI-42'] }, async ({ page }) => {
  const student = await createStudent('rp')
  await loginStudentUi(page, student)
  await page.goto('/perfil')
  await expect(page.getByTestId('recovery-status')).toContainText('Código de recuperação ativo desde')

  // Wrong password: the error stays under the field and the session is kept.
  await page.getByTestId('recovery-generate').click()
  await page.getByTestId('recovery-password').fill('senha-errada-99')
  await page.getByTestId('recovery-generate-submit').click()
  await expect(page.getByTestId('recovery-generate-error')).toContainText('Senha incorreta')
  await expect(page).toHaveURL('/perfil')

  await page.getByTestId('recovery-password').fill(student.password)
  await page.getByTestId('recovery-generate-submit').click()
  await expect(page.getByTestId('recovery-modal')).toBeVisible()
  await page.getByTestId('recovery-toggle').click()
  const fresh = (await page.getByTestId('recovery-code-text').textContent()) ?? ''
  expect(fresh).toMatch(CODE_FORMAT)
  expect(fresh).not.toBe(student.recoveryCode)

  await page.getByTestId('recovery-confirm-check').check()
  await page.getByTestId('recovery-continue').click()
  await expect(page.getByTestId('recovery-modal')).toHaveCount(0)
  await expect(page.getByTestId('recovery-unconfirmed')).toHaveCount(0)

  const old = await api('/api/auth/reset-password', {
    body: { username: student.username, recovery_code: student.recoveryCode, new_password: 'outra-senha-88' },
  })
  expect(old.status).toBe(400)
})

test('FT-UI-43 a student with an unconfirmed code sees the reminder; "Depois" hides it for the session', { tag: ['@UI-43'] }, async ({ page }) => {
  const student = await createStudent('rl', { confirmCode: false })
  await loginStudentUi(page, student)
  await page.goto('/inicio')

  const reminder = page.getByTestId('recovery-pending')
  await expect(reminder).toBeVisible()
  await page.getByTestId('recovery-pending-later').click()
  await expect(reminder).toHaveCount(0)

  await page.goto('/ranking')
  await page.goto('/inicio')
  await expect(page.getByTestId('header-level')).toBeVisible()
  await expect(reminder).toHaveCount(0)

  // A new login brings it back, and "Ir para o perfil" opens the profile card.
  await page.evaluate(() => sessionStorage.clear())
  await page.reload()
  await expect(reminder).toBeVisible()
  await page.getByTestId('recovery-pending-profile').click()
  await expect(page).toHaveURL('/perfil')
  await expect(page.getByTestId('recovery-unconfirmed')).toBeVisible()
  await expect(page.getByTestId('recovery-pending')).toHaveCount(0) // not on the profile
})
