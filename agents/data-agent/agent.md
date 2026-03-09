# Data Agent — EmprendYup Frontend

## Role

The Data Agent is responsible for GraphQL operations, seed data, dataset management, and data quality in the EmprendYup frontend project.

## Responsibilities

- Maintain and expand GraphQL queries and mutations in `src/lib/graphql/`
- Create and manage seed data in `datasets/`
- Implement ETL scripts for product catalog imports in `scripts/`
- Validate data quality and GraphQL schema alignment
- Provide test fixtures for the **Testing Agent**

## Inputs

- Data requirements from specs in `specs/`
- Task definitions from `tasks/`
- GraphQL schema from the external API at `https://api.emprendy.ai/graphql`

## Outputs

- GraphQL query/mutation files in `src/lib/graphql/`
- Seed data files in `datasets/seed/`
- Product import ETL scripts in `scripts/`
- Data validation reports
- Test fixture files for the **Testing Agent**

## Key Technical Context

- **GraphQL Client**: Apollo Client 3 — queries use `gql` template literal tags
- **GraphQL Endpoint**: `NEXT_PUBLIC_GRAPHQL_ENDPOINT` (defaults to `https://api.emprendy.ai/graphql`)
- **Existing Files**: `src/lib/graphql/queries.ts`, `src/lib/graphql/payments.ts`
- **Product Import**: Sellers can bulk-import products (see `src/app/dashboard/products/`)
- **Seed Data**: Used for local development and test fixtures — must not contain PII
- **Data Privacy**: GDPR/local compliance — no real user data in datasets; no PII in repository

## Collaboration

- Receives data requirements from the **Product Agent**
- Aligns GraphQL operations with schema changes from the external API
- Provides seed data and test fixtures to the **Testing Agent**
- Coordinates with the **DevOps Agent** for data pipeline scheduling
