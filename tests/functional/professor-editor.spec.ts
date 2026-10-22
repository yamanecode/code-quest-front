import { expect, test, type Page } from '@playwright/test'
import {
  createChallenge,
  createClassroom,
  createMission,
  createStudent,
  joinClassroom,
  loginProfessorUi,
  professorToken,
  solveViaApi,
  unique,
  type ChallengeType,
} from './helpers'

const TYPES: ChallengeType[] = ['ordering', 'grouping', 'filtering', 'pattern']
const STATEMENT = 'Enunciado de teste com mais de vinte caracteres, claro e curto.'

async function openNew(page: Page, type: ChallengeType) {
  await loginProfessorUi(page)
  await page.goto('/professor/desafios/novo')
  await page.getByTestId('field-type').selectOption(type)
}

// Fills the type's editor with a valid challenge; the form starts with the minimum number of rows.
async function fillValid(page: Page, type: ChallengeType, title: string) {
  await page.getByTestId('field-title').fill(title)
  await page.getByTestId('field-statement').fill(STATEMENT)
  if (type === 'ordering') {
    await page.getByTestId('editor-item-0').fill('Pegar o pão')
    await page.getByTestId('editor-item-1').fill('Passar manteiga')
    await page.getByTestId('editor-item-2').fill('Fechar o sanduíche')
  } else if (type === 'grouping') {
    await page.getByTestId('editor-group-0').fill('Preparar')
    await page.getByTestId('editor-group-1').fill('Servir')
    const tasks = ['Lavar os legumes', 'Cortar os legumes', 'Pôr a mesa', 'Levar o prato']
    for (const [index, text] of tasks.entries()) {
      await page.getByTestId(`editor-item-${index}`).fill(text)
      await page.getByTestId(`editor-assign-${index}`).selectOption({ label: index < 2 ? 'Preparar' : 'Servir' })
    }
  } else if (type === 'filtering') {
    await page.getByTestId('editor-question').fill('Quantos ônibus a escola precisa alugar?')
    const infos = ['Vão 90 alunos', 'Cada ônibus leva 45 pessoas', 'A saída é às 7h', 'O ônibus é azul']
    for (const [index, text] of infos.entries()) await page.getByTestId(`editor-item-${index}`).fill(text)
    await page.getByTestId('editor-relevant-0').check()
    await page.getByTestId('editor-relevant-1').check()
  } else {
    for (const [index, text] of ['2', '4', '6'].entries()) await page.getByTestId(`editor-term-${index}`).fill(text)
    for (const [index, text] of ['8', '9', '10', '12'].entries()) await page.getByTestId(`editor-item-${index}`).fill(text)
    await page.getByTestId('editor-correct-0').check()
  }
}

for (const type of TYPES) {
  test(`FT-UI-11 the ${type} editor shows rule messages while typing and saves a draft`, { tag: ['@UI-11'] }, async ({ page }) => {
    await openNew(page, type)
    // an empty form already lists what is missing
    await expect(page.getByTestId('rule-errors')).toBeVisible()
    await expect(page.getByTestId('rules-ok')).toHaveCount(0)

    const title = unique(`Editor ${type} `)
    await fillValid(page, type, title)
    await expect(page.getByTestId('rules-ok')).toBeVisible()
    await expect(page.getByTestId('rule-errors')).toHaveCount(0)

    await page.getByTestId('save').click()
    await expect(page).toHaveURL(/\/professor\/desafios\/\d+$/)
    await expect(page.getByTestId('challenge-status')).toHaveText('Rascunho')
    await expect(page.getByTestId('field-title')).toHaveValue(title)

    await page.getByTestId('back-challenges').click()
    await expect(page.getByTestId('challenge-title').filter({ hasText: title })).toBeVisible()
  })
}

