import { defineConfig, devices } from '@playwright/test'

// CODEQUEST_PROFESSOR_PASSWORD may live in the front .env.
try {
  process.loadEnvFile('.env')
} catch {
  // no .env: the variable must come from the environment
}

// The front must be served on exactly the backend's FRONTEND_ORIGIN (CORS).
const FRONT_URL = 'http://localhost:3000'
const API_URL = process.env.FUNCTIONAL_API_URL ?? 'http://127.0.0.1:8001'

export default defineConfig({
  testDir: 'tests/functional',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 8_000 },
  reporter: [['list'], ['json', { outputFile: 'docs/evidence/playwright.json' }]],
  use: {
    baseURL: FRONT_URL,
    locale: 'pt-BR',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: FRONT_URL,
    reuseExistingServer: true,
    timeout: 120_000,
    env: { NUXT_PUBLIC_API_BASE: API_URL },
  },
})
