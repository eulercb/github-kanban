import { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useData } from '../../contexts/DataContext';
import { Settings } from '../Settings/Settings';
import styles from './Header.module.css';

export function Header() {
  const { state, logout } = useApp();
  const { isLoading, lastRefresh, refresh } = useData();
  const [showSettings, setShowSettings] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

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

          <button
            className={styles.iconButton}
            onClick={() => setShowSettings(true)}
            title="Settings"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294a6.57 6.57 0 0 1 0 .772c-.01.147.04.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.034 7.034 0 0 1-.704 1.218c-.428.609-1.176.806-1.82.63l-1.103-.303c-.066-.019-.176-.011-.299.071a5.56 5.56 0 0 1-.668.386c-.133.066-.194.158-.212.224l-.288 1.107c-.17.645-.716 1.195-1.459 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.065-1.289-.615-1.459-1.26l-.288-1.107a.352.352 0 0 0-.212-.224 5.56 5.56 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a6.993 6.993 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.049-.048.098-.147.088-.294a6.57 6.57 0 0 1 0-.772c.01-.147-.04-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.03 7.03 0 0 1 .704-1.218c.428-.609 1.176-.806 1.82-.63l1.103.303c.066.019.176.011.299-.071.214-.143.437-.272.668-.386a.352.352 0 0 0 .212-.224l.288-1.107C5.962.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.046-.219.31-.41.641-.573.989-.014.031-.022.11.059.19l.815.806c.411.406.562.957.53 1.456a4.587 4.587 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.348.354.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.16.107.327.204.5.29.449.222.851.628.998 1.189l.289 1.105c.029.11.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.03.175-.016.195-.046.219-.31.41-.641.573-.989.014-.031.022-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.587 4.587 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.13 6.13 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.5-.29c-.449-.222-.851-.628-.998-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001-.001A1.5 1.5 0 0 0 9.5 8Z" />
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
                        logout();
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
    </>
  );
}
