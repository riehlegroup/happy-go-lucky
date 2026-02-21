# Naming Guidelines

This document defines **naming rules** for this codebase (client + server).

## Goals

- Keep naming **consistent** across files, identifiers, APIs, database fields, and user-facing text.
- Reduce churn: avoid renames that break public APIs or persisted data unless explicitly approved.

## Canonical spellings (project-wide)

Use these exact spellings in user-facing strings and docs:

- **GitHub**
- **Email**
- **URL**
- **API**
- **ID**

In code identifiers, follow the identifier rules below (e.g., `termId` / `courseId` are preferred over `termID` / `courseID`).

## Identifiers

### Files and folders

- Prefer **PascalCase** for files that primarily export a single class/component with the same name.
  - Examples: `User.ts`, `GitHubRepoURL.ts`, `AuthController.ts`, `Settings.tsx`
- Prefer **camelCase** for utility/entrypoint/config files.
  - Examples: `server.ts`, `createApp.ts`, `databaseInitializer.ts`
- Avoid mixed-case acronyms in file names (e.g., `gitHub…`). Use the canonical casing instead (e.g., `GitHub…`).
- Tests:
  - Unit tests: `Thing.test.ts`
  - API/integration tests: `thing.api.test.ts` (keep the existing pattern)

### Classes, types, interfaces, enums

- **Classes / types / enums**: `PascalCase`
- **Interfaces**: follow existing codebase convention:
  - Prefer `I` prefix where already used: `IAppController`, `IManager`, `IEmailService`

### Functions, methods, variables

- **Functions / methods / variables**: `camelCase`
- **Booleans**: `is…`, `has…`, `can…`, `should…`
  - Example: `isGitHubUrl()`

### Constants and environment variables

- **Constants**: `UPPER_SNAKE_CASE`
- **Env vars**: `UPPER_SNAKE_CASE` (e.g., `VITE_API_URL`, `ACME_EMAIL`)

## API and persistence

### HTTP routes

- Keep existing route naming stable (do not rename routes without versioning).
- For new routes, prefer consistency with existing ones (this repo currently uses camelCase segments like `/user/githubUsername`).

### JSON payload keys

- Use **camelCase** (e.g., `githubUsername`, `courseId`, `termId`).
- Avoid renaming payload keys without an explicit migration plan (client/server/tests must move together; consider accepting both keys temporarily).

### Database field names

- Keep existing DB schema/column names stable unless a migration is planned.

## User-facing strings (UI, emails, docs)

- Use canonical spellings: **GitHub**, **Email**, **URL**, **API**, **ID**.
- Headings: Title Case where appropriate.
- Messages: sentence case (avoid random capitalization).

## Approval process for repo-wide renames

Before doing broad renames, confirm scope:

- **Safe without approval**: purely internal refactors that don’t change public routes/payload keys/storage keys.
- **Requires explicit approval**: renaming API routes, JSON keys, DB fields, localStorage keys, or anything that affects external clients.
