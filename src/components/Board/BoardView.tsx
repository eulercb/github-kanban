import { useState, useRef, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { useApp } from '../../contexts/AppContext';
import { useData } from '../../contexts/DataContext';
import { useCardAnimations } from '../../hooks/useCardAnimations';
import { KanbanColumn } from '../Column/KanbanColumn';
import { EntityCard, entityKey } from '../Card/EntityCard';
import { BoardSetup } from './BoardSetup';
import { generateId } from '../../utils/id';
import type { ColumnConfig, BoardConfig } from '../../types';
import styles from './BoardView.module.css';

export function BoardView() {
  const { state, updateBoard, addBoard, setActiveBoard } = useApp();
  const { entities, isLoading, error } = useData();
  const [showNewBoard, setShowNewBoard] = useState(false);
  const [editingBoard, setEditingBoard] = useState<BoardConfig | null>(null);
  const [showBoardMenu, setShowBoardMenu] = useState(false);
  const [openFilterColumnId, setOpenFilterColumnId] = useState<string | null>(null);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const { exitingCards, dismissExitingCard } = useCardAnimations(
    boardRef,
    entities,
    entityKey
  );

  const activeBoard = state.boards.find((b) => b.id === state.activeBoardId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (!activeBoard) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = activeBoard.columns.findIndex((c) => c.id === active.id);
    const newIndex = activeBoard.columns.findIndex((c) => c.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newColumns = arrayMove(activeBoard.columns, oldIndex, newIndex);
      updateBoard({ ...activeBoard, columns: newColumns });
    }
  };

  const addColumn = () => {
    if (!activeBoard) return;
    const newId = generateId();
    const newColumn: ColumnConfig = {
      id: newId,
      title: 'New Column',
      filters: [],
      filterCombination: 'and',
      collapsed: false,
      width: 340,
    };
    updateBoard({
      ...activeBoard,
      columns: [...activeBoard.columns, newColumn],
    });
    setOpenFilterColumnId(null);
    setEditingColumnId(newId);
    // Scroll to the new column after render
    requestAnimationFrame(() => {
      boardRef.current?.scrollTo({
        left: boardRef.current.scrollWidth,
        behavior: 'smooth',
      });
    });
  };

  const handleBoardClick = useCallback(
    (e: React.MouseEvent) => {
      // Close filter panel when clicking on the board background or a different column
      if (openFilterColumnId) {
        const target = e.target as HTMLElement;
        const filterPanel = target.closest('[data-filter-panel]');
        const filterBtn = target.closest('[data-filter-btn]');
        if (!filterPanel && !filterBtn) {
          setOpenFilterColumnId(null);
        }
      }
    },
    [openFilterColumnId]
  );

  const handleCreateBoard = (board: BoardConfig) => {
    addBoard(board);
    setActiveBoard(board.id);
    setShowNewBoard(false);
  };

  const handleEditBoard = (board: BoardConfig) => {
    updateBoard(board);
    setEditingBoard(null);
  };

  if (state.boards.length === 0 || showNewBoard) {
    return (
      <div className={styles.setupContainer}>
        <BoardSetup
          onSave={handleCreateBoard}
          onCancel={
            state.boards.length > 0 ? () => setShowNewBoard(false) : undefined
          }
        />
      </div>
    );
  }

  if (editingBoard) {
    return (
      <div className={styles.setupContainer}>
        <BoardSetup
          initialBoard={editingBoard}
          onSave={handleEditBoard}
          onCancel={() => setEditingBoard(null)}
        />
      </div>
    );
  }

  if (!activeBoard) {
    return (
      <div className={styles.empty}>
        <p>Select a board or create a new one</p>
        <button
          className={styles.createBtn}
          onClick={() => setShowNewBoard(true)}
        >
          Create Board
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {error && (
        <div className={styles.errorBar}>
          <span>{error}</span>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      {isLoading && (
        <div className={styles.loadingBar}>
          <div className={styles.loadingProgress} />
        </div>
      )}

      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <div className={styles.boardSelector}>
            <button
              className={styles.boardSelectorBtn}
              onClick={() => setShowBoardMenu(!showBoardMenu)}
            >
              <span className={styles.boardName}>{activeBoard.name}</span>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M12.78 5.22a.749.749 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.06 0L3.22 6.28a.749.749 0 1 1 1.06-1.06L8 8.939l3.72-3.719a.749.749 0 0 1 1.06 0Z" />
              </svg>
            </button>
            {showBoardMenu && (
              <>
                <div
                  className={styles.boardMenuBackdrop}
                  onClick={() => setShowBoardMenu(false)}
                />
                <div className={styles.boardMenu}>
                  <div className={styles.boardMenuSection}>
                    {state.boards.map((board) => (
                      <button
                        key={board.id}
                        className={`${styles.boardMenuItem} ${
                          board.id === activeBoard.id ? styles.boardMenuItemActive : ''
                        }`}
                        onClick={() => {
                          setActiveBoard(board.id);
                          setShowBoardMenu(false);
                        }}
                      >
                        <span>{board.name}</span>
                        <span className={styles.boardMenuMeta}>
                          {board.repos.length} repo{board.repos.length !== 1 ? 's' : ''}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className={styles.boardMenuDivider} />
                  <button
                    className={styles.boardMenuItem}
                    onClick={() => {
                      setShowBoardMenu(false);
                      setEditingBoard(activeBoard);
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 0 0-.064.108l-.558 1.953 1.953-.558a.253.253 0 0 0 .108-.064Zm1.238-3.763a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354Z" />
                    </svg>
                    Edit current board
                  </button>
                  <button
                    className={styles.boardMenuItem}
                    onClick={() => {
                      setShowBoardMenu(false);
                      setShowNewBoard(true);
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z" />
                    </svg>
                    New board
                  </button>
                </div>
              </>
            )}
          </div>
          <span className={styles.repoCount}>
            {activeBoard.repos.length} repo{activeBoard.repos.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className={styles.toolbarRight}>
          <button className={styles.addColumnBtn} onClick={addColumn}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z" />
            </svg>
            Add Column
          </button>
        </div>
      </div>

      <div className={styles.board} ref={boardRef} onClick={handleBoardClick}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={activeBoard.columns.map((c) => c.id)}
            strategy={horizontalListSortingStrategy}
          >
            {activeBoard.columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                boardId={activeBoard.id}
                showFilters={openFilterColumnId === column.id}
                onToggleFilters={(id) =>
                  setOpenFilterColumnId((prev) => (prev === id ? null : id))
                }
                autoEdit={editingColumnId === column.id}
                onAutoEditDone={() => setEditingColumnId(null)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {activeBoard.columns.length === 0 && (
          <div className={styles.emptyBoard}>
            <h3>No columns yet</h3>
            <p>Add a column and configure filters to see your GitHub data</p>
            <button className={styles.createBtn} onClick={addColumn}>
              Add Your First Column
            </button>
          </div>
        )}
      </div>

      {exitingCards.map(({ key, entity, rect }) => (
        <div
          key={`exit-${key}`}
          className={`card-exit ${styles.exitingCard}`}
          style={{
            position: 'fixed',
            left: rect.left,
            top: rect.top,
            width: rect.width,
            zIndex: 50,
          }}
          onAnimationEnd={() => dismissExitingCard(key)}
        >
          <EntityCard entity={entity} />
        </div>
      ))}
    </div>
  );
}
