import { expect, test, type Page } from '@playwright/test'
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
  type ChallengeType,
} from './helpers'

const TYPES: ChallengeType[] = ['ordering', 'grouping', 'filtering', 'pattern']

// Controls that must have an accessible name; the ARIA snapshot prints an unnamed one without quotes.
const NAMED_ROLES = /^\s*- (button|combobox|checkbox|radio|textbox|link|switch|spinbutton)\b(?!\s+")/

// Typical English interface words that must not appear in the visible text.
const ENGLISH = /\b(Submit|Login|Log in|Sign in|Sign up|Loading|Cancel|Close|Next|Save|Delete|Settings|Welcome|Password|Username|Search|Confirm|Retry|Try again)\b/

async function expectAccessible(page: Page, label: string) {
  await page.waitForLoadState('networkidle')
  await expect(page.locator('html')).toHaveAttribute('lang', /^pt/)

  const snapshot = await page.locator('body').ariaSnapshot()
  const unnamed = snapshot.split('\n').filter((line) => NAMED_ROLES.test(line))
  expect(unnamed, `${label}: controls without an accessible name`).toEqual([])

  // every form control is reachable by label, not only by a test id
  const loose = await page.evaluate(() =>
    [...document.querySelectorAll('input, select, textarea')]
      .filter((el) => (el as HTMLInputElement).type !== 'hidden')
      .filter((el) => {
        const e = el as HTMLInputElement
        return !(e.labels && e.labels.length) && !e.getAttribute('aria-label') && !e.getAttribute('aria-labelledby')
      })
      .map((el) => el.getAttribute('data-testid') ?? el.tagName),
  )
  expect(loose, `${label}: form controls without a label`).toEqual([])

  const text = await page.locator('body').innerText()
  expect(text.match(ENGLISH)?.[0] ?? null, `${label}: English text`).toBeNull()
}

test('FT-UI-13 public screens are in Portuguese and every control has an accessible name', { tag: ['@UI-13'] }, async ({ page }) => {
  for (const path of ['/entrar', '/cadastro']) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 2 })).toBeVisible()
    await expectAccessible(page, path)
  }
  // the theme button names the action, not just an icon
  await expect(page.getByTestId('theme-toggle')).toHaveAccessibleName(/modo (escuro|claro)/i)

  // the landing page and the limitations page are public too
  for (const path of ['/', '/limitacoes']) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expectAccessible(page, path)
  }
})

test('FT-UI-13 student screens are in Portuguese and every control has an accessible name', { tag: ['@UI-13'] }, async ({ page }) => {
  const prof = await professorToken()
  const classroom = await createClassroom(prof)
  const challenges = []
  for (const type of TYPES) challenges.push(await createChallenge(prof, type))
  const mission = await createMission(prof, classroom.id, challenges.map((c) => c.id))
  const student = await createStudent()
  await joinClassroom(student, classroom.join_code)
  await solveViaApi(student, challenges[0]!)
  await loginStudentUi(page, student)

  const paths = ['/inicio', '/turmas', `/missoes/${mission.id}`, '/perfil', '/ranking', '/ajuda', ...challenges.map((c) => `/desafios/${c.id}`)]
  for (const path of paths) {
    await page.goto(path)
    await expect(page.getByTestId('nav-sair')).toBeVisible()
    await expectAccessible(page, path)
  }
})

test('FT-UI-13 the challenge screens label every answer control and announce the feedback', { tag: ['@UI-13'] }, async ({ page }) => {
  const prof = await professorToken()
  const classroom = await createClassroom(prof)
  const challenges = []
  for (const type of TYPES) challenges.push(await createChallenge(prof, type))
  await createMission(prof, classroom.id, challenges.map((c) => c.id))
  const student = await createStudent()
  await joinClassroom(student, classroom.join_code)
  await loginStudentUi(page, student)

  for (const challenge of challenges) {
    await page.goto(`/desafios/${challenge.id}`)
    await expect(page.getByTestId('challenge-title')).toBeVisible()
    const spec = challenge.spec
    if (spec.type === 'ordering') {
      for (const step of spec.steps) {
        await expect(page.getByRole('button', { name: `Mover para cima: ${step}` })).toBeVisible()
        await expect(page.getByRole('button', { name: `Mover para baixo: ${step}` })).toBeVisible()
      }
    } else if (spec.type === 'grouping') {
      for (const text of Object.keys(spec.assignment)) await expect(page.getByLabel(`Etapa de: ${text}`)).toBeVisible()
    } else if (spec.type === 'filtering') {
      for (const text of [...spec.relevant, ...spec.irrelevant]) await expect(page.getByRole('checkbox', { name: text })).toBeVisible()
    } else {
      for (const text of [spec.correct, ...spec.wrong]) await expect(page.getByRole('radio', { name: text, exact: true })).toBeVisible()
    }
    await expect(page.getByRole('button', { name: 'Enviar' })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Dica/ })).toBeVisible()

    // feedback lives in a live region
    const region = page.getByTestId('feedback-region')
    await expect(region).toHaveAttribute('aria-live', /polite|assertive/)
  }
})

test('FT-UI-13 professor screens are in Portuguese and every control has an accessible name', { tag: ['@UI-13'] }, async ({ page }) => {
  const prof = await professorToken()
  const classroom = await createClassroom(prof)
  const challenge = await createChallenge(prof, 'pattern')
  const mission = await createMission(prof, classroom.id, [challenge.id])
  const student = await createStudent()
  await joinClassroom(student, classroom.join_code)
  await solveViaApi(student, challenge)

  await loginProfessorUi(page)
  const paths = [
    '/professor',
    `/professor/turmas/${classroom.id}`,
    `/professor/missoes/${mission.id}`,
    '/professor/desafios',
    `/professor/desafios/${challenge.id}`,
    '/ajuda',
  ]
  for (const path of paths) {
    await page.goto(path)
    await expect(page.getByTestId('theme-toggle')).toBeVisible()
    await expectAccessible(page, path)
  }

  // each editor
  for (const type of TYPES) {
    await page.goto('/professor/desafios/novo')
    await page.getByTestId('field-type').selectOption(type)
    await expectAccessible(page, `editor ${type}`)
  }
})
