import { useEffect, useRef, useState } from 'react'
import { deploymentsApi } from '../api/deployments'
import type { Log } from '../types'
import { useQueryClient } from '@tanstack/react-query'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function useLogs(deploymentId: string | null) {
  const [logs, setLogs] = useState<Log[]>([])
  const [liveStatus, setLiveStatus] = useState<string | null>(null)
  const [time, setTime] = useState<number>(0)
  const eventSourceRef = useRef<EventSource | null>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!deploymentId) {
      setLogs([])
      setLiveStatus(null)
      setTime(0)
      return
    }
    setLogs([])
    setLiveStatus(null)
    setTime(0)
    deploymentsApi.getLogs(deploymentId).then(setLogs)
  }, [deploymentId])

  useEffect(() => {
    if (!deploymentId) {
      eventSourceRef.current?.close()
      eventSourceRef.current = null
      return
    }

    // close any existing connection first
    eventSourceRef.current?.close()
    eventSourceRef.current = null

    const eventSource = new EventSource(`${BASE_URL}/events/${deploymentId}`)
    eventSourceRef.current = eventSource

    eventSource.onmessage = (e) => {
      const data = JSON.parse(e.data)

      if (data.type === 'status') {
        setLiveStatus(data.status)
        if (data.status === 'running') {
          queryClient.invalidateQueries({ queryKey: ['deployments'] })
          queryClient.invalidateQueries({
            queryKey: ['deployment', deploymentId],
          })
        }
      } else if (data.type === 'time') {
        setTime(data.time)
      } else if (data.type === 'log') {
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
    }

    eventSource.onerror = () => {
      eventSource.close()
      eventSourceRef.current = null
    }

    return () => {
      eventSource.close()
      eventSourceRef.current = null
    }
  }, [deploymentId])

  return { logs, liveStatus, time }
}
