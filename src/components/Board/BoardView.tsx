import { useState } from 'react';
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
import { KanbanColumn } from '../Column/KanbanColumn';
import { BoardSetup } from './BoardSetup';
import { generateId } from '../../utils/id';
import type { ColumnConfig, BoardConfig } from '../../types';
import styles from './BoardView.module.css';

export function BoardView() {
  const { state, updateBoard, addBoard, setActiveBoard } = useApp();
  const { isLoading, error } = useData();
  const [showNewBoard, setShowNewBoard] = useState(false);

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
    const newColumn: ColumnConfig = {
      id: generateId(),
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
  };

  const handleCreateBoard = (board: BoardConfig) => {
    addBoard(board);
    setActiveBoard(board.id);
    setShowNewBoard(false);
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
          <span className={styles.boardName}>{activeBoard.name}</span>
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
          <button
            className={styles.newBoardBtn}
            onClick={() => setShowNewBoard(true)}
          >
            New Board
          </button>
        </div>
      </div>

      <div className={styles.board}>
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
    </div>
  );
}
