import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { DeployModal } from '#/components/DeployModal'
import { LogDrawer } from '#/components/LogDrawer'
import type { Deployment } from '../types'
import { DeploymentList } from '#/components/DeploymentList'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const [selectedDeployment, setSelectedDeployment] =
    useState<Deployment | null>(null)
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* header */}
      <header
        style={{
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
        }}
      >
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              style={{
                width: 28,
                height: 28,
                background: 'var(--accent)',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 12L7 2L12 12H2Z" fill="black" />
              </svg>
            </div>
            <span
              className="mono"
              style={{
                fontSize: 13,
                color: 'var(--text)',
                fontWeight: 500,
                letterSpacing: '0.02em',
              }}
            >
              depipe
            </span>
            <span
              style={{
                fontSize: 10,
                color: 'var(--text-muted)',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                padding: '1px 6px',
                borderRadius: 4,
                fontFamily: 'IBM Plex Mono, monospace',
              }}
            >
              v0.1
            </span>
          </div>

          <button
            onClick={() => setShowForm(true)}
            style={{
              background: 'var(--accent)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 6,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'IBM Plex Sans, sans-serif',
              letterSpacing: '0.02em',
              transition: 'opacity 0.15s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = '0.85')}
            onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
          >
            + Deploy
          </button>
        </div>
      </header>

      {/* main */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* section label */}
        <div className="flex items-center gap-3 mb-4">
          <span
            className="mono"
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Deployments
          </span>
          <div
            style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }}
          />
        </div>

        <DeploymentList onViewLogs={setSelectedDeployment} />
      </main>

      {/* deploy modal */}
      {showForm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setShowForm(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="animate-fade-up">
            <DeployModal onClose={() => setShowForm(false)} />
          </div>
        </div>
      )}

      {/* log drawer */}
      <LogDrawer
        deployment={selectedDeployment}
        onClose={() => {
          setTimeout(() => {
            setSelectedDeployment(null)
          }, 300)
        }}
      />
    </div>
  )
}