test('FT-UI-11 breaking a rule shows the message while typing and fixing it clears it', { tag: ['@UI-11'] }, async ({ page }) => {
  await openNew(page, 'pattern')
  await fillValid(page, 'pattern', unique('Regra '))
  await expect(page.getByTestId('rules-ok')).toBeVisible()

  // two options with the same text break the rule
  await page.getByTestId('editor-item-3').fill('8')
  await expect(page.getByTestId('rule-errors')).toBeVisible()
  await expect(page.getByTestId('rules-ok')).toHaveCount(0)
  await page.getByTestId('editor-item-3').fill('12')
  await expect(page.getByTestId('rules-ok')).toBeVisible()

  // a statement that is too short
  await page.getByTestId('field-statement').fill('curto')
  await expect(page.getByTestId('rule-errors')).toContainText(/enunciado/i)
})

test('FT-UI-11 "Revisar com IA" shows suggestions and changes nothing', { tag: ['@UI-11'] }, async ({ page }) => {
  const prof = await professorToken()
  const challenge = await createChallenge(prof, 'filtering', { publish: false })
  await loginProfessorUi(page)
  await page.goto(`/professor/desafios/${challenge.id}`)
  await expect(page.getByTestId('field-title')).toHaveValue(challenge.title)
  const titleBefore = await page.getByTestId('field-title').inputValue()
  const statementBefore = await page.getByTestId('field-statement').inputValue()

  await page.getByTestId('review').click()
  const panel = page.getByTestId('review-panel')
  await expect(panel).toBeVisible()
  await expect(panel).toContainText('só sugestões')
  await expect(page.getByTestId('review-suggestions')).not.toBeEmpty()

  await expect(page.getByTestId('field-title')).toHaveValue(titleBefore)
  await expect(page.getByTestId('field-statement')).toHaveValue(statementBefore)
  await expect(page.getByTestId('challenge-status')).toHaveText('Rascunho')
  await page.reload()
  await expect(page.getByTestId('field-title')).toHaveValue(titleBefore)
  await expect(page.getByTestId('challenge-status')).toHaveText('Rascunho')
})

for (const type of TYPES) {
  test(`FT-UI-11 "Gerar rascunho com IA" creates a ${type} draft that stays unpublished`, { tag: ['@UI-11'] }, async ({ page }) => {
    await openNew(page, type)
    await page.getByTestId('draft-type').selectOption(type)
    await page.getByTestId('draft-topic').fill('Receitas de bolo')
    await page.getByTestId('draft-submit').click()

    await expect(page).toHaveURL(/\/professor\/desafios\/\d+$/)
    await expect(page.getByTestId('challenge-status')).toHaveText('Rascunho')
    await expect(page.getByTestId('field-title')).not.toHaveValue('')

    await page.getByTestId('back-challenges').click()
    await page.getByTestId('filter-status').selectOption({ label: 'Publicado' })
    await expect(page.getByTestId('challenge-title').filter({ hasText: /Receitas de bolo/i })).toHaveCount(0)
    await page.getByTestId('filter-status').selectOption({ label: 'Rascunho' })
    await expect(page.locator('[data-testid^=challenge-]', { hasText: /Receitas de bolo/i }).first()).toBeVisible()
  })
}

test('FT-UI-11 an invalid AI draft shows the error and creates nothing', { tag: ['@UI-11'] }, async ({ page }) => {
  await openNew(page, 'ordering')
  await page.getByTestId('draft-topic').fill('[fake:invalid] qualquer tema')
  await page.getByTestId('draft-submit').click()
  await expect(page).toHaveURL(/\/professor\/desafios\/novo$/)
  await expect(page.getByRole('alert').first()).toBeVisible()
  await expect(page.getByRole('alert').first()).toContainText(/rascunho|IA|inválid/i)
})

test('FT-UI-11 the professor publishes a challenge and duplicates it into a new draft', { tag: ['@UI-11'] }, async ({ page }) => {
  await openNew(page, 'grouping')
  const title = unique('Original ')
  await fillValid(page, 'grouping', title)
  await page.getByTestId('save').click()
  await expect(page).toHaveURL(/\/professor\/desafios\/\d+$/)
  const originalUrl = page.url()

  await page.getByTestId('publish').click()
  await expect(page.getByTestId('challenge-status')).toHaveText('Publicado')
  await expect(page.getByTestId('form-status')).toHaveText('Desafio publicado.')

  await page.getByTestId('duplicate').click()
  await expect(page).not.toHaveURL(originalUrl)
  await expect(page.getByTestId('challenge-status')).toHaveText('Rascunho')
  await expect(page.getByTestId('field-title')).toHaveValue(`${title} (cópia)`)

  // the original is still published
  await page.goto(originalUrl)
  await expect(page.getByTestId('challenge-status')).toHaveText('Publicado')
})

