# Tech Stack

## Core Framework
- **React 18.2** with TypeScript
- **Create React App** (CRA) with CRACO for custom configuration
- **React Router v6** for routing

## State Management
- **Redux Toolkit** (@reduxjs/toolkit) for global state
- **React Query v3** for server state and data fetching
- **RTK Query** (notificationsApi) for specific API endpoints

## UI & Styling
- **Tailwind CSS** for utility-first styling
- **Material-UI (MUI) v5** for component library
- **Styled Components** for CSS-in-JS
- **Emotion** for MUI styling engine
- Custom color palette defined in tailwind.config.js

## Forms & Validation
- **Formik** for form management
- **Yup** for schema validation

## Data Fetching
- **Axios** for HTTP requests
- **React Query** for caching and synchronization

## Rich Content
- **React Quill** for rich text editing
- **React Dropzone** for file uploads
- **ReactFlow** for flow diagrams
- **Recharts** for data visualization

## Utilities
- **i18next** and **react-i18next** for internationalization
- **js-cookie** for cookie management
- **dayjs** for date manipulation
- **localforage** for client-side storage
- **react-toastify** for notifications
- **simplebar-react** for custom scrollbars

## Development Tools
- **Prettier** for code formatting
- **TypeScript** for type safety
- Path aliases configured (`@/*` maps to `src/*`)

## Common Commands

```bash
# Development
npm start                 # Start dev server on localhost:3000

# Build
npm run build            # Production build to /build folder

# Testing
npm test                 # Run tests in watch mode

# Code Formatting
npm run format           # Format all files with Prettier
```

## Build Configuration
- CRACO extends CRA configuration
- Webpack alias: `@` → `src/`
- TypeScript baseUrl: `./src`
- Tailwind processes all files in `src/**/*.{js,jsx,ts,tsx}`
