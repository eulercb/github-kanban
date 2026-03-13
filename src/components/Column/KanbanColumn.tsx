import { useState, useMemo } from 'react';
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
}

export function KanbanColumn({ column, boardId }: Props) {
  const { state, updateBoard } = useApp();
  const { entities } = useData();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);
  const [showFilters, setShowFilters] = useState(false);

  const board = state.boards.find((b) => b.id === boardId)!;

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

  const handleDelete = () => {
    const newColumns = board.columns.filter((c) => c.id !== column.id);
    updateBoard({ ...board, columns: newColumns });
  };

  const handleFiltersChange = (filters: FilterRule[]) => {
    updateColumn({ filters });
  };

  const handleCombinationChange = (filterCombination: FilterCombination) => {
    updateColumn({ filterCombination });
  };

  const toggleCollapse = () => {
    updateColumn({ collapsed: !column.collapsed });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.column} ${column.collapsed ? styles.collapsed : ''}`}
    >
      <div className={styles.header} {...attributes} {...listeners}>
        <div className={styles.headerLeft}>
          <button
            className={styles.collapseBtn}
            onClick={(e) => {
              e.stopPropagation();
              toggleCollapse();
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 16 16"
              fill="currentColor"
              style={{
                transform: column.collapsed ? 'rotate(-90deg)' : 'none',
                transition: 'transform 150ms',
              }}
            >
              <path d="M12.78 5.22a.749.749 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.06 0L3.22 6.28a.749.749 0 1 1 1.06-1.06L8 8.939l3.72-3.719a.749.749 0 0 1 1.06 0Z" />
            </svg>
          </button>

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
            />
          ) : (
            <h3
              className={styles.title}
              onDoubleClick={() => {
                setEditTitle(column.title);
                setIsEditing(true);
              }}
            >
              {column.title}
            </h3>
          )}

          <span className={styles.count}>{filteredEntities.length}</span>
        </div>

        <div className={styles.headerActions}>
          <button
            className={`${styles.actionBtn} ${showFilters ? styles.actionActive : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setShowFilters(!showFilters);
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
        <div className={styles.filterPanel}>
          <FilterEditor
            filters={column.filters}
            combination={column.filterCombination}
            onFiltersChange={handleFiltersChange}
            onCombinationChange={handleCombinationChange}
            currentUser={state.currentUser?.login}
          />
        </div>
      )}

      {!column.collapsed && (
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
      )}
    </div>
  );
}
