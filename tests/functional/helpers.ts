// Black-box helpers for the functional suite: public API endpoints and the browser only.
import { expect, type Page } from '@playwright/test'

export const API = process.env.FUNCTIONAL_API_URL ?? 'http://127.0.0.1:8001'
export const STUDENT_PASSWORD = 'senha-segura-1'

const PROFESSOR_PASSWORD = process.env.CODEQUEST_PROFESSOR_PASSWORD ?? ''

export type ChallengeType = 'ordering' | 'grouping' | 'filtering' | 'pattern'

let counter = 0
export function unique(prefix: string): string {
  counter += 1
  const stamp = Date.now().toString(36).slice(-6)
  return `${prefix}${stamp}${counter}${Math.floor(Math.random() * 1000).toString(36)}`.slice(0, 28)
}

// ---------- raw API ----------

export async function api<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown; token?: string } = {},
): Promise<{ status: number; data: T }> {
  const response = await fetch(`${API}${path}`, {
    method: options.method ?? (options.body === undefined ? 'GET' : 'POST'),
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })
  const text = await response.text()
  return { status: response.status, data: (text ? JSON.parse(text) : null) as T }
}

async function ok<T>(call: Promise<{ status: number; data: T }>, label: string): Promise<T> {
  const { status, data } = await call
  if (status >= 300) throw new Error(`${label} failed (${status}): ${JSON.stringify(data)}`)
  return data
}

export async function login(username: string, password: string): Promise<string> {
  const data = await ok(
    api<{ access_token: string }>('/api/auth/login', { body: { username, password } }),
    `login ${username}`,
  )
  return data.access_token
}

export async function professorToken(username = 'ft_prof'): Promise<string> {
  if (!PROFESSOR_PASSWORD) throw new Error('CODEQUEST_PROFESSOR_PASSWORD is not set')
  return login(username, PROFESSOR_PASSWORD)
}

export interface Student {
  username: string
  password: string
  token: string
}

export async function createStudent(prefix = 'aluno'): Promise<Student> {
  const username = unique(prefix)
  await ok(api('/api/auth/register', { body: { username, password: STUDENT_PASSWORD } }), 'register')
  return { username, password: STUDENT_PASSWORD, token: await login(username, STUDENT_PASSWORD) }
}

// ---------- challenge fixtures (texts are known, ids are not) ----------

export type ChallengeSpec =
  | { type: 'ordering'; steps: string[] } // in the correct order
  | { type: 'grouping'; groups: string[]; assignment: Record<string, string> } // item text -> group text
  | { type: 'filtering'; question: string; relevant: string[]; irrelevant: string[] }
  | { type: 'pattern'; sequence: string[]; correct: string; wrong: string[] }

export function specFor(type: ChallengeType, tag: string): ChallengeSpec {
  switch (type) {
    case 'ordering':
      return { type, steps: [`Pegar o pão ${tag}`, `Passar manteiga ${tag}`, `Fechar o sanduíche ${tag}`] }
    case 'grouping':
      return {
        type,
        groups: [`Preparar ${tag}`, `Servir ${tag}`],
        assignment: {
          [`Lavar os legumes ${tag}`]: `Preparar ${tag}`,
          [`Cortar os legumes ${tag}`]: `Preparar ${tag}`,
          [`Pôr a mesa ${tag}`]: `Servir ${tag}`,
          [`Levar o prato ${tag}`]: `Servir ${tag}`,
        },
      }
    case 'filtering':
      return {
        type,
        question: `Quantos ônibus a escola precisa alugar? ${tag}`,
        relevant: [`Vão 90 alunos ${tag}`, `Cada ônibus leva 45 pessoas ${tag}`],
        irrelevant: [`A saída é às 7h ${tag}`, `O ônibus é azul ${tag}`],
      }
    case 'pattern':
      return {
        type,
        sequence: ['2', '4', '6', '8'],
        correct: '10',
        wrong: ['9', '12', '14'],
      }
  }
}

function contentFor(spec: ChallengeSpec) {
  const withIds = (texts: string[]) => texts.map((text, i) => ({ id: String.fromCharCode(97 + i), text }))
  switch (spec.type) {
    case 'ordering': {
      const items = withIds(spec.steps)
      return { items, solution: items.map((i) => i.id) }
    }
    case 'grouping': {
      const groups = spec.groups.map((text, i) => ({ id: `g${i + 1}`, text }))
      const items = withIds(Object.keys(spec.assignment))
      const solution = Object.fromEntries(
        items.map((i) => [i.id, groups.find((g) => g.text === spec.assignment[i.text])!.id]),
      )
      return { groups, items, solution }
    }
    case 'filtering': {
      const items = withIds([...spec.relevant, ...spec.irrelevant])
      return {
        question: spec.question,
        items,
        solution: items.filter((i) => spec.relevant.includes(i.text)).map((i) => i.id),
      }
    }
    case 'pattern': {
      const options = withIds([spec.correct, ...spec.wrong])
      return { sequence: spec.sequence, options, solution: options[0]!.id }
    }
  }
}

export interface CreatedChallenge {
  id: number
  title: string
  statement: string
  spec: ChallengeSpec
}

export async function createChallenge(
  token: string,
  type: ChallengeType,
  options: { tag?: string; title?: string; statement?: string; publish?: boolean; explanation?: string } = {},
): Promise<CreatedChallenge> {
  const tag = options.tag ?? unique('t').slice(0, 8)
  const spec = specFor(type, tag)
  const title = options.title ?? `Desafio ${type} ${tag}`
  const statement = options.statement ?? `Resolva este desafio de teste do tipo ${type} com atenção. ${tag}`
  const created = await ok(
    api<{ id: number }>('/api/professor/challenges', {
      token,
      body: { title, statement, type, content: contentFor(spec), explanation: options.explanation ?? `Explicação ${tag}.` },
    }),
    'create challenge',
  )
  if (options.publish !== false) {
    await ok(api(`/api/professor/challenges/${created.id}/publish`, { token, method: 'POST' }), 'publish challenge')
  }
  return { id: created.id, title, statement, spec }
}

