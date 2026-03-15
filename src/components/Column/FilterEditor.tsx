import { useState } from 'react';
import type { FilterRule, FilterField, FilterOperator, FilterCombination } from '../../types';
import { generateId } from '../../utils/id';
import styles from './FilterEditor.module.css';

const FIELD_OPTIONS: { value: FilterField; label: string }[] = [
  { value: 'type', label: 'Type' },
  { value: 'state', label: 'State' },
  { value: 'assignee', label: 'Assignee' },
  { value: 'author', label: 'Author' },
  { value: 'label', label: 'Label' },
  { value: 'milestone', label: 'Milestone' },
  { value: 'repo', label: 'Repository' },
  { value: 'org', label: 'Organisation' },
  { value: 'draft', label: 'Draft' },
  { value: 'review_status', label: 'Review Status' },
  { value: 'ci_status', label: 'CI Status' },
  { value: 'has_unresolved_comments', label: 'Unresolved Comments' },
  { value: 'has_unviewed_files', label: 'Unviewed Files' },
  { value: 'title', label: 'Title' },
  { value: 'has_pull_request', label: 'Has PR' },
];

const OPERATOR_OPTIONS: { value: FilterOperator; label: string }[] = [
  { value: 'is', label: 'is' },
  { value: 'is_not', label: 'is not' },
  { value: 'contains', label: 'contains' },
  { value: 'not_contains', label: 'does not contain' },
];

const VALUE_SUGGESTIONS: Partial<Record<FilterField, string[]>> = {
  type: ['issue', 'pull_request'],
  state: ['open', 'closed', 'merged'],
  draft: ['true', 'false'],
  review_status: ['approved', 'changes_requested', 'review_required', 'none'],
  ci_status: ['success', 'failure', 'pending', 'none'],
  has_unresolved_comments: ['true', 'false'],
  has_unviewed_files: ['true', 'false'],
  has_pull_request: ['true', 'false'],
};

interface Props {
  filters: FilterRule[];
  combination: FilterCombination;
  onFiltersChange: (filters: FilterRule[]) => void;
  onCombinationChange: (combination: FilterCombination) => void;
  currentUser?: string;
}

export function FilterEditor({
  filters,
  combination,
  onFiltersChange,
  onCombinationChange,
  currentUser,
}: Props) {
  const addFilter = () => {
    onFiltersChange([
      ...filters,
      {
        id: generateId(),
        field: 'state',
        operator: 'is',
        value: 'open',
      },
    ]);
  };

  const updateFilter = (id: string, updates: Partial<FilterRule>) => {
    onFiltersChange(
      filters.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const removeFilter = (id: string) => {
    onFiltersChange(filters.filter((f) => f.id !== id));
  };

  const getSuggestions = (field: FilterField): string[] => {
    const base = VALUE_SUGGESTIONS[field] ?? [];
    if (
      (field === 'assignee' || field === 'author') &&
      currentUser
    ) {
      return ['me', ...base];
    }
    return base;
  };

  // Display "me" in the UI but store the actual username
  const getDisplayValue = (field: FilterField, value: string): string => {
    if ((field === 'assignee' || field === 'author') && currentUser && value === currentUser) {
      return 'me';
    }
    return value;
  };

  const resolveValue = (field: FilterField, displayVal: string): string => {
    if ((field === 'assignee' || field === 'author') && displayVal === 'me' && currentUser) {
      return currentUser;
    }
    return displayVal;
  };

  return (
    <div className={styles.editor}>
      {filters.length > 1 && (
        <div className={styles.combinationToggle}>
          <span>Match</span>
          <button
            className={`${styles.toggleBtn} ${combination === 'and' ? styles.active : ''}`}
            onClick={() => onCombinationChange('and')}
          >
            All
          </button>
          <button
            className={`${styles.toggleBtn} ${combination === 'or' ? styles.active : ''}`}
            onClick={() => onCombinationChange('or')}
          >
            Any
          </button>
          <span>filters</span>
        </div>
      )}

      <div className={styles.rules}>
        {filters.map((filter) => (
          <div key={filter.id} className={styles.rule}>
            <select
              value={filter.field}
              onChange={(e) =>
                updateFilter(filter.id, { field: e.target.value as FilterField })
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
                updateFilter(filter.id, {
                  operator: e.target.value as FilterOperator,
                })
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
                updateFilter(filter.id, { value: resolveValue(filter.field, displayVal) })
              }
            />

            <button
              className={styles.removeBtn}
              onClick={() => removeFilter(filter.id)}
              title="Remove filter"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <button className={styles.addBtn} onClick={addFilter}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z" />
        </svg>
        Add filter
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
