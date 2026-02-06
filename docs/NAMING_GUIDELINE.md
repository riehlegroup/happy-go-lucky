# Naming Guideline

## 1. Filenames
- **React-Components:** PascalCase (e.g. UserProfile.tsx, Dashboard.tsx)
- **TypeScript modules/classes (server):** PascalCase (e.g. UserController.ts, CourseManager.ts)
- **Utility/config files:** camelCase or kebab-case (e.g. utils.ts, api.ts, vite.config.ts)
- **CSS/Styles:** PascalCase matching component or kebab-case (e.g. App.css, main-style.css)
- **Configuration files:** kebab-case or standard (e.g. vite.config.ts, tsconfig.json)
- **Tests:** camelCase with `.test` or `.spec` (e.g. useCourse.test.ts)
- **Folders:** PascalCase for feature modules (e.g. Administration, Projects), kebab-case for utility folders (e.g. hooks, services)

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

## 6. Interfaces (TypeScript)
- **Rule:** PascalCase, no prefix "I"
- **Example:** User, Project, AuthResponse

## 7. Types (TypeScript)
- **Rule:** PascalCase
- **Example:** UserRole, ProjectStatus

## 8. Enum-Names (TypeScript)
- **Rule:** PascalCase für Enum, UPPER_SNAKE_CASE for Values
- **Example:** UserRole.ADMIN, UserRole.STUDENT

## 9. Documentation files
- **Rule:** UPPER_SNAKE_CASE
- **Example:** README.md, NAMING_GUIDELINE.md

## 10. General Guidelines
- **Avoid Abbreviations or use a uniform system** (e.g. „config“ instead of „cfg“)
- **No special characters**
- **English vocabulary**
