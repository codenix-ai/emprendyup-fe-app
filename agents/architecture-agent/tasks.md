# Architecture Agent — Task List

This file tracks the standard recurring tasks owned by the Architecture Agent for the EmprendYup frontend.

## Recurring Tasks

### AT-001: Define and Maintain System Architecture

- Document the full frontend architecture in `docs/ARCHITECTURE.md`
- Include: Next.js App Router structure, component hierarchy, state management strategy, API integration patterns, auth flow, RBAC model
- Review and update after each major feature or milestone

### AT-002: Review Agent Outputs

- Review implementation proposals and PRs from all agents
- Check for compliance with `docs/ARCHITECTURE.md` and `.github/copilot-instructions.md`
- Approve or request changes before implementations are finalized

### AT-003: Enforce Coding Standards

- Ensure Server Components are used by default; `"use client"` is justified
- Flag improper state management (e.g., duplicating server state in Zustand)
- Identify and flag anti-patterns (e.g., direct localStorage access, hardcoded API URLs)
- Provide guidance and examples for correct patterns

### AT-004: Approve Architecture Changes

- Evaluate requests to introduce new npm packages or services
- Write an ADR for each significant change (new auth strategy, new payment gateway, new state manager)
- Communicate decisions to all affected agents

### AT-005: Multi-tenancy and RBAC Review

- Ensure all new dashboard modules correctly handle `businessType` variants (`store`, `restaurant`, `service`, `event`)
- Verify all privileged routes use `src/lib/utils/rbac.ts` guards
- Review `AdminGuard` and auth wrappers for correctness

### AT-006: Performance and Scalability Review

- Audit code splitting and lazy loading strategies
- Review bundle size impact of new dependencies
- Identify opportunities for Server-Side Rendering, Static Generation, or ISR

### AT-007: Resolve Technical Ambiguity

- When agents surface conflicting or unclear requirements, provide a definitive resolution
- Document the resolution in `docs/ARCHITECTURE.md` or an ADR

## Notes

- The Architecture Agent has final authority on technical decisions.
- Any agent can escalate a technical question to the Architecture Agent.
- ADRs are stored in `docs/adr/` using the format `ADR-NNN-<title>.md`.
- The `.github/copilot-instructions.md` is the quick-reference; `docs/ARCHITECTURE.md` is the full source of truth.
