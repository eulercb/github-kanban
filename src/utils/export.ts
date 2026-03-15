import type { AppState, ExportData } from '../types';

export function exportSettings(state: AppState): void {
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
}
