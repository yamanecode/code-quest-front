// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { buildMatrix, collectTests, parseRequirements, renderMatrix } from '../../scripts/traceability.mjs'

const TABLE = `
| ID | Phase | Requirement | Acceptance | API |
|---|---|---|---|---|
| UI-01 | 1 | Sign-up | A visitor signs up \\| logs in. | RF-01 |
| UI-02 | 0 | Access | A visitor is sent to login. | RF-02 |
| UI-03 | 2 | Sound | MANUAL: inspect. | — |
`

const report = (specs: { title: string; tags: string[]; status: string }[]) => ({
  suites: [
    {
      suites: [],
      specs: specs.map((s) => ({ title: s.title, tags: s.tags, tests: [{ status: s.status }] })),
    },
  ],
})

describe('traceability', () => {
  it('T-FE-TRACE-01 parses the table, including escaped pipes and manual rows', () => {
    const reqs = parseRequirements(TABLE)
    expect(reqs.map((r: { id: string }) => r.id)).toEqual(['UI-01', 'UI-02', 'UI-03'])
    expect(reqs[0]!.acceptance).toBe('A visitor signs up | logs in.')
    expect(reqs[2]!.manual).toBe(true)
  })

  it('T-FE-TRACE-02 marks a requirement without tests as MISSING and reports it', () => {
    const reqs = parseRequirements(TABLE)
    const tests = collectTests(report([{ title: 'FT-UI-01 signs up', tags: ['UI-01'], status: 'expected' }]))
    const { rows, errors } = buildMatrix(reqs, tests)
    expect(rows.map((r: { status: string }) => r.status)).toEqual(['passed', 'MISSING', 'manual'])
    expect(errors).toEqual(['UI-02 has no functional test'])
    expect(renderMatrix(rows)).toContain('| UI-02 | Access | — | MISSING |')
  })

  it('T-FE-TRACE-03 flags unknown tags and failed tests', () => {
    const reqs = parseRequirements(TABLE)
    const tests = collectTests(
      report([
        { title: 'FT-UI-01 a', tags: ['@UI-01'], status: 'unexpected' },
        { title: 'FT-UI-02 b', tags: ['UI-02'], status: 'expected' },
        { title: 'FT-UI-99 c', tags: ['UI-99'], status: 'expected' },
      ]),
    )
    const { rows, errors } = buildMatrix(reqs, tests)
    expect(rows[0].status).toBe('failed')
    expect(errors).toEqual(['"FT-UI-99 c" has the unknown tag @UI-99'])
  })
})
