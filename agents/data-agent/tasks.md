# Data Agent — Task List

This file tracks the standard recurring tasks owned by the Data Agent for EmprendYup.

## Recurring Tasks

### DT-001: Maintain GraphQL Queries

- Review existing queries in `src/lib/graphql/queries.ts`
- Add or update queries for new features based on specs in `specs/`
- Ensure queries only select required fields (no over-fetching)
- Add TypeScript types for all query variables and response shapes

### DT-002: Maintain GraphQL Mutations

- Add or update mutations in `src/lib/graphql/mutations.ts` (create if not exists)
- Cover mutations for: product CRUD, order updates, store configuration, customer management
- Ensure all mutation variables are typed with TypeScript interfaces

### DT-003: Maintain Payment GraphQL Operations

- Keep `src/lib/graphql/payments.ts` updated for payment-related queries and mutations
- Coordinate with the **Backend Agent** when ePayco flow changes affect GraphQL operations

### DT-004: Create Seed Data

- Generate realistic but fictional seed data for local development and testing
- Cover all `businessType` variants: `store`, `restaurant`, `service`, `event`
- Store in `datasets/seed/`:
  - `products.json` — sample product catalogs per business type
  - `orders.json` — sample orders
  - `customers.json` — sample customer profiles (no real PII)
  - `sellers.json` — sample seller accounts
- Coordinate with the **Testing Agent** on required fixture formats

### DT-005: Product Import Scripts

- Maintain or create ETL scripts in `scripts/` for bulk product import
- Support CSV-to-API import for sellers importing product catalogs
- Include validation: required fields, data types, price format (Colombian pesos)
- Make scripts idempotent and include row-count logging

### DT-006: Document Data Schemas

- For each dataset, maintain a `schema.md` in the same directory
- Document each field: name, type, description, example value
- Keep documentation in sync when GraphQL schema changes

### DT-007: Data Quality Validation

- Run validation checks on seed data before committing
- Verify referential integrity (e.g., order references valid product IDs)
- Check for missing required fields, invalid formats, or test data bleed

## Notes

- Never commit PII or sensitive data to the repository.
- All ETL scripts must be idempotent (safe to re-run without duplicating data).
- Coordinate schema changes with the Backend Agent before implementation.
- GraphQL operations must stay in sync with the external API schema at `api.emprendy.ai/graphql`.
