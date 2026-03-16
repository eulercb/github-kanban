import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import type { GitHubEntity, FilterField } from '../types';
import { fetchAllRepoData, saveConfigToGist } from '../services/github';
import { useApp } from './AppContext';
import {
  computeConfigHash,
  getGistSyncHash,
  setGistSyncHash,
} from '../utils/storage';

interface DataContextValue {
  entities: GitHubEntity[];
  isLoading: boolean;
  progress: number; // 0 to 1
  lastRefresh: Date | null;
  error: string | null;
  refresh: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { state } = useApp();
  const [entities, setEntities] = useState<GitHubEntity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRefreshingRef = useRef(false);
  const hasLoadedRef = useRef(false);

  const activeBoard = state.boards.find((b) => b.id === state.activeBoardId);
  const repos = activeBoard?.repos ?? [];
  const reposKey = repos.join(',');
  const isSyncingGistRef = useRef(false);

  // Determine if GraphQL enrichment is needed based on current settings and filters
  const ENRICHED_FIELDS: FilterField[] = [
    'review_status', 'ci_status', 'has_unresolved_comments', 'has_unviewed_files',
  ];
  const filtersNeedEnrichment = activeBoard?.columns.some((col) => {
    if (col.filterGroups && col.filterGroups.length > 0) {
      return col.filterGroups.some((g) =>
        g.filters.some((f) => ENRICHED_FIELDS.includes(f.field))
      );
    }
    return col.filters.some((f) => ENRICHED_FIELDS.includes(f.field));
  }) ?? false;
  const displayNeedsEnrichment =
    !state.settings.compactCards && state.settings.cardDisplay.showPrStatus;
  const needsEnrichment = filtersNeedEnrichment || displayNeedsEnrichment;

  const syncGistIfNeeded = useCallback(() => {
    if (!state.gistId || isSyncingGistRef.current) return;

    const currentHash = computeConfigHash(state.boards, state.settings);
    const lastHash = getGistSyncHash();
    if (currentHash === lastHash) return;

    isSyncingGistRef.current = true;
    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      boards: state.boards,
      settings: state.settings,
    };

    saveConfigToGist(exportData, state.gistId)
      .then(() => {
        setGistSyncHash(currentHash);
      })
      .catch(() => {
        // Silent failure — will retry on next refresh cycle
      })
      .finally(() => {
        isSyncingGistRef.current = false;
      });
  }, [state.gistId, state.boards, state.settings]);

  const flattenAndSort = useCallback((repoData: Map<string, { issues: GitHubEntity[]; pullRequests: GitHubEntity[] }>) => {
    const all: GitHubEntity[] = [];
    for (const [, data] of repoData) {
      all.push(...data.issues, ...data.pullRequests);
    }
    all.sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
    return all;
  }, []);

  const refresh = useCallback(async () => {
    if (!state.token || repos.length === 0 || isRefreshingRef.current) return;

    isRefreshingRef.current = true;
    const isInitialLoad = !hasLoadedRef.current;
    setIsLoading(true);
    setProgress(0);
    setError(null);

    try {
      const repoData = await fetchAllRepoData(
        repos,
        isInitialLoad
          ? (partial) => { setEntities(flattenAndSort(partial)); }
          : undefined,
        (completed, total) => {
          setProgress(total > 0 ? completed / total : 0);
        },
        !needsEnrichment,
      );

      setEntities(flattenAndSort(repoData));
      setLastRefresh(new Date());
      hasLoadedRef.current = true;
      syncGistIfNeeded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
      isRefreshingRef.current = false;
    }
  }, [state.token, reposKey, needsEnrichment, syncGistIfNeeded, flattenAndSort]);

  // Initial fetch when repos change
  useEffect(() => {
    if (state.token && repos.length > 0) {
      hasLoadedRef.current = false;
      refresh();
    } else {
      setEntities([]);
      hasLoadedRef.current = false;
    }
  }, [state.token, reposKey]);

  // Auto-refresh timer
  useEffect(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    if (
      state.settings.autoRefreshEnabled &&
      state.token &&
      repos.length > 0
    ) {
      const intervalMs = state.settings.autoRefreshInterval * 60 * 1000;
      refreshTimerRef.current = setInterval(() => {
        if (!document.hidden) {
          refresh();
        }
      }, intervalMs);
    }

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [
    state.settings.autoRefreshEnabled,
    state.settings.autoRefreshInterval,
    state.token,
    reposKey,
    refresh,
  ]);

  // Refresh on focus
  useEffect(() => {
    if (!state.settings.refreshOnFocus || !state.token || repos.length === 0) {
      return;
    }

    const handleVisibility = () => {
      if (!document.hidden && lastRefresh) {
        const thresholdMs = state.settings.autoRefreshInterval * 60 * 1000;
        const elapsed = Date.now() - lastRefresh.getTime();
        if (elapsed > thresholdMs) {
          refresh();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [state.settings.refreshOnFocus, state.settings.autoRefreshInterval, state.token, reposKey, lastRefresh, refresh]);

  return (
    <DataContext.Provider
      value={{ entities, isLoading, progress, lastRefresh, error, refresh }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
