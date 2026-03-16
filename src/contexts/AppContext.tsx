import {
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type {
  AppState,
  AppSettings,
  BoardConfig,
  GitHubUser,
} from '../types';
import { loadState, saveState, saveToken, DEFAULT_SETTINGS } from '../utils/storage';
import { AppContext } from './appContextDef';
import type { AppAction } from './appContextDef';

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_TOKEN':
      return { ...state, token: action.token };
    case 'SET_USER':
      return { ...state, currentUser: action.user };
    case 'SET_BOARDS':
      return { ...state, boards: action.boards };
    case 'ADD_BOARD':
      return { ...state, boards: [...state.boards, action.board] };
    case 'UPDATE_BOARD':
      return {
        ...state,
        boards: state.boards.map((b) =>
          b.id === action.board.id ? action.board : b
        ),
      };
    case 'DELETE_BOARD': {
      const newBoards = state.boards.filter((b) => b.id !== action.boardId);
      return {
        ...state,
        boards: newBoards,
        activeBoardId:
          state.activeBoardId === action.boardId
            ? newBoards[0]?.id ?? null
            : state.activeBoardId,
      };
    }
    case 'SET_ACTIVE_BOARD':
      return { ...state, activeBoardId: action.boardId };
    case 'SET_SETTINGS':
      return { ...state, settings: action.settings };
    case 'SET_GIST_ID':
      return { ...state, gistId: action.gistId };
    case 'SET_THEME':
      return { ...state, settings: { ...state.settings, theme: action.theme } };
    case 'LOAD_STATE':
      return action.state;
    case 'LOGOUT':
      return {
        token: null,
        currentUser: null,
        boards: [],
        activeBoardId: null,
        settings: DEFAULT_SETTINGS,
        gistId: null,
      };
    default:
      return state;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, loadState());

  // Persist state changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  const setToken = useCallback((token: string | null) => {
    saveToken(token);
    dispatch({ type: 'SET_TOKEN', token });
  }, []);

  const setUser = useCallback((user: GitHubUser | null) => {
    dispatch({ type: 'SET_USER', user });
  }, []);

  const addBoard = useCallback((board: BoardConfig) => {
    dispatch({ type: 'ADD_BOARD', board });
  }, []);

  const updateBoard = useCallback((board: BoardConfig) => {
    dispatch({ type: 'UPDATE_BOARD', board });
  }, []);

  const deleteBoard = useCallback((boardId: string) => {
    dispatch({ type: 'DELETE_BOARD', boardId });
  }, []);

  const setActiveBoard = useCallback((boardId: string | null) => {
    dispatch({ type: 'SET_ACTIVE_BOARD', boardId });
  }, []);

  const updateSettings = useCallback((settings: AppSettings) => {
    dispatch({ type: 'SET_SETTINGS', settings });
  }, []);

  const setGistId = useCallback((gistId: string | null) => {
    dispatch({ type: 'SET_GIST_ID', gistId });
  }, []);

  const logout = useCallback(() => {
    saveToken(null);
    dispatch({ type: 'LOGOUT' });
  }, []);

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        setToken,
        setUser,
        addBoard,
        updateBoard,
        deleteBoard,
        setActiveBoard,
        updateSettings,
        setGistId,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
