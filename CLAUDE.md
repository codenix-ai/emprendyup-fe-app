# emprendy.ai — Claude Code Instructions

## Project Overview

**EmprendYup / Emprendy.ai** is a multi-tenant e-commerce and business management platform for Latin American entrepreneurs. It supports multiple business types: online stores, restaurants, service providers, and event organizers.

- **Production URL:** `https://www.emprendy.ai`
- **Backend API (REST + GraphQL):** `https://api.emprendy.ai`
- **Version:** 1.24.0
- **Primary language:** Spanish (es_LA)

---

## Tech Stack

| Layer          | Technology                          | Version   |
| -------------- | ----------------------------------- | --------- |
| Framework      | Next.js (App Router)                | 15.x      |
| Language       | TypeScript (strict mode)            | 5.x       |
| UI             | React                               | 18.x      |
| Styling        | TailwindCSS                         | 3.x       |
| Animation      | Framer Motion                       | 12.x      |
| Server State   | TanStack React Query                | 5.x       |
| Client State   | Zustand                             | 5.x       |
| GraphQL Client | Apollo Client                       | 3.x       |
| Forms          | React Hook Form + Zod               | 7.x + 4.x |
| Auth           | Custom JWT + Google OAuth           | —         |
| Payments       | ePayco SDK                          | 1.x       |
| Rich Text      | Editor.js                           | 2.x       |
| Calendar       | FullCalendar                        | 6.x       |
| Charts         | Recharts                            | 2.x       |
| Notifications  | React Hot Toast, Sonner             | latest    |
| Storage        | AWS S3 (`emprendyup-images`)        | —         |
| Maps           | Google Maps JS API                  | —         |
| Icons          | Lucide React, React Icons           | latest    |
| AI SDK         | Anthropic SDK (`@anthropic-ai/sdk`) | 0.78.x    |
| Visual Builder | CraftJS                             | 0.2.x     |

---

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # Next.js Route Handlers (server-side)
│   │   ├── auth/                 # login, register, Google OAuth (/me, /google, /login, /register)
│   │   ├── payments/             # ePayco checkout + webhook confirmation
│   │   ├── dashboard/            # Dashboard data (insights, charts, KPIs)
│   │   ├── ai/                   # AI endpoints
│   │   └── unsplash/             # Unsplash image proxy
│   ├── components/               # Reusable React UI components (80+)
│   ├── dashboard/                # Multi-tenant seller/admin dashboard modules
│   ├── assets/                   # Images, fonts, SCSS
│   ├── types/                    # TypeScript type definitions (wompi.ts, etc.)
│   ├── utils/                    # App-level utilities
│   ├── hooks/                    # App-level React hooks (useAuth.ts)
│   ├── store/                    # Store public-facing pages
│   └── [routes]/                 # Pages: login, registrarse, favoritos, crear-tienda, etc.
├── features/
│   └── landing-editor/           # CraftJS-based landing page editor
└── lib/
    ├── api/                      # API client functions (fairs.ts, etc.)
    ├── store/                    # Zustand stores (dashboard.ts, fairCart.ts)
    ├── hooks/                    # Shared hooks (useSearchProducts, useImageUpload, usePayments, etc.)
    ├── graphql/                  # Apollo Client queries (queries.ts, fairs.ts, emailMarketing.ts, payments.ts)
    ├── utils/                    # authToken.ts, localAuth.ts, rbac.ts, money.ts, googleAuth.ts, cn.ts
    ├── blog/                     # Blog markdown/slug utilities
    ├── payments/                 # ePayco integration (epayco.ts)
    ├── schemas/                  # Zod validation schemas (dashboard.ts)
    ├── landing-renderer/         # Landing page renderer blocks
    └── constants/                # user-roles.ts, config constants