export interface Classroom {
  id: number
  name: string
  join_code: string
}

export async function createClassroom(token: string, name = unique('Turma '), weeklyGoal: number | null = null) {
  return ok(
    api<Classroom>('/api/professor/classrooms', { token, body: { name, weekly_goal: weeklyGoal } }),
    'create classroom',
  )
}

export async function createMission(
  token: string,
  classroomId: number,
  challengeIds: number[],
  options: { title?: string; publish?: boolean } = {},
) {
  const mission = await ok(
    api<{ id: number; title: string }>(`/api/professor/classrooms/${classroomId}/missions`, {
      token,
      body: { title: options.title ?? unique('Missão ') },
    }),
    'create mission',
  )
  await ok(
    api(`/api/professor/missions/${mission.id}/challenges`, { token, method: 'PUT', body: { challenge_ids: challengeIds } }),
    'set mission challenges',
  )
  if (options.publish !== false) {
    await ok(api(`/api/professor/missions/${mission.id}/publish`, { token, method: 'POST' }), 'publish mission')
  }
  return mission
}

export async function joinClassroom(student: Student, joinCode: string) {
  return ok(api('/api/classrooms/join', { token: student.token, body: { join_code: joinCode } }), 'join classroom')
}

interface StudentChallenge {
  content: {
    items?: { id: string; text: string }[]
    groups?: { id: string; text: string }[]
    options?: { id: string; text: string }[]
  }
}

// Answers a challenge correctly through the API, finding ids by text (ids are shuffled per student).
export async function solveViaApi(student: Student, challenge: CreatedChallenge, wrongFirst = false) {
  const view = await ok(api<StudentChallenge>(`/api/challenges/${challenge.id}`, { token: student.token }), 'view')
  const items = view.content.items ?? []
  const idOf = (text: string) => items.find((i) => i.text === text)!.id
  const spec = challenge.spec
  let correct: unknown
  let wrong: unknown
  if (spec.type === 'ordering') {
    correct = { order: spec.steps.map(idOf) }
    wrong = { order: [...spec.steps].reverse().map(idOf) }
  } else if (spec.type === 'grouping') {
    const groups = view.content.groups ?? []
    correct = {
      assignment: Object.fromEntries(
        Object.entries(spec.assignment).map(([text, group]) => [idOf(text), groups.find((g) => g.text === group)!.id]),
      ),
    }
    wrong = {
      assignment: Object.fromEntries(
        Object.keys(spec.assignment).map((text) => [idOf(text), groups[0]!.id]),
      ),
    }
  } else if (spec.type === 'filtering') {
    correct = { selected: spec.relevant.map(idOf) }
    wrong = { selected: spec.irrelevant.map(idOf) }
  } else {
    const options = view.content.options ?? []
    correct = { option: options.find((o) => o.text === spec.correct)!.id }
    wrong = { option: options.find((o) => o.text === spec.wrong[0])!.id }
  }
  if (wrongFirst) {
    await ok(api(`/api/challenges/${challenge.id}/submissions`, { token: student.token, body: { answer: wrong } }), 'wrong')
  }
  return ok(
    api<{ is_correct: boolean; xp_earned: number }>(`/api/challenges/${challenge.id}/submissions`, {
      token: student.token,
      body: { answer: correct },
    }),
    'submit',
  )
}

// ---------- browser ----------

export async function loginUi(page: Page, username: string, password: string) {
  await page.goto('/entrar')
  await page.getByTestId('login-username').fill(username)
  await page.getByTestId('login-password').fill(password)
  await page.getByTestId('login-submit').click()
}

export async function loginStudentUi(page: Page, student: Student) {
  await loginUi(page, student.username, student.password)
  await expect(page.getByTestId('header-level')).toBeVisible()
}

export async function loginProfessorUi(page: Page, username = 'ft_prof') {
  await loginUi(page, username, PROFESSOR_PASSWORD)
  await expect(page).toHaveURL(/\/professor/)
}

// Answers the challenge open in the browser, locating every control by its text.
export async function answerInBrowser(page: Page, spec: ChallengeSpec, mode: 'correct' | 'wrong' = 'correct') {
  if (spec.type === 'ordering') {
    await page.getByTestId('ordering-list').waitFor()
    const order = mode === 'correct' ? spec.steps : [...spec.steps].reverse()
    for (let target = 0; target < order.length; target++) {
      const current = await page.getByTestId('ordering-text').allTextContents()
      let index = current.findIndex((text) => text.trim() === order[target])
      while (index > target) {
        await page.getByRole('button', { name: `Mover para cima: ${order[target]}` }).click()
        index -= 1
      }
    }
  } else if (spec.type === 'grouping') {
    // wrong mode puts every item in the first group, which is wrong for the items of the second
    for (const [text, group] of Object.entries(spec.assignment)) {
      await page.getByLabel(`Etapa de: ${text}`).selectOption({ label: mode === 'correct' ? group : spec.groups[0]! })
    }
  } else if (spec.type === 'filtering') {
    // setChecked also clears the selection left over from an earlier attempt
    const picks = mode === 'correct' ? spec.relevant : spec.irrelevant
    for (const text of [...spec.relevant, ...spec.irrelevant]) {
      await page.getByRole('checkbox', { name: text }).setChecked(picks.includes(text))
    }
  } else {
    await page.getByRole('radio', { name: mode === 'correct' ? spec.correct : spec.wrong[0]!, exact: true }).check()
  }
}
