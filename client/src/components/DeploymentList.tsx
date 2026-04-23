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
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-gray-200" />
              <div className="h-4 bg-gray-200 rounded w-32" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-600">Failed to load deployments</p>
      </div>
    )
  }

  if (!deployments?.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-sm text-gray-400">
          No deployments yet. Create one above.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {deployments.map((deployment) => (
        <DeploymentCard
          key={deployment.id}
          deployment={deployment}
          onViewLogs={onViewLogs}
        />
      ))}
    </div>
  )
}
