# API Request Studio — Detailed Specification

## Project Overview
**Postman/Insomnia alternative** built with Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui.
Deployed on Vercel with PostgreSQL (Prisma) + NextAuth.js authentication.

---

## Core Features (MVP)

### 1. Request Builder
- **HTTP Methods**: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
- **URL Input**: With variable interpolation (`{{base_url}}/users/{{id}}`)
- **Headers**: Key-value editor, preset headers (Content-Type, Auth), auto-complete
- **Query Params**: Key-value editor with enable/disable toggles
- **Body**: 
  - JSON (with syntax highlighting, formatting, validation)
  - Form Data (key-value + file uploads)
  - URL Encoded
  - Raw (text, XML, HTML, custom)
  - Binary (file upload)
  - GraphQL (query + variables)
- **Auth Helpers**: Bearer Token, Basic Auth, API Key, OAuth 2.0, Digest Auth
- **Settings**: Timeout, follow redirects, SSL verification, proxy

### 2. Response Viewer
- **Status Badge**: Color-coded (2xx green, 3xx blue, 4xx orange, 5xx red)
- **Timing**: DNS, TCP, TLS, TTFB, download breakdown
- **Headers**: Searchable, filterable table
- **Body Views**:
  - **Pretty JSON**: Syntax highlighted, collapsible tree, copy path
  - **Raw**: Monospace, searchable
  - **Preview**: Auto-render HTML, images, XML
  - **Table**: Auto-detect arrays of objects → sortable table
- **Save Response**: Add to history, export

### 3. Collections (Sidebar)
- **Hierarchy**: Collection → Folder → Request (nested folders supported)
- **Drag & Drop**: Reorder requests/folders
- **Context Menu**: Duplicate, delete, rename, move, export
- **Collection Variables**: Scoped variables with environments

### 4. Environments
- **Variable Scopes**: Global → Environment → Collection → Request
- **Variable Types**: Default, Secret (masked), Current Value (ephemeral)
- **Quick Switch**: Dropdown in header, keyboard shortcut
- **Import/Export**: JSON, Postman format

### 5. History
- **Auto-save**: Every executed request (configurable retention)
- **Group by**: Date, Collection, Domain
- **Search**: Full-text across URL, headers, body
- **Re-run**: One-click re-execute from history

### 6. Team Workspaces (Real-time)
- **WebSocket Sync**: Live presence, cursor positions, edits
- **Invite Members**: Email invite, role-based access (Admin, Editor, Viewer)
- **Conflict Resolution**: Last-write-wins with toast notification
- **Offline Support**: Local-first, sync on reconnect

### 7. Code Generation
- **Targets**: cURL, Fetch (JS), Axios, Node.js, Python (requests), Go, Java (OkHttp), C#, Rust (reqwest), Swift, PowerShell
- **Options**: Include headers, timeout, follow redirects, auth

### 8. Import/Export
- **Import**: Postman Collection v2.1, OpenAPI 3.0/3.1, Swagger 2.0, HAR, cURL, Insomnia
- **Export**: Postman Collection, OpenAPI 3.1, HAR

---

## Technical Architecture

### Database Schema (Prisma)

