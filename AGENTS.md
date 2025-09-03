Please provide all answers in Japanese

# Repository Guidelines

## Project Structure & Module Organization
- Source: `src/` with layered architecture.
  - `src/pages/` (Next.js Pages Router) and `src/pages/api/` (HTTP endpoints; e.g., `api/menu/today.js`).
  - `src/components/` UI (PascalCase files, e.g., `MenuCard.js`, with Tailwind in `src/styles/globals.css`).
  - Domain: `src/domain/{entities,use-cases,repositories}` and adapters in `src/infrastructure/{repositories,cache,external}`.
  - Interface layer: `src/interface/{controllers,presenters,dto}`.
  - Shared & hooks: `src/shared/{config,constants,types,utils}` and `src/hooks/`.
  - Data samples: `src/data/`.

## Build, Test, and Development Commands
- `npm run dev`: Start local dev server at http://localhost:3000.
- `npm run build`: Production build (includes Sentry source maps if configured).
- `npm run start`: Run built app.
- `npm run lint`: ESLint (Next core-web-vitals rules).
- Helpers: `dev-start.sh` (install + dev), `setup-vercel-env.sh` (add Vercel env vars).
- Firebase: `firebase deploy` (rules/indexes), `firebase emulators:start` (optional local dev).

## Coding Style & Naming Conventions
- Linting: ESLint flat config (`next/core-web-vitals`, TS plugin) + Prettier.
- Language: JS with TS enabled (`allowJs: true`, strict mode). Prefer `.ts/.tsx` for new code.
- Indentation: 2 spaces; semicolons optional (follow existing files).
- Naming:
  - Components: PascalCase (`MenuCard.js`). Hooks: camelCase with `use` prefix (`useKawasakiMenu.js`).
  - Pages/API: lowerCamel/hyphenated as needed under `src/pages/`.
  - Constants: UPPER_SNAKE_CASE in `src/shared/constants`.

## Testing Guidelines
- No test runner is configured yet. If adding tests, use Jest + React Testing Library.
- Location: `src/__tests__/` or `*.test.(js|ts|tsx)` colocated with code.
- Aim to cover: hooks (data states), components (A11y, rendering), API routes (basic success/validation paths).

## Commit & Pull Request Guidelines
- Commits: Prefer Conventional Commits (e.g., `feat: add monthly menu API`, `fix(api): handle invalid district`).
- PRs should include:
  - Summary, rationale, and scope; link related issues.
  - Screenshots/GIFs for UI changes; sample requests for API changes.
  - Notes on env/config impacts (Firebase, Upstash, Sentry) and migration steps.

## Security & Configuration Tips
- Env vars: set in `.env.local` and Vercel. Examples:
  - `NEXT_PUBLIC_FIREBASE_*` (client config), `UPSTASH_REDIS_REST_URL/TOKEN`, Sentry DSN via `@sentry/nextjs`.
- Do not commit secrets. Validate inputs on API routes; rate limit is enforced (10 req/min).
- See `next.config.js` for security headers and `firestore.rules` for data access.
