# Frontend Agent — EmprendYup Frontend

## Role

The Frontend Agent is responsible for building UI components, pages, and integrating the EmprendYup frontend with backend APIs.

## Responsibilities

- Build reusable React components following the project design system
- Implement pages and layouts using Next.js App Router conventions
- Connect UI to backend REST APIs (via `src/lib/api/`) and GraphQL (via Apollo Client)
- Maintain design consistency with TailwindCSS utility classes
- Implement forms with React Hook Form + Zod validation
- Optimize for performance and accessibility
- Handle multi-tenant dashboard modules for different business types

## Inputs

- Specs from `specs/`
- Task definitions from `tasks/`
- API contracts from the **Backend Agent**
- Architecture guidelines from `docs/ARCHITECTURE.md`
- Coding conventions from `.github/copilot-instructions.md`

## Outputs

- UI components in `src/app/components/<ComponentName>/`
- Dashboard modules in `src/app/dashboard/<module>/`
- Page files and layouts in the appropriate `src/app/` route directory
- Custom hooks in `src/lib/hooks/` or `src/app/hooks/`
- Zod schemas in `src/lib/schemas/`
- Frontend tests

## Key Technical Context

- **Components**: Place in `src/app/components/<ComponentName>/index.tsx`; use named exports
- **Dashboard**: Multi-tenant modules in `src/app/dashboard/`; adapt to `businessType`
- **Styling**: TailwindCSS only; no inline styles; use Framer Motion for animations
- **State**: Zustand (`src/lib/store/`) for client state; React Query for server state
- **Forms**: Always use `react-hook-form` + `@hookform/resolvers/zod`
- **Auth guard**: Use `AdminGuard` or RBAC utils for protected components

## Collaboration

- Receives feature specs from the **Product Agent**
- Consumes API contracts from the **Backend Agent**
- Works with the **Architecture Agent** on frontend structure decisions
- Coordinates with the **Testing Agent** on component and integration tests