```prisma
// Users & Auth
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  avatarUrl     String?
  passwordHash  String?
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  accounts      Account[]
  sessions      Session[]
  workspaces    WorkspaceMember[]
  ownedWorkspaces Workspace[] @relation("WorkspaceOwner")
  requests      RequestHistory[]
  collections   Collection[] @relation("CollectionOwner")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}

// Workspaces
model Workspace {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?
  ownerId     String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  owner       User     @relation("WorkspaceOwner", fields: [ownerId], references: [id])
  members     WorkspaceMember[]
  collections Collection[]
  environments Environment[]
  invitations Invitation[]
}

model WorkspaceMember {
  id          String       @id @default(cuid())
  userId      String
  workspaceId String
  role        MemberRole   @default(EDITOR)
  joinedAt    DateTime     @default(now())
  
  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  workspace   Workspace    @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  @@unique([userId, workspaceId])
}

enum MemberRole {
  ADMIN
  EDITOR
  VIEWER
}

model Invitation {
  id          String   @id @default(cuid())
  email       String
  workspaceId String
  role        MemberRole @default(EDITOR)
  token       String   @unique
  expiresAt   DateTime
  createdAt   DateTime @default(now())
  
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
}

// Collections & Requests
model Collection {
  id          String   @id @default(cuid())
  name        String
  description String?  @db.Text
  workspaceId String
  ownerId     String
  parentId    String?
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  workspace   Workspace     @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  owner       User          @relation("CollectionOwner", fields: [ownerId], references: [id])
  parent      Collection?   @relation("CollectionHierarchy", fields: [parentId], references: [id], onDelete: SetNull)
  children    Collection[]  @relation("CollectionHierarchy")
  requests    Request[]
  variables   CollectionVariable[]
}

model Request {
  id            String       @id @default(cuid())
  name          String
  description   String?      @db.Text
  method        HttpMethod
  url           String
  headers       Json         @default("[]")
  queryParams   Json         @default("[]")
  body          Json?
  bodyType      BodyType     @default(NONE)
  auth          Json?
  settings      Json         @default("{}")
  collectionId  String
  order         Int          @default(0)
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  
  collection    Collection   @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  history       RequestHistory[]
}

enum HttpMethod {
  GET
  POST
  PUT
  PATCH
  DELETE
  HEAD
  OPTIONS
}

enum BodyType {
  NONE
  JSON
  FORM_DATA
  URLENCODED
  RAW
  BINARY
  GRAPHQL
}

// Environments & Variables
model Environment {
  id          String   @id @default(cuid())
  name        String
  workspaceId String
  isActive    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  workspace   Workspace        @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  variables   EnvironmentVariable[]
}

model EnvironmentVariable {
  id            String   @id @default(cuid())
  key           String
  value         String
  type          VariableType @default(DEFAULT)
  description   String?
  environmentId String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  environment   Environment @relation(fields: [environmentId], references: [id], onDelete: Cascade)
  @@unique([environmentId, key])
}

enum VariableType {
  DEFAULT
  SECRET
}

model CollectionVariable {
  id            String   @id @default(cuid())
  key           String
  value         String
  type          VariableType @default(DEFAULT)
  description   String?
  collectionId  String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  collection    Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  @@unique([collectionId, key])
}

// History
model RequestHistory {
  id           String   @id @default(cuid())
  userId       String
  requestId    String?
  workspaceId  String
  method       HttpMethod
  url          String
  headers      Json
  queryParams  Json
  body         Json?
  bodyType     BodyType
  auth         Json?
  
  // Response
  statusCode   Int?
  statusText   String?
  responseHeaders Json?
  responseBody Json?      @db.Text
  responseTime Int?       // ms
  timing       Json?      // DNS, TCP, TLS, TTFB, download
  error        String?
  
  createdAt    DateTime   @default(now())
  
  user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  request      Request?   @relation(fields: [requestId], references: [id], onDelete: SetNull)
  workspace    Workspace  @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  
  @@index([userId, createdAt])
  @@index([workspaceId, createdAt])
  @@index([requestId])
}
```

---

## Route Map (Next.js App Router)

