import type { GitHubEntity } from '../types';

export function entityKey(entity: GitHubEntity): string {
  return `${entity.id}-${entity.html_url}`;
}
