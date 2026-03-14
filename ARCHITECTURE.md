# Architecture

Deep technical reference for the GitHub Kanban Board codebase.

## Table of Contents

- [System Design](#system-design)
- [Component Reference](#component-reference)
- [State Management](#state-management)
- [Service Layer](#service-layer)
- [Filter Engine](#filter-engine)
- [Theme System](#theme-system)
- [Storage Layer](#storage-layer)
- [Type System](#type-system)
- [CSS Architecture](#css-architecture)

---

## System Design

### Principles

1. **No backend**: The app runs entirely in the browser. The only external communication is with the GitHub REST API.
2. **Read-only**: The app only reads GitHub data — it never creates, updates, or deletes issues/PRs.
3. **Local state**: All configuration (boards, columns, filters, settings) lives in `localStorage`. There is no database.
4. **Polling model**: Since there's no server to receive webhooks, data freshness is maintained through polling (manual, auto-timer, and focus-based refresh).

### Request Flow

```
User Browser
    │
    ├── localStorage (read/write state)
    │
    └── HTTPS → api.github.com
              ├── GET /user (validate token)
              ├── GET /repos/:owner/:repo/issues?per_page=100 (paginated)
              ├── GET /repos/:owner/:repo/pulls?per_page=100 (paginated)
              └── GET /search/repositories?q=... (repo search)
```

### Module Dependency Graph

```
main.tsx
  └── App.tsx
        ├── contexts/AppContext.tsx
        │     └── utils/storage.ts
        ├── contexts/DataContext.tsx
        │     ├── services/github.ts (Octokit)
        │     └── contexts/AppContext.tsx
        ├── hooks/useTheme.ts
        │     └── contexts/AppContext.tsx
        ├── components/Auth/TokenSetup.tsx
        │     ├── services/github.ts
        │     └── contexts/AppContext.tsx
        ├── components/Layout/Header.tsx
        │     ├── contexts/AppContext.tsx
        │     ├── contexts/DataContext.tsx
        │     └── components/Settings/Settings.tsx
        ├── components/Board/BoardView.tsx
        │     ├── contexts/AppContext.tsx
        │     ├── contexts/DataContext.tsx
        │     ├── components/Column/KanbanColumn.tsx
        │     ├── components/Board/BoardSetup.tsx
        │     └── @dnd-kit/*
        ├── components/Column/KanbanColumn.tsx
        │     ├── contexts/AppContext.tsx
        │     ├── contexts/DataContext.tsx
        │     ├── services/filters.ts
        │     ├── components/Card/EntityCard.tsx
        │     ├── components/Column/FilterEditor.tsx
        │     └── @dnd-kit/sortable
        ├── components/Card/EntityCard.tsx
        │     ├── types/index.ts
        │     └── contexts/AppContext.tsx
        └── components/Settings/Settings.tsx
              └── contexts/AppContext.tsx
```

---

## Component Reference

### App.tsx

The root component. Renders `AppProvider` around `AppContent`.

**`AppContent`** handles the auth gate:
1. On mount, checks for a stored token in `localStorage`
2. If token exists, validates it with `validateToken()` and initializes Octokit
3. If validation fails, clears the token
4. Routes to `TokenSetup` (no token) or `DataProvider` + `Header` + `BoardView` (authenticated)

### TokenSetup (`components/Auth/TokenSetup.tsx`)

Full-page form for entering a GitHub PAT. Includes step-by-step instructions for token creation. On submit, validates the token and stores it.

**Uses**: `useApp()` for `setToken` and `setUser`; `validateToken()` and `initOctokit()` from `services/github.ts`.

### Header (`components/Layout/Header.tsx`)

Fixed 48px top bar.

**Sections**:
- Left: GitHub logo + "Kanban" text, board tab switcher
- Right: "Updated Xs ago" label, refresh button (with spinning animation while loading), settings gear button, user avatar dropdown

**Uses**: `useApp()` for board tabs and logout; `useData()` for refresh and loading state.

### BoardView (`components/Board/BoardView.tsx`)

Main content area below the header.

**States**:
- No boards exist → shows `BoardSetup`
- Board selected → shows toolbar + DnD column layout
- No columns → shows empty state with "Add Your First Column" button

**Drag and drop**: Uses `@dnd-kit/core` `DndContext` with `closestCenter` collision detection and `@dnd-kit/sortable` `SortableContext` with `horizontalListSortingStrategy`. On drag end, reorders columns via `arrayMove`.

**Toolbar**: Shows board name, repo count, "Add Column" and "New Board" buttons.

### BoardSetup (`components/Board/BoardSetup.tsx`)

Form for creating or editing a board.

**Props**: `onSave(board)`, optional `onCancel`, optional `initialBoard` for editing.

**Repository search**: Types in the input → debounced `searchRepos()` call → dropdown results. Manual entry supported by typing `owner/repo` and pressing Enter.

**Presets**: Three preset configurations defined in `PRESET_COLUMNS` constant. Note: preset filters use the literal string `"{{user}}"` as the value — this is not dynamically substituted.

### KanbanColumn (`components/Column/KanbanColumn.tsx`)

A single Kanban column rendered as a sortable DnD item.

**Props**: `column: ColumnConfig`, `boardId: string`.

**Features**:
- Drag handle on the header (whole header area)
- Double-click title to edit inline
- Entity count badge
- Filter toggle button (hover-visible)
- Delete button (hover-visible)
- Collapse/expand chevron
- Filter panel (toggled, renders `FilterEditor`)
- Card list (renders `EntityCard` for each filtered entity)

**Filtering**: Uses `useMemo` to call `getColumnEntities(entities, column)` which applies the column's filter rules to all entities from `DataContext`.

### FilterEditor (`components/Column/FilterEditor.tsx`)

Inline filter rule editor rendered inside a column.

**Props**: `filters`, `combination`, `onFiltersChange`, `onCombinationChange`, `currentUser?`.

**UI structure per rule**: `[Field dropdown] [Operator dropdown] [Value input] [Remove button]`

**Value input logic** (`FilterValueInput` sub-component):
- If the field has ≤5 known suggestions → renders a `<select>` dropdown
- Otherwise → renders a text `<input>` with an autocomplete suggestion dropdown on focus

**Filter combination toggle**: Shows "Match [All] [Any] filters" when there are 2+ rules.

### EntityCard (`components/Card/EntityCard.tsx`)

A card representing a GitHub issue or pull request.

**Props**: `entity: GitHubEntity`.

**Sub-component**: `StateIcon` renders the appropriate SVG icon:
- Issue open: green circle with dot
- Issue closed: purple circle with checkmark
- PR open: green git-branch icon
- PR closed: red git-branch-x icon
- PR merged: purple merge icon
- PR draft: gray draft icon

**Display (full mode)**:
- State icon + title (2-line clamp)
- Repo name, `#number`, draft badge, time ago
- Labels (colored pills with background derived from label hex color)
- Assignee avatars (max 3, overflow count), comment count, pending reviewer count

**Display (compact mode)**: State icon + title (1-line clamp) + meta row only.

The entire card is an `<a>` tag linking to the entity's GitHub URL.

### Settings (`components/Settings/Settings.tsx`)

Modal dialog with three tabs.

**General tab**:
- Theme: dropdown (System, Light, Dark)
- Auto-refresh: toggle + interval input (1-60 minutes)
- Refresh on focus: toggle
- Compact cards: toggle

**Boards tab**:
- Lists all boards with rename (inline edit) and delete (with `confirm()` prompt) actions

**Import/Export tab**:
- Export: generates JSON blob, triggers download via temporary `<a>` element
- Import: file input accepting `.json`, parses `ExportData`, merges boards by updating each one

---

## State Management

### AppContext Reducer

The app uses `useReducer` with the following action types:

| Action | Payload | Effect |
|--------|---------|--------|
| `SET_TOKEN` | `token: string \| null` | Updates `state.token` |
| `SET_USER` | `user: GitHubUser \| null` | Updates `state.currentUser` |
| `SET_BOARDS` | `boards: BoardConfig[]` | Replaces all boards |
| `ADD_BOARD` | `board: BoardConfig` | Appends a board |
| `UPDATE_BOARD` | `board: BoardConfig` | Replaces board matching by `id` |
| `DELETE_BOARD` | `boardId: string` | Removes board, resets `activeBoardId` if it was deleted |
| `SET_ACTIVE_BOARD` | `boardId: string \| null` | Sets active board |
| `SET_SETTINGS` | `settings: AppSettings` | Replaces settings |
| `SET_THEME` | `theme: ThemeMode` | Updates only `settings.theme` |
| `LOAD_STATE` | `state: AppState` | Replaces entire state |
| `LOGOUT` | none | Clears `token` and `currentUser` |

### Persistence

An `useEffect` in `AppProvider` calls `saveState(state)` on every state change. The `saveState` function:
1. Serializes everything except `token` to the `github-kanban` localStorage key
2. Stores/removes the token separately in the `github-kanban-token` key

### DataContext Refresh Logic

```
┌─────────────────────────────────────────────────────┐
│                  DataContext                        │
│                                                     │
│  Triggers:                                          │
│    1. Initial mount (if token + repos exist)         │
│    2. repos change (board switch or board edit)      │
│    3. Manual refresh() call (refresh button)         │
│    4. Auto-refresh timer (setInterval)               │
│    5. Window focus (visibilitychange event)           │
│                                                     │
│  Guards:                                            │
│    - isRefreshingRef prevents concurrent fetches     │
│    - Auto-refresh skips if document.hidden           │
│    - Focus refresh debounces 30s since last refresh  │
│    - Timer clears/resets when settings change        │
│                                                     │
│  Output:                                            │
│    entities: GitHubEntity[] (sorted by updated_at)   │
│    isLoading, lastRefresh, error, refresh()          │
└─────────────────────────────────────────────────────┘
```

---

## Service Layer

### github.ts — Octokit Wrapper

**Singleton pattern**: `initOctokit(token)` creates the instance, `getOctokit()` retrieves it, `clearOctokit()` resets it. Multiple calls to `initOctokit` replace the previous instance.

**`fetchRepoIssues(owner, repo, state)`**:
- Paginates through `rest.issues.listForRepo` (100 per page)
- Transforms Octokit response types to `GitHubIssue`
- Stops at 500 items
- Returns issues including those that are actually PRs (filtered later by `fetchAllRepoData`)

**`fetchRepoPullRequests(owner, repo, state)`**:
- Paginates through `rest.pulls.list` (100 per page)
- Transforms to `GitHubPullRequest`
- Sets `state: 'merged'` if `merged_at` is truthy
- Stops at 500 items

**`fetchAllRepoData(repos)`**:
- Fetches issues + PRs for all repos in parallel (`Promise.all`)
- Filters out pseudo-PR issues (those with `pull_request` field) from the issues list
- Returns `Map<string, { issues, pullRequests }>`

**`searchRepos(query)`**: Calls `rest.search.repos`, returns top 10 `full_name` strings.

**`getUserRepos()`**: Paginates `rest.repos.listForAuthenticatedUser`, returns up to 200 `full_name` strings. Currently unused in the UI.

### filters.ts — Filter Matching Engine

**`getColumnEntities(allEntities, column)`**: Convenience wrapper — calls `filterEntities` with the column's filters and combination.

**`filterEntities(entities, filters, combination)`**: If `combination === 'and'`, every filter must match. If `'or'`, any filter must match. If no filters, returns all entities.

**`matchesRule(entity, rule)`**: Core matching function. Extracts the relevant field value from the entity, then compares using the operator.

Field extraction details:

| Field | Extraction |
|-------|-----------|
| `type` | `isPullRequest(entity) ? 'pull_request' : 'issue'` |
| `state` | `isPullRequest(entity) && entity.merged_at ? 'merged' : entity.state` |
| `assignee` | `entity.assignees.map(a => a.login.toLowerCase())` — array |
| `author` | `entity.user.login.toLowerCase()` — string |
| `label` | `entity.labels.map(l => l.name.toLowerCase())` — array |
| `milestone` | `entity.milestone?.title.toLowerCase() ?? ''` — string |
| `repo` | Extracted from `repository_url`: `owner/repo` — string |
| `draft` | PR: `entity.draft ? 'true' : 'false'`; Issue: `'false'` |
| `review_status` | PR with reviewers: `'pending'`; else: `'none'` |
| `title` | `entity.title.toLowerCase()` — string |
| `has_pull_request` | Issue: `entity.pull_request ? 'true' : 'false'`; PR: `'false'` |

Operator logic for **array** fields (`assignee`, `label`):
- `is` / `contains`: `someValue === target || someValue.includes(target)`
- `is_not` / `not_contains`: negated version

Operator logic for **string** fields:
- `is`: `value === target`
- `is_not`: `value !== target`
- `contains`: `value.includes(target)`
- `not_contains`: `!value.includes(target)`

---

## Theme System

### How It Works

1. `useTheme()` hook reads `state.settings.theme` from AppContext
2. Sets `data-theme` attribute on `document.documentElement`:
   - `'light'` → `data-theme="light"`
   - `'dark'` → `data-theme="dark"`
   - `'system'` → checks `window.matchMedia('(prefers-color-scheme: dark)')`, listens for changes
3. `src/styles/variables.css` defines all CSS custom properties for both themes
4. Components reference these properties (e.g., `color: var(--text-primary)`)

### Token Categories

| Prefix | Purpose | Examples |
|--------|---------|---------|
| `--bg-*` | Background colors | `--bg-primary`, `--bg-secondary`, `--bg-canvas`, `--bg-overlay` |
| `--text-*` | Text colors | `--text-primary`, `--text-secondary`, `--text-link` |
| `--border-*` | Border colors | `--border-default`, `--border-muted`, `--border-subtle` |
| `--accent-*` | Semantic colors | `--accent-primary`, `--accent-success`, `--accent-danger`, `--accent-merged` |
| `--card-*` | Card styling | `--card-bg`, `--card-bg-hover`, `--card-shadow` |
| `--column-*` | Column styling | `--column-bg`, `--column-header-bg` |
| `--btn-*` | Button styling | `--btn-primary-bg`, `--btn-secondary-bg`, `--btn-danger-bg` |
| `--input-*` | Form input styling | `--input-bg`, `--input-border`, `--input-focus-border` |
| `--radius-*` | Border radii | `--radius-sm` (4px), `--radius-md` (6px), `--radius-lg` (8px), `--radius-xl` (12px) |
| `--transition-speed` | Animation duration | 150ms |
| `--focus-ring` | Focus outline | Box-shadow with accent color |

---

## Storage Layer

### utils/storage.ts

| Function | Purpose |
|----------|---------|
| `loadState()` | Reads and merges from localStorage, returns full `AppState` with defaults |
| `saveState(state)` | Writes state (minus token) to `github-kanban`, manages token separately |
| `saveBoards(boards)` | Convenience: loads state, updates boards, saves |
| `saveSettings(settings)` | Convenience: loads state, updates settings, saves |
| `saveToken(token)` | Writes/removes token to `github-kanban-token` |
| `clearAllData()` | Removes both localStorage keys |

### Default Values

```typescript
DEFAULT_SETTINGS = {
  theme: 'system',
  autoRefreshEnabled: true,
  autoRefreshInterval: 5,     // minutes
  refreshOnFocus: true,
  compactCards: false,
}

DEFAULT_STATE = {
  token: null,
  currentUser: null,
  boards: [],
  activeBoardId: null,
  settings: DEFAULT_SETTINGS,
}
```

### Load Strategy

`loadState()` uses a merge strategy:
1. Read raw JSON from `github-kanban`
2. Read token from `github-kanban-token`
3. Spread `DEFAULT_STATE`, then parsed state, then spread `DEFAULT_SETTINGS` into `settings`
4. This ensures new settings fields get defaults without losing existing data

---

## Type System

### Entity Discrimination

`GitHubEntity` is a union of `GitHubIssue | GitHubPullRequest`. They are discriminated by structural typing:
- `isPullRequest(entity)`: checks `'head' in entity && 'base' in entity`
- `isIssue(entity)`: negation of `isPullRequest`

### Key Differences Between Issue and PR

| Field | Issue | Pull Request |
|-------|-------|-------------|
| `state` | `'open' \| 'closed'` | `'open' \| 'closed' \| 'merged'` |
| `pull_request` | Optional `GitHubPullRequestRef` | Not present |
| `draft` | Optional boolean | Required boolean |
| `merged_at` | Not present | `string \| null` |
| `requested_reviewers` | Not present | `GitHubUser[]` |
| `head`, `base` | Not present | `{ ref, sha }` |
| `review_comments` | Not present | `number` |

### Export Format

```typescript
interface ExportData {
  version: number;        // Currently 1
  exportedAt: string;     // ISO 8601 timestamp
  boards: BoardConfig[];  // Full board configs including columns and filters
  settings: AppSettings;  // App settings
}
```

---

## CSS Architecture

### Methodology

- **CSS Modules** for component isolation (`.module.css` files)
- **CSS Custom Properties** for theming (global `variables.css`)
- **Global CSS** for resets and utility classes only (`global.css`)
- No CSS-in-JS library, no Tailwind, no utility class framework

### File Naming Convention

Each component that needs styles has a co-located module:
```
ComponentName.tsx
ComponentName.module.css
```

Imported as: `import styles from './ComponentName.module.css'`

Used as: `className={styles.myClass}` or `className={\`${styles.a} ${condition ? styles.b : ''}\`}`

### Global Styles (`global.css`)

- Box-sizing reset
- Full-height html/body/root
- System font stack
- Custom scrollbar styling
- `.sr-only` utility class

### Color Usage Patterns

- Entity state icons use `--accent-success` (open), `--accent-danger` (closed), `--accent-merged` (merged), `--text-tertiary` (draft)
- Labels use inline styles with colors from the GitHub label hex: `backgroundColor: #${color}20`, `color: #${color}`, `borderColor: #${color}40`
- Error states use `color-mix(in srgb, var(--accent-danger) 10%, transparent)` for subtle backgrounds

### Animation

- `@keyframes spin` — 360° rotation for loading spinner (Header refresh button)
- `@keyframes loading` — translateX sliding for progress bar (BoardView loading bar)
- Column collapse chevron uses CSS `transform: rotate(-90deg)` with `transition: transform 150ms`
- Header action buttons fade in/out with `opacity` transition on column hover
