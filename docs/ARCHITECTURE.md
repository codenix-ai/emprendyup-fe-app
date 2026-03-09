# EmprendYup Frontend — Architecture

## Overview

EmprendYup is a multi-tenant e-commerce and business management platform for Latin American entrepreneurs. The frontend is a **Next.js 15 (App Router)** application written in TypeScript, connecting to a backend REST API and GraphQL endpoint at `https://api.emprendy.ai`.

---

## Tech Stack

| Layer          | Technology                    | Version    |
| -------------- | ----------------------------- | ---------- |
| Framework      | Next.js (App Router)          | 15.x       |
| Language       | TypeScript                    | 5.x        |
| UI             | React                         | 18.x       |
| Styling        | TailwindCSS                   | 3.x        |
| Animation      | Framer Motion                 | 12.x       |
| Icons          | Lucide React, React Icons     | latest     |
| Server State   | TanStack React Query          | 5.x        |
| Client State   | Zustand                       | 5.x        |
| GraphQL Client | Apollo Client                 | 3.x        |
| Forms          | React Hook Form + Zod         | 7.x + 4.x  |
| Auth           | Custom JWT + Google OAuth     | —          |
| Payments       | ePayco SDK                    | 1.x        |
| Rich Text      | Editor.js                     | 2.x        |
| Calendar       | FullCalendar                  | 6.x        |
| Charts         | Recharts                      | 2.x        |
| Notifications  | React Hot Toast, Sonner       | latest     |
| Storage        | AWS S3                        | —          |
| Maps           | Google Maps JS API            | —          |
| Analytics      | Google Analytics              | —          |
| Versioning     | Semantic Release + Commitizen | 24.x + 4.x |
| Git Hooks      | Husky                         | 9.x        |
| Linting        | ESLint                        | 8.x        |
| Formatting     | Prettier                      | 3.x        |

---

## Folder Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # Next.js Route Handlers (server-side)
│   │   ├── auth/                 # login, register, Google OAuth, /me
│   │   ├── payments/             # ePayco checkout + webhook confirmation
│   │   └── dashboard/            # Dashboard data (insights, charts, KPIs)
│   ├── components/               # Reusable React components (80+)
│   ├── dashboard/                # Multi-tenant seller/admin dashboard modules
│   ├── assets/                   # Images, fonts, SCSS
│   ├── types/                    # TypeScript type definitions
│   ├── utils/                    # App-level utility functions
│   ├── hooks/                    # App-level React hooks
│   └── [routes]/                 # Page routes (login, registro, favoritos, etc.)
└── lib/
    ├── api/                      # API client functions (fairs, etc.)
    ├── store/                    # Zustand stores (dashboard, fairCart)
    ├── hooks/                    # Shared custom hooks
    ├── graphql/                  # Apollo Client GraphQL queries/mutations
    ├── utils/                    # localAuth, googleAuth, authToken, rbac, money
    ├── blog/                     # Blog utilities (markdown, mentions, slug)
    ├── payments/                 # ePayco integration
    ├── schemas/                  # Zod validation schemas
    └── constants/                # user-roles, config constants
```

---

## Key Architectural Decisions

### 1. Server Components First

Use **Next.js Server Components** by default. Add `"use client"` only when:

- The component uses React hooks (`useState`, `useEffect`, etc.)
- The component handles user events
- The component uses browser-only APIs

### 2. State Management Strategy

| Data Type              | Solution                                               |
| ---------------------- | ------------------------------------------------------ |
| Server/API data        | TanStack React Query (REST) or Apollo Client (GraphQL) |
| Shared client UI state | Zustand (`src/lib/store/`)                             |
| Local component state  | React `useState`                                       |

Do NOT duplicate server state in Zustand. Use React Query's cache.

### 3. Authentication Flow

1. User submits credentials → `POST /api/auth/login`
2. Next.js route handler validates with `api.emprendy.ai`, receives JWT
3. JWT stored in **HTTP-only cookie** (`auth_token`)
4. All subsequent API requests include the cookie automatically
5. Token read/written exclusively via `src/lib/utils/authToken.ts`
6. Google OAuth: redirect to Google → `/api/auth/google/callback` → set cookie

### 4. Multi-tenancy

- Each seller has a `businessType`: `store` | `restaurant` | `service` | `event`
- Dashboard modules in `src/app/dashboard/` must conditionally render features based on `businessType`
- No assumptions about a single business type in shared components

### 5. Role-Based Access Control (RBAC)

- User roles: `customer` | `seller` | `admin`
- Defined in `src/lib/constants/user-roles.ts`
- Access checks: `src/lib/utils/rbac.ts`
- Component-level guard: `AdminGuard` component
- Route-level protection via middleware or layout-level auth checks

### 6. Payment Flow (ePayco)

1. Frontend initiates checkout → `POST /api/payments/create-checkout`
2. Route handler calls ePayco SDK to create payment session
3. User redirected to ePayco hosted checkout
4. ePayco sends webhook to `POST /api/payments/epayco/confirmation`
5. Route handler verifies signature, updates order status

### 7. API Communication

- **REST**: All client-side REST calls go through `src/lib/api/` functions → React Query hooks
- **GraphQL**: All GraphQL operations defined in `src/lib/graphql/` → Apollo Client hooks
- **Proxying**: Sensitive API calls proxied through Next.js route handlers (server-side)
- **Never** call `fetch` directly in React components

### 8. Forms

All forms use **React Hook Form** with **Zod resolvers**:

- Zod schemas defined in `src/lib/schemas/`
- Shared between form validation and API route validation

---

## Environment Variables

| Variable                        | Scope           | Purpose                      |
| ------------------------------- | --------------- | ---------------------------- |
| `NEXT_PUBLIC_API_URL`           | Client + Server | EmprendYup REST API base URL |
| `NEXT_PUBLIC_GRAPHQL_ENDPOINT`  | Client + Server | GraphQL endpoint             |
| `NEXT_PUBLIC_AGENT_API`         | Client          | AI agent API                 |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID`  | Client          | Google OAuth client ID       |
| `GOOGLE_CLIENT_SECRET`          | Server only     | Google OAuth secret          |
| `NEXT_PUBLIC_EPAYCO_PUBLIC_KEY` | Client          | ePayco public key            |
| `EPAYCO_PRIVATE_KEY`            | Server only     | ePayco private key           |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY`   | Client          | Google Maps API key          |
| `NEXT_PUBLIC_GA_ID`             | Client          | Google Analytics ID          |
| `JWT_SECRET`                    | Server only     | JWT signing secret           |

---

## CI/CD and Deployment

- **Deployment**: Vercel (Next.js native)
- **CI/CD**: GitHub Actions (`.github/workflows/release.yml`)
- **Versioning**: Semantic Release with Conventional Commits
- **Git Hooks**: Husky + Commitizen for commit message enforcement

---

## Architecture Decision Records

ADRs are stored in `docs/adr/`. See that directory for all significant technical decisions.
