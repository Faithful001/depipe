import { useDeploymentStatus } from '#/hooks/useDeploymentStatus'
// import { useLogs } from '#/hooks/useLogs'
import type { Deployment, DeploymentStatus } from '../types'

const statusConfig: Record<
  DeploymentStatus,
  { color: string; dot: string; pulse: boolean }
> = {
  pending: { color: 'var(--yellow)', dot: '#eab308', pulse: false },
  building: { color: 'var(--blue)', dot: '#3b82f6', pulse: true },
  deploying: { color: 'var(--purple)', dot: '#a855f7', pulse: true },
  running: { color: 'var(--green)', dot: '#22c55e', pulse: false },
  failed: { color: 'var(--red)', dot: '#ef4444', pulse: false },
}

interface DeploymentCardProps {
  deployment: Deployment
  onViewLogs: (deployment: Deployment) => void
}

export function DeploymentCard({
  deployment,
  onViewLogs,
}: DeploymentCardProps) {
  const currentStatus = useDeploymentStatus(deployment.id, deployment.status)

  const cfg =
    statusConfig[currentStatus as keyof typeof statusConfig] ??
    statusConfig.pending

  const shortId = deployment.id.slice(0, 7)
  const repoName = deployment.git_url
    ? new URL(deployment.git_url).pathname.replace(/^\/|\.git$/g, '')
    : deployment.image

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.background = 'var(--surface-2)'
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.background = 'var(--surface)'
      }}
      onClick={() => onViewLogs(deployment)}
    >
      {/* status dot */}
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: cfg.dot,
          flexShrink: 0,
          animation: cfg.pulse ? 'pulse-dot 1.5s ease-in-out infinite' : 'none',
        }}
      />

      {/* repo name + image */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text)',
            fontFamily: 'IBM Plex Mono, monospace',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {repoName}
        </p>
        <p
          style={{
            margin: '2px 0 0',
            fontSize: 11,
            color: 'var(--text-muted)',
            fontFamily: 'IBM Plex Mono, monospace',
          }}
        >
          {new Date(deployment.created_at).toLocaleString()} · {shortId}
        </p>
      </div>

      {/* status badge */}
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: cfg.color,
          background: `${cfg.dot}18`,
          border: `1px solid ${cfg.dot}30`,
          padding: '2px 8px',
          borderRadius: 4,
          fontFamily: 'IBM Plex Mono, monospace',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          flexShrink: 0,
        }}
      >
        {currentStatus}
      </span>

      {/* live url */}
      {deployment.url && (
        <a
          href={deployment.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{
            fontSize: 11,
            color: 'var(--accent)',
            fontFamily: 'IBM Plex Mono, monospace',
            textDecoration: 'none',
            flexShrink: 0,
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.textDecoration = 'underline')
          }
          onMouseOut={(e) => (e.currentTarget.style.textDecoration = 'none')}
        >
          ↗ visit
        </a>
      )}
    </div>
  )
}
