// src/components/LogDrawer.tsx
import { useEffect, useRef } from 'react'
import { useLogs } from '../hooks/useLogs'
import { useDeploy } from '../hooks/useDeployments'
import type { Deployment } from '../types'

interface LogDrawerProps {
  deployment: Deployment | null
  onClose: () => void
}

export function LogDrawer({ deployment, onClose }: LogDrawerProps) {
  const logs = useLogs(deployment?.id ?? null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const { mutate: deploy, isPending } = useDeploy()

  // auto scroll to bottom as logs come in
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  // close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleRedeploy = () => {
    if (!deployment) return

    const payload: any = {
      gitUrl: deployment.git_url,
      containerPort: deployment.container_port || 3000,
      env: deployment.env,
    }

    deploy(payload, { onSuccess: onClose })
  }

  return (
    <>
      {/* backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-200 ${
          deployment ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-gray-950 rounded-t-xl transition-transform duration-300 ease-in-out ${
          deployment ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ height: '60vh' }}
      >
        {/* header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-white">
              {deployment?.image}
            </span>
            <span className="text-xs text-gray-400">{deployment?.status}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* redeploy button - only show on failed */}
            {deployment?.status === 'failed' && (
              <button
                onClick={handleRedeploy}
                disabled={isPending}
                className="px-3 py-1.5 text-xs font-medium bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md transition-colors"
              >
                {isPending ? 'Redeploying...' : 'Redeploy'}
              </button>
            )}

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-lg leading-none"
            >
              ✕
            </button>
          </div>
        </div>

        {/* logs */}
        <div className="h-full overflow-y-auto p-4 pb-16 font-mono text-xs">
          {logs.length === 0 ? (
            <p className="text-gray-500">Waiting for logs...</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex gap-3 py-0.5">
                <span className="text-gray-600 shrink-0">
                  {new Date(log.created_at).toLocaleTimeString()}
                </span>
                <span className="text-green-400 whitespace-pre-wrap break-all">
                  {log.message}
                </span>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </>
  )
}
