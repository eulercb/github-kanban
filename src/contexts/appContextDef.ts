import { createContext } from 'react';
import type {
  AppState,
  AppSettings,
  BoardConfig,
  GitHubUser,
  ThemeMode,
} from '../types';

type AppAction =
  | { type: 'SET_TOKEN'; token: string | null }
  | { type: 'SET_USER'; user: GitHubUser | null }
  | { type: 'SET_BOARDS'; boards: BoardConfig[] }
  | { type: 'ADD_BOARD'; board: BoardConfig }
  | { type: 'UPDATE_BOARD'; board: BoardConfig }
  | { type: 'DELETE_BOARD'; boardId: string }
  | { type: 'SET_ACTIVE_BOARD'; boardId: string | null }
  | { type: 'SET_SETTINGS'; settings: AppSettings }
  | { type: 'SET_THEME'; theme: ThemeMode }
  | { type: 'SET_GIST_ID'; gistId: string | null }
  | { type: 'LOAD_STATE'; state: AppState }
  | { type: 'LOGOUT' };

export type { AppAction };

export interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  setToken: (token: string | null) => void;
  setUser: (user: GitHubUser | null) => void;
  addBoard: (board: BoardConfig) => void;
  updateBoard: (board: BoardConfig) => void;
  deleteBoard: (boardId: string) => void;
  setActiveBoard: (boardId: string | null) => void;
  updateSettings: (settings: AppSettings) => void;
  setGistId: (gistId: string | null) => void;
  logout: () => void;
}

export const AppContext = createContext<AppContextValue | null>(null);
