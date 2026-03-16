// GitHub entity types

export interface GitHubUser {
  login: string;
  avatar_url: string;
  html_url: string;
}

export interface GitHubLabel {
  id: number;
  name: string;
  color: string;
  description?: string;
}

export interface GitHubMilestone {
  id: number;
  title: string;
  state: 'open' | 'closed';
  html_url: string;
}

export interface GitHubPullRequestRef {
  url: string;
  html_url: string;
  number: number;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body?: string;
  state: 'open' | 'closed';
  html_url: string;
  user: GitHubUser;
  labels: GitHubLabel[];
  assignees: GitHubUser[];
  milestone?: GitHubMilestone | null;
  created_at: string;
  updated_at: string;
  closed_at?: string | null;
  comments: number;
  pull_request?: GitHubPullRequestRef;
  repository_url: string;
  draft?: boolean;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body?: string;
  state: 'open' | 'closed' | 'merged';
  html_url: string;
  user: GitHubUser;
  labels: GitHubLabel[];
  assignees: GitHubUser[];
  milestone?: GitHubMilestone | null;
  created_at: string;
  updated_at: string;
  closed_at?: string | null;
  merged_at?: string | null;
  comments: number;
  review_comments: number;
  draft: boolean;
  requested_reviewers: GitHubUser[];
  head: { ref: string; sha: string };
  base: { ref: string; sha: string };
  repository_url: string;
  mergeable_state?: string;
  // Enriched fields (populated via GraphQL)
  ci_status?: 'success' | 'failure' | 'pending' | 'none';
  review_decision?: 'approved' | 'changes_requested' | 'review_required' | 'none';
  approved_count?: number;
  changes_requested_count?: number;
  unresolved_comment_count?: number;
  unviewed_files_count?: number;
}

export type GitHubEntity = GitHubIssue | GitHubPullRequest;

export type EntityType = 'issue' | 'pull_request';

// Filter types

export type FilterOperator =
  | 'is'
  | 'is_not'
  | 'contains'
  | 'not_contains';

export type FilterField =
  | 'type'           // issue or pull_request
  | 'state'          // open, closed, merged
  | 'assignee'       // user login
  | 'author'         // user login
  | 'label'          // label name
  | 'milestone'      // milestone title
  | 'repo'           // owner/repo
  | 'org'            // repository owner / organisation
  | 'draft'          // true/false
  | 'review_status'  // approved, changes_requested, review_required, pending, none
  | 'ci_status'      // success, failure, pending, none
  | 'has_unresolved_comments' // true/false
  | 'has_unviewed_files' // true/false
  | 'title'          // text search
  | 'has_pull_request'; // for issues linked to PRs

export interface FilterRule {
  id: string;
  field: FilterField;
  operator: FilterOperator;
  value: string;
}

export type FilterCombination = 'and' | 'or';

export interface FilterGroup {
  id: string;
  filters: FilterRule[];
  combination: FilterCombination;
}

// Sort types

export type SortField =
  | 'updated'
  | 'created'
  | 'comments'
  | 'title'
  | 'author';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

// Board/Column types

export interface ColumnConfig {
  id: string;
  title: string;
  filterGroups: FilterGroup[];
  collapsed: boolean;
  width: number; // px
  sortBy?: SortConfig;
}

export interface BoardConfig {
  id: string;
  name: string;
  columns: ColumnConfig[];
  repos: string[]; // "owner/repo" format
}

// App configuration

export type ThemeMode = 'light' | 'dark' | 'system';

export interface CardDisplaySettings {
  showLabels: boolean;
  showAssignees: boolean;
  showPrStatus: boolean;
  showCommentCount: boolean;
  showTimeAgo: boolean;
  showDraftBadge: boolean;
}

export const DEFAULT_CARD_DISPLAY: CardDisplaySettings = {
  showLabels: true,
  showAssignees: true,
  showPrStatus: true,
  showCommentCount: true,
  showTimeAgo: true,
  showDraftBadge: true,
};

export interface AppSettings {
  theme: ThemeMode;
  autoRefreshEnabled: boolean;
  autoRefreshInterval: number; // minutes
  refreshOnFocus: boolean;
  compactCards: boolean;
  cardDisplay: CardDisplaySettings;
}

export interface AppState {
  token: string | null;
  currentUser: GitHubUser | null;
  boards: BoardConfig[];
  activeBoardId: string | null;
  settings: AppSettings;
  gistId: string | null;
}

// Export config for import/export feature
export interface ExportData {
  version: number;
  exportedAt: string;
  boards: BoardConfig[];
  settings: AppSettings;
}

export function isPullRequest(entity: GitHubEntity): entity is GitHubPullRequest {
  return 'head' in entity && 'base' in entity;
}

export function isIssue(entity: GitHubEntity): entity is GitHubIssue {
  return !isPullRequest(entity);
}
