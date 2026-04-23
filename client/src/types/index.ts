export type DeploymentStatus =
  | 'pending'
  | 'building'
  | 'deploying'
  | 'running'
  | 'failed'

export interface Deployment {
  id: string
  image: string
  git_url: string | null
  container_port: number | null
  status: DeploymentStatus
  container_id: string | null
  host_port: number | null
  url: string | null
  env: Record<string, string> | null
  created_at: string
}

export interface Log {
  id: number
  deployment_id: string
  message: string
  created_at: string
}
