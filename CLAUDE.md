# CLAUDE.md — Agent Reference for GitHub Kanban Board

This file provides context for AI coding agents working on this project. Read this first before making changes.

## Build & Run Commands

```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server (http://localhost:5173)
npm run build        # TypeScript type-check (tsc -b) then Vite production build
npm run lint         # ESLint
npm run preview      # Preview production build locally
```

The build command runs `tsc -b && vite build`. TypeScript errors will fail the build. Always run `npm run build` after making changes to verify correctness.

## Architecture Overview

This is a **frontend-only** React + TypeScript application. There is no backend server. The browser communicates directly with the GitHub REST API via Octokit. All state is persisted in `localStorage`.

### Component Tree (Runtime)

```
main.tsx → createRoot
  └── App (default export from App.tsx)
      └── AppProvider (contexts/AppContext.tsx)
          └── AppContent (in App.tsx)
              ├── [validating] → "Connecting to GitHub..." loading screen
              ├── [no token]  → TokenSetup (components/Auth/TokenSetup.tsx)
              └── [authenticated] →
                  └── DataProvider (contexts/DataContext.tsx)
                      ├── Header (components/Layout/Header.tsx)
                      └── BoardView (components/Board/BoardView.tsx)
                          ├── [no boards] → BoardSetup
                          └── [has board] →
                              ├── Toolbar (add column, new board)
                              └── DndContext + SortableContext
                                  └── KanbanColumn[] (components/Column/KanbanColumn.tsx)
                                      ├── FilterEditor (components/Column/FilterEditor.tsx)
                                      └── EntityCard[] (components/Card/EntityCard.tsx)
                          └── Settings modal (components/Settings/Settings.tsx)
```

### Data Flow

```
GitHub API ←→ services/github.ts (Octokit)
                    ↓
           contexts/DataContext.tsx (entities: GitHubEntity[])
                    ↓
           services/filters.ts (getColumnEntities)
                    ↓
           KanbanColumn → EntityCard[]
```

State management:
```
contexts/AppContext.tsx (useReducer)
        ↓ (auto-persists via useEffect)
utils/storage.ts → localStorage
```

## Key Types (src/types/index.ts)

All types are in one file. The most important ones:

- **`GitHubEntity`** = `GitHubIssue | GitHubPullRequest` — the union type for all items displayed on the board
- **`BoardConfig`** — a board with `id`, `name`, `repos: string[]`, `columns: ColumnConfig[]`
- **`ColumnConfig`** — a column with `id`, `title`, `filters: FilterRule[]`, `filterCombination: 'and' | 'or'`, `collapsed`, `width`
- **`FilterRule`** — `{ id, field: FilterField, operator: FilterOperator, value: string }`
- **`AppState`** — top-level state: `token`, `currentUser`, `boards`, `activeBoardId`, `settings`
- **`AppSettings`** — `theme`, `autoRefreshEnabled`, `autoRefreshInterval`, `refreshOnFocus`, `compactCards`

Type guards: `isPullRequest(entity)` and `isIssue(entity)` discriminate the union.

## Filter Engine (src/services/filters.ts)

The filter engine is the core logic of the app. Key functions:

- **`getColumnEntities(allEntities, column)`** — returns entities matching the column's filters
- **`filterEntities(entities, filters, combination)`** — applies AND/OR filter logic
- **`matchesRule(entity, rule)`** — evaluates a single filter rule against an entity

Filter fields with special behavior:
- `assignee`, `label`: These are **array fields** — the operator checks against all values in the array
- `state`: Returns `'merged'` for PRs with `merged_at` set, otherwise the raw `state` field
- `review_status`: Returns `'pending'` if `requested_reviewers.length > 0`, else `'none'`
- `draft`: Always `'false'` for issues
- `has_pull_request`: Only meaningful for issues (checks `pull_request` field presence)
- `repo`: Extracted from `repository_url` by splitting on `/`

All string comparisons are case-insensitive (`.toLowerCase()`).

## GitHub API Service (src/services/github.ts)

- Uses a **singleton Octokit instance** (`initOctokit` / `getOctokit` / `clearOctokit`)
- `fetchRepoIssues` and `fetchRepoPullRequests` use paginated iteration (100 per page, max 500 items)
- `fetchAllRepoData` fetches issues + PRs for all repos in parallel, filtering out pseudo-PR issues from the issues endpoint
- `validateToken` calls `users.getAuthenticated` to verify the token
- `searchRepos` wraps the GitHub search API for repo discovery

## Contexts

