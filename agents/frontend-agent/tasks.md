# Frontend Agent — Task List

This file tracks the standard recurring tasks owned by the Frontend Agent for the EmprendYup project.

## Recurring Tasks

### FT-001: Build UI Components

- Create reusable components in `src/app/components/<ComponentName>/index.tsx`
- Follow TailwindCSS styling and Framer Motion animation conventions
- Export components with named exports
- Handle loading, error, and empty states

### FT-002: Implement Dashboard Modules

- Create or update module pages in `src/app/dashboard/<module>/`
- Ensure modules adapt to `businessType`: `store`, `restaurant`, `service`, `event`
- Apply RBAC guards for seller and admin-only content
- Connect to API via React Query hooks or Apollo Client

### FT-003: Implement Pages and Layouts

- Create page files in the appropriate `src/app/<route>/page.tsx`
- Implement layout wrappers (NavBar, footer, sidebar) as needed
- Use Next.js App Router conventions (Server Components by default)

### FT-004: Connect Frontend to APIs

- Implement API client functions in `src/lib/api/`
- Implement GraphQL queries/mutations in `src/lib/graphql/`
- Create React Query hooks for REST calls; Apollo hooks for GraphQL
- Handle loading, success, and error states in the UI

### FT-005: Build Forms

- Use `react-hook-form` with `@hookform/resolvers/zod` for all new forms
- Define Zod schemas in `src/lib/schemas/`
- Display field-level validation errors
- Disable submit button during submission; show toast on success/error

### FT-006: Maintain Design Consistency

- Apply TailwindCSS utility classes consistently
- Follow the spacing, typography, and color conventions in `tailwind.config.ts`
- Verify responsive behavior on mobile (375px), tablet (768px), and desktop (1280px)
- Use `next-themes` for dark/light mode consistency

### FT-007: Optimize Performance

- Use Server Components for non-interactive content
- Lazy-load heavy components (e.g., Editor.js, FullCalendar) with `next/dynamic`
- Optimize images with `next/image`
- Avoid importing entire icon libraries; import individual icons from `lucide-react`

### FT-008: Write Frontend Tests

- Write unit tests for UI components using the project's test framework
- Write integration tests for page-level flows and form submissions
- Ensure all acceptance criteria from `specs/` are covered by tests

## Notes

- Always read API contracts from the Backend Agent before implementing integrations.
- Coordinate with the Architecture Agent before introducing new UI libraries.
- Update `NEXT_TASK.md` when a task is complete.
- Dashboard modules must always be aware of multi-tenancy — never assume a single `businessType`.
