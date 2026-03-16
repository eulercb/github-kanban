# GitHub Kanban Board

A lightweight, privacy-first Kanban board that turns your GitHub issues and pull requests into organized columns — right in your browser.

No servers. No sign-ups. No data leaves your machine (except to talk to the GitHub API). Just paste a Personal Access Token and start triaging.

## Why This Exists

GitHub's built-in Projects are powerful but heavyweight. Sometimes you just want a fast, focused view of your issues and PRs across multiple repos — filterable, sortable, drag-and-drop — without the overhead of configuring a full project board.

GitHub Kanban Board gives you exactly that:

- **Works across repos and orgs** — Pull issues and PRs from any combination of repositories into a single board. Filter by organisation, repo, label, assignee, CI status, and more.
- **Powerful filter engine** — Each column is defined by filter rules (field + operator + value) combined with AND/OR logic. Build columns like "My open PRs that need review" or "Bugs in the frontend repo" in seconds.
- **Runs entirely in your browser** — Zero backend. The app talks directly to the GitHub REST API via your token. Your data stays in `localStorage` (and optionally backed up to a private Gist).
- **Dark mode, auto-refresh, keyboard-friendly** — Follows your OS theme preference. Auto-refreshes on a configurable interval and when you switch back to the tab. Columns are drag-and-drop reorderable.
- **Portable configuration** — Export your boards and settings as JSON. Import them on another machine. Or enable Gist sync for automatic cloud backup with zero effort.

## Getting Started

### Use the hosted version

Open **[eulercb.github.io/github-kanban](https://eulercb.github.io/github-kanban/)**, paste a [GitHub Personal Access Token](https://github.com/settings/tokens) with `repo` read access, and create your first board. Nothing to install.

### Run locally

```bash
git clone https://github.com/eulercb/github-kanban.git
cd github-kanban
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173), enter your GitHub PAT, and you're ready to go.

## Features at a Glance

| Feature | Details |
|---|---|
| Multi-repo boards | Add any number of `owner/repo` sources to a single board |
| Flexible columns | Define columns with composable filter rules (AND/OR) |
| 15+ filter fields | Type, state, assignee, author, label, milestone, repo, org, draft, review status, CI status, title, and more |
| Column presets | Quick-start templates: "My Issues", "PR Review", or start blank |
| Drag & drop | Reorder columns with native drag-and-drop (powered by dnd-kit) |
| Light & dark themes | System-aware theming with a manual override |
| Auto-refresh | Configurable polling interval; pauses when the tab is hidden |
| Focus refresh | Automatically refreshes data when you switch back to the tab |
| Gist backup | Sync your configuration to a private GitHub Gist — automatic and seamless |
| Import / Export | Move your boards between browsers with a JSON file |
| Compact card mode | Toggle between detailed and compact card layouts |
| PR enrichment | See CI status, review decisions, unresolved comments, and unviewed files on PR cards |
| AI board generation | Use Claude Code to generate board configurations from a natural language description |

## How It Works

1. **Authenticate** — Enter a GitHub PAT (only read permissions needed). The token is stored locally and never sent anywhere except the GitHub API.
2. **Create a board** — Name it, search for repositories, and pick a column preset (or start from scratch).
3. **Customise columns** — Add filter rules to control which issues and PRs appear in each column. Combine filters with AND or OR logic.
4. **Stay in sync** — The app fetches fresh data automatically. Enable Gist sync to keep your configuration backed up across devices.

## Tech Stack

| Concern | Choice |
|---|---|
| UI | React 19 + TypeScript |
| Build | Vite 8 |
| GitHub API | Octokit |
| Drag & Drop | dnd-kit |
| Styling | CSS Modules + CSS Custom Properties |
| State | React Context + useReducer |
| Storage | localStorage (+ optional Gist sync) |

No external CSS frameworks. No state management libraries. No build-time dependencies beyond what's listed above. The production bundle is under 150 KB gzipped.

## AI-Powered Board Setup

If you use [Claude Code](https://docs.anthropic.com/en/docs/claude-code), you can install this repo as a plugin to generate board configurations from a plain English description.

**1. Add the marketplace and install the plugin:**

```bash
/plugin marketplace add eulercb/github-kanban
/plugin install github-kanban@github-kanban
```

**2. Use the `/generate-board` skill:**

```
/generate-board pr-review for my-org/api and my-org/web
```

Claude will ask about your workflow, generate a complete board config with columns and filters, and give you a JSON you can paste straight into **Settings > Import / Export > Paste Configuration**. It's a fast way to set up complex boards without manually wiring up filter rules one by one.

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for the development guide, architecture overview, and conventions.

## License

This project is licensed under the [GNU Affero General Public License v3.0](LICENSE). In short: you're free to use, modify, and distribute this software, but any modified version you host as a service must also be open-sourced under the same license.
