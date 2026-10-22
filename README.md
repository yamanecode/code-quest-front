# CodeQuest: web interface

Front end of CodeQuest, a platform where students train computational thinking by solving logic challenges without code and earn XP, levels and badges. Nuxt 4, Vue 3, Pinia and Tailwind, in SPA mode. The back end is `code-quest-back` (FastAPI).

## Setup

```
npm install
npx playwright install chromium   # only needed for the functional tests
```

Copy `.env.example` to `.env` and adjust:

| Variable | Use |
|---|---|
| `NUXT_PUBLIC_API_BASE` | Back end URL (default `http://localhost:8000`) |
| `CODEQUEST_PROFESSOR_PASSWORD` | Password of the professor accounts `ft_prof` and `ft_prof2` used by the functional tests |

## Commands

```
npm run dev          # http://localhost:3000
npm run lint         # ESLint, including the layer rules
npm run typecheck    # nuxi typecheck
npm run test         # internal tests (Vitest)
powershell -File scripts/functional.ps1   # functional tests (Playwright) and traceability
```

## Layers

Each layer only depends on the ones below it. ESLint enforces it.

| Layer | Folders | Rule |
|---|---|---|
| Presentation | `app/pages`, `app/layouts`, `app/components` | uses stores, composables, types and utils; never imports `services` and never calls `$fetch`/`fetch` |
| Application | `app/stores`, `app/composables`, `app/middleware` | holds state and use cases; uses services |
| Data access | `app/services` | the only place that talks HTTP (`services/http.ts`) |
| Shared | `app/types`, `app/utils` | plain TypeScript helpers and DTOs |

The text shown to users is in Brazilian Portuguese; code, comments and file names are in English.

## Tests

**Internal tests** (`tests/unit`, Vitest) are written while coding and may import application code. Names start with their ID, for example `T-FE-CH-01`.

**Functional tests** (`tests/functional`, Playwright) are black-box: a real browser against the running application, never importing application code. Each test is named `FT-UI-NN` and tagged `@UI-NN` after a requirement in `docs/requirements.md`. Data is created through the public API, each test with its own students and classes. Answer controls are found by their text, because the API shuffles and renames the items per student.

Running the functional suite:

1. In `code-quest-back`, start the functional server (fresh database, base game, professors `ft_prof` and `ft_prof2`, fake AI, 2 s hint wait):
   `powershell -File scripts/functional.ps1 -Serve` (it needs `CODEQUEST_PROFESSOR_PASSWORD`).
2. In this repository: `powershell -File scripts/functional.ps1`.

The script checks that the back end answers on `http://127.0.0.1:8001`, runs Playwright (it starts the front on `http://localhost:3000`, the origin the back end allows through CORS) and builds `docs/evidence/traceability.md` with `node scripts/traceability.mjs`. The traceability table lists every requirement, its tests and the status (`passed`, `failed`, `MISSING` or `manual`). Requirements whose acceptance starts with `MANUAL:` are checked by inspection.
