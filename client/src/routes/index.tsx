import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { DeployForm } from '#/components/DeployForm'
import { LogDrawer } from '#/components/LogDrawer'
import type { Deployment } from '../types'
import { DeploymentList } from '#/components/DeploymentList'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const [selectedDeployment, setSelectedDeployment] =
    useState<Deployment | null>(null)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Depipe</h1>
            <p className="text-xs text-gray-400">Deployment Pipeline</p>
          </div>
        </div>
      </header>

      {/* main */}
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* deploy form */}
        <DeployForm />

        {/* deployments */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            Deployments
          </h2>
          <DeploymentList onViewLogs={setSelectedDeployment} />
        </div>
      </main>

      {/* log drawer */}
      <LogDrawer
        deployment={selectedDeployment}
        onClose={() => setSelectedDeployment(null)}
      />
    </div>
  )
}