### AppContext (`contexts/AppContext.tsx`)
- **Provider**: `AppProvider` — wraps the entire app
- **Hook**: `useApp()` — returns `{ state, dispatch, setToken, setUser, addBoard, updateBoard, deleteBoard, setActiveBoard, updateSettings, logout }`
- **Reducer actions**: `SET_TOKEN`, `SET_USER`, `SET_BOARDS`, `ADD_BOARD`, `UPDATE_BOARD`, `DELETE_BOARD`, `SET_ACTIVE_BOARD`, `SET_SETTINGS`, `SET_THEME`, `LOAD_STATE`, `LOGOUT`
- Auto-persists to `localStorage` on every state change

### DataContext (`contexts/DataContext.tsx`)
- **Provider**: `DataProvider` — wraps authenticated content (inside AppProvider)
- **Hook**: `useData()` — returns `{ entities, isLoading, lastRefresh, error, refresh }`
- Fetches data when repos change or on manual refresh
- Auto-refresh timer: fires at `settings.autoRefreshInterval` minutes, skips if `document.hidden`
- Focus refresh: triggers on `visibilitychange` if >30s since last refresh
- Prevents concurrent refreshes via `isRefreshingRef`

## Styling

- **CSS Modules** (`*.module.css`) for component-scoped styles
- **CSS Custom Properties** in `src/styles/variables.css` for theming
- Theme applied via `data-theme="light|dark"` attribute on `<html>`, managed by `useTheme` hook
- GitHub-inspired color palette (light and dark variants)
- Key design tokens: `--bg-*`, `--text-*`, `--border-*`, `--accent-*`, `--card-*`, `--column-*`, `--btn-*`, `--input-*`, `--radius-*`, `--transition-speed`

## localStorage Keys

- `github-kanban` — serialized `AppState` (minus token)
- `github-kanban-token` — GitHub PAT (stored separately for easy clearing)

## Commit Format

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) standard:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

Examples:
- `feat(filters): add support for milestone filter field`
- `fix(data): prevent concurrent refresh race condition`
- `docs: update CLAUDE.md with commit conventions`
- `refactor(board): extract column reordering logic`

Use the body for additional context when the description alone isn't sufficient. Include `BREAKING CHANGE:` in the footer for breaking changes.

## Conventions

- IDs are generated with `crypto.randomUUID()` via `utils/id.ts`
- All components use named exports (except `App` which is default)
- Each component has a co-located `*.module.css` file
- No global CSS classes are used in components — only CSS modules and CSS custom properties
- SVG icons are inlined in JSX (no icon library dependency)
- The app is desktop-only — no mobile responsive design

## Common Modification Patterns

### Adding a new filter field
1. Add the field name to `FilterField` type in `src/types/index.ts`
2. Add field extraction logic in `matchesRule()` in `src/services/filters.ts`
3. Add the field to `FIELD_OPTIONS` array in `src/components/Column/FilterEditor.tsx`
4. If the field has known values, add them to `VALUE_SUGGESTIONS` in `FilterEditor.tsx`

### Adding a new setting
1. Add the field to `AppSettings` in `src/types/index.ts`
2. Add a default value in `DEFAULT_SETTINGS` in `src/utils/storage.ts`
3. Add UI controls in the General tab of `src/components/Settings/Settings.tsx`
4. Consume the setting where needed via `useApp().state.settings`

### Adding a new board preset
1. Add an entry to `PRESET_COLUMNS` array in `src/components/Board/BoardSetup.tsx`
2. Each preset has a `name` and `columns` array with filter configurations

### Adding a new card feature
1. Modify `EntityCard` in `src/components/Card/EntityCard.tsx`
2. Add styles in `EntityCard.module.css`
3. Data is available via the `entity` prop (typed as `GitHubEntity`)
4. Use `isPullRequest(entity)` to narrow the type for PR-specific fields

### Modifying the GitHub API data
1. Update types in `src/types/index.ts` (`GitHubIssue` or `GitHubPullRequest`)
2. Update the transform in `fetchRepoIssues` or `fetchRepoPullRequests` in `src/services/github.ts`
3. The DataContext will automatically pass new fields through to components

## Known Limitations

- Preset column templates use `{{user}}` as a placeholder for the current user login, but this is **not** dynamically replaced — the user must manually enter their login when using presets
- `review_status` filter only distinguishes `'pending'` (has requested reviewers) vs `'none'` — it does not fetch actual review states (approved, changes_requested) from the GitHub API, which would require additional API calls
- Max 500 issues and 500 PRs per repo to avoid excessive API usage
- `getUserRepos()` is exported but not currently used in the UI — `searchRepos()` is used instead for the board setup repo search
- The `width` field on `ColumnConfig` is defined but not used for dynamic column sizing (columns are fixed at 340px)
- The `Common/` component directory exists but is empty
