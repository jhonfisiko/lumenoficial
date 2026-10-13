'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface LeaderboardEntry {
  id: string
  score: number
  finished_at: string
  profiles: {
    full_name: string
    institutions: {
      name: string
    } | null
  } | null
}

interface SimulationInfo {
  title: string
  description: string | null
}

export default function SimulationLeaderboardPage({ params }: { params: Promise<{ id: string }> }) {
  // Desempaquetar los parámetros dinámicos de forma segura
  const resolvedParams = use(params)
  const simulationId = resolvedParams?.id

  const [simulation, setSimulation] = useState<SimulationInfo | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)

  const supabase = createClient()

  useEffect(() => {
    let isMounted = true

    if (!simulationId) return

    const fetchLeaderboardData = async () => {
      setLoading(true)

      // 1. Verificar si el usuario actual es Administrador o Docente
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (isMounted && profile && (profile.role === 'admin' || profile.role === 'docente' || profile.role === 'teacher')) {
          setIsAdmin(true)
        }
      }

      // 2. Obtener información general del simulacro
      const { data: simData } = await supabase
        .from('simulations')
        .select('title, description')
        .eq('id', simulationId)
        .single()

      if (simData && isMounted) {
        setSimulation(simData)
      }

      // 3. Obtener los mejores puntajes registrados
      const { data: attemptsData, error } = await supabase
        .from('student_attempts')
        .select(`
          id,
          score,
          finished_at,
          profiles (
            full_name,
            institutions (
              name
            )
          )
        `)
        .eq('simulation_id', simulationId)
        .eq('is_completed', true)
        .order('score', { ascending: false })
        .order('finished_at', { ascending: true })
        .limit(50)

      if (isMounted) {
        if (!error && attemptsData) {
          setLeaderboard(attemptsData as unknown as LeaderboardEntry[])
        }
        setLoading(false)
      }
    }

    fetchLeaderboardData()

    return () => {
      isMounted = false
    }
  }, [supabase, simulationId])

  // Función para reiniciar/limpiar el ranking a cero
  const handleResetLeaderboard = async () => {
    if (!simulationId) return

    const confirmed = window.confirm(
      `⚠️ ¿Estás seguro de REINICIAR EL RANKING de "${simulation?.title}"?\n\nEsta acción borrará todos los puntajes registrados de este examen para iniciar una nueva competencia.`
    )

    if (!confirmed) return

    setIsDeleting(true)

    const { error } = await supabase
      .from('student_attempts')
      .delete()
      .eq('simulation_id', simulationId)

    setIsDeleting(false)

    if (error) {
      alert(`Error al intentar reiniciar el ranking: ${error.message}`)
    } else {
      alert('✅ El ranking se ha limpiado correctamente. El tablero está listo para una nueva prueba.')
      setLeaderboard([])
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 text-xs font-semibold space-y-3">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p>Cargando posiciones de la competencia en vivo...</p>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* Resplandor Neón */}
      <div className="absolute top-0 right-1/3 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto space-y-8">
        
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 font-black text-[10px] rounded-lg uppercase tracking-wider">
                ★ Tipo Tesoro - En Vivo
              </span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1">
              Tabla de Liderazgo: {simulation?.title || 'Simulacro'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Top 50 mejores puntajes registrados en tiempo real
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {/* Botón Administrador: Limpiar Ranking */}
            {isAdmin && (
              <button
                onClick={handleResetLeaderboard}
                disabled={isDeleting || leaderboard.length === 0}
                className="px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-400 font-bold text-xs uppercase rounded-xl transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Reiniciar el tablero a cero para un nuevo evento"
              >
                {isDeleting ? 'Borrando...' : '🧹 Limpiar Ranking'}
              </button>
            )}

            <Link
              href="/dashboard"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs uppercase rounded-xl transition-all"
            >
              ← Volver al Panel
            </Link>
          </div>
        </div>

        {/* Contenido de la Tabla de Posiciones */}
        {leaderboard.length === 0 ? (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 text-center space-y-3 backdrop-blur-xl">
            <p className="text-amber-400 font-bold text-sm">🏆 ¡El Ranking está limpio y listo!</p>
            <p className="text-slate-400 text-xs max-w-md mx-auto">
              Aún no hay ningún estudiante registrado en esta prueba. Sé el primero en ingresar.
            </p>
            <Link
              href={`/dashboard/simulations/${simulationId}`}
              className="inline-block px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/20"
            >
              Iniciar Simulacro Ahora ➔
            </Link>
          </div>
        ) : (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-4">
            <div className="grid grid-cols-12 text-[10px] font-black uppercase text-slate-500 tracking-wider pb-3 border-b border-slate-800 px-4">
              <span className="col-span-2 md:col-span-1">Posición</span>
              <span className="col-span-6 md:col-span-6">Estudiante / Colegio</span>
              <span className="col-span-4 md:col-span-3 text-right">Puntaje Global</span>
              <span className="hidden md:block col-span-2 text-right">Fecha</span>
            </div>

            <div className="space-y-2">
              {leaderboard.map((item, index) => {
                const rank = index + 1
                const isTop3 = rank <= 3
                const profileName = item.profiles?.full_name || 'Estudiante Anónimo'
                const institutionName = item.profiles?.institutions?.name || 'Colegio General'

                let rankBadge = `${rank}º`
                let rankStyle = 'bg-slate-950 text-slate-400 border-slate-800'

                if (rank === 1) {
                  rankBadge = '🥇 1º'
                  rankStyle = 'bg-amber-500/10 text-amber-400 border-amber-500/30 font-black'
                } else if (rank === 2) {
                  rankBadge = '🥈 2º'
                  rankStyle = 'bg-slate-300/10 text-slate-300 border-slate-400/30 font-black'
                } else if (rank === 3) {
                  rankBadge = '🥉 3º'
                  rankStyle = 'bg-amber-700/10 text-amber-600 border-amber-700/30 font-black'
                }

                return (
                  <div
                    key={item.id}
                    className={`grid grid-cols-12 items-center p-4 rounded-2xl border transition-all ${
                      isTop3
                        ? 'bg-slate-950/90 border-slate-800 shadow-md'
                        : 'bg-slate-950/40 border-slate-900 text-slate-300'
                    }`}
                  >
                    <div className="col-span-2 md:col-span-1">
                      <span className={`px-2.5 py-1 rounded-lg text-xs border ${rankStyle}`}>
                        {rankBadge}
                      </span>
                    </div>

                    <div className="col-span-6 md:col-span-6 space-y-0.5">
                      <p className="text-xs font-bold text-white truncate">{profileName}</p>
                      <p className="text-[10px] text-slate-500 truncate">{institutionName}</p>
                    </div>

                    <div className="col-span-4 md:col-span-3 text-right">
                      <span className="text-base font-black text-amber-400">{item.score}</span>
                      <span className="text-[10px] text-slate-500 font-bold"> / 500</span>
                    </div>

                    <div className="hidden md:block col-span-2 text-right text-[10px] text-slate-500 font-semibold">
                      {new Date(item.finished_at).toLocaleDateString()}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}