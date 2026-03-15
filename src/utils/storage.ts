import type { AppState, AppSettings, BoardConfig } from '../types';

const STORAGE_KEY = 'github-kanban';
const TOKEN_KEY = 'github-kanban-token';

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  autoRefreshEnabled: true,
  autoRefreshInterval: 5,
  refreshOnFocus: true,
  compactCards: false,
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
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
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

export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(TOKEN_KEY);
}
