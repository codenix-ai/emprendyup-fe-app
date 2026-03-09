# Product Agent — Task List

This file tracks the standard recurring tasks owned by the Product Agent for EmprendYup.

## Recurring Tasks

### PT-001: Define Product Scope

- Review business requirements with stakeholders
- Write a high-level scope document in `specs/product-scope.md`
- Define which features apply to which business types (`store`, `restaurant`, `service`, `event`)
- Define MVP vs. future phases for each business type

### PT-002: Generate Feature Spec

- For each feature in `docs/ROADMAP.md`, create a spec file in `specs/<feature-name>.md`
- Include: goal, user stories (with role), requirements, acceptance criteria, business type scope
- Flag any ambiguous requirements for the Architecture Agent to clarify

### PT-003: Break Features into Tasks

- For each approved spec, create granular task files in `tasks/NN-<feature-name>.md`
- Assign the correct agent (`frontend-agent`, `backend-agent`, etc.)
- Ensure each task is small enough to complete in a single development session
- Set priority: High (user-facing, revenue-impacting), Medium (quality of life), Low (nice-to-have)

### PT-004: Maintain the Task Pointer

- After completing or starting a task, update `NEXT_TASK.md`
- Ensure it always points to the highest-priority incomplete task

### PT-005: Maintain Product Roadmap

- Keep `docs/ROADMAP.md` updated with feature status (Planned / In Progress / Done)
- Archive completed specs by moving them to `specs/archive/`
- Document scope changes with rationale

### PT-006: EmprendYup-Specific Recurring Items

- Review WhatsApp template specs for new business events (orders, reservations, reminders)
- Review payment flow specs for any ePayco SDK or plan changes
- Review dashboard module specs when a new business type or vertical is added
- Ensure blog and content creation features remain aligned with the Editor.js setup

## Task Template

When creating a new task file in `tasks/`, use:

```markdown
# Task: <Feature Name>

**Spec:** specs/<feature-name>.md
**Agent:** <frontend-agent | backend-agent | data-agent | testing-agent>
**Priority:** High | Medium | Low
**Status:** Pending | In Progress | Done
**Business Type:** store | restaurant | service | event | all

## Goal

One sentence describing what to implement.

## Requirements

- Requirement 1

## Acceptance Criteria

- [ ] Criterion 1

## Context

Any additional notes or constraints.
```
