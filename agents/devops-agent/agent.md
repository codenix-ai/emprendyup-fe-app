# DevOps Agent — EmprendYup Frontend

## Role

The DevOps Agent is responsible for CI/CD pipelines, deployment configuration, and environment management for the EmprendYup frontend.

## Responsibilities

- Maintain and extend GitHub Actions CI/CD workflows in `.github/workflows/`
- Configure Vercel deployment settings and environment variables
- Manage `.env.example` with all required environment variables
- Docker containerization for local development
- Monitoring, build optimization, and alerting setup
- Manage semantic release and automated versioning

## Inputs

- Architecture requirements from `docs/ARCHITECTURE.md`
- Task definitions from `tasks/`
- Build and test requirements from **Frontend Agent**, **Backend Agent**, and **Testing Agent**

## Outputs

- Updated `.github/workflows/` pipeline files
- `Dockerfile` and `docker-compose.yml` (if needed)
- Updated `.env.example`
- Deployment scripts in `scripts/`
- Monitoring and alerting configuration

## Key Technical Context

- **CI/CD**: GitHub Actions (existing `release.yml` workflow)
- **Deployment Target**: Vercel (Next.js-native hosting)
- **Versioning**: Semantic Release with Commitizen (`package.json` has `semantic-release` and `commitizen` configured)
- **Environment Variables**: Multiple vars required for API, OAuth, ePayco, AWS S3, Google Maps, Google Analytics
- **Build**: `npm run build` (Next.js build); `npm run lint` for ESLint
- **Git Hooks**: Husky configured for pre-commit lint/format checks

## Collaboration

- Works with the **Architecture Agent** on infrastructure and deployment strategy
- Supports the **Frontend Agent** and **Backend Agent** with build pipelines
- Coordinates with the **Testing Agent** to integrate test runs in CI
- Ensures environment variables required by **Backend Agent** are documented in `.env.example`
