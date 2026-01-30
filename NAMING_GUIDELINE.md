# Naming Guideline

## 1. Filenames
- **JavaScript/TypeScript/React-Components:** kebab-case (e.g. user-profile.tsx, dashboard.ts)
- **CSS/Styles:** kebab-case (e.g. app.css, main-style.css)
- **Configuration files:** kebab-case or standard (e.g. vite.config.ts, tsconfig.json)
- **Tests:** kebab-case with `.test` or `.spec` (e.g. user-service.test.ts)
- **Folders:** kebab-case (e.g. user-management, api-services)

## 2. Classnames
- **Rule:** PascalCase 
- **Example:** UserService, ProjectManager, AuthController

## 3. Function- and methodnames
- **Rule:** camelCase 
- **Example:** getUserById, createProject, sendEmail

## 4. Variablennames
- **Rule:** camelCase
- **Example:** userName, projectList, isAdmin

## 5. Constants
- **Rule:** UPPER_SNAKE_CASE
- **Example:** MAX_LOGIN_ATTEMPTS, API_BASE_URL

## 6. Components (React)
- **Rule:** PascalCase für component files and -classes/functions
- **Example:** UserProfile.tsx, Dashboard.tsx

## 7. Interfaces (TypeScript)
- **Rule:** PascalCase, no prefix "I"
- **Example:** User, Project, AuthResponse

## 8. Types (TypeScript)
- **Rule:** PascalCase
- **Example:** UserRole, ProjectStatus

## 9. Enum-Names (TypeScript)
- **Rule:** PascalCase für Enum, UPPER_SNAKE_CASE for Values
- **Example:** UserRole.ADMIN, UserRole.STUDENT

## 10. General Guidelines
- **Avoid Abbreviations or use a uniform system** (e.g. „config“ instead of „cfg“)
- **No special characters**
- **English vocabulary**