```

---

## Business Domain

### Business Types

| Type         | Description                                       |
| ------------ | ------------------------------------------------- |
| `store`      | Online retail store with product catalog          |
| `restaurant` | Restaurant with menu, reservations, and orders    |
| `service`    | Service business with calendar scheduling and CRM |
| `event`      | Event/fair management with ticketing              |

### User Roles (`src/lib/constants/user-roles.ts`)

| Role           | Description                          |
| -------------- | ------------------------------------ |
| `ADMIN`        | Platform administrator — full access |
| `ENTREPRENEUR` | Seller managing their own business   |
| `STORE_ADMIN`  | Store-level administrator            |
| `MANAGER`      | Manager within a business            |
| `USER`         | Regular end-user / customer          |

RBAC checks are in `src/lib/utils/rbac.ts`. Component-level guard: `AdminGuard.tsx`.

---

## Dashboard Modules (`src/app/dashboard/`)

Store: products, orders, customers, payments, insights, wallet, bonuses, settings, landing-editor
Restaurant: menu-images, restaurant, restaurant-expenses, restaurant-payroll, restaurant-reservation, user-by-restaurant
Service: service, service-calendar, service-catalog, service-crm, service-dashboard, service-expenses, service-images, user-by-service, quotes, reservaciones
Events: events, fairs, user-by-store
Shared: blog, categories, categoriesAdmin, config, email-marketing, whatsapp-messages, whatsapp-templates, plans, admin, entrepeneurs, stores, users

---

## Key Architectural Decisions

### Server Components First

Use Next.js Server Components by default. Add `"use client"` only when using hooks, event handlers, or browser APIs.

### State Management

| Data Type              | Solution                                               |
| ---------------------- | ------------------------------------------------------ |
| Server/API data        | TanStack React Query (REST) or Apollo Client (GraphQL) |
| Shared client UI state | Zustand (`src/lib/store/`)                             |
| Local component state  | React `useState`                                       |

Do NOT duplicate server state in Zustand.

### Authentication Flow

1. `POST /api/auth/login` → validates against `api.emprendy.ai`, receives JWT
2. JWT stored as HTTP-only cookie (`auth_token`)
3. Token read/written exclusively via `src/lib/utils/authToken.ts`
4. Session user object read via `src/lib/utils/localAuth.ts`
5. Google OAuth: `/api/auth/google/callback` → set cookie

### Multi-tenancy

Each seller has a `businessType`. Dashboard modules must conditionally render features based on it. No assumptions about a single business type in shared components.

### Payment Flow (ePayco)

1. Frontend → `POST /api/payments/create-checkout`
2. Route handler calls ePayco SDK → returns payment URL
3. User goes to ePayco hosted page
4. ePayco webhook → `POST /api/payments/epayco/confirmation`
5. Handler verifies signature, updates order status

### API Communication

- **REST:** `https://api.emprendy.ai` — called via `fetch` through React Query hooks
- **GraphQL:** `https://api.emprendy.ai/graphql` — called via Apollo Client (`ApolloWrapper.tsx`)
- All API functions live in `src/lib/api/` or `src/lib/graphql/`
- Never call fetch directly inside components

### Image Storage

- Images uploaded to S3 bucket `emprendyup-images.s3.us-east-1.amazonaws.com`
- Image upload logic in `src/lib/hooks/useImageUpload.ts`

---

## Code Rules

### General

- TypeScript strict mode always — never use `any`, use `unknown` or proper types
- Never use `console.log` in production code
- All async functions must have `try/catch` or `.catch()`
- Never hardcode prices, API keys, URLs, or credentials — use `NEXT_PUBLIC_*` env vars
- Use `clsx` + `tailwind-merge` (`cn()` from `src/lib/utils/cn.ts`) for conditional class names

### Components

- Reusable components → `src/app/components/<ComponentName>/index.tsx`
- Use TailwindCSS utility classes; avoid inline styles
- Always handle loading and error states
- Use Framer Motion for complex animations
- Every `<img>` must have an `alt` attribute
- Use `data-testid` attributes on all interactive elements
- Use semantic HTML and ARIA attributes for accessibility

### Forms

- Use `react-hook-form` + `@hookform/resolvers/zod`
- Define Zod schemas in `src/lib/schemas/` and reuse for form and API validation

### API Routes (Next.js handlers)

- Every protected endpoint must verify the JWT cookie
- Validate all `req.body` with Zod before use
- Return proper HTTP status codes: 200, 201, 400, 401, 403, 404, 500
- Never expose stack traces to client in production

### File Naming

