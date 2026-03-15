import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ColumnConfig, FilterRule, FilterCombination } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { useData } from '../../contexts/DataContext';
import { getColumnEntities } from '../../services/filters';
import { EntityCard } from '../Card/EntityCard';
import { FilterEditor } from './FilterEditor';
import styles from './KanbanColumn.module.css';

interface Props {
  column: ColumnConfig;
  boardId: string;
  showFilters: boolean;
  onToggleFilters: (columnId: string) => void;
  onDuplicate: (columnId: string) => void;
  autoEdit?: boolean;
  onAutoEditDone?: () => void;
}

export function KanbanColumn({
  column,
  boardId,
  showFilters,
  onToggleFilters,
  onDuplicate,
  autoEdit,
  onAutoEditDone,
}: Props) {
  const { state, updateBoard } = useApp();
  const { entities } = useData();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const board = state.boards.find((b) => b.id === boardId)!;

  // Auto-edit when a new column is created
  useEffect(() => {
    if (autoEdit) {
      setEditTitle(column.title);
      setIsEditing(true);
      onAutoEditDone?.();
    }
  }, [autoEdit]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const filteredEntities = useMemo(
    () => getColumnEntities(entities, column),
    [entities, column]
  );

  const updateColumn = (updates: Partial<ColumnConfig>) => {
    const newColumns = board.columns.map((c) =>
      c.id === column.id ? { ...c, ...updates } : c
    );
    updateBoard({ ...board, columns: newColumns });
  };

  const handleTitleSubmit = () => {
    if (editTitle.trim()) {
      updateColumn({ title: editTitle.trim() });
    }
    setIsEditing(false);
  };

  const handleTitleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditTitle(column.title);
    setIsEditing(true);
  };

  const handleDelete = () => {
    if (!confirm(`Delete column "${column.title}"?`)) return;
    const newColumns = board.columns.filter((c) => c.id !== column.id);
    updateBoard({ ...board, columns: newColumns });
  };

  const handleFiltersChange = (filters: FilterRule[]) => {
    updateColumn({ filters });
  };

  const handleCombinationChange = (filterCombination: FilterCombination) => {
    updateColumn({ filterCombination });
  };

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  const handleContextRename = () => {
    closeContextMenu();
    setEditTitle(column.title);
    setIsEditing(true);
  };

  const handleContextDuplicate = () => {
    closeContextMenu();
    onDuplicate(column.id);
  };

  const handleContextRemove = () => {
    closeContextMenu();
    handleDelete();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={styles.column}
      onContextMenu={handleContextMenu}
    >
      {contextMenu && (
        <>
          <div className={styles.contextBackdrop} onClick={closeContextMenu} onContextMenu={(e) => { e.preventDefault(); closeContextMenu(); }} />
          <div
            className={styles.contextMenu}
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button className={styles.contextMenuItem} onClick={handleContextRename}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 0 0-.064.108l-.558 1.953 1.953-.558a.253.253 0 0 0 .108-.064Zm1.238-3.763a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354Z" />
              </svg>
              Rename
            </button>
            <button className={styles.contextMenuItem} onClick={handleContextDuplicate}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z" />
                <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z" />
              </svg>
              Duplicate
            </button>
            <div className={styles.contextDivider} />
            <button className={`${styles.contextMenuItem} ${styles.contextMenuDanger}`} onClick={handleContextRemove}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.75 1.75 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15ZM6.5 1.75V3h3V1.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25Z" />
              </svg>
              Remove
            </button>
          </div>
        </>
      )}
      <div className={styles.header} {...attributes} {...listeners}>
        <div className={styles.headerLeft}>
          {isEditing ? (
            <input
              autoFocus
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSubmit();
                if (e.key === 'Escape') setIsEditing(false);
              }}
              className={styles.titleInput}
              onClick={(e) => e.stopPropagation()}
              onFocus={(e) => e.target.select()}
            />
          ) : (
            <h3
              className={styles.title}
              onClick={handleTitleClick}
            >
              {column.title}
            </h3>
          )}

          <span className={styles.count}>{filteredEntities.length}</span>
        </div>

        <div className={styles.headerActions}>
          <button
            className={`${styles.actionBtn} ${showFilters ? styles.actionActive : ''}`}
            data-filter-btn
            onClick={(e) => {
              e.stopPropagation();
              onToggleFilters(column.id);
            }}
            title="Edit filters"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M.75 3h14.5a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1 0-1.5ZM3 7.75A.75.75 0 0 1 3.75 7h8.5a.75.75 0 0 1 0 1.5h-8.5A.75.75 0 0 1 3 7.75Zm3 4a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z" />
            </svg>
          </button>
          <button
            className={styles.actionBtn}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            title="Delete column"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.75 1.75 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15ZM6.5 1.75V3h3V1.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25Z" />
            </svg>
          </button>
        </div>
      </div>

      {showFilters && (
        <div className={styles.filterPanel} data-filter-panel>
          <FilterEditor
            filters={column.filters}
            combination={column.filterCombination}
            onFiltersChange={handleFiltersChange}
            onCombinationChange={handleCombinationChange}
            currentUser={state.currentUser?.login}
          />
        </div>
      )}

      <div className={styles.cards}>
        {filteredEntities.length === 0 ? (
          <div className={styles.empty}>
            {column.filters.length === 0
              ? 'Add filters to see items'
              : 'No items match filters'}
          </div>
        ) : (
          filteredEntities.map((entity) => (
            <EntityCard key={`${entity.id}-${entity.html_url}`} entity={entity} />
          ))
        )}
      </div>
    </div>
  );
}
