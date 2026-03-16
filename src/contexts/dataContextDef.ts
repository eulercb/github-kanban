import { createContext } from 'react';
import type { GitHubEntity } from '../types';

export interface DataContextValue {
  entities: GitHubEntity[];
  isLoading: boolean;
  progress: number;
  lastRefresh: Date | null;
  error: string | null;
  refresh: () => Promise<void>;
}

export const DataContext = createContext<DataContextValue | null>(null);
