import { useEffect, useRef, useState } from 'react'
import { useLogs } from '../hooks/useLogs'
import { useDeploy } from '../hooks/useDeployments'
import type { Deployment } from '../types'

interface LogDrawerProps {
  deployment: Deployment | null
  onClose: () => void
}

export function LogDrawer({ deployment, onClose }: LogDrawerProps) {
  const logs = useLogs(deployment?.id ?? null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const { mutate: deploy, isPending } = useDeploy()

  useEffect(() => {
    if (autoScroll) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs, autoScroll])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleRedeploy = () => {
    if (!deployment?.git_url || !deployment?.env) return
    deploy({
      gitUrl: deployment.git_url,
      env: deployment.env,
    })
  }

  const cfg = {
    running: '#22c55e',
    building: '#3b82f6',
    deploying: '#a855f7',
    pending: '#eab308',
    failed: '#ef4444',
  }
  const dotColor = cfg[deployment?.status as keyof typeof cfg] ?? '#71717a'

  return (
    <>
      {/* backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(2px)',
          zIndex: 40,
          opacity: deployment ? 1 : 0,
          pointerEvents: deployment ? 'auto' : 'none',
          transition: 'opacity 0.2s',
        }}
      />

      {/* drawer */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '55vh',
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          zIndex: 50,
          transform: deployment ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* drawer header */}
        <div
          style={{
            padding: '10px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: dotColor,
              flexShrink: 0,
            }}
          />

          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: 'var(--text)',
              fontFamily: 'IBM Plex Mono, monospace',
            }}
          >
            {deployment?.image}
          </span>

          <span
            style={{
              fontSize: 10,
              color: dotColor,
              background: `${dotColor}18`,
              border: `1px solid ${dotColor}30`,
              padding: '1px 6px',
              borderRadius: 3,
              fontFamily: 'IBM Plex Mono, monospace',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {deployment?.status}
          </span>

          {deployment?.url && (
            <a
              href={deployment.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 11,
                color: 'var(--accent)',
                fontFamily: 'IBM Plex Mono, monospace',
                textDecoration: 'none',
              }}
            >
              ↗ {deployment.url}
            </a>
          )}

          <div style={{ flex: 1 }} />

          {/* auto scroll toggle */}
          <button
            onClick={() => setAutoScroll((p) => !p)}
            style={{
              background: autoScroll ? 'var(--accent-dim)' : 'transparent',
              border: `1px solid ${autoScroll ? 'var(--accent)' : 'var(--border)'}`,
              color: autoScroll ? 'var(--accent)' : 'var(--text-muted)',
              borderRadius: 4,
              padding: '3px 8px',
              fontSize: 10,
              cursor: 'pointer',
              fontFamily: 'IBM Plex Mono, monospace',
            }}
          >
            auto-scroll
          </button>

          {deployment?.status === 'failed' && (
            <button
              onClick={handleRedeploy}
              disabled={isPending}
              style={{
                background: 'var(--red)',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                padding: '4px 10px',
                fontSize: 11,
                cursor: isPending ? 'not-allowed' : 'pointer',
                opacity: isPending ? 0.5 : 1,
                fontFamily: 'IBM Plex Sans, sans-serif',
                fontWeight: 500,
              }}
            >
              {isPending ? 'redeploying...' : '↺ redeploy'}
            </button>
          )}

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              borderRadius: 4,
              padding: '3px 8px',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* log count */}
        <div
          style={{
            padding: '4px 16px',
            borderBottom: '1px solid var(--border-subtle)',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: 'var(--text-dim)',
              fontFamily: 'IBM Plex Mono, monospace',
            }}
          >
            {logs.length} lines
          </span>
        </div>

        {/* logs */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 16px',
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: 12,
            lineHeight: 1.7,
          }}
        >
          {logs.length === 0 ? (
            <p style={{ margin: 0, color: 'var(--text-dim)' }}>
              waiting for logs
              <span
                style={{
                  animation: 'pulse-dot 1s infinite',
                  display: 'inline-block',
                  marginLeft: 2,
                }}
              >
                _
              </span>
            </p>
          ) : (
            logs.map((log, i) => (
              <div
                key={log.id}
                style={{ display: 'flex', gap: 16, paddingBottom: 1 }}
              >
                <span
                  style={{
                    color: 'var(--text-dim)',
                    flexShrink: 0,
                    userSelect: 'none',
                    fontSize: 10,
                    paddingTop: 2,
                  }}
                >
                  {String(i + 1).padStart(4, ' ')}
                </span>
                <span
                  style={{
                    color:
                      log.message.toLowerCase().includes('error') ||
                      log.message.toLowerCase().includes('fail')
                        ? 'var(--red)'
                        : log.message.toLowerCase().includes('success') ||
                            log.message.toLowerCase().includes('done') ||
                            log.message.toLowerCase().includes('complete')
                          ? 'var(--green)'
                          : log.message.startsWith('#')
                            ? 'var(--text-muted)'
                            : 'var(--text)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                  }}
                >
                  {log.message}
                </span>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </>
  )
}
