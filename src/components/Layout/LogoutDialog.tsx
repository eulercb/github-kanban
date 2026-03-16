import { useState, useEffect } from 'react';
import { useApp } from '../../hooks/useApp';
import { exportSettings } from '../../utils/export';
import { saveConfigToGist } from '../../services/github';
import { computeConfigHash, getGistSyncHash, setGistSyncHash } from '../../utils/storage';
import type { ExportData } from '../../types';
import styles from './LogoutDialog.module.css';

interface Props {
  onClose: () => void;
}

export function LogoutDialog({ onClose }: Props) {
  const { state, logout } = useApp();
  const gistEnabled = !!state.gistId;
  const [gistSyncFailed, setGistSyncFailed] = useState(false);

  // If gist is enabled, sync (if needed) and sign out automatically
  useEffect(() => {
    if (!gistEnabled) return;

    const currentHash = computeConfigHash(state.boards, state.settings);
    const savedHash = getGistSyncHash();
    const hasUnsyncedChanges = currentHash !== savedHash;

    if (!hasUnsyncedChanges) {
      logout();
      onClose();
      return;
    }

    const data: ExportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      boards: state.boards,
      settings: state.settings,
    };
    saveConfigToGist(data, state.gistId).then(() => {
      setGistSyncHash(currentHash);
      logout();
      onClose();
    }).catch(() => {
      setGistSyncFailed(true);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Gist enabled and sync hasn't failed yet — show syncing indicator (or nothing briefly)
  if (gistEnabled && !gistSyncFailed) {
    return (
      <div className={styles.overlay}>
        <div className={styles.dialog}>
          <div className={styles.header}>
            <h3>Syncing to Gist...</h3>
          </div>
          <p className={styles.message}>
            Backing up your configuration before signing out.
          </p>
        </div>
      </div>
    );
  }

  // No gist, or gist sync failed — show the normal confirmation dialog
  const handleExportAndLogout = () => {
    exportSettings(state);
    logout();
    onClose();
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" className={styles.warningIcon}>
            <path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575ZM8 5a.75.75 0 0 0-.75.75v2.5a.75.75 0 0 0 1.5 0v-2.5A.75.75 0 0 0 8 5Zm1 6a1 1 0 1 0-2 0 1 1 0 0 0 2 0Z" />
          </svg>
          <h3>Sign out</h3>
        </div>
        <p className={styles.message}>
          Signing out will clear all your boards, columns, and settings.
          Would you like to export your configuration first?
        </p>
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.exportBtn} onClick={handleExportAndLogout}>
            Export &amp; Sign Out
          </button>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
