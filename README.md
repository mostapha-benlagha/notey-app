## Notey Monorepo

Notey is a **chat‑first note and task workspace** for founders, operators, and researchers. You capture ideas like messages, expand them into rich documents, and organize the resulting notes, tasks, and projects in a focused workspace that is ready for AI assistants to plug into.

- **Frontend**: React + TypeScript, Vite, React Router, Zustand state, Zod validation, Jest/Testing Library, Tailwind CSS with a custom design system, Radix UI primitives, Lucide icons, and TipTap for rich‑text editing.
- **Backend**: Node.js + Express 5, TypeScript, MongoDB via Mongoose, JWT auth, bcrypt for passwords, Zod for validation, Pino for structured logging, CORS/Helmet for security, and Docker Compose for local infra.

---

## Repository Structure

At the top level this monorepo contains:

- `backend/` – Express + TypeScript API and MongoDB data layer.
- `frontend/` – React + TypeScript single‑page app and UI.
- `desktop/` – Electron wrapper for the existing frontend, used for native desktop behaviors.

Each application has its own `package.json`, scripts, and dependencies, but they are versioned together in this monorepo so tooling and AI agents can understand the full stack in one place.

### Backend (`backend/`)

- **Tech stack**
  - Node.js, Express 5, TypeScript.
  - MongoDB via Mongoose.
  - Validation with Zod.
  - Security and DX:
    - `helmet` for secure HTTP headers.
    - `cors` configured with `env.CLIENT_URL` and credentials for browser clients.
    - `pino` + `pino-http` for structured JSON logging.
    - `dotenv` for environment configuration.
  - Auth and identity:
    - `jsonwebtoken` for JWT‑based authentication.
    - `bcryptjs` for password hashing.
- **Server behavior**
  - `createApp` wires middleware, JSON parsing, logging and routing.
  - Root route `/` returns a JSON health payload (`"Welcome to the Notey backend"`).
  - All API endpoints are namespaced under `/api` via `apiRouter`.
  - Global `notFoundHandler` and `errorHandler` provide consistent error responses.
- **Scripts**
  - `dev`: run the API in watch mode with `tsx` (TypeScript‑first DX).
  - `build`: compile TypeScript to `dist/`.
  - `start`: run the compiled server.
  - `typecheck`: TypeScript type‑only checking.
  - `docker:up` / `docker:down`: bring up/down the API + Mongo stack via Docker Compose.
- **Environment & deployment**
  - `.env.example` documents required env vars, including `CLIENT_URL` and Mongo connection.
  - Docker Compose starts an `api` service and a `mongo` service; inside Docker the API talks to `mongodb://mongo:27017/notey`.

### Frontend (`frontend/`)

- **Tech stack**
  - React 19 with TypeScript, built by Vite.
  - Routing with `react-router-dom` (nested layouts, protected/public routes).
  - State management with lightweight `zustand` stores (`useAuthStore`, `useNotesStore`, `useTasksStore`, `useProjectsStore`, `useSettingsStore`, etc.).
  - Form and schema validation with `zod` and `@hookform/resolvers`.
  - HTTP client abstraction with `axios` in `services/api.ts` plus `mockData` for local UX before the API is wired.
  - Testing with Jest, `@testing-library/react`, `@testing-library/user-event`, and `jest-environment-jsdom`.

- **UI library & components**
  - Base components (`Button`, `Card`, `Input`, etc.) follow a **modern, rounded‑card design system** inspired by shadcn + Radix patterns:
    - Variants built with `class-variance-authority` (`cva`) and `tailwind-merge`.
    - Layout primitives (cards, sidebar, layouts) are responsive and keyboard‑accessible.
  - Radix UI primitives:
    - Dialogs, alert dialogs, switches and slots (`@radix-ui/react-dialog`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-switch`, `@radix-ui/react-slot`).
  - Icons:
    - `lucide-react` for all iconography (Sparkles, tasks, folders, search, trash, etc.).
  - Rich text editor:
    - TipTap (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-highlight`, `@tiptap/extension-placeholder`, `@tiptap/extension-underline`, `@tiptap/pm`) for full‑screen note editing.

- **UI style & visual language**
  - **Color system** (from `tailwind.config.ts`):
    - Light, warm background: `background` is a soft neutral (`hsl(45 40% 98%)`).
    - Foreground text: `foreground` is a deep slate (`hsl(215 28% 17%)`).
    - **Primary** accent: saturated blue (`hsl(213 78% 43%)`) with light foreground.
    - **Secondary** surfaces: very light cool neutrals (`hsl(200 20% 95%)`).
    - **Muted** surfaces: pale yellow‑tinted neutrals for subtle sections.
    - **Accent**: soft orange for highlights and attention‑grabbing details.
    - **Card**: pure white cards on top of the warm background.
  - **Typography & spacing**
    - `Manrope` as the primary sans‑serif font for a clean, contemporary feel.
    - Emphasis on bold headings (`font-extrabold`, large display sizes) and generous line height for reading comfort.
  - **Surfaces & depth**
    - Custom `soft` box shadow (`0 24px 60px rgba(15, 23, 42, 0.08)`) for elevated cards.
    - Optional `grid` background image for subtle depth and structure behind primary surfaces.
  - **Shapes & layout**
    - Large radii (`rounded-[32px]`, `rounded-[36px]`, `rounded-2xl`) on cards, headers, and call‑to‑action areas.
    - **Main workspace**:
      - `MainLayout` uses a two‑column grid: fixed‑width sidebar (~340px) + flexible workspace, with max width control and a `fullWidthWorkspaceEnabled` toggle in settings.
      - Padding and max‑width constraints (`max-w-[1440px]`, `max-w-[1600px]`) keep content centered and breathable on large screens.

