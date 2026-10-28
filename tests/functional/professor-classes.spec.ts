import { expect, test } from '@playwright/test'
import {
  api,
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
  await page.getByTestId('new-classroom-open').click()
  await page.getByTestId('new-classroom-name').fill(name)
  await page.getByTestId('create-classroom-submit').click()

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
  await page.getByTestId('ranking-tab-month').click()
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
  await page.getByTestId('new-mission-open').click()
  await page.getByTestId('new-mission-title').fill(title)
  await page.getByTestId('create-mission-submit').click()
  await page.locator('[data-testid^=mission-title]', { hasText: title }).click()
  await expect(page.getByTestId('mission-heading')).toHaveText(title)

  // blocked while empty
  await page.getByTestId('mission-publish').click()
  await expect(page.getByTestId('mission-errors')).toHaveText('A missão precisa de pelo menos um desafio publicado.')
  await expect(page.getByTestId('mission-status')).toHaveText('Rascunho')

  // a draft challenge still does not count; "Criar desafio" keeps the mission context
  await page.getByTestId('mission-create-challenge').click()
  await expect(page).toHaveURL(/\/professor\/desafios\/novo\?missao=\d+$/)
  await page.getByTestId('draft-topic').fill('Receitas de bolo')
  await page.getByTestId('draft-submit').click()
  await expect(page).toHaveURL(/\/professor\/desafios\/\d+\?missao=\d+$/)
  const draftId = Number(/desafios\/(\d+)/.exec(page.url())![1])
  await page.getByTestId('back-mission').click()
  await expect(page.getByTestId(`mission-challenge-${draftId}`)).toBeVisible()
  await page.getByTestId('mission-publish').click()
  await expect(page.getByTestId('mission-status')).toHaveText('Rascunho')

  // remove it and add a published one through the list; drafts are not offered
  await page.getByTestId(`mission-remove-${draftId}`).click()
  await expect(page.getByTestId(`mission-challenge-${draftId}`)).toHaveCount(0)
  const published = await createChallenge(prof, 'grouping', { title: unique('Publicado ') })
  await page.reload()
  await page.getByTestId('mission-add-open').click()
  await expect(page.getByTestId('add-challenges-dialog')).toBeVisible()
  await expect(page.getByTestId(`add-row-${draftId}`)).toHaveCount(0)
  await page.getByTestId(`add-check-${published.id}`).check()
  await page.getByTestId('add-confirm').click()
  await expect(page.getByTestId('add-challenges-dialog')).toHaveCount(0)
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

test('FT-UI-10 a mission moved with the arrows keeps its new place after a reload', { tag: ['@UI-10'] }, async ({ page }) => {
  const token = await professorToken()
  const classroom = await createClassroom(token)
  const first = await createMission(token, classroom.id, [], { title: unique('Primeira '), publish: false })
  const second = await createMission(token, classroom.id, [], { title: unique('Segunda '), publish: false })

  await loginProfessorUi(page)
  await page.goto(`/professor/turmas/${classroom.id}`)
  await expect(page.getByTestId('mission-title')).toHaveText([first.title, second.title])

  await page.getByTestId(`mission-down-${first.id}`).click()
  await expect(page.getByTestId('mission-title')).toHaveText([second.title, first.title])

  await page.reload()
  await expect(page.getByTestId('mission-title')).toHaveText([second.title, first.title])
})

test('FT-UI-30 closing a class asks first, blocks the code for new students and keeps the members; reopening restores it', { tag: ['@UI-30'] }, async ({ page, browser }) => {
  const token = await professorToken()
  const classroom = await createClassroom(token)
  const member = await createStudent()
  await joinClassroom(member, classroom.join_code)
  const newcomer = await createStudent()

  await loginProfessorUi(page)
  await page.goto(`/professor/turmas/${classroom.id}`)
  await expect(page.getByTestId('classroom-closed-badge')).toHaveCount(0)

  await page.getByTestId('classroom-close').click()
  await page.getByTestId('close-dialog-cancel').click()
  await expect(page.getByTestId('classroom-closed-badge')).toHaveCount(0)

  await page.getByTestId('classroom-close').click()
  await page.getByTestId('close-dialog-confirm').click()
  await expect(page.getByTestId('classroom-closed-badge')).toBeVisible()
  await expect(page.getByTestId('classroom-goal-closed')).toHaveText('Turma encerrada')
  await expect(page.getByTestId('classroom-reopen')).toBeVisible()

  await page.goto('/professor')
  await expect(page.getByTestId(`classroom-${classroom.id}`).getByTestId('classroom-closed-badge')).toBeVisible()

  // a new student is refused; a member keeps the class
  const newcomerContext = await browser.newContext()
  const newcomerPage = await newcomerContext.newPage()
  await loginStudentUi(newcomerPage, newcomer)
  await newcomerPage.goto('/turmas')
  await newcomerPage.getByTestId('join-code').fill(classroom.join_code)
  await newcomerPage.getByTestId('join-submit').click()
  await expect(newcomerPage.getByTestId('join-error')).toContainText('Código de turma inválido')

  const memberContext = await browser.newContext()
  const memberPage = await memberContext.newPage()
  await loginStudentUi(memberPage, member)
  await memberPage.goto('/turmas')
  await expect(memberPage.getByTestId(`classroom-${classroom.id}`)).toBeVisible()

  // reopening makes the code work again
  await page.goto(`/professor/turmas/${classroom.id}`)
  await page.getByTestId('classroom-reopen').click()
  await expect(page.getByTestId('classroom-closed-badge')).toHaveCount(0)
  await newcomerPage.getByTestId('join-submit').click()
  await expect(newcomerPage.getByTestId('classroom-name')).toHaveText(classroom.name)

  await newcomerContext.close()
  await memberContext.close()
})

test('FT-UI-31 the student sees that the turma is closed, and its missions stay playable', { tag: ['@UI-31'] }, async ({ page }) => {
  const token = await professorToken()
  const challenge = await createChallenge(token, 'pattern')
  const classroom = await createClassroom(token)
  await createMission(token, classroom.id, [challenge.id], { title: 'Missão da turma encerrada' })
  const student = await createStudent()
  await joinClassroom(student, classroom.join_code)
  await api(`/api/professor/classrooms/${classroom.id}/close`, { token, method: 'POST' })

  await loginStudentUi(page, student)
  await page.goto('/turmas')
  const item = page.getByTestId(`classroom-${classroom.id}`)
  await expect(item.getByTestId('classroom-closed-badge')).toBeVisible()
  await expect(item.getByTestId('classroom-closed-note')).toContainText('O professor encerrou esta turma')

  await page.goto('/inicio')
  await expect(page.getByTestId(`home-closed-${classroom.id}`)).toContainText('Encerrada')
  await expect(page.getByTestId(`home-classroom-${classroom.id}`)).toContainText('Missão da turma encerrada')
})

test('FT-UI-32 the professor removes a student only after typing the username; the student keeps the account', { tag: ['@UI-32'] }, async ({ page, browser }) => {
  const token = await professorToken()
  const classroom = await createClassroom(token)
  const student = await createStudent()
  await joinClassroom(student, classroom.join_code)

  await loginProfessorUi(page)
  await page.goto(`/professor/turmas/${classroom.id}`)
  await page.getByTestId(`member-remove-${student.username}`).click()
  const confirm = page.getByTestId('remove-member-submit')
  await expect(confirm).toBeDisabled()
  await page.getByTestId('remove-member-name').fill(student.username.slice(0, -1))
  await expect(confirm).toBeDisabled()
  await page.getByTestId('remove-member-name').fill(student.username)
  await expect(confirm).toBeEnabled()
  await confirm.click()
  await expect(page.getByTestId(`progress-${student.username}`)).toHaveCount(0)

  const context = await browser.newContext()
  const studentPage = await context.newPage()
  await loginStudentUi(studentPage, student)
  await studentPage.goto('/turmas')
  await expect(studentPage.getByTestId(`classroom-${classroom.id}`)).toHaveCount(0)
  await context.close()
})

test('FT-UI-33 a new join code needs a confirmation, shows the new code and the old one stops working', { tag: ['@UI-33'] }, async ({ page, browser }) => {
  const token = await professorToken()
  const classroom = await createClassroom(token)

  await loginProfessorUi(page)
  await page.goto(`/professor/turmas/${classroom.id}`)
  await expect(page.getByTestId('join-code')).toHaveText(classroom.join_code)

  await page.getByTestId('renew-code').click()
  await page.getByTestId('code-dialog-cancel').click()
  await expect(page.getByTestId('join-code')).toHaveText(classroom.join_code)

  await page.getByTestId('renew-code').click()
  await page.getByTestId('code-dialog-confirm').click()
  await expect(page.getByTestId('join-code')).not.toHaveText(classroom.join_code)
  const fresh = await page.getByTestId('join-code').innerText()
  expect(fresh).toMatch(/^[A-Z0-9]{6}$/)

  const student = await createStudent()
  const context = await browser.newContext()
  const studentPage = await context.newPage()
  await loginStudentUi(studentPage, student)
  await studentPage.goto('/turmas')
  await studentPage.getByTestId('join-code').fill(classroom.join_code)
  await studentPage.getByTestId('join-submit').click()
  await expect(studentPage.getByTestId('join-error')).toContainText('Código de turma inválido')
  await studentPage.getByTestId('join-code').fill(fresh)
  await studentPage.getByTestId('join-submit').click()
  await expect(studentPage.getByTestId('classroom-name')).toHaveText(classroom.name)
  await context.close()
})
