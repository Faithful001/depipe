import { useState } from 'react'
import { useDeploy } from '../hooks/useDeployments'

const parseEnvVars = (raw: string): Record<string, string> => {
  return Object.fromEntries(
    raw
      .split('\n')
      .filter((line) => line.includes('='))
      .map((line) => {
        const [key, ...rest] = line.split('=')
        return [key.trim(), rest.join('=').trim()]
      }),
  )
}

export function DeployForm() {
  const [gitUrl, setGitUrl] = useState('')
  const [containerPort, setContainerPort] = useState('')
  const [envVars, setEnvVars] = useState('')

  const { mutate: deploy, isPending, error } = useDeploy()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    let payload: {
      gitUrl: string
      containerPort: number
      env?: Record<string, string>
    } = {
      gitUrl,
      containerPort: parseInt(containerPort, 10),
    }

    if (envVars.trim()) {
      payload.env = parseEnvVars(envVars)
    }

    deploy(payload)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200 rounded-lg p-6 space-y-4"
    >
      <h2 className="text-lg font-semibold text-gray-900">New Deployment</h2>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Git URL</label>
        <input
          type="url"
          value={gitUrl}
          onChange={(e) => setGitUrl(e.target.value)}
          placeholder="https://github.com/user/my-app"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          required
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">
          Container Port
        </label>
        <input
          type="number"
          value={containerPort}
          onChange={(e) => setContainerPort(e.target.value)}
          placeholder="3000"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          required
        />
        <p className="text-xs text-gray-400">
          The port your app listens on inside the container
        </p>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">
          Environment Variables
          <span className="text-gray-400 font-normal"> (optional)</span>
        </label>
        <textarea
          value={envVars}
          onChange={(e) => setEnvVars(e.target.value)}
          placeholder={'DATABASE_URL=postgres://...\nAPI_KEY=abc123'}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <p className="text-xs text-gray-400">
          One variable per line in KEY=VALUE format
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error.message}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-2 px-4 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? 'Deploying...' : 'Deploy'}
      </button>
    </form>
  )
}
