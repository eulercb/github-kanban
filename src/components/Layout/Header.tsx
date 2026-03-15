import { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useData } from '../../contexts/DataContext';
import { Settings } from '../Settings/Settings';
import { LogoutDialog } from './LogoutDialog';
import styles from './Header.module.css';

export function Header() {
  const { state } = useApp();
  const { isLoading, lastRefresh, refresh } = useData();
  const [showSettings, setShowSettings] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const formatLastRefresh = () => {
    if (!lastRefresh) return null;
    const diff = Math.floor((Date.now() - lastRefresh.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <>
      <header className={styles.header}>
        <div className={styles.left}>
          <div className={styles.logo}>
            <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
            </svg>
            <span className={styles.appName}>Kanban</span>
          </div>

        </div>

        <div className={styles.right}>
          {lastRefresh && (
            <span className={styles.lastRefresh}>
              Updated {formatLastRefresh()}
            </span>
          )}

          <button
            className={styles.iconButton}
            onClick={() => refresh()}
            disabled={isLoading}
            title="Refresh data"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="currentColor"
              className={isLoading ? styles.spinning : ''}
            >
              <path d="M8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.001 7.001 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.501 5.501 0 0 0 8 2.5ZM1.705 8.005a.75.75 0 0 1 .834.656 5.501 5.501 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.001 7.001 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834Z" />
            </svg>
          </button>

          {state.currentUser && (
            <div className={styles.userMenu}>
              <button
                className={styles.avatar}
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <img
                  src={state.currentUser.avatar_url}
                  alt={state.currentUser.login}
                  width={28}
                  height={28}
                />
              </button>
              {showUserMenu && (
                <>
                  <div
                    className={styles.menuBackdrop}
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className={styles.menu}>
                    <div className={styles.menuHeader}>
                      Signed in as <strong>{state.currentUser.login}</strong>
                    </div>
                    <button
                      className={styles.menuItem}
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowSettings(true);
                      }}
                    >
                      Settings
                    </button>
                    <div className={styles.menuDivider} />
                    <button
                      className={styles.menuItem}
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowLogoutDialog(true);
                      }}
                    >
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
      {showLogoutDialog && <LogoutDialog onClose={() => setShowLogoutDialog(false)} />}
    </>
  );
}
