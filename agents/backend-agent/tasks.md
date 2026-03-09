# Backend Agent — Task List

This file tracks the standard recurring tasks owned by the Backend Agent for the EmprendYup frontend.

## Recurring Tasks

### BT-001: Implement Next.js Route Handlers

- Create route files in `src/app/api/<resource>/route.ts`
- Export correct HTTP method handlers (GET, POST, PUT, DELETE)
- Validate request bodies with Zod schemas from `src/lib/schemas/`
- Return structured `NextResponse.json()` with appropriate HTTP status codes

### BT-002: Implement Authentication Logic

- Local JWT: issue and verify tokens via `src/lib/utils/localAuth.ts`
- Google OAuth: implement callback handler at `/api/auth/google/callback`
- Protect route handlers by verifying auth token at handler start
- Manage token cookies via `src/lib/utils/authToken.ts`

### BT-003: Implement Payment Routes

- Maintain ePayco checkout creation at `/api/payments/create-checkout`
- Maintain ePayco webhook confirmation at `/api/payments/epayco/confirmation`
- Verify payment signatures before processing
- Update order status after confirmed payment

### BT-004: Proxy External API Calls

- For calls requiring server-side auth or secrets, proxy through Next.js API routes
- Forward JWT in `Authorization: Bearer <token>` header to `api.emprendy.ai`
- Transform and normalize error responses before returning to clients

### BT-005: GraphQL Operations

- Define queries and mutations in `src/lib/graphql/queries.ts`
- Use Apollo Client for client-side GraphQL calls
- For SSR GraphQL, use Apollo server-side utilities with proper cache configuration

### BT-006: API Contract Documentation

- Document all new or changed route handlers (method, path, request body, response shape)
- Share API contracts with the Frontend Agent via `specs/api-contracts/`
- Update `.env.example` if new environment variables are required

### BT-007: Security Review

- Verify all protected endpoints check auth token
- Validate all inputs; never trust client-provided data
- Ensure ePayco webhook handler verifies the payment signature
- Sanitize error messages before returning to clients
- Check for exposed secrets in environment variable handling

## Notes

- Keep route handlers thin — business logic goes in `src/lib/` functions.
- Always read `docs/ARCHITECTURE.md` before starting a task.
- Coordinate with the Architecture Agent before adding new dependencies.
- Update `NEXT_TASK.md` when a task is complete.
