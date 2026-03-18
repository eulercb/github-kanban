import { useState } from 'react';
import { validateToken, initOctokit } from '../../services/github';
import { useApp } from '../../hooks/useApp';
import styles from './TokenSetup.module.css';

export function TokenSetup() {
  const { setToken, setUser } = useApp();
  const [tokenInput, setTokenInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = tokenInput.trim();
    if (!trimmed) return;

    setIsValidating(true);
    setError(null);

    try {
      const user = await validateToken(trimmed);
      initOctokit(trimmed);
      setToken(trimmed);
      setUser(user);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Invalid token. Please check and try again.'
      );
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <svg width="48" height="48" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
          </svg>
        </div>
        <h1 className={styles.title}>GitHub Kanban Board</h1>
        <p className={styles.description}>
          Connect your GitHub account to get started. You&apos;ll need a Personal
          Access Token with read access to your repositories.
        </p>

        <div className={styles.instructions}>
          <h3>How to create a token:</h3>
          <ol>
            <li>
              Go to{' '}
              <a
                href="https://github.com/settings/tokens/new"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub Token Settings
              </a>
            </li>
            <li>Give it a descriptive name (e.g., &quot;Kanban Board&quot;)</li>
            <li>
              Select scopes: <code>repo</code> (for private repos) or{' '}
              <code>public_repo</code> (for public repos only)
            </li>
            <li>Click &quot;Generate token&quot; and copy it</li>
          </ol>
          <div className={styles.scopeOption}>
            <strong>Optional:</strong> Add the <code>gist</code> scope to
            enable saving and restoring your board configuration to a GitHub
            Gist. This lets you sync your setup across browsers and devices.
            You can always add this scope later by editing your token.
          </div>
          <p className={styles.note}>
            Tip: For fine-grained tokens, grant &quot;Read&quot; access to Issues and
            Pull Requests.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="token-input" className={styles.label}>
              Personal Access Token
            </label>
            <input
              id="token-input"
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className={styles.input}
              disabled={isValidating}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button
            type="submit"
            className={styles.button}
            disabled={!tokenInput.trim() || isValidating}
          >
            {isValidating ? 'Validating...' : 'Connect to GitHub'}
          </button>
        </form>

        <p className={styles.privacy}>
          Your token is stored locally in your browser and is never sent to any
          third-party server.
        </p>

        <p className={styles.repoLink}>
          <a
            href="https://github.com/eulercb/github-kanban"
            target="_blank"
            rel="noopener noreferrer"
          >
            View this project on GitHub
          </a>
        </p>
      </div>
    </div>
  );
}
