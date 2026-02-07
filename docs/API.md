# Happy Go Lucky API Reference

This document describes the **existing** backend HTTP API exposed by the HGL Express server.

## Base URL

The backend registers routes at the root (e.g. `/user`, `/term`). How you reach it depends on your setup:

- **Local dev (direct backend):** `http://localhost:3000` → call `http://localhost:3000/user`, `http://localhost:3000/session`, …
- **Production via Caddy:** the frontend calls `/api/*`, Caddy strips `/api` and forwards to the backend.
  - Example: `https://your-domain.com/api/session` → backend receives `POST /session`.

## Request/Response conventions

- Requests with bodies use `Content-Type: application/json`.
- Most endpoints return JSON.
- Response envelopes are **not fully consistent** across all endpoints:
  - Newer endpoints often use `{ "success": boolean, "message"?: string, "data"?: any }`.
  - Several endpoints return a **raw array/object** directly (e.g. `GET /getUsers`, `GET /courseProject`).

## Authentication

Authentication is based on **JWT**.

1. Obtain a token via `POST /session`.
2. Send it on protected endpoints:

```http
Authorization: Bearer <jwt>
```

The JWT secret is read from the `JWT_SECRET` environment variable. In all non-test environments, you must configure a strong, unpredictable secret; deployments without `JWT_SECRET` are considered misconfigured and should be fixed before exposing the server.

### Authorization rules

Some routes require:

- **Admin**: must have `userRole === "ADMIN"` (checked by middleware).
- **Ownership or Admin**: must be the same user as the `userEmail` in the request body *or* be an admin.

## Common status codes

- `200` OK
- `201` Created (some write endpoints)
- `400` Validation error / bad request
- `401` Authentication required / invalid token
- `403` Forbidden (insufficient permissions)
- `404` Not found
- `500` Server error

## Quick examples

### Login

```bash
curl -sS -X POST http://localhost:3000/session \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@test.com","password":"Test123!"}'
```

### Admin-only: create term

```bash
TOKEN="…"
curl -sS -X POST http://localhost:3000/term \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"termName":"SS2026","displayName":"Summer 2026"}'
```

---

# Endpoints

## Health

### `GET /`

Returns a plain string.

- **Response:** `200` with body `Server is running!`

## Authentication

### `POST /user` — Register

- **Body**
  - `name` (string, min length 3)
  - `email` (string, valid email)
  - `password` (string; must meet strength requirements)
- **Response**
  - `201 { "message": "User registered successfully" }`
  - `400 { "message": "…" }` on validation errors

Notes:
- Newly registered users start with status `unconfirmed`.
- The server generates a confirmation token and sends a confirmation email (email delivery depends on environment).

### `POST /session` — Login

- **Body**
  - `email` (string)
  - `password` (string)
- **Response**
  - `200 { token, name, email, githubUsername }`
  - `400 { message }` for invalid credentials, invalid email format, or blocked user state

User states that block login:
- `unconfirmed` → “Email not confirmed…”
- `suspended` → “User account is suspended…”
- `removed` → “User account is removed…”

### `POST /user/password/forgotMail` — Request password reset

- **Body**: `{ "email": string }`
- **Response**
  - `200 { "message": "Password reset email sent" }`
  - `404 { "message": "Email not found" }`

### `POST /user/password/reset` — Reset password

- **Body**: `{ "token": string, "newPassword": string }`
- **Response**
  - `200 { "message": "Password has been reset" }`
  - `401 { "message": "Invalid or expired reset token" }`

### `POST /user/confirmation/email` — Confirm email

- **Body**: `{ "token": string }`
- **Response**
  - `200 { "message": "Email has been confirmed" }`
  - `401 { "message": "Invalid or expired confirmation token" }`

### `POST /user/confirmation/trigger` — Resend confirmation email

- **Body**: `{ "email": string }`
- **Response**
  - `200 { "message": "Confirmation email sent" }`
  - `400 { "message": "User not found or not unconfirmed" }` (already confirmed / not eligible)

