import React from 'react';
import type { GitHubEntity, GitHubPullRequest } from '../../types';
import { isPullRequest } from '../../types';
import { useApp } from '../../contexts/AppContext';
import styles from './EntityCard.module.css';

interface Props {
  entity: GitHubEntity;
  columnId?: string;
}

function getEntityRepo(entity: GitHubEntity): string {
  const parts = entity.repository_url.split('/');
  return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function StateIcon({ entity }: { entity: GitHubEntity }) {
  if (isPullRequest(entity)) {
    if (entity.merged_at) {
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" className={styles.iconMerged}>
          <path fill="currentColor" d="M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.95-.218ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8-8a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM4.25 4a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" />
        </svg>
      );
    }
    if (entity.draft) {
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" className={styles.iconDraft}>
          <path fill="currentColor" d="M3.25 1A2.25 2.25 0 0 1 4 5.372v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.251 2.251 0 0 1 3.25 1Zm9.5 5.5a.75.75 0 0 1 .75.75v3.378a2.251 2.251 0 1 1-1.5 0V7.25a.75.75 0 0 1 .75-.75Zm-2.03-5.273a.75.75 0 0 1 1.06 0l.97.97.97-.97a.748.748 0 0 1 1.265.332.75.75 0 0 1-.205.729l-.97.97.97.97a.751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018l-.97-.97-.97.97a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734l.97-.97-.97-.97a.75.75 0 0 1 0-1.06ZM3.25 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm9.5 0a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z" />
        </svg>
      );
    }
    if (entity.state === 'closed') {
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" className={styles.iconClosed}>
          <path fill="currentColor" d="M3.25 1A2.25 2.25 0 0 1 4 5.372v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.251 2.251 0 0 1 3.25 1Zm9.5 5.5a.75.75 0 0 1 .75.75v3.378a2.251 2.251 0 1 1-1.5 0V7.25a.75.75 0 0 1 .75-.75Zm-2.03-5.273a.75.75 0 0 1 1.06 0l.97.97.97-.97a.748.748 0 0 1 1.265.332.75.75 0 0 1-.205.729l-.97.97.97.97a.751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018l-.97-.97-.97.97a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734l.97-.97-.97-.97a.75.75 0 0 1 0-1.06ZM3.25 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm9.5 0a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z" />
        </svg>
      );
    }
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" className={styles.iconOpen}>
        <path fill="currentColor" d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z" />
      </svg>
    );
  }

  // Issue
  if (entity.state === 'closed') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" className={styles.iconClosed}>
        <path fill="currentColor" d="M11.28 6.78a.75.75 0 0 0-1.06-1.06L7.25 8.69 5.78 7.22a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l3.5-3.5ZM16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0Zm-1.5 0a6.5 6.5 0 1 0-13 0 6.5 6.5 0 0 0 13 0Z" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className={styles.iconOpen}>
      <path fill="currentColor" d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
      <path fill="currentColor" d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z" />
    </svg>
  );
}

function PrStatusIcons({ pr }: { pr: GitHubPullRequest }) {
  const icons: React.ReactElement[] = [];

  // CI status
  if (pr.ci_status === 'success') {
    icons.push(
      <span key="ci" className={`${styles.statusIcon} ${styles.statusSuccess}`} title="CI passing">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16Zm3.78-9.72a.751.751 0 0 0-.018-1.042.751.751 0 0 0-1.042-.018L6.75 9.19 5.28 7.72a.751.751 0 0 0-1.042.018.751.751 0 0 0-.018 1.042l2 2a.75.75 0 0 0 1.06 0Z" />
        </svg>
      </span>
    );
  } else if (pr.ci_status === 'failure') {
    icons.push(
      <span key="ci" className={`${styles.statusIcon} ${styles.statusDanger}`} title="CI failing">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2.343 13.657A8 8 0 1 1 13.658 2.343 8 8 0 0 1 2.343 13.657ZM6.03 4.97a.751.751 0 0 0-1.042.018.751.751 0 0 0-.018 1.042L6.94 8 4.97 9.97a.751.751 0 0 0 .018 1.042.751.751 0 0 0 1.042.018L8 9.06l1.97 1.97a.751.751 0 0 0 1.042-.018.751.751 0 0 0 .018-1.042L9.06 8l1.97-1.97a.749.749 0 0 0-.326-1.275.749.749 0 0 0-.734.215L8 6.94Z" />
        </svg>
      </span>
    );
  } else if (pr.ci_status === 'pending') {
    icons.push(
      <span key="ci" className={`${styles.statusIcon} ${styles.statusWarning}`} title="CI pending">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm7.25-3.25v2.992l2.028.812a.75.75 0 0 1-.556 1.392l-2.5-1a.751.751 0 0 1-.472-.696V4.75a.75.75 0 0 1 1.5 0Z" />
        </svg>
      </span>
    );
  }

  // Approved
  if (pr.approved_count && pr.approved_count > 0) {
    icons.push(
      <span key="approved" className={`${styles.statusIcon} ${styles.statusSuccess}`} title={`${pr.approved_count} approval(s)`}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M11.28 6.78a.75.75 0 0 0-1.06-1.06L7.25 8.69 5.78 7.22a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l3.5-3.5ZM16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0Zm-1.5 0a6.5 6.5 0 1 0-13 0 6.5 6.5 0 0 0 13 0Z" />
        </svg>
        <span>{pr.approved_count}</span>
      </span>
    );
  }

  // Changes requested
  if (pr.changes_requested_count && pr.changes_requested_count > 0) {
    icons.push(
      <span key="changes" className={`${styles.statusIcon} ${styles.statusDanger}`} title={`${pr.changes_requested_count} change request(s)`}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z" />
        </svg>
      </span>
    );
  }

  // Unresolved comments
  if (pr.unresolved_comment_count && pr.unresolved_comment_count > 0) {
    icons.push(
      <span key="comments" className={`${styles.statusIcon} ${styles.statusWarning}`} title={`${pr.unresolved_comment_count} unresolved comment(s)`}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M0 2.75C0 1.784.784 1 1.75 1h12.5c.966 0 1.75.784 1.75 1.75v7.5A1.75 1.75 0 0 1 14.25 12H9.06l-2.573 2.573A1.458 1.458 0 0 1 4 13.543V12H1.75A1.75 1.75 0 0 1 0 10.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h3a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h4.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z" />
        </svg>
        <span>{pr.unresolved_comment_count}</span>
      </span>
    );
  }

  // Unviewed files
  if (pr.unviewed_files_count && pr.unviewed_files_count > 0) {
    icons.push(
      <span key="files" className={`${styles.statusIcon} ${styles.statusMuted}`} title={`${pr.unviewed_files_count} unviewed file(s)`}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z" />
        </svg>
        <span>{pr.unviewed_files_count}</span>
      </span>
    );
  }

  if (icons.length === 0) return null;

  return <>{icons}</>;
}

