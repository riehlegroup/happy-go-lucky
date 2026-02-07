# API Development Guide (Backend)

This guide explains how to extend the existing HGL backend API safely and consistently.

> Scope: backend code in `server/src/*` (Express + SQLite).

## Architecture at a glance

- The Express app is created in `server/src/createApp.ts`.
  - JSON parsing via `body-parser`.
  - CORS enabled for `CLIENT_URL` (defaults to `http://localhost:5173`).
- Each controller implements `IAppController` and registers routes in `init(app)`.
  - Controllers live in `server/src/Controllers/*Controller.ts`.
- Business/data logic lives in two main styles:
  - **Managers** (e.g. `CourseManager`, `TermManager`) + domain models.
  - **Direct SQL** in a controller (notably `ProjectController`).

## Route registration

Routes are registered in `createApp`:

- Instantiate controllers
- Call `.init(app)`

If you add a new controller, remember to:

1. Create the controller in `server/src/Controllers/…` and implement `IAppController`.
2. Instantiate it in `server/src/createApp.ts`.
3. Call `yourController.init(app)`.

## Authentication & authorization

### JWT

- Login endpoint (`POST /session`) returns a JWT.
- Protected endpoints expect:

```http
Authorization: Bearer <jwt>
```

The JWT secret is `JWT_SECRET`.
If `JWT_SECRET` is not set, the middleware falls back to the default
`"your_jwt_secret"` (see `checkAdmin.ts` / `checkOwnership.ts`).

### Middlewares

Use the existing middleware where applicable:

- `checkAdmin(db)`
  - Requires a valid JWT.
  - Loads the user from DB using the `id` in the token.
  - Allows only `userRole === "ADMIN"`.
- `checkOwnership(db)`
  - Requires a valid JWT.
  - Compares the token’s user with `req.body.userEmail`.
  - Admins can edit anyone; regular users can only edit themselves.

When adding a protected endpoint:

- Prefer middleware at the route level:
  - `app.post('/term', checkAdmin(db), this.createTerm.bind(this))`
- Keep middleware responses consistent (`401` for missing/invalid token, `403` for forbidden).

## Input validation

The codebase uses explicit validation inside controller methods.

Recommended pattern:

1. Validate presence and type (`typeof x === 'string'`).
2. Parse numbers with `parseInt` and check `isNaN`.
3. For emails, prefer the `Email` value type (`server/src/ValueTypes/Email.ts`) when used in new code.
4. Return early with `400` if validation fails.

### Keep names stable

Frontend/tests currently depend on existing field names like:

- `courseName`, `termId`
- `projectName`
- `userEmail`, `memberEmail`, `newGithubUsername`

If you introduce new endpoints, prefer consistent camelCase names.

## Error handling & response shapes

There is some inconsistency today:

- Term/Course endpoints often return `{ success, message, data }`.
- Some project/user endpoints return `{ message }` or raw arrays.

For **new** endpoints, prefer the newer envelope:

```json
{ "success": true, "message": "…", "data": { } }
```

And for errors:

```json
{ "success": false, "message": "…" }
```

Status code guidance:

- `400` validation/format errors
- `401` missing/invalid JWT
- `403` authenticated but not allowed
- `404` resource not found
- `500` unexpected errors

If you’re adding endpoints to `CourseController`/`TermController`, reuse the controller’s `handleError` pattern.

## Working with the database

- The backend uses SQLite via the `sqlite` package.
- Helpers like `DatabaseHelpers` exist for common lookups.

Recommended approach:

- If the feature belongs to courses/terms/projects as domain objects, prefer going through a **Manager**.
- If you must use raw SQL:
  - Keep queries small and readable.
  - Use parameterized queries (`?`) to avoid injection.
  - Decide on a stable response format and test it.

## Adding a new endpoint: checklist

1. **Choose a controller**
   - Add related endpoints to an existing controller when it matches the domain.
   - Otherwise create a new controller and register it in `createApp`.
2. **Add the route in `init(app)`**
3. **Implement the handler**
   - Validate inputs
   - Perform DB/manager operations
   - Return consistent JSON + status code
4. **Add/adjust auth middleware** (if needed)
5. **Write tests** (required)
6. **Run formatting/lint/tests**

## Testing the API

Backend API tests live in:

- `server/src/tests/api/*.api.test.ts`

They use:

- **Vitest** (`vitest run`)
- **Supertest** for HTTP calls against an in-memory Express app
- Helpers in `server/src/tests/api/helpers/*` to create/seed a test DB

### Running tests

From repo root:

```bash
npm run test
```

Or backend-only:

```bash
npm test --prefix server
```

### Adding a test

- Create/extend a file in `server/src/tests/api/`.
- Use `createTestDb()` + `seedDatabase(db)`.
- Create the Express app with `createApp(db)`.

If your endpoint requires JWT:

- Use helpers like `generateAdminToken()` / `generateUserToken()` and `createAuthHeader()` (see `server/src/tests/api/helpers/authHelpers.ts`).

## Local development

From repo root:

```bash
npm run dev
```

This runs client + server concurrently.

Backend runs on `PORT` (default `3000`).

## Email behavior in development

Email sending is configured in `server/src/createApp.ts`:

- Production: SMTP or local MTA, depending on env vars.
- Development: `ConsoleEmailService` (prints emails to stdout).

When adding endpoints that send email, prefer using the injected `IEmailService` like existing controllers do.

## Deployment note: `/api` prefix

In production, Caddy proxies `/api/*` to the backend and strips the `/api` prefix.

That means:

- Frontend calls: `https://your-domain.com/api/session`
- Backend route remains: `POST /session`

If you add new backend routes, the frontend should call them with `/api/<route>` when deployed behind Caddy.
