import { expect, test } from '@playwright/test'
import { createStudent, loginProfessorUi, loginUi } from './helpers'

test('FT-UI-20 a visitor opens the landing page at the root, with the quote and the four skills', { tag: ['@UI-20'] }, async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL('/')

  await expect(page.getByTestId('hero-quote')).toContainText('Pensamento computacional é uma habilidade fundamental')
  await expect(page.getByTestId('hero-source')).toContainText('Jeannette M. Wing')
  for (const label of ['Pensamento algorítmico', 'Decomposição', 'Abstração', 'Reconhecimento de padrões']) {
    await expect(page.locator('#habilidades')).toContainText(label)
  }
  await expect(page.getByTestId('hero-signup')).toHaveAttribute('href', '/cadastro')
  await expect(page.getByTestId('hero-login')).toHaveAttribute('href', '/entrar')
  await expect(page.locator('body')).not.toContainText(/protótipo/i)
})

test('FT-UI-20 the demo challenge grades an answer and gives XP, with no free-text field', { tag: ['@UI-20'] }, async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('demo-tab-pattern').click()
  await expect(page.getByTestId('demo-submit')).toBeDisabled()

  await page.getByText('Terça', { exact: true }).click()
  await page.getByTestId('demo-submit').click()

  await expect(page.getByTestId('feedback-xp')).toContainText('+10 XP')
  await expect(page.getByTestId('demo-feedback')).toContainText('Por que essa é a resposta')
  await expect(page.locator('textarea, input[type="text"]')).toHaveCount(0)
})

test('FT-UI-20 a wrong answer in the demo shows the automatic hint once', { tag: ['@UI-20'] }, async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('demo-tab-pattern').click()

  await page.getByText('Segunda', { exact: true }).click()
  await page.getByTestId('demo-submit').click()
  await expect(page.getByTestId('feedback-wrong')).toBeVisible()
  await expect(page.getByTestId('feedback-hint')).toBeVisible()

  await page.getByTestId('feedback-retry').click()
  await page.getByTestId('demo-submit').click()
  await expect(page.getByTestId('feedback-wrong')).toBeVisible()
  await expect(page.getByTestId('feedback-hint')).toHaveCount(0)
})

test('FT-UI-20 choosing a core of the Octalysis shows what it means and how the platform uses it', { tag: ['@UI-20'] }, async ({ page }) => {
  await page.goto('/')
  const detail = page.getByTestId('octalysis-detail')
  await expect(detail).toContainText('Desenvolvimento e realização')

  await page.getByTestId('octalysis-core-8').click()
  await expect(page.getByTestId('octalysis-core-8')).toHaveAttribute('aria-pressed', 'true')
  await expect(detail).toContainText('Perda e prevenção')
  await expect(detail).toContainText('Sem vidas')

  await page.getByTestId('octalysis-wedge-5').click()
  await expect(detail).toContainText('Influência social e pertencimento')
})

test('FT-UI-20 the hint demo counts down after each hint', { tag: ['@UI-20'] }, async ({ page }) => {
  await page.goto('/')
  const button = page.getByTestId('hint-demo-button')
  await button.scrollIntoViewIfNeeded()

  await button.click()
  await expect(page.getByTestId('hint-demo-1')).toBeVisible()
  await expect(button).toBeDisabled()
  await expect(button).toContainText(/Dica em \d s/)
  await expect(button).toHaveText('Dica', { timeout: 8_000 })
  await expect(button).toBeEnabled()
})

test('FT-UI-20 on a phone the sections sit behind a menu button that closes on choosing a link', { tag: ['@UI-20'] }, async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const menu = page.getByTestId('landing-menu-button')

  await expect(page.getByTestId('landing-nav')).toBeHidden()
  await menu.click()
  await expect(menu).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByTestId('landing-nav')).toBeVisible()

  await page.getByTestId('landing-link-octalysis').click()
  await expect(menu).toHaveAttribute('aria-expanded', 'false')
  await expect(page.getByTestId('landing-header')).toBeInViewport()
})

test('FT-UI-20 a logged-in student who opens the root goes to the home, and a professor to theirs', { tag: ['@UI-20'] }, async ({ page }) => {
  const student = await createStudent()
  await loginUi(page, student.username, student.password)
  await expect(page).toHaveURL('/inicio')

  await page.goto('/')
  await expect(page).toHaveURL('/inicio')

  await page.getByTestId('nav-sair').click()
  await loginProfessorUi(page)
  await page.goto('/')
  await expect(page).toHaveURL(/\/professor/)
})

test('FT-UI-21 the limitations page opens from the top bar and states that the AI provider has a cost', { tag: ['@UI-21'] }, async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('landing-link-limitacoes').click()
  await expect(page).toHaveURL('/limitacoes')

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Limitações')
  await expect(page.getByTestId('limitation-provedor-ia')).toContainText('provedor de IA')
  await expect(page.getByTestId('limitation-provedor-ia')).toContainText('custo')
  await expect(page.getByTestId('limitation-comercial')).toContainText('Não é um produto comercial')
  await expect(page.locator('body')).not.toContainText(/protótipo/i)

  await page.getByTestId('limitations-back').click()
  await expect(page).toHaveURL('/')
})

test('FT-UI-21 a logged-in student can open the limitations page and go back to the home', { tag: ['@UI-21'] }, async ({ page }) => {
  const student = await createStudent()
  await loginUi(page, student.username, student.password)

  await page.goto('/limitacoes')
  await expect(page).toHaveURL('/limitacoes')
  await expect(page.getByTestId('limitation-dicas')).toBeVisible()

  await page.getByTestId('limitations-back').click()
  await expect(page).toHaveURL('/inicio')
})