```
/                                    → Landing page (marketing)
/auth/signin                         → Sign in page
/auth/signup                         → Sign up page
/auth/callback                       → OAuth callback
/auth/error                          → Auth error
/settings                            → User settings (profile, appearance, billing)

/w/[workspaceSlug]                   → Workspace dashboard (collections list)
/w/[workspaceSlug]/collection/[id]   → Collection view (request tabs)
/w/[workspaceSlug]/request/[id]      → Request builder (full screen)
/w/[workspaceSlug]/history           → Request history
/w/[workspaceSlug]/environments      → Environment management
/w/[workspaceSlug]/settings          → Workspace settings (members, invitations, billing)
/w/[workspaceSlug]/import            → Import data
/w/[workspaceSlug]/export            → Export data

/api/auth/[...nextauth]              → NextAuth.js
/api/trpc/*                          → tRPC routes (if using tRPC)
/api/collections                     → Collection CRUD
/api/requests                        → Request CRUD + execute
/api/history                         → History CRUD
/api/environments                    → Environment CRUD
/api/workspaces                      → Workspace CRUD + invites
/api/codegen                         → Code generation
/api/import                          → Import handlers
/api/export                          → Export handlers
/api/websocket                       → WebSocket upgrade (Socket.io)
```

---

## Component Hierarchy

```
App Layout (providers: Theme, Auth, Query, Socket)
├── Landing Page
├── Auth Pages
├── Dashboard Layout (Sidebar + Header + Main)
│   ├── Sidebar
│   │   ├── Workspace Switcher
│   │   ├── Collection Tree (recursive)
│   │   │   ├── Collection Node (folder)
│   │   │   └── Request Node (draggable)
│   │   ├── History Panel (collapsible)
│   │   └── Environment Selector
│   ├── Header
│   │   ├── Workspace Menu
│   │   ├── Search (Cmd+K)
│   │   ├── Notifications
│   │   └── User Menu
│   └── Main Content (varies by route)
│       ├── Collection View (tabbed requests)
│       ├── Request Builder
│       │   ├── Request Bar (method, URL, send button)
│       │   ├── Tab Navigation (Params, Auth, Headers, Body, Settings)
│       │   ├── Header Editor
│       │   ├── Query Param Editor
│       │   ├── Auth Editor
│       │   ├── Body Editor (JSON/Form/Raw/GraphQL/Binary)
│       │   ├── Settings Panel
│       │   └── Response Panel (tabs: Pretty/Raw/Preview/Table)
│       ├── History View
│       ├── Environment Manager
│       ├── Workspace Settings
│       └── Import/Export Wizard
└── Modals/Dialogs
    ├── Create Collection/Request/Folder
    ├── Variable Editor
    ├── Code Generation Modal
    ├── Import Dialog
    ├── Invite Member Dialog
    └── Confirm Delete Dialog
```

---

## Key Libraries & Versions

