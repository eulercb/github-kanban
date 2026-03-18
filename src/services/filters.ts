import type {
  GitHubEntity,
  FilterRule,
  FilterGroup,
  ColumnConfig,
  SortConfig,
} from '../types';
import { isPullRequest } from '../types';
import { getEntityRepo } from '../utils/entityKey';

function getEntityType(entity: GitHubEntity): string {
  return isPullRequest(entity) ? 'pull_request' : 'issue';
}

function getEntityState(entity: GitHubEntity): string {
  if (isPullRequest(entity)) {
    if (entity.merged_at) return 'merged';
    if (entity.draft && entity.state === 'open') return 'draft';
  }
  return entity.state;
}

function matchesRule(entity: GitHubEntity, rule: FilterRule): boolean {
  const { field, operator, value } = rule;
  const lowerValue = value.toLowerCase();

  let fieldValue: string | string[] | boolean = '';

  switch (field) {
    case 'type':
      fieldValue = getEntityType(entity);
      break;
    case 'state':
      fieldValue = getEntityState(entity);
      break;
    case 'assignee':
      fieldValue = entity.assignees.map((a) => a.login.toLowerCase());
      break;
    case 'author':
      fieldValue = entity.user.login.toLowerCase();
      break;
    case 'label':
      fieldValue = entity.labels.map((l) => l.name.toLowerCase());
      break;
    case 'milestone':
      fieldValue = entity.milestone?.title.toLowerCase() ?? '';
      break;
    case 'repo':
      fieldValue = getEntityRepo(entity).toLowerCase();
      break;
    case 'org':
      fieldValue = getEntityRepo(entity).split('/')[0].toLowerCase();
      break;
    case 'draft':
      if (isPullRequest(entity)) {
        fieldValue = entity.draft ? 'true' : 'false';
      } else {
        fieldValue = 'false';
      }
      break;
    case 'reviewer':
      if (isPullRequest(entity)) {
        fieldValue = entity.requested_reviewers.map((r) => r.login.toLowerCase());
      } else {
        fieldValue = [];
      }
      break;
    case 'reviewed_by':
      if (isPullRequest(entity)) {
        fieldValue = (entity.reviewed_by ?? []).map((r) => r.toLowerCase());
      } else {
        fieldValue = [];
      }
      break;
    case 'review_status':
      if (isPullRequest(entity)) {
        fieldValue = entity.review_decision ?? (entity.requested_reviewers.length > 0 ? 'review_required' : 'none');
      } else {
        fieldValue = 'none';
      }
      break;
    case 'ci_status':
      if (isPullRequest(entity)) {
        fieldValue = entity.ci_status ?? 'none';
      } else {
        fieldValue = 'none';
      }
      break;
    case 'has_unresolved_comments':
      if (isPullRequest(entity)) {
        fieldValue = (entity.unresolved_comment_count ?? 0) > 0 ? 'true' : 'false';
      } else {
        fieldValue = 'false';
      }
      break;
    case 'has_unviewed_files':
      if (isPullRequest(entity)) {
        fieldValue = (entity.unviewed_files_count ?? 0) > 0 ? 'true' : 'false';
      } else {
        fieldValue = 'false';
      }
      break;
    case 'title':
      fieldValue = entity.title.toLowerCase();
      break;
    case 'has_pull_request':
      if (!isPullRequest(entity)) {
        fieldValue = entity.pull_request ? 'true' : 'false';
      } else {
        fieldValue = 'false';
      }
      break;
    default:
      return true;
  }

  // Array fields (assignee, label, reviewer, reviewed_by)
  if (Array.isArray(fieldValue)) {
    switch (operator) {
      case 'is':
      case 'contains':
        return fieldValue.some((v) => v === lowerValue || v.includes(lowerValue));
      case 'is_not':
      case 'not_contains':
        return !fieldValue.some((v) => v === lowerValue || v.includes(lowerValue));
      default:
        return true;
    }
  }

  // String fields
  const strValue = typeof fieldValue === 'boolean' ? String(fieldValue) : fieldValue;
  switch (operator) {
    case 'is':
      return strValue === lowerValue;
    case 'is_not':
      return strValue !== lowerValue;
    case 'contains':
      return strValue.includes(lowerValue);
    case 'not_contains':
      return !strValue.includes(lowerValue);
    default:
      return true;
  }
}

function getSortValue(entity: GitHubEntity, field: SortConfig['field']): string | number {
  switch (field) {
    case 'updated':
      return new Date(entity.updated_at).getTime();
    case 'created':
      return new Date(entity.created_at).getTime();
    case 'comments':
      return entity.comments + (isPullRequest(entity) ? entity.review_comments : 0);
    case 'title':
      return entity.title.toLowerCase();
    case 'author':
      return entity.user.login.toLowerCase();
    default:
      return 0;
  }
}

export function sortEntities(
  entities: GitHubEntity[],
  sort: SortConfig
): GitHubEntity[] {
  const sorted = [...entities];
  const dir = sort.direction === 'asc' ? 1 : -1;

  sorted.sort((a, b) => {
    const va = getSortValue(a, sort.field);
    const vb = getSortValue(b, sort.field);
    if (va < vb) return -1 * dir;
    if (va > vb) return 1 * dir;
    return 0;
  });

  return sorted;
}

function filterByGroups(
  entities: GitHubEntity[],
  groups: FilterGroup[],
): GitHubEntity[] {
  // Groups are OR'd together: an entity matches if it matches ANY group
  return entities.filter((entity) =>
    groups.some((group) => {
      if (group.filters.length === 0) return true;
      return group.combination === 'and'
        ? group.filters.every((rule) => matchesRule(entity, rule))
        : group.filters.some((rule) => matchesRule(entity, rule));
    })
  );
}

export function getColumnEntities(
  allEntities: GitHubEntity[],
  column: ColumnConfig
): GitHubEntity[] {
  const filtered = filterByGroups(allEntities, column.filterGroups);
  if (column.sortBy) {
    return sortEntities(filtered, column.sortBy);
  }
  return filtered;
}
