# Class diagram
```mermaid
classDiagram
  %% Existing classes
    class User <<HappyGoLucky>> {
        +String id
        +String email
        +String firstName
        +String lastName
        ...
    }

    class Project <<HappyGoLucky>> {
        +int id
        +String projectName
        +int courseId
    }

   %% classes of Competition Service
    class Competition {
        +int id
        +String title
        +boolean isActive
    }

    class CompetitionParticipant {
        +int id
        +int competitionId
        +String userId    
        +int projectId     
        +Date joinedAt
    }

    class CompetitionSubmission {
        +int id
        +int participantId
        +Date timestamp
        +String fileUrl
        +String status
    }

    class Evaluation {
        +int id
        +int submissionId
        +float score
    }

    %% Beziehungen innerhalb des Competition-Systems
    Competition "1" *-- "*" CompetitionParticipant : registers
    CompetitionParticipant "1" -- "*" CompetitionSubmission : uploads
    CompetitionSubmission "1" *-- "1" Evaluation : results in

    %% DIE BRÜCKEN ZUM HAUPT-SYSTEM (Read-Only Foreign Keys)
    User "1" <-- "*" CompetitionParticipant : is evaluated
    Project "1" <-- "*" CompetitionParticipant : represents