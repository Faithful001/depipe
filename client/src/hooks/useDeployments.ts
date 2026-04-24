import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { deploymentsApi } from '../api/deployments'
import { toast } from 'sonner'

export function useDeployments() {
  return useQuery({
    queryKey: ['deployments'],
    queryFn: deploymentsApi.getAll,
  })
}

export function useDeploy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { gitUrl: string; env?: Record<string, string> }) =>
      deploymentsApi.deploy(payload),
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
    mutationFn: (formData: FormData) => deploymentsApi.deployZip(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deployments'] })
    },
  })
}
