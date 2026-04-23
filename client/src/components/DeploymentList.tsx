import { DeploymentCard } from './DeploymentCard'
import { useDeployments } from '../hooks/useDeployments'
import type { Deployment } from '../types'

interface DeploymentListProps {
  onViewLogs: (deployment: Deployment) => void
}

export function DeploymentList({ onViewLogs }: DeploymentListProps) {
  const { data: deployments, isLoading, error } = useDeployments()

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              opacity: 1 - i * 0.2,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--border)',
              }}
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  height: 12,
                  background: 'var(--surface-2)',
                  borderRadius: 3,
                  width: '40%',
                  marginBottom: 6,
                }}
              />
              <div
                style={{
                  height: 10,
                  background: 'var(--surface-2)',
                  borderRadius: 3,
                  width: '25%',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--red)',
          borderRadius: 8,
          padding: '12px 16px',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: 'var(--red)',
            fontFamily: 'IBM Plex Mono, monospace',
          }}
        >
          ✕ Failed to load deployments
        </p>
      </div>
    )
  }

  if (!deployments?.length) {
    return (
      <div
        style={{
          background: 'var(--surface)',
          border: '1px dashed var(--border)',
          borderRadius: 8,
          padding: '48px 16px',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: 'var(--text-dim)',
            fontFamily: 'IBM Plex Mono, monospace',
          }}
        >
          no deployments yet
        </p>
        <p
          style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-dim)' }}
        >
          Click "+ Deploy" to get started
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {deployments.map((deployment, i) => (
        <div
          key={deployment.id}
          className="animate-fade-up"
          style={{ animationDelay: `${i * 40}ms` }}
        >
          <DeploymentCard deployment={deployment} onViewLogs={onViewLogs} />
        </div>
      ))}
    </div>
  )
}
