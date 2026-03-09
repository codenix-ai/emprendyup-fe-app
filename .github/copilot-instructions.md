# GitHub Copilot Instructions — EmprendYup Frontend

## Project Overview

**EmprendYup** is a multi-tenant e-commerce and business management platform for Latin American entrepreneurs. It supports multiple business types: online stores, restaurants, service providers, and event organizers.

## Tech Stack

| Layer         | Technology                                                |
| ------------- | --------------------------------------------------------- |
| Framework     | Next.js 15 (App Router)                                   |
| Language      | TypeScript 5                                              |
| UI            | React 18, TailwindCSS 3, Framer Motion                    |
| State         | Zustand 5 (client), TanStack React Query 5 (server)       |
| Data Fetching | Apollo Client 3 (GraphQL), Next.js fetch                  |
| Forms         | React Hook Form 7 + Zod 4                                 |
| Auth          | Custom JWT (local) + Google OAuth (`@react-oauth/google`) |
| Payments      | ePayco SDK                                                |
| Rich Text     | Editor.js 2                                               |
| Calendar      | FullCalendar 6                                            |
| Charts        | Recharts 2                                                |
| Notifications | React Hot Toast, Sonner                                   |
| Icons         | Lucide React, React Icons                                 |
| HTTP Client   | Native fetch + Apollo                                     |
| Backend API   | REST at `https://api.emprendy.ai` + GraphQL at `/graphql` |
| Storage       | AWS S3                                                    |
| Maps          | Google Maps JS API                                        |
| Analytics     | Google Analytics                                          |

## Project Structure

```
src/
├── app/                  # Next.js App Router
│   ├── api/              # Next.js route handlers (auth, payments, dashboard)
│   ├── components/       # Reusable React components (80+)
│   ├── dashboard/        # Multi-tenant seller/admin dashboard modules
│   ├── assets/           # Images, fonts, SCSS
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # App-level utilities
│   └── hooks/            # App-level React hooks
└── lib/
    ├── api/              # API client functions
    ├── store/            # Zustand stores
    ├── hooks/            # Shared custom hooks
    ├── graphql/          # GraphQL queries
    ├── utils/            # Auth, RBAC, money formatting
    ├── blog/             # Blog utilities
    ├── payments/         # ePayco integration
    ├── schemas/          # Zod validation schemas
    └── constants/        # User roles, config constants
```

## Coding Conventions

### General

- Use **TypeScript** for all new files; avoid `any` types.
- Use **named exports** for components; default exports only for Next.js pages/layouts.
- Keep components **small and focused** — one responsibility per component.
- Use **Zod schemas** for all form validation and API input validation.
- All environment variables must be prefixed with `NEXT_PUBLIC_` for client-side access; never hardcode URLs or keys.

### Components

- Place reusable components in `src/app/components/<ComponentName>/index.tsx`.
- Use **TailwindCSS** utility classes for styling; avoid inline styles.
- Always handle **loading** and **error** states in UI components.
- Use **Framer Motion** for transitions and animations (not CSS keyframes for complex motion).
- Accessibility: use semantic HTML and ARIA attributes where needed.

### State Management

- Use **Zustand** for shared client UI state (dashboard filters, cart, etc.).
- Use **TanStack React Query** for server state (fetching, caching, mutations).
- Use **Apollo Client** for GraphQL data fetching.
- Prefer local `useState` for purely local component state.

### API & Data

- All API calls go through functions in `src/lib/api/` or GraphQL queries in `src/lib/graphql/`.
- Use `src/lib/utils/authToken.ts` for token management; never access localStorage directly.
- Use `src/lib/utils/rbac.ts` for role-based access checks.
- Return structured error objects from API functions; do not throw raw errors to the UI.

### Forms

- Use `react-hook-form` with `@hookform/resolvers/zod` for all forms.
- Define schemas in `src/lib/schemas/` and reuse across form and API validation.

### Payments

- All ePayco logic lives in `src/lib/payments/epayco.ts` and `src/app/api/payments/`.
- Never log or expose payment credentials; use environment variables.

### File Naming

- Components: `PascalCase` (e.g., `ProductCard.tsx`)
- Hooks: `camelCase` prefixed with `use` (e.g., `useSearchProducts.ts`)
- Utilities: `camelCase` (e.g., `localAuth.ts`)
- Schemas: `camelCase` (e.g., `dashboard.ts`)

## AI Agent Team

This project uses an AI agent team to improve development velocity. See `agents/` for agent definitions.

| Agent                | Responsibility                              |
| -------------------- | ------------------------------------------- |
| `architecture-agent` | System design, technical standards, ADRs    |
| `frontend-agent`     | UI components, pages, API integrations      |
| `backend-agent`      | Next.js API routes, GraphQL, auth, payments |
| `testing-agent`      | Unit, integration, and E2E tests            |
| `devops-agent`       | CI/CD, Vercel deployment, Docker            |
| `product-agent`      | Feature specs, task breakdown, roadmap      |
| `data-agent`         | GraphQL queries, seed data, data pipelines  |

## Business Domain Context

- **User Roles**: `customer`, `seller`, `admin` (see `src/lib/constants/user-roles.ts`)
- **Business Types**: `store`, `restaurant`, `service`, `event/fair`
- **Payment Flow**: ePayco checkout → webhook confirmation → order update
- **Multi-tenancy**: Each seller has a store; dashboard modules adapt to their business type
- **Authentication**: JWT stored in HTTP-only cookies via Next.js API routes; Google OAuth via `/api/auth/google/callback`
