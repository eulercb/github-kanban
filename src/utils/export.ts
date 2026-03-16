import type { AppState, BoardConfig, ExportData } from '../types';

function cleanBoardsForExport(boards: BoardConfig[]): BoardConfig[] {
  return boards.map(board => ({
    ...board,
    columns: board.columns.map(({ collapsed: _, width: __, ...col }) => col as typeof board.columns[number]),
  }));
}

export function buildExportData(state: AppState): ExportData {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    boards: cleanBoardsForExport(state.boards),
    settings: state.settings,
  };
}

export function exportSettings(state: AppState): void {
  const data = buildExportData(state);
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
