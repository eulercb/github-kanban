# Contributing

Thanks for your interest in contributing to GitHub Kanban Board! This guide covers everything you need to get started.

## Development Setup

```bash
git clone https://github.com/eulercb/github-kanban.git
cd github-kanban
npm install
npm run dev       # Start Vite dev server at http://localhost:5173
```

### Available Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the Vite dev server with hot reload |
| `npm run build` | TypeScript type-check (`tsc -b`) + Vite production build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the production build locally |

Always run `npm run build` before submitting a PR — TypeScript errors will fail the build.

## Project Structure

```
src/
├── App.tsx                          # Root component, auth gating, provider wiring
├── main.tsx                         # React DOM entry point
├── types/
│   └── index.ts                     # All TypeScript interfaces and type guards
├── contexts/
│   ├── AppContext.tsx                # Global app state (boards, settings, user, token)
│   └── DataContext.tsx               # GitHub data fetching, refresh logic
├── hooks/
│   └── useTheme.ts                  # Applies light/dark/system theme to <html>
├── services/
│   ├── github.ts                    # Octokit wrapper, API calls, data transforms
│   └── filters.ts                   # Filter matching engine
├── utils/
│   ├── storage.ts                   # localStorage read/write helpers
│   ├── export.ts                    # JSON import/export logic
│   └── id.ts                        # UUID generation
├── components/
│   ├── Auth/
│   │   └── TokenSetup.tsx           # PAT input form with instructions
│   ├── Layout/
│   │   ├── Header.tsx               # Top bar: logo, refresh, settings, user menu
│   │   └── LogoutDialog.tsx         # Sign-out confirmation (with Gist sync awareness)
│   ├── Board/
│   │   ├── BoardView.tsx            # Main board layout, column DnD container
│   │   └── BoardSetup.tsx           # Board creation form with repo search + presets
│   ├── Column/
│   │   ├── KanbanColumn.tsx         # Single column: header, cards, collapse, DnD
│   │   └── FilterEditor.tsx         # Filter rule editor UI
│   ├── Card/
│   │   └── EntityCard.tsx           # Issue/PR card with state icon, labels, meta
│   └── Settings/
│       └── Settings.tsx             # Modal: theme, refresh, board management, import/export
└── styles/
    ├── variables.css                # CSS custom properties (light + dark themes)
    └── global.css                   # Resets, typography, scrollbar, utilities
```

For a deep dive into the architecture, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Conventions

- **TypeScript** — All code is TypeScript. No `any` unless absolutely unavoidable.
- **CSS Modules** — Every component has a co-located `*.module.css` file. No global CSS classes in components.
- **Named exports** — All components use named exports (except `App` which is default).
- **IDs** — Generated with `crypto.randomUUID()` via `utils/id.ts`.
- **No icon library** — SVG icons are inlined in JSX.
- **Desktop-only** — No mobile responsive design (for now).

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

## Filter System Reference

Each column's filter rules control which GitHub entities appear in it.

### Available Fields

| Field | Description | Example Values |
|---|---|---|
| `type` | Entity type | `issue`, `pull_request` |
| `state` | Entity state | `open`, `closed`, `merged` |
| `assignee` | Assigned user login | `octocat` |
| `author` | Creator user login | `octocat` |
| `label` | Label name | `bug`, `enhancement` |
| `milestone` | Milestone title | `v1.0` |
| `repo` | Repository full name | `owner/repo` |
| `org` | Repository owner / organisation | `facebook` |
| `draft` | PR draft status | `true`, `false` |
| `review_status` | PR review status | `approved`, `changes_requested`, `review_required`, `none` |
| `ci_status` | CI pipeline status | `success`, `failure`, `pending`, `none` |
| `has_unresolved_comments` | PR has unresolved threads | `true`, `false` |
| `has_unviewed_files` | PR has unviewed files | `true`, `false` |
| `title` | Title text search | any substring |
| `has_pull_request` | Issue has linked PR | `true`, `false` |

### Operators

| Operator | Behavior |
|---|---|
| `is` | Exact match (or membership for array fields) |
| `is_not` | Negated exact match |
| `contains` | Substring match (or partial membership for arrays) |
| `not_contains` | Negated substring match |

All comparisons are case-insensitive.

## localStorage Keys

| Key | Contents |
|---|---|
| `github-kanban` | Serialized app state (boards, settings, active board, user) — excludes token |
| `github-kanban-token` | GitHub Personal Access Token (stored separately) |
| `github-kanban-gist-sync-hash` | Hash of last synced config (for Gist change detection) |

## Known Limitations

- Preset column templates use `{{user}}` as a placeholder — not dynamically replaced; the user must manually enter their login
- `review_status` only distinguishes known review decisions from the GraphQL enrichment; the REST API alone cannot provide this
- Max 500 issues and 500 PRs per repo to avoid excessive API usage
- The `width` field on `ColumnConfig` is defined but not used for dynamic column sizing (columns are fixed at 340px)
