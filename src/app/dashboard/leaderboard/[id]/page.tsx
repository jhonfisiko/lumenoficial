import { Suspense } from 'react'
import LeaderboardClient from './LeaderboardClient'

export async function generateStaticParams() {
  return []
}

export default async function SimulationLeaderboardPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 text-xs font-semibold space-y-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p>Cargando posiciones de la competencia...</p>
        </div>
      }
    >
      <LeaderboardClient simulationId={id} />
    </Suspense>
  )
}