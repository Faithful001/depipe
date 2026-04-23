import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { deploymentsApi } from '../api/deployments'

export function useDeployments() {
  return useQuery({
    queryKey: ['deployments'],
    queryFn: deploymentsApi.getAll,
  })
}

export function useDeploy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      gitUrl: string
      containerPort: number
      env?: Record<string, string>
    }) => deploymentsApi.deploy(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deployments'] })
    },
  })
}
