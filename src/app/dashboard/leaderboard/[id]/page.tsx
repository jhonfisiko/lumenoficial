import { Suspense } from 'react'
import LeaderboardClient from './LeaderboardClient'

export const metadata = {
  title: 'Tabla de Liderazgo | PRE ICFES LUMEN',
  description: 'Ranking y posiciones en vivo del simulacro.',
}

async function LeaderboardContent({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <LeaderboardClient simulationId={id} />
}

export default function SimulationLeaderboardPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 text-xs font-semibold space-y-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p>Cargando posiciones de la competencia...</p>
        </div>
      }
    >
      <LeaderboardContent params={params} />
    </Suspense>
  )
}