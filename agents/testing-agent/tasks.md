# Testing Agent — Task List

This file tracks the standard recurring tasks owned by the Testing Agent for the EmprendYup frontend.

## Recurring Tasks

### TT-001: Write Component Unit Tests

- Test all new React components: rendering, props, user interactions, error/loading/empty states
- Test Zustand store actions and state transitions
- Test custom hooks in `src/lib/hooks/` and `src/app/hooks/`
- Mock Apollo Client, React Query, and external API calls

### TT-002: Write API Route Integration Tests

- Test Next.js route handlers in `src/app/api/`
- Cover auth-protected routes: verify 401 for unauthenticated requests
- Cover Zod input validation: verify 400 for invalid inputs
- Test ePayco webhook handler: valid and invalid signature scenarios
- Mock the external `https://api.emprendy.ai` API responses

### TT-003: Validate Acceptance Criteria

- Map each acceptance criterion from the spec to one or more tests
- Mark criteria as verified once corresponding tests pass
- Report any untestable criteria back to the Product Agent

### TT-004: Test Form Validation

- Test Zod schemas in `src/lib/schemas/`: valid inputs, invalid inputs, edge cases
- Test React Hook Form integration: error messages display, submit behavior
- Test form reset and dirty state behavior

### TT-005: Write E2E Tests for Critical Flows

- Registration and login (local auth + Google OAuth)
- Product catalog browse, filter, and search
- Checkout: add to cart → payment → order confirmation
- Seller dashboard: create store, add product, view orders
- RBAC enforcement: customer cannot access seller routes; seller cannot access admin routes

### TT-006: Test Multi-tenancy

- Run dashboard module tests with all `businessType` values: `store`, `restaurant`, `service`, `event`
- Verify correct feature visibility for each business type
- Ensure no cross-tenant data leakage in rendered components

### TT-007: Ensure Coverage and Prevent Regressions

- Run coverage reports; identify untested business-critical paths
- Add regression tests for every bug that is fixed
- Run the full test suite before marking any task complete
- Investigate and fix any tests broken by new changes

## Notes

- Never skip or delete existing tests.
- Use seed data from `datasets/seed/` for test fixtures.
- Coordinate with the DevOps Agent to integrate the test suite into the CI/CD pipeline (`.github/workflows/`).
- Real ePayco credentials must never appear in tests — use mock values.
