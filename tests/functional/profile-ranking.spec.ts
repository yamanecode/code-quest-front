import { expect, test } from '@playwright/test'
import {
  createChallenge,
  createClassroom,
  createMission,
  createStudent,
  joinClassroom,
  loginStudentUi,
  professorToken,
  solveViaApi,
  type Student,
} from './helpers'

// A turma of six students where student i has solved i challenges (10 XP each): XP 0, 10, ..., 50.
async function rankedClass() {
  const prof = await professorToken()
  const classroom = await createClassroom(prof)
  const challenges = []
  for (let i = 0; i < 5; i++) challenges.push(await createChallenge(prof, 'ordering'))
  await createMission(prof, classroom.id, challenges.map((c) => c.id))
  const students: Student[] = []
  for (let i = 0; i <= 5; i++) {
    const student = await createStudent('rk')
    await joinClassroom(student, classroom.join_code)
    for (const challenge of challenges.slice(0, i)) await solveViaApi(student, challenge)
    students.push(student)
  }
  return { classroom, students }
}

test('FT-UI-08 the profile shows level, title, XP, streak, skills, first-try solves and the badge collection', { tag: ['@UI-08'] }, async ({ page }) => {
  const prof = await professorToken()
  const classroom = await createClassroom(prof)
  const first = await createChallenge(prof, 'ordering')
  const second = await createChallenge(prof, 'pattern')
  await createMission(prof, classroom.id, [first.id, second.id])
  const student = await createStudent()
  await joinClassroom(student, classroom.join_code)
  await solveViaApi(student, first) // first try: 10 XP
  await solveViaApi(student, second, true) // one wrong answer first: 5 XP

  await loginStudentUi(page, student)
  await page.getByTestId('nav-perfil').click()
  await expect(page.getByTestId('profile-username')).toContainText(student.username)
  await expect(page.getByTestId('profile-level')).toContainText('Nível 1')
  await expect(page.getByTestId('profile-title')).toContainText('Aprendiz')
  await expect(page.getByTestId('profile-xp')).toContainText('15 XP')
  await expect(page.getByTestId('profile-xp')).toContainText('faltam 35')
  await expect(page.getByTestId('profile-streak')).toContainText('1')
  await expect(page.getByTestId('profile-first-try')).toContainText('1')

  await expect(page.getByTestId('skill-progress-ordering')).toContainText('1 resolvido')
  await expect(page.getByTestId('skill-progress-pattern')).toContainText('1 resolvido')
  await expect(page.getByTestId('skill-progress-grouping')).toContainText('0 resolvidos')

  // badges: earned one, locked ones with their condition, secret ones without it
  // first solve, first mission, class goal and the hidden "no hint" badge (the mission was finished)
  await expect(page.getByTestId('profile-badge-count')).toContainText('4 de 30')
  await expect(page.getByTestId('badge-mission_1')).not.toContainText('ainda não conquistada')
  await expect(page.getByTestId('badge-first_solve')).toContainText(/Conquistada em/)
  await expect(page.getByTestId('badge-first_solve')).not.toContainText('ainda não conquistada')
  await page.getByTestId('badges-others-toggle').click()
  await expect(page.getByTestId('badge-skill_ordering_3')).toContainText('ainda não conquistada')
  await expect(page.getByTestId('badge-skill_ordering_3').getByTestId('badge-condition')).toContainText('Resolva 3 desafios')
  await expect(page.getByTestId('badge-all_types_day')).toContainText('Insígnia secreta')
  await expect(page.getByTestId('badge-all_types_day').getByTestId('badge-condition')).toHaveCount(0)
  // a hidden badge that was earned shows its name
  await expect(page.getByTestId('badge-no_hint_mission')).toContainText('Por conta própria')
  // badges always appear next to level, title and XP
  await expect(page.getByTestId('profile-level')).toBeVisible()
  await expect(page.getByTestId('profile-title')).toBeVisible()
})

test('FT-UI-09 the ranking of a class shows me and up to two above and below, with me highlighted', { tag: ['@UI-09'] }, async ({ page }) => {
  const { classroom, students } = await rankedClass()
  const me = students[2]! // 20 XP: position 4 of 6
  await loginStudentUi(page, me)
  await page.goto('/ranking')
  await page.getByTestId('ranking-scope').selectOption({ label: classroom.name })

  // above: 40 and 30 XP; below: 10 and 0 XP; the leader (50 XP) is out of the window
  for (const index of [4, 3, 2, 1, 0]) {
    await expect(page.getByTestId(`ranking-entry-${students[index]!.username}`)).toBeVisible()
  }
  await expect(page.getByTestId(`ranking-entry-${students[5]!.username}`)).toHaveCount(0)
  await expect(page.getByTestId(`ranking-entry-${me.username}`)).toContainText('Você')
  await expect(page.getByTestId(`ranking-entry-${students[3]!.username}`)).not.toContainText('Você')
  await expect(page.getByTestId(`ranking-entry-${me.username}`)).toContainText('20 XP')
  await expect(page.getByTestId('ranking-empty')).toHaveCount(0)
})