- Components: `PascalCase` (`ProductCard.tsx`)
- Hooks: `camelCase` with `use` prefix (`useSearchProducts.ts`)
- Utilities: `camelCase` (`localAuth.ts`)
- Schemas: `camelCase` (`dashboard.ts`)

---

## Environment Variables

All client-accessible vars must use `NEXT_PUBLIC_` prefix. Key vars:

```
NEXT_PUBLIC_APP_URL          # App base URL
NEXT_PUBLIC_API_URL          # https://api.emprendy.ai
NEXT_PUBLIC_GRAPHQL_URL      # GraphQL endpoint
NEXT_PUBLIC_AGENT_API        # AI chat agent URL
NEXT_PUBLIC_GOOGLE_CLIENT_ID # Google OAuth client ID
NEXT_PUBLIC_EPAYCO_*         # ePayco credentials
NEXT_PUBLIC_GOOGLE_MAPS_KEY  # Google Maps API key
```

---

## Pre-push Verification Checklist

Run ALL checks in order before every push or PR. Do not push if any step fails.

### 1. TypeScript

```bash
npx tsc --noEmit
```

### 2. ESLint

```bash
npx eslint . --ext .ts,.tsx --max-warnings 0
```

Warnings are treated as errors.

### 3. Build

```bash
npm run build
```

### 4. Security Audit

```bash
npm audit --audit-level=high
```

### 5. E2E Tests (optional, runs in CI)

```bash
npm run test:e2e
```

---

## Development Commands

```bash
npm run dev            # Dev server with Turbopack
npm run build          # Production build
npm run lint           # ESLint
npm run test:e2e       # Playwright E2E tests
npm run test:e2e:ui    # Playwright UI mode
npm run test:e2e:auth  # Auth-specific E2E tests
npm run test:e2e:store # Store-specific E2E tests
npm run commit         # Commitizen (conventional commits)
```

---

## Before Opening a PR

1. Run the full pre-push checklist
2. Add `data-testid` attributes to all new interactive elements
3. If you changed an API endpoint, update the type in `src/app/types/`
4. Write or update the relevant test in `agents/qa-runner/scenarios/`
5. Follow conventional commits (`feat:`, `fix:`, `chore:`, etc.) — enforced by Commitizen

---

## AI Agents (`agents/`)

Do NOT modify files inside `agents/` unless explicitly asked.

| Agent                | Responsibility                                    |
| -------------------- | ------------------------------------------------- |
| `inspector`          | Runs on every push — ESLint + TS + security audit |
| `qa-runner`          | E2E tests daily at 2am                            |
| `jira-scribe`        | Creates Jira issues automatically for findings    |
| `fe-fixer`           | Opens PRs with auto-fixes for frontend issues     |
| `be-fixer`           | Opens PRs with auto-fixes for backend issues      |
| `validator`          | Closes Jira issues after fixes are verified       |
| `architecture-agent` | System design, ADRs                               |
| `frontend-agent`     | UI components, pages, API integrations            |
| `backend-agent`      | API routes, GraphQL, auth, payments               |
| `testing-agent`      | Unit, integration, E2E tests                      |
| `data-agent`         | GraphQL queries, seed data                        |
| `product-agent`      | Feature specs, task breakdown                     |

---

## Useful File Locations

| What                | Where                                       |
| ------------------- | ------------------------------------------- |
| Auth token utils    | `src/lib/utils/authToken.ts`                |
| Local session utils | `src/lib/utils/localAuth.ts`                |
| RBAC logic          | `src/lib/utils/rbac.ts`                     |
| Money formatting    | `src/lib/utils/money.ts`                    |
| Zod schemas         | `src/lib/schemas/dashboard.ts`              |
| Zustand stores      | `src/lib/store/dashboard.ts`, `fairCart.ts` |
| ePayco integration  | `src/lib/payments/epayco.ts`                |
| GraphQL queries     | `src/lib/graphql/queries.ts`                |
| User roles          | `src/lib/constants/user-roles.ts`           |
| Dashboard Zustand   | `src/lib/store/dashboard.ts`                |
| Apollo wrapper      | `src/app/components/ApolloWrapper.tsx`      |
| AdminGuard          | `src/app/components/AdminGuard.tsx`         |
| Auth hook           | `src/app/hooks/useAuth.ts`                  |
