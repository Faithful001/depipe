import { useEffect, useState } from 'react'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// shared state outside React — persists across renders
const statusMap = new Map<string, string>()
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((fn) => fn())
}

// single global SSE connection for all deployment statuses
let globalEventSource: EventSource | null = null

function ensureGlobalSSE() {
  if (globalEventSource) return

  globalEventSource = new EventSource(`${BASE_URL}/events/all`)

  globalEventSource.onmessage = (e) => {
    const data = JSON.parse(e.data)
    if (data.type === 'status' && data.deploymentId) {
      statusMap.set(data.deploymentId, data.status)
      notify()
    }
  }

  globalEventSource.onerror = () => {
    globalEventSource?.close()
    globalEventSource = null
  }
}

export function useDeploymentStatus(deploymentId: string, fallback: string) {
  const [status, setStatus] = useState(statusMap.get(deploymentId) ?? fallback)

  useEffect(() => {
    ensureGlobalSSE()

    const update = () => {
      const s = statusMap.get(deploymentId)
      if (s) setStatus(s)
    }

    listeners.add(update)
    return () => {
      listeners.delete(update)
    }
  }, [deploymentId])

  return status
}
