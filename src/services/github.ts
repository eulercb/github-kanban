import { Octokit } from 'octokit';
import type { GitHubIssue, GitHubPullRequest, GitHubUser } from '../types';

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

export interface RepoData {
  issues: GitHubIssue[];
  pullRequests: GitHubPullRequest[];
}

export async function fetchAllRepoData(
  repos: string[]
): Promise<Map<string, RepoData>> {
  const result = new Map<string, RepoData>();

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
    })
  );

  return result;
}

export async function searchRepos(
  query: string,
  scopeUser?: string
): Promise<string[]> {
  const kit = getOctokit();
  const q = scopeUser ? `${query} user:${scopeUser}` : query;
  const { data } = await kit.rest.search.repos({
    q,
    per_page: 15,
    sort: 'updated',
  });
  return data.items.map((item) => item.full_name);
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
