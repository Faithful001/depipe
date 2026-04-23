import type { Deployment, DeploymentStatus } from '../types'

const statusColors: Record<DeploymentStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  building: 'bg-blue-100 text-blue-700',
  deploying: 'bg-purple-100 text-purple-700',
  running: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
}

const statusDot: Record<DeploymentStatus, string> = {
  pending: 'bg-yellow-400',
  building: 'bg-blue-400 animate-pulse',
  deploying: 'bg-purple-400 animate-pulse',
  running: 'bg-green-400',
  failed: 'bg-red-400',
}

interface DeploymentCardProps {
  deployment: Deployment
  onViewLogs: (deployment: Deployment) => void
}

export function DeploymentCard({
  deployment,
  onViewLogs,
}: DeploymentCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-4">
      {/* left side */}
      <div className="flex items-center gap-3 min-w-0">
        {/* status dot */}
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${statusDot[deployment.status]}`}
        />

        {/* image name */}
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {deployment.image}
          </p>
          <p className="text-xs text-gray-400">
            {new Date(deployment.created_at).toLocaleString()}
          </p>
        </div>
      </div>

      {/* middle - status + url */}
      <div className="flex items-center gap-3 shrink-0">
        {/* status badge */}
        <span
          className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[deployment.status]}`}
        >
          {deployment.status}
        </span>

        {/* live url */}
        {deployment.url && (
          <a
            href={deployment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline truncate max-w-[160px]"
          >
            {deployment.url}
          </a>
        )}
      </div>

      {/* right side - logs button */}
      <button
        onClick={() => onViewLogs(deployment)}
        className="shrink-0 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
      >
        View Logs
      </button>
    </div>
  )
}