## Terms

### `GET /term` — List terms

- **Auth:** none
- **Response:**
  - `200 { success: true, data: Array<{ id, termName, displayName }> }`

### `POST /term` — Create term

- **Auth:** admin (`Authorization: Bearer …`)
- **Body**: `{ termName: string, displayName?: string }`
- **Response:**
  - `201 { success: true, message: "Term created successfully", data: … }`

### `DELETE /term/:id` — Delete term

- **Auth:** admin
- **Response:**
  - `200 { success: true, message: "Term deleted successfully" }`
  - `400` if the term still has courses (cannot delete)

### `POST /termCourse` — Add course to term

- **Auth:** admin
- **Body**: `{ termId: number, courseName: string }`
- **Response:**
  - `201 { success: true, message: "Course added successfully", data: { id, courseName, termId } }`

### `GET /term/courses` — List courses for a term

- **Auth:** none
- **Query**: `termId=<number>`
- **Response:**
  - `200 { success: true, data: Array<{ id, courseName, termId }> }`

## Courses

### `POST /course` — Create course

- **Auth:** none
- **Body**: `{ courseName: string, termId: number }`
- **Response:**
  - `201 { success: true, message: "Course created successfully", data: … }`

### `GET /course` — List courses

- **Auth:** none
- **Response:**
  - `200 { success: true, data: Array<{ id, courseName, termId }> }`

### `DELETE /course/:id` — Delete course

- **Auth:** admin
- **Response:**
  - `200 { success: true, message: "Course deleted successfully" }`
  - `400` if the course still has projects

### `POST /courseProject` — Create a project within a course

- **Auth:** none
- **Body**: `{ courseId: number, projectName: string }`
- **Response:**
  - `201 { success: true, message: "Project added successfully", data: { id, projectName, courseId } }`

### `GET /course/courseProjects` — List course projects

- **Auth:** none
- **Query**:
  - `courseId=<number>`
  - Optional `userEmail=<email>` to split into `enrolledProjects` and `availableProjects`
- **Response**:
  - Default: `200 { success: true, data: Array<{ id, projectName, courseId }> }`
  - With `userEmail`: `200 { success: true, enrolledProjects: […], availableProjects: […] }`

### `PUT /courseProject/:id` — Update a course project

- **Auth:** none
- **Body**: `{ projectName: string, courseId?: number }`
- **Response:**
  - `200 { success: true, message: "Project updated successfully", data: { id, projectName, courseId } }`

### `DELETE /courseProject/:id` — Delete a course project

- **Auth:** none
- **Response:**
  - `200 { success: true, message: "Project deleted successfully" }`

### `POST /course/:id/schedule` — Create/update course schedule

- **Auth:** none
- **Body**:
  - `startDate` (string, e.g. `"2024-01-01"`)
  - `endDate` (string)
  - `submissionDates?` (string[], optional)
- **Response:**
  - `200 { success: true, message: "Schedule saved successfully", data: { id, startDate, endDate, submissionDates } }`

### `GET /course/:id/schedule` — Get course schedule

- **Auth:** none
- **Response:**
  - `200 { success: true, data: { id, startDate, endDate, submissionDates } }`

## Project management & membership

These endpoints are implemented in `ProjectController` and are mostly **not** wrapped in `{success, data}`.

### `GET /courseProject` — List projects by course name

- **Query**: `courseName=<string>`
- **Response:** `200` raw array of rows like `{ id, projectName, courseId }`

### `PUT /courseProject` — Edit project (legacy-ish, name-based)

- **Body**: `{ projectName, newProjectName, newCourseName }`
- **Response:** `201 { "message": "Project edited successfully" }`

### `GET /courseProject/course` — Get course for a project

- **Query**: `projectName=<string>`
- **Response:** `200 { courseId, courseName }`

### `GET /courseProject/user/role` — Get role of a user in a project

- **Query**: `projectName=<string>&email=<email>`
- **Response:** `200 { "role": string }`

