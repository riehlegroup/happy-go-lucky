# State Model – Happy Go Lucky

This document describes the core domain value types and state transitions
used in the Happy Go Lucky application.

It is intended for developers to understand how user status, user roles,
and terms are modeled and validated.

---

## 1. User Status

User status is implemented as an **enum-based value type** to prevent
invalid state transitions.

### Possible Status Values

| Status    | Description                  |
|-----------|-----------------------------|
| NEW       | Newly registered user        |
| ACTIVE    | Fully active user            |
| SUSPENDED | User who has been suspended  |

### Allowed Transitions

| Current Status | Method      | Next Status |
|----------------|------------|------------|
| NEW            | activate() | ACTIVE     |
| ACTIVE         | suspend()  | SUSPENDED  |

> Attempting an invalid transition (e.g., NEW → SUSPENDED) will throw an error.

---

## 2. User Roles

User roles define permissions and capabilities.

### Possible Roles

| Role  | Description          |
|-------|--------------------|
| USER  | Standard user role  |
| ADMIN | Elevated admin role |

### Allowed Transitions

| Current Role | Method           | Next Role |
|--------------|----------------|-----------|
| USER         | promoteToAdmin() | ADMIN     |

> Demotion from ADMIN → USER is not supported.

---

## 3. Terms

A **Term** represents a time period with a start and end date.

### Validation Rules

- `end` date must be after `start` date  
- Invalid terms result in an error

### Example Implementation (TypeScript)

```ts
class Term {
  constructor(public start: Date, public end: Date) {
    if (end <= start) {
      throw new Error("Invalid term: end must be after start");
    }
  }
}


Example Usage
const term = new Term(new Date("2026-01-01"), new Date("2026-06-30"));