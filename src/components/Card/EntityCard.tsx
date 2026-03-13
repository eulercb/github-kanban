import type { GitHubEntity } from '../../types';
import { isPullRequest } from '../../types';
import { useApp } from '../../contexts/AppContext';
import styles from './EntityCard.module.css';

interface Props {
  entity: GitHubEntity;
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

export function EntityCard({ entity }: Props) {
  const { state } = useApp();
  const compact = state.settings.compactCards;
  const repo = getEntityRepo(entity);
  const pr = isPullRequest(entity);

  return (
    <a
      href={entity.html_url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles.card} ${compact ? styles.compact : ''}`}
    >
      <div className={styles.header}>
        <StateIcon entity={entity} />
        <span className={styles.title}>{entity.title}</span>
      </div>

      <div className={styles.meta}>
        <span className={styles.repo}>{repo}</span>
        <span className={styles.number}>#{entity.number}</span>
        {pr && isPullRequest(entity) && entity.draft && (
          <span className={styles.draftBadge}>Draft</span>
        )}
        <span className={styles.time}>{timeAgo(entity.updated_at)}</span>
      </div>

      {entity.labels.length > 0 && !compact && (
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

      {!compact && (
        <div className={styles.footer}>
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
          <div className={styles.stats}>
            {entity.comments > 0 && (
              <span className={styles.stat}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M1 2.75C1 1.784 1.784 1 2.75 1h10.5c.966 0 1.75.784 1.75 1.75v7.5A1.75 1.75 0 0 1 13.25 12H9.06l-2.573 2.573A1.458 1.458 0 0 1 4 13.543V12H2.75A1.75 1.75 0 0 1 1 10.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h4.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z" />
                </svg>
                {entity.comments}
              </span>
            )}
            {pr && isPullRequest(entity) && entity.requested_reviewers.length > 0 && (
              <span className={styles.stat} title="Pending reviewers">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 2c1.981 0 3.671.992 4.933 2.078 1.27 1.091 2.187 2.345 2.637 3.023a1.62 1.62 0 0 1 0 1.798c-.45.678-1.367 1.932-2.637 3.023C11.67 13.008 9.981 14 8 14c-1.981 0-3.671-.992-4.933-2.078C1.797 10.83.88 9.576.43 8.898a1.62 1.62 0 0 1 0-1.798c.45-.677 1.367-1.931 2.637-3.022C4.33 2.992 6.019 2 8 2ZM1.679 7.932a.12.12 0 0 0 0 .136c.411.622 1.241 1.75 2.366 2.717C5.176 11.758 6.527 12.5 8 12.5c1.473 0 2.825-.742 3.955-1.715 1.124-.967 1.954-2.096 2.366-2.717a.12.12 0 0 0 0-.136c-.412-.621-1.242-1.75-2.366-2.717C10.824 4.242 9.473 3.5 8 3.5c-1.473 0-2.824.742-3.955 1.715-1.124.967-1.954 2.096-2.366 2.717ZM8 10a2 2 0 1 1-.001-3.999A2 2 0 0 1 8 10Z" />
                </svg>
                {entity.requested_reviewers.length}
              </span>
            )}
          </div>
        </div>
      )}
    </a>
  );
}