test('FT-UI-09 scope selector has the general ranking and each class, with weekly and monthly tabs', { tag: ['@UI-09'] }, async ({ page }) => {
  const { classroom, students } = await rankedClass()
  await loginStudentUi(page, students[5]!)
  await page.goto('/ranking')

  const scope = page.getByTestId('ranking-scope')
  await expect(scope.locator('option')).toContainText(['Geral', classroom.name])
  await expect(page.getByTestId('ranking-tab-week')).toBeVisible()
  await expect(page.getByTestId('ranking-tab-month')).toBeVisible()

  await scope.selectOption({ label: classroom.name })
  await expect(page.getByTestId(`ranking-entry-${students[5]!.username}`)).toContainText('50 XP')
  await page.getByTestId('ranking-tab-month').click()
  await expect(page.getByTestId('ranking-tab-month')).toHaveAttribute('aria-selected', 'true').catch(async () => {
    await expect(page.getByTestId('ranking-tab-month')).toHaveAttribute('aria-pressed', 'true')
  })
  await expect(page.getByTestId(`ranking-entry-${students[5]!.username}`)).toContainText('50 XP')
  await page.getByTestId('ranking-tab-week').click()
  await expect(page.getByTestId(`ranking-entry-${students[5]!.username}`)).toContainText('50 XP')
})

test('FT-UI-09 when every entry has 0 XP a message explains how to enter the ranking', { tag: ['@UI-09'] }, async ({ page }) => {
  const prof = await professorToken()
  const classroom = await createClassroom(prof)
  const challenge = await createChallenge(prof, 'filtering')
  await createMission(prof, classroom.id, [challenge.id])
  const student = await createStudent()
  await joinClassroom(student, classroom.join_code)
  await loginStudentUi(page, student)
  await page.goto('/ranking')
  await page.getByTestId('ranking-scope').selectOption({ label: classroom.name })

  await expect(page.getByTestId('ranking-empty')).toHaveText('Nenhum XP neste período ainda. Resolva um desafio para entrar no ranking.')
  await expect(page.getByTestId('ranking-play')).toBeVisible()
})

test('FT-UI-18 with the public profile on, the name in the ranking opens the public profile; off, it is not a link', { tag: ['@UI-18'] }, async ({ page, browser }) => {
  const prof = await professorToken()
  const classroom = await createClassroom(prof)
  const challenge = await createChallenge(prof, 'grouping')
  await createMission(prof, classroom.id, [challenge.id])
  const owner = await createStudent('pub')
  const viewer = await createStudent('vis')
  for (const student of [owner, viewer]) await joinClassroom(student, classroom.join_code)
  await solveViaApi(owner, challenge)

  // the owner turns the public profile on from the profile screen
  await loginStudentUi(page, owner)
  await page.goto('/perfil')
  const toggle = page.getByTestId('profile-public-toggle')
  await expect(toggle).not.toBeChecked() // off by default
  await toggle.check()
  await expect(toggle).toBeChecked()
  await page.reload()
  await expect(page.getByTestId('profile-public-toggle')).toBeChecked()

  const viewerContext = await browser.newContext()
  const viewerPage = await viewerContext.newPage()
  await loginStudentUi(viewerPage, viewer)
  await viewerPage.goto('/ranking')
  await viewerPage.getByTestId('ranking-scope').selectOption({ label: classroom.name })

  const entry = viewerPage.getByTestId(`ranking-entry-${owner.username}`)
  await entry.getByRole('link', { name: owner.username }).click()
  await expect(viewerPage).toHaveURL(new RegExp(`/jogadores/${owner.username}`))
  await expect(viewerPage.getByRole('heading', { level: 1 })).toContainText(owner.username)
  await expect(viewerPage.getByText('Nível 1').first()).toBeVisible()
  await expect(viewerPage.getByText('Aprendiz').first()).toBeVisible()
  await expect(viewerPage.getByText('Primeiro desafio').first()).toBeVisible()

  // the viewer's own entry (profile off) is not a link
  await viewerPage.goto('/ranking')
  await viewerPage.getByTestId('ranking-scope').selectOption({ label: classroom.name })
  await expect(viewerPage.getByTestId(`ranking-entry-${viewer.username}`)).toBeVisible()
  await expect(viewerPage.getByTestId(`ranking-entry-${viewer.username}`).getByRole('link')).toHaveCount(0)

  // turning it off removes the link again
  await toggle.uncheck()
  await expect(toggle).not.toBeChecked()
  await viewerPage.goto('/ranking')
  await viewerPage.getByTestId('ranking-scope').selectOption({ label: classroom.name })
  await expect(viewerPage.getByTestId(`ranking-entry-${owner.username}`)).toBeVisible()
  await expect(viewerPage.getByTestId(`ranking-entry-${owner.username}`).getByRole('link')).toHaveCount(0)
  await viewerContext.close()
})
