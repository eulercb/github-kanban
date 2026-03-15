import { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { exportSettings } from '../../utils/export';
import { computeConfigHash, setGistSyncHash } from '../../utils/storage';
import {
  validateToken,
  initOctokit,
  checkGistScope,
  saveConfigToGist,
  findConfigGist,
  loadConfigFromGist,
} from '../../services/github';
import type { AppSettings, ExportData, ThemeMode, BoardConfig } from '../../types';
import styles from './Settings.module.css';

interface Props {
  onClose: () => void;
}

type Tab = 'general' | 'boards' | 'data';

export function Settings({ onClose }: Props) {
  const { state, updateSettings, updateBoard, deleteBoard, setToken, setUser, setGistId } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [settings, setSettings] = useState<AppSettings>({ ...state.settings });
  const [editingBoard, setEditingBoard] = useState<string | null>(null);
  const [editBoardName, setEditBoardName] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [pasteJson, setPasteJson] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [newToken, setNewToken] = useState('');
  const [tokenValidating, setTokenValidating] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [tokenSuccess, setTokenSuccess] = useState(false);
  const [hasGistScope, setHasGistScope] = useState<boolean | null>(null);
  const [gistLoading, setGistLoading] = useState(false);
  const [gistMessage, setGistMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    checkGistScope().then(setHasGistScope);
  }, []);

  const handleExportToGist = async () => {
    setGistLoading(true);
    setGistMessage(null);
    try {
      const data: ExportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        boards: state.boards,
        settings: state.settings,
      };
      const id = await saveConfigToGist(data, state.gistId);
      setGistId(id);
      setGistSyncHash(computeConfigHash(state.boards, state.settings));
      setGistMessage({ type: 'success', text: 'Configuration saved to Gist.' });
    } catch (err) {
      setGistMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to save to Gist',
      });
    } finally {
      setGistLoading(false);
    }
  };

  const handleImportFromGist = async () => {
    setGistLoading(true);
    setGistMessage(null);
    try {
      let data: ExportData;
      if (state.gistId) {
        data = await loadConfigFromGist(state.gistId);
      } else {
        const found = await findConfigGist();
        if (!found) {
          setGistMessage({ type: 'error', text: 'No configuration Gist found for your account.' });
          return;
        }
        setGistId(found.id);
        data = found.data;
      }
      if (!data.version || !Array.isArray(data.boards)) {
        throw new Error('Invalid configuration format in Gist');
      }
      for (const board of data.boards) {
        updateBoard(board);
      }
      if (data.settings) {
        updateSettings(data.settings);
        setSettings(data.settings);
      }
      const restoredBoards = data.boards.length > 0 ? data.boards : state.boards;
      const restoredSettings = data.settings ?? state.settings;
      setGistSyncHash(computeConfigHash(restoredBoards, restoredSettings));
      setGistMessage({ type: 'success', text: `Restored ${data.boards.length} board(s) from Gist.` });
    } catch (err) {
      setGistMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to restore from Gist',
      });
    } finally {
      setGistLoading(false);
    }
  };

  const handleReplaceToken = async () => {
    const trimmed = newToken.trim();
    if (!trimmed) return;

    setTokenValidating(true);
    setTokenError(null);
    setTokenSuccess(false);

    try {
      const user = await validateToken(trimmed);
      initOctokit(trimmed);
      setToken(trimmed);
      setUser(user);
      setTokenSuccess(true);
      setNewToken('');
      setShowTokenInput(false);
    } catch (err) {
      setTokenError(
        err instanceof Error
          ? err.message
          : 'Invalid token. Please check and try again.'
      );
    } finally {
      setTokenValidating(false);
    }
  };

  const handleSave = () => {
    updateSettings(settings);
    onClose();
  };

  const handleExport = () => {
    exportSettings(state);
  };

  const applyImportData = (raw: string) => {
    const data = JSON.parse(raw) as ExportData;
    if (!data.version || !Array.isArray(data.boards)) {
      throw new Error('Invalid configuration format');
    }
    for (const board of data.boards) {
      updateBoard(board);
    }
    if (data.settings) {
      updateSettings(data.settings);
      setSettings(data.settings);
    }
    return data.boards.length;
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const count = applyImportData(ev.target?.result as string);
        setImportSuccess(`Imported ${count} board(s) successfully.`);
      } catch (err) {
        setImportError(
          err instanceof Error ? err.message : 'Failed to import data'
        );
      }
    };
    reader.readAsText(file);
  };

  const handlePasteImport = () => {
    setImportError(null);
    setImportSuccess(null);
    try {
      const count = applyImportData(pasteJson);
      setImportSuccess(`Imported ${count} board(s) successfully.`);
      setPasteJson('');
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : 'Failed to parse JSON'
      );
    }
  };

  const startEditBoard = (board: BoardConfig) => {
    setEditingBoard(board.id);
    setEditBoardName(board.name);
  };

  const saveEditBoard = (board: BoardConfig) => {
    if (editBoardName.trim()) {
      updateBoard({ ...board, name: editBoardName.trim() });
    }
    setEditingBoard(null);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Settings</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
            </svg>
          </button>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'general' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'boards' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('boards')}
          >
            Boards
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'data' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('data')}
          >
            Import / Export
          </button>
        </div>

        <div className={styles.body}>
          {activeTab === 'general' && (
            <div className={styles.section}>
              <div className={styles.field}>
                <label className={styles.label}>Theme</label>
                <select
                  value={settings.theme}
                  onChange={(e) =>
                    setSettings({ ...settings, theme: e.target.value as ThemeMode })
                  }
                  className={styles.select}
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Auto-refresh</label>
                <div className={styles.toggleRow}>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={settings.autoRefreshEnabled}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          autoRefreshEnabled: e.target.checked,
                        })
                      }
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                  <span className={styles.toggleLabel}>
                    {settings.autoRefreshEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>

              {settings.autoRefreshEnabled && (
                <div className={styles.field}>
                  <label className={styles.label}>
                    Refresh interval (minutes)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={settings.autoRefreshInterval}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        autoRefreshInterval: Math.max(
                          1,
                          parseInt(e.target.value) || 5
                        ),
                      })
                    }
                    className={styles.input}
                    style={{ width: 80 }}
                  />
                </div>
              )}

              <div className={styles.field}>
                <label className={styles.label}>Refresh on window focus</label>
                <div className={styles.toggleRow}>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={settings.refreshOnFocus}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          refreshOnFocus: e.target.checked,
                        })
                      }
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                  <span className={styles.toggleLabel}>
                    {settings.refreshOnFocus ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Compact cards</label>
                <div className={styles.toggleRow}>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={settings.compactCards}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          compactCards: e.target.checked,
                        })
                      }
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                  <span className={styles.toggleLabel}>
                    {settings.compactCards
                      ? 'Show minimal card info'
                      : 'Show full card details'}
                  </span>
                </div>
              </div>

              <div className={styles.divider} />

              <div className={styles.field}>
                <label className={styles.label}>Personal Access Token</label>
                <p className={styles.hint}>
                  Replace your GitHub token if it has expired or you want to
                  switch accounts.
                </p>
                {tokenSuccess && (
                  <div className={styles.success}>Token updated successfully.</div>
                )}
                {!showTokenInput ? (
                  <div className={styles.tokenRow}>
                    <code className={styles.tokenMask}>
                      {'•'.repeat(8)}...{'•'.repeat(4)}
                    </code>
                    <button
                      className={styles.actionBtn}
                      onClick={() => {
                        setShowTokenInput(true);
                        setTokenSuccess(false);
                      }}
                    >
                      Replace Token
                    </button>
                  </div>
                ) : (
                  <div className={styles.tokenForm}>
                    <input
                      type="password"
                      value={newToken}
                      onChange={(e) => setNewToken(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleReplaceToken();
                        if (e.key === 'Escape') {
                          setShowTokenInput(false);
                          setNewToken('');
                          setTokenError(null);
                        }
                      }}
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      className={styles.input}
                      autoFocus
                      disabled={tokenValidating}
                    />
                    {tokenError && (
                      <div className={styles.error}>{tokenError}</div>
                    )}
                    <div className={styles.tokenActions}>
                      <button
                        className={styles.cancelBtn}
                        onClick={() => {
                          setShowTokenInput(false);
                          setNewToken('');
                          setTokenError(null);
                        }}
                        disabled={tokenValidating}
                      >
                        Cancel
                      </button>
                      <button
                        className={styles.saveBtn}
                        onClick={handleReplaceToken}
                        disabled={!newToken.trim() || tokenValidating}
                      >
                        {tokenValidating ? 'Validating...' : 'Update Token'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'boards' && (
            <div className={styles.section}>
              {state.boards.length === 0 ? (
                <p className={styles.emptyMsg}>No boards created yet.</p>
              ) : (
                <div className={styles.boardList}>
                  {state.boards.map((board) => (
                    <div key={board.id} className={styles.boardItem}>
                      {editingBoard === board.id ? (
                        <input
                          autoFocus
                          value={editBoardName}
                          onChange={(e) => setEditBoardName(e.target.value)}
                          onBlur={() => saveEditBoard(board)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEditBoard(board);
                            if (e.key === 'Escape') setEditingBoard(null);
                          }}
                          className={styles.input}
                        />
                      ) : (
                        <div className={styles.boardInfo}>
                          <strong>{board.name}</strong>
                          <span>
                            {board.repos.length} repo(s), {board.columns.length}{' '}
                            column(s)
                          </span>
                        </div>
                      )}
                      <div className={styles.boardActions}>
                        <button
                          className={styles.boardActionBtn}
                          onClick={() => startEditBoard(board)}
                        >
                          Rename
                        </button>
                        <button
                          className={`${styles.boardActionBtn} ${styles.danger}`}
                          onClick={() => {
                            if (confirm(`Delete board "${board.name}"?`)) {
                              deleteBoard(board.id);
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'data' && (
            <div className={styles.section}>
              <div className={styles.field}>
                <label className={styles.label}>Export Configuration</label>
                <p className={styles.hint}>
                  Export all boards and settings to a JSON file. You can import
                  this file on another device.
                </p>
                <button className={styles.actionBtn} onClick={handleExport}>
                  Export to File
                </button>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Import Configuration</label>
                <p className={styles.hint}>
                  Import boards and settings from a previously exported file.
                  Existing boards with the same ID will be overwritten.
                </p>
                <label className={styles.fileLabel}>
                  Choose File
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className={styles.fileInput}
                  />
                </label>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Paste Configuration</label>
                <p className={styles.hint}>
                  Paste a JSON configuration below. You can get this from an
                  export, or ask an AI assistant to generate one for you.
                </p>
                <textarea
                  value={pasteJson}
                  onChange={(e) => setPasteJson(e.target.value)}
                  placeholder='{"version": 1, "boards": [...], ...}'
                  className={styles.textarea}
                  rows={5}
                />
                <button
                  className={styles.actionBtn}
                  onClick={handlePasteImport}
                  disabled={!pasteJson.trim()}
                >
                  Import JSON
                </button>
                {importError && (
                  <div className={styles.error}>{importError}</div>
                )}
                {importSuccess && (
                  <div className={styles.success}>{importSuccess}</div>
                )}
              </div>

              <div className={styles.divider} />

              <div className={styles.field}>
                <label className={styles.label}>GitHub Gist Sync</label>
                {hasGistScope === false && (
                  <div className={styles.gistScopeNotice}>
                    Your token does not include the <code>gist</code> scope.
                    To enable Gist sync,{' '}
                    <a
                      href="https://github.com/settings/tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      edit your token
                    </a>{' '}
                    and add the <code>gist</code> permission.
                  </div>
                )}
                {hasGistScope === true && (
                  <>
                    <p className={styles.hint}>
                      Save your configuration to a private GitHub Gist to sync
                      across browsers and devices.
                      {state.gistId && ' Your config is linked to an existing Gist.'}
                    </p>
                    <div className={styles.gistActions}>
                      <button
                        className={styles.actionBtn}
                        onClick={handleExportToGist}
                        disabled={gistLoading}
                      >
                        {gistLoading ? 'Saving...' : 'Save to Gist'}
                      </button>
                      <button
                        className={styles.actionBtn}
                        onClick={handleImportFromGist}
                        disabled={gistLoading}
                      >
                        {gistLoading ? 'Loading...' : 'Restore from Gist'}
                      </button>
                    </div>
                  </>
                )}
                {hasGistScope === null && (
                  <p className={styles.hint}>Checking Gist permissions...</p>
                )}
                {gistMessage && (
                  <div className={gistMessage.type === 'success' ? styles.success : styles.error}>
                    {gistMessage.text}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.saveBtn} onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
