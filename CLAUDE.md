# emprendy.ai — Claude Code Instructions

## Pre-push Verification Checklist

Before every push or PR, run ALL of the following checks in order.
Do not push if any step fails unless explicitly told to.

### 1. TypeScript

```bash
npx tsc --noEmit
```

Fix ALL type errors before continuing.

### 2. ESLint

```bash
npx eslint . --ext .ts,.tsx --max-warnings 0
```

Fix all errors. Warnings are also treated as errors.

### 3. Unit Tests

```bash
npm run test -- --passWithNoTests
```

All tests must pass.

### 4. Build

```bash
npm run build
```

Build must complete with zero errors.

### 5. Security Audit

```bash
npm audit --audit-level=high
```

No high or critical vulnerabilities allowed.

---

## Code Rules — emprendy.ai

### General

- Language: TypeScript strict mode always
- Never use `any` — use proper types or `unknown`
- Never use `console.log` in production code — use the centralized logger
- All async functions must have try/catch or `.catch()`
- Never hardcode prices, API keys, URLs or credentials

### Frontend (Next.js / React)

- Components go in `src/components/[Module]/`
- Every `<img>` must have an `alt` attribute
- Use `data-testid` attributes on all interactive elements
- API calls go through React Query — never fetch directly in components
- Validate all forms with Zod before submitting

### Backend (Express / API)

- Every endpoint must have authentication middleware unless explicitly public
- Validate all `req.body` with Zod schemas before using
- Return proper HTTP status codes: 200, 201, 400, 401, 403, 404, 500
- Never expose stack traces to the client in production

### Modules

- `store` — src/components/Store/, src/app/store/
- `restaurant` — src/components/Restaurant/, src/app/restaurant/
- `service` — src/components/Service/, src/app/service/
- `dashboard` — src/components/Dashboard/, src/app/dashboard/

---

## Before Opening a PR

1. Run the full pre-push checklist above
2. Make sure `data-testid` attributes exist on new interactive elements
3. If you changed an API endpoint, update the type in `src/types/api.ts`
4. If you changed the DB schema, include the Prisma migration
5. Write or update the relevant test in `agents/qa-runner/scenarios/`

---

## AI Agents Context

This repo uses 6 AI agents for automated testing and fixing:

- Inspector runs on every push (ESLint + TS + audit)
- QA Runner runs E2E tests daily at 2am
- Jira Scribe creates Jira issues automatically for findings
- FE Fixer and BE Fixer open PRs with auto-fixes
- Validator closes Jira issues after fixes are verified

Do not modify files inside `agents/` unless explicitly asked.
