import { useEffect, useRef, useState } from 'react'
import { deploymentsApi } from '../api/deployments'
import type { Log } from '../types'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export function useLogs(deploymentId: string | null) {
  const [logs, setLogs] = useState<Log[]>([])
  const eventSourceRef = useRef<EventSource | null>(null)

  // load persisted logs first
  useEffect(() => {
    if (!deploymentId) {
      setLogs([])
      return
    }
    deploymentsApi.getLogs(deploymentId).then(setLogs)
  }, [deploymentId])

  // open SSE stream for live logs
  useEffect(() => {
    if (!deploymentId) return

    eventSourceRef.current = new EventSource(
      `${BASE_URL}/events/${deploymentId}`,
    )

    eventSourceRef.current.onmessage = (e) => {
      const data = JSON.parse(e.data)
      setLogs((prev) => [
        ...prev,
        {
          id: Date.now(),
          deployment_id: deploymentId,
          message: data.message,
          created_at: new Date().toISOString(),
        },
      ])
    }

    eventSourceRef.current.onerror = () => {
      eventSourceRef.current?.close()
    }

    return () => {
      eventSourceRef.current?.close()
    }
  }, [deploymentId])

  return logs
}