export function entityKey(entity: GitHubEntity): string {
  return `${entity.id}-${entity.html_url}`;
}

export function EntityCard({ entity, columnId }: Props) {
  const { state } = useApp();
  const compact = state.settings.compactCards;
  const d = state.settings.cardDisplay;
  const repo = getEntityRepo(entity);
  const pr = isPullRequest(entity);

  const hasAssignees = !compact && d.showAssignees && entity.assignees.length > 0;
  const hasComments = !compact && d.showCommentCount && entity.comments > 0;
  const hasReviewers = !compact && d.showCommentCount && pr && isPullRequest(entity) && entity.requested_reviewers.length > 0;
  const hasPrStatus = !compact && d.showPrStatus && pr && isPullRequest(entity);
  const showDetails = hasAssignees || hasComments || hasReviewers || hasPrStatus;

  return (
    <a
      href={entity.html_url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles.card} ${compact ? styles.compact : ''}`}
      data-entity-key={columnId ? `${columnId}:${entityKey(entity)}` : entityKey(entity)}
    >
      <div className={styles.header}>
        <StateIcon entity={entity} />
        <span className={styles.title}>{entity.title}</span>
      </div>

      <div className={styles.meta}>
        <span className={styles.repo}>{repo}</span>
        <span className={styles.number}>#{entity.number}</span>
        {d.showDraftBadge && pr && isPullRequest(entity) && entity.draft && (
          <span className={styles.draftBadge}>Draft</span>
        )}
        {d.showTimeAgo && (
          <span className={styles.time}>{timeAgo(entity.updated_at)}</span>
        )}
      </div>

      {d.showLabels && entity.labels.length > 0 && !compact && (
        <div className={styles.labels}>
          {entity.labels.map((label) => (
            <span
              key={label.id}
              className={styles.label}
              style={{
                backgroundColor: `#${label.color}20`,
                color: `#${label.color}`,
                borderColor: `#${label.color}40`,
              }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      {showDetails && (
        <div className={styles.details}>
          {hasAssignees && (
            <div className={styles.assignees}>
              {entity.assignees.slice(0, 3).map((a) => (
                <img
                  key={a.login}
                  src={a.avatar_url}
                  alt={a.login}
                  title={a.login}
                  className={styles.assigneeAvatar}
                  width={20}
                  height={20}
                />
              ))}
              {entity.assignees.length > 3 && (
                <span className={styles.moreAssignees}>
                  +{entity.assignees.length - 3}
                </span>
              )}
            </div>
          )}
          {hasPrStatus && isPullRequest(entity) && <PrStatusIcons pr={entity} />}
          {hasComments && (
            <span className={styles.stat}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M1 2.75C1 1.784 1.784 1 2.75 1h10.5c.966 0 1.75.784 1.75 1.75v7.5A1.75 1.75 0 0 1 13.25 12H9.06l-2.573 2.573A1.458 1.458 0 0 1 4 13.543V12H2.75A1.75 1.75 0 0 1 1 10.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h4.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z" />
              </svg>
              {entity.comments}
            </span>
          )}
          {hasReviewers && isPullRequest(entity) && (
            <span className={styles.stat} title="Pending reviewers">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 2c1.981 0 3.671.992 4.933 2.078 1.27 1.091 2.187 2.345 2.637 3.023a1.62 1.62 0 0 1 0 1.798c-.45.678-1.367 1.932-2.637 3.023C11.67 13.008 9.981 14 8 14c-1.981 0-3.671-.992-4.933-2.078C1.797 10.83.88 9.576.43 8.898a1.62 1.62 0 0 1 0-1.798c.45-.677 1.367-1.931 2.637-3.022C4.33 2.992 6.019 2 8 2ZM1.679 7.932a.12.12 0 0 0 0 .136c.411.622 1.241 1.75 2.366 2.717C5.176 11.758 6.527 12.5 8 12.5c1.473 0 2.825-.742 3.955-1.715 1.124-.967 1.954-2.096 2.366-2.717a.12.12 0 0 0 0-.136c-.412-.621-1.242-1.75-2.366-2.717C10.824 4.242 9.473 3.5 8 3.5c-1.473 0-2.824.742-3.955 1.715-1.124.967-1.954 2.096-2.366 2.717ZM8 10a2 2 0 1 1-.001-3.999A2 2 0 0 1 8 10Z" />
              </svg>
              {entity.requested_reviewers.length}
            </span>
          )}
        </div>
      )}
    </a>
  );
}
