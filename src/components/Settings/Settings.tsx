import { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import type { AppSettings, ExportData, ThemeMode, BoardConfig } from '../../types';
import styles from './Settings.module.css';

interface Props {
  onClose: () => void;
}

type Tab = 'general' | 'boards' | 'data';

export function Settings({ onClose }: Props) {
  const { state, updateSettings, updateBoard, deleteBoard } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [settings, setSettings] = useState<AppSettings>({ ...state.settings });
  const [editingBoard, setEditingBoard] = useState<string | null>(null);
  const [editBoardName, setEditBoardName] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  const handleSave = () => {
    updateSettings(settings);
    onClose();
  };

  const handleExport = () => {
    const data: ExportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      boards: state.boards,
      settings: state.settings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `github-kanban-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as ExportData;
        if (!data.version || !Array.isArray(data.boards)) {
          throw new Error('Invalid export file format');
        }
        // Import boards
        for (const board of data.boards) {
          updateBoard(board);
        }
        if (data.settings) {
          updateSettings(data.settings);
          setSettings(data.settings);
        }
        setImportError(null);
        alert(`Imported ${data.boards.length} board(s) successfully.`);
      } catch (err) {
        setImportError(
          err instanceof Error ? err.message : 'Failed to import data'
        );
      }
    };
    reader.readAsText(file);
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
                  Export Data
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
                {importError && (
                  <div className={styles.error}>{importError}</div>
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
