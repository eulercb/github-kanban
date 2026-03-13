import { useEffect, useState } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { DataProvider } from './contexts/DataContext';
import { TokenSetup } from './components/Auth/TokenSetup';
import { Header } from './components/Layout/Header';
import { BoardView } from './components/Board/BoardView';
import { useTheme } from './hooks/useTheme';
import { initOctokit, validateToken } from './services/github';
import './styles/global.css';

function AppContent() {
  const { state, setUser, setToken } = useApp();
  const [isValidating, setIsValidating] = useState(true);

  useTheme();

  useEffect(() => {
    const checkToken = async () => {
      if (!state.token) {
        setIsValidating(false);
        return;
      }

      try {
        initOctokit(state.token);
        const user = await validateToken(state.token);
        setUser(user);
      } catch {
        setToken(null);
      } finally {
        setIsValidating(false);
      }
    };

    checkToken();
  }, []);

  if (isValidating) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          color: 'var(--text-secondary)',
          fontSize: 14,
        }}
      >
        Connecting to GitHub...
      </div>
    );
  }

  if (!state.token || !state.currentUser) {
    return <TokenSetup />;
  }

  return (
    <DataProvider>
      <Header />
      <BoardView />
    </DataProvider>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
