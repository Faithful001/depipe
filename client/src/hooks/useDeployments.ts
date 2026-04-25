import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { deploymentsApi } from '../api/deployments'
import { toast } from 'sonner'

export function useDeployments() {
  return useQuery({
    queryKey: ['deployments'],
    queryFn: deploymentsApi.getAll,
  })
}

export function useDeployment(deploymentId: string) {
  return useQuery({
    queryKey: ['deployment', deploymentId],
    queryFn: () => deploymentsApi.getById(deploymentId),
    enabled: !!deploymentId,
  })
}

export function useCancelDeployment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (deploymentId: string) => {
      const data = await deploymentsApi.cancel(deploymentId)
      return data
    },
    onSuccess: (data: any) => {
      toast.success(
        data?.data?.message || data?.message || 'Deployment cancelled',
      )
      queryClient.invalidateQueries({ queryKey: ['deployments'] })
    },
    onError: (err: unknown) => {
      const error = err as Error
      toast.error(error.message || 'Cancellation failed')
    },
  })
}
export function useDeploy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      gitUrl: string
      env?: Record<string, string>
    }) => {
      const data = await deploymentsApi.deploy(payload)
      return data
    },
    onSuccess: (data: any) => {
      toast.success(
        data?.data?.message || data?.message || 'Deployment completed',
      )
      queryClient.invalidateQueries({ queryKey: ['deployments'] })
    },
    onError: (err: unknown) => {
      const error = err as Error
      toast.error(error.message || 'Deployment failed')
    },
  })
}

export function useDeployZip() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const data = await deploymentsApi.deployZip(formData)
      return data
    },
    onSuccess: (data: any) => {
      toast.success(
        data?.data?.message || data?.message || 'Deployment completed',
      )
      queryClient.invalidateQueries({ queryKey: ['deployments'] })
    },
    onError: (err: unknown) => {
      const error = err as Error
      toast.error(error.message || 'Deployment failed')
    },
  })
}