| Category | Package | Version |
|----------|---------|---------|
| Framework | next | 15.x (App Router) |
| React | react, react-dom | 19.x |
| Language | typescript | 5.x |
| Styling | tailwindcss | 4.x |
| UI Components | @radix-ui/* + class-variance-authority | latest |
| Components | shadcn/ui (custom registry) | latest |
| Database | @prisma/client, prisma | 6.x |
| Auth | next-auth | 5.x (beta) |
| Validation | zod | 3.x |
| State | @tanstack/react-query | 5.x |
| Forms | react-hook-form + @hookform/resolvers/zod | latest |
| Editor | @monaco-editor/react | latest |
| WebSocket | socket.io, socket.io-client | 4.x |
| Code Gen | openapi-typescript-codegen (custom) | - |
| Import/Export | yaml, js-yaml, har-format | - |
| Icons | lucide-react | latest |
| Date | date-fns | latest |
| Notifications | sonner | latest |
| Dark Mode | next-themes | latest |
| Testing | vitest, @playwright/test, @testing-library/react | latest |

---

## Implementation Milestones

### Milestone 1: Foundation (Week 1)
- [ ] Next.js 15 + TypeScript + Tailwind 4 + shadcn/ui init
- [ ] Prisma schema + PostgreSQL (Neon) + migrations
- [ ] NextAuth.js v5 (GitHub, Email providers)
- [ ] ESLint, Prettier, Husky, lint-staged
- [ ] Deploy to Vercel (preview works)

### Milestone 2: Auth & Workspace (Week 2)
- [ ] Sign in/up pages + protected routes
- [ ] Workspace CRUD + slug routing
- [ ] Member invitations + roles
- [ ] Dashboard layout (sidebar, header)
- [ ] Theme provider (dark/light/system)

### Milestone 3: Collections & Requests (Week 3-4)
- [ ] Collection tree (recursive, drag-drop @dnd-kit)
- [ ] Request CRUD + persistence
- [ ] Request builder UI (all tabs)
- [ ] Variable interpolation engine
- [ ] Environment selector + variable resolution

### Milestone 4: Request Execution (Week 5)
- [ ] API route: POST /api/requests/execute
- [ ] Proxy fetch with timeout, redirect, SSL options
- [ ] Response parsing (JSON, text, blob, stream)
- [ ] Timing breakdown (PerformanceObserver)
- [ ] Auto-save to history

### Milestone 5: Response Viewer (Week 6)
- [ ] JSON tree (collapsible, copy path, search)
- [ ] Raw view (monospace, search)
- [ ] Preview (iframe sandbox for HTML, img, XML)
- [ ] Table view (auto-detect array of objects)
- [ ] Response headers + timing display

### Milestone 6: History & Search (Week 7)
- [ ] History list (virtualized, infinite scroll)
- [ ] Full-text search (URL, headers, body)
- [ ] Filter by date, collection, status, method
- [ ] Re-run from history

### Milestone 7: Real-time Collaboration (Week 8)
- [ ] Socket.io server (custom Node or Vercel + Pusher)
- [ ] Presence indicators (avatars in sidebar)
- [ ] Live cursor positions in request builder
- [ ] Optimistic updates + conflict resolution
- [ ] Offline queue + sync

### Milestone 8: Code Gen & Import/Export (Week 9)
- [ ] Code generation (10+ targets)
- [ ] Import: Postman, OpenAPI, HAR, cURL, Insomnia
- [ ] Export: Postman, OpenAPI, HAR
- [ ] Import/Export wizards with preview

### Milestone 9: Polish (Week 10-11)
- [ ] Command palette (Cmd+K) for navigation
- [ ] Keyboard shortcuts (send, new tab, switch tabs)
- [ ] Empty states, loading skeletons, error boundaries
- [ ] Accessibility audit (axe, keyboard nav)
- [ ] Performance (bundle analysis, RSC caching)

### Milestone 10: Launch Prep (Week 12)
- [ ] Production DB + env vars
- [ ] Sentry + Vercel Analytics
- [ ] Custom domain + security headers
- [ ] README, architecture diagram, demo GIFs
- [ ] Launch blog post

---

## Acceptance Criteria (Definition of Done)

- [ ] **Live on Vercel** at `api-studio.vercel.app` (or custom domain)
- [ ] **GitHub repo** with conventional commits, CI/CD (GitHub Actions)
- [ ] **TypeScript strict** — zero `any` in production code
- [ ] **Test coverage** > 70% (unit + integration + e2e)
- [ ] **Lighthouse** > 90 all categories
- [ ] **Zero console errors** in production
- [ ] **Responsive** — works 375px → 1920px
- [ ] **Dark mode** — full support, persists preference
- [ ] **Keyboard accessible** — all features usable without mouse
- [ ] **Sentry** — source maps uploaded, errors tracked

---

## Stretch Goals (Post-MVP)

- [ ] GraphQL schema introspection + autocomplete
- [ ] Request chaining (pre-request scripts, test scripts)
- [ ] Mock server (generate mock responses from OpenAPI)
- [ ] API documentation generator (from collections)
- [ ] VS Code extension (sync local files)
- [ ] CLI companion (`api-studio` command)
- [ ] Plugin system (custom response handlers)
- [ ] Team activity feed / audit log
- [ ] SSO (SAML, OIDC) for enterprise