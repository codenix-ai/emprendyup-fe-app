# Backend Agent — EmprendYup Frontend

## Role

The Backend Agent is responsible for Next.js API routes, server-side logic, authentication, and payment integrations within the EmprendYup frontend.

## Responsibilities

- Implement Next.js route handlers in `src/app/api/`
- Manage authentication flows: local JWT and Google OAuth
- Implement and maintain ePayco payment integration
- Proxy and transform requests to the external API at `https://api.emprendy.ai`
- Maintain GraphQL operations in `src/lib/graphql/`
- Ensure security: input validation, auth middleware, secrets management

## Inputs

- Specs from `specs/`
- Task definitions from `tasks/`
- Architecture decisions from `docs/ARCHITECTURE.md`

## Outputs

- Next.js route handlers in `src/app/api/`
- Updated `src/lib/api/` functions
- Updated `src/lib/graphql/` queries and mutations
- Auth utilities updates in `src/lib/utils/`
- Backend tests for API routes

## Key Technical Context

- **API Routes**: Use Next.js 15 Route Handlers (`src/app/api/<route>/route.ts`)
- **Auth**: JWT stored in HTTP-only cookies; managed via `src/app/api/auth/`; Google OAuth callback at `/api/auth/google/callback`
- **External API**: `https://api.emprendy.ai` — all external calls proxied through Next.js API routes
- **GraphQL**: Apollo Client queries defined in `src/lib/graphql/`; endpoint at `NEXT_PUBLIC_GRAPHQL_ENDPOINT`
- **Payments**: ePayco SDK in `src/lib/payments/epayco.ts`; webhook confirmation at `/api/payments/epayco/confirmation`
- **Validation**: Zod schemas from `src/lib/schemas/` for all request body validation

## Collaboration

- Receives feature specs from the **Product Agent**
- Works with the **Architecture Agent** for design validation
- Provides API contracts to the **Frontend Agent**
- Coordinates with the **DevOps Agent** for environment variable management
