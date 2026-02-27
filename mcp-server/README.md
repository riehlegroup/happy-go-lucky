# Happy Go Lucky MCP Server

This MCP server exposes tools generated from the OpenAPI spec (`docs/openapi.yaml`).
The OpenAPI spec is the single source of truth. A generated `mcp.tools.json` is the canonical MCP descriptor consumed at runtime.

## How it works

1. The OpenAPI spec in `docs/openapi.yaml` defines all endpoints and schemas.
2. `npm run generate:mcp` reads the spec and writes `mcp.tools.json` (tools, input schemas, and security metadata).
3. At runtime, the MCP server loads tools from `mcp.tools.json` for determinism.
4. Set `MCP_REGENERATE_TOOLS=true` to build tools on startup directly from OpenAPI (dev-only).

## Environment

- `API_BASE_URL` (default: `http://localhost:3000`)
- `API_AUTH_TOKEN` (optional) — bearer token used by clients or passed per-tool as `bearerToken`
- `MCP_JSON_PATH` (optional) — path to MCP tool descriptor (default: `<repo>/mcp-server/mcp.tools.json`)
- `OPENAPI_PATH` (optional) — path to OpenAPI spec (default: `<repo>/docs/openapi.yaml`)
- `MCP_REGENERATE_TOOLS` (optional, `true`/`false`) — if true, ignore `mcp.tools.json` and build tools at runtime from OpenAPI
- `MCP_HTTP_PORT` (optional) — if set, starts a tiny HTTP status server

## Build

```bash
npm install
npm run build
```

## Generate MCP descriptor

```bash
npm run generate:mcp
```

## Run

```bash
npm start
```

## Test

```bash
npm test --prefix mcp-server
```

## Tools

Tools are generated from the OpenAPI spec and loaded from `mcp.tools.json` at runtime.
You can still call the generic tools:

- `list_openapi_paths`: lists paths and methods from the OpenAPI spec.
- `call_api`: makes an HTTP request to a path in the spec.
  - `bearerToken` is optional; if provided it is forwarded as `Authorization: Bearer <token>`.

### Generated tools (current)

Each OpenAPI operation becomes a tool named by `operationId`. Current tools include:

- Auth: `registerUser`, `login`, `sendPasswordResetEmail`, `resetPassword`, `confirmEmail`, `resendConfirmationEmail`
- Terms: `createTerm`, `listTerms`, `deleteTerm`, `addCourseToTerm`, `listTermCourses`
- Courses: `createCourse`, `listCourses`, `deleteCourse`, `addProjectToCourse`, `updateCourseProject`, `deleteCourseProject`, `listCourseProjects`, `saveCourseSchedule`, `getCourseSchedule`
- Projects: `listProjectsByCourseName`, `editProject`, `getCourseForProject`, `getRoleForProject`, `joinProject`, `leaveProject`, `listUserProjects`, `listUserCourses`, `saveHappinessMetric`, `getProjectHappinessMetrics`, `getAvailableSubmissions`, `sendStandupEmails`
- Users: `listUsers`, `listUsersByStatus`, `updateUserStatus`, `updateAllConfirmedUsers`, `changeUserEmail`, `changeUserPassword`, `setUserGitHubUsername`, `getUserGitHubUsername`, `setUserProjectUrl`, `getUserProjectUrl`, `getUserRole`, `updateUserRole`
- Legacy: `legacySetProjectUrl`, `legacyLeaveProject`

> Note: The complete tool list is generated into `mcp.tools.json` and is the source of truth for tool names and input schemas.

## Example

```json
{
  "tool": "call_api",
  "input": {
    "method": "POST",
    "path": "/session",
    "body": { "email": "sys@admin.org", "password": "helloworld" }
  }
}
```
