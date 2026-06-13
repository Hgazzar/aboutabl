# Project Structure

## Root Configuration
- `craco.config.js` - CRACO configuration for webpack aliases
- `tailwind.config.js` - Tailwind CSS configuration with custom theme
- `tsconfig.json` - TypeScript configuration with path aliases
- `.prettierrc.json` - Code formatting rules

## Source Directory (`src/`)

### Entry Points
- `index.tsx` - Application entry point with providers (Redux, React Query, Router, Audio)
- `App.tsx` - Main app component with route definitions and permission-based routing

### Core Directories

**`/auth`** - Authentication guards and protected route logic

**`/config`** - Application configuration
- `BrowserRouter.tsx` - Router setup
- `i18next.tsx` - Internationalization configuration
- `queryClient.tsx` - React Query client setup
- `history.tsx` - Browser history management

**`/redux`** - State management
- `/reducers` - Redux slices for different domains (login, employee, student, school, subjects, etc.)
- `store.tsx` - Redux store configuration

**`/components`** - Reusable and feature-specific components
- `/shared` - Common UI components (Button, DataTable, Dropdown, Loading, etc.)
- `/modals` - Modal dialogs (AddClassModal, DeleteConfirmationModal, etc.)
- `/login` - Login-related components (Signin, ForgetPassword, ResetPassword)
- `/dashboard` - Dashboard-specific components
- `/addStudent`, `/editStudent`, `/studentDetails` - Student management
- `/addEmployee`, `/editEmployee`, `/employeesDetails` - Employee management
- `/addSubject`, `/subjectDetails` - Subject management
- `/QuizDetails` - Quiz creation and editing
- `/AddWorksheet` - Worksheet management
- `/addGame` - Game management
- `/addAssignment` - Assignment creation
- `/addContent` - Content management
- `/questionBank` - Question bank components (MCQ, Matching, TorF, ShortNotes)
- `/schools`, `/editSchool` - School management

**`/pages`** - Top-level page components organized by feature
- `/dashboard` - Dashboard page
- `/login` - Login and school selection pages
- `/user` - User management (Students, Employee, FileManagement)
- `/school` - School management (Schools, Grades, Classes, Roles)
- `/subjects` - Subject management (Subjects, QuestionBank)
- `/report` - Reporting pages
- `/ticketing` - Ticketing system
- `/NotFound` - 404 page

**`/layout`** - Layout components (DashboardLayout)

**`/hooks`** - Custom React hooks
- `useGetFetchApi.tsx` - GET request hook
- `usePostFetchApi.tsx` - POST request hook
- `usePopover.tsx` - Popover state management

**`/utils`** - Utility functions
- `fetchMethods.tsx` - API request helpers
- `functions.tsx` - Common utility functions
- `notify.tsx` - Toast notification helpers

**`/context`** - React context providers
- `AudioContext.tsx` - Audio playback state management

**`/constants`** - Application constants
- `constants.ts` - Shared constants and enums

**`/locales`** - Internationalization files
- `en.json` - English translations
- `ar.json` - Arabic translations

**`/styles`** - Global CSS files
- `index.css` - Global styles and Tailwind imports
- `login.css` - Login page styles
- `subjectDetails.css` - Subject details styles
- `detailedSideNav.css` - Navigation styles

**`/assets`** - Static assets (images, icons, fonts)

## Naming Conventions

- **Components**: PascalCase (e.g., `AddStudent.tsx`, `DataTable.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useGetFetchApi.tsx`)
- **Utils**: camelCase (e.g., `fetchMethods.tsx`)
- **Types**: PascalCase for interfaces/types
- **Redux slices**: camelCase with `Reducer` suffix (e.g., `loginReducer.tsx`)

## Import Patterns

- Use `@/` alias for imports from `src/` directory
- Lazy load page components for code splitting
- Group imports: React → third-party → local components → styles

## Component Organization

- Multi-step forms split into separate components (BasicInfo, SkillTags, StandardCode, etc.)
- Shared components in `/shared` for reusability
- Feature-specific components grouped by domain
- Modal components centralized in `/modals`

## Routing Structure

- Protected routes wrapped in `<AuthGuard />`
- Permission-based conditional rendering of routes
- Lazy-loaded route components with `<Suspense>` and loading fallback
- Nested routes under `<DashboardLayout>`
