# DevOps Agent — Task List

This file tracks the standard recurring tasks owned by the DevOps Agent for the EmprendYup frontend.

## Recurring Tasks

### DO-001: CI/CD Pipeline Maintenance

- Review and update `.github/workflows/` pipeline files
- Ensure pipeline includes: lint → typecheck → test → build steps
- Add or update caching for `node_modules` to reduce CI time
- Ensure pipeline runs on PRs to `main` and on push to `main`

### DO-002: Semantic Release Configuration

- Maintain the release pipeline in `.github/workflows/release.yml`
- Ensure Conventional Commits enforcement via Commitizen + Husky
- Verify `CHANGELOG.md` is updated automatically on release
- Test release workflow in a non-main branch before changes go live

### DO-003: Environment Variable Management

- Keep `.env.example` updated with all required variables and descriptions
- Required variables:
  - `NEXT_PUBLIC_API_URL` — EmprendYup REST API
  - `NEXT_PUBLIC_GRAPHQL_ENDPOINT` — GraphQL endpoint
  - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` — Google OAuth
  - `GOOGLE_CLIENT_SECRET` — Google OAuth (server-side only)
  - `EPAYCO_PUBLIC_KEY`, `EPAYCO_PRIVATE_KEY`, `EPAYCO_P_CUST_ID_CLIENT` — ePayco
  - `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` — Image storage
  - `NEXT_PUBLIC_GOOGLE_MAPS_KEY` — Maps
  - `NEXT_PUBLIC_GA_ID` — Google Analytics
  - `JWT_SECRET` — Token signing (server-side)

### DO-004: Vercel Deployment Configuration

- Manage Vercel project settings for Production, Preview, and Development environments
- Sync environment variables to Vercel (Production and Preview)
- Configure custom headers or redirects in `vercel.json` if needed
- Monitor deployment logs and fix broken deployments promptly

### DO-005: Docker Setup (Local Development)

- Maintain `Dockerfile` with multi-stage build (deps → builder → runner)
- Maintain `docker-compose.yml` for local development
- Verify `docker compose up` starts the app correctly on port 3000
- Keep Docker image based on `node:20-alpine` for minimal size

### DO-006: Build Optimization

- Monitor Next.js bundle size with `npm run build` output
- Flag bundles exceeding size thresholds to the Architecture Agent
- Configure `next.config.mjs` for image domains, headers, or performance settings
- Ensure `next/dynamic` is used for heavy client-side-only libraries

### DO-007: Monitoring and Alerting

- Configure Vercel deployment failure notifications
- Set up uptime monitoring for the production frontend URL
- Ensure structured logging is in place for Next.js API routes
- Set up alerting for payment webhook failures

## Notes

- All infrastructure changes must be reviewed by the Architecture Agent.
- Integrate the test suite (from the Testing Agent) into every CI pipeline run.
- Keep `package-lock.json` committed and use `npm ci` in all CI environments.
- Document any non-obvious pipeline steps with inline comments in workflow files.
