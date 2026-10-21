// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

// Layer rules (architecture.md §2.2):
//   pages/layouts/components -> stores, composables, types, utils
//   stores/composables       -> services, types, utils
//   services                 -> types, services/http
//   types/utils              -> nothing internal (utils may import types)

const forbid = (regex, message) => ({ regex, message })

const SERVICES = forbid('(^|/)services(/|$)', 'Only stores and composables may use services.')
const STORES = forbid('(^|/)stores(/|$)', 'This layer must not depend on stores.')
const COMPOSABLES = forbid('(^|/)composables(/|$)', 'This layer must not depend on composables.')
const UTILS = forbid('(^|/)utils(/|$)', 'This layer must not depend on utils.')
const PRESENTATION = forbid('(^|/)(components|pages|layouts)(/|$)|\\.vue$', 'Only the presentation layer may use components.')
const VUE = forbid('^(vue|pinia)$', 'utils and types are plain TypeScript: no Vue or Pinia.')

const HTTP_CALLS = [
  {
    selector: 'CallExpression[callee.name=/^(\\$fetch|fetch|useFetch|useLazyFetch)$/]',
    message: 'Only app/services/** may talk HTTP.',
  },
  {
    selector: 'MemberExpression[object.name="$fetch"]',
    message: 'Only app/services/** may talk HTTP.',
  },
]

const REACTIVITY_CALLS = [
  {
    selector: 'CallExpression[callee.name=/^(ref|shallowRef|reactive|readonly|computed|watch|watchEffect|toRef|toRefs)$/]',
    message: 'utils and types hold pure helpers: no Vue reactivity.',
  },
]

const STORE_CALLS = [
  {
    selector: 'CallExpression[callee.name=/^use\\w*Store$/]',
    message: 'Services must not use stores.',
  },
]

const domGlobals = (message, names) => names.map((name) => ({ name, message }))
const BROWSER_GLOBALS = ['window', 'document', 'localStorage', 'sessionStorage', 'navigator']

export default withNuxt(
  {
    ignores: ['.claude/**', 'tests/unit/lint-fixtures/**', 'docs/evidence/**'],
  },
  {
    files: ['app/pages/**', 'app/layouts/**', 'app/components/**', 'app/app.vue', 'app/error.vue'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [SERVICES] }],
      'no-restricted-syntax': ['error', ...HTTP_CALLS],
    },
  },
  {
    files: ['app/stores/**', 'app/composables/**', 'app/middleware/**', 'app/plugins/**'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [PRESENTATION] }],
      'no-restricted-syntax': ['error', ...HTTP_CALLS],
    },
  },
  {
    files: ['app/services/**'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [STORES, COMPOSABLES, UTILS, PRESENTATION] }],
      'no-restricted-syntax': ['error', ...STORE_CALLS],
      'no-restricted-globals': ['error', ...domGlobals('Services must not touch the DOM.', BROWSER_GLOBALS)],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    files: ['app/utils/**'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [SERVICES, STORES, COMPOSABLES, PRESENTATION, VUE] }],
      'no-restricted-syntax': ['error', ...HTTP_CALLS, ...REACTIVITY_CALLS],
    },
  },
  {
    // utils/sound.ts is the one helper allowed to use a browser API (Web Audio).
    files: ['app/utils/**'],
    ignores: ['app/utils/sound.ts'],
    rules: {
      'no-restricted-globals': [
        'error',
        ...domGlobals('utils are pure helpers: no browser APIs.', [...BROWSER_GLOBALS, 'AudioContext']),
      ],
    },
  },
  {
    files: ['app/types/**'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [SERVICES, STORES, COMPOSABLES, UTILS, PRESENTATION, VUE] }],
      'no-restricted-syntax': ['error', ...HTTP_CALLS, ...REACTIVITY_CALLS],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
)
