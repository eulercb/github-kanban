import type { AppState, AppSettings, BoardConfig } from '../types';
import { DEFAULT_CARD_DISPLAY } from '../types';

const STORAGE_KEY = 'github-kanban';
const TOKEN_KEY = 'github-kanban-token';
const GIST_SYNC_HASH_KEY = 'github-kanban-gist-sync-hash';

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  autoRefreshEnabled: true,
  autoRefreshInterval: 5,
  refreshOnFocus: true,
  compactCards: false,
  cardDisplay: { ...DEFAULT_CARD_DISPLAY },
  showLoadingBar: true,
  animationsEnabled: true,
};

const DEFAULT_STATE: AppState = {
  token: null,
  currentUser: null,
  boards: [],
  activeBoardId: null,
  settings: DEFAULT_SETTINGS,
  gistId: null,
};

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const token = localStorage.getItem(TOKEN_KEY);
    if (!raw) {
      return { ...DEFAULT_STATE, token };
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STATE,
      ...parsed,
      settings: {
        ...DEFAULT_SETTINGS,
        ...parsed.settings,
        cardDisplay: { ...DEFAULT_CARD_DISPLAY, ...parsed.settings?.cardDisplay },
      },
      token,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveState(state: AppState): void {
  const { token, ...rest } = state;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function saveBoards(boards: BoardConfig[]): void {
  const state = loadState();
  state.boards = boards;
  saveState(state);
}

export function saveSettings(settings: AppSettings): void {
  const state = loadState();
  state.settings = settings;
  saveState(state);
}

export function saveToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function computeConfigHash(boards: BoardConfig[], settings: AppSettings): string {
  return JSON.stringify({ boards, settings });
}

export function getGistSyncHash(): string | null {
  return localStorage.getItem(GIST_SYNC_HASH_KEY);
}

export function setGistSyncHash(hash: string): void {
  localStorage.setItem(GIST_SYNC_HASH_KEY, hash);
}

export function clearGistSyncHash(): void {
  localStorage.removeItem(GIST_SYNC_HASH_KEY);
}

export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(GIST_SYNC_HASH_KEY);
  clearEntityCache();
}

// Session cache for API data — survives page refresh but not tab close
const ENTITY_CACHE_PREFIX = 'github-kanban-entities:';
const ENTITY_CACHE_TIME_PREFIX = 'github-kanban-entities-time:';

export function saveEntityCache(boardId: string, entities: unknown[]): void {
  try {
    sessionStorage.setItem(ENTITY_CACHE_PREFIX + boardId, JSON.stringify(entities));
    sessionStorage.setItem(ENTITY_CACHE_TIME_PREFIX + boardId, new Date().toISOString());
  } catch {
    // sessionStorage may be full — silently ignore
  }
}

export function loadEntityCache(boardId: string): { entities: unknown[]; cachedAt: Date } | null {
  try {
    const raw = sessionStorage.getItem(ENTITY_CACHE_PREFIX + boardId);
    const time = sessionStorage.getItem(ENTITY_CACHE_TIME_PREFIX + boardId);
    if (!raw || !time) return null;
    return { entities: JSON.parse(raw), cachedAt: new Date(time) };
  } catch {
    return null;
  }
}

export function clearEntityCacheFor(boardId: string): void {
  sessionStorage.removeItem(ENTITY_CACHE_PREFIX + boardId);
  sessionStorage.removeItem(ENTITY_CACHE_TIME_PREFIX + boardId);
}

export function clearEntityCache(): void {
  const keys: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key?.startsWith(ENTITY_CACHE_PREFIX) || key?.startsWith(ENTITY_CACHE_TIME_PREFIX)) {
      keys.push(key);
    }
  }
  keys.forEach(k => sessionStorage.removeItem(k));
}