- **Key screens and flows**
  - **Landing page**
    - Hero section marketing Notey as an “AI note assistant” for founders/operators/researchers.
    - Clear actions: “Start free” and “See the app”.
    - Feature cards that highlight:
      - Project‑aware notes.
      - Rich editor for deep work.
      - AI‑ready tagging and task extraction.
    - A secondary panel explaining that the frontend can ship first while the backend is wired later (built around mocked data).
  - **Auth flow**
    - Routes:
      - `/login`, `/signup` under an `AuthLayout`.
      - `PublicOnlyRoute` gates auth pages for unauthenticated users only.
      - `ProtectedRoute` ensures the app workspace is visible only to authenticated users.
  - **Main app workspace (`/app`)**
    - **Chat page (`/app`)**
      - Chat‑style interface for **message‑like note capture** (`ChatContainer`, `MessageInput`).
      - Search bar filtering notes by content while still in the chat view.
      - Selecting a note opens the full editor (`/app/notes/:id`) while retaining context (`returnTo` state).
    - **Note editor (`/app/notes/new`, `/app/notes/:id`)**
      - Full‑screen TipTap editor for deep editing and formatting.
      - Designed to grow a chat‑captured idea into a structured document.
    - **Tasks (`/app/tasks`)**
      - Kanban‑style board (`TaskKanbanBoard`) for **AI‑extracted tasks** linked back to notes and projects.
      - Column statuses are editable; users can create and reorder pipelines.
      - Search input filters by task title, note content, or status label.
      - Trash link and badge show count and route to `/app/tasks/trash` for soft‑deleted work.
    - **Task trash (`/app/tasks/trash`)**
      - Dedicated view of trashed tasks with the ability to inspect and potentially restore/clean up.
    - **Projects (`/app/projects/:id`)**
      - Project‑centric view that groups notes and tasks by selected project.
      - Backed by `useProjectsStore` and project‑aware selection in other views.
    - **Settings (`/app/settings`)**
      - Workspace settings, including toggles such as `fullWidthWorkspaceEnabled` to switch between centered and full‑width layouts.
    - **Account (`/app/account`)**
      - Personal account details and user‑level settings.

- **Routing structure**
  - `AppRouter` defines:
    - `/` → `LandingPage`.
    - `/login`, `/signup` under `AuthLayout` (public‑only).
    - `/app` and nested routes under `MainLayout` (protected):
      - `/app` → `ChatPage`.
      - `/app/notes/new` and `/app/notes/:id` → `NoteEditorPage` (lazy‑loaded).
      - `/app/tasks`, `/app/tasks/trash` → task board and trash views.
      - `/app/projects/:id` → `ProjectPage`.
      - `/app/settings` → `SettingsPage`.
      - `/app/account` → `AccountPage`.
    - Fallback: `*` routes redirect back to `/`.

---

## How to run locally

> Note: The user prefers `pnpm` for installs and scripts; adapt the commands below (`npm` → `pnpm`) in your environment.

From the monorepo root:

- **Backend**
  - Install: `cd backend && pnpm install`
  - Dev server: `pnpm dev` (watches `src/server.ts` via `tsx`).
  - Typecheck: `pnpm typecheck`
  - Docker: `pnpm docker:up` to start API + Mongo, `pnpm docker:down` to stop.

- **Frontend**
  - Install: `cd frontend && pnpm install`
  - Dev server: `pnpm dev` (Vite on port 3000).
  - Build: `pnpm build`
  - Tests: `pnpm test` or `pnpm test:watch`

- **Desktop**
  - Install: `cd desktop && pnpm install`
  - Dev shell: `pnpm dev`
  - Run against an already-running frontend dev server: `pnpm start`
  - Package Windows app: `pnpm dist`

The desktop package wraps the existing `frontend/` app instead of duplicating it. In development it opens the Vite app at `http://127.0.0.1:3000/app`; in packaged builds it loads `frontend/dist`. The first native desktop behavior implemented is minimize-to-tray on close, with tray actions to reopen or quit Notey.

Make sure the backend `CLIENT_URL` matches the frontend origin (e.g. `http://127.0.0.1:3000`) so CORS and cookies work correctly in development.

---

## How agents should use this README

This README is intended as a **single source of truth for AI agents** working on Notey:

- Understand the **frontend stack**, routing, state, and design language from the `frontend/` section.
- Understand the **backend stack**, API conventions, logging, and deployment model from the `backend/` section.
- Respect the **UI style**:
  - Use Tailwind utility classes consistent with the existing color tokens and typography.
  - Prefer the existing design primitives (`Button`, `Card`, layouts, etc.) before introducing new ones.
- When adding features:
  - Thread new flows into the router in a way that matches existing patterns.
  - Use `zustand` stores and Zod schemas instead of ad‑hoc state and validation.
  - Integrate with the Express API under `/api` and keep auth, logging, and error handling consistent with the rest of the backend.

Keeping this file up to date will make it easier for agents to reason about the whole system and propose changes that feel native to Notey.

