import { Octokit } from 'octokit';
import type { GitHubIssue, GitHubPullRequest, GitHubUser, ExportData } from '../types';

let octokitInstance: Octokit | null = null;

export function initOctokit(token: string): Octokit {
  octokitInstance = new Octokit({ auth: token });
  return octokitInstance;
}

export function getOctokit(): Octokit {
  if (!octokitInstance) {
    throw new Error('Octokit not initialized. Call initOctokit first.');
  }
  return octokitInstance;
}

export function clearOctokit(): void {
  octokitInstance = null;
}

export async function validateToken(token: string): Promise<GitHubUser> {
  const kit = new Octokit({ auth: token });
  const { data } = await kit.rest.users.getAuthenticated();
  return {
    login: data.login,
    avatar_url: data.avatar_url,
    html_url: data.html_url,
  };
}

export async function fetchRepoIssues(
  owner: string,
  repo: string,
  state: 'open' | 'closed' | 'all' = 'open'
): Promise<GitHubIssue[]> {
  const kit = getOctokit();
  const issues: GitHubIssue[] = [];

  const iterator = kit.paginate.iterator(kit.rest.issues.listForRepo, {
    owner,
    repo,
    state,
    per_page: 100,
    sort: 'updated',
    direction: 'desc',
  });

  for await (const { data } of iterator) {
    for (const item of data) {
      issues.push({
        id: item.id,
        number: item.number,
        title: item.title,
        body: item.body ?? undefined,
        state: item.state as 'open' | 'closed',
        html_url: item.html_url,
        user: {
          login: item.user?.login ?? 'unknown',
          avatar_url: item.user?.avatar_url ?? '',
          html_url: item.user?.html_url ?? '',
        },
        labels: (item.labels ?? [])
          .filter((l): l is { id?: number; name?: string; color?: string; description?: string | null } =>
            typeof l === 'object' && l !== null
          )
          .map((l) => ({
            id: l.id ?? 0,
            name: l.name ?? '',
            color: l.color ?? '000000',
            description: l.description ?? undefined,
          })),
        assignees: (item.assignees ?? []).map((a) => ({
          login: a.login,
          avatar_url: a.avatar_url,
          html_url: a.html_url,
        })),
        milestone: item.milestone
          ? {
              id: item.milestone.id,
              title: item.milestone.title,
              state: item.milestone.state as 'open' | 'closed',
              html_url: item.milestone.html_url,
            }
          : null,
        created_at: item.created_at,
        updated_at: item.updated_at,
        closed_at: item.closed_at ?? null,
        comments: item.comments,
        pull_request: item.pull_request
          ? {
              url: item.pull_request.url ?? '',
              html_url: item.pull_request.html_url ?? '',
              number: item.number,
            }
          : undefined,
        repository_url: item.repository_url,
      });
    }
    // Limit to 500 issues per repo to avoid excessive API usage
    if (issues.length >= 500) break;
  }

  return issues;
}

export async function fetchRepoPullRequests(
  owner: string,
  repo: string,
  state: 'open' | 'closed' | 'all' = 'open'
): Promise<GitHubPullRequest[]> {
  const kit = getOctokit();
  const prs: GitHubPullRequest[] = [];

  const iterator = kit.paginate.iterator(kit.rest.pulls.list, {
    owner,
    repo,
    state,
    per_page: 100,
    sort: 'updated',
    direction: 'desc',
  });

  for await (const { data } of iterator) {
    for (const item of data) {
      prs.push({
        id: item.id,
        number: item.number,
        title: item.title,
        body: item.body ?? undefined,
        state: item.merged_at ? 'merged' : (item.state as 'open' | 'closed'),
        html_url: item.html_url,
        user: {
          login: item.user?.login ?? 'unknown',
          avatar_url: item.user?.avatar_url ?? '',
          html_url: item.user?.html_url ?? '',
        },
        labels: (item.labels ?? []).map((l) => ({
          id: l.id ?? 0,
          name: l.name ?? '',
          color: l.color ?? '000000',
          description: l.description ?? undefined,
        })),
        assignees: (item.assignees ?? []).map((a) => ({
          login: a.login,
          avatar_url: a.avatar_url,
          html_url: a.html_url,
        })),
        milestone: item.milestone
          ? {
              id: item.milestone.id,
              title: item.milestone.title,
              state: item.milestone.state as 'open' | 'closed',
              html_url: item.milestone.html_url,
            }
          : null,
        created_at: item.created_at,
        updated_at: item.updated_at,
        closed_at: item.closed_at ?? null,
        merged_at: item.merged_at ?? null,
        comments: (item as unknown as { comments?: number }).comments ?? 0,
        review_comments: (item as unknown as { review_comments?: number }).review_comments ?? 0,
        draft: item.draft ?? false,
        requested_reviewers: (item.requested_reviewers ?? [])
          .filter((r): r is typeof r & { login: string; avatar_url: string; html_url: string } =>
            'login' in r
          )
          .map((r) => ({
            login: r.login,
            avatar_url: r.avatar_url,
            html_url: r.html_url,
          })),
        head: { ref: item.head.ref, sha: item.head.sha },
        base: { ref: item.base.ref, sha: item.base.sha },
        repository_url: item.base.repo?.url ?? '',
      });
    }
    if (prs.length >= 500) break;
  }

  return prs;
}

