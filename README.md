# GitHub Kanban Board

A frontend-only, customizable Kanban board for viewing GitHub issues and pull requests. All communication happens directly between the browser and the GitHub API — there is no backend server.

## Quick Start

```bash
npm install
npm run dev       # Start dev server at http://localhost:5173
npm run build     # Type-check + production build to dist/
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

## How It Works

1. **Authentication**: On first launch, the user is prompted to enter a GitHub Personal Access Token (PAT). The token is validated against the GitHub API and stored in `localStorage`. Only read permissions are needed.

2. **Board Creation**: After auth, the user creates a board by giving it a name, adding one or more GitHub repositories (via search or manual `owner/repo` entry), and optionally choosing a column template preset.

3. **Columns & Filters**: Each column has a set of filter rules. A filter rule is a triplet: `(field, operator, value)`. Multiple filters in a column can be combined with AND or OR logic. Columns can be added, removed, renamed, reordered (drag-and-drop), and collapsed.

4. **Data Fetching**: The app fetches issues and pull requests from the GitHub API for all repos configured on the active board. It supports manual refresh, auto-refresh on a configurable interval, and refresh-on-focus when the user returns to the tab.

5. **State Persistence**: All app state (boards, columns, filters, settings) is stored in `localStorage`. The token is stored in a separate `localStorage` key. An import/export feature allows moving configuration between browsers via JSON files.

## Tech Stack

| Concern | Library |
|---------|---------|
| UI Framework | React 19 + TypeScript |
| Build Tool | Vite 8 |
| GitHub API | Octokit 5 |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Styling | CSS Modules + CSS Custom Properties |
| State | React Context + useReducer |
| Storage | localStorage |

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
│   └── id.ts                        # UUID generation
├── components/
│   ├── Auth/
│   │   └── TokenSetup.tsx           # PAT input form with instructions
│   ├── Layout/
│   │   └── Header.tsx               # Top bar: logo, board tabs, refresh, settings, user menu
│   ├── Board/
│   │   ├── BoardView.tsx            # Main board layout, column DnD container
│   │   └── BoardSetup.tsx           # Board creation form with repo search + presets
│   ├── Column/
│   │   ├── KanbanColumn.tsx         # Single column: header, cards, collapse, DnD
│   │   └── FilterEditor.tsx         # Filter rule editor UI
│   ├── Card/
│   │   └── EntityCard.tsx           # Issue/PR card with state icon, labels, meta
│   └── Settings/
│       └── Settings.tsx             # Modal: theme, refresh settings, board mgmt, import/export
└── styles/
    ├── variables.css                # CSS custom properties (light + dark themes)
    └── global.css                   # Resets, typography, scrollbar, utilities
```

## Filter System

Each column's filter rules control which GitHub entities appear in it.

### Available Fields

| Field | Description | Example Values |
|-------|-------------|----------------|
| `type` | Entity type | `issue`, `pull_request` |
| `state` | Entity state | `open`, `closed`, `merged` |
| `assignee` | Assigned user login | `octocat` |
| `author` | Creator user login | `octocat` |
| `label` | Label name | `bug`, `enhancement` |
| `milestone` | Milestone title | `v1.0` |
| `repo` | Repository full name | `owner/repo` |
| `draft` | PR draft status | `true`, `false` |
| `review_status` | PR review status | `pending`, `none` |
| `title` | Title text search | any substring |
| `has_pull_request` | Issue has linked PR | `true`, `false` |

### Operators

| Operator | Behavior |
|----------|----------|
| `is` | Exact match (or membership for array fields) |
| `is_not` | Negated exact match |
| `contains` | Substring match (or partial membership for arrays) |
| `not_contains` | Negated substring match |

All comparisons are case-insensitive.

### Filter Combination

- **AND**: Entity must match ALL filter rules in the column
- **OR**: Entity must match ANY filter rule in the column

## Themes

Supports three modes: `light`, `dark`, and `system` (follows OS preference). The theme is applied via a `data-theme` attribute on `<html>` and powered entirely by CSS custom properties defined in `src/styles/variables.css`. The color palette is inspired by GitHub's design system.

## Configuration Import/Export

From Settings > Import/Export, users can:
- **Export**: Downloads a JSON file containing all boards and settings
- **Import**: Loads a previously exported JSON file, merging boards by ID

The export format (`ExportData` type) includes a version number for future compatibility.

## Column Presets

When creating a board, users can choose from:

1. **My Issues** — 3 columns: "Assigned to me", "My Open Issues", "Issues with PRs"
2. **PR Review** — 3 columns: "My PRs", "Needs Review", "Draft PRs"
3. **Empty Board** — Start from scratch

## localStorage Keys

| Key | Contents |
|-----|----------|
| `github-kanban` | Serialized app state (boards, settings, active board, user) — excludes token |
| `github-kanban-token` | GitHub Personal Access Token (stored separately) |

## API Rate Limits

The app fetches up to 500 issues and 500 pull requests per repository using paginated API calls. Auto-refresh respects `document.hidden` to avoid wasting API calls when the tab is in the background. Refresh-on-focus has a 30-second debounce.
