// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { loadNuxtConfig } from '@nuxt/kit'

describe('page language', () => {
  it('T-FE-A11Y-03 the document is declared as Brazilian Portuguese', async () => {
    const config = await loadNuxtConfig({ cwd: process.cwd() })
    expect(config.app.head.htmlAttrs?.lang).toBe('pt-BR')
  })
})
