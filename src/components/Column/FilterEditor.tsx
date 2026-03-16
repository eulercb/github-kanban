import { useState } from 'react';
import type { FilterRule, FilterField, FilterOperator, FilterCombination, FilterGroup } from '../../types';
import { generateId } from '../../utils/id';
import styles from './FilterEditor.module.css';

const FIELD_OPTIONS: { value: FilterField; label: string }[] = [
  { value: 'assignee', label: 'Assignee' },
  { value: 'author', label: 'Author' },
  { value: 'ci_status', label: 'CI Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'has_pull_request', label: 'Has PR' },
  { value: 'label', label: 'Label' },
  { value: 'milestone', label: 'Milestone' },
  { value: 'org', label: 'Organisation' },
  { value: 'repo', label: 'Repository' },
  { value: 'reviewer', label: 'Reviewer' },
  { value: 'review_status', label: 'Review Status' },
  { value: 'state', label: 'State' },
  { value: 'title', label: 'Title' },
  { value: 'type', label: 'Type' },
  { value: 'has_unresolved_comments', label: 'Unresolved Comments' },
  { value: 'has_unviewed_files', label: 'Unviewed Files' },
];

const OPERATOR_OPTIONS: { value: FilterOperator; label: string }[] = [
  { value: 'is', label: 'is' },
  { value: 'is_not', label: 'is not' },
  { value: 'contains', label: 'contains' },
  { value: 'not_contains', label: 'does not contain' },
];

const VALUE_SUGGESTIONS: Partial<Record<FilterField, string[]>> = {
  type: ['issue', 'pull_request'],
  state: ['open', 'closed', 'merged', 'draft'],
  draft: ['true', 'false'],
  review_status: ['approved', 'changes_requested', 'review_required', 'none'],
  ci_status: ['success', 'failure', 'pending', 'none'],
  has_unresolved_comments: ['true', 'false'],
  has_unviewed_files: ['true', 'false'],
  has_pull_request: ['true', 'false'],
};

function createGroup(filters?: FilterRule[], combination?: FilterCombination): FilterGroup {
  return {
    id: generateId(),
    filters: filters ?? [],
    combination: combination ?? 'and',
  };
}

interface Props {
  groups: FilterGroup[];
  onGroupsChange: (groups: FilterGroup[]) => void;
  currentUser?: string;
  repos?: string[];
}

export function FilterEditor({
  groups,
  onGroupsChange,
  currentUser,
  repos,
}: Props) {
  const updateGroup = (groupId: string, updates: Partial<FilterGroup>) => {
    onGroupsChange(
      groups.map((g) => (g.id === groupId ? { ...g, ...updates } : g))
    );
  };

  const removeGroup = (groupId: string) => {
    onGroupsChange(groups.filter((g) => g.id !== groupId));
  };

  const addGroup = () => {
    onGroupsChange([...groups, createGroup()]);
  };

  const addFilterToGroup = (groupId: string) => {
    onGroupsChange(
      groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              filters: [
                ...g.filters,
                { id: generateId(), field: 'state' as FilterField, operator: 'is' as FilterOperator, value: 'open' },
              ],
            }
          : g
      )
    );
  };

  const updateFilterInGroup = (groupId: string, filterId: string, updates: Partial<FilterRule>) => {
    onGroupsChange(
      groups.map((g) =>
        g.id === groupId
          ? { ...g, filters: g.filters.map((f) => (f.id === filterId ? { ...f, ...updates } : f)) }
          : g
      )
    );
  };

  const removeFilterFromGroup = (groupId: string, filterId: string) => {
    onGroupsChange(
      groups.map((g) =>
        g.id === groupId
          ? { ...g, filters: g.filters.filter((f) => f.id !== filterId) }
          : g
      )
    );
  };

  const getSuggestions = (field: FilterField): string[] => {
    if (field === 'repo' && repos && repos.length > 0) {
      return repos;
    }
    const base = VALUE_SUGGESTIONS[field] ?? [];
    if ((field === 'assignee' || field === 'author' || field === 'reviewer') && currentUser) {
      return ['me', ...base];
    }
    return base;
  };

  const getDisplayValue = (field: FilterField, value: string): string => {
    if ((field === 'assignee' || field === 'author' || field === 'reviewer') && currentUser && value === currentUser) {
      return 'me';
    }
    return value;
  };

  const resolveValue = (field: FilterField, displayVal: string): string => {
    if ((field === 'assignee' || field === 'author' || field === 'reviewer') && displayVal === 'me' && currentUser) {
      return currentUser;
    }
    return displayVal;
  };

  return (
    <div className={styles.editor}>
      {groups.map((group, groupIdx) => (
        <div key={group.id}>
          {groupIdx > 0 && (
            <div className={styles.groupSeparator}>
              <span className={styles.groupSeparatorLine} />
              <span className={styles.groupSeparatorLabel}>OR</span>
              <span className={styles.groupSeparatorLine} />
            </div>
          )}
          <div className={groups.length > 1 ? styles.group : styles.groupInner}>
            <div className={styles.groupHeader}>
              {group.filters.length > 1 && (
                <div className={styles.combinationToggle}>
                  <span>Match</span>
                  <button
                    className={`${styles.toggleBtn} ${group.combination === 'and' ? styles.active : ''}`}
                    onClick={() => updateGroup(group.id, { combination: 'and' })}
                  >
                    All
                  </button>
                  <button
                    className={`${styles.toggleBtn} ${group.combination === 'or' ? styles.active : ''}`}
                    onClick={() => updateGroup(group.id, { combination: 'or' })}
                  >
                    Any
                  </button>
                </div>
              )}
              {groups.length > 1 && (
                <button
                  className={styles.removeGroupBtn}
                  onClick={() => removeGroup(group.id)}
                  title="Remove group"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
                  </svg>
                </button>
              )}
            </div>

            <div className={styles.rules}>
              {group.filters.map((filter) => (
                <div key={filter.id} className={styles.rule}>
                  <select
                    value={filter.field}
                    onChange={(e) =>
                      updateFilterInGroup(group.id, filter.id, { field: e.target.value as FilterField })
                    }
                    className={styles.fieldSelect}
                  >
                    {FIELD_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filter.operator}
                    onChange={(e) =>
                      updateFilterInGroup(group.id, filter.id, { operator: e.target.value as FilterOperator })
                    }
                    className={styles.operatorSelect}
                  >
                    {OPERATOR_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  <FilterValueInput
                    field={filter.field}
                    value={getDisplayValue(filter.field, filter.value)}
                    suggestions={getSuggestions(filter.field)}
                    onChange={(displayVal) =>
                      updateFilterInGroup(group.id, filter.id, { value: resolveValue(filter.field, displayVal) })
                    }
                  />

                  <button
                    className={styles.removeBtn}
                    onClick={() => removeFilterFromGroup(group.id, filter.id)}
                    title="Remove filter"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <button className={styles.addBtn} onClick={() => addFilterToGroup(group.id)}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z" />
              </svg>
              Add filter
            </button>
          </div>
        </div>
      ))}

      <button className={styles.addGroupBtn} onClick={addGroup}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z" />
        </svg>
        Add OR group
      </button>
    </div>
  );
}

function FilterValueInput({
  value,
  suggestions,
  onChange,
}: {
  field: FilterField;
  value: string;
  suggestions: string[];
  onChange: (value: string) => void;
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  if (suggestions.length > 0 && suggestions.length <= 6) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={styles.valueSelect}
      >
        <option value="">Select...</option>
        {suggestions.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className={styles.inputWrapper}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        placeholder="Value..."
        className={styles.input}
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className={styles.suggestions}>
          {suggestions
            .filter((s) => s.toLowerCase().includes(value.toLowerCase()))
            .map((s) => (
              <button
                key={s}
                className={styles.suggestion}
                onMouseDown={() => onChange(s)}
              >
                {s}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
