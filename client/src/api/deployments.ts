import { api } from '.'
import type { Deployment, Log } from '../types'

export const deploymentsApi = {
  async getAll(): Promise<Deployment[]> {
    const res = await api.get('/deployments')
    return res.data.data.deployments
  },

  async deploy(payload: {
    gitUrl: string
    env?: Record<string, string>
  }): Promise<{ containerId: string }> {
    try {
      const res = await api.post('/deployments', payload)
      return res.data
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Deployment failed')
    }
  },

  async cancel(deploymentId: string): Promise<void> {
    try {
      const res = await api.post(`/deployments/${deploymentId}/cancel`)
      return res.data
    } catch (err: any) {
      throw new Error(
        err.response?.data?.message || 'Failed to cancel deployment',
      )
    }
  },

  async getById(deploymentId: string): Promise<Deployment> {
    const res = await api.get(`/deployments/${deploymentId}`)
    return res.data.data.deployment
  },

  async getLogs(deploymentId: string): Promise<Log[]> {
    const res = await api.get(`/deployments/${deploymentId}/logs`)
    return res.data.data.logs
  },

  async deployZip(formData: FormData): Promise<{ containerId: string }> {
    try {
      const res = await api.post('/deployments/zip', formData, {
        headers: {
          // IMPORTANT: let axios set the boundary automatically
          'Content-Type': 'multipart/form-data',
        },
      })
      return res.data
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Zip deployment failed')
    }
  },
}
