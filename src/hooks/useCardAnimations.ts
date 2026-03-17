import { useLayoutEffect, useRef, useState, useCallback } from 'react';
import type { GitHubEntity } from '../types';
import { isPullRequest } from '../types';

interface ExitingCard {
  key: string;
  entity: GitHubEntity;
  rect: DOMRect;
}

function getEffectiveStatus(entity: GitHubEntity): string {
  if (isPullRequest(entity)) {
    if (entity.merged_at) return 'merged';
    if (entity.draft) return 'draft';
  }
  return entity.state; // 'open' or 'closed'
}

/**
 * FLIP animation hook for card transitions across the board.
 *
 * Tracks card positions via `data-entity-key` attributes on DOM elements.
 * After each render:
 *  - New cards get a `card-enter` CSS class (fade in + slide)
 *  - Moved cards get a FLIP transform animation (smooth position transition)
 *  - Removed cards are returned as `exitingCards` for overlay rendering
 */
export function useCardAnimations(
  boardRef: React.RefObject<HTMLDivElement | null>,
  entities: GitHubEntity[],
  entityKeyFn: (e: GitHubEntity) => string,
  enabled: boolean = true,
) {
  const prevPositionsRef = useRef<Map<string, DOMRect>>(new Map());
  const prevEntitiesMapRef = useRef<Map<string, GitHubEntity>>(new Map());
  const prevStatusesRef = useRef<Map<number, string>>(new Map());
  const isFirstRenderRef = useRef(true);
  const [exitingCards, setExitingCards] = useState<ExitingCard[]>([]);

  useLayoutEffect(() => {
    // Build current entities map inside the effect to avoid ref writes during render
    const entitiesMap = new Map<string, GitHubEntity>();
    for (const e of entities) {
      entitiesMap.set(entityKeyFn(e), e);
    }

    const board = boardRef.current;
    if (!board) return;

    const cards = board.querySelectorAll<HTMLElement>('[data-entity-key]');
    const currentPositions = new Map<string, DOMRect>();
    const currentKeys = new Set<string>();

    cards.forEach((card) => {
      const key = card.dataset.entityKey!;
      currentKeys.add(key);
      currentPositions.set(key, card.getBoundingClientRect());
    });

    const prevPositions = prevPositionsRef.current;

    // Skip animations on first render or when disabled
    if (enabled && !isFirstRenderRef.current && prevPositions.size > 0) {
      // Find entering cards (new keys not in previous positions)
      const entering = new Set<string>();
      currentKeys.forEach((key) => {
        if (!prevPositions.has(key)) {
          entering.add(key);
        }
      });

      // Apply enter animation
      cards.forEach((card) => {
        const key = card.dataset.entityKey!;
        if (entering.has(key)) {
          card.classList.add('card-enter');
          card.addEventListener(
            'animationend',
            () => card.classList.remove('card-enter'),
            { once: true }
          );
        }
      });

      // FLIP for moved cards
      cards.forEach((card) => {
        const key = card.dataset.entityKey!;
        if (entering.has(key)) return;

        const prev = prevPositions.get(key);
        const curr = currentPositions.get(key);

        if (prev && curr) {
          const dx = prev.left - curr.left;
          const dy = prev.top - curr.top;

          if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
            // Invert: place card at old position
            card.style.transform = `translate(${dx}px, ${dy}px)`;
            card.style.transition = 'none';

            // Play: animate to new position
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                card.style.transform = '';
                card.style.transition = 'transform 0.3s ease';
                card.addEventListener(
                  'transitionend',
                  () => {
                    card.style.transition = '';
                  },
                  { once: true }
                );
              });
            });
          }
        }
      });

      // Find exiting cards (keys that were visible but are no longer)
      const exiting: ExitingCard[] = [];
      prevPositions.forEach((rect, key) => {
        if (!currentKeys.has(key)) {
          const entity = prevEntitiesMapRef.current.get(key);
          if (entity) {
            exiting.push({ key, entity, rect });
          }
        }
      });

      if (exiting.length > 0) {
        const exitingCopy = exiting;
        queueMicrotask(() => setExitingCards(exitingCopy));
      }

      // Detect status changes and apply highlight animation
      const changedEntityIds = new Set<number>();
      const prevStatuses = prevStatusesRef.current;
      for (const entity of entities) {
        const prevStatus = prevStatuses.get(entity.id);
        if (prevStatus !== undefined && prevStatus !== getEffectiveStatus(entity)) {
          changedEntityIds.add(entity.id);
        }
      }

      if (changedEntityIds.size > 0) {
        cards.forEach((card) => {
          const key = card.dataset.entityKey!;
          // Keys may be column-prefixed (columnId:entityKey) — try both
          const entity = entitiesMap.get(key) ?? entitiesMap.get(key.split(':').slice(1).join(':'));
          if (entity && changedEntityIds.has(entity.id)) {
            card.classList.add('card-status-changed');
            card.addEventListener(
              'animationend',
              () => card.classList.remove('card-status-changed'),
              { once: true }
            );
          }
        });
      }
    }

    isFirstRenderRef.current = false;

    // Store current state for next render
    prevPositionsRef.current = currentPositions;
    prevEntitiesMapRef.current = entitiesMap;

    // Update status tracking
    const statuses = new Map<number, string>();
    for (const entity of entities) {
      statuses.set(entity.id, getEffectiveStatus(entity));
    }
    prevStatusesRef.current = statuses;
  }, [boardRef, entities, entityKeyFn, enabled]);

  const dismissExitingCard = useCallback((key: string) => {
    setExitingCards((prev) => prev.filter((c) => c.key !== key));
  }, []);

  return { exitingCards, dismissExitingCard };
}