### `POST /user/project` — Join project

- **Body**: `{ projectName, memberEmail, memberRole }`
- **Response:** `201 { "message": "Joined project successfully" }`

### `DELETE /user/project` — Leave project

- **Body**: `{ projectName, userEmail }`
- **Response:** `200 { "message": "Left project successfully" }`

### `GET /user/projects` — List projects of a user

- **Query**: `userEmail=<email>`
- **Response:** `200` raw array of `{ id, projectName }`

### `GET /user/courses` — List enrolled courses of a user

- **Query**: `userEmail=<email>`
- **Response:** `200` raw array of `{ id, courseName }`

## Happiness & standups

### `POST /courseProject/happiness` — Save happiness metric

- **Body**: `{ projectName, userEmail, happiness: number, submissionDateId: number }`
- **Response:** `200 { "message": "Happiness updated successfully" }`

### `GET /courseProject/happiness` — Get happiness metrics

- **Query**: `projectName=<string>`
- **Response:** `200` raw array of entries containing `submissionDate`, `userEmail`, `happiness`, `timestamp`, …

### `GET /courseProject/availableSubmissions` — Next available submission date

- **Query**: `projectName=<string>`
- **Response:** `200 { id, submissionDate: ISOString, scheduleId }`

### `POST /courseProject/standupsEmail` — Send standup email to project members

- **Body**: `{ projectName, userName, doneText, plansText, challengesText }`
- **Response:** `200 { "message": "Standup email sent successfully" }`

## Users (administration & configuration)

### `GET /getUsers` — List all users

- **Auth:** admin (JWT)
- **Response:** `200` array of sanitized user objects (sensitive fields like password hashes and tokens omitted)

### `GET /user/status` — Filter users by status

- **Auth:** admin (JWT)
- **Query**: `status=<confirmed|unconfirmed|suspended|removed>`
- **Response:** `200` array of sanitized user objects (sensitive fields like password hashes and tokens omitted)

### `POST /user/status` — Update a user’s status

- **Auth:** ownership or admin (JWT)
- **Body**: `{ userEmail: string, status: string }`
- **Response:** `200 { "message": "User status updated successfully" }`

### `POST /user/status/all` — Bulk-update all confirmed users

- **Auth:** none
- **Body**: `{ status: string }`
- **Response:** `200 { "message": "All confirmed users have been updated to …" }`

### `POST /user/mail` — Change email

- **Auth:** Authenticated user (must own the account whose email is changed, e.g. via JWT/session `checkOwnership`)
- **Body**: `{ oldEmail: string, newEmail: string }`
- **Response:** `200 { "message": "Email updated successfully" }`

### `POST /user/password/change` — Change password

- **Auth:** Authenticated user (must own the account whose password is changed, or be an authorized admin)
- **Body**: `{ userEmail: string, password: string }`
- **Response:** `200 { "message": "Password updated successfully" }`

### `POST /user/githubUsername` / `GET /user/githubUsername`

- **POST Body**: `{ userEmail: string, newGithubUsername: string }`
- **GET Query**: `userEmail=<email>`
- **Response:** `200 { githubUsername: string }` (empty string when unset)

### `POST /user/project/url` / `GET /user/project/url`

- **POST Body**: `{ userEmail, projectName, URL }` (must contain `"git"`)
- **GET Query**: `userEmail=<email>&projectName=<string>`
- **Response:** `200 { url: string | null }`

### `GET /user/role` / `POST /user/role`

- **Auth:** Requires authenticated session. `POST /user/role` is **admin-only** (caller must have `ADMIN` role).
- **GET Query**: `userEmail=<email>` → returns `{ userRole: "ADMIN" | "USER" }`
- **POST Body**: `{ email: string, role: string }` → for admins to update another user's `users.userRole`

## Legacy endpoints

These exist for backward compatibility.

### `POST /projConfig/changeURL`

Same as `POST /user/project/url`.

### `POST /projConfig/leaveProject`

Same as `DELETE /user/project` (but uses `POST`).