// --- GraphQL PR enrichment ---

const PR_DETAILS_FRAGMENT = `
  fragment PrDetails on PullRequest {
    number
    reviewDecision
    reviews(last: 100) {
      nodes { state author { login } }
    }
    reviewThreads(first: 100) {
      nodes { isResolved }
    }
    commits(last: 1) {
      nodes {
        commit {
          statusCheckRollup { state }
        }
      }
    }
    files(first: 100) {
      nodes { viewerViewedState }
    }
  }
`;

interface GraphQLPrData {
  number: number;
  reviewDecision: string | null;
  reviews: { nodes: { state: string; author: { login: string } | null }[] };
  reviewThreads: { nodes: { isResolved: boolean }[] };
  commits: { nodes: { commit: { statusCheckRollup: { state: string } | null } }[] };
  files: { nodes: { viewerViewedState: string }[] };
}

function mapCiStatus(state: string | undefined): GitHubPullRequest['ci_status'] {
  if (!state) return 'none';
  switch (state.toUpperCase()) {
    case 'SUCCESS': return 'success';
    case 'FAILURE': case 'ERROR': return 'failure';
    case 'PENDING': case 'EXPECTED': return 'pending';
    default: return 'none';
  }
}

function mapReviewDecision(decision: string | null): GitHubPullRequest['review_decision'] {
  if (!decision) return 'none';
  switch (decision) {
    case 'APPROVED': return 'approved';
    case 'CHANGES_REQUESTED': return 'changes_requested';
    case 'REVIEW_REQUIRED': return 'review_required';
    default: return 'none';
  }
}

function enrichPr(pr: GitHubPullRequest, gql: GraphQLPrData): void {
  pr.review_decision = mapReviewDecision(gql.reviewDecision);

  // Count unique latest reviews by author
  const latestByAuthor = new Map<string, string>();
  for (const r of gql.reviews.nodes) {
    if (r.author?.login) {
      latestByAuthor.set(r.author.login, r.state);
    }
  }
  pr.approved_count = [...latestByAuthor.values()].filter((s) => s === 'APPROVED').length;
  pr.changes_requested_count = [...latestByAuthor.values()].filter((s) => s === 'CHANGES_REQUESTED').length;

  // Unresolved comment threads
  pr.unresolved_comment_count = gql.reviewThreads.nodes.filter((t) => !t.isResolved).length;

  // CI status from the latest commit
  const rollup = gql.commits.nodes[0]?.commit?.statusCheckRollup;
  pr.ci_status = mapCiStatus(rollup?.state);

  // Unviewed files
  pr.unviewed_files_count = gql.files.nodes.filter((f) => f.viewerViewedState !== 'VIEWED').length;
}

const BATCH_SIZE = 30;

async function enrichPullRequests(
  owner: string,
  repo: string,
  prs: GitHubPullRequest[],
): Promise<void> {
  if (prs.length === 0) return;
  const kit = getOctokit();

  for (let i = 0; i < prs.length; i += BATCH_SIZE) {
    const batch = prs.slice(i, i + BATCH_SIZE);
    const aliases = batch
      .map((pr, idx) => `pr_${idx}: pullRequest(number: ${pr.number}) { ...PrDetails }`)
      .join('\n');

    const query = `
      ${PR_DETAILS_FRAGMENT}
      query ($owner: String!, $repo: String!) {
        repository(owner: $owner, name: $repo) {
          ${aliases}
        }
      }
    `;

    try {
      const data: { repository: Record<string, GraphQLPrData> } = await kit.graphql(query, {
        owner,
        repo,
      });

      for (let idx = 0; idx < batch.length; idx++) {
        const gqlPr = data.repository[`pr_${idx}`];
        if (gqlPr) {
          enrichPr(batch[idx], gqlPr);
        }
      }
    } catch {
      // If GraphQL enrichment fails, leave enriched fields as undefined
      break;
    }
  }
}

export interface RepoData {
  issues: GitHubIssue[];
  pullRequests: GitHubPullRequest[];
}

