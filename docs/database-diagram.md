# ER-Diagramm

```mermaid
erDiagram
    users {
        INTEGER id PK
        TEXT name
        TEXT githubUsername
        TEXT email UK
        TEXT status
        TEXT password
        TEXT userRole
        TEXT resetPasswordToken
        INTEGER resetPasswordExpire
        TEXT confirmEmailToken
        INTEGER confirmEmailExpire
    }

    terms {
        INTEGER id PK
        TEXT termName UK
        TEXT displayName
    }

    courses {
        INTEGER id PK
        TEXT courseName UK
        INTEGER termId FK
        INTEGER studentsCanCreateProject
        TEXT(JSONarray) enabledFeatures 
    }

    projects {
        INTEGER id PK
        TEXT projectName UK
        INTEGER courseId FK
    }

    user_projects {
        INTEGER userId PK, FK
        INTEGER projectId PK, FK
        TEXT role
        TEXT url
    }

    competitions {
        INTEGER id PK
        TEXT title
        TEXT description
        INTEGER projectId FK
        DATETIME startDate
        DATETIME endDate
        TEXT status
    }

    competition_datasets {
        INTEGER id PK
        INTEGER competitionId FK
        TEXT dataType
        TEXT fileUrl
    }

    competition_endpoints {
        INTEGER id PK
        INTEGER competitionId FK
        INTEGER userId FK
        TEXT apiUrl
        DATETIME registeredAt
    }

    competition_evaluations {
        INTEGER id PK
        INTEGER competitionId FK
        INTEGER userId FK
        INTEGER score
        TEXT evaluationDetails
        DATETIME evaluatedAt
        TEXT status
    }

    terms ||--o{ courses : "hat"
    courses ||--o{ projects : "enthaelt"
    users ||--o{ user_projects : "nimmt_teil"
    projects ||--o{ user_projects : "besteht_aus"
    projects ||--o{ competitions : "hat_competitions"
    competitions ||--o{ competition_datasets : "beinhaltet"
    competitions ||--o{ competition_endpoints : "registriert_urls"
    competitions ||--o{ competition_evaluations : "erzeugt_scores"
    users ||--o{ competition_endpoints : "gehoert"
    users ||--o{ competition_evaluations : "erhaelt"
```