test('FT-UI-11 a challenge already answered disables the structure fields and explains why', { tag: ['@UI-11'] }, async ({ page }) => {
  const prof = await professorToken()
  const challenge = await createChallenge(prof, 'ordering')
  const classroom = await createClassroom(prof)
  await createMission(prof, classroom.id, [challenge.id])
  const student = await createStudent()
  await joinClassroom(student, classroom.join_code)
  await solveViaApi(student, challenge)

  await loginProfessorUi(page)
  await page.goto(`/professor/desafios/${challenge.id}`)
  await expect(page.getByTestId('locked-note')).toHaveText(
    'Este desafio já foi respondido: só os textos podem mudar. Use Duplicar para alterar a estrutura.',
  )
  await expect(page.getByTestId('editor-add')).toBeDisabled()
  await expect(page.getByTestId('editor-remove-0')).toBeDisabled()
  await expect(page.getByTestId('editor-up-1')).toBeDisabled()
  await expect(page.getByTestId('editor-down-0')).toBeDisabled()

  // texts can still change, and Duplicar stays available
  await page.getByTestId('field-title').fill('Título corrigido')
  await page.getByTestId('editor-item-0').fill('Pegar o pão fresco')
  await page.getByTestId('save').click()
  await page.reload()
  await expect(page.getByTestId('field-title')).toHaveValue('Título corrigido')
  await expect(page.getByTestId('editor-item-0')).toHaveValue('Pegar o pão fresco')
  await expect(page.getByTestId('duplicate')).toBeEnabled()
})

test('FT-UI-11 a challenge nobody answered keeps its structure fields enabled', { tag: ['@UI-11'] }, async ({ page }) => {
  const prof = await professorToken()
  const challenge = await createChallenge(prof, 'ordering', { publish: false })
  await loginProfessorUi(page)
  await page.goto(`/professor/desafios/${challenge.id}`)
  await expect(page.getByTestId('field-title')).toBeVisible()
  await expect(page.getByTestId('locked-note')).toHaveCount(0)
  await expect(page.getByTestId('editor-add')).toBeEnabled()
  await expect(page.getByTestId('editor-down-0')).toBeEnabled()
})

test('FT-UI-11 the challenge list filters by type and status and shows how many got it right', { tag: ['@UI-11'] }, async ({ page }) => {
  const prof = await professorToken()
  const tag = unique('flt')
  const published = await createChallenge(prof, 'pattern', { title: `Publicado ${tag}` })
  const draft = await createChallenge(prof, 'filtering', { title: `Rascunho ${tag}`, publish: false })
  const classroom = await createClassroom(prof)
  await createMission(prof, classroom.id, [published.id])
  const student = await createStudent()
  await joinClassroom(student, classroom.join_code)
  await solveViaApi(student, published)

  await loginProfessorUi(page)
  await page.goto('/professor/desafios')
  await expect(page.getByTestId(`challenge-${published.id}`)).toBeVisible()
  await expect(page.getByTestId(`challenge-${published.id}`).getByTestId('challenge-stats')).toHaveText('1 de 1 acertaram')

  await page.getByTestId('filter-type').selectOption({ label: 'Abstração' })
  await expect(page.getByTestId(`challenge-${draft.id}`)).toBeVisible()
  await expect(page.getByTestId(`challenge-${published.id}`)).toHaveCount(0)

  await page.getByTestId('filter-type').selectOption({ label: 'Todos' })
  await page.getByTestId('filter-status').selectOption({ label: 'Publicado' })
  await expect(page.getByTestId(`challenge-${published.id}`)).toBeVisible()
  await expect(page.getByTestId(`challenge-${draft.id}`)).toHaveCount(0)
})
