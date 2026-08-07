#Class-Diagram

```mermaid
classDiagram
    %% ==========================================
    %% BEREICH 1: BESTEHENDES SYSTEM (HappyGoLucky)
    %% ==========================================
    class User <<HappyGoLucky>> {
        +int id
        +String name
        +String email
        +String userRole
        ...
    }

    class Course <<HappyGoLucky>> {
        +int id
        +String courseName
        +int termId
        +String[] enabledFeatures
        ...
    }

    class Project <<HappyGoLucky>> {
        +int id
        +String projectName
        +int courseId
    }

    %% ==========================================
    %% BEREICH 2: COMPETITION SYSTEM
    %% ==========================================
    class Competition {
        +int id
        +int courseId
        +String title
        +String description
        +Date startDate
        +Date endDate
        +boolean isActive
    }

    class CompetitionDataset {
        +int id
        +int competitionId
        +String dataType
        +String fileUrl
    }

    class CompetitionParticipant {
        +int id
        +int competitionId
        +int userId    
        +int projectId     
        +Date joinedAt
    }

    class CompetitionSubmission {
        +int id
        +int participantId
        +String apiUrl
        +Date registeredAt
        +String status
    }

    class CompetitionEvaluation {
        +int id
        +int submissionId
        +int score
        +String evaluationDetails
        +Date evaluatedAt
        +String status
    }

    %% ------------------------------------------
    %% Beziehungen innerhalb des Competition-Systems
    %% ------------------------------------------
    Competition "1" *-- "*" CompetitionDataset : contains
    Competition "1" *-- "*" CompetitionParticipant : registers
    
    %% Hat sich geändert: Statt Datei-Upload wird jetzt eine API/Endpoint registriert
    CompetitionParticipant "1" -- "*" CompetitionSubmission : registers endpoint
    
    %% Eine Submission hat 0 oder 1 Evaluation (abhängig vom Status)
    CompetitionSubmission "1" *-- "0..1" CompetitionEvaluation : creates

    %% ------------------------------------------
    %% DIE BRÜCKEN ZUM HAUPT-SYSTEM (Read-Only Foreign Keys)
    %% ------------------------------------------
    Course "1" <-- "0..1" Competition : has competition
    User "1" <-- "*" CompetitionParticipant : is evaluated as
    Project "1" <-- "*" CompetitionParticipant : represented by
````