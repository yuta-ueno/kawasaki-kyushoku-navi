# CLAUDE.MD (Minimal, English)

## 📌 Project Overview

- Name: **Kawasaki School Lunch Navigator**
- Language: **TypeScript** (gradual migration from JS)
- Frontend: **Next.js 14 (Pages Router) + React 18**
- Backend: **Next.js API Routes (serverless)**
- Database: **Google Cloud Firestore**
- Cache: **Upstash Redis**
- Auth/Admin: **Firebase Admin SDK**
- Deploy: **Vercel**
- Monitoring: **Sentry + Vercel Analytics**

---

## 📦 Directory Structure

```
src/
├── domain/           # Core business logic (entities, use-cases)
├── infrastructure/   # Firestore, Redis, external concerns
├── interface/        # DTOs, API handlers
├── components/       # UI (React + Tailwind)
├── pages/            # Next.js routes & APIs
├── lib/              # Shared utils/config
└── tests/            # Jest / Playwright
```

---

## 🛠 Development Rules

1. **Type safety first**
   - No `any`
   - Validate API & DB with **Zod**

2. **Code style**
   - Formatter: **Prettier**
   - Linter: **ESLint (typescript-eslint)**
   - Import order: builtin → external → internal

3. **Testing**
   - Unit: **Jest**
   - E2E: **Playwright**
   - Run `pnpm test` on PRs

4. **Commits**
   - Follow **Conventional Commits**
   - Example: `feat(api): add feedback endpoint`

---

## 🔧 Claude Code Instructions

- Always generate **TypeScript** code, format with `pnpm lint --fix && pnpm format`
- Follow **DDD**: business logic in `/domain/`, infra in `/infrastructure/`
- API endpoints: under `/pages/api/`, validate with **Zod schemas**
- Firestore schema = as defined in **ARCHITECTURE_SPECIFICATION.md**
- UI: **TailwindCSS + Solarized palette**
- Ensure **accessibility** (ARIA, semantic HTML, contrast, keyboard nav)

---

## 🚀 Commands

```sh
pnpm dev           # run dev server
pnpm lint && pnpm format
pnpm test          # run tests
firebase emulators:start
```

---

## 🔐 Security

- Menus: **read-only**
- Feedback: **1/day per IP** (rate-limited via Redis)
- Validate all input (Zod + bad word filter)
- **CORS restricted** (production domain + localhost)

---

## 📊 Observability

- Errors tracked with **Sentry** (`RateLimitError`, `ValidationError`, etc.)
- Performance monitored with **Vercel Analytics**
- Feedback stored in Firestore → future **/admin/feedback dashboard**

---

## 🛠 Future

- Full **TypeScript migration**
- **Feedback admin dashboard**
- **Nutrition details & i18n**
- **Multi-city support**
