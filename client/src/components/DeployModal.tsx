import { useEffect, useState } from 'react'
import { useDeploy, useDeployZip } from '../hooks/useDeployments'
import { getErrorMessage } from '#/utils/get-error-message'

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

interface DeployModalProps {
  onClose: () => void
}

export function DeployModal({ onClose }: DeployModalProps) {
  const [mode, setMode] = useState<'git' | 'upload'>('git')
  const [gitUrl, setGitUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [envVars, setEnvVars] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const { mutate: deploy, isPending, error } = useDeploy()

  const {
    mutate: deployZip,
    isPending: isPendingZip,
    error: errorZip,
  } = useDeployZip()

  useEffect(() => {
    setTimeout(() => {
      if (isPending || isPendingZip) {
        onClose()
      }
    }, 2000)
  }, [isPending, isPendingZip])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (mode === 'upload') {
      if (!file) return

      // zip uses FormData — different endpoint
      const formData = new FormData()
      formData.append('file', file)
      formData.append(
        'imageName',
        file.name
          .replace('.zip', '')
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-'),
      )
      if (envVars.trim()) {
        formData.append('env', JSON.stringify(parseEnvVars(envVars)))
      }

      deployZip(formData, { onSuccess: onClose })
      return
    }

    // git url — JSON
    const payload: any = { gitUrl }
    if (envVars.trim()) payload.env = parseEnvVars(envVars)
    deploy(payload, { onSuccess: onClose })
  }

  const inputStyle = {
    width: '100%',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    padding: '8px 12px',
    color: 'var(--text)',
    fontSize: 13,
    fontFamily: 'IBM Plex Mono, monospace',
    outline: 'none',
    transition: 'border-color 0.15s',
  }

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        width: 480,
        overflow: 'hidden',
      }}
    >
      {/* modal header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <p
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text)',
              margin: 0,
            }}
          >
            New Deployment
          </p>
          <p
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              margin: '2px 0 0',
            }}
          >
            Deploy your project in seconds.
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: 18,
            lineHeight: 1,
            padding: 4,
          }}
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: 20 }}>
        {/* mode toggle */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: 3,
            marginBottom: 16,
          }}
        >
          {(['git', 'upload'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              style={{
                padding: '7px 0',
                borderRadius: 6,
                border: 'none',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: mode === m ? 'var(--surface)' : 'transparent',
                color: mode === m ? 'var(--text)' : 'var(--text-muted)',
                boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              {m === 'git' ? '⎇  Git Repo' : '↑  Upload Zip'}
            </button>
          ))}
        </div>

        {/* git url */}
        {mode === 'git' && (
          <div style={{ marginBottom: 14 }}>
            <label
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                display: 'block',
                marginBottom: 6,
                fontFamily: 'IBM Plex Mono, monospace',
                letterSpacing: '0.04em',
              }}
            >
              REPOSITORY URL
            </label>
            <input
              type="url"
              value={gitUrl}
              onChange={(e) => setGitUrl(e.target.value)}
              placeholder="https://github.com/username/repo"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              required
            />
          </div>
        )}

        {/* file upload */}
        {mode === 'upload' && (
          <div style={{ marginBottom: 14 }}>
            <label
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                display: 'block',
                marginBottom: 6,
                fontFamily: 'IBM Plex Mono, monospace',
                letterSpacing: '0.04em',
              }}
            >
              PROJECT ARCHIVE (ZIP)
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(false)
                const f = e.dataTransfer.files[0]
                if (f?.name.endsWith('.zip')) setFile(f)
              }}
              style={{
                border: `1px dashed ${dragOver ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 6,
                padding: '24px 16px',
                textAlign: 'center',
                background: dragOver ? 'var(--accent-dim)' : 'var(--bg)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onClick={() => document.getElementById('zip-input')?.click()}
            >
              <input
                id="zip-input"
                type="file"
                accept=".zip"
                style={{ display: 'none' }}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {file ? (
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    color: 'var(--accent)',
                    fontFamily: 'IBM Plex Mono, monospace',
                  }}
                >
                  {file.name}
                </p>
              ) : (
                <>
                  <p
                    style={{
                      margin: '0 0 4px',
                      fontSize: 12,
                      color: 'var(--text-muted)',
                    }}
                  >
                    {file ? (file as File).name : 'No file chosen'}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 11,
                      color: 'var(--text-dim)',
                    }}
                  >
                    Click or drag your .zip file here
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* env vars */}
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              display: 'block',
              marginBottom: 6,
              fontFamily: 'IBM Plex Mono, monospace',
              letterSpacing: '0.04em',
            }}
          >
            ENVIRONMENT VARIABLES{' '}
            <span style={{ color: 'var(--text-dim)' }}>(OPTIONAL)</span>
          </label>
          <textarea
            value={envVars}
            onChange={(e) => setEnvVars(e.target.value)}
            placeholder={'KEY=VALUE\nAPI_TOKEN=secret123'}
            rows={3}
            style={{
              ...inputStyle,
              resize: 'vertical',
              lineHeight: 1.6,
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>

        {error || errorZip ? (
          <p
            style={{
              fontSize: 12,
              color: 'var(--red)',
              marginBottom: 12,
              fontFamily: 'IBM Plex Mono, monospace',
            }}
          >
            ✕ {getErrorMessage(error || errorZip)}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isPending || isPendingZip}
          style={{
            width: '100%',
            padding: '10px 0',
            background:
              isPending || isPendingZip ? 'var(--surface-2)' : 'var(--accent)',
            color: isPending || isPendingZip ? 'var(--text-muted)' : '#ffffff',
            border: 'none',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            cursor: isPending || isPendingZip ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
            letterSpacing: '0.02em',
          }}
        >
          {isPending || isPendingZip ? 'Deploying...' : 'Deploy Now'}
        </button>
      </form>
    </div>
  )
}
