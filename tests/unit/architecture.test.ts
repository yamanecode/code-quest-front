// @vitest-environment node
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { ESLint } from 'eslint'
import { describe, expect, it } from 'vitest'

const fixture = fileURLToPath(new URL('./lint-fixtures/bad-component.vue', import.meta.url))

// Lints the fixture as if it lived in app/components, where the layer rules apply.
async function lintAsComponent() {
  const eslint = new ESLint()
  const code = await readFile(fixture, 'utf8')
  const [result] = await eslint.lintText(code, { filePath: 'app/components/BadComponent.vue' })
  return result!.messages
}

describe('layer rules', () => {
  it('T-FE-ARCH-01 a component that imports a service or calls $fetch fails lint', async () => {
    const messages = await lintAsComponent()
    const layerErrors = messages.filter(
      (m) => m.ruleId === 'no-restricted-imports' || m.ruleId === 'no-restricted-syntax',
    )

    expect(layerErrors.map((m) => m.ruleId)).toEqual(
      expect.arrayContaining(['no-restricted-imports', 'no-restricted-syntax']),
    )
    expect(layerErrors.every((m) => m.severity === 2)).toBe(true)
  }, 60_000)
})
