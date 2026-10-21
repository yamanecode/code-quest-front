import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    // Internal tests only; the Playwright suite lives in tests/functional.
    include: ['tests/unit/**/*.test.ts'],
    environment: 'nuxt',
    environmentOptions: {
      nuxt: { domEnvironment: 'happy-dom' },
    },
  },
})
