import type { Deployment, Log } from '../types'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export const deploymentsApi = {
  async getAll(): Promise<Deployment[]> {
    const res = await fetch(`${BASE_URL}/deployments`)
    const data = await res.json()
    return data.deployments
  },

  async deploy(payload: {
    gitUrl: string
    env?: Record<string, string>
  }): Promise<{ containerId: string }> {
    const res = await fetch(`${BASE_URL}/deployments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.message)
    }
    return res.json()
  },

  async getLogs(deploymentId: string): Promise<Log[]> {
    const res = await fetch(`${BASE_URL}/deployments/${deploymentId}/logs`)
    const data = await res.json()
    return data.logs
  },

  async deployZip(formData: FormData): Promise<{ containerId: string }> {
    const res = await fetch(`${BASE_URL}/deployments/zip`, {
      method: 'POST',
      body: formData, // no Content-Type header — browser sets it with boundary
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.message)
    }
    return res.json()
  },
}
