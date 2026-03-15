import { useState, useEffect, useRef } from 'react';
import type { BoardConfig, ColumnConfig } from '../../types';
import { generateId } from '../../utils/id';
import { searchRepos } from '../../services/github';
import { useApp } from '../../contexts/AppContext';
import { useDebounce } from '../../hooks/useDebounce';
import styles from './BoardSetup.module.css';

interface Props {
  onSave: (board: BoardConfig) => void;
  onCancel?: () => void;
  initialBoard?: BoardConfig;
}

const PRESET_COLUMNS: { name: string; columns: Omit<ColumnConfig, 'id'>[] }[] = [
  {
    name: 'My Issues',
    columns: [
      {
        title: 'Assigned to me',
        filters: [
          { id: '', field: 'type', operator: 'is', value: 'issue' },
          { id: '', field: 'state', operator: 'is', value: 'open' },
          { id: '', field: 'assignee', operator: 'is', value: '{{user}}' },
        ],
        filterCombination: 'and',
        collapsed: false,
        width: 340,
      },
      {
        title: 'My Open Issues',
        filters: [
          { id: '', field: 'type', operator: 'is', value: 'issue' },
          { id: '', field: 'state', operator: 'is', value: 'open' },
          { id: '', field: 'author', operator: 'is', value: '{{user}}' },
        ],
        filterCombination: 'and',
        collapsed: false,
        width: 340,
      },
      {
        title: 'Issues with PRs',
        filters: [
          { id: '', field: 'type', operator: 'is', value: 'issue' },
          { id: '', field: 'state', operator: 'is', value: 'open' },
          { id: '', field: 'has_pull_request', operator: 'is', value: 'true' },
        ],
        filterCombination: 'and',
        collapsed: false,
        width: 340,
      },
    ],
  },
  {
    name: 'PR Review',
    columns: [
      {
        title: 'My PRs',
        filters: [
          { id: '', field: 'type', operator: 'is', value: 'pull_request' },
          { id: '', field: 'state', operator: 'is', value: 'open' },
          { id: '', field: 'author', operator: 'is', value: '{{user}}' },
        ],
        filterCombination: 'and',
        collapsed: false,
        width: 340,
      },
      {
        title: 'Needs Review',
        filters: [
          { id: '', field: 'type', operator: 'is', value: 'pull_request' },
          { id: '', field: 'state', operator: 'is', value: 'open' },
          { id: '', field: 'review_status', operator: 'is', value: 'pending' },
        ],
        filterCombination: 'and',
        collapsed: false,
        width: 340,
      },
      {
        title: 'Draft PRs',
        filters: [
          { id: '', field: 'type', operator: 'is', value: 'pull_request' },
          { id: '', field: 'draft', operator: 'is', value: 'true' },
          { id: '', field: 'state', operator: 'is', value: 'open' },
        ],
        filterCombination: 'and',
        collapsed: false,
        width: 340,
      },
    ],
  },
  {
    name: 'Empty Board',
    columns: [],
  },
];

export function BoardSetup({ onSave, onCancel, initialBoard }: Props) {
  const { state } = useApp();
  const [name, setName] = useState(initialBoard?.name ?? '');
  const [repos, setRepos] = useState<string[]>(initialBoard?.repos ?? []);
  const [repoInput, setRepoInput] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<number>(0);
  const [scopeToUser, setScopeToUser] = useState(true);
  const isEditing = !!initialBoard;

  const debouncedQuery = useDebounce(repoInput, 350);
  const searchAbortRef = useRef<AbortController | null>(null);

  // Run search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    // Cancel any in-flight search
    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;

    setSearching(true);
    const scopeLogin = scopeToUser ? state.currentUser?.login : undefined;

    searchRepos(debouncedQuery, scopeLogin)
      .then((results) => {
        if (!controller.signal.aborted) {
          setSearchResults(results.filter((r) => !repos.includes(r)));
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setSearchResults([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setSearching(false);
        }
      });

    return () => controller.abort();
  }, [debouncedQuery, scopeToUser, state.currentUser?.login, repos]);

  const addRepo = (repo: string) => {
    if (!repos.includes(repo)) {
      setRepos([...repos, repo]);
    }
    setRepoInput('');
    setSearchResults([]);
  };

  const removeRepo = (repo: string) => {
    setRepos(repos.filter((r) => r !== repo));
  };

  const handleAddManual = () => {
    const trimmed = repoInput.trim();
    if (trimmed && trimmed.includes('/') && !repos.includes(trimmed)) {
      setRepos([...repos, trimmed]);
      setRepoInput('');
      setSearchResults([]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || repos.length === 0) return;

    let columns: ColumnConfig[];
    if (isEditing) {
      // Preserve existing columns when editing
      columns = initialBoard.columns;
    } else {
      const preset = PRESET_COLUMNS[selectedPreset];
      columns = (preset?.columns ?? []).map((col) => ({
        ...col,
        id: generateId(),
        filters: col.filters.map((f) => ({ ...f, id: generateId() })),
      }));
    }

    onSave({
      id: initialBoard?.id ?? generateId(),
      name: name.trim(),
      columns,
      repos,
    });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2 className={styles.title}>
        {initialBoard ? 'Edit Board' : 'Create a New Board'}
      </h2>

      <div className={styles.field}>
        <label className={styles.label}>Board Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., My Project Board"
          className={styles.input}
          autoFocus
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Repositories</label>
        <div className={styles.repoInput}>
          <input
            type="text"
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddManual();
              }
            }}
            placeholder="Search repos or type owner/repo..."
            className={styles.input}
          />
          {searching && <span className={styles.spinner}>Searching...</span>}
        </div>

        {scopeToUser && state.currentUser && (
          <div className={styles.scopeFilter}>
            <span>Showing repos from your account &amp; orgs</span>
            <button
              type="button"
              className={styles.scopeDismiss}
              onClick={() => setScopeToUser(false)}
              title="Search all of GitHub"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
              </svg>
            </button>
          </div>
        )}

        {!scopeToUser && state.currentUser && (
          <button
            type="button"
            className={styles.scopeRestore}
            onClick={() => setScopeToUser(true)}
          >
            Show only your repos
          </button>
        )}

        {searchResults.length > 0 && (
          <div className={styles.searchResults}>
            {searchResults.map((repo) => (
              <button
                key={repo}
                type="button"
                className={styles.searchResult}
                onClick={() => addRepo(repo)}
              >
                {repo}
              </button>
            ))}
          </div>
        )}

        {repos.length > 0 && (
          <div className={styles.repoList}>
            {repos.map((repo) => (
              <div key={repo} className={styles.repoTag}>
                <span>{repo}</span>
                <button
                  type="button"
                  onClick={() => removeRepo(repo)}
                  className={styles.removeRepo}
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {!isEditing && (
        <div className={styles.field}>
          <label className={styles.label}>Column Template</label>
          <div className={styles.presets}>
            {PRESET_COLUMNS.map((preset, i) => (
              <button
                key={preset.name}
                type="button"
                className={`${styles.preset} ${i === selectedPreset ? styles.presetActive : ''}`}
                onClick={() => setSelectedPreset(i)}
              >
                <strong>{preset.name}</strong>
                <span>
                  {preset.columns.length === 0
                    ? 'Start empty'
                    : `${preset.columns.length} columns`}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={styles.actions}>
        {onCancel && (
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={!name.trim() || repos.length === 0}
        >
          {initialBoard ? 'Save Changes' : 'Create Board'}
        </button>
      </div>
    </form>
  );
}
