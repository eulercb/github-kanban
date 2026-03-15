import type {
  GitHubEntity,
  FilterRule,
  FilterCombination,
  ColumnConfig,
} from '../types';
import { isPullRequest } from '../types';

function getEntityRepo(entity: GitHubEntity): string {
  // repository_url is like "https://api.github.com/repos/owner/repo"
  const parts = entity.repository_url.split('/');
  return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
}

function getEntityType(entity: GitHubEntity): string {
  return isPullRequest(entity) ? 'pull_request' : 'issue';
}

function getEntityState(entity: GitHubEntity): string {
  if (isPullRequest(entity) && entity.merged_at) {
    return 'merged';
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
    case 'draft':
      if (isPullRequest(entity)) {
        fieldValue = entity.draft ? 'true' : 'false';
      } else {
        fieldValue = 'false';
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

  // Array fields (assignee, label)
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

export function filterEntities(
  entities: GitHubEntity[],
  filters: FilterRule[],
  combination: FilterCombination
): GitHubEntity[] {
  if (filters.length === 0) return entities;

  return entities.filter((entity) => {
    if (combination === 'and') {
      return filters.every((rule) => matchesRule(entity, rule));
    } else {
      return filters.some((rule) => matchesRule(entity, rule));
    }
  });
}

export function getColumnEntities(
  allEntities: GitHubEntity[],
  column: ColumnConfig
): GitHubEntity[] {
  return filterEntities(allEntities, column.filters, column.filterCombination);
}