export async function fetchAllRepoData(
  repos: string[],
  onRepoComplete?: (result: Map<string, RepoData>) => void,
  onProgress?: (completed: number, total: number) => void,
  skipEnrichment?: boolean,
): Promise<Map<string, RepoData>> {
  const result = new Map<string, RepoData>();
  const stepsPerRepo = skipEnrichment ? 1 : 2;
  const totalSteps = repos.length * stepsPerRepo;
  let completedSteps = 0;

  await Promise.all(
    repos.map(async (repoFullName) => {
      const [owner, repo] = repoFullName.split('/');
      if (!owner || !repo) return;

      const [issues, pullRequests] = await Promise.all([
        fetchRepoIssues(owner, repo, 'all'),
        fetchRepoPullRequests(owner, repo, 'all'),
      ]);

      // Filter out issues that are actually PRs (GitHub API returns PRs in issues endpoint)
      const realIssues = issues.filter((i) => !i.pull_request);

      result.set(repoFullName, { issues: realIssues, pullRequests });
      onRepoComplete?.(result);
      completedSteps++;
      onProgress?.(completedSteps, totalSteps);

      if (!skipEnrichment) {
        // Enrich PRs with review/CI/thread data via GraphQL
        await enrichPullRequests(owner, repo, pullRequests);
        onRepoComplete?.(result);
        completedSteps++;
        onProgress?.(completedSteps, totalSteps);
      }
    })
  );

  return result;
}

export async function fetchUserOrgs(): Promise<string[]> {
  const kit = getOctokit();
  const { data } = await kit.rest.orgs.listForAuthenticatedUser({
    per_page: 100,
  });
  return data.map((org) => org.login);
}

export async function searchRepos(
  query: string,
  scopeUser?: string,
  scopeOrgs?: string[]
): Promise<string[]> {
  const kit = getOctokit();
  let q = query;
  if (scopeUser) {
    const qualifiers = [`user:${scopeUser}`];
    if (scopeOrgs) {
      for (const org of scopeOrgs) {
        qualifiers.push(`org:${org}`);
      }
    }
    q = `${query} ${qualifiers.join(' ')}`;
  }
  const { data } = await kit.rest.search.repos({
    q,
    per_page: 15,
    sort: 'updated',
  });
  return data.items.map((item) => item.full_name);
}

const GIST_FILENAME = 'github-kanban-config.json';

export async function checkGistScope(): Promise<boolean> {
  const kit = getOctokit();
  try {
    await kit.rest.gists.list({ per_page: 1 });
    return true;
  } catch {
    return false;
  }
}

export async function findConfigGist(): Promise<{ id: string; data: ExportData } | null> {
  const kit = getOctokit();
  const iterator = kit.paginate.iterator(kit.rest.gists.list, {
    per_page: 100,
  });

  for await (const { data: gists } of iterator) {
    for (const gist of gists) {
      if (gist.files && GIST_FILENAME in gist.files) {
        const { data: full } = await kit.rest.gists.get({ gist_id: gist.id });
        const file = full.files?.[GIST_FILENAME];
        if (file?.content) {
          return { id: gist.id, data: JSON.parse(file.content) as ExportData };
        }
      }
    }
  }
  return null;
}

export async function saveConfigToGist(
  data: ExportData,
  existingGistId?: string | null,
): Promise<string> {
  const kit = getOctokit();
  const files = { [GIST_FILENAME]: { content: JSON.stringify(data, null, 2) } };

  if (existingGistId) {
    try {
      await kit.rest.gists.update({ gist_id: existingGistId, files });
      return existingGistId;
    } catch {
      // Gist may have been deleted — fall through to create
    }
  }

  const { data: created } = await kit.rest.gists.create({
    description: 'GitHub Kanban Board — configuration backup',
    public: false,
    files,
  });
  return created.id!;
}

export async function loadConfigFromGist(gistId: string): Promise<ExportData> {
  const kit = getOctokit();
  const { data } = await kit.rest.gists.get({ gist_id: gistId });
  const file = data.files?.[GIST_FILENAME];
  if (!file?.content) {
    throw new Error('Gist does not contain a valid configuration file');
  }
  return JSON.parse(file.content) as ExportData;
}

export async function getUserRepos(): Promise<string[]> {
  const kit = getOctokit();
  const repos: string[] = [];

  const iterator = kit.paginate.iterator(kit.rest.repos.listForAuthenticatedUser, {
    per_page: 100,
    sort: 'updated',
    direction: 'desc',
  });

  for await (const { data } of iterator) {
    for (const repo of data) {
      repos.push(repo.full_name);
    }
    if (repos.length >= 200) break;
  }

  return repos;
}
