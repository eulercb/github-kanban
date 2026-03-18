import type { GitHubEntity } from '../types';

export function entityKey(entity: GitHubEntity): string {
  return `${entity.id}-${entity.html_url}`;
}

export function getEntityRepo(entity: GitHubEntity): string {
  const parts = entity.repository_url.split('/');
  return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
}
