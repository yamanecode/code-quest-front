// Builds docs/evidence/traceability.md: requirement -> functional tests -> status.
// Reads docs/requirements.md and the Playwright JSON report (docs/evidence/playwright.json).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ID_PATTERN = /^UI-\d+$/

// Splits a table row on pipes that are not escaped with a backslash.
function splitRow(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split(/(?<!\\)\|/)
    .map((cell) => cell.trim().replace(/\\\|/g, '|'))
}

export function parseRequirements(markdown) {
  const requirements = []
  for (const line of markdown.split(/\r?\n/)) {
    if (!line.trim().startsWith('|')) continue
    const cells = splitRow(line)
    if (!ID_PATTERN.test(cells[0] ?? '')) continue
    const [id, phase, requirement, acceptance, api = ''] = cells
    requirements.push({ id, phase, requirement, acceptance, api, manual: acceptance.startsWith('MANUAL:') })
  }
  return requirements
}

// Flattens the Playwright JSON report into { title, tags, status } per test.
export function collectTests(report) {
  const tests = []
  const visit = (suite) => {
    for (const spec of suite.specs ?? []) {
      const tags = (spec.tags ?? []).map((tag) => tag.replace(/^@/, ''))
      const statuses = (spec.tests ?? []).map((test) => test.status)
      let status = 'passed'
      if (statuses.length === 0 || statuses.every((s) => s === 'skipped')) status = 'skipped'
      else if (statuses.some((s) => s === 'unexpected')) status = 'failed'
      tests.push({ title: spec.title, tags, status })
    }
    for (const child of suite.suites ?? []) visit(child)
  }
  for (const suite of report.suites ?? []) visit(suite)
  return tests
}

export function buildMatrix(requirements, tests) {
  const known = new Set(requirements.map((r) => r.id))
  const errors = []
  const rows = requirements.map((req) => {
    const linked = tests.filter((t) => t.tags.includes(req.id))
    let status
    if (req.manual) status = 'manual'
    else if (linked.length === 0) status = 'MISSING'
    else if (linked.some((t) => t.status === 'failed' || t.status === 'skipped')) status = 'failed'
    else status = 'passed'
    if (status === 'MISSING') errors.push(`${req.id} has no functional test`)
    return { ...req, tests: linked, status }
  })
  for (const test of tests) {
    for (const tag of test.tags) {
      if (ID_PATTERN.test(tag) && !known.has(tag)) errors.push(`"${test.title}" has the unknown tag @${tag}`)
    }
  }
  return { rows, errors }
}

export function renderMatrix(rows) {
  const cell = (text) => text.replace(/\|/g, '\\|')
  const lines = [
    '# Traceability: requirement -> functional tests -> status',
    '',
    '| ID | Requirement | Tests | Status |',
    '|---|---|---|---|',
  ]
  for (const row of rows) {
    const names = row.tests.length ? row.tests.map((t) => cell(t.title)).join('<br>') : '—'
    lines.push(`| ${row.id} | ${cell(row.requirement)} | ${names} | ${row.status} |`)
  }
  return lines.join('\n') + '\n'
}

function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const reportPath = resolve(root, 'docs/evidence/playwright.json')
  if (!existsSync(reportPath)) {
    console.error('Missing docs/evidence/playwright.json: run the Playwright suite first.')
    process.exit(1)
  }
  const requirements = parseRequirements(readFileSync(resolve(root, 'docs/requirements.md'), 'utf8'))
  const tests = collectTests(JSON.parse(readFileSync(reportPath, 'utf8')))
  const { rows, errors } = buildMatrix(requirements, tests)

  mkdirSync(resolve(root, 'docs/evidence'), { recursive: true })
  writeFileSync(resolve(root, 'docs/evidence/traceability.md'), renderMatrix(rows))

  for (const row of rows) console.log(`${row.id.padEnd(6)} ${row.status}`)
  for (const error of errors) console.error(`ERROR: ${error}`)
  const failed = rows.filter((r) => r.status === 'failed')
  if (errors.length > 0 || failed.length > 0) process.exit(1)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
